/** Talking to the operating system: opening links, pressing media keys, focusing windows. */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const isWindows = process.platform === "win32";
export const isMac = process.platform === "darwin";

/** The plugin's own `.sdPlugin` folder. */
export function pluginDir(): string {
	return join(dirname(fileURLToPath(import.meta.url)), "..");
}

/**
 * Hands a link (https:, steam:, discord: …) or file to the system.
 * `url.dll` is used on Windows because `start` mangles `&` in links.
 */
export function openExternal(target: string): void {
	const [command, args] = isWindows
		? ["rundll32.exe", ["url.dll,FileProtocolHandler", target]]
		: isMac
			? ["open", [target]]
			: ["xdg-open", [target]];
	spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true }).unref();
}

/** Runs a command, feeding `input` on stdin, and collects its output. */
export function run(
	command: string,
	args: string[],
	options: { input?: string; timeoutMs?: number; shell?: boolean } = {},
): Promise<{ code: number | null; stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { windowsHide: true, shell: options.shell ?? false });
		let stdout = "";
		let stderr = "";
		const timer = setTimeout(() => child.kill(), options.timeoutMs ?? 30_000);
		child.stdout.on("data", (d) => (stdout += d));
		child.stderr.on("data", (d) => (stderr += d));
		child.on("error", (error) => {
			clearTimeout(timer);
			reject(error);
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			resolve({ code, stdout, stderr });
		});
		child.stdin.end(options.input ?? "");
	});
}

/**
 * One long-lived PowerShell, so a key press does not wait for PowerShell to
 * start every time. Lines go in on stdin; answers come back as single lines
 * tagged with the request number.
 */
class PowerShellBridge {
	#child: ChildProcessWithoutNullStreams | undefined;
	#buffer = "";
	#next = 1;
	#waiting = new Map<number, (line: string | undefined) => void>();

	#start(): ChildProcessWithoutNullStreams {
		if (this.#child && this.#child.exitCode === null && !this.#child.killed) {
			return this.#child;
		}
		const child = spawn("powershell.exe", ["-NoProfile", "-NoLogo", "-ExecutionPolicy", "Bypass", "-Command", "-"], {
			windowsHide: true,
		});
		child.on("error", () => (this.#child = undefined));
		child.on("exit", () => {
			this.#child = undefined;
			for (const done of this.#waiting.values()) done(undefined);
			this.#waiting.clear();
		});
		child.stderr.resume();
		child.stdout.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			this.#buffer += chunk;
			const lines = this.#buffer.split(/\r?\n/);
			this.#buffer = lines.pop() ?? "";
			for (const line of lines) {
				const match = /^@@LD(\d+)@@(.*)$/.exec(line);
				if (match) {
					const id = Number(match[1]);
					this.#waiting.get(id)?.(match[2]);
					this.#waiting.delete(id);
				}
			}
		});
		const dir = join(pluginDir(), "ps").replace(/'/g, "''");
		for (const line of [
			"[Console]::OutputEncoding=[Text.Encoding]::UTF8",
			"$ErrorActionPreference='SilentlyContinue'",
			...PRELUDE,
			`. '${dir}\\audio.ps1'`,
			`. '${dir}\\media.ps1'`,
			`. '${dir}\\display.ps1'`,
		]) {
			child.stdin.write(`${line}\n`);
		}
		this.#child = child;
		return child;
	}

	/** Runs a line without waiting for it. */
	run(line: string): boolean {
		if (!isWindows) return false;
		this.#start().stdin.write(`${line}\n`);
		return true;
	}

	/** Evaluates an expression that yields one line of JSON, and parses it. */
	query<T>(expression: string, timeoutMs = 5000): Promise<T | undefined> {
		if (!isWindows) return Promise.resolve(undefined);
		const id = this.#next++;
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				this.#waiting.delete(id);
				resolve(undefined);
			}, timeoutMs);
			this.#waiting.set(id, (line) => {
				clearTimeout(timer);
				try {
					resolve(line ? (JSON.parse(line) as T) : undefined);
				} catch {
					resolve(undefined);
				}
			});
			this.#start().stdin.write(`try { $r = (${expression}) } catch { $r = 'null' }; Write-Output ("@@LD${id}@@" + $r)\n`);
		});
	}

	stop(): void {
		this.#child?.kill();
	}
}

const PRELUDE = [
	"Add-Type -Name K -Namespace LD -MemberDefinition '" +
		'[DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);' +
		'[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();' +
		'[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);' +
		'[DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int c);' +
		'[DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);' +
		'[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);' +
		'[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, IntPtr p);' +
		'[DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);' +
		'[DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);' +
		'[DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();' +
		'[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);' +
		'[DllImport("user32.dll")] public static extern uint MapVirtualKey(uint c, uint t);' +
		"'",
	// Each key goes out with its real scan code: apps built on Chromium
	// (Discord) match shortcuts by scan code and ignore a key whose scan code
	// is 0. Extended keys need flag 1: MAPVK_VK_TO_VSC_EX (4) marks Win and
	// media keys with 0xE0, but not the arrows and their block, which it maps
	// to the number pad; without the flag Win+Left would arrive as Win+Num 4.
	"$LDExt=@(0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x2D,0x2E,0x6F,0xA3,0xA5)",
	"function Down([byte]$k,[uint32]$up){ $sc=[LD.K]::MapVirtualKey($k,4); $f=$up; if((($sc -band 0xFF00) -eq 0xE000) -or ($LDExt -contains $k)){ $f=$f -bor 1 }; [LD.K]::keybd_event($k,[byte]($sc -band 0xFF),$f,[UIntPtr]::Zero) }",
	"function Tap([byte[]]$keys){ foreach($k in $keys){ Down $k 0 }; [array]::Reverse($keys); foreach($k in $keys){ Down $k 2 } }",
];

export const ps = new PowerShellBridge();

function powershell(line: string): boolean {
	return ps.run(line);
}

export type AudioState = { ok: boolean; level: number; muted: boolean };
/** 0 = speakers, 1 = microphone (the system defaults). */
export type Flow = 0 | 1;

export const audio = {
	state: (flow: Flow) => ps.query<AudioState>(`[LDAudio]::State(${flow})`),
	toggleMute: (flow: Flow) => ps.query<AudioState>(`[LDAudio]::ToggleMute(${flow})`),
	step: (flow: Flow, delta: number) => ps.query<AudioState>(`[LDAudio]::Step(${flow}, ${delta.toFixed(3)})`),
};

export type AppAudioState = { ok: boolean; found: boolean; muted: boolean; level: number; name: string };

/**
 * One app's own audio, wherever it plays or records: muting its session
 * silences just that app, on whatever device was picked inside it.
 * `processes` is a comma list of process names, or "@fg" for the app in front.
 */
export const appAudio = {
	state: (processes: string, flow: Flow) => ps.query<AppAudioState>(`[LDAudio]::AppState('${processes}', ${flow})`),
	/** Toggles `flow`; with `both`, the other flow follows it (deafen = sound and microphone). */
	toggle: (processes: string, flow: Flow, both = false) =>
		ps.query<AppAudioState>(`[LDAudio]::AppToggle('${processes}', ${flow}, $${both})`),
	step: (processes: string, delta: number) => ps.query<AppAudioState>(`[LDAudio]::AppStep('${processes}', ${delta.toFixed(3)})`),
};

export type AudioDevice = { id: string; name: string; default: boolean };

/** Sound devices (0 = output, 1 = input) and switching the default one. */
export const devices = {
	list: async (flow: Flow) => (await ps.query<{ ok: boolean; devices?: AudioDevice[] }>(`[LDAudio]::Devices(${flow})`))?.devices,
	setDefault: async (id: string) => (await ps.query<{ ok: boolean }>(`[LDAudio]::SetDefault('${id.replace(/'/g, "")}')`))?.ok === true,
};

export type Brightness = { ok: boolean; level: number; count: number };

/** Screen brightness of every monitor that allows it (DDC/CI, laptop panel). */
export const brightness = (delta = 0) => ps.query<Brightness>(`LDBrightness ${Math.round(delta)}`, 10_000);

/**
 * Keeps the PC (and screen) awake while on. The flag belongs to the thread
 * that set it, which is the bridge's one PowerShell thread, so it holds
 * until switched off or the plugin stops.
 */
export function stayAwake(on: boolean): boolean {
	return ps.run(`[LD.K]::SetThreadExecutionState(${on ? "0x80000003" : "0x80000000"}) | Out-Null`);
}

let radioPlayer: ChildProcessWithoutNullStreams | undefined;

/**
 * Plays an internet radio stream in its own hidden PowerShell with Windows
 * Media Player's engine, so it needs nothing installed. `undefined` stops it.
 */
export function playRadio(url: string | undefined): boolean {
	radioPlayer?.kill();
	radioPlayer = undefined;
	if (!url || !isWindows) return !url;
	const script =
		"Add-Type -AssemblyName System.Windows.Forms; $p = New-Object -ComObject WMPlayer.OCX; $p.settings.volume = 100; " +
		`$p.URL = '${url.replace(/'/g, "''")}'; $p.controls.play(); ` +
		// WMP needs a message loop to stream; it stops when this process ends.
		"while ($true) { [System.Windows.Forms.Application]::DoEvents(); Start-Sleep -Milliseconds 100 }";
	const child = spawn("powershell.exe", ["-NoProfile", "-NoLogo", "-ExecutionPolicy", "Bypass", "-Command", script], { windowsHide: true });
	child.on("exit", () => {
		if (radioPlayer === child) radioPlayer = undefined;
	});
	radioPlayer = child;
	return true;
}

export const radioPlaying = () => radioPlayer !== undefined;

/** Shuts the PC down or sends it to sleep, right now. */
export function powerOff(how: "shutdown" | "sleep"): boolean {
	if (!isWindows) return false;
	if (how === "shutdown") {
		spawn("shutdown.exe", ["/s", "/t", "0"], { detached: true, stdio: "ignore", windowsHide: true }).unref();
		return true;
	}
	return ps.run("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false) | Out-Null");
}

export type NowPlaying = { ok: boolean; playing: boolean; status?: string; title: string | null; artist?: string; app?: string; art?: string | null };

export const nowPlaying = () => ps.query<NowPlaying>("LDNowPlaying", 8000);

/** Windows virtual-key codes for the media keys. */
export const MEDIA_KEYS = {
	playpause: 0xb3,
	next: 0xb0,
	previous: 0xb1,
	volumeUp: 0xaf,
	volumeDown: 0xae,
	mute: 0xad,
} as const;

export type MediaKey = keyof typeof MEDIA_KEYS;

/** Presses a media key, which Spotify, browsers, YouTube and most players obey. */
export function pressMediaKey(key: MediaKey): boolean {
	if (isMac) {
		// macOS has no public media-key API; Music and Spotify understand AppleScript.
		const verb = { playpause: "playpause", next: "next track", previous: "previous track" }[key as string];
		if (key === "volumeUp" || key === "volumeDown" || key === "mute") {
			const script =
				key === "mute"
					? "set volume output muted not (output muted of (get volume settings))"
					: `set volume output volume ((output volume of (get volume settings)) ${key === "volumeUp" ? "+" : "-"} 6)`;
			spawn("osascript", ["-e", script], { stdio: "ignore" }).unref();
			return true;
		}
		if (verb) {
			spawn("osascript", ["-e", `if application "Spotify" is running then tell application "Spotify" to ${verb}`], { stdio: "ignore" }).unref();
			return true;
		}
		return false;
	}
	return powershell(`Tap @(${MEDIA_KEYS[key]})`);
}

/** Whether a process with this name runs (Windows `tasklist`, elsewhere `pgrep`). */
export async function isRunning(name: string): Promise<boolean> {
	try {
		if (isWindows) {
			const { stdout } = await run("tasklist.exe", ["/FI", `IMAGENAME eq ${name}.exe`, "/NH"], { timeoutMs: 5000 });
			return stdout.toLowerCase().includes(`${name.toLowerCase()}.exe`);
		}
		const { code } = await run("pgrep", ["-ix", name], { timeoutMs: 5000 });
		return code === 0;
	} catch {
		return false;
	}
}

export function shutdown(): void {
	playRadio(undefined);
	ps.stop();
}

/** Tools found per name: how to call them (native or via WSL). */
const cliRoute = new Map<string, "native" | "wsl" | "none">();

/**
 * Runs a command-line tool like `gh` or `claude`, wherever it is installed:
 * natively, or inside WSL when the Windows side does not have it.
 * @param line The command line, e.g. `gh api notifications`.
 */
export async function cli(line: string, options: { input?: string; timeoutMs?: number } = {}): Promise<{ ok: boolean; stdout: string; stderr: string }> {
	const tool = line.split(" ")[0]!;
	const routes: Array<"native" | "wsl"> = isWindows ? ["native", "wsl"] : ["native"];
	const known = cliRoute.get(tool);
	if (known === "none") {
		return { ok: false, stdout: "", stderr: `${tool} not found` };
	}
	let last = { ok: false, stdout: "", stderr: `${tool} not found` };
	for (const route of known ? [known] : routes) {
		try {
			const result =
				route === "wsl"
					? await run("wsl.exe", ["-e", "bash", "-lic", line], options)
					: isWindows
						? await run(line, [], { ...options, shell: true })
						: await run(isMac ? "/bin/zsh" : "/bin/bash", ["-lc", line], options);
			const missing = result.code === 127 || result.code === 9009 || /not recognized|nicht als interner|nicht gefunden|command not found/i.test(result.stderr);
			if (missing) {
				continue;
			}
			cliRoute.set(tool, route);
			last = { ok: result.code === 0, stdout: result.stdout, stderr: result.stderr };
			return last;
		} catch (error) {
			last = { ok: false, stdout: "", stderr: (error as Error).message };
		}
	}
	if (!known) {
		cliRoute.set(tool, "none");
		// Look again later; it may get installed.
		setTimeout(() => cliRoute.delete(tool), 30 * 60_000).unref?.();
	}
	return last;
}

/** Opens a folder in Explorer / Finder. */
export function openFolder(path: string): void {
	const [command, args] = isWindows ? ["explorer.exe", [path]] : isMac ? ["open", [path]] : ["xdg-open", [path]];
	spawn(command, args, { detached: true, stdio: "ignore", windowsHide: false }).unref();
}

/** Presses a key combination (Windows virtual-key codes, modifiers first). */
export function tap(...keys: number[]): boolean {
	return ps.run(`Tap @(${keys.join(",")})`);
}

/** Puts text on the clipboard. Only call with text free of single quotes. */
export function setClipboard(value: string): boolean {
	if (isMac) {
		const child = spawn("pbcopy");
		child.stdin.end(value);
		return true;
	}
	return ps.run(`Set-Clipboard -Value '${value.replace(/'/g, "''")}'`);
}
