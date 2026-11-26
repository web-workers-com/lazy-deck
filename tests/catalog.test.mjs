import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { inflateSync } from "node:zlib";

import { GROUPS, ROUTERS, VARIANTS, variantUuid } from "../.build/catalog.js";
import { ICONS } from "../.build/render/apps.js";
import { textWidth } from "../.build/render/svg.js";

const table = readFileSync(new URL("../src/actions/table.ts", import.meta.url), "utf8");

test("every choice can be pressed and drawn", () => {
	for (const g of GROUPS) {
		for (const c of g.choices) {
			const launcher = c.target !== undefined || g.uuid === "folder";
			assert.ok(launcher || new RegExp(`\\n\\t${c.id}: `).test(table), `${g.uuid}/${c.id} has no press handler`);
			assert.ok(c.tile || ICONS[c.icon], `${g.uuid}/${c.id} has no picture`);
		}
	}
});

test("key labels stay readable inside their pill", () => {
	for (const g of GROUPS) {
		for (const c of g.choices) {
			const size = Math.min(11.5, 84 / ([...c.label].length * 0.6));
			assert.ok(size >= 9.5, `${c.label} would shrink to ${size.toFixed(1)}`);
			assert.ok(textWidth(c.label, size) <= 84.01);
		}
	}
});

test("ids are unique within each group", () => {
	for (const g of GROUPS) {
		assert.equal(new Set(g.choices.map((c) => c.id)).size, g.choices.length, g.uuid);
	}
});

test("there are plenty of things to put on a deck", () => {
	const manifest = JSON.parse(readFileSync(new URL("../com.lazydeck.plugin.sdPlugin/manifest.json", import.meta.url), "utf8"));
	const choices = GROUPS.reduce((n, g) => n + g.choices.length, 0);
	const single = manifest.Actions.filter((a) => a.VisibleInActionsList !== false && !GROUPS.some((g) => a.UUID.endsWith(`.${g.uuid}`))).length;
	assert.ok(choices + single >= 50, `${choices + single} features`);
});

// Elgato Marketplace guidelines (docs.elgato.com/guidelines/stream-deck/plugins).
const manifestNow = () => JSON.parse(readFileSync(new URL("../com.lazydeck.plugin.sdPlugin/manifest.json", import.meta.url), "utf8"));

test("Elgato: at most 30 actions in Stream Deck's list", () => {
	const visible = manifestNow().Actions.filter((a) => a.VisibleInActionsList !== false);
	assert.ok(visible.length <= 30, `${visible.length} visible actions: put new commands into a group's settings instead`);
});

test("Elgato: standalone keys stay out of the list", () => {
	const visible = new Set(manifestNow().Actions.filter((a) => a.VisibleInActionsList !== false).map((a) => a.UUID));
	for (const v of VARIANTS) assert.ok(!visible.has(variantUuid(v)), variantUuid(v));
});

test("Elgato: action names are 30 characters or less", () => {
	for (const a of manifestNow().Actions.filter((x) => x.VisibleInActionsList !== false)) assert.ok(a.Name.length <= 30, a.Name);
});

/** RGBA pixels of an 8-bit PNG, decoded with zlib only (the CI runner cannot load sharp). */
function readPng(file) {
	const buf = readFileSync(file);
	let width = 0, height = 0, type = 0;
	const idat = [];
	for (let o = 8; o < buf.length; ) {
		const len = buf.readUInt32BE(o);
		const kind = buf.toString("ascii", o + 4, o + 8);
		const body = buf.subarray(o + 8, o + 8 + len);
		if (kind === "IHDR") {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			assert.equal(body[8], 8, `${file}: 8-bit expected`);
			type = body[9];
		} else if (kind === "IDAT") idat.push(body);
		o += 12 + len;
	}
	const bpp = { 6: 4, 4: 2, 2: 3, 0: 1 }[type];
	assert.ok(bpp, `${file}: colour type ${type}`);
	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * bpp;
	const px = Buffer.alloc(stride * height);
	for (let y = 0; y < height; y++) {
		const f = raw[y * (stride + 1)];
		for (let x = 0; x < stride; x++) {
			const v = raw[y * (stride + 1) + 1 + x];
			const a = x >= bpp ? px[y * stride + x - bpp] : 0;
			const b = y > 0 ? px[(y - 1) * stride + x] : 0;
			const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
			const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
			const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
			px[y * stride + x] = (v + pred) & 255;
		}
	}
	// To RGBA.
	const out = Buffer.alloc(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		const s = px.subarray(i * bpp, i * bpp + bpp);
		const [r, g, b2, al] = bpp === 4 ? s : bpp === 3 ? [s[0], s[1], s[2], 255] : bpp === 2 ? [s[0], s[0], s[0], s[1]] : [s[0], s[0], s[0], 255];
		out.set([r, g, b2, al], i * 4);
	}
	return out;
}

test("Elgato: list and category icons are white on transparent", () => {
	const m = manifestNow();
	const files = [m.CategoryIcon, ...m.Actions.filter((a) => a.VisibleInActionsList !== false).map((a) => a.Icon)];
	for (const f of files) {
		const data = readPng(new URL(`../com.lazydeck.plugin.sdPlugin/${f}@2x.png`, import.meta.url));
		let coloured = 0;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] < 40) continue;
			if (Math.min(data[i], data[i + 1], data[i + 2]) < 235) coloured++;
		}
		assert.equal(coloured, 0, `${f}: ${coloured} non-white pixels`);
		assert.ok(data[3] < 10, `${f}: corner must be transparent`);
	}
});

test("every hidden live key is reachable through a combined action", () => {
	for (const base of ["internet", "wifi", "battery", "system", "timer", "stopwatch", "countdown"]) {
		assert.ok(ROUTERS.some((r) => r.choices.some((c) => c.base === base)), base);
	}
});
