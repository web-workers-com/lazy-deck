import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { LANGUAGES, normalize, tr, useTables } from "../.build/i18n.js";
import { slothKey } from "../.build/render/keys.js";
import { alertKey, alertScene } from "../.build/render/scene.js";
import { infobarImage } from "../.build/render/infobar.js";
import { text, textWidth } from "../.build/render/svg.js";

const source = JSON.parse(readFileSync(new URL("../locales/source.json", import.meta.url), "utf8"));
const table = (lang) => JSON.parse(readFileSync(new URL(`../locales/${lang}.json`, import.meta.url), "utf8"));
const holes = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
const decode = (uri) => Buffer.from(uri.split(",")[1], "base64").toString("utf8");

test("every language translates every text, placeholders included", () => {
	for (const lang of LANGUAGES.filter((l) => l !== "de")) {
		const t = table(lang);
		const missing = Object.keys(source).filter((k) => typeof t[k] !== "string" || !t[k].trim());
		assert.deepEqual(missing, [], `${lang} misses ${missing.length}`);
		const broken = Object.keys(source).filter((k) => holes(k) !== holes(t[k]));
		assert.deepEqual(broken, [], `${lang} placeholders`);
	}
});

test("Stream Deck language codes map onto ours", () => {
	assert.equal(normalize("zh_TW"), "zh_TW");
	assert.equal(normalize("zh-Hant"), "zh_TW");
	assert.equal(normalize("zh"), "zh_CN");
	assert.equal(normalize("de"), "de");
	assert.equal(normalize("it"), "en");
	assert.equal(normalize(undefined), "en");
});

test("tr fills placeholders and falls back to English, then German", () => {
	useTables("fr", { "noch {n} min": "encore {n} min" }, { Später: "Later" });
	assert.equal(tr("noch {n} min", { n: 4 }), "encore 4 min");
	assert.equal(tr("Später"), "Later");
	assert.equal(tr("Unbekannt"), "Unbekannt");
	useTables("de", {});
});

test("wide scripts are measured wide, so labels still fit their key", () => {
	assert.ok(textWidth("あいう", 10) > textWidth("abc", 10) * 1.5);
	const svg = text("通知センターを開いて確認する", { x: 0, y: 0, size: 14, max: 94, fill: "#000" });
	const size = Number(/font-size="([\d.]+)"/.exec(svg)[1]);
	const shown = />([^<]*)<\/text>/.exec(svg)[1];
	const pinned = /textLength="([\d.]+)"/.exec(svg);
	assert.ok((pinned ? Number(pinned[1]) : textWidth(shown, size)) <= 94.01);
});

test("keys render in every language", () => {
	const alert = { id: 1, level: "wait", title: "x", createdAt: 0, stage: 2, snoozedUntil: undefined };
	for (const lang of LANGUAGES) {
		useTables(lang, lang === "de" ? {} : table(lang), table("en"));
		const keys = [
			slothKey({ alert: { ...alert, snoozedUntil: 120_000 }, t: 1, now: 0 }),
			infobarImage({ alert: undefined, t: 1, now: 0 }),
			...alertScene({ columns: 5, rows: 3, alert, t: 1, now: 90_000, explain: "busy" }).map((_, i, items) => alertKey(items, i % 5, Math.floor(i / 5) % 3)),
		];
		for (const uri of keys) assert.doesNotMatch(decode(uri), /NaN|undefined|\{\w+\}/, lang);
	}
	useTables("de", {});
});
