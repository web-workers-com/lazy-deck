/**
 * Collects every German text the plugin shows and writes locales/source.json:
 *   - tr("…") and N("…") in src/
 *   - key labels and app names from the catalog
 *   - the settings pages (ui/*.html): text, label, placeholder and loading
 *   - the plugin description
 * locales/<lang>.json must translate every one of them (tests/i18n.test.mjs).
 * Usage: node scripts/i18n-strings.mjs   (after npm run icons, which writes the pages)
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { AUDIO_APPS, GROUPS, STATIONS } from "../.build/catalog.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = join(root, "com.lazydeck.plugin.sdPlugin");
const found = new Map();
const add = (text, where) => {
	const s = text.replace(/\s+/g, " ").trim();
	if (!s || !/[A-Za-zÄÖÜäöüß]/.test(s)) return;
	if (!found.has(s)) found.set(s, new Set());
	found.get(s).add(where);
};

// tr("…"), tr(`…`) without ${}, N("…") in the sources.
async function walk(dir) {
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) await walk(p);
		else if (p.endsWith(".ts")) {
			const src = await readFile(p, "utf8");
			for (const m of src.matchAll(/(?<![\w$.])(?:tr|N)\(\s*"((?:[^"\\]|\\.)*)"/g)) add(JSON.parse(`"${m[1]}"`), p.slice(root.length + 1));
		}
	}
}
await walk(join(root, "src"));

for (const g of GROUPS) for (const c of g.choices) add(c.label, "catalog label");
for (const a of AUDIO_APPS) add(a.label, "catalog audio app");
for (const s of STATIONS) if (s.id === "custom") add(s.name, "catalog station");

// Settings pages: what the user reads there.
const entity = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
for (const file of (await readdir(join(plugin, "ui"))).filter((f) => f.endsWith(".html"))) {
	const html = (await readFile(join(plugin, "ui", file), "utf8")).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<code>[\s\S]*?<\/code>|<title>[\s\S]*?<\/title>/g, " ");
	for (const m of html.matchAll(/\s(?:label|placeholder|loading)="([^"]*)"/g)) add(entity(m[1]), `ui/${file}`);
	for (const m of html.matchAll(/>([^<>]+)</g)) add(entity(m[1]), `ui/${file}`);
}

const manifest = JSON.parse(await readFile(join(plugin, "manifest.json"), "utf8"));
add(manifest.Description, "manifest Description");

const out = Object.fromEntries([...found].sort(([a], [b]) => a.localeCompare(b, "de")).map(([s, w]) => [s, [...w].join(", ")]));
await writeFile(join(root, "locales", "source.json"), `${JSON.stringify(out, null, "\t")}\n`);
console.log(`i18n: ${found.size} texts in locales/source.json`);
