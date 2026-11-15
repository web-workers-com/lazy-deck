import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { GROUPS } from "../.build/catalog.js";
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
