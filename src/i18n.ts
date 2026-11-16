/**
 * Translations for everything the plugin writes: key labels, alerts, Sam's
 * messages. The German text is the key; each language has a table
 * (locales/<lang>.json, shipped in the plugin as <lang>.json "Localization").
 * Missing entries fall back to English, then to German.
 *
 *   tr("Später")                       → "Later"
 *   tr("noch {n} min", { n: 4 })       → "4 min left"
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Languages Stream Deck itself offers. */
export const LANGUAGES = ["de", "en", "es", "fr", "ja", "ko", "zh_CN", "zh_TW"] as const;
export type Lang = (typeof LANGUAGES)[number];

type Table = Record<string, string>;

let current: Lang = "de";
let table: Table = {};
let fallback: Table = {};

const fill = (text: string, vars?: Record<string, string | number>) =>
	vars ? text.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all)) : text;

/** Translates a German UI text into the current language. */
export function tr(de: string, vars?: Record<string, string | number>): string {
	return fill(table[de] ?? fallback[de] ?? de, vars);
}

export function lang(): Lang {
	return current;
}

/** Turns whatever Stream Deck (or a test) says into one of ours; unknown → English. */
export function normalize(value: unknown): Lang {
	const v = String(value ?? "").replace("-", "_");
	if ((LANGUAGES as readonly string[]).includes(v)) return v as Lang;
	if (/^zh_(TW|HK|Hant)/i.test(v)) return "zh_TW";
	if (/^zh/i.test(v)) return "zh_CN";
	const base = v.split("_")[0]!.toLowerCase();
	return (LANGUAGES as readonly string[]).includes(base) ? (base as Lang) : "en";
}

/** Reads a language's table from a folder of <lang>.json files (plugin or locales/). */
export function loadTable(dir: string, language: Lang): Table {
	const file = join(dir, `${language}.json`);
	if (language === "de" || !existsSync(file)) return {};
	const json = JSON.parse(readFileSync(file, "utf8"));
	return (json.Localization ?? json) as Table;
}

/** Switches the language; `dir` holds the <lang>.json files. */
export function setLanguage(language: unknown, dir: string): Lang {
	current = normalize(language);
	table = loadTable(dir, current);
	fallback = current === "de" ? {} : loadTable(dir, "en");
	return current;
}

/** For tests and tools: use these tables directly. */
export function useTables(language: Lang, own: Table, english: Table = {}): void {
	current = language;
	table = own;
	fallback = language === "de" ? {} : english;
}

/** Marks a German text for translation where it is stored, not shown (tables); translate it with tr() when shown. */
export const N = (de: string): string => de;

const LOCALES: Record<Lang, string> = { de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", ja: "ja-JP", ko: "ko-KR", zh_CN: "zh-CN", zh_TW: "zh-TW" };

/** The current language as a BCP 47 tag, for dates and numbers. */
export function locale(): string {
	return LOCALES[current];
}
