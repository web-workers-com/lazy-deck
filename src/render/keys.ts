/** Single keys: the sloth that shows how things stand, and the test keys. */
import type { Alert, Level } from "../alerts.js";
import { BRANCH, sloth } from "./sloth.js";
import { BODY, C, keyImage, pill, q, swing, text } from "./svg.js";

export type SlothKeyOptions = { alert: Alert | undefined; t: number; now?: number };

/** The sloth key: asleep when all is calm, awake and pulsing when something waits. */
export function slothKey(o: SlothKeyOptions): string {
	const { alert, t } = o;
	const now = o.now ?? Date.now();
	const snoozed = alert?.snoozedUntil !== undefined && alert.snoozedUntil > now;
	const tone = alert ? (alert.level === "error" ? C.coral : C.honey) : "#3A4A35";
	const mood = !alert || snoozed ? "sleep" : alert.level === "error" ? "panic" : "wait";

	let extra = "";
	if (mood === "sleep") {
		const z = (phase: number, x: number, y: number, size: number) => {
			const p = ((t + phase) % 3.2) / 3.2;
			const opacity = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
			return `<text x="${q(x + p * 6)}" y="${q(y - p * 16)}" font-family="${BODY}" font-weight="700" font-size="${size}" fill="${C.sky}" opacity="${q(opacity, 0.25)}">z</text>`;
		};
		extra = z(0, 92, 52, 13) + z(1.6, 101, 44, 10);
	}

	let label = "";
	if (alert && snoozed) {
		const minutes = Math.max(1, Math.ceil((alert.snoozedUntil! - now) / 60_000));
		label = pill(`noch ${minutes} min`, C.pillDark, C.honey);
	} else if (alert) {
		label = pill(alert.title, tone, C.night);
	}

	const opacity = alert && !snoozed ? q(0.35 + swing(t, alert.level === "error" ? 1.6 : 2.8) * 0.65, 0.35) : "1";
	return keyImage(
		`<rect width="120" height="120" fill="url(#ldKey)"/>` +
			BRANCH +
			sloth({ mood, t }) +
			extra +
			label +
			`<rect x="1.5" y="1.5" width="117" height="117" rx="19" fill="none" stroke="${tone}" stroke-width="3" opacity="${opacity}"/>`,
	);
}

/** A key that raises a sample alert, so the whole thing can be tried. */
export function testKey(level: Level): string {
	const error = level === "error";
	const tone = error ? C.coral : C.honey;
	return keyImage(
		`<rect width="120" height="120" fill="url(#ldKey)"/>` +
			`<path d="M22 16 h76 a10 10 0 0 1 10 10 v44 a10 10 0 0 1 -10 10 h-58 l-16 12 l4 -12 h-6 a10 10 0 0 1 -10 -10 v-44 a10 10 0 0 1 10 -10 z" fill="${tone}"/>` +
			text(error ? "Hilfe!" : "Hey!", { x: 60, y: 58, size: 28, max: 80, fill: C.night, weight: 700 }) +
			pill(error ? "Test: Fehler" : "Test: Warten", C.pillDark, C.cream) +
			`<rect x="1.5" y="1.5" width="117" height="117" rx="19" fill="none" stroke="#3A4A35" stroke-width="3"/>`,
	);
}
