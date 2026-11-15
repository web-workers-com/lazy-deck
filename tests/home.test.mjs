import assert from "node:assert/strict";
import { test } from "node:test";

import { Clockwork, formatClock, formatLeft, isoWeek, parseWifi, untilFeierabend, untilWeekend, weatherInfo } from "../.build/home.js";

test("calendar weeks as on a German wall calendar", () => {
	assert.equal(isoWeek(new Date(2026, 10, 14)), 46);
	assert.equal(isoWeek(new Date(2026, 0, 1)), 1);
	assert.equal(isoWeek(new Date(2027, 0, 1)), 53);
});

test("time left reads naturally", () => {
	assert.equal(formatLeft(2 * 3600_000 + 5 * 60_000), "2:05 h");
	assert.equal(formatLeft(45 * 60_000), "45 min");
	assert.equal(formatLeft(42_000), "0:42");
	assert.equal(formatLeft(3 * 86_400_000), "3 Tage");
	assert.equal(formatClock(3723_000), "1:02:03");
});

test("Feierabend and weekend", () => {
	const thu = new Date(2026, 10, 12, 15, 0);
	assert.equal(untilFeierabend(thu, "17:00"), 2 * 3600_000);
	assert.equal(untilFeierabend(new Date(2026, 10, 12, 18, 0), "17:00"), 0);
	assert.equal(untilFeierabend(new Date(2026, 10, 14, 10, 0), "17:00"), 0); // Saturday
	assert.equal(untilWeekend(thu, "17:00"), 26 * 3600_000);
	assert.equal(untilWeekend(new Date(2026, 10, 15, 12, 0), "17:00"), 0); // Sunday
	assert.equal(untilFeierabend(thu, "kaputt"), 2 * 3600_000);
});

test("weather codes", () => {
	assert.equal(weatherInfo(0).word, "Sonnig");
	assert.equal(weatherInfo(63).sky, "rain");
	assert.equal(weatherInfo(95).sky, "storm");
});

test("netsh output in German", () => {
	const out = "    Name                   : WLAN\n    Status                 : Verbunden\n    SSID                   : Faultier-Netz\n    BSSID                  : aa:bb\n    Signal                 : 87%\n";
	assert.deepEqual(parseWifi(out), { ssid: "Faultier-Netz", signal: 87 });
	assert.equal(parseWifi("Es ist keine WLAN-Schnittstelle vorhanden."), undefined);
});

test("a clockwork pauses and resumes", () => {
	let now = 0;
	const c = new Clockwork(() => now);
	c.toggle();
	now = 5000;
	c.toggle();
	now = 60_000;
	assert.equal(c.elapsed(), 5000);
	c.toggle();
	now = 62_000;
	assert.equal(c.elapsed(), 7000);
});
