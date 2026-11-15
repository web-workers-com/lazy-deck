/**
 * Everyday keys for everyone: switch the sound output, set one app's volume
 * or microphone, screen brightness, radio, stay awake, a sleep timer and a
 * word from the sloth when a Steam download is done. Nothing to set up.
 */
import streamDeck, {
	action,
	SingletonAction,
	type DialAction,
	type DialDownEvent,
	type DialRotateEvent,
	type DidReceiveSettingsEvent,
	type KeyAction,
	type KeyDownEvent,
	type KeyUpEvent,
	type SendToPluginEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";

import { AUDIO_APPS, STATIONS, type AudioApp } from "../catalog.js";
import { micKey } from "../render/apps.js";
import { logoBadge, overlay } from "../render/logos.js";
import { coffeeKey, hammockKey, knobKey, moonKey, radioKey, signKey } from "../render/scenes.js";
import { center } from "../runtime.js";
import { downloads, steamRoot, type Download } from "../steam.js";
import {
	appAudio,
	audio,
	brightness,
	devices,
	isWindows,
	openExternal,
	playRadio,
	powerOff,
	stayAwake,
	type AppAudioState,
	type AudioDevice,
	type AudioState,
} from "../system.js";
import { Ticker } from "./ticker.js";

type AnyKey = KeyAction<any>;
const C_HONEY = "#F2B544";
type Settings = Record<string, string | undefined>;

/** Base: keeps settings per key, draws keys with a ticker, feeds dials. */
abstract class EverydayAction extends SingletonAction<Settings> {
	protected settings = new Map<string, Settings>();
	protected dials = new Map<string, DialAction<Settings>>();
	protected abstract ticker: Ticker<any>;

	protected opts(id: string): Settings {
		return this.settings.get(id) ?? {};
	}

	override onWillAppear(ev: WillAppearEvent<Settings>): void | Promise<void> {
		this.settings.set(ev.action.id, ev.payload.settings);
		if (ev.action.isKey()) this.ticker.add(ev.action);
		if (ev.action.isDial()) {
			this.dials.set(ev.action.id, ev.action);
			void ev.action.setFeedbackLayout("$B1");
		}
		return this.changed();
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): void | Promise<void> {
		this.settings.set(ev.action.id, ev.payload.settings);
		return this.changed();
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		this.settings.delete(ev.action.id);
		this.dials.delete(ev.action.id);
		this.ticker.remove(ev.action.id);
	}

	/** Settings or keys changed: read fresh state, repaint. */
	protected async changed(): Promise<void> {
		this.ticker.invalidate();
	}
}

/** Runs `fn` every `ms` while any key wants it. */
class Every {
	#timer: NodeJS.Timeout | undefined;
	constructor(
		private readonly ms: number,
		private readonly fn: () => unknown,
	) {}
	on(): void {
		if (!this.#timer) {
			void this.fn();
			this.#timer = setInterval(() => void this.fn(), this.ms);
		}
	}
	off(): void {
		if (this.#timer) clearInterval(this.#timer);
		this.#timer = undefined;
	}
}

// ---------------------------------------------------------------- Ausgabe

/** Devices nobody listens to directly: loopbacks, virtual cables, mixers. */
const VIRTUAL = /voicemod|loop-?back|virtual|cable|vb-audio|steam streaming|nvidia broadcast|sonar|wave link|voicemeeter/i;

/** A short, friendly name: "2 - LG ULTRAGEAR+ (AMD …)" → "LG ULTRAGEAR+", "Analogue 1/2 (Audient iD4)" → "Audient iD4". */
export function shortDeviceName(name: string): string {
	const match = /^(?:\d+\s*-\s*)?(.*?)\s*(?:\((?:\d+\s*-\s*)?(.*)\))?$/.exec(name.trim());
	const main = (match?.[1] ?? name).trim();
	const inner = (match?.[2] ?? "").trim();
	const generic = /^(lautsprecher|speakers?|kopfh|headphones?|headset|analog|line|digital|realtek|output|ausgang|hdmi|spdif)/i;
	return inner && generic.test(main) ? inner : main || name;
}

/** What kind of device it probably is, for the sign. */
export function deviceKind(name: string): "Kopfhörer" | "Headset" | "Lautsprecher" | "Monitor" | "Interface" {
	if (/headset|hands-?free|freisprech/i.test(name)) return "Headset";
	if (/kopfh|headphone|airpods|buds|wh-|arctis|hyperx|cloud|kraken|astro|g pro|blackshark/i.test(name)) return "Kopfhörer";
	if (/hdmi|display|monitor|lg |ultragear|samsung|dell|benq|aoc|asus|acer|msi|kg\d|amd high definition|nvidia high definition|intel.*display/i.test(name)) return "Monitor";
	if (/audient|focusrite|scarlett|motu|steinberg|presonus|behringer|id4|id14|evo|volt|goxlr|wave:/i.test(name)) return "Interface";
	return "Lautsprecher";
}

/** Sound output: one press switches to the next device (or between two you pick). */
@action({ UUID: "com.lazydeck.plugin.output" })
export class OutputAction extends EverydayAction {
	#list: AudioDevice[] = [];
	#poll = new Every(5000, () => this.read());
	protected ticker = new Ticker(400, (_key: AnyKey, t) => {
		const current = this.#list.find((d) => d.default);
		if (!current) return signKey({ title: "Ton über", value: "…", t, phase: 2.8 });
		return signKey({ title: "Ton über", value: shortDeviceName(current.name), sub: deviceKind(current.name), t, phase: 2.8 });
	});

	async read(): Promise<void> {
		const list = await devices.list(0);
		if (list && JSON.stringify(list) !== JSON.stringify(this.#list)) {
			this.#list = list;
			this.ticker.invalidate();
		}
	}

	protected override async changed(): Promise<void> {
		this.#poll.on();
		await super.changed();
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		super.onWillDisappear(ev);
		if (this.settings.size === 0) this.#poll.off();
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		await this.read();
		const { a, b } = ev.payload.settings;
		const pick = [a, b].filter((id): id is string => !!id && this.#list.some((d) => d.id === id));
		const pool = pick.length >= 2 ? this.#list.filter((d) => pick.includes(d.id)) : this.#list.filter((d) => !VIRTUAL.test(d.name));
		if (pool.length < 2) {
			await ev.action.showAlert();
			return;
		}
		const at = pool.findIndex((d) => d.default);
		const next = pool[(at + 1) % pool.length]!;
		if (!(await devices.setDefault(next.id))) {
			await ev.action.showAlert();
			return;
		}
		streamDeck.logger.info(`output: ${next.name}`);
		this.#list = this.#list.map((d) => ({ ...d, default: d.id === next.id }));
		this.ticker.invalidate();
	}

	/** The settings page asks for the device list to fill its dropdowns. */
	override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, Settings>): Promise<void> {
		const payload = ev.payload as { event?: string } | null;
		if (payload?.event !== "outputs") return;
		await this.read();
		const items = [{ value: "", label: "Automatisch (alle echten Geräte)" }, ...this.#list.map((d) => ({ value: d.id, label: shortDeviceName(d.name) + (VIRTUAL.test(d.name) ? " (virtuell)" : "") }))];
		await streamDeck.ui.sendToPropertyInspector({ event: "outputs", items });
	}
}

// ---------------------------------------------------------------- App-Lautstärke

function appOf(settings: Settings): AudioApp {
	return AUDIO_APPS.find((a) => a.id === settings.app) ?? AUDIO_APPS[0]!;
}

function processesOf(settings: Settings, app = appOf(settings)): string {
	return app.id === "custom" ? (settings.process ?? "").replace(/\.exe$/i, "").replace(/[^\w ,.-]/g, "") : app.processes;
}

/** What to call the app on the key: the game's window title, or the app's name. */
function appLabel(app: AudioApp, state: AppAudioState | undefined, settings: Settings): string {
	if (app.id === "fg" && state?.found && state.name) return state.name.split(/\s[-–|:]\s/)[0]!;
	if (app.id === "custom" && settings.process) return settings.process.replace(/\.exe$/i, "");
	return app.label;
}

type VolumeView = { level?: number; muted?: boolean; found: boolean; name: string };

/** One app's volume (or everything): quieter, louder, mute. On a dial: turn and press. */
@action({ UUID: "com.lazydeck.plugin.appvolume" })
export class AppVolumeAction extends EverydayAction {
	#views = new Map<string, VolumeView>();
	#poll = new Every(2500, () => this.readAll());
	protected ticker = new Ticker(300, (key: AnyKey, t) => {
		const s = this.opts(key.id);
		const app = appOf(s);
		const view = this.#views.get(key.id);
		const mode = s.mode ?? "down";
		const name = view?.name || app.label;
		const label =
			view && !view.found && app.id !== "master"
				? `${name} still`
				: mode === "mute"
					? view?.muted ? `${name} stumm` : `${name} ${view?.level ?? "–"} %`
					: `${mode === "up" ? "Lauter" : "Leiser"} · ${app.logo && view?.level !== undefined ? `${view.level} %` : name}`;
		return knobKey({
			kind: app.id === "master" ? "speaker" : "app",
			mono: app.id === "custom" ? (s.process ?? "?").slice(0, 2) : app.mono,
			logo: app.logo,
			level: view?.found === false ? undefined : view?.level,
			muted: view?.muted,
			dir: mode === "mute" ? undefined : mode === "up" ? "up" : "down",
			label,
			t,
		});
	});

	async read(id: string): Promise<VolumeView> {
		const s = this.opts(id);
		const app = appOf(s);
		let view: VolumeView;
		if (app.id === "master") {
			const st: AudioState | undefined = await audio.state(0);
			view = { level: st?.level, muted: st?.muted, found: !!st?.ok, name: app.label };
		} else {
			const st = await appAudio.state(processesOf(s, app), 0);
			view = { level: st?.level, muted: st?.muted, found: !!st?.found, name: appLabel(app, st, s) };
		}
		this.#views.set(id, view);
		return view;
	}

	async readAll(): Promise<void> {
		if (!isWindows) return;
		for (const id of this.settings.keys()) await this.read(id);
		this.ticker.tick();
		for (const [id, dial] of this.dials) this.feedback(id, dial);
	}

	feedback(id: string, dial: DialAction<Settings>): void {
		const app = appOf(this.opts(id));
		const v = this.#views.get(id);
		void dial.setFeedback({
			title: v?.name || app.label,
			value: !v?.found && app.id !== "master" ? "still" : v?.muted ? "stumm" : `${v?.level ?? 0} %`,
			indicator: { value: v?.muted ? 0 : (v?.level ?? 0) },
		});
	}

	protected override async changed(): Promise<void> {
		this.#poll.on();
		await this.readAll();
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		super.onWillDisappear(ev);
		this.#views.delete(ev.action.id);
		if (this.settings.size === 0) this.#poll.off();
	}

	async apply(id: string, what: "up" | "down" | "mute", steps = 1): Promise<boolean> {
		const s = this.opts(id);
		const app = appOf(s);
		const delta = (what === "up" ? 0.06 : -0.06) * steps;
		if (app.id === "master") {
			const st = what === "mute" ? await audio.toggleMute(0) : await audio.step(0, delta);
			if (!st?.ok) return false;
		} else {
			const processes = processesOf(s, app);
			if (!processes) return false;
			const st = what === "mute" ? await appAudio.toggle(processes, 0) : await appAudio.step(processes, delta);
			if (!st?.found) return false;
		}
		await this.read(id);
		this.ticker.invalidate();
		const dial = this.dials.get(id);
		if (dial) this.feedback(id, dial);
		return true;
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const mode = (ev.payload.settings.mode ?? "down") as "up" | "down" | "mute";
		if (!(await this.apply(ev.action.id, mode))) await ev.action.showAlert();
	}

	override async onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> {
		await this.apply(ev.action.id, ev.payload.ticks > 0 ? "up" : "down", Math.abs(ev.payload.ticks) * 0.5);
	}

	override async onDialDown(ev: DialDownEvent<Settings>): Promise<void> {
		await this.apply(ev.action.id, "mute");
	}
}

// ---------------------------------------------------------------- App-Mikro

/** One app's microphone: Teams, Zoom, Discord, the browser (Meet) … muted in Windows. */
@action({ UUID: "com.lazydeck.plugin.appmic" })
export class AppMicAction extends EverydayAction {
	#state = new Map<string, AppAudioState | undefined>();
	#poll = new Every(2500, () => this.readAll());
	protected ticker = new Ticker(250, (key: AnyKey, t) => {
		const s = this.opts(key.id);
		const app = appOf(s);
		const st = this.#state.get(key.id);
		const name = appLabel(app, st, s);
		const badge = app.logo ? logoBadge(app.logo) : "";
		if (st && !st.found) return overlay(micKey(undefined, t, `${name}: aus`), badge);
		return overlay(micKey(st?.muted, t, st?.muted ? `${name} stumm` : `${name} Mikro`), badge);
	});

	async readAll(): Promise<void> {
		if (!isWindows) return;
		for (const id of this.settings.keys()) {
			const s = this.opts(id);
			this.#state.set(id, await appAudio.state(processesOf(s), 1));
		}
		this.ticker.tick();
	}

	protected override async changed(): Promise<void> {
		this.#poll.on();
		await this.readAll();
		this.ticker.invalidate();
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		super.onWillDisappear(ev);
		if (this.settings.size === 0) this.#poll.off();
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const processes = processesOf(ev.payload.settings);
		const st = processes ? await appAudio.toggle(processes, 1) : undefined;
		if (!st?.found) {
			// The app is not running or not recording right now.
			await ev.action.showAlert();
			return;
		}
		this.#state.set(ev.action.id, st);
		this.ticker.invalidate();
	}
}

// ---------------------------------------------------------------- Helligkeit

let screen: { level?: number; at: number; count: number } = { at: 0, count: 0 };

/** Screen brightness for every monitor that allows it. On a dial: turn it. */
@action({ UUID: "com.lazydeck.plugin.brightness" })
export class BrightnessAction extends EverydayAction {
	#busy = false;
	#pending = 0;
	protected ticker = new Ticker(300, (key: AnyKey, t) => {
		const mode = this.opts(key.id).mode === "up" ? "up" : "down";
		const known = screen.count > 0;
		return knobKey({
			kind: "sun",
			level: screen.level,
			dir: mode,
			label: !known && screen.at ? "geht hier nicht" : `${mode === "up" ? "Heller" : "Dunkler"}${screen.level !== undefined ? ` · ${screen.level} %` : ""}`,
			t,
		});
	});

	protected override async changed(): Promise<void> {
		if (Date.now() - screen.at > 60_000) await this.step(0);
		this.ticker.invalidate();
	}

	/** Brightness over DDC is slow; presses that arrive meanwhile add up. */
	async step(delta: number): Promise<boolean> {
		this.#pending += delta;
		if (this.#busy) return true;
		this.#busy = true;
		try {
			do {
				const d = this.#pending;
				this.#pending = 0;
				const r = await brightness(d);
				screen = { level: r?.ok ? r.level : undefined, count: r?.count ?? 0, at: Date.now() };
				this.ticker.invalidate();
				for (const dial of this.dials.values()) {
					void dial.setFeedback({ title: "Helligkeit", value: screen.level !== undefined ? `${screen.level} %` : "–", indicator: { value: screen.level ?? 0 } });
				}
			} while (this.#pending !== 0);
		} finally {
			this.#busy = false;
		}
		return screen.count > 0;
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		if (!(await this.step(ev.payload.settings.mode === "up" ? 10 : -10))) await ev.action.showAlert();
	}

	override async onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> {
		await this.step(ev.payload.ticks * 5);
	}
}

// ---------------------------------------------------------------- Radio

let playing: string | undefined;
const radioKeys = new Set<RadioAction>();

function stationOf(settings: Settings): { id: string; name: string; url: string } {
	const station = STATIONS.find((s) => s.id === settings.station) ?? STATIONS[0]!;
	if (station.id !== "custom") return station;
	const url = (settings.url ?? "").trim();
	return { id: `custom:${url}`, name: (settings.name ?? "").trim() || "Mein Sender", url: /^https?:\/\//i.test(url) ? url : "" };
}

/** Internet radio: one press plays the station, the next stops it. One station at a time. */
@action({ UUID: "com.lazydeck.plugin.radio" })
export class RadioAction extends EverydayAction {
	protected ticker = new Ticker(250, (key: AnyKey, t) => {
		const station = stationOf(this.opts(key.id));
		return radioKey(station.name, playing === station.id, t);
	});

	constructor() {
		super();
		radioKeys.add(this);
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const station = stationOf(ev.payload.settings);
		if (!station.url) {
			await ev.action.showAlert();
			return;
		}
		if (playing === station.id) {
			playRadio(undefined);
			playing = undefined;
		} else {
			playing = playRadio(station.url) ? station.id : undefined;
			streamDeck.logger.info(`radio: ${station.name}`);
		}
		for (const r of radioKeys) r.ticker.invalidate();
	}
}

// ---------------------------------------------------------------- Wach bleiben

let awakeSince: number | undefined;
let awakeUntil: number | undefined;

function formatSpan(ms: number): string {
	const minutes = Math.max(0, Math.round(ms / 60_000));
	return minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h` : `${minutes} min`;
}

/** Keeps the PC and the screen awake: downloads, presentations, a film. */
@action({ UUID: "com.lazydeck.plugin.awake" })
export class AwakeAction extends EverydayAction {
	protected ticker = new Ticker(400, (_key: AnyKey, t) => {
		if (awakeUntil !== undefined && Date.now() >= awakeUntil) this.set(false);
		if (awakeSince === undefined) return coffeeKey(false, "Wach bleiben", t);
		const label = awakeUntil !== undefined ? `wach · noch ${formatSpan(awakeUntil - Date.now())}` : `wach · ${formatSpan(Date.now() - awakeSince)}`;
		return coffeeKey(true, label, t);
	});

	set(on: boolean, hours?: number): void {
		stayAwake(on);
		awakeSince = on ? Date.now() : undefined;
		awakeUntil = on && hours ? Date.now() + hours * 3600_000 : undefined;
		this.ticker.invalidate();
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		if (!isWindows) {
			await ev.action.showAlert();
			return;
		}
		const hours = Number(ev.payload.settings.hours ?? 0) || undefined;
		this.set(awakeSince === undefined, hours);
	}
}

// ---------------------------------------------------------------- Ausschalt-Timer

let offAt: number | undefined;
let offHow: "shutdown" | "sleep" = "shutdown";
let warned = false;
const timerKeys = new Set<SleepTimerAction>();

/** Checks the sleep timer once a second, wherever its key is. */
setInterval(() => {
	if (offAt === undefined) return;
	const left = offAt - Date.now();
	if (left <= 60_000 && !warned) {
		warned = true;
		center.raise(
			{ level: "wait", title: offHow === "shutdown" ? "PC geht gleich aus" : "PC schläft gleich ein", source: "Ausschalt-Timer", detail: "In einer Minute. Taste am Timer gedrückt halten bricht ab." },
			{ immediate: true },
		);
	}
	if (left <= 0) {
		offAt = undefined;
		warned = false;
		streamDeck.logger.info(`sleep timer: ${offHow}`);
		powerOff(offHow);
	}
	for (const k of timerKeys) k.tick();
}, 1000).unref?.();

/** "PC aus in 30 min": press starts it (again: +30 min), hold cancels. */
@action({ UUID: "com.lazydeck.plugin.sleeptimer" })
export class SleepTimerAction extends EverydayAction {
	#down = new Map<string, number>();
	protected ticker = new Ticker(500, (key: AnyKey, t) => {
		const s = this.opts(key.id);
		const minutes = Number(s.minutes ?? 30) || 30;
		const sleep = (s.how ?? "shutdown") === "sleep";
		if (offAt === undefined) return hammockKey(`${sleep ? "Schlaf" : "PC aus"} · ${minutes} min`, t);
		return moonKey(`${sleep ? "schläft" : "aus"} in ${formatSpan(offAt - Date.now())}`, t, { tone: C_HONEY, border: C_HONEY });
	});

	constructor() {
		super();
		timerKeys.add(this);
	}

	tick(): void {
		this.ticker.tick();
	}

	override onKeyDown(ev: KeyDownEvent<Settings>): void {
		this.#down.set(ev.action.id, Date.now());
	}

	override async onKeyUp(ev: KeyUpEvent<Settings>): Promise<void> {
		const held = Date.now() - (this.#down.get(ev.action.id) ?? Date.now());
		const s = ev.payload.settings;
		if (!isWindows) {
			await ev.action.showAlert();
			return;
		}
		if (held > 700) {
			offAt = undefined;
			warned = false;
			await ev.action.showOk();
		} else if (offAt === undefined) {
			offHow = s.how === "sleep" ? "sleep" : "shutdown";
			offAt = Date.now() + (Number(s.minutes ?? 30) || 30) * 60_000;
		} else {
			offAt = Math.min(offAt + 30 * 60_000, Date.now() + 6 * 3600_000);
			warned = false;
		}
		for (const k of timerKeys) k.ticker.invalidate();
	}
}


// ---------------------------------------------------------------- Steam-Downloads

let steamLoads: Download[] = [];
const loading = new Map<string, Download>();
const steamKeys = new Set<SteamDownloadsAction>();

/** Watches Steam's manifests; the sloth speaks up when a big download is done. */
async function watchSteam(): Promise<void> {
	const root = await steamRoot();
	if (!root) return;
	const all = await downloads(root);
	steamLoads = all.filter((d) => d.running && d.total > 0 && d.done < d.total);
	for (const d of steamLoads) loading.set(d.appId, d);
	for (const [appId, before] of loading) {
		const now = all.find((d) => d.appId === appId);
		if (now && !now.running && now.installed) {
			loading.delete(appId);
			// Small patches are not worth a word.
			if (before.total >= 300 * 1024 * 1024) {
				center.raise({ level: "wait", title: `${now.name} ist fertig`, source: "Steam", detail: "Download abgeschlossen. Viel Spaß!", url: `steam://rungameid/${appId}` }, { immediate: true });
			}
		} else if (!now) {
			loading.delete(appId);
		}
	}
	for (const k of steamKeys) k.tick();
}

if (isWindows) {
	setTimeout(() => void watchSteam(), 15_000).unref?.();
	setInterval(() => void watchSteam(), 20_000).unref?.();
}

/** How far Steam is with its downloads. Press opens the download page. */
@action({ UUID: "com.lazydeck.plugin.steamdownloads" })
export class SteamDownloadsAction extends EverydayAction {
	protected ticker = new Ticker(500, (_key: AnyKey, t) => {
		const d = steamLoads[0];
		if (!d) return signKey({ title: "Steam lädt", value: "nichts", sub: "alles aktuell", t, phase: 4.2 });
		const share = d.done / d.total;
		return signKey({ title: d.name, value: `${Math.floor(share * 100)} %`, bar: share, t, phase: 4.2, tone: "leaf" });
	});

	constructor() {
		super();
		steamKeys.add(this);
	}

	tick(): void {
		this.ticker.tick();
	}

	override onKeyDown(): void {
		openExternal("steam://open/downloads");
		void watchSteam();
	}
}

export const EVERYDAY_ACTIONS = [
	new OutputAction(),
	new AppVolumeAction(),
	new AppMicAction(),
	new BrightnessAction(),
	new RadioAction(),
	new AwakeAction(),
	new SleepTimerAction(),
	new SteamDownloadsAction(),
];
