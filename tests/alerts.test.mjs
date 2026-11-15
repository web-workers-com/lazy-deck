import assert from "node:assert/strict";
import { test } from "node:test";

import { AlertCenter, safeUrl } from "../.build/alerts.js";

function fakeClock() {
	let now = 0;
	const timers = new Set();
	return {
		now: () => now,
		setTimeout: (fn, ms) => {
			const t = { fn, at: now + ms };
			timers.add(t);
			return t;
		},
		clearTimeout: (t) => timers.delete(t),
		advance(ms) {
			now += ms;
			for (const t of [...timers]) {
				if (t.at <= now) {
					timers.delete(t);
					t.fn();
				}
			}
		},
	};
}

function setup() {
	const clock = fakeClock();
	const center = new AlertCenter(clock, 120_000);
	const events = [];
	for (const e of ["takeover", "release"]) center.on(e, () => events.push(e));
	return { clock, center, events };
}

test("waiting alerts take the deck after the delay", () => {
	const { clock, center, events } = setup();
	center.raise({ title: "Review" });
	assert.equal(center.current.stage, 1);
	clock.advance(119_000);
	assert.deepEqual(events, []);
	clock.advance(1_000);
	assert.deepEqual(events, ["takeover"]);
	assert.equal(center.current.stage, 2);
});

test("errors take the deck at once", () => {
	const { center, events } = setup();
	center.raise({ level: "error", title: "Build rot" });
	assert.deepEqual(events, ["takeover"]);
});

test("a waiting alert does not push an error aside", () => {
	const { center } = setup();
	center.raise({ level: "error", title: "Build rot" });
	assert.equal(center.raise({ title: "Review" }), undefined);
	assert.equal(center.current.title, "Build rot");
});

test("snooze gives the deck back and returns later", () => {
	const { clock, center, events } = setup();
	center.raise({ level: "error", title: "x" });
	center.snooze(300_000);
	assert.deepEqual(events, ["takeover", "release"]);
	clock.advance(300_000);
	assert.deepEqual(events, ["takeover", "release", "takeover"]);
});

test("resolve clears and releases; back keeps the alert without a timer", () => {
	const { clock, center, events } = setup();
	center.raise({ title: "a" }, { immediate: true });
	center.back();
	clock.advance(10 * 60_000);
	assert.deepEqual(events, ["takeover", "release"]);
	assert.ok(center.current);
	center.resolve();
	assert.equal(center.current, undefined);
});

test("only web links are kept", () => {
	assert.equal(safeUrl("https://github.com/x?a=1&b=2"), "https://github.com/x?a=1&b=2");
	assert.equal(safeUrl("file:///C:/Windows/System32/calc.exe"), undefined);
	assert.equal(safeUrl("javascript:alert(1)"), undefined);
	assert.equal(safeUrl(42), undefined);
});
