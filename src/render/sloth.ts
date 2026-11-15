/**
 * The Lazy Deck sloth, drawn in its own 120 x 120 space: hands on the branch
 * at y = 22, eyes at y = 69.5. Every pose is a function of time so the plugin
 * can animate it frame by frame.
 */
import { q, swing } from "./svg.js";

export type Mood = "sleep" | "awake" | "wait" | "alert" | "panic";

export type SlothOptions = {
	mood: Mood;
	/** Seconds; drives every animation. */
	t: number;
	/** Lift the right arm off the branch and wave it. */
	wave?: boolean;
	/** Let the body run past the bottom of the key (full-deck scenes). */
	longBody?: boolean;
	/** A paw held over the mouth (microphone muted). */
	paw?: boolean;
	/** Sitting, not hanging: no arms up to a branch. */
	sitting?: boolean;
};

const HEAD =
	"M60 37 c6 -1 10 2 13 1 c5 1 8 4 11 5 c4 3 6 6 8 9 c3 4 3 8 4 11 c1 5 0 9 -1 13 c-1 5 -3 8 -6 11 c-3 4 -7 6 -11 8 c-5 2 -11 3 -18 3 c-7 0 -13 -1 -18 -3 c-4 -2 -8 -4 -11 -8 c-3 -3 -5 -6 -6 -11 c-1 -4 -2 -8 -1 -13 c1 -3 1 -7 4 -11 c2 -3 4 -6 8 -9 c3 -1 6 -4 11 -5 c3 1 7 -2 13 -1 z";
const FACE =
	"M60 50 c10 0 17 3 22 9 c5 6 6 13 5 19 c-1 7 -5 12 -10 15 c-5 3 -11 4 -17 4 c-6 0 -12 -1 -17 -4 c-5 -3 -9 -8 -10 -15 c-1 -6 0 -13 5 -19 c5 -6 12 -9 22 -9 z";
const PATCH_L = "M53 66 c1 4 -2 8 -6 10 c-4 3 -9 6 -13 5 c-3 -1 -3 -5 0 -9 c3 -4 7 -8 11 -9 c4 -1 7 0 8 3 z";
const PATCH_R = "M67 66 c-1 4 2 8 6 10 c4 3 9 6 13 5 c3 -1 3 -5 0 -9 c-3 -4 -7 -8 -11 -9 c-4 -1 -7 0 -8 3 z";
const CLAWS_L = "M35.5 19 q3 -6 6 0 q1 4 -1 8 M39.5 18 q3 -6 6 0 q1 4 -1 8 M43.5 19 q3 -6 6 0 q1 4 -1 8";
const CLAWS_R = "M70.5 19 q3 -6 6 0 q1 4 -1 8 M74.5 18 q3 -6 6 0 q1 4 -1 8 M78.5 19 q3 -6 6 0 q1 4 -1 8";

const claws = (d: string) =>
	`<path d="${d}" stroke="#2A1C14" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
	`<path d="${d}" stroke="#EDE0C6" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;

function eyes(mood: Mood, t: number): string {
	switch (mood) {
		case "sleep":
			return `<path d="M41 70 q5 3.5 10 0 M69 70 q5 3.5 10 0" stroke="#120C08" stroke-width="2" fill="none" stroke-linecap="round"/>`;
		case "awake":
			return (
				`<circle cx="46" cy="69.5" r="4.4" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/><circle cx="47.5" cy="68" r="1.5" fill="#fff"/>` +
				`<circle cx="74" cy="69.5" r="4.4" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/><circle cx="75.5" cy="68" r="1.5" fill="#fff"/>` +
				`<path d="M40 62 q5 -2 10 0 M70 62 q5 -2 10 0" stroke="#5E432D" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
			);
		case "wait": {
			// One eye peeks open now and then.
			const open = swing(t, 5) > 0.55;
			const right = open
				? `<circle cx="74" cy="69.5" r="4.4" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/><circle cx="75.5" cy="68" r="1.5" fill="#fff"/>`
				: `<path d="M69 70 q5 3.5 10 0" stroke="#120C08" stroke-width="2" fill="none" stroke-linecap="round"/>`;
			return (
				`<path d="M41 70 q5 3.5 10 0" stroke="#120C08" stroke-width="2" fill="none" stroke-linecap="round"/>` +
				right +
				`<path d="M70 ${open ? 59.5 : 62} q5 -2.5 10 0" stroke="#5E432D" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
			);
		}
		case "alert": {
			const blink = t % 5 > 4.8;
			const ry = blink ? 0.6 : 5;
			const brow = q(-swing(t, 1.4) * 2, 0.5);
			return (
				`<ellipse cx="46" cy="69.5" rx="5" ry="${ry}" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/>` +
				`<ellipse cx="74" cy="69.5" rx="5" ry="${ry}" fill="#120C08" stroke="#8A6A52" stroke-width="0.8"/>` +
				(blink
					? ""
					: `<circle cx="47.8" cy="67.6" r="1.8" fill="#fff"/><circle cx="44.6" cy="71.4" r="0.8" fill="#fff"/>` +
						`<circle cx="75.8" cy="67.6" r="1.8" fill="#fff"/><circle cx="72.6" cy="71.4" r="0.8" fill="#fff"/>`) +
				`<path transform="translate(0 ${brow})" d="M39 59 q5 -4 11 -1.5 M70 57.5 q6 -2.5 11 1.5" stroke="#4A3426" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
			);
		}
		case "panic": {
			// Pupils jitter on a fixed little loop.
			const step = Math.floor(t * 5) % 4;
			const [jx, jy] = [
				[0, 0],
				[1.2, -0.8],
				[-1, 0.6],
				[0.8, 1],
			][step]!;
			return (
				`<circle cx="46" cy="69.5" r="6.4" fill="#FCF4E3" stroke="#2A1C14" stroke-width="1.2"/>` +
				`<circle cx="74" cy="69.5" r="6.4" fill="#FCF4E3" stroke="#2A1C14" stroke-width="1.2"/>` +
				`<circle cx="${46.5 + jx}" cy="${70 + jy}" r="2.3" fill="#120C08"/><circle cx="${73.5 + jx}" cy="${70 + jy}" r="2.3" fill="#120C08"/>` +
				`<path d="M38 60 q6 -1 11 -6 M71 54 q5 5 11 6" stroke="#4A3426" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
			);
		}
	}
}

function mouth(mood: Mood, t: number): string {
	switch (mood) {
		case "sleep":
		case "awake":
		case "wait":
			return `<path d="M55 88 q5 1.5 10 0" stroke="#4A3426" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
		case "alert": {
			const s = 0.8 + swing(t, 1.4) * 0.35;
			return (
				`<ellipse cx="60" cy="89.5" rx="${q(4.2 * s, 0.1)}" ry="${q(3.6 * s, 0.1)}" fill="#3A1F17"/>` +
				`<ellipse cx="60" cy="${q(89.5 + 2.2 * s, 0.1)}" rx="${q(2.6 * s, 0.1)}" ry="${q(1.2 * s, 0.1)}" fill="#E07B6A"/>`
			);
		}
		case "panic":
			return (
				`<path d="M51 87 q9 -3 18 0 q-1 7 -9 7 q-8 0 -9 -7 z" fill="#3A1F17"/>` +
				`<path d="M52.2 87.6 q7.8 -2.4 15.6 0 l-0.4 2 q-7.4 -2 -14.8 0 z" fill="#FCF4E3"/>`
			);
	}
}

function sweat(t: number): string {
	const drop = (x: number, y: number, phase: number, r: number) => {
		const p = ((t + phase) % 1.8) / 1.8;
		const opacity = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
		return `<path transform="translate(0 ${q(-3 + p * 15)})" opacity="${q(opacity, 0.1)}" d="M${x} ${y} q${r} ${r * 1.45} 0 ${r * 2} q-${r} -${r * 0.55} 0 -${r * 2} z" fill="#9FD3EA" stroke="#5E9DBB" stroke-width="0.6"/>`;
	};
	return drop(97, 44, 0, 4.5) + drop(22, 52, 0.9, 3.5);
}

/** Body rotation in degrees for the mood, around the hands. */
function lean(mood: Mood, t: number): number {
	switch (mood) {
		case "sleep":
			return 0;
		case "awake":
			return -2 + swing(t, 4.4) * 4;
		case "wait":
			return -3 + swing(t, 3.2) * 6;
		case "alert":
			return -2 + swing(t, 3) * 4;
		case "panic": {
			const p = (t % 1.6) / 1.6;
			return 3 * Math.sin(p * Math.PI * 4);
		}
	}
}

/** The sloth, in its own 120-unit space. */
export function sloth(o: SlothOptions): string {
	const { mood, t } = o;
	const breathe = mood === "sleep" ? 1 + swing(t, 4) * 0.025 : 1;
	const torso = o.longBody
		? "M28 140 L 28 124 C 27 108, 29 96, 36 90 C 44 84, 76 84, 84 90 C 91 96, 93 108, 92 124 L 92 140 Z"
		: "M28 124 C 27 108, 29 96, 36 90 C 44 84, 76 84, 84 90 C 91 96, 93 108, 92 124 Z";

	let rightArm =
		`<path d="M86 100 C 98 76, 96 46, 85 24 L 73 26 C 80 46, 80 72, 74 96 Z" fill="url(#ldArm)"/>` +
		`<path d="M92 78 l3 2 M93 64 l3 1 M91 52 l3 1 M87 40 l3 0" stroke="#5E432D" stroke-width="1.2" stroke-linecap="round"/>` +
		`<ellipse cx="79" cy="22" rx="8" ry="5.5" fill="#8A6747"/>` +
		claws(CLAWS_R);
	if (o.wave) {
		const period = mood === "panic" ? 0.8 : 1.4;
		const angle = 16 + swing(t, period) * 24;
		rightArm = `<g transform="rotate(${q(angle)} 78 94)">${rightArm}</g>`;
	}

	const tufts = mood === "panic" ? `<path d="M54 36 l-2 -7 M60 35.5 l0 -8 M66 36 l2 -7" stroke="#7E5C3E" stroke-width="2.4" stroke-linecap="round"/>` : "";
	const blush = mood === "sleep" ? 0.45 : 0.55;

	return (
		`<g transform="rotate(${q(lean(mood, t))} 60 22) translate(60 22) scale(${q(breathe, 0.005)}) translate(-60 -22)">` +
		`<path d="${torso}" fill="#74553A"/>` +
		`<path d="M30 104 l-3 3 M90 104 l3 3 M31 114 l-3 3 M89 114 l3 3 M40 90 l-2 3 M80 90 l2 3${o.longBody ? " M33 126 l-3 3 M87 126 l3 3" : ""}" stroke="#5E432D" stroke-width="1.2" stroke-linecap="round"/>` +
		(o.longBody
			? `<ellipse cx="60" cy="124" rx="21" ry="20" fill="#8A6747" opacity="0.55"/>` +
				`<path d="M52 110 l-2 4 M60 108 l0 4 M68 110 l2 4 M48 122 l-2 4 M56 120 l-1 4 M64 120 l1 4 M72 122 l2 4 M52 132 l-2 4 M60 131 l0 4 M68 132 l2 4" stroke="#6A4D34" stroke-width="1.2" stroke-linecap="round"/>`
			: "") +
		(o.sitting
			? ""
			: `<path d="M34 100 C 22 76, 24 46, 35 24 L 47 26 C 40 46, 40 72, 46 96 Z" fill="url(#ldArm)"/>` +
				`<path d="M28 78 l-3 2 M27 64 l-3 1 M29 52 l-3 1 M33 40 l-3 0" stroke="#5E432D" stroke-width="1.2" stroke-linecap="round"/>` +
				`<ellipse cx="41" cy="22" rx="8" ry="5.5" fill="#8A6747"/>` +
				claws(CLAWS_L) +
				rightArm) +
		`<path d="${HEAD}" fill="url(#ldHead)"/>` +
		`<path d="M50 39 l-3 -5 M56 37.5 l-1 -6 M62 37.5 l1 -6 M68 38.5 l3 -5 M25 68 l-4 1 M26 79 l-4 3 M95 68 l4 1 M94 79 l4 3" stroke="#7E5C3E" stroke-width="3" stroke-linecap="round"/>` +
		`<path d="M44 45 q-3 4 -2 8 M50 42 q-2 4 -1 7 M70 42 q2 4 1 7 M76 45 q3 4 2 8" stroke="#5E432D" stroke-width="1.1" fill="none" opacity="0.7" stroke-linecap="round"/>` +
		tufts +
		`<path d="${FACE}" fill="url(#ldFace)"/>` +
		`<path d="M52 53 q8 -12 16 0 z" fill="#F7EAD0"/>` +
		`<path d="${PATCH_L}" fill="url(#ldPatch)"/><path d="${PATCH_R}" fill="url(#ldPatch)"/>` +
		eyes(mood, t) +
		`<ellipse cx="40" cy="85" rx="5" ry="2.6" fill="#E79A7E" opacity="${blush}"/><ellipse cx="80" cy="85" rx="5" ry="2.6" fill="#E79A7E" opacity="${blush}"/>` +
		`<path d="M54 77 q6 -4 12 0 q1 4 -3 6 q-3 2 -6 0 q-4 -2 -3 -6 z" fill="#2A1C14"/>` +
		`<path d="M57 77.2 q3 -1.4 6 0" stroke="#7A6352" stroke-width="1" fill="none" stroke-linecap="round"/>` +
		mouth(mood, t) +
		(mood === "panic" ? sweat(t) : "") +
		(o.paw
			? `<path d="M36 124 C 38 108, 46 96, 54 90 L 66 92 C 58 100, 52 110, 50 124 Z" fill="url(#ldArm)"/>` +
				`<ellipse cx="61" cy="89" rx="9" ry="6.5" fill="#8A6747"/>` +
				`<path d="M55 86 q2 -3 4 0 M60 85 q2 -3 4 0 M65 86 q2 -3 4 0" stroke="#EDE0C6" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
			: "") +
		`</g>`
	);
}

/** The branch the sloth hangs from, across one 120-unit key. */
export const BRANCH =
	`<path d="M-6 17 C 30 15, 70 20, 126 16 L126 26 C 80 29, 40 25, -6 27 Z" fill="url(#ldBark)"/>` +
	`<path d="M-6 18 C 30 16, 70 21, 126 17" stroke="#B48E66" stroke-width="1.2" fill="none" opacity="0.7"/>` +
	`<path d="M10 22 q6 1.5 12 0 M54 24 q8 1 14 -1 M92 21 q6 1.5 11 0" stroke="#3E2B1F" stroke-width="1" fill="none" opacity="0.55" stroke-linecap="round"/>`;
