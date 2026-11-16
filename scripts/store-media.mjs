/**
 * Media for the Elgato Marketplace listing, in dist/store/:
 *   icon.png        288 x 288
 *   thumbnail.png   1920 x 960
 *   gallery-*.png   1920 x 960 (at least 3)
 * The pages are self-contained HTML (images and fonts inlined) built from the
 * plugin's real keys and scenes, then photographed by headless Chrome so the
 * brand fonts render properly. No server: Chrome opens the files directly.
 * Usage: npm run store   (needs Chrome; on WSL the Windows Chrome is used)
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { alertKey, alertScene } from "../.build/render/scene.js";
import { infobarImage } from "../.build/render/infobar.js";
import { slothKey } from "../.build/render/keys.js";
import { setLanguage } from "../.build/i18n.js";
import { loadCatalog } from "../website/catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// The store is international: keys drawn here speak English.
setLanguage("en", join(root, "locales"));
const out = join(root, "dist", "store");
const pages = join(root, ".build", "store");
await mkdir(out, { recursive: true });
await mkdir(pages, { recursive: true });

const { keys } = await loadCatalog(root);
const KEY_COUNT = keys.length;
/** A file from the repo as a data URI, so the pages need nothing else. */
const inline = (rel, type = "image/png") => `data:${type};base64,${readFileSync(join(root, rel)).toString("base64")}`;
const key = (id) => inline(`com.lazydeck.plugin.sdPlugin/imgs/actions/${id}/key@2x.png`);
const now = new Date(2026, 10, 16, 18, 32).getTime();

// The starter profiles, as in scripts/generate-profiles.mjs.
const XL = [
	["@sloth", "clock", "weather", "mic", "output", "media.mute", "timer", "steamdownloads"],
	["nowplaying", "media.previous", "media.playpause", "media.next", "media.volumedown", "media.volumeup", "radio", "apps.spotify"],
	["steam.last", "appvolume.fgdown", "appvolume.fgup", "discord.mute", "discord.deafen", "gamebar.clip", "windows.screenshot", "website.youtube"],
	["brightness.down", "brightness.up", "windows.darkmode", "awake", "sleeptimer", "windows.monitoroff", "windows.lock", "folder.downloads"],
];
const NEO = [
	["@sloth", "clock", "mic", "output"],
	["nowplaying", "media.previous", "media.playpause", "media.next"],
];
const MINI = [
	["@sloth", "mic", "output"],
	["media.volumedown", "media.playpause", "media.volumeup"],
];

const waiting = { id: 1, stage: 1, createdAt: now - 2 * 60_000, level: "wait", title: "New review", source: "GitHub · PR #42" };
const src = (id) => (id === "@sloth" ? slothKey({ alert: undefined, t: 1, now }) : id === "@sloth-wait" ? slothKey({ alert: waiting, t: 3, now }) : key(id));

/** A deck: a dark slab with keys of `size` px. */
function deck(rows, size, extra = "") {
	const gap = Math.round(size * 0.12);
	const cells = rows.flat().map((id) => `<img src="${src(id)}" width="${size}" height="${size}" alt="">`).join("");
	return `<div class="deck" style="--cols:${rows[0].length};--size:${size}px;--gap:${gap}px"><div class="keys">${cells}</div>${extra}</div>`;
}

/** The full-deck alert, one image per key, as the plugin draws it. */
function alertDeck(alert, size, t, explain) {
	const items = alertScene({ columns: 5, rows: 3, alert, t, now, explain });
	const rows = Array.from({ length: 3 }, (_, r) => Array.from({ length: 5 }, (_, c) => alertKey(items, c, r)));
	const gap = Math.round(size * 0.1);
	return `<div class="deck" style="--cols:5;--size:${size}px;--gap:${gap}px"><div class="keys">${rows.flat().map((u) => `<img src="${u}" width="${size}" height="${size}" alt="">`).join("")}</div></div>`;
}

const font = (name) => inline(`node_modules/@fontsource/${name}`, "font/woff2");
const CSS = `
@font-face{font-family:Fredoka;font-weight:500;src:url(${font("fredoka/files/fredoka-latin-500-normal.woff2")})}
@font-face{font-family:Fredoka;font-weight:600;src:url(${font("fredoka/files/fredoka-latin-600-normal.woff2")})}
@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka/files/fredoka-latin-700-normal.woff2")})}
@font-face{font-family:Inter;font-weight:400;src:url(${font("inter/files/inter-latin-400-normal.woff2")})}
@font-face{font-family:Inter;font-weight:500;src:url(${font("inter/files/inter-latin-500-normal.woff2")})}
*{box-sizing:border-box}
html,body{margin:0;width:1920px;height:960px;overflow:hidden}
body{font-family:Inter,sans-serif;color:#F0DFC0;background:radial-gradient(1200px 800px at 75% 45%,#2E3D29 0%,#1F2A1D 55%,#141B12 100%);position:relative}
h1,h2{font-family:Fredoka,sans-serif;margin:0;letter-spacing:-.01em}
h2{font-weight:700;font-size:64px;line-height:1.05}
.lead{font-size:28px;line-height:1.45;color:#C9BFA8;margin:18px 0 0}
.lead b{color:#F0DFC0;font-weight:500}
.honey{color:#F2B544}.leaf{color:#9CC25B}.coral{color:#E8735A}
.deck{background:#0B0E0A;border-radius:calc(var(--size)*.28);padding:calc(var(--gap)*1.6);box-shadow:0 30px 80px rgba(0,0,0,.45),inset 0 0 0 2px #2B3727}
.keys{display:grid;grid-template-columns:repeat(var(--cols),var(--size));gap:var(--gap)}
.keys img{display:block;border-radius:calc(var(--size)*.16)}
.infobar{margin-top:calc(var(--gap)*1.4);display:flex;justify-content:center}
.infobar img{border-radius:calc(var(--size)*.12)}
.label{font-family:Fredoka,sans-serif;font-weight:600;font-size:26px;margin-top:18px;text-align:center;color:#F0DFC0}
.label span{display:block;font-family:Inter;font-weight:400;font-size:20px;color:#9D9A94;margin-top:4px}
.brand{display:flex;align-items:center;gap:22px}
.brand img{width:104px;height:104px;border-radius:26px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.word{font-family:Fredoka;font-weight:700;font-size:64px;letter-spacing:-.02em}
`;

const page = (body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;

const PAGES = {
	thumbnail: page(`
<div style="position:absolute;left:120px;top:0;bottom:0;width:820px;display:flex;flex-direction:column;justify-content:center">
  <div class="brand"><img src="${inline("com.lazydeck.plugin.sdPlugin/imgs/plugin/marketplace@2x.png")}" alt=""><span class="word">lazy<span class="leaf">deck</span></span></div>
  <h1 style="font-weight:700;font-size:132px;line-height:.98;margin-top:48px">Press less.<br><span class="leaf">Ship more.</span></h1>
  <p class="lead" style="font-size:32px;margin-top:34px;max-width:760px">A sloth on your Stream Deck that wakes up when something needs you. <b>${KEY_COUNT} keys, zero setup.</b></p>
</div>
<div style="position:absolute;right:110px;top:50%;transform:translateY(-50%) rotate(-3deg)">${deck(XL, 96)}</div>`),

	"gallery-1-alarm": page(`
<div style="position:absolute;left:120px;right:120px;top:90px">
  <h2>When something needs you, <span class="honey">Sam takes the whole deck</span></h2>
  <p class="lead">A review waits, a build breaks, the timer runs out: Sam wakes up and fills every key. <b>View</b>, <b>Snooze</b>, or let Claude <b>explain</b> the error.</p>
</div>
<div style="position:absolute;left:0;right:0;bottom:90px;display:flex;justify-content:center;gap:90px">
  <div>${alertDeck({ ...waiting, stage: 2 }, 124, 0.7)}<div class="label">Something is waiting<span>pulses in honey, takes the deck after 2 minutes</span></div></div>
  <div>${alertDeck({ id: 2, stage: 2, level: "error", title: "Build failed", source: "CI · GitHub", createdAt: now - 60_000 }, 124, 0.4, "busy")}<div class="label">Something broke<span>coral, right away</span></div></div>
</div>`),

	"gallery-2-keys": (() => {
		const cols = 16;
		const list = keys.slice(0, cols * 5);
		const cells = list.map((k) => `<img src="${inline(`com.lazydeck.plugin.sdPlugin/${k.image}@2x.png`)}" width="100" height="100" alt="">`).join("");
		return page(`
<div style="position:absolute;left:120px;right:120px;top:90px">
  <h2>${KEY_COUNT} keys for everyday life, <span class="leaf">nothing to set up</span></h2>
  <p class="lead">Music, sound, Discord, Steam, your PC, timers, weather and more. Each key is a little animated scene that shows what's going on. Drag it in, done.</p>
</div>
<div style="position:absolute;left:0;right:0;bottom:70px;display:flex;justify-content:center;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 8%,#000 92%,transparent 100%)">
  <div style="display:grid;grid-template-columns:repeat(${cols},100px);gap:14px">${cells}</div>
</div>`);
	})(),

	"gallery-3-devices": page(`
<div style="position:absolute;left:120px;right:120px;top:90px">
  <h2>Every Stream Deck, <span class="leaf">ready to go</span></h2>
  <p class="lead">Ready-made profiles for Mini, Neo, Stream Deck, XL, Stream Deck +, + XL, Studio, Mobile, the virtual deck and Galleon 100 SD. Sam always fills the whole deck.</p>
</div>
<div style="position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center;align-items:flex-end;gap:70px">
  <div>${deck(XL, 92)}<div class="label">Stream Deck XL</div></div>
  <div>${deck(NEO, 92, `<div class="infobar"><img src="${infobarImage({ alert: undefined, t: 1, now })}" width="${4 * 92 + 3 * 11}" alt=""></div>`)}<div class="label">Stream Deck Neo</div></div>
  <div>${deck(MINI, 92)}<div class="label">Stream Deck Mini</div></div>
</div>`),

	"gallery-4-neo": page(`
<div style="position:absolute;left:120px;right:120px;top:90px">
  <h2>On the Neo, Sam lives <span class="honey">in the info bar</span></h2>
  <p class="lead">The strip below the keys shows the time when all is calm, what's waiting and since when during an alert, and how much is left of your focus timer.</p>
</div>
<div style="position:absolute;left:0;right:0;bottom:70px;display:flex;flex-direction:column;align-items:center;gap:26px">
  ${[
		[infobarImage({ alert: undefined, t: 1, now }), "All calm"],
		[infobarImage({ alert: waiting, t: 1.4, now }), "Something is waiting"],
		[infobarImage({ alert: undefined, t: 1, now, pomodoro: { phase: "focus", left: 19 * 60_000, progress: 0.25, paused: false } }), "Focus timer"],
	]
		.map(([uri, label]) => `<div style="display:flex;align-items:center;gap:40px"><div class="deck" style="--size:100px;--gap:12px;border-radius:26px"><img src="${uri}" width="580" height="125" style="display:block;border-radius:14px" alt=""></div><div class="label" style="margin:0;width:340px;text-align:left;font-size:30px">${label}</div></div>`)
		.join("")}
</div>`),
};

const winChrome = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe";
const chrome = process.env.CHROME || (existsSync(winChrome) ? winChrome : "google-chrome");
const toWin = (p) => (chrome === winChrome ? execFileSync("wslpath", ["-w", p]).toString().trim() : p);

for (const [name, html] of Object.entries(PAGES)) {
	await writeFile(join(pages, `${name}.html`), html);
	const file = join(out, `${name}.png`);
	execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1920,960", "--virtual-time-budget=3000", `--screenshot=${toWin(file)}`, `file:///${toWin(join(pages, `${name}.html`)).replace(/\\/g, "/")}`], { stdio: "ignore" });
	console.log(file);
}

await sharp(join(root, "com.lazydeck.plugin.sdPlugin/imgs/plugin/marketplace@2x.png")).resize(288, 288).png().toFile(join(out, "icon.png"));
console.log(join(out, "icon.png"));
