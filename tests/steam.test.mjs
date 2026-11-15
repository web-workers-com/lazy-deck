import assert from "node:assert/strict";
import { test } from "node:test";

import { parseVdf } from "../.build/steam.js";

test("parses Steam's KeyValues files", () => {
	const vdf = parseVdf(`"libraryfolders"
{
	"0" { "path" "C:\\\\Program Files (x86)\\\\Steam" "apps" { "570" "123" } }
	"1" { "path" "D:\\\\SteamLibrary" }
}`);
	assert.equal(vdf.libraryfolders["0"].path, "C:\\Program Files (x86)\\Steam");
	assert.equal(vdf.libraryfolders["1"].path, "D:\\SteamLibrary");
	assert.equal(vdf.libraryfolders["0"].apps["570"], "123");
});

test("reads an app manifest", () => {
	const vdf = parseVdf(`"AppState" { "appid" "1145360" "name" "Hades" "LastPlayed" "1731500000" }`);
	assert.equal(vdf.AppState.name, "Hades");
});
