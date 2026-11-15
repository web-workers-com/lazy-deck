/** Keys with live content: clock, weather, network, timers, reminders, coin and dice. */
import type { Sky } from "../home.js";
import { formatClock, formatLeft, isoWeek } from "../home.js";
import { frame, ICONS } from "./apps.js";
import { BRANCH, sloth } from "./sloth.js";
import { signKey } from "./scenes.js";
import { C, pill, q, swing, text } from "./svg.js";

const DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/** Seconds, for keys whose ticker passes no time: signs sway with it. */
const now = () => Date.now() / 1000;

/** The clock hangs as a sign from the branch: weekday, time, date and week. */
export function clockKey(date: Date): string {
	const hh = String(date.getHours()).padStart(2, "0");
	const mm = String(date.getMinutes()).padStart(2, "0");
	return signKey({
		title: DAYS[date.getDay()]!,
		value: `${hh}:${mm}`,
		sub: `${date.getDate()}.${date.getMonth() + 1}. · KW ${isoWeek(date)}`,
		t: date.getTime() / 1000,
		phase: 0.7,
	});
}

function skyArt(sky: Sky, t: number, day: boolean): string {
	const sun = day
		? `<g transform="rotate(${q(t * 12, 2)} 46 38)"><circle cx="46" cy="38" r="13" fill="${C.honey}"/><path d="M46 18 v6 M46 52 v6 M26 38 h6 M60 38 h6 M32 24 l4 4 M56 48 l4 4 M32 52 l4 -4 M56 28 l4 -4" stroke="${C.honey}" stroke-width="4" stroke-linecap="round"/></g>`
		: `<path d="M50 22 a17 17 0 1 0 14 26 a13 13 0 1 1 -14 -26 z" fill="${C.cream}"/>`;
	const cloud = (x: number, y: number, s = 1, fill: string = C.cream) =>
		`<path transform="translate(${x} ${y}) scale(${s})" d="M0 16 a10 10 0 0 1 8 -14 a14 14 0 0 1 26 2 a10 10 0 0 1 4 20 h-34 a8 8 0 0 1 -4 -8 z" fill="${fill}"/>`;
	const drift = q(swing(t, 6) * 4);
	switch (sky) {
		case "sun":
			return sun;
		case "partly":
			return sun + `<g transform="translate(${drift} 0)">${cloud(52, 34, 1)}</g>`;
		case "cloud":
			return `<g transform="translate(${drift} 0)">${cloud(26, 22, 1.1, "#B9B2A8")}${cloud(44, 34, 1)}</g>`;
		case "fog":
			return `<path d="M26 34 h68 M32 46 h56 M26 58 h68" stroke="#B9B2A8" stroke-width="6" stroke-linecap="round"/>`;
		case "rain": {
			const p = (t % 0.8) / 0.8;
			return cloud(36, 18, 1.1) + `<path transform="translate(0 ${q(p * 8)})" d="M44 50 l-4 8 M58 50 l-4 8 M72 50 l-4 8" stroke="${C.sky}" stroke-width="4" stroke-linecap="round" opacity="${q(1 - p * 0.6, 0.1)}"/>`;
		}
		case "snow":
			return cloud(36, 18, 1.1) + `<g fill="#FFFFFF"><circle cx="46" cy="${q(54 + (t % 2) * 4)}" r="3"/><circle cx="60" cy="${q(58 + ((t + 1) % 2) * 4)}" r="3"/><circle cx="74" cy="${q(54 + ((t + 0.5) % 2) * 4)}" r="3"/></g>`;
		case "storm":
			return cloud(36, 16, 1.1, "#8C8C8C") + `<path d="M60 44 l-8 14 h8 l-6 12 l16 -18 h-8 l6 -8 z" fill="${C.honey}" opacity="${t % 1.5 > 1.3 ? 0.3 : 1}"/>`;
	}
}

export type WeatherView = { temp: number; sky: Sky; word: string; place?: string; day: boolean };

export function weatherKey(w: WeatherView | undefined, t: number): string {
	if (!w) return signKey({ title: "Wetter", value: "…", sub: "wird geladen", t, phase: 1.4 });
	return signKey({ title: w.place ?? "Wetter", value: `${Math.round(w.temp)}°`, sub: w.word, art: skyArt(w.sky, t, w.day).replaceAll(C.cream, C.fur).replaceAll("#B9B2A8", "#A08A70"), t, phase: 1.4 });
}

/** Internet: latency, or a panicking sloth when it is gone. */
export function netKey(ms: number | null | undefined, t: number): string {
	if (ms === null) {
		return frame(BRANCH + sloth({ mood: "panic", t }) + pill("Offline!", C.coral, C.night), C.coral);
	}
	const word = ms === undefined ? "prüft …" : ms < 60 ? "schnell" : ms < 150 ? "geht so" : "langsam";
	return signKey({ title: "Internet", value: ms === undefined ? "…" : `${ms} ms`, sub: word, t, phase: 3.1, tone: ms !== undefined && ms >= 150 ? "honey" : "cream" });
}

export function wifiKey(info: { ssid: string; signal: number } | undefined | null): string {
	if (info === null) return signKey({ title: "WLAN", value: "keins", sub: "Kabel oder aus", t: now(), phase: 3.6 });
	return signKey({ title: info?.ssid ?? "WLAN", value: info ? `${info.signal} %` : "…", bar: info ? info.signal / 100 : undefined, t: now(), phase: 3.6 });
}

export function batteryKey(b: { percent: number; charging: boolean } | null | undefined): string {
	if (b === null) return signKey({ title: "Strom", value: "Netz", sub: "kein Akku", t: now(), phase: 4.4 });
	const p = b?.percent ?? 0;
	return signKey({
		title: b?.charging ? "Akku lädt" : "Akku",
		value: b ? `${p} %` : "…",
		bar: b ? p / 100 : undefined,
		tone: b && p <= 15 && !b.charging ? "coral" : "cream",
		t: now(),
		phase: 4.4,
	});
}

/** A ring that runs down; shared by timer and countdowns. */
function ring(progress: number, tone: string, center: string, label: string, labelTone?: string, border?: string): string {
	const r = 30;
	const length = 2 * Math.PI * r;
	return frame(
		`<circle cx="60" cy="48" r="${r}" fill="none" stroke="#0E130C" stroke-width="9"/>` +
			`<circle cx="60" cy="48" r="${r}" fill="none" stroke="${tone}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${q(length * Math.max(0, Math.min(1, progress)), 0.1)} ${q(length, 0.1)}" transform="rotate(-90 60 48)"/>` +
			text(center, { x: 60, y: 54, size: 17, max: 48, fill: C.cream, weight: 700, min: 10 }) +
			pill(label, labelTone ?? C.pillDark, labelTone ? C.night : C.cream),
		border,
	);
}

export function timerKey(o: { minutes: number; left: number; running: boolean; started: boolean }): string {
	const t = now();
	if (!o.started) return signKey({ title: "Timer", value: `${o.minutes} min`, sub: "drücken = los", t, phase: 5.2 });
	const done = o.left <= 0;
	if (done) return signKey({ title: "Timer", value: "Fertig!", sub: "halten = neu", tone: "coral", t, phase: 5.2 });
	return signKey({ title: o.running ? "Timer läuft" : "Timer pausiert", value: formatLeft(o.left), bar: o.left / (o.minutes * 60_000), tone: o.running ? "leaf" : "cream", t, phase: 5.2 });
}

export function stopwatchKey(ms: number, running: boolean): string {
	const seconds = (ms / 1000) % 60;
	return ring(seconds / 60, running ? C.leaf : "#6B6F63", formatClock(ms), running ? "Stoppuhr" : ms ? "angehalten" : "Stoppuhr", undefined, running ? C.leaf : undefined);
}

export function countdownKey(kind: "feierabend" | "weekend", left: number, t: number): string {
	const label = kind === "feierabend" ? "Feierabend" : "Wochenende";
	if (left <= 0) {
		return frame(
			`<rect width="120" height="120" fill="#16203A"/>` +
				BRANCH +
				sloth({ mood: "sleep", t }) +
				`<path d="M96 30 a8 8 0 1 0 6 10 a6 6 0 1 1 -6 -10 z" fill="${C.cream}"/>` +
				pill(`${label}!`, C.honey, C.night),
			C.honey,
		);
	}
	const span = kind === "feierabend" ? 9 * 3600_000 : 5 * 86_400_000;
	return signKey({ title: `bis ${label}`, value: formatLeft(left), bar: 1 - left / span, t, phase: 5.9 });
}

export function reminderKey(kind: "water" | "move", left: number, due: boolean, t: number): string {
	const word = kind === "water" ? "Trinken" : "Bewegen";
	const icon = kind === "water" ? ICONS.glass! : ICONS.stretch!;
	if (due) {
		const bob = q(-3 + swing(t, 1.2) * 6);
		return frame(`<g transform="translate(0 ${bob})">${icon}</g>` + pill(`${word}!`, C.honey, C.night), C.honey);
	}
	return frame(`<g transform="translate(60 2) scale(0.78) translate(-60 0)">${icon}</g>` + text(`in ${formatLeft(left)}`, { x: 60, y: 86, size: 13, max: 96, fill: "#B9B2A8", face: "body" }) + pill(word, C.pillDark, C.cream));
}

/** Coin: heads shows the sloth. Spinning while `spin` runs 0..1. */
export function coinKey(result: "Kopf" | "Zahl" | undefined, spin: number | undefined): string {
	const flipping = spin !== undefined && spin < 1;
	const scaleX = flipping ? Math.abs(Math.cos(spin * Math.PI * 6)) : 1;
	const face = flipping ? (Math.floor(spin * 6) % 2 === 0 ? "Kopf" : "Zahl") : result;
	const inner =
		face === "Kopf"
			? `<g transform="translate(60 46) scale(0.42) translate(-60 -70)">${sloth({ mood: "awake", t: 0 })}</g>`
			: face === "Zahl"
				? text("1", { x: 60, y: 60, size: 36, max: 40, fill: "#8A6A2A", weight: 700 })
				: text("?", { x: 60, y: 60, size: 36, max: 40, fill: "#8A6A2A", weight: 700 });
	return frame(
		`<g transform="translate(60 46) scale(${q(scaleX, 0.05)} 1) translate(-60 -46)">` +
			`<circle cx="60" cy="46" r="32" fill="#E9C46A" stroke="#B8892F" stroke-width="5"/>` +
			`<clipPath id="coin"><circle cx="60" cy="46" r="28"/></clipPath><g clip-path="url(#coin)">${inner}</g></g>` +
			pill(flipping ? "…" : (result ?? "Münzwurf"), C.pillDark, C.cream),
	);
}

const PIPS: Record<number, Array<[number, number]>> = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

export function diceKey(value: number | undefined, spin: number | undefined): string {
	const rolling = spin !== undefined && spin < 1;
	const shown = rolling ? (Math.floor(spin * 12) % 6) + 1 : (value ?? 6);
	const angle = rolling ? q(Math.sin(spin * Math.PI * 4) * 18) : "0";
	const pips = PIPS[shown]!.map(([x, y]) => `<circle cx="${60 + x * 14}" cy="${46 + y * 14}" r="5.5" fill="${C.night}"/>`).join("");
	return frame(
		`<g transform="rotate(${angle} 60 46)"><rect x="32" y="18" width="56" height="56" rx="12" fill="${C.cream}"/>${pips}</g>` +
			pill(rolling ? "…" : value ? `${value}` : "Würfeln", C.pillDark, C.cream),
	);
}
