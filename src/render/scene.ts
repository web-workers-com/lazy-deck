/**
 * The full-deck alert: one picture across every key, cut into windows.
 *
 * Scene units match the design: keys are 124 wide with a 14 gap (pitch 138),
 * so the picture lines up with the real gaps between keys. The scene is a
 * list of items with bounding boxes; each key only gets the items it shows,
 * so a key whose part of the picture did not move gets the same image again
 * and is not resent.
 */
import type { Alert } from "../alerts.js";
import { roleAt } from "../roles.js";
import { sloth } from "./sloth.js";
import { BODY, C, keyImage, pill, q, swing, text } from "./svg.js";

export const PITCH = 138;
export const KEY = 124;

type Box = [number, number, number, number];
export type Item = { svg: string; box: Box };

export type ExplainState = "idle" | "busy" | "done" | "failed";

export type SceneOptions = {
	columns: number;
	rows: number;
	alert: Alert | undefined;
	t: number;
	now?: number;
	explain?: ExplainState;
};

const keyBox = (c: number, r: number): Box => [c * PITCH, r * PITCH, c * PITCH + KEY, r * PITCH + KEY];

/** "seit 3 min" in a few characters. */
export function since(createdAt: number, now: number): string {
	const minutes = Math.floor((now - createdAt) / 60_000);
	if (minutes < 1) {
		return "gerade eben";
	}
	return minutes < 60 ? `seit ${minutes} min` : `seit ${Math.floor(minutes / 60)} h`;
}

function placeholder(now: number): Alert {
	return { id: 0, level: "wait", title: "Alles ruhig", source: "Lazy Deck", createdAt: now, stage: 2 };
}

export function alertScene(o: SceneOptions): Item[] {
	const { columns, rows, t } = o;
	const now = o.now ?? Date.now();
	const alert = o.alert ?? placeholder(now);
	const error = alert.level === "error";
	const tone = error ? C.coral : C.honey;
	const toneLight = error ? "#F2927C" : "#F7C964";
	const toneDeep = error ? "#D85E45" : "#E3A12F";
	const W = columns * PITCH - 14;
	const H = rows * PITCH - 14;
	const full: Box = [-20, -20, W + 20, H + 20];
	const items: Item[] = [];
	const add = (svg: string, box: Box) => items.push({ svg, box });

	// Where each role sits.
	const at = new Map<string, [number, number]>();
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < columns; c++) {
			const role = roleAt(columns, rows, c, r);
			if (role !== "picture") {
				at.set(role, [c * PITCH, r * PITCH]);
			}
		}
	}
	const sideColumns = columns >= 3;

	// Sloth placement.
	const s = Math.min(H / 125, (sideColumns ? W - 2 * PITCH : W) / 80);
	const tx = W / 2 - 60 * s;
	const ty = 0.45 * H - 69.5 * s;
	const X = (lx: number) => tx + lx * s;
	const Y = (ly: number) => ty + ly * s;
	const k = s / 3.2;
	const hy = Y(22);

	// Background and glow.
	add(
		`<defs><radialGradient id="alBg" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="${error ? "#3E2420" : "#3B3A22"}"/><stop offset="1" stop-color="#121810"/></radialGradient>` +
			`<radialGradient id="alGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${tone}" stop-opacity="0.5"/><stop offset="1" stop-color="${tone}" stop-opacity="0"/></radialGradient>` +
			`<linearGradient id="alTone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${toneLight}"/><stop offset="1" stop-color="${toneDeep}"/></linearGradient></defs>` +
			`<rect x="-20" y="-20" width="${W + 40}" height="${H + 40}" fill="url(#alBg)"/>` +
			`<circle cx="${q(W / 2)}" cy="${q(0.475 * H)}" r="${q(0.55 * H)}" fill="url(#alGlow)"/>`,
		full,
	);

	// Vines down the inner edges of the side columns.
	if (columns >= 4) {
		for (const [x, flip] of [
			[PITCH + 24, 1],
			[W - PITCH - 18, -1],
		] as const) {
			let leaves = "";
			for (let y = hy + 60 * k; y < H; y += 70 * k) {
				const dir = Math.round((y - hy) / (70 * k)) % 2 === 0 ? flip : -flip;
				leaves += `<path d="M${q(x)} ${q(y)} q${q(-16 * k * dir)} ${q(-2 * k)} ${q(-20 * k * dir)} ${q(10 * k)} q${q(12 * k * dir)} ${q(4 * k)} ${q(20 * k * dir)} ${q(-10 * k)} z" fill="#7FA545"/>`;
			}
			add(
				`<path d="M${q(x)} ${q(hy)} C ${q(x - 8)} ${q(hy + 70 * k)}, ${q(x + 8)} ${q(hy + 140 * k)}, ${q(x - 4)} ${q(hy + 220 * k)} S ${q(x + 4)} ${q(H - 40)}, ${q(x)} ${H + 10}" stroke="#4E6B2A" stroke-width="${q(3.5 * k)}" fill="none" stroke-linecap="round"/>` +
					leaves,
				[x - 30, hy, x + 30, H + 20],
			);
		}
	}

	// The branch, across everything but the talking column.
	const end = sideColumns ? W - PITCH + 10 : W + 10;
	add(
		`<path d="M-10 ${q(hy - 12 * k)} C ${q(W * 0.2)} ${q(hy - 16 * k)}, ${q(W * 0.45)} ${q(hy - 6 * k)}, ${q(end)} ${q(hy - 4 * k)} L ${q(end)} ${q(hy + 8 * k)} C ${q(W * 0.45)} ${q(hy + 12 * k)}, ${q(W * 0.2)} ${q(hy + 18 * k)}, -10 ${q(hy + 16 * k)} Z" fill="url(#ldBark)"/>` +
			`<path d="M-10 ${q(hy - 10 * k)} C ${q(W * 0.2)} ${q(hy - 14 * k)}, ${q(W * 0.45)} ${q(hy - 4 * k)}, ${q(end)} ${q(hy - 2 * k)}" stroke="#B48E66" stroke-width="${q(2 * k)}" fill="none" opacity="0.7"/>` +
			`<path d="M${q(end - 12)} ${q(hy)} q${q(16 * k)} ${q(-18 * k)} ${q(24 * k)} ${q(-2 * k)} q${q(-10 * k)} ${q(10 * k)} ${q(-24 * k)} ${q(2 * k)} z" fill="${C.leaf}"/>`,
		[-20, hy - 30 * k, end + 40, hy + 30 * k],
	);

	// Reason sign: hangs from the branch, says what happened.
	const reason = at.get("reason");
	if (reason) {
		const [kx, ky] = reason;
		const top = ky + 10;
		let svg = "";
		if (ky > hy) {
			svg += `<path d="M${kx + 24} ${q(hy)} V ${top + 4} M${kx + 100} ${q(hy)} V ${top + 4}" stroke="#C9B38C" stroke-width="2"/>`;
		}
		svg +=
			`<rect x="${kx + 10}" y="${top}" width="104" height="104" rx="12" fill="${C.cream}"/>` +
			`<rect x="${kx + 10}" y="${top}" width="104" height="10" rx="5" fill="${tone}"/>` +
			`<circle cx="${kx + 24}" cy="${top + 26}" r="5" fill="${tone}"/>` +
			text(alert.source ?? "Lazy Deck", { x: kx + 34, y: top + 30, size: 10.5, max: 74, fill: "#6B5A48", anchor: "start", face: "body" }) +
			text(alert.title, { x: kx + 62, y: top + 60, size: 16, max: 92, fill: C.night, min: 11 }) +
			text(since(alert.createdAt, now), { x: kx + 62, y: top + 84, size: 11, max: 92, fill: "#6B5A48", face: "body", weight: 500 });
		add(svg, ky > hy ? [kx, hy - 4, kx + KEY, ky + KEY] : keyBox(kx / PITCH, ky / PITCH));
	}

	// The sloth itself.
	add(
		`<g transform="translate(${q(tx, 0.1)} ${q(ty, 0.1)}) scale(${q(s, 0.01)})">${sloth({ mood: error ? "panic" : "alert", t, wave: true, longBody: true })}</g>`,
		[X(-5), Y(5), X(125), H + 20],
	);

	// Waving arcs and exclamation marks.
	const fast = error ? 0.8 : 1.4;
	add(
		`<g opacity="${q(0.15 + swing(t, fast) * 0.85, 0.25)}" fill="none" stroke="${tone}" stroke-width="${q(4 * k)}" stroke-linecap="round">` +
			`<path d="M${q(X(110.6))} ${q(Y(22.6))} q${q(14 * k)} ${q(-4 * k)} ${q(22 * k)} ${q(6 * k)}"/>` +
			`<path d="M${q(X(109.4))} ${q(Y(17.6))} q${q(22 * k)} ${q(-8 * k)} ${q(36 * k)} ${q(8 * k)}"/></g>`,
		[X(105), Y(8), X(125), Y(28)],
	);
	for (const [lx, ly, size, offset] of [
		[15.6, 48.25, 44, 0],
		[106, 87, 40, 0.6],
	] as const) {
		const p = (t + offset) % 3.2;
		const pop = p > 2 && p < 2.6 ? 1.22 : 1;
		const fs = size * k * pop;
		add(
			`<text x="${q(X(lx))}" y="${q(Y(ly))}" text-anchor="middle" font-family="${BODY}" font-weight="800" font-size="${q(fs)}" fill="${tone}">!</text>`,
			[X(lx) - fs, Y(ly) - fs, X(lx) + fs, Y(ly) + fs * 0.3],
		);
	}

	// Speech bubble.
	const bubble = at.get("bubble");
	if (bubble) {
		const [kx, ky] = bubble;
		const angle = -3 + swing(t, fast) * 6;
		add(
			`<g transform="rotate(${q(angle)} ${kx + 30} ${ky + 110})">` +
				`<path d="M${kx + 22} ${ky + 12} h86 a10 10 0 0 1 10 10 v68 a10 10 0 0 1 -10 10 h-70 l-18 14 l4 -14 h-2 a10 10 0 0 1 -10 -10 v-68 a10 10 0 0 1 10 -10 z" fill="url(#alTone)"/>` +
				text(error ? "Hilfe!" : "Hey!", { x: kx + 64, y: ky + 56, size: error ? 26 : 32, max: 90, fill: C.night, weight: 700 }) +
				text(error ? "es brennt" : "schau mal", { x: kx + 64, y: ky + 80, size: 12.5, max: 86, fill: error ? "#3A1510" : "#3B2A10" }) +
				`</g>`,
			keyBox(kx / PITCH, ky / PITCH),
		);
	}

	// Ansehen / Erledigt.
	const view = at.get("view");
	if (view) {
		const [kx, ky] = view;
		const g = (inner: string) => `<g transform="translate(${kx + 2} ${ky + 2})">${inner}</g>`;
		let icon: string;
		if (alert.url) {
			const look = q(-3 + swing(t, 2.8) * 6);
			icon =
				`<path d="M28 46 q32 -30 64 0 q-32 30 -64 0 z" fill="#FCF4E3" stroke="${C.night}" stroke-width="4" stroke-linejoin="round"/>` +
				`<g transform="translate(${look} 0)"><circle cx="60" cy="46" r="11" fill="${C.night}"/><circle cx="64" cy="42" r="3.5" fill="#fff"/></g>`;
		} else {
			icon = `<path d="M38 46 l14 14 l30 -30" stroke="${C.night}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
		}
		add(
			`<rect x="${kx}" y="${ky}" width="${KEY}" height="${KEY}" fill="url(#alTone)"/>` +
				g(icon + pill(alert.url ? "Ansehen" : "Erledigt", C.night, toneLight)),
			keyBox(kx / PITCH, ky / PITCH),
		);
	}

	// Später.
	const snooze = at.get("snooze");
	if (snooze) {
		const [kx, ky] = snooze;
		const z = (phase: number, x: number, y: number, size: number) => {
			const p = ((t + phase) % 3.2) / 3.2;
			const opacity = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
			return `<text x="${q(x + p * 6)}" y="${q(y - p * 16)}" font-family="${BODY}" font-weight="700" font-size="${size}" fill="${C.sky}" opacity="${q(opacity, 0.25)}">z</text>`;
		};
		add(
			`<rect x="${kx}" y="${ky}" width="${KEY}" height="${KEY}" fill="${C.keyDark}"/>` +
				`<g transform="translate(${kx + 2} ${ky + 2})">` +
				z(0, 82, 30, 14) +
				z(1.6, 92, 22, 11) +
				`<path d="M46 22 a16 16 0 1 0 18 20 a12 12 0 1 1 -18 -20 z" fill="${C.cream}"/>` +
				text("5 min", { x: 60, y: 80, size: 20, max: 96, fill: C.cream }) +
				pill("Später", C.pillDark, C.cream) +
				`</g>`,
			keyBox(kx / PITCH, ky / PITCH),
		);
	}

	// Erklären.
	const explain = at.get("explain");
	if (explain) {
		const [kx, ky] = explain;
		const state = o.explain ?? "idle";
		const period = state === "busy" ? 1.5 : 6;
		const dx = q(-5 + swing(t, period) * 9);
		const dy = q(3 - swing(t, period, period / 3) * 6);
		const wriggle = q(-4 + swing(t, 1.2) * 8);
		const label = { idle: "Erklären", busy: "denkt …", done: "geöffnet", failed: "geht nicht" }[state];
		add(
			`<rect x="${kx}" y="${ky}" width="${KEY}" height="${KEY}" fill="${C.keyDark}"/>` +
				`<g transform="translate(${kx + 2} ${ky + 2})"><g transform="translate(${dx} ${dy})">` +
				`<g transform="rotate(${wriggle} 52 42)"><ellipse cx="52" cy="42" rx="9" ry="7" fill="${C.coral}"/><path d="M45 36 l-5 -5 M59 36 l5 -5 M43 44 h-6 M61 44 h6" stroke="${C.coral}" stroke-width="2" stroke-linecap="round"/></g>` +
				`<circle cx="54" cy="42" r="22" fill="url(#ldGlass)" stroke="#D9C094" stroke-width="5"/>` +
				`<path d="M70 58 l16 16" stroke="#A86C3E" stroke-width="8" stroke-linecap="round"/>` +
				`</g>` +
				pill(label, state === "failed" ? C.coral : C.pillDark, state === "failed" ? C.night : C.cream) +
				`</g>`,
			keyBox(kx / PITCH, ky / PITCH),
		);
	}

	// Pulsing key borders, one per key so each key only redraws its own.
	const opacity = q(0.3 + swing(t, error ? 1.6 : 2.8) * 0.7, 0.35);
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < columns; c++) {
			add(
				`<rect x="${c * PITCH + 1.5}" y="${r * PITCH + 1.5}" width="121" height="121" rx="20.5" fill="none" stroke="${tone}" stroke-width="3" opacity="${opacity}"/>`,
				keyBox(c, r),
			);
		}
	}

	return items;
}

/** One key's window onto the scene, as an image. */
export function alertKey(items: Item[], column: number, row: number): string {
	const [x0, y0, x1, y1] = keyBox(column, row);
	const inner = items
		.filter(({ box }) => box[0] < x1 && box[2] > x0 && box[1] < y1 && box[3] > y0)
		.map((item) => item.svg)
		.join("");
	return keyImage(inner, `${x0} ${y0} ${KEY} ${KEY}`);
}
