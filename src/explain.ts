/**
 * "Erklären": asks the Claude CLI, if it is installed, what an alert means,
 * and opens the answer as a small page. No CLI, no account set up here: the
 * page says how to get one instead.
 */
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Alert } from "./alerts.js";
import { cli, openExternal } from "./system.js";
import { tr } from "./i18n.js";

function prompt(alert: Alert): string {
	return [
		tr("Erkläre auf Deutsch in höchstens fünf kurzen Sätzen, was diese Meldung wahrscheinlich bedeutet und was ich als Nächstes prüfen sollte. Keine Einleitung, keine Rückfragen."),
		"",
		`${tr("Quelle")}: ${alert.source ?? tr("unbekannt")}`,
		`${tr("Meldung")}: ${alert.title}`,
		alert.detail ? `${tr("Details")}:\n${alert.detail}` : "",
		alert.url ? `Link: ${alert.url}` : "",
	].join("\n");
}

const escHtml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function page(alert: Alert, body: string, ok: boolean): string {
	return `<!doctype html><html><meta charset="utf-8"><title>${escHtml(tr("Lazy Deck erklärt"))}</title>
<style>body{margin:0;background:#F6F1E7;color:#1F2A1D;font:16px/1.6 'Segoe UI',system-ui,sans-serif}
main{max-width:640px;margin:48px auto;padding:0 20px}h1{font-size:28px;margin:0 0 4px}
.src{color:#6B6F63;margin:0 0 24px}.card{background:#fff;border-radius:16px;padding:20px 24px;border-top:6px solid ${ok ? "#9CC25B" : "#E8735A"};white-space:pre-wrap}</style>
<main><h1>${escHtml(alert.title)}</h1><p class="src">${escHtml(alert.source ?? "Lazy Deck")}</p><div class="card">${escHtml(body)}</div></main></html>`;
}

/** Explains the alert and opens the result. Resolves to whether Claude answered. */
export async function explain(alert: Alert): Promise<boolean> {
	const result = await cli("claude -p", { input: prompt(alert), timeoutMs: 120_000 });
	const answer = result.ok ? result.stdout.trim() : "";
	const lastError = result.stderr.trim() || tr("keine Antwort");
	const ok = answer !== "";
	const body = ok
		? answer
		: `${tr("Für „Erklären“ nutzt Lazy Deck die Claude-CLI, wenn sie installiert ist. Sie wurde nicht gefunden oder hat nicht geantwortet.")}\n\n${tr("Installieren: npm install -g @anthropic-ai/claude-code, dann einmal \"claude\" starten und anmelden.")}\n\n${tr("Letzte Meldung")}: ${lastError}`;

	const file = join(tmpdir(), `lazy-deck-erklaerung-${alert.id}.html`);
	await writeFile(file, page(alert, body, ok), "utf8");
	openExternal(file);
	return ok;
}
