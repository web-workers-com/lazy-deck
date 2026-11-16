/**
 * Shared bits for drawing keys: brand colours, fonts, gradients and a text
 * fitter that keeps every label inside the shape it sits on.
 */

export const C = {
	night: "#1F2A1D",
	fur: "#8C6A4A",
	cream: "#F0DFC0",
	mask: "#4A3426",
	sky: "#6FB7D8",
	leaf: "#9CC25B",
	honey: "#F2B544",
	coral: "#E8735A",
	keyDark: "#1A2217",
	pillDark: "#2E3D29",
} as const;
import { lang, tr, type Lang } from "../i18n.js";

/** Fredoka is the brand face; the rest are what Stream Deck hosts usually have. */
export const DISPLAY = "Fredoka, 'Segoe UI Rounded', 'Segoe UI', 'Arial Rounded MT Bold', Arial, sans-serif";
export const BODY = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/** Average glyph width as a share of the font size, deliberately generous. */
const GLYPH = { display: 0.6, body: 0.56 } as const;
/** Chinese, Japanese and Korean glyphs are square: a full em each. */
const WIDE = /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿︰-﹏＀-｠￠-￦]/;

/** System fonts with the glyphs a language needs, tried after the brand fonts. */
const CJK: Partial<Record<Lang, string>> = {
	ja: "'Yu Gothic UI', Meiryo, 'Hiragino Sans', ",
	ko: "'Malgun Gothic', 'Apple SD Gothic Neo', ",
	zh_CN: "'Microsoft YaHei', 'PingFang SC', ",
	zh_TW: "'Microsoft JhengHei', 'PingFang TC', ",
};
const withCjk = (family: string) => family.replace("sans-serif", `${CJK[lang()] ?? ""}sans-serif`);

export function esc(value: string): string {
	return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

export type TextOptions = {
	x: number;
	y: number;
	size: number;
	/** Widest the text may get, in the same units as `x`. */
	max: number;
	fill: string;
	weight?: number;
	anchor?: "start" | "middle" | "end";
	face?: "display" | "body";
	/** Smallest size before the text is shortened instead. */
	min?: number;
};

/** Estimated width of `text` at `size`. */
export function textWidth(text: string, size: number, face: "display" | "body" = "display"): number {
	return [...text].reduce((w, ch) => w + (WIDE.test(ch) ? 1 : GLYPH[face]), 0) * size;
}

/**
 * Draws a line of text that never runs past `max`: it shrinks first, then
 * shortens with an ellipsis, and finally pins the width with `textLength`
 * so a wider fallback font cannot spill over either.
 */
export function text(value: string, o: TextOptions): string {
	const face = o.face ?? "display";
	const min = o.min ?? o.size * 0.7;
	let size = o.size;
	// Safety net: a German label that was not translated at its source.
	let line = tr(value);
	if (textWidth(line, size, face) > o.max) {
		size = Math.max(min, Math.floor((o.max / textWidth(line, 1, face)) * 10) / 10);
	}
	while (textWidth(line, size, face) > o.max + 0.01 && [...line].length > 2) {
		line = `${[...line].slice(0, -2).join("")}…`;
	}
	const width = textWidth(line, size, face);
	const pin = width > o.max * 0.85 ? ` textLength="${Math.min(width, o.max).toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : "";
	return (
		`<text x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" text-anchor="${o.anchor ?? "middle"}" ` +
		`font-family="${withCjk(face === "display" ? DISPLAY : BODY)}"
 font-weight="${o.weight ?? 600}" font-size="${size.toFixed(1)}" ` +
		`fill="${o.fill}"${pin}>${esc(line)}</text>`
	);
}

/** Gradients every key may reference. */
export const DEFS =
	`<linearGradient id="ldBark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A7550"/><stop offset="1" stop-color="#553C2B"/></linearGradient>` +
	`<radialGradient id="ldHead" cx="0.5" cy="0.38" r="0.65"><stop offset="0" stop-color="#B08A62"/><stop offset="1" stop-color="#76563A"/></radialGradient>` +
	`<linearGradient id="ldArm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C7752"/><stop offset="1" stop-color="#74553A"/></linearGradient>` +
	`<radialGradient id="ldFace" cx="0.5" cy="0.35" r="0.7"><stop offset="0" stop-color="#FCF4E3"/><stop offset="1" stop-color="#E4CDA4"/></radialGradient>` +
	`<radialGradient id="ldPatch" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#634634"/><stop offset="1" stop-color="#2F2018"/></radialGradient>` +
	`<radialGradient id="ldKey" cx="0.5" cy="0.3" r="0.85"><stop offset="0" stop-color="#2E3D29"/><stop offset="1" stop-color="#151C13"/></radialGradient>` +
	`<linearGradient id="ldSteam" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#111d2e"/><stop offset="0.212" stop-color="#051839"/><stop offset="0.407" stop-color="#0a1b48"/><stop offset="0.581" stop-color="#132e62"/><stop offset="0.738" stop-color="#144b7e"/><stop offset="0.873" stop-color="#136497"/><stop offset="1" stop-color="#1387b8"/></linearGradient>` +
	`<radialGradient id="ldNight" cx="0.5" cy="0.3" r="0.9"><stop offset="0" stop-color="#26324A"/><stop offset="1" stop-color="#121826"/></radialGradient>` +
	`<linearGradient id="ldMug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F7EBD3"/><stop offset="1" stop-color="#D9C094"/></linearGradient>` +
	`<linearGradient id="ldGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0DFC0" stop-opacity="0.28"/><stop offset="1" stop-color="#F0DFC0" stop-opacity="0.06"/></linearGradient>`;

/** The "Lazy Ease": slow in, slow out. `p` runs 0..1 and back over a period. */
export function swing(t: number, period: number, offset = 0): number {
	return (1 - Math.cos(((t + offset) / period) * Math.PI * 2)) / 2;
}

/** Rounds animation values so near-identical frames produce identical images. */
export function q(value: number, step = 0.5): string {
	return (Math.round(value / step) * step).toFixed(2).replace(/\.?0+$/, "");
}

/** Wraps markup into a complete key image as a data URI. */
export function keyImage(inner: string, viewBox = "0 0 120 120"): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="${viewBox}"><defs>${DEFS}</defs>${inner}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

/** A label pill along the bottom of a key, in 120-unit key coordinates. */
export function pill(label: string, bg: string, fg: string, dx = 0, dy = 0): string {
	// The canvas's label: near-black at 75 %, so the scene shows through a little.
	const fill = bg === C.pillDark ? `fill="#0B0F0A" opacity="0.75"` : `fill="${bg}"`;
	return (
		`<rect x="${8 + dx}" y="${91 + dy}" width="104" height="24" rx="12" ${fill}/>` +
		text(label, { x: 60 + dx, y: 108 + dy, size: 14, max: 94, fill: fg, min: 10 })
	);
}
