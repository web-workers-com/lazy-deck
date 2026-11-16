/** Second round of everyday keys: microphone, now playing, system, focus timer, Windows, GitHub. */
import streamDeck, {
	action,
	SingletonAction,
	type DidReceiveSettingsEvent,
	type KeyAction,
	type KeyDownEvent,
	type KeyUpEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { githubKey, nowPlayingKey, pomodoroKey, statsKey } from "../render/apps.js";
import { logoBadge, logoForApp, overlay } from "../render/logos.js";
import { signKey } from "../render/scenes.js";
import { github, pomodoro } from "../runtime.js";
import { load } from "../stats.js";
import { audio, isMac, isWindows, nowPlaying, openExternal, pressMediaKey, ps, type NowPlaying } from "../system.js";
import { Ticker } from "./ticker.js";
import { tr } from "../i18n.js";

/** Runs `fn` every `ms` while at least one key wants it. */
class Poller {
	#timer: NodeJS.Timeout | undefined;
	#users = new Set<string>();
	constructor(
		private readonly ms: number,
		private readonly fn: () => Promise<void> | void,
	) {}
	add(id: string): void {
		this.#users.add(id);
		if (!this.#timer) {
			void this.fn();
			this.#timer = setInterval(() => void this.fn(), this.ms);
		}
	}
	remove(id: string): void {
		this.#users.delete(id);
		if (this.#users.size === 0 && this.#timer) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
	}
}

// ---------------------------------------------------------------- Mikrofon

/** The system microphone, for every app at once: Discord, Teams, Zoom, OBS. */
@action({ UUID: "com.lazydeck.plugin.mic" })
export class MicAction extends SingletonAction {
	#muted: boolean | undefined;
	#ticker = new Ticker(250, (_key, t) =>
		this.#muted === undefined
			? signKey({ title: tr("Mikro"), value: "…", t, phase: 2.1 })
			: this.#muted
				? signKey({ title: tr("Mikro"), value: tr("stumm"), sub: tr("keiner hört dich"), tone: "coral", t, phase: 2.1 })
				: signKey({ title: tr("Mikro"), value: tr("an"), sub: tr("du bist live"), tone: "honey", live: true, t, phase: 2.1 }),

	);
	#poll = new Poller(2000, async () => {
		const state = await audio.state(1);
		if (state?.ok && state.muted !== this.#muted) {
			this.#muted = state.muted;
			this.#ticker.invalidate();
		}
	});

	override onWillAppear(ev: WillAppearEvent): void {
		if (ev.action.isKey()) this.#ticker.add(ev.action);
		this.#poll.add(ev.action.id);
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.#ticker.remove(ev.action.id);
		this.#poll.remove(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const state = await audio.toggleMute(1);
		if (!state?.ok) {
			await ev.action.showAlert();
			return;
		}
		this.#muted = state.muted;
		this.#ticker.invalidate();
	}
}

// ---------------------------------------------------------------- Jetzt läuft

/** What is playing right now, with cover. Press: play/pause. */
@action({ UUID: "com.lazydeck.plugin.nowplaying" })
export class NowPlayingAction extends SingletonAction {
	#np: NowPlaying | undefined;
	#ticker = new Ticker(250, (_key, t) => {
		const image = nowPlayingKey(this.#np ? { ...this.#np, artist: this.#np.artist ?? undefined } : undefined, t);
		const logo = this.#np?.title ? logoForApp(this.#np.app) : undefined;
		return logo ? overlay(image, logoBadge(logo)) : image;
	});
	#poll = new Poller(2500, async () => {
		const np = await nowPlaying();
		if (np?.ok) {
			this.#np = np;
			this.#ticker.tick();
		}
	});

	override onWillAppear(ev: WillAppearEvent): void {
		if (ev.action.isKey()) this.#ticker.add(ev.action);
		this.#poll.add(ev.action.id);
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.#ticker.remove(ev.action.id);
		this.#poll.remove(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!pressMediaKey("playpause")) {
			await ev.action.showAlert();
			return;
		}
		if (this.#np) {
			this.#np = { ...this.#np, playing: !this.#np.playing };
			this.#ticker.tick();
		}
	}
}

// ---------------------------------------------------------------- System

/** CPU and memory. Press: Task-Manager / Aktivitätsanzeige. */
@action({ UUID: "com.lazydeck.plugin.system" })
export class SystemAction extends SingletonAction {
	#load = load();
	#ticker = new Ticker(400, (_key, t) => statsKey(this.#load.cpu, this.#load.ram, t));
	#poll = new Poller(2000, () => {
		this.#load = load();
	});

	override onWillAppear(ev: WillAppearEvent): void {
		if (ev.action.isKey()) this.#ticker.add(ev.action);
		this.#poll.add(ev.action.id);
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.#ticker.remove(ev.action.id);
		this.#poll.remove(ev.action.id);
	}

	override onKeyDown(): void {
		if (isWindows) ps.run("Start-Process taskmgr");
		else if (isMac) openExternal("/System/Applications/Utilities/Activity Monitor.app");
	}
}

// ---------------------------------------------------------------- Pomodoro

/** 25 minutes focus, 5 minutes break. Press: start/pause. Hold: reset. */
@action({ UUID: "com.lazydeck.plugin.pomodoro" })
export class PomodoroAction extends SingletonAction {
	#down = new Map<string, number>();
	#ticker = new Ticker(500, () =>
		pomodoroKey({
			phase: pomodoro.phase,
			left: pomodoro.left(),
			progress: pomodoro.progress(),
			paused: pomodoro.pausedLeft !== undefined,
			rounds: pomodoro.rounds,
		}),
	);

	override onWillAppear(ev: WillAppearEvent): void {
		if (ev.action.isKey()) this.#ticker.add(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent): void {
		this.#ticker.remove(ev.action.id);
	}

	override onKeyDown(ev: KeyDownEvent): void {
		this.#down.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent): Promise<void> {
		const held = Date.now() - (this.#down.get(ev.action.id) ?? Date.now());
		if (held > 700) {
			pomodoro.reset();
			await ev.action.showOk();
		} else {
			pomodoro.press();
		}
		this.#ticker.invalidate();
	}
}

// ---------------------------------------------------------------- GitHub

type GitHubSettings = { mode?: "notifications" | "reviews" };

/** Unread GitHub notifications or reviews waiting, via the gh CLI. */
@action({ UUID: "com.lazydeck.plugin.github" })
export class GitHubAction extends SingletonAction<GitHubSettings> {
	#settings = new Map<string, GitHubSettings>();
	#ticker = new Ticker(1000, (key: KeyAction<any>) => {
		const mode = this.#settings.get(key.id)?.mode ?? "notifications";
		const s = github.state;
		const count = mode === "notifications" ? s.notifications : s.reviews?.length;
		return overlay(githubKey(mode, count, s.available || s.checkedAt === 0), logoBadge("github", "left"));
	});

	constructor() {
		super();
		github.onChange(() => this.#ticker.invalidate());
	}

	override onWillAppear(ev: WillAppearEvent<GitHubSettings>): void {
		this.#settings.set(ev.action.id, ev.payload.settings);
		if (ev.action.isKey()) this.#ticker.add(ev.action);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<GitHubSettings>): void {
		this.#settings.set(ev.action.id, ev.payload.settings);
		this.#ticker.invalidate();
	}

	override onWillDisappear(ev: WillDisappearEvent<GitHubSettings>): void {
		this.#settings.delete(ev.action.id);
		this.#ticker.remove(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<GitHubSettings>): Promise<void> {
		const mode = ev.payload.settings.mode ?? "notifications";
		openExternal(mode === "notifications" ? "https://github.com/notifications" : "https://github.com/pulls/review-requested");
		void github.poll();
		streamDeck.logger.info(`github key ${mode}`);
	}
}
