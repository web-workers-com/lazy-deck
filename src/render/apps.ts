/**
 * Everyday keys: music, volume, Discord, Steam. Same look as the rest:
 * dark key, cream drawing, a label pill, and the sloth where it fits.
 */
import { logoTile } from "./logos.js";
import { tomatoKey } from "./scenes.js";
import { BRANCH, sloth } from "./sloth.js";
import { C, keyImage, pill, q, swing, text } from "./svg.js";
import { tr } from "../i18n.js";

export const frame = (inner: string, border = "#3A4A35") =>
	keyImage(
		`<rect width="120" height="120" fill="url(#ldKey)"/>${inner}` +
			`<rect x="1.5" y="1.5" width="117" height="117" rx="19" fill="none" stroke="${border}" stroke-width="3"/>`,
	);

const STROKE = `stroke="${C.cream}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

export const ICONS: Record<string, string> = {
	playpause: `<path d="M34 28 L58 46 L34 64 Z" fill="${C.cream}"/><path d="M70 30 v32 M84 30 v32" ${STROKE}/>`,
	next: `<path d="M30 28 L52 46 L30 64 Z M54 28 L76 46 L54 64 Z" fill="${C.cream}"/><path d="M86 30 v32" ${STROKE}/>`,
	previous: `<path d="M90 28 L68 46 L90 64 Z M66 28 L44 46 L66 64 Z" fill="${C.cream}"/><path d="M34 30 v32" ${STROKE}/>`,
	volumeUp: `<path d="M22 38 h12 l16 -12 v40 l-16 -12 h-12 z" fill="${C.cream}"/><path d="M58 38 q5 8 0 16" ${STROKE}/><circle cx="84" cy="46" r="17" fill="${C.honey}"/><path d="M84 37 v18 M75 46 h18" stroke="${C.night}" stroke-width="5.5" stroke-linecap="round"/>`,
	volumeDown: `<path d="M22 38 h12 l16 -12 v40 l-16 -12 h-12 z" fill="${C.cream}"/><path d="M58 38 q5 8 0 16" ${STROKE}/><circle cx="84" cy="46" r="17" fill="${C.sky}"/><path d="M75 46 h18" stroke="${C.night}" stroke-width="5.5" stroke-linecap="round"/>`,
	mute: `<path d="M22 38 h12 l16 -12 v40 l-16 -12 h-12 z" fill="${C.cream}"/><circle cx="84" cy="46" r="17" fill="${C.coral}"/><path d="M78 40 l12 12 M90 40 l-12 12" stroke="${C.night}" stroke-width="5" stroke-linecap="round"/>`,
	mic: `<rect x="49" y="18" width="22" height="36" rx="11" fill="${C.cream}"/><path d="M40 46 q0 18 20 18 q20 0 20 -18 M60 64 v10 M48 76 h24" ${STROKE}/>`,
	micOff: `<rect x="49" y="18" width="22" height="36" rx="11" fill="${C.cream}" opacity="0.45"/><path d="M40 46 q0 18 20 18 q20 0 20 -18 M60 64 v10 M48 76 h24" ${STROKE} opacity="0.45"/><path d="M36 20 L84 76" stroke="${C.coral}" stroke-width="7" stroke-linecap="round"/>`,
	headset: `<path d="M34 58 v-10 a26 26 0 0 1 52 0 v10" ${STROKE}/><rect x="28" y="50" width="14" height="24" rx="6" fill="${C.cream}"/><rect x="78" y="50" width="14" height="24" rx="6" fill="${C.cream}"/>`,
	headsetOff: `<g opacity="0.45"><path d="M34 58 v-10 a26 26 0 0 1 52 0 v10" ${STROKE}/><rect x="28" y="50" width="14" height="24" rx="6" fill="${C.cream}"/><rect x="78" y="50" width="14" height="24" rx="6" fill="${C.cream}"/></g><path d="M30 22 L90 78" stroke="${C.coral}" stroke-width="7" stroke-linecap="round"/>`,
	chat: `<path d="M26 24 h68 a8 8 0 0 1 8 8 v30 a8 8 0 0 1 -8 8 h-40 l-14 12 v-12 h-14 a8 8 0 0 1 -8 -8 v-30 a8 8 0 0 1 8 -8 z" fill="${C.cream}"/><circle cx="44" cy="47" r="5" fill="${C.night}"/><circle cx="60" cy="47" r="5" fill="${C.night}"/><circle cx="76" cy="47" r="5" fill="${C.night}"/>`,
	controller: `<path d="M30 36 q-10 0 -12 16 q-2 18 8 20 q6 1 12 -8 h44 q6 9 12 8 q10 -2 8 -20 q-2 -16 -12 -16 z" fill="${C.cream}"/><path d="M38 46 v12 M32 52 h12" stroke="${C.night}" stroke-width="4" stroke-linecap="round"/><circle cx="80" cy="48" r="3.5" fill="${C.coral}"/><circle cx="88" cy="55" r="3.5" fill="${C.leaf}"/>`,
	friends: `<circle cx="46" cy="36" r="11" fill="${C.cream}"/><path d="M26 72 q0 -22 20 -22 q20 0 20 22 z" fill="${C.cream}"/><circle cx="76" cy="40" r="9" fill="${C.cream}" opacity="0.7"/><path d="M62 72 q2 -18 14 -18 q16 0 18 18 z" fill="${C.cream}" opacity="0.7"/>`,
	screenshot: `<path d="M28 36 v-10 h12 M80 26 h12 v10 M92 58 v10 h-12 M40 68 h-12 v-10" ${STROKE}/><circle cx="60" cy="47" r="10" fill="${C.cream}"/>`,
	lock: `<path d="M44 42 v-8 a16 16 0 0 1 32 0 v8" ${STROKE}/><rect x="36" y="40" width="48" height="36" rx="8" fill="${C.cream}"/><circle cx="60" cy="56" r="5" fill="${C.night}"/><path d="M60 58 v8" stroke="${C.night}" stroke-width="4" stroke-linecap="round"/>`,
	moon: `<path d="M66 20 a28 28 0 1 0 22 40 a22 22 0 1 1 -22 -40 z" fill="${C.cream}"/>`,
	sun: `<circle cx="60" cy="47" r="14" fill="${C.honey}"/><path d="M60 18 v8 M60 68 v8 M31 47 h8 M81 47 h8 M40 27 l5 5 M75 62 l5 5 M40 67 l5 -5 M75 32 l5 -5" stroke="${C.honey}" stroke-width="5" stroke-linecap="round"/>`,
	desktop: `<rect x="24" y="24" width="72" height="46" rx="6" fill="${C.cream}"/><rect x="30" y="30" width="26" height="16" rx="2" fill="${C.sky}"/><rect x="62" y="30" width="28" height="34" rx="2" fill="${C.leaf}"/><rect x="30" y="50" width="26" height="14" rx="2" fill="${C.honey}"/>`,
	bell: `<path d="M60 20 c-14 0 -22 10 -22 24 v12 l-8 10 h60 l-8 -10 v-12 c0 -14 -8 -24 -22 -24 z" fill="${C.cream}"/><path d="M52 72 a8 8 0 0 0 16 0" fill="${C.cream}"/>`,
	review: `<circle cx="40" cy="28" r="7" ${STROKE}/><circle cx="40" cy="68" r="7" ${STROKE}/><circle cx="80" cy="68" r="7" ${STROKE}/><path d="M40 35 v26 M80 61 v-20 q0 -10 -10 -10 h-12 M64 25 l-7 6 l7 6" ${STROKE}/>`,
	monitorOff: `<rect x="22" y="22" width="76" height="46" rx="6" fill="${C.cream}"/><rect x="28" y="28" width="64" height="34" rx="3" fill="${C.night}"/><path d="M46 76 h28" ${STROKE}/><path d="M66 36 a10 10 0 1 0 8 14 a7 7 0 1 1 -8 -14 z" fill="${C.sky}"/>`,
	sleep: `<path d="M64 20 a26 26 0 1 0 22 38 a20 20 0 1 1 -22 -38 z" fill="${C.sky}"/><text x="72" y="40" font-family="Segoe UI, Arial" font-weight="700" font-size="14" fill="${C.cream}">z</text><text x="82" y="30" font-family="Segoe UI, Arial" font-weight="700" font-size="10" fill="${C.cream}">z</text>`,
	bin: `<path d="M36 30 h48 M52 30 v-6 h16 v6" ${STROKE}/><path d="M40 34 h40 l-4 40 h-32 z" fill="${C.cream}"/><path d="M52 42 v24 M60 42 v24 M68 42 v24" stroke="${C.night}" stroke-width="3" stroke-linecap="round"/>`,
	gear: `<circle cx="60" cy="47" r="22" fill="none" stroke="${C.cream}" stroke-width="10" stroke-dasharray="9 5.4"/><circle cx="60" cy="47" r="15" fill="${C.cream}"/><circle cx="60" cy="47" r="6" fill="${C.night}"/>`,
	pulse: `<rect x="20" y="22" width="80" height="50" rx="6" fill="${C.cream}"/><path d="M26 50 h16 l6 -14 l10 26 l8 -18 l6 6 h22" stroke="${C.coral}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
	snapLeft: `<rect x="22" y="24" width="76" height="46" rx="6" fill="none" stroke="${C.cream}" stroke-width="5"/><rect x="27" y="29" width="32" height="36" rx="3" fill="${C.honey}"/>`,
	snapRight: `<rect x="22" y="24" width="76" height="46" rx="6" fill="none" stroke="${C.cream}" stroke-width="5"/><rect x="61" y="29" width="32" height="36" rx="3" fill="${C.honey}"/>`,
	maximize: `<rect x="22" y="24" width="76" height="46" rx="6" fill="${C.honey}" stroke="${C.cream}" stroke-width="5"/><path d="M48 40 l-8 -8 M40 40 v-8 h8 M72 54 l8 8 M80 54 v8 h-8" stroke="${C.night}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
	minimize: `<rect x="22" y="24" width="76" height="46" rx="6" fill="none" stroke="${C.cream}" stroke-width="5" opacity="0.5"/><path d="M42 62 h36" stroke="${C.honey}" stroke-width="8" stroke-linecap="round"/>`,
	vdLeft: `<rect x="44" y="26" width="54" height="38" rx="5" fill="${C.cream}" opacity="0.4"/><rect x="22" y="32" width="54" height="38" rx="5" fill="${C.cream}"/><path d="M58 51 h-20 M46 43 l-8 8 l8 8" stroke="${C.night}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
	vdRight: `<rect x="22" y="26" width="54" height="38" rx="5" fill="${C.cream}" opacity="0.4"/><rect x="44" y="32" width="54" height="38" rx="5" fill="${C.cream}"/><path d="M62 51 h20 M74 43 l8 8 l-8 8" stroke="${C.night}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
	taskview: `<rect x="20" y="24" width="36" height="22" rx="4" fill="${C.cream}"/><rect x="64" y="24" width="36" height="22" rx="4" fill="${C.honey}"/><rect x="20" y="52" width="36" height="22" rx="4" fill="${C.sky}"/><rect x="64" y="52" width="36" height="22" rx="4" fill="${C.cream}"/>`,
	project: `<rect x="18" y="30" width="44" height="30" rx="4" fill="${C.cream}"/><rect x="58" y="22" width="44" height="30" rx="4" fill="${C.sky}"/><path d="M40 68 h0 M80 60 v10" ${STROKE}/>`,
	clipboard: `<rect x="34" y="22" width="52" height="56" rx="6" fill="${C.cream}"/><rect x="48" y="16" width="24" height="12" rx="4" fill="${C.honey}"/><path d="M44 42 h32 M44 52 h32 M44 62 h20" stroke="${C.night}" stroke-width="4" stroke-linecap="round"/>`,
	emoji: `<circle cx="60" cy="47" r="28" fill="${C.honey}"/><circle cx="50" cy="40" r="4" fill="${C.night}"/><circle cx="70" cy="40" r="4" fill="${C.night}"/><path d="M46 54 q14 14 28 0" stroke="${C.night}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
	calculator: `<rect x="36" y="18" width="48" height="60" rx="7" fill="${C.cream}"/><rect x="42" y="24" width="36" height="14" rx="3" fill="${C.leaf}"/><g fill="${C.night}"><circle cx="48" cy="48" r="4"/><circle cx="60" cy="48" r="4"/><circle cx="72" cy="48" r="4"/><circle cx="48" cy="60" r="4"/><circle cx="60" cy="60" r="4"/><circle cx="72" cy="60" r="4"/><circle cx="48" cy="70" r="3.5"/><circle cx="60" cy="70" r="3.5"/></g><rect x="68" y="66" width="8" height="8" rx="2" fill="${C.coral}"/>`,
	calendar: `<rect x="28" y="24" width="64" height="54" rx="7" fill="${C.cream}"/><rect x="28" y="24" width="64" height="16" rx="7" fill="${C.coral}"/><path d="M44 18 v12 M76 18 v12" ${STROKE}/><g fill="${C.night}"><rect x="38" y="48" width="9" height="8" rx="2"/><rect x="55" y="48" width="9" height="8" rx="2"/><rect x="72" y="48" width="9" height="8" rx="2"/><rect x="38" y="62" width="9" height="8" rx="2"/><rect x="55" y="62" width="9" height="8" rx="2"/></g>`,
	key: `<circle cx="42" cy="47" r="16" fill="none" stroke="${C.honey}" stroke-width="8"/><path d="M58 47 h34 M84 47 v12 M74 47 v9" stroke="${C.honey}" stroke-width="8" stroke-linecap="round"/>`,
	clip: `<rect x="22" y="28" width="62" height="40" rx="8" fill="${C.cream}"/><path d="M84 40 l16 -8 v32 l-16 -8 z" fill="${C.cream}"/><circle cx="40" cy="48" r="7" fill="${C.coral}"/><text x="64" y="54" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="800" font-size="15" fill="${C.night}">30s</text>`,
	record: `<circle cx="60" cy="47" r="26" fill="none" stroke="${C.cream}" stroke-width="6"/><circle cx="60" cy="47" r="15" fill="${C.coral}"/>`,
	camera: `<rect x="22" y="32" width="76" height="44" rx="8" fill="${C.cream}"/><path d="M44 32 l6 -10 h20 l6 10 z" fill="${C.cream}"/><circle cx="60" cy="54" r="14" fill="${C.night}"/><circle cx="60" cy="54" r="8" fill="${C.sky}"/>`,
	folder: `<path d="M22 30 a6 6 0 0 1 6 -6 h20 l8 8 h36 a6 6 0 0 1 6 6 v32 a6 6 0 0 1 -6 6 h-64 a6 6 0 0 1 -6 -6 z" fill="${C.honey}"/><path d="M22 42 h76" stroke="#D9982E" stroke-width="3"/>`,
	download: `<path d="M22 30 a6 6 0 0 1 6 -6 h20 l8 8 h36 a6 6 0 0 1 6 6 v32 a6 6 0 0 1 -6 6 h-64 a6 6 0 0 1 -6 -6 z" fill="${C.honey}"/><path d="M60 38 v24 M50 52 l10 10 l10 -10" stroke="${C.night}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
	picture: `<rect x="22" y="22" width="76" height="52" rx="7" fill="${C.cream}"/><circle cx="44" cy="40" r="7" fill="${C.honey}"/><path d="M26 70 l22 -20 l14 12 l12 -10 l20 18 z" fill="${C.leaf}"/>`,
	note: `<path d="M34 18 h38 l14 14 v46 h-52 z" fill="${C.cream}"/><path d="M72 18 v14 h14" fill="#D9C094"/><path d="M44 44 h32 M44 54 h32 M44 64 h22" stroke="${C.night}" stroke-width="4" stroke-linecap="round"/>`,
	globe: `<circle cx="60" cy="47" r="28" fill="${C.sky}"/><path d="M32 47 h56 M60 19 q-16 28 0 56 M60 19 q16 28 0 56" stroke="${C.night}" stroke-width="3.5" fill="none"/>`,
	wifi: `<path d="M28 40 q32 -28 64 0 M38 50 q22 -18 44 0 M48 60 q12 -9 24 0" ${STROKE}/><circle cx="60" cy="70" r="5" fill="${C.cream}"/>`,
	glass: `<path d="M38 20 h44 l-6 56 h-32 z" fill="none" stroke="${C.cream}" stroke-width="5" stroke-linejoin="round"/><path d="M41 40 h38 l-4 34 h-30 z" fill="${C.sky}"/>`,
	stretch: `<circle cx="60" cy="22" r="8" fill="${C.cream}"/><path d="M60 32 v24 M60 40 l-20 -14 M60 40 l20 -14 M60 56 l-12 20 M60 56 l12 20" ${STROKE}/>`,
	cart: `<path d="M18 24 h12 l10 34 h42 l8 -26 h-54" ${STROKE}/><circle cx="46" cy="70" r="5" fill="${C.cream}"/><circle cx="76" cy="70" r="5" fill="${C.cream}"/>`,
	tv: `<rect x="22" y="22" width="76" height="46" rx="6" fill="${C.cream}"/><rect x="28" y="28" width="64" height="34" rx="3" fill="${C.night}"/><path d="M46 76 h28" ${STROKE}/><path d="M52 38 L70 45 L52 52 Z" fill="${C.honey}"/>`,
};

/** Steam's own logo (from Wikimedia Commons), in a 64-unit box. */
export const STEAM_LOGO =
	`<path d="M1.305 41.202C5.259 54.386 17.488 64 31.959 64c17.673 0 32-14.327 32-32s-14.327-32-32-32C15.001 0 1.124 13.193.028 29.874c2.074 3.477 2.879 5.628 1.275 11.328z" fill="url(#ldSteam)"/>` +
	`<path fill="#FFFFFF" d="M30.31 23.985l.003.158-7.83 11.375c-1.268-.058-2.54.165-3.748.662a8.14 8.14 0 0 0-1.498.8L.042 29.893s-.398 6.546 1.26 11.424l12.156 5.016c.6 2.728 2.48 5.12 5.242 6.27a8.880 8.880 0 0 0 11.603-4.782 8.890 8.890 0 0 0 .684-3.656L42.180 36.160l.275.005c6.705 0 12.155-5.466 12.155-12.180s-5.440-12.160-12.155-12.174c-6.702 0-12.155 5.460-12.155 12.174zm-1.880 23.050c-1.454 3.500-5.466 5.147-8.953 3.694a6.840 6.840 0 0 1-3.524-3.362l3.957 1.640a5.040 5.040 0 0 0 6.591-2.719 5.050 5.050 0 0 0-2.715-6.601l-4.100-1.695c1.578-.600 3.372-.620 5.050.077 1.700.703 3 2.027 3.696 3.720s.692 3.560-.010 5.246M42.466 32.100a8.120 8.120 0 0 1-8.098-8.113 8.120 8.120 0 0 1 8.098-8.111 8.120 8.120 0 0 1 8.100 8.111 8.120 8.120 0 0 1-8.100 8.113m-6.068-8.126a6.090 6.090 0 0 1 6.080-6.095c3.355 0 6.084 2.730 6.084 6.095a6.090 6.090 0 0 1-6.084 6.093 6.090 6.090 0 0 1-6.081-6.093z"/>`;

/** The Steam logo in the top right corner of Steam keys. */
export const STEAM_BADGE = `<g transform="translate(72 6) scale(0.62)"><circle cx="32" cy="32" r="34" fill="#0B0E0A" opacity="0.6"/>${STEAM_LOGO}</g>`;

/** A Steam page key: the page's drawing with the Steam badge. */
export function steamKey(icon: string, label: string): string {
	return frame(`<g transform="translate(-8 6) scale(0.92)">${ICONS[icon] ?? ""}</g>${STEAM_BADGE}${pill(label, C.pillDark, C.cream)}`);
}

/** A plain everyday key: an icon and a label. */
export function iconKey(icon: keyof typeof ICONS | string, label: string, border?: string): string {
	return frame(`<g transform="translate(0 4)">${ICONS[icon] ?? ""}</g>${pill(label, C.pillDark, C.cream)}`, border);
}

/** Play/Pause gets the sloth with headphones, nodding along. */
export function musicKey(t: number, label = tr("Play / Pause"), playing = true): string {
	const nod = playing ? q(-3 + swing(t, 1.6) * 6) : "0";
	const note = (phase: number, x: number) => {
		const p = ((t + phase) % 3) / 3;
		const opacity = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75;
		return `<text x="${q(x + p * 8)}" y="${q(50 - p * 22)}" font-size="16" font-weight="700" fill="${C.leaf}" opacity="${q(opacity, 0.25)}" font-family="Segoe UI Symbol, Arial">♪</text>`;
	};
	return frame(
		BRANCH +
			`<g transform="rotate(${nod} 60 22)">${sloth({ mood: playing ? "awake" : "sleep", t })}` +
			`<path d="M28 66 q0 -36 32 -36 q32 0 32 36" stroke="#2A2A2A" stroke-width="5" fill="none"/>` +
			`<rect x="20" y="60" width="14" height="22" rx="6" fill="${C.sky}"/><rect x="86" y="60" width="14" height="22" rx="6" fill="${C.sky}"/></g>` +
			(playing ? note(0, 6) + note(1.5, 98) : "") +
			pill(label, C.pillDark, C.cream),
	);
}

/** The last played Steam game, with its own header art when Steam has it. */
export function gameKey(name: string | undefined, image: string | undefined): string {
	if (!name) {
		return iconKey("controller", tr("Kein Spiel"));
	}
	const art = image
		? `<image href="${image}" x="-36" y="0" width="192" height="90" preserveAspectRatio="xMidYMid slice"/>` +
			`<rect y="70" width="120" height="50" fill="#151C13"/>`
		: `<g transform="translate(0 -6)">${ICONS.controller}</g>` +
			text(name, { x: 60, y: 86, size: 13, max: 100, fill: C.cream });
	return frame(art + pill(tr("Spielen"), C.leaf, C.night));
}

/** Volume keys show where the level is. */
export function volumeKey(kind: "volumeUp" | "volumeDown" | "mute", level: number | undefined, muted: boolean): string {
	const label = kind === "volumeUp" ? tr("Lauter") : kind === "volumeDown" ? tr("Leiser") : muted ? tr("Ton ist aus") : tr("Ton aus");
	const icon = kind;
	let meter = "";
	if (level !== undefined) {
		const width = Math.round((84 * Math.max(0, Math.min(100, level))) / 100);
		meter =
			`<rect x="18" y="62" width="84" height="6" rx="3" fill="#0E130C"/>` +
			`<rect x="18" y="62" width="${width}" height="6" rx="3" fill="${muted ? C.coral : C.honey}"/>` +
			text(muted ? tr("stumm") : `${level} %`, { x: 60, y: 87, size: 15, max: 90, fill: C.cream });
	}
	return frame(
		`<g transform="translate(60 4) scale(0.62) translate(-60 0)">${ICONS[icon]}</g>` + meter + pill(label, muted ? C.coral : C.pillDark, muted ? C.night : C.cream),
		muted ? C.coral : undefined,
	);
}

/** Microphone for the whole system: the sloth covers its mouth when muted. */
export function micKey(muted: boolean | undefined, t: number, label?: string): string {
	if (muted === undefined) {
		return frame(`<g opacity="0.55">${BRANCH + sloth({ mood: "sleep", t })}</g>` + pill(label ?? tr("Mikro"), C.pillDark, C.cream));
	}
	return frame(
		BRANCH + sloth({ mood: muted ? "sleep" : "awake", t, paw: muted }) + pill(label ?? (muted ? tr("Stumm") : tr("Mikro an")), muted ? C.coral : C.leaf, C.night),
		muted ? C.coral : C.leaf,
	);
}

export type NowPlayingView = { title?: string | null; artist?: string; art?: string | null; playing: boolean };

/** What is playing: the cover, the title, and whether it runs. */
export function nowPlayingKey(np: NowPlayingView | undefined, t: number): string {
	if (!np?.title) {
		return musicKey(t, tr("Nichts läuft"), false);
	}
	if (!np.art) {
		return musicKey(t, np.title, np.playing);
	}
	const paused = np.playing
		? ""
		: `<rect width="120" height="120" fill="#000" opacity="0.45"/><path d="M48 30 v28 M72 30 v28" stroke="${C.cream}" stroke-width="10" stroke-linecap="round"/>`;
	return frame(
		`<image href="${np.art}" x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid slice"/>` +
			`<defs><linearGradient id="np" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient></defs>` +
			`<rect width="120" height="120" fill="url(#np)"/>` +
			paused +
			(np.artist ? text(np.artist, { x: 60, y: 88, size: 10.5, max: 100, fill: C.cream, face: "body", weight: 500 }) : "") +
			pill(np.title, C.pillDark, C.cream),
	);
}

const meterTone = (v: number) => (v >= 85 ? C.coral : v >= 60 ? C.honey : C.leaf);

/** CPU and memory as two bars. The sloth sweats when it gets hot. */
export function statsKey(cpu: number, ram: number, t: number): string {
	const row = (label: string, value: number, y: number) =>
		text(label, { x: 16, y, size: 12, max: 40, fill: C.cream, anchor: "start", face: "body" }) +
		text(`${value} %`, { x: 104, y, size: 12, max: 50, fill: C.cream, anchor: "end", face: "body" }) +
		`<rect x="16" y="${y + 6}" width="88" height="8" rx="4" fill="#0E130C"/>` +
		`<rect x="16" y="${y + 6}" width="${Math.round((88 * value) / 100)}" height="8" rx="4" fill="${meterTone(value)}"/>`;
	const hot = cpu >= 85;
	const drop = hot ? `<path transform="translate(0 ${q(((t % 1.2) / 1.2) * 8)})" d="M98 12 q4 6 0 8 q-4 -2 0 -8 z" fill="#9FD3EA"/>` : "";
	return frame(row("CPU", cpu, 30) + row("RAM", ram, 64) + drop + pill(hot ? tr("Puh, heiß") : tr("System"), hot ? C.coral : C.pillDark, hot ? C.night : C.cream), hot ? C.coral : undefined);
}

export type PomodoroView = { phase: "idle" | "focus" | "break"; left: number; progress: number; paused: boolean; rounds: number };

/** The canvas tomato: a ring fills as the focus time runs, the claws hold on. */
export function pomodoroKey(p: PomodoroView): string {
	const minutes = Math.ceil(p.left / 60_000);
	const center = p.phase === "idle" ? "25" : p.paused ? "II" : String(minutes);
	const label = p.phase === "idle" ? tr("Fokus starten") : p.paused ? tr("pausiert") : p.phase === "break" ? tr("Pause") : tr("Fokus · {n}", { n: p.rounds + 1 });
	const tone = p.phase === "break" ? C.sky : C.leaf;
	return tomatoKey({ center, label, progress: p.phase === "idle" ? 0 : p.progress, tone, labelTone: p.phase === "idle" ? undefined : tone });
}

/** GitHub counters: unread notifications or reviews waiting for you. */
export function githubKey(mode: "notifications" | "reviews", count: number | undefined, available: boolean): string {
	const icon = mode === "notifications" ? "bell" : "review";
	const label = !available ? tr("GitHub: nicht da") : mode === "notifications" ? "GitHub" : tr("GitHub-Reviews");

	const badge =
		available && count
			? `<circle cx="90" cy="26" r="15" fill="${C.coral}"/>` + text(count > 99 ? "99+" : String(count), { x: 90, y: 31.5, size: 14, max: 24, fill: C.night, weight: 700 })
			: "";
	return frame(`<g transform="translate(0 4)" opacity="${available ? 1 : 0.4}">${ICONS[icon]}</g>${badge}${pill(label, C.pillDark, C.cream)}`, available && count ? C.honey : undefined);
}

/** A coloured monogram for apps and sites (their own logos are theirs). */
export function tileKey(tile: { text: string; bg: string; fg?: string }, label: string): string {
	return frame(
		`<rect x="26" y="12" width="68" height="68" rx="18" fill="${tile.bg}"/>` +
			text(tile.text, { x: 60, y: 59, size: tile.text.length > 2 ? 24 : 32, max: 60, fill: tile.fg ?? C.night, weight: 700 }) +
			pill(label, C.pillDark, C.cream),
	);
}

/** A launcher key with the brand's logo as its tile. */
export function logoKey(logo: string, label: string): string {
	const tile =
		logo === "steam"
			? `<rect x="26" y="10" width="68" height="68" rx="18" fill="#171A21"/><g transform="translate(34 18) scale(0.8125)">${STEAM_LOGO}</g>`
			: logoTile(logo);
	return frame(tile + pill(label, C.pillDark, C.cream));
}

/** A key asking for a second press. */
export function confirmKey(icon: string, question: string): string {
	return frame(`<g transform="translate(0 4)" opacity="0.5">${ICONS[icon] ?? ""}</g>` + pill(question, C.coral, C.night), C.coral);
}
