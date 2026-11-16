import assert from "node:assert/strict";
import { test } from "node:test";

import { roleAt, KEY_GRID } from "../.build/roles.js";
import { alertKey, alertScene } from "../.build/render/scene.js";
import { infobarImage } from "../.build/render/infobar.js";
import { slothKey, testKey } from "../.build/render/keys.js";
import { gameKey, iconKey, musicKey } from "../.build/render/apps.js";
import { text, textWidth } from "../.build/render/svg.js";

const decode = (uri) => Buffer.from(uri.split(",")[1], "base64").toString("utf8");

test("text never gets wider than its box", () => {
	for (const value of ["Hilfe!", "Review wartet", "Ein sehr langer Titel für eine Meldung", "x"]) {
		for (const max of [40, 84, 92]) {
			const svg = text(value, { x: 0, y: 0, size: 16, max, fill: "#000" });
			const size = Number(/font-size="([\d.]+)"/.exec(svg)[1]);
			const shown = />([^<]*)<\/text>/.exec(svg)[1].replace(/&#\d+;/g, "x");
			const pinned = /textLength="([\d.]+)"/.exec(svg);
			const width = pinned ? Number(pinned[1]) : textWidth(shown, size);
			assert.ok(width <= max + 0.01, `${value} at ${max}: ${width}`);
		}
	}
});

test("short labels are not shortened", () => {
	assert.match(text("Hilfe!", { x: 0, y: 0, size: 26, max: 90, fill: "#000", weight: 700 }), />Hilfe!</);
});

test("every device grid renders every key", () => {
	for (const [columns, rows] of Object.values(KEY_GRID)) {
		for (const level of ["wait", "error"]) {
			const alert = { id: 1, level, title: "Build rot", source: "CI", createdAt: 0, stage: 2 };
			const items = alertScene({ columns, rows, alert, t: 1.3, now: 60_000, explain: "busy" });
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < columns; c++) {
					const svg = decode(alertKey(items, c, r));
					assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
					assert.doesNotMatch(svg, /NaN|undefined/);
				}
			}
		}
	}
});

test("a 5x3 deck has all the buttons in the designed places", () => {
	assert.equal(roleAt(5, 3, 4, 0), "bubble");
	assert.equal(roleAt(5, 3, 4, 1), "view");
	assert.equal(roleAt(5, 3, 4, 2), "snooze");
	assert.equal(roleAt(5, 3, 0, 1), "reason");
	assert.equal(roleAt(5, 3, 0, 2), "explain");
	assert.equal(roleAt(5, 3, 2, 1), "picture");
});

test("still keys change far less often than the sloth, so they are rarely resent", () => {
	const alert = { id: 1, level: "wait", title: "x", createdAt: 0, stage: 2 };
	const corner = new Set();
	const face = new Set();
	for (let i = 0; i < 15; i++) {
		const items = alertScene({ columns: 5, rows: 3, alert, t: i * 0.2, now: 0 });
		corner.add(alertKey(items, 0, 0));
		face.add(alertKey(items, 2, 1));
	}
	assert.ok(corner.size <= 5, `corner changed ${corner.size} times`);
	assert.ok(face.size > corner.size);
});

test("single keys render", () => {
	for (const uri of [slothKey({ alert: undefined, t: 1 }), testKey("error"), musicKey(1), iconKey("mic", "Mikro an"), gameKey("Hades", undefined), gameKey(undefined, undefined)]) {
		assert.doesNotMatch(decode(uri), /NaN|undefined/);
	}
});

test("the Neo info bar renders every state at 232 x 50", () => {
	const base = { id: 1, stage: 1, createdAt: 0 };
	const states = [
		{ alert: undefined },
		{ alert: undefined, pomodoro: { phase: "focus", left: 90_000, progress: 0.9, paused: true } },
		{ alert: { ...base, level: "wait", title: "Ein sehr langer Titel für eine Meldung, der nie passt", source: "GitHub" } },
		{ alert: { ...base, level: "error", title: "Build rot" } },
		{ alert: { ...base, level: "wait", title: "x", snoozedUntil: 120_000 } },
	];
	for (const s of states) {
		const svg = decode(infobarImage({ ...s, t: 1.3, now: 60_000 }));
		assert.match(svg, /^<svg[^>]*viewBox="0 0 232 50"[\s\S]*<\/svg>$/);
		assert.doesNotMatch(svg, /NaN|undefined/);
	}
});
