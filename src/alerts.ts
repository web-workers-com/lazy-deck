/**
 * The alert state machine, free of Stream Deck so it can be tested.
 *
 * Stage 1: the sloth key pulses. Stage 2: the whole deck turns into the alert
 * profile. Waiting alerts climb to stage 2 after a delay; errors start there.
 */
export type Level = "wait" | "error";
import { tr } from "./i18n.js";

export type AlertInput = {
	level?: Level;
	title?: string;
	source?: string;
	detail?: string;
	url?: string;
};

export type Alert = Required<Pick<AlertInput, "level" | "title">> &
	Omit<AlertInput, "level" | "title"> & {
		id: number;
		createdAt: number;
		stage: 1 | 2;
		/** When a snoozed alert takes the deck again. */
		snoozedUntil?: number;
	};

export type Clock = {
	now(): number;
	setTimeout(fn: () => void, ms: number): unknown;
	clearTimeout(handle: unknown): void;
};

export const systemClock: Clock = {
	now: () => Date.now(),
	setTimeout: (fn, ms) => {
		const handle = setTimeout(fn, ms);
		handle.unref?.();
		return handle;
	},
	clearTimeout: (handle) => clearTimeout(handle as NodeJS.Timeout),
};

export type AlertEvent = "change" | "takeover" | "release";

export const ESCALATE_MS = 2 * 60_000;
export const SNOOZE_MS = 5 * 60_000;

/** Only web links may be opened from an alert. */
export function safeUrl(value: unknown): string | undefined {
	if (typeof value !== "string" || value.length > 2000) {
		return undefined;
	}
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
	} catch {
		return undefined;
	}
}

const clean = (value: unknown, max: number) =>
	typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ").slice(0, max) : undefined;

export class AlertCenter {
	#alert: Alert | undefined;
	#timer: unknown;
	#nextId = 1;
	#listeners = new Map<AlertEvent, Set<() => void>>();

	constructor(
		private readonly clock: Clock = systemClock,
		private readonly escalateMs = ESCALATE_MS,
	) {}

	get current(): Alert | undefined {
		return this.#alert;
	}

	on(event: AlertEvent, listener: () => void): () => void {
		const set = this.#listeners.get(event) ?? new Set();
		set.add(listener);
		this.#listeners.set(event, set);
		return () => set.delete(listener);
	}

	#emit(event: AlertEvent): void {
		for (const listener of this.#listeners.get(event) ?? []) {
			listener();
		}
	}

	#schedule(ms: number): void {
		this.#cancel();
		this.#timer = this.clock.setTimeout(() => {
			this.#timer = undefined;
			this.takeover();
		}, ms);
	}

	#cancel(): void {
		if (this.#timer !== undefined) {
			this.clock.clearTimeout(this.#timer);
			this.#timer = undefined;
		}
	}

	/**
	 * Raises an alert. A new one replaces the current one, except that a
	 * waiting alert never pushes an error aside.
	 */
	raise(input: AlertInput, options: { immediate?: boolean } = {}): Alert | undefined {
		const level: Level = input.level === "error" ? "error" : "wait";
		if (this.#alert?.level === "error" && level === "wait") {
			return undefined;
		}
		const alert: Alert = {
			id: this.#nextId++,
			level,
			title: clean(input.title, 80) ?? (level === "error" ? tr("Fehler") : tr("Schau mal"))
,
			source: clean(input.source, 60),
			detail: clean(input.detail, 2000),
			url: safeUrl(input.url),
			createdAt: this.clock.now(),
			stage: 1,
		};
		const wasTakenOver = this.#alert?.stage === 2;
		this.#alert = alert;
		this.#emit("change");
		if (level === "error" || options.immediate || wasTakenOver) {
			this.takeover();
		} else {
			this.#schedule(this.escalateMs);
		}
		return alert;
	}

	/** Puts the current alert on the whole deck now. */
	takeover(): void {
		const alert = this.#alert;
		if (!alert) {
			return;
		}
		this.#cancel();
		alert.stage = 2;
		alert.snoozedUntil = undefined;
		this.#emit("change");
		this.#emit("takeover");
	}

	/** Gives the deck back for a while; the alert comes back on its own. */
	snooze(ms = SNOOZE_MS): void {
		const alert = this.#alert;
		if (!alert) {
			return;
		}
		alert.stage = 1;
		alert.snoozedUntil = this.clock.now() + ms;
		this.#schedule(ms);
		this.#emit("change");
		this.#emit("release");
	}

	/** Gives the deck back; the sloth key keeps pulsing until it is dealt with. */
	back(): void {
		const alert = this.#alert;
		if (!alert) {
			this.#emit("release");
			return;
		}
		this.#cancel();
		alert.stage = 1;
		alert.snoozedUntil = undefined;
		this.#emit("change");
		this.#emit("release");
	}

	/** Done with it: clears the alert and gives the deck back. */
	resolve(): void {
		this.#cancel();
		const had = this.#alert;
		this.#alert = undefined;
		this.#emit("change");
		if (had) {
			this.#emit("release");
		}
	}
}
