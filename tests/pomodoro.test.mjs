import assert from "node:assert/strict";
import { test } from "node:test";

import { BREAK_MS, FOCUS_MS, Pomodoro } from "../.build/pomodoro.js";

test("focus, pause, resume, break, done", () => {
	let now = 0;
	const p = new Pomodoro(() => now);
	p.press();
	assert.equal(p.phase, "focus");
	now += 10 * 60_000;
	p.press(); // pause
	now += 60 * 60_000;
	assert.equal(p.left(), FOCUS_MS - 10 * 60_000);
	p.press(); // resume
	now += FOCUS_MS - 10 * 60_000;
	assert.equal(p.tick(), "focus");
	assert.equal(p.phase, "break");
	now += BREAK_MS;
	assert.equal(p.tick(), "break");
	assert.equal(p.phase, "idle");
	assert.equal(p.rounds, 1);
});
