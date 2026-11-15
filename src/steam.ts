/**
 * Reads the local Steam install: no login, no API key. Finds the game played
 * most recently and its header picture from Steam's own cache.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { isMac, isWindows, run } from "./system.js";

type Vdf = { [key: string]: string | Vdf };

/** Valve's KeyValues text format: quoted strings and braces. */
export function parseVdf(source: string): Vdf {
	const tokens = source.match(/"(?:[^"\\]|\\.)*"|[{}]/g) ?? [];
	let i = 0;
	const unquote = (t: string) => t.slice(1, -1).replace(/\\\\/g, "\\").replace(/\\"/g, '"');
	const block = (): Vdf => {
		const out: Vdf = {};
		while (i < tokens.length) {
			const token = tokens[i++]!;
			if (token === "}") {
				return out;
			}
			if (token === "{") {
				continue;
			}
			const key = unquote(token);
			const next = tokens[i];
			if (next === "{") {
				i++;
				out[key] = block();
			} else if (next !== undefined && next !== "}") {
				i++;
				out[key] = unquote(next);
			}
		}
		return out;
	};
	return block();
}

/** Case-insensitive lookup, since Steam is not consistent about case. */
function get(node: Vdf | string | undefined, key: string): Vdf | string | undefined {
	if (!node || typeof node === "string") {
		return undefined;
	}
	const found = Object.keys(node).find((k) => k.toLowerCase() === key.toLowerCase());
	return found === undefined ? undefined : node[found];
}

export async function steamRoot(): Promise<string | undefined> {
	if (isWindows) {
		try {
			const { stdout } = await run("reg.exe", ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"], { timeoutMs: 5000 });
			const match = /SteamPath\s+REG_SZ\s+(.+)/i.exec(stdout);
			if (match && existsSync(match[1]!.trim())) {
				return match[1]!.trim();
			}
		} catch {
			// fall through to the usual place
		}
		const fallback = "C:\\Program Files (x86)\\Steam";
		return existsSync(fallback) ? fallback : undefined;
	}
	for (const dir of isMac
		? [join(homedir(), "Library", "Application Support", "Steam")]
		: [join(homedir(), ".steam", "steam"), join(homedir(), ".local", "share", "Steam")]) {
		if (existsSync(dir)) {
			return dir;
		}
	}
	return undefined;
}

export type Game = { appId: string; name: string; lastPlayed: number; header?: string };

const NOT_GAMES = /redistributable|proton|steam linux runtime|steamworks|steamvr|soundtrack|dedicated server|sdk$/i;

/** Every Steam library folder (games can live on several drives). */
async function libraries(root: string): Promise<string[]> {
	const found = new Set([root]);
	try {
		const folders = parseVdf(await readFile(join(root, "steamapps", "libraryfolders.vdf"), "utf8"));
		const list = get(folders, "libraryfolders");
		if (list && typeof list !== "string") {
			for (const entry of Object.values(list)) {
				const path = get(entry, "path");
				if (typeof path === "string") {
					found.add(path);
				}
			}
		}
	} catch {
		// only the main library then
	}
	return [...found];
}

export type Download = { appId: string; name: string; done: number; total: number; running: boolean; installed: boolean };

/**
 * What an app manifest says about downloading. StateFlags is a bit set:
 * 4 = fully installed, 1024 = an update or download is running.
 */
export function downloadOf(manifest: string): Download | undefined {
	const state = get(parseVdf(manifest), "AppState");
	const appId = get(state, "appid");
	const name = get(state, "name");
	if (typeof appId !== "string" || typeof name !== "string") return undefined;
	const flags = Number(get(state, "StateFlags") ?? 0);
	const total = Number(get(state, "BytesToDownload") ?? 0);
	const done = Number(get(state, "BytesDownloaded") ?? 0);
	return { appId, name, done, total, running: (flags & 1024) !== 0, installed: (flags & 4) !== 0 && (flags & 1024) === 0 };
}

/** Every game Steam knows, with its download state. */
export async function downloads(root: string): Promise<Download[]> {
	const out: Download[] = [];
	for (const library of await libraries(root)) {
		const apps = join(library, "steamapps");
		let files: string[] = [];
		try {
			files = (await readdir(apps)).filter((f) => /^appmanifest_\d+\.acf$/.test(f));
		} catch {
			continue;
		}
		for (const file of files) {
			try {
				const d = downloadOf(await readFile(join(apps, file), "utf8"));
				if (d) out.push(d);
			} catch {
				// a half-written manifest; skip it
			}
		}
	}
	return out;
}

/** Installed games, most recently played first. */
export async function installedGames(root: string): Promise<Game[]> {
	const libs = await libraries(root);

	const games = new Map<string, Game>();
	for (const library of libs) {
		const apps = join(library, "steamapps");
		let files: string[] = [];
		try {
			files = (await readdir(apps)).filter((f) => /^appmanifest_\d+\.acf$/.test(f));
		} catch {
			continue;
		}
		for (const file of files) {
			try {
				const state = get(parseVdf(await readFile(join(apps, file), "utf8")), "AppState");
				const appId = get(state, "appid");
				const name = get(state, "name");
				if (typeof appId !== "string" || typeof name !== "string" || NOT_GAMES.test(name)) {
					continue;
				}
				const lastPlayed = Number(get(state, "LastPlayed") ?? 0);
				games.set(appId, { appId, name, lastPlayed: Number.isFinite(lastPlayed) ? lastPlayed : 0 });
			} catch {
				// a half-written manifest; skip it
			}
		}
	}

	// Older manifests lack LastPlayed; the per-user config has it.
	try {
		for (const user of await readdir(join(root, "userdata"))) {
			const config = parseVdf(await readFile(join(root, "userdata", user, "config", "localconfig.vdf"), "utf8"));
			const apps = get(get(get(get(get(config, "UserLocalConfigStore"), "Software"), "Valve"), "Steam"), "apps");
			if (!apps || typeof apps === "string") {
				continue;
			}
			for (const [appId, entry] of Object.entries(apps)) {
				const played = Number(get(entry, "LastPlayed") ?? 0);
				const game = games.get(appId);
				if (game && played > game.lastPlayed) {
					game.lastPlayed = played;
				}
			}
		}
	} catch {
		// no user data; manifests only
	}

	return [...games.values()].sort((a, b) => b.lastPlayed - a.lastPlayed);
}

/** Steam's cached header art for a game, as a data URI. */
export async function headerImage(root: string, appId: string): Promise<string | undefined> {
	const cache = join(root, "appcache", "librarycache");
	const direct = [join(cache, `${appId}_header.jpg`), join(cache, appId, "header.jpg")];
	for (const file of direct) {
		if (existsSync(file)) {
			return `data:image/jpeg;base64,${(await readFile(file)).toString("base64")}`;
		}
	}
	// Newer clients keep the art in hashed subfolders.
	try {
		const dir = join(cache, appId);
		for (const sub of await readdir(dir, { withFileTypes: true })) {
			if (sub.isDirectory() && existsSync(join(dir, sub.name, "header.jpg"))) {
				return `data:image/jpeg;base64,${(await readFile(join(dir, sub.name, "header.jpg"))).toString("base64")}`;
			}
		}
	} catch {
		// no art cached
	}
	return undefined;
}
