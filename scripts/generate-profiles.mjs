/**
 * Generates the profiles that ship with the plugin: a starter "Lazy Deck"
 * layout and a full-deck "… Alarm" profile per device type.
 * Profile format copied from Andon Deck, which Stream Deck 7 is known to load.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { makeZip } from "./lib/zip.mjs";
import { VARIANTS, variantUuid } from "../.build/catalog.js";

const PLUGIN = "com.lazydeck.plugin";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, `${PLUGIN}.sdPlugin`);

/**
 * A key for the profile. When a standalone key exists for this action and
 * these settings (catalog VARIANTS), the profile uses that one, so the key
 * shows up under its own name in Stream Deck.
 */
function key(uuid, name, settings = {}) {
	const v = VARIANTS.find((x) => x.base === uuid && Object.entries(x.settings).every(([k, value]) => settings[k] === value));
	if (v) {
		uuid = variantUuid(v).replace(`${PLUGIN}.`, "");
		name = v.name;
	}
	return {
		Name: name,
		Settings: settings,
		State: 0,
		States: [{ FontFamily: "", FontSize: 10, FontStyle: "", FontUnderline: false, OutlineThickness: 2, ShowTitle: false, TitleAlignment: "bottom", TitleColor: "#ffffff" }],
		UUID: `${PLUGIN}.${uuid}`,
	};
}

// Everyday keys for everyone: music, sound, games, the PC. Developer keys
// (GitHub, CPU, Pomodoro …) stay in the action list for whoever wants them.
const SLOTH = key("sloth", "Sam");
const CLOCK = key("clock", "Uhr");
const WEATHER = key("weather", "Wetter");
const MIC = key("mic", "Mikrofon");
const OUTPUT = key("output", "Ausgabe wechseln");
const VOLUME = key("media", "Musik", { key: "mute" });
const TIMER = key("timer", "Timer", { minutes: "10" });
const STEAM_DL = key("steamdownloads", "Steam-Downloads");
const NOW = key("nowplaying", "Jetzt läuft");
const PREV = key("media", "Musik", { key: "previous" });
const PLAY = key("media", "Musik", { key: "playpause" });
const NEXT = key("media", "Musik", { key: "next" });
const VOL_DOWN = key("media", "Musik", { key: "volumeDown" });
const VOL_UP = key("media", "Musik", { key: "volumeUp" });
const RADIO = key("radio", "Radio", { station: "1live" });
const SPOTIFY = key("apps", "App starten", { app: "spotify" });
const GAME = key("steam", "Steam", { mode: "last" });
const GAME_DOWN = key("appvolume", "App-Lautstärke", { app: "fg", mode: "down" });
const GAME_UP = key("appvolume", "App-Lautstärke", { app: "fg", mode: "up" });
const DISCORD_MIC = key("discord", "Discord", { mode: "mute" });
const DISCORD_DEAF = key("discord", "Discord", { mode: "deafen" });
const CLIP = key("gamebar", "Gaming", { mode: "clip" });
const SHOT = key("windows", "Windows", { mode: "screenshot" });
const YT = key("website", "Webseite", { site: "youtube" });
const DIMMER = key("brightness", "Helligkeit", { mode: "down" });
const BRIGHTER = key("brightness", "Helligkeit", { mode: "up" });
const DARK = key("windows", "Windows", { mode: "darkmode" });
const AWAKE = key("awake", "Wach bleiben");
const SLEEP_TIMER = key("sleeptimer", "Ausschalt-Timer", { minutes: "30" });
const MONITOR_OFF = key("windows", "Windows", { mode: "monitoroff" });
const LOCK = key("windows", "Windows", { mode: "lock" });
const DOWNLOADS = key("folder", "Ordner", { folder: "Downloads" });
const ALERT = key("alert", "Alarm-Taste");

// Dials (Stream Deck +): everything, the game, Discord, the screen.
const DIAL_MASTER = key("appvolume", "App-Lautstärke", { app: "master" });
const DIAL_GAME = key("appvolume", "App-Lautstärke", { app: "fg" });
const DIAL_DISCORD = key("appvolume", "App-Lautstärke", { app: "discord" });
const DIAL_SCREEN = key("brightness", "Helligkeit");
const DIALS = [DIAL_MASTER, DIAL_GAME, DIAL_DISCORD, DIAL_SCREEN];

function grid(rows) {
	const actions = {};
	rows.forEach((row, y) => row.forEach((entry, x) => entry && (actions[`${x},${y}`] = entry)));
	return actions;
}

/**
 * The top row is the branch: the sloth and the signs (clock, weather,
 * microphone, sound) hang from it, as on the canvas. Below: music, games and
 * Discord, then the PC.
 */
const XL = [
	[SLOTH, CLOCK, WEATHER, MIC, OUTPUT, VOLUME, TIMER, STEAM_DL],
	[NOW, PREV, PLAY, NEXT, VOL_DOWN, VOL_UP, RADIO, SPOTIFY],
	[GAME, GAME_DOWN, GAME_UP, DISCORD_MIC, DISCORD_DEAF, CLIP, SHOT, YT],
	[DIMMER, BRIGHTER, DARK, AWAKE, SLEEP_TIMER, MONITOR_OFF, LOCK, DOWNLOADS],
];
const MK2 = [
	[SLOTH, CLOCK, WEATHER, MIC, OUTPUT],
	[NOW, PREV, PLAY, NEXT, RADIO],
	[GAME, DISCORD_MIC, DISCORD_DEAF, VOL_DOWN, VOL_UP],
];
const SMALL = [
	[SLOTH, CLOCK, MIC, OUTPUT],
	[NOW, PREV, PLAY, NEXT],
];

/** Device type → model id, grid, and starter layout. Models as in Andon Deck. */
const DEVICES = [
	{ suffix: "", type: 0, model: "20GBA9901", size: [5, 3], layout: MK2 },
	{ suffix: " Mini", type: 1, model: "20GAI9901", size: [3, 2], layout: [[SLOTH, MIC, OUTPUT], [VOL_DOWN, PLAY, VOL_UP]] },
	{ suffix: " XL", type: 2, model: "20GAT9901", size: [8, 4], layout: XL },
	{ suffix: " Mobile", type: 3, model: "VSD/WiFi", size: [5, 3], layout: MK2 },
	{ suffix: " Plus", type: 7, model: "20GBD9901", size: [4, 2], layout: SMALL, dials: DIALS },
	// The Neo's info bar sits at "1,0" of its own controller (as in Elgato's default Neo profile).
	{ suffix: " Neo", type: 9, model: "20GBJ9901", size: [4, 2], layout: SMALL, infobar: SLOTH },
	{ suffix: " Studio", type: 10, model: "20GBO9901", size: [16, 2], layout: [[...XL[0], ...XL[1]], [...XL[2], ...XL[3]]], dials: [DIAL_MASTER, DIAL_GAME] },
	{ suffix: " Virtual", type: 11, model: "UI Stream Deck", size: [8, 8], layout: XL },
	{ suffix: " Galleon", type: 12, model: "GRETSCH", size: [3, 4], layout: [[SLOTH, CLOCK, MIC], [PREV, PLAY, NEXT], [OUTPUT, DISCORD_MIC, DISCORD_DEAF], [GAME, CLIP, LOCK]], dials: [DIAL_MASTER, DIAL_GAME] },
	{ suffix: " Plus XL", type: 13, model: "20GBX9901", size: [9, 4], layout: [[...XL[0], key("internet", "Internet")], [...XL[1], key("windows", "Windows", { mode: "desktop" })], [...XL[2], key("website", "Webseite", { site: "netflix" })], [...XL[3], key("tools", "Werkzeuge", { mode: "calculator" })]], dials: [DIAL_MASTER, DIAL_GAME, DIAL_DISCORD, DIAL_SCREEN, key("appvolume", "App-Lautstärke", { app: "spotify" }), key("appvolume", "App-Lautstärke", { app: "browser" })] },
];

const profiles = DEVICES.flatMap((d) => {
	const [columns, rows] = d.size;
	const dials = (list) => Object.fromEntries((list ?? []).map((entry, i) => [`${i},0`, entry]));
	const controllers = (actions, encoders = {}) => [
		{ Type: "Keypad", Actions: actions },
		...(d.dials ? [{ Type: "Encoder", Actions: encoders }] : []),
		...(d.infobar ? [{ Type: "Neo", Actions: { "1,0": d.infobar } }] : []),
	];
	return [
		{ name: `Lazy Deck${d.suffix}`, type: d.type, model: d.model, controllers: controllers(grid(d.layout), dials(d.dials)) },
		{
			name: `Lazy Deck${d.suffix} Alarm`,
			type: d.type,
			model: d.model,
			controllers: controllers(grid(Array.from({ length: rows }, () => Array.from({ length: columns }, () => ALERT)))),
		},
	];
});

const hash = (seed, n) => createHash("sha256").update(seed).digest("hex").toUpperCase().slice(0, n);
const uuid = (h) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;

const manifestPath = join(outDir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const plugin = { Name: manifest.Name, UUID: PLUGIN, Version: manifest.Version };

for (const p of profiles) {
	const id = (what) => uuid(hash(`${PLUGIN}:${p.name}:${what}`, 32));
	const profileId = id("profile");
	const pageId = id("page");
	const defaultPageId = id("default-page");
	const base = `Profiles/${profileId}.sdProfile`;
	const outer = {
		Device: { Model: p.model, UUID: id("device").toLowerCase() },
		Name: p.name,
		Pages: { Current: "00000000-0000-0000-0000-000000000000", Default: defaultPageId.toLowerCase(), Pages: [pageId.toLowerCase()] },
		Version: "3.0",
	};
	const withIds = (controller) => {
		const actions = {};
		for (const [at, entry] of Object.entries(controller.Actions)) {
			actions[at] = { ActionID: id(`action:${controller.Type}:${at}`).toLowerCase(), LinkedTitle: true, Name: entry.Name, Plugin: plugin, Resources: null, Settings: entry.Settings, State: 0, States: entry.States, UUID: entry.UUID };
		}
		return { Actions: Object.keys(actions).length ? actions : null, Type: controller.Type };
	};
	const page = { Controllers: p.controllers.map(withIds), Icon: "", Name: "" };
	const blank = { Controllers: p.controllers.map((c) => ({ Actions: null, Type: c.Type })), Icon: "", Name: "" };
	const packageInfo = { AppVersion: "7.0.0.0", DeviceModel: p.model, DeviceSettings: null, FormatVersion: 1, OSType: "Windows", OSVersion: "10.0.0", RequiredPlugins: [PLUGIN] };
	const zip = makeZip([
		{ path: "Profiles/" },
		{ path: `${base}/` },
		{ path: `${base}/Images/` },
		{ path: `${base}/Profiles/` },
		{ path: `${base}/Profiles/${defaultPageId}/` },
		{ path: `${base}/Profiles/${defaultPageId}/Images/` },
		{ path: `${base}/Profiles/${pageId}/` },
		{ path: `${base}/Profiles/${pageId}/Images/` },
		{ path: "package.json", data: JSON.stringify(packageInfo) },
		{ path: `${base}/manifest.json`, data: JSON.stringify(outer) },
		{ path: `${base}/Profiles/${defaultPageId}/manifest.json`, data: JSON.stringify(blank) },
		{ path: `${base}/Profiles/${pageId}/manifest.json`, data: JSON.stringify(page) },
	]);
	await writeFile(join(outDir, `${p.name}.streamDeckProfile`), zip);
}

manifest.Profiles = profiles.map((p) => ({ Name: p.name, DeviceType: p.type, Readonly: false, DontAutoSwitchWhenInstalled: true, AutoInstall: true }));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, "\t")}\n`, "utf8");
console.log(`${profiles.length} profiles written`);
