/** Everyday keys: music, volume, Discord, Steam. Nothing to set up. */
import streamDeck, {
	action,
	SingletonAction,
	type DidReceiveSettingsEvent,
	type KeyAction,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { gameKey, logoKey, micKey, musicKey, steamKey } from "../render/apps.js";
import { logoBadge, overlay } from "../render/logos.js";
import { controllerKey, earsKey, headphonesKey, listenKey, signKey, vinylKey } from "../render/scenes.js";
import { headerImage, installedGames, steamRoot, type Game } from "../steam.js";
import { appAudio, audio, isWindows, nowPlaying, openExternal, pressMediaKey, type AudioState, type MediaKey } from "../system.js";
import { Ticker } from "./ticker.js";

// ---------------------------------------------------------------- Musik

type MediaSettings = { key?: MediaKey };

const MEDIA_LABEL: Record<MediaKey, [string, string]> = {
	playpause: ["playpause", "Play / Pause"],
	next: ["next", "Weiter"],
	previous: ["previous", "Zurück"],
	volumeUp: ["volumeUp", "Lauter"],
	volumeDown: ["volumeDown", "Leiser"],
	mute: ["mute", "Ton aus"],
};

const mediaKeyOf = (settings: MediaSettings): MediaKey => (settings.key && settings.key in MEDIA_LABEL ? settings.key : "playpause");

/** Musik: media keys for Spotify, YouTube, the browser and most players. */
@action({ UUID: "com.lazydeck.plugin.media" })
export class MediaAction extends SingletonAction<MediaSettings> {
	#speaker: AudioState | undefined;
	#ticker = new Ticker(250, (key: KeyAction<MediaSettings>, t) => {
		const which = mediaKeyOf(this.#settings.get(key.id) ?? {});
		if (which === "playpause") {
			return musicKey(t, this.#playing ? "Play / Pause" : "Play", this.#playing);
		}
		const level = this.#speaker?.ok ? this.#speaker.level : undefined;
		const muted = this.#speaker?.ok ? this.#speaker.muted : false;
		if (which === "mute") {
			return muted
				? signKey({ title: "Lautstärke", value: "Ton aus", sub: "drücken = an", tone: "coral", t, phase: 3.5 })
				: signKey({ title: "Lautstärke", value: level === undefined ? "…" : `${level} %`, bar: level === undefined ? undefined : level / 100, t, phase: 3.5 });
		}
		if (which === "volumeUp" || which === "volumeDown") {
			return listenKey({ level, muted, dir: which === "volumeUp" ? "up" : "down", label: `${MEDIA_LABEL[which][1]}${level !== undefined ? ` · ${level} %` : ""}`, t });
		}
		return vinylKey(which, t);
	});
	#settings = new Map<string, MediaSettings>();
	#poll: NodeJS.Timeout | undefined;
	/** Whether something plays: the play key's sloth has its eyes open then. */
	#playing = false;

	async #readPlaying(): Promise<void> {
		if (![...this.#settings.values()].some((s) => mediaKeyOf(s) === "playpause")) return;
		const np = await nowPlaying();
		const playing = !!np?.ok && np.playing && !!np.title;
		if (playing !== this.#playing) {
			this.#playing = playing;
			this.#ticker.invalidate();
		}
	}

	async #readSpeaker(): Promise<void> {
		const state = await audio.state(0);
		if (state?.ok && (state.level !== this.#speaker?.level || state.muted !== this.#speaker?.muted)) {
			this.#speaker = state;
			this.#ticker.invalidate();
		}
	}

	override onWillAppear(ev: WillAppearEvent<MediaSettings>): void {
		this.#settings.set(ev.action.id, ev.payload.settings);
		if (ev.action.isKey()) {
			this.#ticker.add(ev.action);
		}
		if (!this.#poll && isWindows) {
			void this.#readSpeaker();
			void this.#readPlaying();
			this.#poll = setInterval(() => {
				void this.#readSpeaker();
				void this.#readPlaying();
			}, 3000);
		}
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<MediaSettings>): void {
		this.#settings.set(ev.action.id, ev.payload.settings);
		this.#ticker.invalidate();
	}

	override onWillDisappear(ev: WillDisappearEvent<MediaSettings>): void {
		this.#settings.delete(ev.action.id);
		this.#ticker.remove(ev.action.id);
		if (this.#settings.size === 0 && this.#poll) {
			clearInterval(this.#poll);
			this.#poll = undefined;
		}
	}

	override async onKeyDown(ev: KeyDownEvent<MediaSettings>): Promise<void> {
		const which = mediaKeyOf(ev.payload.settings);
		// Volume goes straight to the speakers on Windows, so the key can show the level.
		if (isWindows && (which === "volumeUp" || which === "volumeDown" || which === "mute")) {
			const state = which === "mute" ? await audio.toggleMute(0) : await audio.step(0, which === "volumeUp" ? 0.06 : -0.06);
			if (state?.ok) {
				this.#speaker = state;
				this.#ticker.invalidate();
				return;
			}
		}
		if (!pressMediaKey(which)) {
			await ev.action.showAlert();
		}
	}
}

// ---------------------------------------------------------------- Discord

type DiscordSettings = { mode?: "mute" | "deafen" | "open" };

/**
 * Discord: mute, deafen or open. Mutes Discord's own audio session in
 * Windows (its microphone; for deafen also its sound), so it works with
 * whatever microphone is picked in Discord and needs no focus or shortcut.
 * Discord's own mute icon stays off; the key shows the real state.
 */
@action({ UUID: "com.lazydeck.plugin.discord" })
export class DiscordAction extends SingletonAction<DiscordSettings> {
	async #paint(action: any, settings: DiscordSettings, off?: boolean): Promise<void> {
		if (!action.isKey()) {
			return;
		}
		const mode = settings.mode ?? "mute";
		if (mode !== "open" && off === undefined) {
			off = (await appAudio.state("Discord", mode === "mute" ? 1 : 0))?.muted ?? false;
		}
		const image =
			mode === "open"
				? logoKey("discord", "Discord")
				: mode === "mute"
					? overlay(micKey(off, 1, off ? "Discord stumm" : "Discord Mikro"), logoBadge("discord"))
					: off
						? overlay(earsKey("Discord taub", 1), logoBadge("discord", "left"))
						: overlay(headphonesKey(false, "Discord Ton", 1), logoBadge("discord"));
		return action.setImage(image);
	}

	override async onWillAppear(ev: WillAppearEvent<DiscordSettings>): Promise<void> {
		await this.#paint(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<DiscordSettings>): Promise<void> {
		await this.#paint(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<DiscordSettings>): Promise<void> {
		const mode = ev.payload.settings.mode ?? "mute";
		if (mode === "open") {
			openExternal("discord://-/channels/@me");
			return;
		}
		const result = isWindows ? await appAudio.toggle("Discord", mode === "mute" ? 1 : 0, mode === "deafen") : undefined;
		streamDeck.logger.info(`discord ${mode}: ${JSON.stringify(result)}`);
		if (!result?.ok || !result.found) {
			// Discord is not running or has no microphone/sound open right now.
			await ev.action.showAlert();
			return;
		}
		await this.#paint(ev.action, ev.payload.settings, result.muted);
	}
}

// ---------------------------------------------------------------- Steam

type SteamSettings = { mode?: "last" | "library" | "friends" | "bigpicture" | "store" | "downloads" };

const STEAM_PAGES = {
	library: ["steam://open/games", "controller", "Bibliothek"],
	friends: ["steam://open/friends", "friends", "Freunde"],
	bigpicture: ["steam://open/bigpicture", "tv", "Big Picture"],
	store: ["steam://store", "cart", "Shop"],
	downloads: ["steam://open/downloads", "download", "Downloads"],
} as const;

/** Steam: start the game you played last, or open library, friends, Big Picture. */
@action({ UUID: "com.lazydeck.plugin.steam" })
export class SteamAction extends SingletonAction<SteamSettings> {
	#last: { game?: Game; image?: string; at: number } = { at: 0 };

	async #lastGame(): Promise<{ game?: Game; image?: string }> {
		if (Date.now() - this.#last.at < 60_000) {
			return this.#last;
		}
		const root = await steamRoot();
		const game = root ? (await installedGames(root))[0] : undefined;
		const image = root && game ? await headerImage(root, game.appId) : undefined;
		this.#last = { game, image, at: Date.now() };
		streamDeck.logger.info(`steam: ${root ?? "not found"}, last game ${game?.name ?? "none"}`);
		return this.#last;
	}

	async #paint(action: any, settings: SteamSettings): Promise<void> {
		if (!action.isKey()) {
			return;
		}
		const mode = settings.mode ?? "last";
		if (mode === "last") {
			const { game, image } = await this.#lastGame();
			await action.setImage(game ? controllerKey(game.name, 1) : gameKey(undefined, image));
			return;
		}
		const [, icon, label] = STEAM_PAGES[mode];
		await action.setImage(steamKey(icon, label));
	}

	override async onWillAppear(ev: WillAppearEvent<SteamSettings>): Promise<void> {
		await this.#paint(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SteamSettings>): Promise<void> {
		await this.#paint(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<SteamSettings>): Promise<void> {
		const mode = ev.payload.settings.mode ?? "last";
		if (mode === "last") {
			this.#last.at = 0;
			const { game } = await this.#lastGame();
			if (!game) {
				await ev.action.showAlert();
				return;
			}
			openExternal(`steam://rungameid/${game.appId}`);
			return;
		}
		openExternal(STEAM_PAGES[mode][0]);
	}
}
