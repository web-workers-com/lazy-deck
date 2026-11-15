/**
 * Adds the catalog groups and the live everyday actions to the manifest and
 * writes their settings pages, so the list in src/catalog.ts is the only
 * place a choice has to be added.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { AUDIO_APPS, GROUPS, HIDDEN_BASES, LIST_ORDER, STATIONS, VARIANTS, variantUuid } from "../.build/catalog.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "com.lazydeck.plugin.sdPlugin");
const manifestPath = join(root, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const page = (body) => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Lazy Deck</title>
<script src="./libs/sdpi-components.js"></script>
<style>.hint{color:#9d9a94;font-size:11px;line-height:1.5;padding:4px 0 8px}</style>
</head>
<body>
${body}
</body>
</html>
`;
const select = (label, setting, options, hint = "") =>
	`<sdpi-item label="${esc(label)}"><sdpi-select setting="${setting}" default="${options[0][0]}">${options.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</sdpi-select></sdpi-item>` +
	(hint ? `\n<div class="hint">${hint}</div>` : "");

const LIVE = [
	["clock", "Uhr", "Uhrzeit, Wochentag, Datum und Kalenderwoche.", null],
	["weather", "Wetter", "Wetter für deinen Ort, ohne Einrichtung. Der Ort kommt aus deiner IP-Adresse (ipwho.is), das Wetter von Open-Meteo.", null],
	["internet", "Internet", "Zeigt, wie schnell das Internet antwortet. Ist es 30 Sekunden weg, meldet sich Sam.", null],
	["wifi", "WLAN", "WLAN-Name und Signalstärke.", null],
	["battery", "Akku", "Akkustand und ob geladen wird (Laptops). Am PC: Netzstrom.", null],
	["timer", "Timer", "Eieruhr: drücken startet/pausiert, halten setzt zurück. Wenn sie abläuft, meldet sich Sam.",
		select("Dauer", "minutes", [["10", "10 Minuten"], ["1", "1 Minute"], ["3", "3 Minuten"], ["5", "5 Minuten"], ["15", "15 Minuten"], ["20", "20 Minuten"], ["30", "30 Minuten"], ["45", "45 Minuten"], ["60", "1 Stunde"]])],
	["stopwatch", "Stoppuhr", "Drücken startet/stoppt, halten setzt zurück.", null],
	["countdown", "Countdown", "Wie lange noch bis Feierabend oder Wochenende.",
		select("Bis", "mode", [["feierabend", "Feierabend"], ["weekend", "Wochenende (Freitag)"]]) +
			`\n<sdpi-item label="Uhrzeit"><sdpi-textfield setting="time" placeholder="17:00" default="17:00"></sdpi-textfield></sdpi-item>`],
	["reminder", "Erinnerung", "Erinnert dich regelmäßig ans Trinken oder Bewegen. Drücken heißt erledigt.",
		select("Woran", "mode", [["water", "Trinken"], ["move", "Bewegen"]]) +
			"\n" + select("Alle", "minutes", [["", "Standard (60 / 45 min)"], ["30", "30 Minuten"], ["45", "45 Minuten"], ["60", "1 Stunde"], ["90", "1,5 Stunden"], ["120", "2 Stunden"]])],
	["chance", "Münze & Würfel", "Münzwurf (Kopf zeigt Sam) oder Würfel. Für alle Entscheidungen, die man nicht selbst treffen will.",
		select("Was", "mode", [["coin", "Münzwurf"], ["dice", "Würfel"]])],
];

const upsert = (entry) => {
	const i = manifest.Actions.findIndex((a) => a.UUID === entry.UUID);
	if (i >= 0) manifest.Actions[i] = entry;
	else manifest.Actions.push(entry);
};

for (const g of GROUPS) {
	upsert({
		UUID: `com.lazydeck.plugin.${g.uuid}`,
		Name: g.name,
		Tooltip: g.tooltip,
		Icon: `imgs/actions/${g.uuid}/icon`,
		Controllers: ["Keypad"],
		PropertyInspectorPath: `ui/${g.uuid}.html`,
		UserTitleEnabled: false,
		States: [{ Image: `imgs/actions/${g.uuid}/key`, ShowTitle: false }],
	});
	await writeFile(join(root, "ui", `${g.uuid}.html`), page(select("Aktion", g.setting, g.choices.map((c) => [c.id, c.name]))));
}

for (const [uuid, name, tooltip, body] of LIVE) {
	upsert({
		UUID: `com.lazydeck.plugin.${uuid}`,
		Name: name,
		Tooltip: tooltip,
		Icon: `imgs/actions/${uuid}/icon`,
		Controllers: ["Keypad"],
		...(body ? { PropertyInspectorPath: `ui/${uuid}.html` } : {}),
		UserTitleEnabled: false,
		States: [{ Image: `imgs/actions/${uuid}/key`, ShowTitle: false }],
	});
	if (body) await writeFile(join(root, "ui", `${uuid}.html`), page(`${body}\n<div class="hint">${tooltip}</div>`));
}

const text = (label, setting, placeholder) =>
	`<sdpi-item label="${esc(label)}"><sdpi-textfield setting="${setting}" placeholder="${esc(placeholder)}"></sdpi-textfield></sdpi-item>`;
const apps = (list) => list.map((a) => [a.id, a.name]);

/** Everyday keys for everyone (src/actions/everyday.ts). The last field: works on a dial. */
const EVERYDAY = [
	["output", "Ausgabe wechseln", "Schaltet den Ton zwischen deinen Geräten um: Kopfhörer, Lautsprecher, Monitor. Virtuelle Geräte (Voicemod, Loopback …) werden übersprungen. Oder wähle genau zwei.",
		`<sdpi-item label="Gerät A"><sdpi-select setting="a" datasource="outputs" hot-reload loading="Lade Geräte …"></sdpi-select></sdpi-item>` +
			`\n<sdpi-item label="Gerät B"><sdpi-select setting="b" datasource="outputs" hot-reload loading="Lade Geräte …"></sdpi-select></sdpi-item>`,
		null],
	["appvolume", "App-Lautstärke", "Lauter, leiser oder stumm, nur für eine App: das Spiel im Vordergrund, Discord, Spotify, Browser … oder alles zusammen. Auf einem Drehregler: drehen und drücken.",
		select("App", "app", apps(AUDIO_APPS)) + "\n" + select("Taste", "mode", [["down", "Leiser"], ["up", "Lauter"], ["mute", "Stumm an/aus"]]) + "\n" + text("Prozessname", "process", "nur bei Eigene App, z. B. vlc"),
		{ Rotate: "Lautstärke", Push: "Stumm" }],
	["appmic", "App-Mikro", "Schaltet das Mikro nur für eine App stumm, z. B. Teams, Zoom oder Meet im Browser. Andere Apps hören dich weiter. Die Taste zeigt den echten Zustand.",
		select("App", "app", apps(AUDIO_APPS.filter((a) => !["master", "spotify"].includes(a.id)))) + "\n" + text("Prozessname", "process", "nur bei Eigene App, z. B. obs64"),
		null],
	["brightness", "Helligkeit", "Bildschirm heller oder dunkler, auch externe Monitore (über DDC/CI, wie Twinkle Tray). Auf einem Drehregler: drehen.",
		select("Taste", "mode", [["down", "Dunkler"], ["up", "Heller"]]),
		{ Rotate: "Helligkeit" }],
	["radio", "Radio", "Spielt einen Radiosender, ein Druck an, ein Druck aus. Nichts zu installieren, kein Konto.",
		select("Sender", "station", STATIONS.map((st) => [st.id, st.name])) + "\n" + text("Stream-Link", "url", "nur bei Eigener Sender: https://…") + "\n" + text("Name", "name", "Mein Sender"),
		null],
	["awake", "Wach bleiben", "Der PC und der Bildschirm schlafen nicht ein, solange die Taste an ist: für Downloads, Präsentationen, Filme.",
		select("Wie lange", "hours", [["", "bis ich wieder drücke"], ["1", "1 Stunde"], ["2", "2 Stunden"], ["4", "4 Stunden"]]),
		null],
	["sleeptimer", "Ausschalt-Timer", "PC aus oder schlafen in 30, 60 oder 90 Minuten, z. B. abends beim Film. Nochmal drücken: 30 Minuten mehr, halten: abbrechen. Eine Minute vorher sagt Sam Bescheid.",
		select("Nach", "minutes", [["30", "30 Minuten"], ["60", "1 Stunde"], ["90", "1,5 Stunden"], ["120", "2 Stunden"]]) + "\n" + select("Dann", "how", [["shutdown", "Herunterfahren"], ["sleep", "Energiesparen"]]),
		null],
	["steamdownloads", "Steam-Downloads", "Wie weit Steam mit dem Laden ist. Ist ein großer Download fertig, sagt Sam Bescheid, auch ohne diese Taste.", null, null],
];

for (const [uuid, name, tooltip, body, dial] of EVERYDAY) {
	upsert({
		UUID: `com.lazydeck.plugin.${uuid}`,
		Name: name,
		Tooltip: tooltip,
		Icon: `imgs/actions/${uuid}/icon`,
		Controllers: dial ? ["Keypad", "Encoder"] : ["Keypad"],
		...(dial ? { Encoder: { layout: "$B1", TriggerDescription: dial } } : {}),
		...(body ? { PropertyInspectorPath: `ui/${uuid}.html` } : {}),
		UserTitleEnabled: false,
		States: [{ Image: `imgs/actions/${uuid}/key`, ShowTitle: false }],
	});
	if (body) await writeFile(join(root, "ui", `${uuid}.html`), page(`${body}\n<div class="hint">${tooltip}</div>`));
}

// Standalone keys: every command as its own entry, nothing to choose.
for (const v of VARIANTS) {
	const uuid = variantUuid(v);
	const folder = uuid.replace("com.lazydeck.plugin.", "");
	upsert({
		UUID: uuid,
		Name: v.name,
		Tooltip: v.tooltip,
		Icon: `imgs/actions/${folder}/icon`,
		Controllers: ["Keypad"],
		UserTitleEnabled: false,
		States: [{ Image: `imgs/actions/${folder}/key`, ShowTitle: false }],
	});
}

// The pick-one actions stay for older profiles, but leave the list.
for (const a of manifest.Actions) {
	const base = a.UUID.replace("com.lazydeck.plugin.", "");
	if (HIDDEN_BASES.includes(base)) a.VisibleInActionsList = false;
	else delete a.VisibleInActionsList;
}

// List order: by topic, everyday first; standalone keys next to their topic.
const rank = (a) => {
	const [base] = a.UUID.replace("com.lazydeck.plugin.", "").split(".");
	const i = LIST_ORDER.indexOf(base);
	return i < 0 ? LIST_ORDER.length : i;
};
manifest.Actions = manifest.Actions.map((a, i) => ({ a, i })).sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i).map((x) => x.a);

// Version kommt aus package.json (Stream Deck will vier Stellen).
const pkg = JSON.parse(await readFile(join(root, "..", "package.json"), "utf8"));
manifest.Version = `${pkg.version}.0`;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, "\t")}\n`, "utf8");
console.log(`manifest: ${manifest.Actions.length} actions`);
