/**
 * Glue between the alert center and Stream Deck: switches decks into the
 * bundled alert profile and back again.
 */
import streamDeck from "@elgato/streamdeck";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { AlertCenter } from "./alerts.js";
import { GitHubWatcher } from "./github.js";
import { Pomodoro } from "./pomodoro.js";
import type { ExplainState } from "./render/scene.js";
import { openExternal, pluginDir } from "./system.js";

export const ALERT_ACTION = "com.lazydeck.plugin.alert";

/** Bundled alert profile per device type (names as in the manifest). */
export const ALERT_PROFILE: Record<number, string> = {
	0: "Lazy Deck Alarm",
	1: "Lazy Deck Mini Alarm",
	2: "Lazy Deck XL Alarm",
	3: "Lazy Deck Mobile Alarm",
	7: "Lazy Deck Plus Alarm",
	9: "Lazy Deck Neo Alarm",
	10: "Lazy Deck Studio Alarm",
	11: "Lazy Deck Virtual Alarm",
	12: "Lazy Deck Galleon Alarm",
	13: "Lazy Deck Plus XL Alarm",
};

export const center = new AlertCenter();

export const github = new GitHubWatcher(center, (message) => streamDeck.logger.info(message));

export const pomodoro = new Pomodoro();

/** Shared state for the Erklären key while Claude thinks. */
export const explainState: { value: ExplainState } = { value: "idle" };

const alerting = new Set<string>();

function showing(deviceId: string): boolean {
	return [...streamDeck.actions].some((unit) => unit.manifestId === ALERT_ACTION && unit.device.id === deviceId);
}

center.on("takeover", async () => {
	explainState.value = "idle";
	for (const device of streamDeck.devices) {
		const profile = ALERT_PROFILE[device.type as number];
		if (!profile || !device.isConnected || alerting.has(device.id)) {
			continue;
		}
		alerting.add(device.id);
		streamDeck.logger.info(`alert: ${device.name} → ${profile}`);
		await streamDeck.profiles.switchToProfile(device.id, profile).catch((error: Error) => {
			alerting.delete(device.id);
			streamDeck.logger.warn(`alert: could not switch ${device.name}: ${error.message}`);
		});
		// Stream Deck does not say whether the profile exists; check it arrived.
		setTimeout(() => {
			if (!showing(device.id) && alerting.delete(device.id)) {
				streamDeck.logger.warn(`alert: ${profile} did not appear on ${device.name}; offering to import it`);
				offerImport(profile);
			}
		}, 2500).unref?.();
	}
});

center.on("release", async () => {
	const devices = [...alerting];
	alerting.clear();
	for (const id of devices) {
		// Without a name Stream Deck returns to the profile shown before.
		await streamDeck.profiles.switchToProfile(id).catch((error: Error) => streamDeck.logger.warn(`alert: could not switch back: ${error.message}`));
	}
});

const offered = new Set<string>();

/**
 * Profiles bundled with a linked (not installed) plugin are not imported by
 * Stream Deck. Opening the file asks the user to import it; once per run.
 */
function offerImport(profile: string): void {
	const file = join(pluginDir(), `${profile}.streamDeckProfile`);
	if (offered.has(profile) || !existsSync(file)) {
		return;
	}
	offered.add(profile);
	openExternal(file);
}

/** A deck left the alert profile by hand; do not switch it "back" later. */
export function alertLeft(deviceId: string): void {
	setTimeout(() => {
		if (!showing(deviceId)) {
			alerting.delete(deviceId);
		}
	}, 250).unref?.();
}
