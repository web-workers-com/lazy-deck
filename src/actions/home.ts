/** Everyday keys with live content: clock, weather, internet, WLAN, battery, timers, reminders, coin and dice. */
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
import { randomInt } from "node:crypto";
import { connect } from "node:net";

import { Clockwork, parseWifi, untilFeierabend, untilWeekend, weatherInfo } from "../home.js";
import { batteryKey, clockKey, coinKey, countdownKey, diceKey, netKey, reminderKey, stopwatchKey, timerKey, weatherKey, wifiKey, type WeatherView } from "../render/home.js";
import { center } from "../runtime.js";
import { isMac, isWindows, openExternal, ps, run } from "../system.js";
import { Ticker } from "./ticker.js";
import { tr } from "../i18n.js";

type AnyKey = KeyAction<any>;

/** Base for keys that redraw on a timer and keep their settings at hand. */
abstract class LiveAction<S extends Record<string, any> = Record<string, any>> extends SingletonAction<S> {
	protected settings = new Map<string, S>();
	protected abstract ticker: Ticker<any>;

	protected opts(key: AnyKey): S {
		return (this.settings.get(key.id) ?? {}) as S;
	}

	override onWillAppear(ev: WillAppearEvent<S>): void {
		this.settings.set(ev.action.id, ev.payload.settings);
		if (ev.action.isKey()) this.ticker.add(ev.action);
		this.appeared();
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<S>): void {
		this.settings.set(ev.action.id, ev.payload.settings);
		this.ticker.invalidate();
	}

	override onWillDisappear(ev: WillDisappearEvent<S>): void {
		this.settings.delete(ev.action.id);
		this.ticker.remove(ev.action.id);
	}

	protected appeared(): void {}
}

// ---------------------------------------------------------------- Uhr

@action({ UUID: "com.lazydeck.plugin.clock" })
class ClockAction extends LiveAction {
	protected ticker = new Ticker(1000, () => clockKey(new Date()));
	override onKeyDown(): void {
		if (isWindows) openExternal("ms-clock:");
	}
}

// ---------------------------------------------------------------- Wetter

let weather: WeatherView | undefined;
let weatherAt = 0;
let place: { lat: number; lon: number; city?: string } | undefined;

/**
 * Weather for where this computer is: the location comes from the public IP
 * (ipwho.is), the forecast from Open-Meteo. Neither needs a key.
 */
async function loadWeather(): Promise<void> {
	if (Date.now() - weatherAt < 15 * 60_000) return;
	try {
		if (!place) {
			const r = (await (await fetch("https://ipwho.is/?fields=latitude,longitude,city,success")).json()) as { latitude: number; longitude: number; city?: string; success?: boolean };
			if (r.success === false) throw new Error("no location");
			place = { lat: r.latitude, lon: r.longitude, city: r.city };
		}
		const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code,is_day`;
		const w = (await (await fetch(url)).json()) as { current: { temperature_2m: number; weather_code: number; is_day: number } };
		const info = weatherInfo(w.current.weather_code);
		weather = { temp: w.current.temperature_2m, ...info, place: place.city, day: w.current.is_day === 1 };
		weatherAt = Date.now();
	} catch (error) {
		streamDeck.logger.warn(`weather: ${(error as Error).message}`);
		weatherAt = Date.now() - 13 * 60_000; // try again in two minutes
	}
}

@action({ UUID: "com.lazydeck.plugin.weather" })
class WeatherAction extends LiveAction {
	protected ticker = new Ticker(400, (_k, t) => weatherKey(weather, t));
	#timer: NodeJS.Timeout | undefined;
	protected override appeared(): void {
		if (!this.#timer) {
			void loadWeather();
			this.#timer = setInterval(() => void loadWeather(), 60_000);
		}
	}
	override onKeyDown(): void {
		openExternal(place ? `https://open-meteo.com/en/docs#latitude=${place.lat}&longitude=${place.lon}` : "https://www.wetter.com");
	}
}

// ---------------------------------------------------------------- Internet

let latency: number | null | undefined;
let misses = 0;
let offlineAlert: number | undefined;
let netTimer: NodeJS.Timeout | undefined;

function probe(): Promise<number | null> {
	return new Promise((resolve) => {
		const started = Date.now();
		const socket = connect({ host: "1.1.1.1", port: 443, timeout: 3000 });
		const done = (value: number | null) => {
			socket.destroy();
			resolve(value);
		};
		socket.once("connect", () => done(Date.now() - started));
		socket.once("timeout", () => done(null));
		socket.once("error", () => done(null));
	});
}

async function checkNet(): Promise<void> {
	const ms = await probe();
	if (ms === null) {
		misses += 1;
		// Three misses in a row (30 s) is an outage, not a hiccup.
		if (misses >= 3) {
			latency = null;
			if (offlineAlert === undefined) {
				offlineAlert = center.raise({ level: "error", title: tr("Internet weg"), source: tr("Netzwerk"), detail: tr("Seit 30 Sekunden keine Verbindung ins Internet.") })?.id;
			}
		}
	} else {
		misses = 0;
		latency = ms;
		if (offlineAlert !== undefined) {
			if (center.current?.id === offlineAlert) center.resolve();
			offlineAlert = undefined;
		}
	}
}

@action({ UUID: "com.lazydeck.plugin.internet" })
class InternetAction extends LiveAction {
	protected ticker = new Ticker(300, (_k, t) => netKey(latency, t));
	protected override appeared(): void {
		if (!netTimer) {
			void checkNet();
			netTimer = setInterval(() => void checkNet(), 10_000);
		}
	}
	override async onKeyDown(): Promise<void> {
		await checkNet();
		this.ticker.invalidate();
	}
}

// ---------------------------------------------------------------- WLAN

@action({ UUID: "com.lazydeck.plugin.wifi" })
class WifiAction extends LiveAction {
	#info: { ssid: string; signal: number } | null | undefined;
	#timer: NodeJS.Timeout | undefined;
	protected ticker = new Ticker(1000, () => wifiKey(this.#info));
	async #read(): Promise<void> {
		if (!isWindows) return;
		try {
			const { stdout } = await run("netsh.exe", ["wlan", "show", "interfaces"], { timeoutMs: 8000 });
			this.#info = parseWifi(stdout) ?? null;
		} catch {
			this.#info = null;
		}
	}
	protected override appeared(): void {
		if (!this.#timer) {
			void this.#read();
			this.#timer = setInterval(() => void this.#read(), 15_000);
		}
	}
	override onKeyDown(): void {
		if (isWindows) openExternal("ms-settings:network-wifi");
	}
}

// ---------------------------------------------------------------- Akku

@action({ UUID: "com.lazydeck.plugin.battery" })
class BatteryAction extends LiveAction {
	#info: { percent: number; charging: boolean } | null | undefined;
	#timer: NodeJS.Timeout | undefined;
	protected ticker = new Ticker(1000, () => batteryKey(this.#info));
	async #read(): Promise<void> {
		if (isWindows) {
			const r = await ps.query<{ EstimatedChargeRemaining: number; BatteryStatus: number } | null>(
				"(Get-CimInstance Win32_Battery | Select-Object -First 1 EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json -Compress)",
				8000,
			);
			this.#info = r ? { percent: r.EstimatedChargeRemaining, charging: r.BatteryStatus === 2 || r.BatteryStatus >= 6 } : null;
		} else if (isMac) {
			const { stdout } = await run("pmset", ["-g", "batt"]).catch(() => ({ stdout: "" }));
			const m = /(\d+)%;\s*(\w+)/.exec(stdout);
			this.#info = m ? { percent: Number(m[1]), charging: m[2] !== "discharging" } : null;
		}
	}
	protected override appeared(): void {
		if (!this.#timer) {
			void this.#read();
			this.#timer = setInterval(() => void this.#read(), 60_000);
		}
	}
	override onKeyDown(): void {
		if (isWindows) openExternal("ms-settings:batterysaver");
	}
}

// ---------------------------------------------------------------- Timer & Stoppuhr

type TimerSettings = { minutes?: string };
const timers = new Map<string, { work: Clockwork; minutes: number; rang: boolean }>();

/** Rings timers that ran out, even while their key is off screen. */
setInterval(() => {
	for (const timer of timers.values()) {
		if (timer.work.running && !timer.rang && timer.work.elapsed() >= timer.minutes * 60_000) {
			timer.rang = true;
			timer.work.toggle();
			center.raise({ level: "wait", title: tr("{n} min um", { n: timer.minutes }), source: tr("Timer"), detail: tr("Dein Timer ist abgelaufen.") }, { immediate: true });
		}
	}
}, 500).unref?.();

/** Press: start/pause. Hold: reset. */
abstract class HoldAction<S extends Record<string, any>> extends LiveAction<S> {
	#down = new Map<string, number>();
	override onKeyDown(ev: KeyDownEvent<S>): void {
		this.#down.set(ev.action.id, Date.now());
	}
	override async onKeyUp(ev: KeyUpEvent<S>): Promise<void> {
		const held = Date.now() - (this.#down.get(ev.action.id) ?? Date.now());
		if (held > 700) {
			this.hold(ev.action.id);
			await ev.action.showOk();
		} else {
			this.press(ev.action.id, ev.payload.settings);
		}
		this.ticker.invalidate();
	}
	protected abstract press(id: string, settings: S): void;
	protected abstract hold(id: string): void;
}

const minutesOf = (s: TimerSettings) => Math.max(1, Math.min(180, Number(s.minutes) || 10));

@action({ UUID: "com.lazydeck.plugin.timer" })
class TimerAction extends HoldAction<TimerSettings> {
	protected ticker = new Ticker<TimerSettings>(250, (key) => {
		const minutes = minutesOf(this.opts(key));
		const timer = timers.get(key.id);
		if (!timer) return timerKey({ minutes, left: minutes * 60_000, running: false, started: false });
		return timerKey({ minutes: timer.minutes, left: timer.minutes * 60_000 - timer.work.elapsed(), running: timer.work.running, started: true });
	});
	protected press(id: string, settings: TimerSettings): void {
		let timer = timers.get(id);
		if (!timer || timer.rang) {
			timer = { work: new Clockwork(), minutes: minutesOf(settings), rang: false };
			timers.set(id, timer);
		}
		timer.work.toggle();
	}
	protected hold(id: string): void {
		timers.delete(id);
	}
}

const watches = new Map<string, Clockwork>();

@action({ UUID: "com.lazydeck.plugin.stopwatch" })
class StopwatchAction extends HoldAction<Record<string, any>> {
	protected ticker = new Ticker(250, (key) => {
		const w = watches.get(key.id);
		return stopwatchKey(w?.elapsed() ?? 0, w?.running ?? false);
	});
	protected press(id: string): void {
		const w = watches.get(id) ?? new Clockwork();
		watches.set(id, w);
		w.toggle();
	}
	protected hold(id: string): void {
		watches.delete(id);
	}
}

// ---------------------------------------------------------------- Countdown

type CountdownSettings = { mode?: "feierabend" | "weekend"; time?: string };

@action({ UUID: "com.lazydeck.plugin.countdown" })
class CountdownAction extends LiveAction<CountdownSettings> {
	protected ticker = new Ticker<CountdownSettings>(1000, (key, t) => {
		const s = this.opts(key);
		const mode = s.mode === "weekend" ? "weekend" : "feierabend";
		const left = mode === "weekend" ? untilWeekend(new Date(), s.time) : untilFeierabend(new Date(), s.time);
		return countdownKey(mode, left, t);
	});
	override async onKeyDown(ev: KeyDownEvent<CountdownSettings>): Promise<void> {
		await ev.action.showOk();
	}
}

// ---------------------------------------------------------------- Erinnerung

type ReminderSettings = { mode?: "water" | "move"; minutes?: string };
type Reminder = { every: number; next: number; due: boolean; alertId?: number };
const reminders = new Map<"water" | "move", Reminder>();

setInterval(() => {
	for (const [kind, r] of reminders) {
		if (!r.due && Date.now() >= r.next) {
			r.due = true;
			r.alertId = center.raise({
				level: "wait",
				title: kind === "water" ? tr("Zeit zu trinken") : tr("Kurz bewegen"),
				source: tr("Erinnerung"),
				detail: kind === "water" ? tr("Ein Glas Wasser, dann geht's weiter.") : tr("Aufstehen, strecken, einmal durchatmen."),

			})?.id;
		}
	}
}, 1000).unref?.();

/** When the alert is dealt with on the deck, the reminder counts as done. */
center.on("change", () => {
	for (const r of reminders.values()) {
		if (r.due && r.alertId !== undefined && center.current?.id !== r.alertId) {
			r.due = false;
			r.alertId = undefined;
			r.next = Date.now() + r.every;
		}
	}
});

const kindOf = (s: ReminderSettings) => (s.mode === "move" ? "move" : "water");
const everyOf = (s: ReminderSettings) => Math.max(5, Math.min(240, Number(s.minutes) || (kindOf(s) === "water" ? 60 : 45))) * 60_000;

@action({ UUID: "com.lazydeck.plugin.reminder" })
class ReminderAction extends LiveAction<ReminderSettings> {
	protected ticker = new Ticker<ReminderSettings>(300, (key, t) => {
		const s = this.opts(key);
		const kind = kindOf(s);
		let r = reminders.get(kind);
		if (!r) {
			r = { every: everyOf(s), next: Date.now() + everyOf(s), due: false };
			reminders.set(kind, r);
		}
		return reminderKey(kind, r.next - Date.now(), r.due, t);
	});
	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ReminderSettings>): void {
		const kind = kindOf(ev.payload.settings);
		const every = everyOf(ev.payload.settings);
		reminders.set(kind, { every, next: Date.now() + every, due: false });
		super.onDidReceiveSettings(ev);
	}
	override async onKeyDown(ev: KeyDownEvent<ReminderSettings>): Promise<void> {
		const kind = kindOf(ev.payload.settings);
		const r = reminders.get(kind);
		if (r) {
			if (r.alertId !== undefined && center.current?.id === r.alertId) center.resolve();
			r.due = false;
			r.alertId = undefined;
			r.next = Date.now() + r.every;
		}
		await ev.action.showOk();
		this.ticker.invalidate();
	}
}

// ---------------------------------------------------------------- Münze & Würfel

type ChanceSettings = { mode?: "coin" | "dice" };
const chance = new Map<string, { started: number; value: number }>();

@action({ UUID: "com.lazydeck.plugin.chance" })
class ChanceAction extends LiveAction<ChanceSettings> {
	protected ticker = new Ticker<ChanceSettings>(80, (key) => {
		const mode = this.opts(key).mode === "dice" ? "dice" : "coin";
		const state = chance.get(key.id);
		const spin = state ? Math.min(1, (Date.now() - state.started) / 1200) : undefined;
		if (mode === "dice") return diceKey(state?.value, spin);
		// Shown through tr(): N("Kopf"), N("Zahl")
		return coinKey(state ? (state.value === 1 ? "Kopf" : "Zahl") : undefined, spin);
	});
	override onKeyDown(ev: KeyDownEvent<ChanceSettings>): void {
		const mode = ev.payload.settings.mode === "dice" ? "dice" : "coin";
		chance.set(ev.action.id, { started: Date.now(), value: mode === "dice" ? randomInt(1, 7) : randomInt(1, 3) });
	}
}

export const HOME_ACTIONS = [
	new ClockAction(),
	new WeatherAction(),
	new InternetAction(),
	new WifiAction(),
	new BatteryAction(),
	new TimerAction(),
	new StopwatchAction(),
	new CountdownAction(),
	new ReminderAction(),
	new ChanceAction(),
];
