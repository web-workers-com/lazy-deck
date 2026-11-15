/** The sloth key, the test keys and the full-deck alert keys. */
import streamDeck, {
	action,
	SingletonAction,
	type DidReceiveSettingsEvent,
	type KeyAction,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import type { Level } from "../alerts.js";
import { explain } from "../explain.js";
import { slothKey, testKey } from "../render/keys.js";
import { alertKey, alertScene, type Item } from "../render/scene.js";
import { roleAt } from "../roles.js";
import { alertLeft, center, explainState } from "../runtime.js";
import { openExternal } from "../system.js";
import { Ticker } from "./ticker.js";

/** Faultier: sleeps while all is calm, wakes and pulses when something waits. */
@action({ UUID: "com.lazydeck.plugin.sloth" })
export class SlothAction extends SingletonAction {
	#ticker = new Ticker(250, (_key, t) => slothKey({ alert: center.current, t }));

	constructor() {
		super();
		center.on("change", () => this.#ticker.invalidate());
	}

	override onWillAppear(ev: WillAppearEvent): void {
		if (ev.action.isKey()) {
			this.#ticker.add(ev.action);
		}
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.#ticker.remove(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (center.current) {
			center.takeover();
		} else {
			// Nothing waiting: show what an alert looks like.
			await ev.action.showOk();
			center.raise(
				{ level: "wait", title: "Hallo!", source: "Lazy Deck", detail: "So meldet sich Sam, wenn etwas auf dich wartet. Ansehen, Später oder einfach irgendeine Taste." },
				{ immediate: true },
			);
		}
	}
}

type TestSettings = { level?: Level };

/** Alarm testen: raises a sample alert right away. */
@action({ UUID: "com.lazydeck.plugin.test" })
export class TestAction extends SingletonAction<TestSettings> {
	override async onWillAppear(ev: WillAppearEvent<TestSettings>): Promise<void> {
		if (ev.action.isKey()) {
			await ev.action.setImage(testKey(ev.payload.settings.level === "error" ? "error" : "wait"));
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<TestSettings>): Promise<void> {
		if (ev.action.isKey()) {
			await ev.action.setImage(testKey(ev.payload.settings.level === "error" ? "error" : "wait"));
		}
	}

	override onKeyDown(ev: KeyDownEvent<TestSettings>): void {
		const error = ev.payload.settings.level === "error";
		// A test replaces whatever is showing, errors included.
		center.resolve();
		center.raise(
			error
				? {
						level: "error",
						title: "Fehler 500",
						source: "Deploy · prod",
						detail: "TypeError: Cannot read properties of undefined (reading 'user') at session.ts:42",
					}
				: { level: "wait", title: "Review wartet", source: "GitHub · PR #42", url: "https://github.com/notifications" },
			{ immediate: true },
		);
	}
}

/**
 * One key of the full-deck alert. Every key of the bundled alarm profiles is
 * this action; its place on the grid decides what it shows and does.
 */
@action({ UUID: "com.lazydeck.plugin.alert" })
export class AlertAction extends SingletonAction {
	#scenes = new Map<string, { at: number; items: Item[] }>();
	#ticker = new Ticker(200, (key: KeyAction<any>, t) => {
		const at = key.coordinates;
		if (!at) {
			return undefined;
		}
		const { columns, rows } = key.device.size;
		const id = `${key.device.id}:${columns}x${rows}`;
		// One scene per device and frame, shared by all its keys.
		let scene = this.#scenes.get(id);
		if (!scene || scene.at !== t) {
			scene = { at: t, items: alertScene({ columns, rows, alert: center.current, t, explain: explainState.value }) };
			this.#scenes.set(id, scene);
		}
		return alertKey(scene.items, at.column, at.row);
	});

	constructor() {
		super();
		center.on("change", () => this.#ticker.invalidate());
	}

	override onWillAppear(ev: WillAppearEvent): void {
		if (ev.action.isKey()) {
			this.#ticker.add(ev.action);
		}
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.#ticker.remove(ev.action.id);
		alertLeft(ev.action.device.id);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const at = ev.action.coordinates;
		const { columns, rows } = ev.action.device.size;
		const role = at ? roleAt(columns, rows, at.column, at.row) : "picture";
		const alert = center.current;
		streamDeck.logger.info(`alert key ${role}`);

		switch (role) {
			case "view":
				if (alert?.url) {
					openExternal(alert.url);
				}
				center.resolve();
				return;
			case "snooze":
				center.snooze();
				return;
			case "explain": {
				if (!alert || explainState.value === "busy") {
					return;
				}
				explainState.value = "busy";
				this.#ticker.invalidate();
				const ok = await explain(alert).catch(() => false);
				explainState.value = ok ? "done" : "failed";
				this.#ticker.invalidate();
				return;
			}
			default:
				center.back();
		}
	}
}
