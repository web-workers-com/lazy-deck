/** Pure helpers for the everyday keys: time maths, weather codes, parsers. */
import { tr } from "./i18n.js";

/** ISO calendar week, as Germans read it on the wall calendar. */
export function isoWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const day = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** "2:05 h", "45 min", "0:42" — the shortest honest way to say how long. */
export function formatLeft(ms: number): string {
	const total = Math.max(0, Math.round(ms / 1000));
	if (total >= 2 * 86_400) return tr("{n} Tage", { n: Math.floor(total / 86_400) });
	if (total >= 3600) {
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		return tr("{h}:{mm} h", { h, mm: String(m).padStart(2, "0") });
	}
	if (total >= 600) return tr("{n} min", { n: Math.ceil(total / 60) });

	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Stopwatch reading: "1:02:03" or "02:03". */
export function formatClock(ms: number): string {
	const total = Math.floor(ms / 1000);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const mm = String(m).padStart(2, "0");
	const ss = String(s).padStart(2, "0");
	return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Parses "17:30" into hours and minutes; falls back to 17:00. */
export function parseTime(value: unknown): [number, number] {
	const match = typeof value === "string" ? /^(\d{1,2}):(\d{2})$/.exec(value.trim()) : null;
	if (match) {
		const h = Number(match[1]);
		const m = Number(match[2]);
		if (h < 24 && m < 60) return [h, m];
	}
	return [17, 0];
}

/**
 * Time until the end of the working day, or `0` once it is reached today.
 * Weekends count as already done.
 */
export function untilFeierabend(now: Date, time: unknown): number {
	const day = now.getDay();
	if (day === 0 || day === 6) return 0;
	const [h, m] = parseTime(time);
	const end = new Date(now);
	end.setHours(h, m, 0, 0);
	return Math.max(0, end.getTime() - now.getTime());
}

/** Time until Friday at the given time; `0` from then until Monday. */
export function untilWeekend(now: Date, time: unknown): number {
	const day = now.getDay();
	const [h, m] = parseTime(time);
	const friday = new Date(now);
	friday.setDate(now.getDate() + ((5 - day + 7) % 7));
	friday.setHours(h, m, 0, 0);
	if (day === 6 || day === 0 || (day === 5 && now >= friday)) return 0;
	return friday.getTime() - now.getTime();
}

export type Sky = "sun" | "partly" | "cloud" | "fog" | "rain" | "snow" | "storm";

/** WMO weather codes (as Open-Meteo reports them) to a picture and a word. */
export function weatherInfo(code: number): { sky: Sky; word: string } {
	if (code === 0) return { sky: "sun", word: tr("Sonnig") };
	if (code <= 2) return { sky: "partly", word: tr("Heiter") };
	if (code === 3) return { sky: "cloud", word: tr("Bewölkt") };
	if (code === 45 || code === 48) return { sky: "fog", word: tr("Nebel") };
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { sky: "rain", word: tr("Regen") };
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { sky: "snow", word: tr("Schnee") };
	if (code >= 95) return { sky: "storm", word: tr("Gewitter") };
	return { sky: "cloud", word: tr("Wolkig") };

}

/** Reads SSID and signal from `netsh wlan show interfaces` (any language). */
export function parseWifi(output: string): { ssid: string; signal: number } | undefined {
	const ssid = /^\s*SSID\s*:\s*(.+?)\s*$/m.exec(output)?.[1];
	const signal = /^\s*Signal\s*:\s*(\d+)\s*%/m.exec(output)?.[1];
	if (!ssid) return undefined;
	return { ssid, signal: signal ? Number(signal) : 0 };
}

/** A countdown/stopwatch that can pause. */
export class Clockwork {
	startedAt: number | undefined;
	/** Time banked from earlier runs. */
	banked = 0;

	constructor(private readonly now: () => number = Date.now) {}

	get running(): boolean {
		return this.startedAt !== undefined;
	}

	elapsed(): number {
		return this.banked + (this.startedAt !== undefined ? this.now() - this.startedAt : 0);
	}

	toggle(): void {
		if (this.startedAt === undefined) {
			this.startedAt = this.now();
		} else {
			this.banked += this.now() - this.startedAt;
			this.startedAt = undefined;
		}
	}

	reset(): void {
		this.startedAt = undefined;
		this.banked = 0;
	}
}
