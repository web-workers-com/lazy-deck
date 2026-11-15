/**
 * Builds dist/com.lazydeck.plugin.streamDeckPlugin without the Elgato CLI,
 * which needs the internet to validate. The file is a ZIP of the .sdPlugin
 * folder; double-clicking it installs the plugin in Stream Deck.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { makeZip } from "./lib/zip.mjs";

const UUID = "com.lazydeck.plugin";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, `${UUID}.sdPlugin`);
const skip = (path) => /(^|\/)logs(\/|$)|\.map$|\.log$|\.DS_Store$/.test(path);

const entries = [];
async function walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		const rel = `${UUID}.sdPlugin/${relative(source, full).split("\\").join("/")}`;
		if (skip(rel)) continue;
		if (entry.isDirectory()) {
			entries.push({ path: `${rel}/` });
			await walk(full);
		} else {
			entries.push({ path: rel, data: await readFile(full) });
		}
	}
}
entries.push({ path: `${UUID}.sdPlugin/` });
await walk(source);

await mkdir(join(root, "dist"), { recursive: true });
const out = join(root, "dist", `${UUID}.streamDeckPlugin`);
await writeFile(out, makeZip(entries));
console.log(`${out} (${entries.length} entries)`);
