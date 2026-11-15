/**
 * Renders what the deck would show into PNGs under .build/preview, so the
 * keys can be looked at without a Stream Deck.
 * Usage: npm run preview [-- columns rows]
 */
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

import { alertKey, alertScene, PITCH } from "../.build/render/scene.js";
import { slothKey, testKey } from "../.build/render/keys.js";

const [columns = 5, rows = 3] = process.argv.slice(2).map(Number);
const out = new URL("../.build/preview/", import.meta.url);
await mkdir(out, { recursive: true });

const png = (uri) => sharp(Buffer.from(uri.split(",")[1], "base64")).resize(124, 124).png().toBuffer();
const now = Date.now();

async function deck(name, alert, t, explain) {
	const items = alertScene({ columns, rows, alert, t, now, explain });
	const composites = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < columns; c++) {
			composites.push({ input: await png(alertKey(items, c, r)), left: 28 + c * PITCH, top: 28 + r * PITCH });
		}
	}
	const file = new URL(`${name}-${columns}x${rows}.png`, out);
	await sharp({ create: { width: columns * PITCH + 42, height: rows * PITCH + 42, channels: 4, background: "#0B0E0A" } })
		.composite(composites)
		.png()
		.toFile(file.pathname);
	console.log(file.pathname);
}

const base = { id: 1, stage: 2, createdAt: now - 2 * 60_000 };
await deck("alert-wait", { ...base, level: "wait", title: "Review wartet", source: "GitHub · PR #42", url: "https://github.com" }, 0.7);
await deck("alert-error", { ...base, level: "error", title: "Build rot", source: "CI · GitHub" }, 0.4, "busy");

const singles = [
	slothKey({ alert: undefined, t: 1 }),
	slothKey({ alert: { ...base, level: "wait", title: "Review wartet", stage: 1 }, t: 3 }),
	slothKey({ alert: { ...base, level: "error", title: "Build rot", stage: 1 }, t: 1 }),
	slothKey({ alert: { ...base, level: "wait", title: "x", stage: 1, snoozedUntil: now + 4 * 60_000 }, t: 1 }),
	testKey("wait"),
	testKey("error"),
];
const composites = await Promise.all(singles.map(async (uri, i) => ({ input: await png(uri), left: 14 + i * PITCH, top: 14 })));
const file = new URL("keys.png", out);
await sharp({ create: { width: singles.length * PITCH + 14, height: 152, channels: 4, background: "#0B0E0A" } }).composite(composites).png().toFile(file.pathname);
console.log(file.pathname);
