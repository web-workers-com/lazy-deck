/**
 * The info bar of the Stream Deck Neo (232 x 50 px): Sam's head on the left,
 * two lines on the right. Calm: the time. Focus timer: what is left. Alert:
 * what waits, pulsing like the sloth key.
 */
import type { Alert } from "../alerts.js";
import { formatLeft } from "../home.js";
import { since } from "./scene.js";
import { sloth } from "./sloth.js";
import { BODY, C, DEFS, q, swing, text } from "./svg.js";
import { tr } from "../i18n.js";

export const INFOBAR = { width: 232, height: 50 } as const;

const DAYS = () => [tr("So"), tr("Mo"), tr("Di"), tr("Mi"), tr("Do"), tr("Fr"), tr("Sa")];

export type InfobarOptions = {
	alert: Alert | undefined;
	t: number;
	now?: number;
	/** The focus timer, when it runs. */
	pomodoro?: { phase: "focus" | "break"; left: number; progress: number; paused: boolean };
};

/** Text column: from right of the head to the right edge. */
const X = 58;
const MAX = INFOBAR.width - X - 8;

export function infobarImage(o: InfobarOptions): string {
	const { alert, t } = o;
	const now = o.now ?? Date.now();
	const snoozed = alert?.snoozedUntil !== undefined && alert.snoozedUntil > now;
	const live = alert && !snoozed;
	const tone = alert ? (alert.level === "error" ? C.coral : C.honey) : "#3A4A35";
	const mood = !live ? "sleep" : alert.level === "error" ? "panic" : "wait";

	// Sam's head: the 120-unit sloth scaled down, the face centred in the bar.
	const head =
		`<clipPath id="ldIbHead"><rect x="2" y="2" width="50" height="46" rx="12"/></clipPath>` +
		`<g clip-path="url(#ldIbHead)"><g transform="translate(-7 -17.5) scale(0.62)">${sloth({ mood, t, sitting: true })}</g></g>`;

	let lines = "";
	if (alert && snoozed) {
		const minutes = Math.max(1, Math.ceil((alert.snoozedUntil! - now) / 60_000));
		lines = line1(alert.title, C.cream) + line2(tr("schlummert · noch {n} min", { n: minutes }), C.honey);
	} else if (alert) {
		lines = line1(alert.title, tone) + line2([alert.source, since(alert.createdAt, now)].filter(Boolean).join(" · "), C.cream);
	} else if (o.pomodoro) {
		const p = o.pomodoro;
		const label = `${p.phase === "focus" ? tr("Fokus") : tr("Pause")} ${formatLeft(p.left)}${p.paused ? ` · ${tr("angehalten")}` : ""}`;
		const width = MAX * Math.min(1, Math.max(0, p.progress));
		lines =
			line1(label, p.phase === "focus" ? C.coral : C.leaf) +
			`<rect x="${X}" y="34" width="${MAX}" height="6" rx="3" fill="#0B0F0A" opacity="0.75"/>` +
			`<rect x="${X}" y="34" width="${q(width)}" height="6" rx="3" fill="${p.phase === "focus" ? C.coral : C.leaf}"/>`;
	} else {
		const d = new Date(now);
		const hh = String(d.getHours()).padStart(2, "0");
		const mm = String(d.getMinutes()).padStart(2, "0");
		const zz = [0, 1.6].map((phase, i) => {
			const p = ((t + phase) % 3.2) / 3.2;
			const opacity = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
			return `<text x="${q(44 + i * 5 + p * 4)}" y="${q(20 - i * 4 - p * 10)}" font-family="${BODY}" font-weight="700" font-size="${10 - i * 2}" fill="${C.sky}" opacity="${q(opacity, 0.25)}">z</text>`;
		});
		lines = line1(`${hh}:${mm}`, C.cream) + line2(tr("{day} {d}.{m}. · alles ruhig", { day: DAYS()[d.getDay()]!, d: d.getDate(), m: d.getMonth() + 1 }), "#9D9A94")
 + zz.join("");
	}

	const opacity = live ? q(0.35 + swing(t, alert.level === "error" ? 1.6 : 2.8) * 0.65, 0.35) : "1";
	return infobarSvg(
		`<rect width="232" height="50" fill="url(#ldKey)"/>` +
			(live ? `<rect width="232" height="50" fill="${tone}" opacity="${q(0.06 + swing(t, alert.level === "error" ? 1.6 : 2.8) * 0.1, 0.02)}"/>` : "") +
			head +
			lines +
			`<rect x="1" y="1" width="230" height="48" rx="10" fill="none" stroke="${tone}" stroke-width="2" opacity="${opacity}"/>`,
	);
}

const line1 = (value: string, fill: string) => text(value, { x: X, y: 24, size: 19, max: MAX, fill, weight: 700, anchor: "start", min: 12 });
const line2 = (value: string, fill: string) => text(value, { x: X, y: 41, size: 11, max: MAX, fill, weight: 500, anchor: "start", face: "body", min: 8 });

/** Wraps markup into an info bar image (2x for a sharp result) as a data URI. */
function infobarSvg(inner: string): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="464" height="100" viewBox="0 0 232 50"><defs>${DEFS}</defs>${inner}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
