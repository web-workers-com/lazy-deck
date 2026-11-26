/**
 * Renders the plugin's static images (plugin icon, category icon, action
 * list icons and default key images) from the same drawing code the keys use.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { slothKey, testKey } from "../.build/render/keys.js";
import { gameKey, githubKey, iconKey, micKey, musicKey, nowPlayingKey, pomodoroKey, statsKey } from "../.build/render/apps.js";
import { sloth, BRANCH } from "../.build/render/sloth.js";
import { DEFS } from "../.build/render/svg.js";
import { GROUPS, VARIANTS, variantUuid } from "../.build/catalog.js";
import { choiceKey } from "../.build/render/choices.js";
import { logoBadge, overlay } from "../.build/render/logos.js";
import { earsKey, headphonesKey, listenKey, vinylKey } from "../.build/render/scenes.js";
import { diceKey } from "../.build/render/home.js";
import { logoKey as logoKeyV, steamKey } from "../.build/render/apps.js";
import { logoKey, tileKey } from "../.build/render/apps.js";
import { blanketKey, clipKey, coffeeKey, controllerKey, hammockKey, knobKey, radioKey, signKey, viewfinderKey } from "../.build/render/scenes.js";
import { categoryIcon, listIcon } from "./list-icons.mjs";
import { batteryKey, clockKey, coinKey, countdownKey, netKey, reminderKey, stopwatchKey, timerKey, weatherKey, wifiKey } from "../.build/render/home.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "com.lazydeck.plugin.sdPlugin", "imgs");
const svgOf = (uri) => Buffer.from(uri.split(",")[1], "base64");

async function png(svg, size, file) {
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, await sharp(svg, { density: 300 }).resize(size, size).png().toBuffer());
}

/** Writes name.png and name@2x.png. */
async function pair(svg, size, base) {
	await png(svg, size, `${base}.png`);
	await png(svg, size * 2, `${base}@2x.png`);
}

// Plugin icon: the logo key.
const logo = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs>${DEFS}<clipPath id="k"><rect width="120" height="120" rx="26"/></clipPath></defs>` +
		`<g clip-path="url(#k)"><rect width="120" height="120" fill="url(#ldKey)"/>${BRANCH}${sloth({ mood: "sleep", t: 0 })}</g></svg>`,
);
await pair(logo, 256, join(root, "plugin", "marketplace"));

// Category icon: Sam's face as a white line drawing (Elgato: monochrome white).
await pair(categoryIcon(), 28, join(root, "plugin", "category-icon"));

const keys = {
	sloth: slothKey({ alert: undefined, t: 1 }),
	test: testKey("wait"),
	media: musicKey(0.4, "Musik", true),
	discord: micKey(false, 0, "Discord Mikro"),
	steam: controllerKey("Steam", 0),
	mic: signKey({ title: "Mikro", value: "an", sub: "du bist live", tone: "honey", live: true, t: 0 }),
	nowplaying: nowPlayingKey(undefined, 0),
	system: statsKey(23, 48, 0),
	pomodoro: pomodoroKey({ phase: "idle", left: 0, progress: 0, paused: false, rounds: 0 }),
	windows: iconKey("screenshot", "Screenshot"),
	github: githubKey("notifications", 3, true),
	clock: clockKey(new Date(2026, 10, 14, 9, 41, 0)),
	weather: weatherKey({ temp: 12, sky: "partly", word: "Heiter", place: "Zuhause", day: true }, 0),
	internet: netKey(24, 0),
	wifi: wifiKey({ ssid: "WLAN", signal: 80 }),
	battery: batteryKey({ percent: 76, charging: false }),
	timer: timerKey({ minutes: 10, left: 600000, running: false, started: false }),
	stopwatch: stopwatchKey(0, false),
	countdown: countdownKey("feierabend", 2 * 3600000, 0),
	reminder: reminderKey("water", 30 * 60000, false, 0),
	chance: coinKey("Kopf", undefined),
	output: signKey({ title: "Ton über", value: "Kopfhörer", sub: "Ausgabe", t: 0 }),
	appvolume: knobKey({ kind: "app", mono: "GG", level: 60, dir: "down", label: "Spiel leiser", t: 0 }),
	appmic: micKey(false, 0, "Teams Mikro"),
	brightness: knobKey({ kind: "sun", level: 70, dir: "up", label: "Heller", t: 0 }),
	radio: radioKey("Radio", true, 0.6),
	awake: coffeeKey(true, "Wach bleiben", 0.8),
	sleeptimer: hammockKey("PC aus · 30 min", 0.4),
	steamdownloads: signKey({ title: "Steam", value: "47 %", bar: 0.47, tone: "leaf", t: 0 }),
};
for (const g of GROUPS) {
	const c = g.choices[0];
	keys[g.uuid] = c.logo ? logoKey(c.logo, g.name) : c.tile ? tileKey(c.tile, g.name) : iconKey(c.icon, c.label);
}
keys.gamebar = clipKey(1, "Clip!");

// Standalone keys: each with its own picture.
const STEAM_PAGES = { library: ["controller", "Bibliothek"], friends: ["friends", "Freunde"], bigpicture: ["tv", "Big Picture"], store: ["cart", "Shop"] };
const variantKey = (v) => {
	const s = v.settings;
	switch (v.base) {
		case "media":
			if (s.key === "playpause") return musicKey(0.4, "Play / Pause", true);
			if (s.key === "next" || s.key === "previous") return vinylKey(s.key, 0.3);
			if (s.key === "mute") return signKey({ title: "Lautstärke", value: "30 %", bar: 0.3, t: 0 });
			return listenKey({ level: 60, dir: s.key === "volumeUp" ? "up" : "down", label: s.key === "volumeUp" ? "Lauter" : "Leiser", t: 0.5 });
		case "discord":
			if (s.mode === "open") return logoKeyV("discord", "Discord");
			if (s.mode === "deafen") return overlay(headphonesKey(false, "Discord Ton", 0), logoBadge("discord"));
			return overlay(micKey(false, 0, "Discord Mikro"), logoBadge("discord"));
		case "appvolume":
			return s.app === "spotify"
				? knobKey({ kind: "app", logo: "spotify", level: 60, label: "Spotify stumm", t: 0 })
				: knobKey({ kind: "app", mono: "GG", level: 70, dir: s.mode === "up" ? "up" : "down", label: s.mode === "up" ? "Spiel lauter" : "Spiel leiser", t: 0 });
		case "appmic": {
			const logo = { zoom: "zoom", browser: "googlemeet" }[s.app];
			const image = micKey(false, 0, v.name);
			return logo ? overlay(image, logoBadge(logo)) : image;
		}
		case "brightness":
			return knobKey({ kind: "sun", level: 70, dir: s.mode, label: s.mode === "up" ? "Heller" : "Dunkler", t: 0 });
		case "steam":
			return s.mode === "last" ? controllerKey("Spielen", 0) : steamKey(...STEAM_PAGES[s.mode]);
		case "countdown":
			return countdownKey(s.mode, 2 * 3600000, 0);
		case "reminder":
			return reminderKey(s.mode, 30 * 60000, false, 0);
		case "chance":
			return s.mode === "coin" ? coinKey("Kopf", undefined) : diceKey(6, undefined);
		case "github":
			return overlay(githubKey(s.mode, 3, true), logoBadge("github", "left"));
		default: {
			const group = GROUPS.find((g) => g.uuid === v.base);
			const choice = group?.choices.find((c) => c.id === v.id);
			return choice ? choiceKey(choice) : iconKey("globe", v.name);
		}
	}
};
for (const v of VARIANTS) keys[variantUuid(v).replace("com.lazydeck.plugin.", "")] = variantKey(v);
keys.windows = viewfinderKey("Screenshot", 0);
// Combined actions: the first live key they can show.
keys.status = netKey(24, 0);
keys.timers = timerKey({ minutes: 10, left: 600000, running: false, started: false });

for (const [name, uri] of Object.entries(keys)) {
	await pair(svgOf(uri), 72, join(root, "actions", name, "key"));
	// Action list: white line icons, not the colourful key (Elgato guidelines).
	await pair(listIcon(name), 20, join(root, "actions", name, "icon"));
}
console.log("icons written");
