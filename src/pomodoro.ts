/**
 * Pomodoro: 25 minutes focus, 5 minutes break. When a phase ends, the sloth
 * says so through the alert, so you notice even with headphones on.
 */
export type Phase = "idle" | "focus" | "break";

export const FOCUS_MS = 25 * 60_000;
export const BREAK_MS = 5 * 60_000;

export class Pomodoro {
	phase: Phase = "idle";
	endsAt = 0;
	/** Remaining time while paused. */
	pausedLeft: number | undefined;
	rounds = 0;

	constructor(private readonly now: () => number = Date.now) {}

	left(): number {
		if (this.phase === "idle") return 0;
		return this.pausedLeft ?? Math.max(0, this.endsAt - this.now());
	}

	total(): number {
		return this.phase === "break" ? BREAK_MS : FOCUS_MS;
	}

	/** 0..1 of the current phase done. */
	progress(): number {
		return this.phase === "idle" ? 0 : 1 - this.left() / this.total();
	}

	/** Short press: start, pause or resume. */
	press(): void {
		if (this.phase === "idle") {
			this.start("focus");
		} else if (this.pausedLeft !== undefined) {
			this.endsAt = this.now() + this.pausedLeft;
			this.pausedLeft = undefined;
		} else {
			this.pausedLeft = this.left();
		}
	}

	start(phase: Exclude<Phase, "idle">): void {
		this.phase = phase;
		this.pausedLeft = undefined;
		this.endsAt = this.now() + (phase === "focus" ? FOCUS_MS : BREAK_MS);
	}

	reset(): void {
		this.phase = "idle";
		this.pausedLeft = undefined;
	}

	/**
	 * Moves on when a phase is over.
	 * @returns The phase that just ended, if one did.
	 */
	tick(): Phase | undefined {
		if (this.phase === "idle" || this.pausedLeft !== undefined || this.left() > 0) {
			return undefined;
		}
		const ended = this.phase;
		if (ended === "focus") {
			this.rounds += 1;
			this.start("break");
		} else {
			this.reset();
		}
		return ended;
	}
}
