import assert from "node:assert/strict";
import { after, test } from "node:test";

import { AlertCenter } from "../.build/alerts.js";
import { PORT, startServer } from "../.build/server.js";

const center = new AlertCenter();
const server = startServer(center, () => {});
await new Promise((r) => server.once("listening", r));
after(() => server.close());
const base = `http://127.0.0.1:${PORT}`;

test("a script can raise and clear an alert", async () => {
	const res = await fetch(`${base}/alert?level=error&title=Build%20rot&source=CI`);
	assert.equal(res.status, 200);
	assert.equal(center.current.title, "Build rot");
	assert.equal(center.current.stage, 2);
	await fetch(`${base}/clear`);
	assert.equal(center.current, undefined);
});

test("JSON bodies work and unsafe links are dropped", async () => {
	await fetch(`${base}/alert`, { method: "POST", body: JSON.stringify({ title: "Review", url: "file:///etc/passwd" }) });
	assert.equal(center.current.title, "Review");
	assert.equal(center.current.url, undefined);
	center.resolve();
});

test("requests from web pages are refused", async () => {
	const res = await fetch(`${base}/alert?title=x`, { headers: { origin: "https://evil.example" } });
	assert.equal(res.status, 403);
	assert.equal(center.current, undefined);
});
