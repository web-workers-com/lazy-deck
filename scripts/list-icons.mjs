/**
 * Icons for Stream Deck's action list and the category: white line drawings
 * on a transparent background, as Elgato's guidelines ask
 * (docs.elgato.com/guidelines/stream-deck/plugins#icons). The colourful
 * pictures stay on the keys. One drawing per action family.
 */
const W = "#FFFFFF";
const LINE = `fill="none" stroke="${W}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
const dot = (x, y, r = 1.1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${W}" stroke="none"/>`;

/** Sam's face: round head, the sloth eye patches, a small smile. */
const SLOTH = `<circle cx="12" cy="12.5" r="9"/><path d="M6.5 11.5c.6-2 3.2-2.4 4 .3c-.8 1.6-3.2 1.7-4-.3zM17.5 11.5c-.6-2-3.2-2.4-4 .3c.8 1.6 3.2 1.7 4-.3z"/><path d="M10.3 16.3q1.7 1.2 3.4 0"/>`;

const GLYPHS = {
	sloth: SLOTH,
	alert: SLOTH,
	test: `<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 18h14M12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4M2.5 12h1.5M20 12h1.5"/>`,
	mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>`,
	output: `<path d="M3 9.5h3.5L11 6v12l-4.5-3.5H3z"/><path d="M15 9.5q2 2.5 0 5M17.8 7q4 5 0 10"/>`,
	media: `<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>`,
	nowplaying: `<path d="M4 20v-6M8 20V8M12 20v-9M16 20V5M20 20v-7"/>`,
	radio: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="15.5" cy="14" r="2.5"/><path d="M6.5 12h3M6.5 16h3"/>`,
	appvolume: `<path d="M5 4v16M12 4v16M19 4v16"/><rect x="3" y="13" width="4" height="3" rx="1"/><rect x="10" y="7" width="4" height="3" rx="1"/><rect x="17" y="11" width="4" height="3" rx="1"/>`,
	appmic: `<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><rect x="10" y="7.5" width="4" height="6.5" rx="2"/><path d="M8 12.5a4 4 0 0 0 8 0M12 16.5v1"/>`,
	discord: `<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/>`,
	steam: `<path d="M7 7h10a4 4 0 0 1 4 4l.5 5a2.5 2.5 0 0 1-4.5 1.5L15.5 16h-7L7 17.5A2.5 2.5 0 0 1 2.5 16L3 11a4 4 0 0 1 4-4z"/><path d="M7 10v4M5 12h4"/>${dot(15.5, 11)}${dot(18, 13)}`,
	steamdownloads: `<path d="M12 3v11M7.5 9.5L12 14l4.5-4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>`,
	gamebar: `<rect x="2.5" y="6" width="13.5" height="12" rx="2"/><path d="M16 10.5l5.5-3v9l-5.5-3"/>${dot(7, 12, 1.8)}`,
	brightness: `<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>`,
	windows: `<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8.5 21h7M12 17v4"/>`,
	window: `<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M12 4v16M2.5 8h19"/>`,
	awake: `<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 2.5q1.2 1.5 0 3M12 2.5q1.2 1.5 0 3"/>`,
	sleeptimer: `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>`,
	clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
	weather: `<path d="M7 19h10a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 6.6 12.2A3.4 3.4 0 0 0 7 19z"/><path d="M15 3.5v1.5M20.5 6l-1 1M10 6l1 1"/>`,
	timers: `<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/>`,
	timer: `<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2.5h4"/>`,
	stopwatch: `<circle cx="12" cy="13" r="8"/><path d="M12 13V9M10 2.5h4M18.5 6.5l1.5-1.5"/>`,
	countdown: `<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4"/>`,
	reminder: `<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>`,
	status: `<path d="M2.5 12h4l2.5-6 4 12 2.5-6h6"/>`,
	internet: `<path d="M2.5 12h4l2.5-6 4 12 2.5-6h6"/>`,
	wifi: `<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/>${dot(12, 19.2, 1.3)}`,
	battery: `<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M22 10.5v3M6 10v4M9.5 10v4"/>`,
	system: `<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M10 10h4v4h-4zM9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>`,
	apps: `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>`,
	website: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3.5 4.5-3.5 13.5 0 18M12 3c3.5 4.5 3.5 13.5 0 18"/>`,
	folder: `<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
	tools: `<path d="M14.5 6.5a4 4 0 0 1 5.3-3.8l-2.6 2.6.6 2.8 2.8.6 2.6-2.6a4 4 0 0 1-5.3 5.3L8 21.3a2 2 0 0 1-2.8-2.8L15.1 8.6"/>`,
	chance: `<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>${dot(8.3, 8.3, 1.3)}${dot(15.7, 15.7, 1.3)}${dot(12, 12, 1.3)}${dot(15.7, 8.3, 1.3)}${dot(8.3, 15.7, 1.3)}`,
	pomodoro: `<circle cx="12" cy="13.5" r="7.5"/><path d="M12 6V3.5M9 4.5q3 2.5 6 0"/>`,
	github: `<circle cx="6.5" cy="5.5" r="2"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="7.5" r="2"/><path d="M6.5 7.5v9M17.5 9.5c0 4-6 3-10 7"/>`,
};

/** The list icon for an action (by its UUID without the plugin prefix). */
export function listIcon(id) {
	const family = GLYPHS[id] ? id : id.split(".")[0];
	const body = GLYPHS[family];
	if (!body) throw new Error(`list-icons: no drawing for "${id}"`);
	return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g ${LINE}>${body}</g></svg>`);
}

/** The category icon: Sam's face, white. */
export const categoryIcon = () => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g ${LINE}>${SLOTH}</g></svg>`);
