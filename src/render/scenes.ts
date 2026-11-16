/**
 * The canvas look ("Das Deck in Aktion"): a branch along the top row with
 * signs hanging from it, and every other key a small scene that the sloth,
 * or at least its paw with the three light claws, is part of.
 */
import { frame, STEAM_BADGE } from "./apps.js";
import { LOGOS, logoMark } from "./logos.js";
import { BRANCH, sloth } from "./sloth.js";
import { BODY, C, DISPLAY, esc, pill, q, swing, text } from "./svg.js";
import { tr } from "../i18n.js";

const INK = "#4A3426";
const ROPE = "#C7A578";

// ---------------------------------------------------------------- parts

const clawPair = (d: string, width = 3) =>
	`<path d="${d}" stroke="#2A1C14" stroke-width="${width}" fill="none" stroke-linecap="round"/>` +
	`<path d="${d}" stroke="#EDE0C6" stroke-width="${width * 0.57}" fill="none" stroke-linecap="round"/>`;

/** A paw reaching in from the left edge, gripping at (20, y). */
export function pawLeft(y: number): string {
	return (
		`<path d="M-10 ${y - 12} L18 ${y - 8} L18 ${y + 8} L-10 ${y + 14} Z" fill="url(#ldArm)"/>` +
		`<ellipse cx="20" cy="${y}" rx="7" ry="10" fill="#8A6747"/>` +
		clawPair(`M23 ${y - 9} q6 -2 7 4 M24 ${y - 2} q6 -2 7 4 M23 ${y + 5} q6 -2 7 4`)
	);
}

/** The same paw from the right edge. */
export function pawRight(y: number): string {
	return `<g transform="translate(120 0) scale(-1 1)">${pawLeft(y)}</g>`;
}

/** A paw coming up from the bottom right, gripping at (x, y). */
export function pawBottom(x: number, y: number): string {
	return (
		`<g transform="translate(${x - 80} ${y - 98})">` +
		`<path d="M58 124 C 62 104, 70 96, 80 94 L 84 104 C 76 106, 72 112, 70 126 Z" fill="url(#ldArm)"/>` +
		`<ellipse cx="80" cy="98" rx="7" ry="8" fill="#8A6747"/>` +
		clawPair("M80 92 q5 0 6 4 M81 98 q5 0 6 4 M80 104 q5 0 6 3") +
		`</g>`
	);
}

/** A paw hanging down from the top right, claws pointing down at (x, y). */
export function pawTop(x: number, y: number): string {
	return (
		`<g transform="translate(${x - 92} ${y - 36})">` +
		`<path d="M88 26 L130 -2 L130 18 L98 40 Z" fill="url(#ldArm)"/>` +
		`<ellipse cx="92" cy="36" rx="8" ry="6" fill="#8A6747"/>` +
		clawPair("M85 37 q-3 4 0 7 M89 40 q-3 4 0 7 M94 40 q-2 4 1 7") +
		`</g>`
	);
}

/** Bark along the top of a key; lines up with the sloth key's branch. */
const BARK =
	`<path d="M-6 17 C 40 15, 80 19, 126 16 L126 26 C 80 28, 40 25, -6 27 Z" fill="url(#ldBark)"/>` +
	`<path d="M8 22 q6 1.5 12 0 M60 21 q8 1 14 -1" stroke="#3E2B1F" stroke-width="1" fill="none" opacity="0.55" stroke-linecap="round"/>`;

/** A thin branch at the very top, for things that hang. */
const TWIG =
	`<path d="M-6 8 C 40 6, 80 11, 126 7 L126 15 C 80 18, 40 14, -6 16 Z" fill="url(#ldBark)"/>`;

/** Rising "z z", as in the canvas. */
function zs(t: number, x: number, y: number, size = 11, fill: string = C.cream): string {
	const one = (phase: number) => {
		const p = ((t + phase) % 3) / 3;
		const opacity = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
		return `<text x="${q(x + p * 6)}" y="${q(y - p * 16)}" font-family="${DISPLAY}" font-weight="600" font-size="${size}" fill="${fill}" opacity="${q(opacity, 0.1)}">z</text>`;
	};
	return one(0) + one(1.5);
}

/** A small sloth head (canvas hammock/moon style), eyes shut. */
function headAsleep(transform: string): string {
	return (
		`<g transform="${transform}">` +
		`<path d="M60 37 c6 -1 10 2 13 1 c5 1 8 4 11 5 c4 3 6 6 8 9 c3 4 3 8 4 11 c1 5 0 9 -1 13 c-1 5 -3 8 -6 11 c-3 4 -7 6 -11 8 c-5 2 -11 3 -18 3 c-7 0 -13 -1 -18 -3 c-4 -2 -8 -4 -11 -8 c-3 -3 -5 -6 -6 -11 c-1 -4 -2 -8 -1 -13 c1 -3 1 -7 4 -11 c2 -3 4 -6 8 -9 c3 -1 6 -4 11 -5 c3 1 7 -2 13 -1 z" fill="url(#ldHead)"/>` +
		`<path d="M50 39 l-3 -5 M56 37.5 l-1 -6 M62 37.5 l1 -6 M68 38.5 l3 -5" stroke="#7E5C3E" stroke-width="3" stroke-linecap="round"/>` +
		`<path d="M60 50 c10 0 17 3 22 9 c5 6 6 13 5 19 c-1 7 -5 12 -10 15 c-5 3 -11 4 -17 4 c-6 0 -12 -1 -17 -4 c-5 -3 -9 -8 -10 -15 c-1 -6 0 -13 5 -19 c5 -6 12 -9 22 -9 z" fill="url(#ldFace)"/>` +
		`<path d="M53 66 c1 4 -2 8 -6 10 c-4 3 -9 6 -13 5 c-3 -1 -3 -5 0 -9 c3 -4 7 -8 11 -9 c4 -1 7 0 8 3 z" fill="url(#ldPatch)"/>` +
		`<path d="M67 66 c-1 4 2 8 6 10 c4 3 9 6 13 5 c3 -1 3 -5 0 -9 c-3 -4 -7 -8 -11 -9 c-4 -1 -7 0 -8 3 z" fill="url(#ldPatch)"/>` +
		`<path d="M41.5 69.5 q4.5 3.5 9 0 M69.5 69.5 q4.5 3.5 9 0" stroke="#F3E5C8" stroke-width="2.3" fill="none" stroke-linecap="round"/>` +
		`<path d="M54 78 q6 -4 12 0 q1 4 -3 6 q-3 2 -6 0 q-4 -2 -3 -6 z" fill="#2A1C14"/>` +
		`</g>`
	);
}

const twinkle = (t: number, phase: number, d: string, fill: string) =>
	`<path d="${d}" fill="${fill}" opacity="${q(0.3 + swing(t, 2.4, phase) * 0.7, 0.1)}"/>`;

function stars(t: number): string {
	return (
		twinkle(t, 0, "M20 20 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6 z", "#F2D27A") +
		twinkle(t, 0.8, "M100 14 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z", C.cream) +
		twinkle(t, 1.6, "M104 48 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z", "#F2D27A") +
		`<circle cx="32" cy="44" r="1.2" fill="${C.cream}" opacity="${q(0.3 + swing(t, 2.4, 0.8) * 0.7, 0.1)}"/>`
	);
}

// ---------------------------------------------------------------- signs

export type SignTone = "cream" | "honey" | "coral" | "leaf";

const SIGN: Record<SignTone, { fill: string; edge: string; title: string; value: string; border?: string }> = {
	cream: { fill: C.cream, edge: "#C9AE80", title: INK, value: C.night },
	honey: { fill: C.honey, edge: "#D9982E", title: INK, value: C.night, border: C.honey },
	coral: { fill: C.coral, edge: "#C25A43", title: "#3A1A12", value: "#1F0E09", border: C.coral },
	leaf: { fill: C.leaf, edge: "#7FA445", title: "#2C3A1A", value: C.night, border: C.leaf },
};

export type SignOptions = {
	title: string;
	value: string;
	sub?: string;
	tone?: SignTone;
	t: number;
	/** Seconds of offset, so neighbouring signs do not sway in step. */
	phase?: number;
	/** 0…1: a little bar instead of the sub line. */
	bar?: number;
	/** Small drawing left of the value, in its own 120-unit space. */
	art?: string;
	/** A red dot on top: something is live. */
	live?: boolean;
	valueColor?: string;
};

/**
 * A cream sign on two strings, hanging from the branch: clock, weather,
 * microphone, sound output, timers. Signs side by side in the top row join
 * into the canvas's one long branch.
 */
export function signKey(o: SignOptions): string {
	const tone = SIGN[o.tone ?? "cream"];
	const sway = q(-2 + swing(o.t, 5, o.phase ?? 0) * 4, 0.25);
	const valueX = o.art ? 72 : 60;
	const bottom =
		o.bar !== undefined
			? `<rect x="32" y="87" width="56" height="5" rx="2.5" fill="${INK}" opacity="0.25"/>` +
				`<rect x="32" y="87" width="${q(56 * Math.max(0, Math.min(1, o.bar)))}" height="5" rx="2.5" fill="${o.tone === "honey" ? C.night : C.honey}"/>`
			: o.sub
				? text(o.sub, { x: 60, y: 92, size: 9, max: 68, fill: tone.title, face: "body", weight: 500 })
				: "";
	return frame(
		BARK +
			`<g transform="rotate(${sway} 60 22)">` +
			`<path d="M40 24 L36 44 M80 24 L84 44" stroke="${ROPE}" stroke-width="1.6"/>` +
			`<rect x="22" y="42" width="76" height="56" rx="10" fill="${tone.fill}" stroke="${tone.edge}" stroke-width="1.5"/>` +
			`<circle cx="30" cy="50" r="1.6" fill="${C.fur}"/><circle cx="90" cy="50" r="1.6" fill="${C.fur}"/>` +
			(o.live ? `<circle cx="60" cy="49" r="3" fill="${C.coral}" opacity="${q(0.45 + swing(o.t, 1.6) * 0.55, 0.1)}"/>` : "") +
			text(o.title, { x: 60, y: o.live ? 60 : 58, size: 10, max: 64, fill: tone.title, face: "body" }) +
			(o.art ? `<g transform="translate(17 55) scale(0.34)">${o.art}</g>` : "") +
			text(o.value, { x: valueX, y: 80, size: 18, max: o.art ? 48 : 68, min: 10, fill: o.valueColor ?? tone.value }) +
			bottom +
			`</g>`,
		tone.border,
	);
}

// ---------------------------------------------------------------- scenes

/** Clip: the clapperboard snaps shut, REC blinks. */
export function clipKey(t: number, label = tr("Clip!")): string {
	const p = (t % 2.8) / 2.8;
	const angle = p < 0.45 ? -24 : p < 0.58 ? -24 + ((p - 0.45) / 0.13) * 24 : p < 0.72 ? 0 : -((p - 0.72) / 0.28) * 24;
	return frame(
		`<circle cx="98" cy="18" r="5" fill="${C.coral}" opacity="${q(0.25 + swing(t, 1.6) * 0.75, 0.1)}"/>` +
			`<text x="86" y="21.5" text-anchor="end" font-family="${BODY}" font-weight="600" font-size="9" fill="${C.coral}">REC</text>` +
			`<rect x="28" y="46" width="66" height="40" rx="4" fill="#26272B" stroke="${C.cream}" stroke-width="1.5"/>` +
			`<path d="M28 54 H94" stroke="${C.cream}" stroke-width="1" opacity="0.5"/>` +
			`<text x="35" y="52" font-family="${BODY}" font-weight="600" font-size="5.5" fill="${C.cream}" opacity="0.8">${tr("SZENE 42 · TAKE 1")}</text>
` +
			`<text x="61" y="76" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="17" fill="${C.cream}">CLIP!</text>` +
			`<g transform="rotate(${q(angle)} 28 45)"><rect x="28" y="35" width="66" height="10" rx="2" fill="${C.cream}"/>` +
			`<path d="M34 35 h8 l-5 10 h-8 z M50 35 h8 l-5 10 h-8 z M66 35 h8 l-5 10 h-8 z M82 35 h8 l-5 10 h-8 z" fill="#26272B"/></g>` +
			pawLeft(66) +
			pill(label, C.pillDark, C.cream),
	);
}

/** The sloth asleep on the moon, stars twinkling: dark mode, shutdown timer. */
export function moonKey(label: string, t: number, opts: { tone?: string; border?: string } = {}): string {
	return frame(
		`<rect width="120" height="120" fill="url(#ldNight)"/>` +
			stars(t) +
			`<path d="M74 18 A32 32 0 1 0 98 70 A25 25 0 0 1 74 18 Z" fill="#F2D27A"/>` +
			`<circle cx="55" cy="42" r="3" fill="#E0BC5E"/><circle cx="50" cy="64" r="4" fill="#E0BC5E"/><circle cx="62" cy="74" r="2.4" fill="#E0BC5E"/>` +
			headAsleep("translate(55 38) scale(0.42)") +
			`<path transform="translate(55 38) scale(0.42)" d="M24 92 C 30 110, 70 112, 96 96 L 98 104 C 70 122, 30 120, 20 100 Z" fill="url(#ldArm)"/>` +
			zs(t, 92, 40, 10) +
			pill(label, opts.tone ?? C.pillDark, opts.tone ? C.night : C.cream),
		opts.border,
	);
}

/** Bright day: the sun with sunglasses (light mode). */
export function sunKey(label: string, t: number): string {
	const spin = q(t * 10, 2);
	return frame(
		`<rect width="120" height="120" fill="#2B4A5C"/>` +
			`<g transform="rotate(${spin} 60 48)"><path d="M60 14 v10 M60 72 v10 M26 48 h10 M84 48 h10 M36 24 l7 7 M77 65 l7 7 M36 72 l7 -7 M77 31 l7 -7" stroke="${C.honey}" stroke-width="5" stroke-linecap="round"/></g>` +
			`<circle cx="60" cy="48" r="20" fill="${C.honey}"/>` +
			`<path d="M44 44 h32 M46 44 q0 9 7 9 q6 0 6 -9 M61 44 q0 9 6 9 q7 0 7 -9" fill="#1F2A1D" stroke="#1F2A1D" stroke-width="2.2" stroke-linejoin="round"/>` +
			`<path d="M52 59 q8 5 16 0" stroke="#7A4A1A" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
			`<path d="M49 46 l3 -2" stroke="${C.cream}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>` +
			pill(label, C.pillDark, C.cream),
	);
}

/** The sloth in a hammock, swinging gently. */
export function hammockKey(label: string, t: number, opts: { tone?: string; border?: string } = {}): string {
	const rock = q(-3 + swing(t, 4.4) * 6, 0.25);
	return frame(
		TWIG +
			`<g transform="rotate(${rock} 60 12)">` +
			`<path d="M14 14 L28 48 M106 14 L92 48" stroke="${ROPE}" stroke-width="1.8"/>` +
			headAsleep("translate(32 20) scale(0.47)") +
			`<path d="M28 48 Q60 92 92 48 Q60 68 28 48 Z" fill="${C.sky}"/>` +
			`<path d="M33 54 Q60 82 87 54 M38 60 Q60 80 82 60" stroke="${C.cream}" stroke-width="1.6" fill="none" opacity="0.7"/>` +
			`<ellipse cx="44" cy="61" rx="5" ry="4" fill="#8A6747"/>` +
			`<path d="M41 63 q0 4 2 6 M44 64 q0 4 2 6 M47 63 q1 4 2 6" stroke="#EDE0C6" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
			`</g>` +
			zs(t, 84, 38) +
			pill(label, opts.tone ?? C.pillDark, opts.tone ? C.night : C.cream),
		opts.border,
	);
}

/** The sloth with a mug of coffee: keeps the PC awake. Steam rises while on. */
export function coffeeKey(on: boolean, label: string, t: number): string {
	const steam = (phase: number, x: number) => {
		const p = ((t + phase) % 3) / 3;
		const opacity = p < 0.4 ? (p / 0.4) * 0.9 : 0.9 * (1 - (p - 0.4) / 0.6);
		return `<path transform="translate(0 ${q(4 - p * 16)})" d="M${x} 80 q-4 -6 0 -12 q4 -6 0 -12" stroke="${C.cream}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="${q(opacity, 0.1)}"/>`;
	};
	return frame(
		`<g transform="translate(-8 -10)">${sloth({ mood: on ? "awake" : "sleep", t, longBody: true, sitting: true })}</g>` +
			(on ? steam(0, 86) + steam(1.5, 96) : "") +
			`<path d="M104 90 q10 0 10 8 q0 8 -10 8" stroke="#D9C094" stroke-width="4" fill="none"/>` +
			`<path d="M78 84 h28 l-2 26 q-1 4 -5 4 h-14 q-4 0 -5 -4 z" fill="url(#ldMug)"/>` +
			`<ellipse cx="92" cy="84" rx="14" ry="3.5" fill="#6B4226"/>` +
			`<ellipse cx="92" cy="84" rx="14" ry="3.5" fill="none" stroke="#F7EBD3" stroke-width="1.5"/>` +
			`<path d="M84 98 q4 -3 8 0 q4 3 8 0" stroke="${C.leaf}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
			pawBottom(80, 98) +
			pill(label, on ? C.leaf : C.pillDark, on ? C.night : C.cream),
		on ? C.leaf : undefined,
	);
}

export type KnobOptions = {
	/** What is turned: the speaker, the screen (sun) or an app (monogram). */
	kind: "speaker" | "sun" | "app";
	/** 0…100, or undefined while unknown. */
	level?: number;
	dir?: "up" | "down";
	muted?: boolean;
	/** Up to 3 letters for `kind: "app"`. */
	mono?: string;
	/** A brand logo for the middle instead of the letters. */
	logo?: string;
	label: string;
	t: number;
};

/** A big knob the paw turns: volume, app volume, brightness. The arc shows the level. */
export function knobKey(o: KnobOptions): string {
	const level = Math.max(0, Math.min(100, o.level ?? 0));
	const cx = 54, cy = 50, r = 25, arc = 33;
	const a0 = -225, sweep = 270;
	const point = (deg: number, rr: number) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)] as const;
	const arcPath = (from: number, to: number) => {
		const [x1, y1] = point(from, arc);
		const [x2, y2] = point(to, arc);
		return `M${q(x1, 0.1)} ${q(y1, 0.1)} A${arc} ${arc} 0 ${to - from > 180 ? 1 : 0} 1 ${q(x2, 0.1)} ${q(y2, 0.1)}`;
	};
	const end = a0 + (sweep * level) / 100;
	const tone = o.muted ? C.coral : o.kind === "sun" ? C.honey : C.leaf;
	const wobble = o.dir ? q(swing(o.t, 1.6) * (o.dir === "up" ? 8 : -8), 0.5) : "0";
	const [mx, my] = point(end, r - 7);
	const center =
		o.kind === "speaker"
			? `<path d="M${cx - 9} ${cy - 4} h5 l7 -6 v20 l-7 -6 h-5 z" fill="${C.night}"/>` +
				(o.muted
					? `<path d="M${cx + 6} ${cy - 3} l6 6 M${cx + 12} ${cy - 3} l-6 6" stroke="${C.coral}" stroke-width="2.4" stroke-linecap="round"/>`
					: `<path d="M${cx + 6} ${cy - 4} q3 4 0 8" stroke="${C.night}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`)
			: o.kind === "sun"
				? `<circle cx="${cx}" cy="${cy}" r="6" fill="${C.honey}"/><path d="M${cx} ${cy - 12} v3 M${cx} ${cy + 9} v3 M${cx - 12} ${cy} h3 M${cx + 9} ${cy} h3 M${cx - 8.5} ${cy - 8.5} l2 2 M${cx + 6.5} ${cy + 6.5} l2 2 M${cx - 8.5} ${cy + 8.5} l2 -2 M${cx + 6.5} ${cy - 6.5} l2 -2" stroke="${C.honey}" stroke-width="2.4" stroke-linecap="round"/>`
				: o.logo && LOGOS[o.logo]
					? logoMark(o.logo, cx, cy, 24, LOGOS[o.logo]!.hex)
					: text(o.mono ?? "?", { x: cx, y: cy + 5, size: 14, max: 26, fill: C.night, weight: 700 });
	const badge = o.dir
		? `<circle cx="96" cy="20" r="11" fill="${o.dir === "up" ? C.honey : C.sky}"/>` +
			`<path d="M90 20 h12${o.dir === "up" ? " M96 14 v12" : ""}" stroke="${C.night}" stroke-width="3.2" stroke-linecap="round"/>`
		: "";
	return frame(
		`<path d="${arcPath(a0, a0 + sweep)}" stroke="#0E130C" stroke-width="6" fill="none" stroke-linecap="round"/>` +
			(o.level !== undefined && level > 0 ? `<path d="${arcPath(a0, Math.max(a0 + 1, end))}" stroke="${tone}" stroke-width="6" fill="none" stroke-linecap="round"/>` : "") +
			`<g transform="rotate(${wobble} ${cx} ${cy})">` +
			`<circle cx="${cx}" cy="${cy + 2}" r="${r}" fill="#0E130C" opacity="0.5"/>` +
			`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.cream}" stroke="#C9AE80" stroke-width="2"/>` +
			`<circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#D9C094" stroke-width="1.2" stroke-dasharray="2 3"/>` +
			`</g>` +
			(o.level !== undefined ? `<circle cx="${q(mx, 0.1)}" cy="${q(my, 0.1)}" r="2.6" fill="${tone}"/>` : "") +
			center +
			badge +
			`<g transform="rotate(${wobble} ${cx} ${cy})">${pawRight(56)}</g>` +
			pill(o.label, o.muted ? C.coral : C.pillDark, o.muted ? C.night : C.cream),
		o.muted ? C.coral : undefined,
	);
}

/** Previous / next: a spinning record the paw nudges along. */
export function vinylKey(dir: "next" | "previous", t: number): string {
	const spin = q((t * (dir === "next" ? 40 : -40)) % 360, 2);
	const arrow =
		dir === "next"
			? `<path d="M86 30 l10 8 l-10 8 z M96 30 l10 8 l-10 8 z" fill="${C.cream}"/><path d="M108 30 v16" stroke="${C.cream}" stroke-width="3.2" stroke-linecap="round"/>`
			: `<path d="M34 30 l-10 8 l10 8 z M24 30 l-10 8 l10 8 z" fill="${C.cream}"/><path d="M12 30 v16" stroke="${C.cream}" stroke-width="3.2" stroke-linecap="round"/>`;
	const cx = dir === "next" ? 54 : 66;
	return frame(
		`<g transform="rotate(${spin} ${cx} 52)">` +
			`<circle cx="${cx}" cy="52" r="31" fill="#141414" stroke="#2E2E2E" stroke-width="1.5"/>` +
			`<circle cx="${cx}" cy="52" r="25" fill="none" stroke="#2A2A2A" stroke-width="1"/><circle cx="${cx}" cy="52" r="19" fill="none" stroke="#2A2A2A" stroke-width="1"/>` +
			`<path d="M${cx} 21 A31 31 0 0 1 ${cx + 26} 36" stroke="${C.cream}" stroke-width="2" fill="none" opacity="0.25"/>` +
			`<circle cx="${cx}" cy="52" r="11" fill="${C.honey}"/><circle cx="${cx + 4}" cy="49" r="2.4" fill="${C.coral}"/><circle cx="${cx}" cy="52" r="2" fill="#141414"/>` +
			`</g>` +
			arrow +
			(dir === "next" ? pawBottom(30, 84) : `<g transform="translate(120 0) scale(-1 1)">${pawBottom(30, 84)}</g>`) +
			pill(dir === "next" ? tr("Weiter") : tr("Zurück"), C.pillDark, C.cream),
	);
}

/** A retro radio; notes float out while it plays. */
export function radioKey(station: string, playing: boolean, t: number): string {
	const note = (phase: number, x: number) => {
		const p = ((t + phase) % 3) / 3;
		const opacity = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
		return `<text x="${q(x + p * 8)}" y="${q(44 - p * 22)}" font-size="14" font-weight="700" fill="${C.leaf}" opacity="${q(opacity, 0.1)}" font-family="Segoe UI Symbol, Arial">♪</text>`;
	};
	const needle = playing ? q(80 + swing(t, 3) * 3, 0.25) : "80";
	return frame(
		`<path d="M78 40 L96 14" stroke="#B9B2A8" stroke-width="2.4" stroke-linecap="round"/><circle cx="96" cy="14" r="3" fill="${playing ? C.coral : "#B9B2A8"}"/>` +
			`<rect x="16" y="40" width="88" height="48" rx="10" fill="${C.honey}" stroke="#D9982E" stroke-width="2"/>` +
			`<circle cx="40" cy="64" r="16" fill="${INK}"/>` +
			`<g fill="${C.honey}" opacity="0.55"><circle cx="34" cy="58" r="2"/><circle cx="40" cy="58" r="2"/><circle cx="46" cy="58" r="2"/><circle cx="34" cy="64" r="2"/><circle cx="40" cy="64" r="2"/><circle cx="46" cy="64" r="2"/><circle cx="34" cy="70" r="2"/><circle cx="40" cy="70" r="2"/><circle cx="46" cy="70" r="2"/></g>` +
			`<rect x="62" y="50" width="34" height="14" rx="3" fill="${C.cream}"/>` +
			`<path d="M66 57 h26" stroke="#C9AE80" stroke-width="1" stroke-dasharray="2 2"/>` +
			`<path d="M${needle} 51 v12" stroke="${C.coral}" stroke-width="2"/>` +
			`<circle cx="70" cy="76" r="5" fill="${C.cream}"/><circle cx="88" cy="76" r="5" fill="${C.cream}"/>` +
			(playing ? note(0, 10) + note(1.5, 98) : "") +
			pawLeft(64) +
			pill(station, playing ? C.leaf : C.pillDark, playing ? C.night : C.cream),
		playing ? C.leaf : undefined,
	);
}

/** A camera the paw holds; the flash goes off now and then. */
export function cameraKey(label: string, t: number): string {
	const flash = t % 3.2 > 2.9;
	return frame(
		(flash ? `<circle cx="60" cy="50" r="46" fill="${C.cream}" opacity="0.18"/>` : "") +
			`<rect x="26" y="34" width="74" height="48" rx="8" fill="${C.cream}" stroke="#C9AE80" stroke-width="1.5"/>` +
			`<path d="M46 34 l6 -9 h20 l6 9 z" fill="${C.cream}" stroke="#C9AE80" stroke-width="1.5"/>` +
			`<rect x="84" y="40" width="10" height="6" rx="2" fill="${flash ? C.honey : "#D9C094"}"/>` +
			`<circle cx="63" cy="58" r="17" fill="${INK}"/><circle cx="63" cy="58" r="11" fill="#26324A"/><circle cx="63" cy="58" r="6" fill="${C.sky}"/><circle cx="59" cy="54" r="2.4" fill="${C.cream}" opacity="0.8"/>` +
			`<circle cx="36" cy="42" r="2.4" fill="${C.coral}"/>` +
			pawLeft(64) +
			pill(label, C.pillDark, C.cream),
	);
}

/** A padlock hanging from the twig by the sloth's claws. */
export function lockKey(label: string, t: number): string {
	const sway = q(-3 + swing(t, 5) * 6, 0.25);
	return frame(
		TWIG +
			`<g transform="rotate(${sway} 60 12)">` +
			`<path d="M46 52 v-14 a14 14 0 0 1 28 0 v14" stroke="#B9B2A8" stroke-width="7" fill="none"/>` +
			`<rect x="36" y="50" width="48" height="38" rx="8" fill="${C.honey}" stroke="#D9982E" stroke-width="2"/>` +
			`<circle cx="60" cy="66" r="5" fill="${INK}"/><path d="M60 68 v9" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
			`</g>` +
			`<ellipse cx="60" cy="16" rx="9" ry="6" fill="#8A6747"/>` +
			clawPair("M53 19 q-2 5 1 9 M58 20 q-1 5 1 9 M63 20 q0 5 2 9 M68 19 q1 5 3 8", 3) +
			pill(label, C.pillDark, C.cream),
	);
}

/** The monitor fell asleep: the sloth's face on a dark screen. */
export function monitorKey(label: string, t: number): string {
	return frame(
		`<rect x="18" y="20" width="84" height="56" rx="6" fill="${C.cream}"/>` +
			`<rect x="23" y="25" width="74" height="46" rx="3" fill="url(#ldNight)"/>` +
			headAsleep("translate(39 20) scale(0.36)") +
			zs(t, 76, 46, 10) +
			`<path d="M52 76 l-4 10 h24 l-4 -10" fill="#D9C094"/>` +
			pill(label, C.pillDark, C.cream),
	);
}

/** Headphones on the sloth: Discord sound. Deaf: earmuffs, eyes shut. */
export function headphonesKey(deaf: boolean | undefined, label: string, t: number): string {
	const cup = deaf ? C.coral : C.sky;
	return frame(
		BRANCH +
			sloth({ mood: deaf ? "sleep" : "awake", t }) +
			`<path d="M28 66 q0 -36 32 -36 q32 0 32 36" stroke="#2A2A2A" stroke-width="5" fill="none"/>` +
			`<rect x="20" y="60" width="14" height="22" rx="6" fill="${cup}"/><rect x="86" y="60" width="14" height="22" rx="6" fill="${cup}"/>` +
			(deaf ? `<path d="M14 92 L106 38" stroke="${C.coral}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>` : "") +
			pill(label, deaf ? C.coral : C.pillDark, deaf ? C.night : C.cream),
		deaf ? C.coral : undefined,
	);
}

/** A tiny glyph per output kind, for signs. */
export const OUTPUT_ART = {
	headphones: `<path d="M18 70 v-14 a42 42 0 0 1 84 0 v14" stroke="${INK}" stroke-width="10" fill="none"/><rect x="8" y="62" width="26" height="40" rx="10" fill="${INK}"/><rect x="86" y="62" width="26" height="40" rx="10" fill="${INK}"/>`,
	speaker: `<rect x="30" y="10" width="60" height="100" rx="10" fill="${INK}"/><circle cx="60" cy="75" r="20" fill="${C.cream}"/><circle cx="60" cy="75" r="8" fill="${INK}"/><circle cx="60" cy="34" r="9" fill="${C.cream}"/>`,
	monitor: `<rect x="6" y="14" width="108" height="70" rx="8" fill="${INK}"/><rect x="16" y="24" width="88" height="50" rx="3" fill="${C.sky}"/><path d="M40 104 h40 M60 84 v20" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`,
} as const;

/** Escapes a value for use inside our own markup. */
export const safe = esc;

// ---------------------------------------------------------------- website artboard

type Eyes = "open" | "closed" | "squeeze" | "happy";
type Mouth = "open" | "smile" | "wavy" | "calm";

/** The sloth's head alone, as on the canvas's website keys. */
function head(transform: string, eyes: Eyes, mouth: Mouth): string {
	const eyeArt = {
		open:
			`<circle cx="46" cy="69.5" r="4.4" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/><circle cx="47.5" cy="68" r="1.5" fill="#fff"/>` +
			`<circle cx="74" cy="69.5" r="4.4" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/><circle cx="75.5" cy="68" r="1.5" fill="#fff"/>`,
		closed: `<path d="M41 70 q5 3.5 10 0 M69 70 q5 3.5 10 0" stroke="#F3E5C8" stroke-width="2" fill="none" stroke-linecap="round"/>`,
		squeeze: `<path d="M42 66 l7 4 l-7 4 M78 66 l-7 4 l7 4" stroke="#F3E5C8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
		happy: `<path d="M41 72 q5 -5 10 0 M69 72 q5 -5 10 0" stroke="#F3E5C8" stroke-width="2" fill="none" stroke-linecap="round"/>`,
	}[eyes];
	const mouthArt = {
		open: `<path d="M53 87 q7 7 14 0 z" fill="#3A1F17"/><path d="M56 89.5 q4 2.5 8 0" stroke="#E07B6A" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
		smile: `<path d="M55 88 q5 2 10 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M63 88.6 q3 0 3 3 q-1.5 2 -3 0 z" fill="#E07B6A"/>`,
		wavy: `<path d="M53 89 q2 -2 4 0 q2 2 4 0 q2 -2 4 0 q2 2 4 0" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
		calm: `<path d="M55 88 q5 2.5 10 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
	}[mouth];
	return (
		`<g transform="${transform}">` +
		`<path d="M60 37 c6 -1 10 2 13 1 c5 1 8 4 11 5 c4 3 6 6 8 9 c3 4 3 8 4 11 c1 5 0 9 -1 13 c-1 5 -3 8 -6 11 c-3 4 -7 6 -11 8 c-5 2 -11 3 -18 3 c-7 0 -13 -1 -18 -3 c-4 -2 -8 -4 -11 -8 c-3 -3 -5 -6 -6 -11 c-1 -4 -2 -8 -1 -13 c1 -3 1 -7 4 -11 c2 -3 4 -6 8 -9 c3 -1 6 -4 11 -5 c3 1 7 -2 13 -1 z" fill="url(#ldHead)"/>` +
		`<path d="M50 39 l-3 -5 M56 37.5 l-1 -6 M62 37.5 l1 -6 M68 38.5 l3 -5" stroke="#7E5C3E" stroke-width="3" stroke-linecap="round"/>` +
		`<path d="M60 50 c10 0 17 3 22 9 c5 6 6 13 5 19 c-1 7 -5 12 -10 15 c-5 3 -11 4 -17 4 c-6 0 -12 -1 -17 -4 c-5 -3 -9 -8 -10 -15 c-1 -6 0 -13 5 -19 c5 -6 12 -9 22 -9 z" fill="url(#ldFace)"/>` +
		`<path d="M52 53 q8 -12 16 0 z" fill="#F7EAD0"/>` +
		`<path d="M53 66 c1 4 -2 8 -6 10 c-4 3 -9 6 -13 5 c-3 -1 -3 -5 0 -9 c3 -4 7 -8 11 -9 c4 -1 7 0 8 3 z" fill="url(#ldPatch)"/>` +
		`<path d="M67 66 c-1 4 2 8 6 10 c4 3 9 6 13 5 c3 -1 3 -5 0 -9 c-3 -4 -7 -8 -11 -9 c-4 -1 -7 0 -8 3 z" fill="url(#ldPatch)"/>` +
		eyeArt +
		`<ellipse cx="40" cy="85" rx="5" ry="2.6" fill="#E79A7E" opacity="0.45"/><ellipse cx="80" cy="85" rx="5" ry="2.6" fill="#E79A7E" opacity="0.45"/>` +
		`<path d="M54 78 q6 -4 12 0 q1 4 -3 6 q-3 2 -6 0 q-4 -2 -3 -6 z" fill="#2A1C14"/>` +
		mouthArt +
		`</g>`
	);
}

const blink = (t: number, period = 1.6) => q(0.25 + swing(t, period) * 0.75, 0.1);

/** Screenshot: the sloth in the viewfinder, now and then the flash goes off. */
export function viewfinderKey(label: string, t: number): string {
	const p = (t % 3.2) / 3.2;
	const flash = p > 0.8 && p < 0.92 ? q(0.75 * (1 - Math.abs(p - 0.86) / 0.06), 0.05) : "0";
	return frame(
		head("translate(13.2 -0.6) scale(0.78)", "open", "open") +
			`<path d="M16 28 v-10 h12 M92 18 h12 v10 M104 76 v10 h-12 M28 86 h-12 v-10" stroke="${C.cream}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
			`<circle cx="99" cy="11" r="3" fill="${C.coral}" opacity="${blink(t)}"/>` +
			(flash !== "0" ? `<rect width="120" height="120" fill="#FFFFFF" opacity="${flash}"/>` : "") +
			pill(label, C.pillDark, C.cream),
	);
}

/** Locked: the sloth pulls the blanket up and sleeps. */
export function blanketKey(label: string, t: number): string {
	const lift = q(4 - swing(t, 4) * 4, 0.25);
	return frame(
		`<ellipse cx="60" cy="58" rx="46" ry="16" fill="#E9DCC1"/>` +
			head("translate(16.8 1.6) scale(0.72) rotate(-8 60 70)", "closed", "calm") +
			`<g transform="translate(0 ${lift})"><path d="M2 66 Q30 58 60 64 T118 62 L118 96 L2 96 Z" fill="${C.sky}"/>` +
			`<path d="M2 74 Q30 66 60 72 T118 70" stroke="#4E95B8" stroke-width="2" fill="none"/>` +
			`<ellipse cx="45" cy="65" rx="7" ry="5" fill="#8A6747"/><ellipse cx="75" cy="65" rx="7" ry="5" fill="#8A6747"/></g>` +
			zs(t, 96, 30, 12, C.sky) +
			`<rect x="10" y="17" width="15" height="12" rx="2.5" fill="${C.honey}"/><path d="M13 17 v-3 a4.5 4.5 0 0 1 9 0 v3" stroke="${C.honey}" stroke-width="2.2" fill="none"/>` +
			pill(label, C.pillDark, C.cream),
	);
}

/** Muted and deaf: the sloth holds its ears shut, the microphone is crossed out. */
export function earsKey(label: string, t: number): string {
	const squeeze = q(1 - swing(t, 1.6) * 0.04, 0.005);
	return frame(
		`<g transform="translate(60 56) scale(${squeeze} 1) translate(-60 -56)">` +
			head("translate(9 -3.5) scale(0.85)", "squeeze", "wavy") +
			`<path d="M18 96 Q14 72 26 54" stroke="url(#ldArm)" stroke-width="12" fill="none" stroke-linecap="round"/>` +
			`<path d="M102 96 Q106 72 94 54" stroke="url(#ldArm)" stroke-width="12" fill="none" stroke-linecap="round"/>` +
			`<ellipse cx="27" cy="52" rx="8.5" ry="10" fill="#8A6747"/><ellipse cx="93" cy="52" rx="8.5" ry="10" fill="#8A6747"/>` +
			`<path d="M23 46 h7 M23 51 h8 M23 56 h7 M97 46 h-7 M97 51 h-8 M97 56 h-7" stroke="#5E432D" stroke-width="1.3" stroke-linecap="round"/></g>` +
			`<g opacity="${blink(t)}"><rect x="98" y="7" width="9" height="14" rx="4.5" fill="${C.coral}"/>` +
			`<path d="M95 16 q7.5 9 15 0 M102.5 22 v4" stroke="${C.coral}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
			`<path d="M94 7 l18 18" stroke="${C.cream}" stroke-width="2.4" stroke-linecap="round"/></g>` +
			pill(label, C.coral, C.night),
		C.coral,
	);
}

/** Volume: the sloth listens, the bars move; their height follows the level. */
export function listenKey(o: { label: string; level?: number; muted?: boolean; dir?: "up" | "down"; t: number }): string {
	const scale = o.level === undefined ? 1 : 0.35 + (Math.max(0, Math.min(100, o.level)) / 100) * 0.65;
	const bar = (i: number, x: number, y: number, h: number) => {
		const s = o.muted ? 0.2 : (0.45 + swing(o.t, 1.4, -i * 0.35) * 0.55) * scale;
		const hh = q(h * s, 0.5);
		return `<rect x="${x}" y="${q(78 - h * s, 0.5)}" width="7" height="${hh}" rx="3" fill="${o.muted ? C.coral : C.leaf}"/>`;
	};
	const badge = o.dir
		? `<circle cx="100" cy="20" r="11" fill="${o.dir === "up" ? C.honey : C.sky}"/>` +
			`<path d="M94 20 h12${o.dir === "up" ? " M100 14 v12" : ""}" stroke="${C.night}" stroke-width="3.2" stroke-linecap="round"/>`
		: "";
	return frame(
		head("translate(-1 19.5) scale(0.55)", o.muted ? "closed" : "open", o.muted ? "calm" : "open") +
			bar(0, 64, 66, 12) + bar(1, 74, 58, 20) + bar(2, 84, 50, 28) + bar(3, 94, 42, 36) +
			(o.muted ? "" : `<path d="M54 44 q5 6 0 12 M58 40 q8 10 0 20" stroke="${C.cream}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>`) +
			badge +
			pill(o.label, o.muted ? C.coral : C.pillDark, o.muted ? C.night : C.cream),
		o.muted ? C.coral : undefined,
	);
}

/** Zocken: the sloth with a controller, bobbing along. */
export function controllerKey(label: string, t: number, steam = true): string {
	const bob = q(-4 + swing(t, 1.8) * 8, 0.25);
	return frame(
		`<g transform="rotate(${bob} 60 70)">${head("translate(12 -8) scale(0.8)", "open", "smile")}</g>` +
			`<path d="M34 70 q-9 0 -10 11 q-1 9 6 10 q5 0 9 -5 h42 q4 5 9 5 q7 -1 6 -10 q-1 -11 -10 -11 z" fill="#3A4A35" stroke="#0B0E0A" stroke-width="1.5"/>` +
			`<path d="M33 79 h8 M37 75 v8" stroke="${C.cream}" stroke-width="2.2" stroke-linecap="round"/>` +
			`<circle cx="80" cy="76" r="3" fill="${C.honey}" opacity="${blink(t)}"/><circle cx="87" cy="81" r="3" fill="${C.coral}" opacity="${blink(t + 0.8)}"/>` +
			`<ellipse cx="27" cy="84" rx="7" ry="6" fill="#8A6747"/><ellipse cx="93" cy="84" rx="7" ry="6" fill="#8A6747"/>` +
			(steam ? STEAM_BADGE : "") +
			pill(label, C.leaf, C.night),
	);
}

/** Pomodoro as on the canvas: a tomato in a ring, the claws hold on to it. */
export function tomatoKey(o: { center: string; label: string; progress: number; tone: string; labelTone?: string }): string {
	const length = 226;
	return frame(
		`<circle cx="60" cy="54" r="36" stroke="#2E3D29" stroke-width="5" fill="none"/>` +
			(o.progress > 0 ? `<circle cx="60" cy="54" r="36" stroke="${o.tone}" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="${q(length * Math.min(1, o.progress), 0.5)} ${length}" transform="rotate(-90 60 54)"/>` : "") +
			`<circle cx="60" cy="58" r="25" fill="${C.coral}"/>` +
			`<path d="M52 34 q8 -6 16 0 q-8 3 -16 0 z" fill="#7FA545"/>` +
			text(o.center, { x: 60, y: 66, size: 21, max: 40, fill: "#FCF4E3", weight: 700, min: 12 }) +
			`<ellipse cx="41" cy="37" rx="7" ry="5" fill="#8A6747"/><ellipse cx="79" cy="37" rx="7" ry="5" fill="#8A6747"/>` +
			clawPair("M35 36 q3 -6 6 0 q1 4 -1 8 M39 35 q3 -6 6 0 q1 4 -1 8 M43 36 q3 -6 6 0 q1 4 -1 8", 3.2) +
			clawPair("M73 36 q3 -6 6 0 q1 4 -1 8 M77 35 q3 -6 6 0 q1 4 -1 8 M81 36 q3 -6 6 0 q1 4 -1 8", 3.2) +
			pill(o.label, o.labelTone ?? C.pillDark, o.labelTone ? C.night : C.cream),
	);
}
