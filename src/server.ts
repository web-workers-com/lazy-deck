/**
 * A tiny local door for alerts: any script, CI hook or bot on this machine
 * can raise one with a single request.
 *
 *   curl "http://127.0.0.1:47321/alert?level=error&title=Build%20rot&source=CI"
 *   curl -X POST http://127.0.0.1:47321/alert -d '{"title":"Review wartet","url":"https://…"}'
 *   curl http://127.0.0.1:47321/clear
 *
 * Only this machine can reach it, and requests from web pages are refused,
 * so a website you visit cannot set off your deck.
 */
import { createServer, type IncomingMessage, type Server } from "node:http";

import type { AlertCenter, AlertInput } from "./alerts.js";

export const PORT = 47321;

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
			if (body.length > 64_000) {
				reject(new Error("too large"));
				req.destroy();
			}
		});
		req.on("end", () => resolve(body));
		req.on("error", reject);
	});
}

/** Browsers mark their requests; command-line tools do not. */
function fromBrowser(req: IncomingMessage): boolean {
	return Boolean(req.headers.origin || req.headers["sec-fetch-site"] || req.headers.referer);
}

export function startServer(center: AlertCenter, log: (message: string) => void): Server {
	const server = createServer(async (req, res) => {
		const reply = (status: number, body: unknown) => {
			res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
			res.end(JSON.stringify(body));
		};
		if (fromBrowser(req)) {
			return reply(403, { ok: false, error: "Requests from web pages are not accepted." });
		}
		const url = new URL(req.url ?? "/", "http://127.0.0.1");
		try {
			switch (url.pathname) {
				case "/alert": {
					let input: AlertInput = Object.fromEntries(url.searchParams) as AlertInput;
					if (req.method === "POST") {
						const raw = await readBody(req);
						if (raw.trim()) {
							input = { ...input, ...(JSON.parse(raw) as AlertInput) };
						}
					}
					const alert = center.raise(input, { immediate: url.searchParams.get("now") === "1" });
					log(`alert via http: ${alert ? `${alert.level} "${alert.title}"` : "ignored, an error is showing"}`);
					return reply(200, { ok: true, alert: alert ?? center.current });
				}
				case "/clear":
					center.resolve();
					return reply(200, { ok: true });
				case "/status":
					return reply(200, { ok: true, alert: center.current ?? null });
				default:
					return reply(200, {
						ok: true,
						name: "Lazy Deck",
						usage: [
							"GET|POST /alert  level=wait|error title= source= detail= url= now=1",
							"GET /clear",
							"GET /status",
						],
					});
			}
		} catch (error) {
			return reply(400, { ok: false, error: (error as Error).message });
		}
	});
	server.on("error", (error) => log(`alert server: ${error.message}`));
	server.listen(PORT, "127.0.0.1", () => log(`alert server on http://127.0.0.1:${PORT}`));
	return server;
}
