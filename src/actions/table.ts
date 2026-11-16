/**
 * "Pick one" actions from the catalog: Windows, Fenster, Werkzeuge, Gaming,
 * App starten, Webseite, Ordner. One implementation, many choices.
 */
import streamDeck, {
	action,
	SingletonAction,
	type DidReceiveSettingsEvent,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";
import { randomInt } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

import { choiceOf, GROUPS, type Choice, type Group } from "../catalog.js";
import { confirmKey } from "../render/apps.js";
import { choiceKey } from "../render/choices.js";
import { isWindows, openExternal, openFolder, ps, setClipboard, tap } from "../system.js";
import { locale, tr } from "../i18n.js";

const WIN = 0x5b, CTRL = 0x11, ALT = 0x12, LEFT = 0x25, UP = 0x26, RIGHT = 0x27, DOWN = 0x28;
const THEME = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

type Ctx = { flash(label: string): void };

/** What each choice does. Returns false when it cannot run here. */
const PRESS: Record<string, (choice: Choice, ctx: Ctx) => boolean | Promise<boolean>> = {
	// Windows
	screenshot: () => (isWindows ? (openExternal("ms-screenclip:"), true) : false),
	lock: () => ps.run("rundll32.exe user32.dll,LockWorkStation"),
	monitoroff: () => ps.run("[LD.K]::PostMessage([IntPtr]0xFFFF, 0x0112, [IntPtr]0xF170, [IntPtr]2) | Out-Null"),
	sleep: () => ps.run("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false) | Out-Null"),
	darkmode: async () => {
		const dark = await isDark();
		if (dark === undefined) return false;
		const next = dark ? 1 : 0;
		await ps.query(`(Set-ItemProperty '${THEME}' -Name AppsUseLightTheme -Value ${next}; Set-ItemProperty '${THEME}' -Name SystemUsesLightTheme -Value ${next}; '{}')`);
		return true;
	},
	recyclebin: async (_c, ctx) => {
		await ps.query("(Clear-RecycleBin -Force -ErrorAction SilentlyContinue; '{}')", 30_000);
		ctx.flash(tr("Leer!"));
		return true;
	},
	desktop: () => tap(WIN, 0x44),
	settings: () => (isWindows ? (openExternal("ms-settings:"), true) : false),
	taskmanager: () => ps.run("Start-Process taskmgr"),
	// Fenster
	snapLeft: () => tap(WIN, LEFT),
	snapRight: () => tap(WIN, RIGHT),
	maximize: () => tap(WIN, UP),
	minimize: () => tap(WIN, DOWN),
	vdLeft: () => tap(CTRL, WIN, LEFT),
	vdRight: () => tap(CTRL, WIN, RIGHT),
	taskview: () => tap(WIN, 0x09),
	project: () => tap(WIN, 0x50),
	// Werkzeuge
	clipboard: () => tap(WIN, 0x56),
	emoji: () => tap(WIN, 0xbe),
	notifications: () => tap(WIN, 0x4e),
	calculator: () => (isWindows ? (openExternal("calculator:"), true) : false),
	pastedate: () => {
		const d = new Date();
		const value = d.toLocaleDateString(locale(), { year: "numeric", month: "2-digit", day: "2-digit" });
		return ps.run(`Set-Clipboard -Value '${value}'; Start-Sleep -Milliseconds 80; Tap @(${CTRL},0x56)`);
	},
	password: (_c, ctx) => {
		const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#%+-=?";
		const value = Array.from({ length: 20 }, () => alphabet[randomInt(alphabet.length)]).join("");
		const ok = setClipboard(value);
		if (ok) ctx.flash(tr("kopiert ✓"));
		return ok;
	},
	// Gaming (Xbox Game Bar)
	clip: (_c, ctx) => {
		const ok = tap(WIN, ALT, 0x47);
		if (ok) ctx.flash("gespeichert");
		return ok;
	},
	record: () => tap(WIN, ALT, 0x52),
	shot: () => tap(WIN, ALT, 0x2c),
	open: () => tap(WIN, 0x47),
};

async function isDark(): Promise<boolean | undefined> {
	if (!isWindows) return undefined;
	const r = await ps.query<{ light: number }>(`(@{ light = (Get-ItemProperty '${THEME}').AppsUseLightTheme } | ConvertTo-Json -Compress)`);
	return r ? r.light === 0 : undefined;
}

function launch(group: Group, choice: Choice): boolean {
	if (group.uuid === "website") {
		openExternal(choice.target!);
		return true;
	}
	if (group.uuid === "folder") {
		openFolder(choice.id === "home" ? homedir() : join(homedir(), choice.id));
		return true;
	}
	// Apps: protocol links open the installed app; a few need a program path.
	switch (choice.target) {
		case "obs":
			return ps.run("$d='C:\\Program Files\\obs-studio\\bin\\64bit'; if (Test-Path $d) { Start-Process -FilePath \"$d\\obs64.exe\" -WorkingDirectory $d }");
		case "explorer":
			return ps.run("Start-Process explorer");
		case "terminal":
			return ps.run("try { Start-Process wt -ErrorAction Stop } catch { Start-Process powershell }");
		case "notepad":
			return ps.run("Start-Process notepad");
		default:
			openExternal(choice.target!);
			return true;
	}
}

type Settings = Record<string, string | undefined>;


/** Builds the Stream Deck action class for one catalog group. */
function groupAction(group: Group) {
	@action({ UUID: `com.lazydeck.plugin.${group.uuid}` })
	class GroupAction extends SingletonAction<Settings> {
		#pending = new Map<string, number>();
		#flash = new Map<string, string>();
		#keys = new Map<string, { action: any; settings: Settings }>();
		#extra = new Map<string, string>();
		#poll: NodeJS.Timeout | undefined;

		async paint(id: string): Promise<void> {
			const entry = this.#keys.get(id);
			if (!entry?.action.isKey()) return;
			const choice = choiceOf(group, entry.settings[group.setting]);
			let image: string;
			if (this.#pending.has(id)) {
				image = confirmKey(choice.icon ?? "bin", tr("Nochmal?"));
			} else {
				let label = this.#flash.get(id) ?? tr(choice.label);
				let icon = choice.icon ?? "globe";
				if (choice.id === "darkmode") {
					const dark = this.#extra.get("dark") === "1";
					icon = dark ? "moon" : "sun";
					label = this.#flash.get(id) ?? (dark ? tr("Dunkel") : tr("Hell"));
				}
				if (choice.id === "recyclebin" && this.#extra.has("bin") && !this.#flash.has(id)) {
					label = tr("Papierkorb {n}", { n: this.#extra.get("bin") ?? "" });

				}
				image = choiceKey(choice, label, icon);
			}
			await entry.action.setImage(image);
		}

		async refresh(): Promise<void> {
			const modes = new Set([...this.#keys.values()].map((k) => choiceOf(group, k.settings[group.setting]).id));
			if (modes.has("darkmode")) {
				const dark = await isDark();
				if (dark !== undefined) this.#extra.set("dark", dark ? "1" : "0");
			}
			if (modes.has("recyclebin") && isWindows) {
				const r = await ps.query<{ n: number }>("(@{ n = (New-Object -ComObject Shell.Application).Namespace(10).Items().Count } | ConvertTo-Json -Compress)");
				if (r) this.#extra.set("bin", String(r.n));
			}
			for (const id of this.#keys.keys()) await this.paint(id);
		}

		override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
			this.#keys.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
			await this.paint(ev.action.id);
			if (!this.#poll && (group.uuid === "windows")) {
				void this.refresh();
				this.#poll = setInterval(() => void this.refresh(), 30_000);
			}
		}

		override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
			this.#keys.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
			await this.refresh();
		}

		override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
			this.#keys.delete(ev.action.id);
			if (this.#keys.size === 0 && this.#poll) {
				clearInterval(this.#poll);
				this.#poll = undefined;
			}
		}

		override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
			const id = ev.action.id;
			const choice = choiceOf(group, ev.payload.settings[group.setting]);
			if (choice.confirm && !this.#pending.has(id)) {
				this.#pending.set(id, Date.now());
				await this.paint(id);
				setTimeout(() => {
					if (this.#pending.delete(id)) void this.paint(id);
				}, 3000);
				return;
			}
			this.#pending.delete(id);
			const ctx: Ctx = {
				flash: (label) => {
					this.#flash.set(id, label);
					void this.paint(id);
					setTimeout(() => {
						this.#flash.delete(id);
						void this.paint(id);
					}, 1800);
				},
			};
			let ok: boolean;
			try {
				ok = choice.target !== undefined || group.uuid === "folder" ? launch(group, choice) : await (PRESS[choice.id]?.(choice, ctx) ?? false);
			} catch (error) {
				streamDeck.logger.warn(`${group.uuid}/${choice.id}: ${(error as Error).message}`);
				ok = false;
			}
			if (!ok) {
				await ev.action.showAlert();
			} else {
				setTimeout(() => void this.refresh(), 700);
			}
		}
	}
	return GroupAction;
}

export const GROUP_ACTIONS = GROUPS.map((group) => new (groupAction(group))());
