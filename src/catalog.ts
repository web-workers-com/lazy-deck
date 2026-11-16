/**
 * Every "pick one" action and its choices, in one place. The plugin, the
 * settings pages, the icons and the tests all read this list, so a choice
 * cannot exist in one and be missing in another.
 *
 * `icon` names a drawing in render/apps.ts; `tile` draws a coloured monogram
 * instead (for apps and sites, whose real logos we do not use).
 */
export type Choice = {
	id: string;
	/** Name in the settings dropdown. */
	name: string;
	/** Short label on the key (≤ 12 characters reads best). */
	label: string;
	icon?: string;
	tile?: { text: string; bg: string; fg?: string };
	/** Needs a second press within 3 s. */
	confirm?: boolean;
	/** For launchers: what to open. */
	target?: string;
	/** A brand logo (render/logos.ts, or "steam") shown instead of the monogram. */
	logo?: string;
};

export type Group = { uuid: string; name: string; tooltip: string; setting: string; choices: Choice[] };

export const GROUPS: Group[] = [
	{
		uuid: "windows",
		name: "Windows",
		tooltip: "Sperren, Bildschirm aus, Energiesparen, Dark Mode, Papierkorb, Screenshot, Desktop, Einstellungen, Task-Manager.",
		setting: "mode",
		choices: [
			{ id: "screenshot", name: "Screenshot (Ausschnitt)", label: "Screenshot", icon: "screenshot" },
			{ id: "lock", name: "Bildschirm sperren", label: "Sperren", icon: "lock" },
			{ id: "monitoroff", name: "Bildschirm aus", label: "Bildschirm aus", icon: "monitorOff" },
			{ id: "sleep", name: "Energiesparen (zweimal drücken)", label: "Schlafen", icon: "sleep", confirm: true },
			{ id: "darkmode", name: "Dark Mode umschalten", label: "Dunkel", icon: "moon" },
			{ id: "recyclebin", name: "Papierkorb leeren (zweimal drücken)", label: "Papierkorb", icon: "bin", confirm: true },
			{ id: "desktop", name: "Desktop zeigen", label: "Desktop", icon: "desktop" },
			{ id: "settings", name: "Einstellungen", label: "Einstellungen", icon: "gear" },
			{ id: "taskmanager", name: "Task-Manager", label: "Task-Manager", icon: "pulse" },
		],
	},
	{
		uuid: "window",
		name: "Fenster",
		tooltip: "Fenster andocken, maximieren, minimieren, virtuelle Desktops, Aufgabenansicht, Projizieren.",
		setting: "mode",
		choices: [
			{ id: "snapLeft", name: "Links andocken", label: "Links", icon: "snapLeft" },
			{ id: "snapRight", name: "Rechts andocken", label: "Rechts", icon: "snapRight" },
			{ id: "maximize", name: "Maximieren", label: "Groß", icon: "maximize" },
			{ id: "minimize", name: "Minimieren", label: "Klein", icon: "minimize" },
			{ id: "vdLeft", name: "Virtueller Desktop links", label: "Desktop ←", icon: "vdLeft" },
			{ id: "vdRight", name: "Virtueller Desktop rechts", label: "Desktop →", icon: "vdRight" },
			{ id: "taskview", name: "Aufgabenansicht", label: "Alle Fenster", icon: "taskview" },
			{ id: "project", name: "Projizieren (2. Bildschirm)", label: "Projizieren", icon: "project" },
		],
	},
	{
		uuid: "tools",
		name: "Werkzeuge",
		tooltip: "Zwischenablage, Emoji, Mitteilungen, Rechner, Datum einfügen, sicheres Passwort.",
		setting: "mode",
		choices: [
			{ id: "clipboard", name: "Zwischenablage-Verlauf", label: "Ablage", icon: "clipboard" },
			{ id: "emoji", name: "Emoji-Auswahl", label: "Emoji", icon: "emoji" },
			{ id: "notifications", name: "Windows-Mitteilungen (Infocenter)", label: "Mitteilungen", icon: "bell" },
			{ id: "calculator", name: "Rechner", label: "Rechner", icon: "calculator" },
			{ id: "pastedate", name: "Heutiges Datum einfügen", label: "Datum", icon: "calendar" },
			{ id: "password", name: "Passwort erzeugen (in die Zwischenablage)", label: "Passwort", icon: "key" },
		],
	},
	{
		uuid: "gamebar",
		name: "Gaming",
		tooltip: "Xbox Game Bar: die letzten 30 Sekunden speichern, Aufnahme starten/stoppen, Spiel-Screenshot, Game Bar öffnen.",
		setting: "mode",
		choices: [
			{ id: "clip", name: "Letzte 30 s speichern", label: "Clip!", icon: "clip" },
			{ id: "record", name: "Aufnahme an/aus", label: "Aufnahme", icon: "record" },
			{ id: "shot", name: "Spiel-Screenshot", label: "Spielfoto", icon: "camera" },
			{ id: "open", name: "Game Bar öffnen", label: "Game Bar", icon: "controller" },
		],
	},
	{
		uuid: "apps",
		name: "App starten",
		tooltip: "Startet eine App mit einem Druck: Spotify, Discord, Steam, WhatsApp, Telegram, WeChat, LINE, KakaoTalk, Teams, OBS, Explorer, Terminal, Editor.",
		setting: "app",
		choices: [
			{ id: "spotify", name: "Spotify", label: "Spotify", tile: { text: "Sp", bg: "#1DB954" }, target: "spotify:", logo: "spotify" },
			{ id: "discord", name: "Discord", label: "Discord", tile: { text: "Di", bg: "#5865F2", fg: "#FFFFFF" }, target: "discord:", logo: "discord" },
			{ id: "steam", name: "Steam", label: "Steam", tile: { text: "St", bg: "#1B2838", fg: "#FFFFFF" }, target: "steam://open/main", logo: "steam" },
			{ id: "whatsapp", name: "WhatsApp", label: "WhatsApp", tile: { text: "Wa", bg: "#25D366" }, target: "whatsapp:", logo: "whatsapp" },
			{ id: "telegram", name: "Telegram", label: "Telegram", tile: { text: "Tg", bg: "#26A5E4", fg: "#FFFFFF" }, target: "tg://", logo: "telegram" },
			{ id: "wechat", name: "WeChat", label: "WeChat", tile: { text: "We", bg: "#07C160", fg: "#FFFFFF" }, target: "weixin://", logo: "wechat" },
			{ id: "line", name: "LINE", label: "LINE", tile: { text: "LINE", bg: "#06C755", fg: "#FFFFFF" }, target: "line://", logo: "line" },
			{ id: "kakaotalk", name: "KakaoTalk", label: "KakaoTalk", tile: { text: "Ka", bg: "#FFCD00", fg: "#3C1E1E" }, target: "kakaotalk://", logo: "kakaotalk" },
			{ id: "teams", name: "Microsoft Teams", label: "Teams", tile: { text: "Te", bg: "#5B5FC7", fg: "#FFFFFF" }, target: "msteams:" },
			{ id: "obs", name: "OBS Studio", label: "OBS", tile: { text: "OBS", bg: "#302E31", fg: "#FFFFFF" }, target: "obs", logo: "obsstudio" },
			{ id: "explorer", name: "Explorer", label: "Explorer", icon: "folder", target: "explorer" },
			{ id: "terminal", name: "Terminal", label: "Terminal", tile: { text: ">_", bg: "#0C0C0C", fg: "#9CC25B" }, target: "terminal" },
			{ id: "notepad", name: "Editor", label: "Editor", icon: "note", target: "notepad" },
		],
	},
	{
		uuid: "website",
		name: "Webseite",
		tooltip: "Öffnet eine Seite im Browser: YouTube, Netflix, Twitch, Gmail, WhatsApp Web, Telegram Web, Prime Video, Disney+, Claude, ChatGPT, Gemini, Grok, Google Maps, DeepL.",
		setting: "site",
		choices: [
			{ id: "youtube", name: "YouTube", label: "YouTube", tile: { text: "YT", bg: "#FF0033", fg: "#FFFFFF" }, target: "https://www.youtube.com", logo: "youtube" },
			{ id: "netflix", name: "Netflix", label: "Netflix", tile: { text: "N", bg: "#141414", fg: "#E50914" }, target: "https://www.netflix.com", logo: "netflix" },
			{ id: "twitch", name: "Twitch", label: "Twitch", tile: { text: "Tw", bg: "#9146FF", fg: "#FFFFFF" }, target: "https://www.twitch.tv", logo: "twitch" },
			{ id: "gmail", name: "Gmail", label: "Gmail", tile: { text: "M", bg: "#FFFFFF", fg: "#EA4335" }, target: "https://mail.google.com", logo: "gmail" },
			{ id: "whatsappweb", name: "WhatsApp Web", label: "WhatsApp", tile: { text: "Wa", bg: "#25D366" }, target: "https://web.whatsapp.com", logo: "whatsapp" },
			{ id: "telegramweb", name: "Telegram Web", label: "Telegram", tile: { text: "Tg", bg: "#26A5E4", fg: "#FFFFFF" }, target: "https://web.telegram.org", logo: "telegram" },
			{ id: "prime", name: "Prime Video", label: "Prime Video", tile: { text: "P", bg: "#00A8E1", fg: "#FFFFFF" }, target: "https://www.primevideo.com", logo: "primevideo" },
			{ id: "disney", name: "Disney+", label: "Disney+", tile: { text: "D+", bg: "#0E3D8C", fg: "#FFFFFF" }, target: "https://www.disneyplus.com" },
			{ id: "claude", name: "Claude", label: "Claude", tile: { text: "C", bg: "#D97757", fg: "#FFFFFF" }, target: "https://claude.ai", logo: "claude" },
			{ id: "chatgpt", name: "ChatGPT", label: "ChatGPT", tile: { text: "GPT", bg: "#10A37F", fg: "#FFFFFF" }, target: "https://chatgpt.com" },
			{ id: "gemini", name: "Gemini", label: "Gemini", tile: { text: "G", bg: "#8E75B2", fg: "#FFFFFF" }, target: "https://gemini.google.com", logo: "googlegemini" },
			{ id: "grok", name: "Grok", label: "Grok", tile: { text: "Grok", bg: "#000000", fg: "#FFFFFF" }, target: "https://grok.com" },
			{ id: "maps", name: "Google Maps", label: "Karte", tile: { text: "Ma", bg: "#34A853", fg: "#FFFFFF" }, target: "https://maps.google.com", logo: "googlemaps" },
			{ id: "deepl", name: "DeepL Übersetzer", label: "Übersetzen", tile: { text: "DL", bg: "#0F2B46", fg: "#FFFFFF" }, target: "https://www.deepl.com/translator", logo: "deepl" },
		],
	},
	{
		uuid: "folder",
		name: "Ordner",
		tooltip: "Öffnet Downloads, Dokumente, Bilder, Desktop, Musik, Videos oder deinen Benutzerordner.",
		setting: "folder",
		choices: [
			{ id: "Downloads", name: "Downloads", label: "Downloads", icon: "download" },
			{ id: "Documents", name: "Dokumente", label: "Dokumente", icon: "folder" },
			{ id: "Pictures", name: "Bilder", label: "Bilder", icon: "picture" },
			{ id: "Desktop", name: "Desktop", label: "Desktop", icon: "folder" },
			{ id: "Music", name: "Musik", label: "Musik", icon: "folder" },
			{ id: "Videos", name: "Videos", label: "Videos", icon: "folder" },
			{ id: "home", name: "Benutzerordner", label: "Ich", icon: "folder" },
		],
	},
];

export function choiceOf(group: Group, value: unknown): Choice {
	return group.choices.find((c) => c.id === value) ?? group.choices[0]!;
}

/** Apps whose own sound or microphone a key can control. */
export type AudioApp = { id: string; name: string; label: string; mono: string; processes: string; logo?: string };

export const AUDIO_APPS: AudioApp[] = [
	{ id: "master", name: "Gesamt (alles, was rauskommt)", label: "Lautstärke", mono: "", processes: "" },
	{ id: "fg", name: "Spiel / App im Vordergrund", label: "Spiel", mono: "GG", processes: "@fg" },
	{ id: "discord", name: "Discord", label: "Discord", mono: "Di", processes: "Discord", logo: "discord" },
	{ id: "spotify", name: "Spotify", label: "Spotify", mono: "Sp", processes: "Spotify", logo: "spotify" },
	{ id: "browser", name: "Browser (Chrome, Edge, Firefox …)", label: "Browser", mono: "www", processes: "chrome,msedge,firefox,brave,opera,vivaldi", logo: "googlechrome" },
	{ id: "teams", name: "Microsoft Teams", label: "Teams", mono: "Te", processes: "ms-teams,Teams" },
	{ id: "zoom", name: "Zoom", label: "Zoom", mono: "Zo", processes: "Zoom", logo: "zoom" },
	{ id: "slack", name: "Slack", label: "Slack", mono: "Sl", processes: "slack", logo: "slack" },
	{ id: "custom", name: "Eigene App (Prozessname)", label: "App", mono: "?", processes: "" },
];

/** Internet radio stations: the broadcasters' own MP3 streams, no account needed. */
export const STATIONS: Array<{ id: string; name: string; url: string }> = [
	{ id: "1live", name: "1LIVE", url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3" },
	{ id: "swr3", name: "SWR3", url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3" },
	{ id: "antenne", name: "Antenne Bayern", url: "https://stream.antenne.de/antenne" },
	{ id: "bayern3", name: "Bayern 3", url: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid" },
	{ id: "ndr2", name: "NDR 2", url: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3" },
	{ id: "wdr2", name: "WDR 2", url: "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3" },
	{ id: "hr3", name: "hr3", url: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high" },
	{ id: "bigfm", name: "bigFM", url: "https://streams.bigfm.de/bigfm-deutschland-128-mp3" },
	{ id: "radioeins", name: "radioeins", url: "https://radioeins.de/stream" },
	{ id: "rockantenne", name: "Rock Antenne", url: "https://stream.rockantenne.de/rockantenne/stream/mp3" },
	{ id: "bob", name: "Radio Bob", url: "https://streams.radiobob.de/bob-live/mp3-192/mediaplayer" },
	{ id: "80s", name: "80s80s", url: "https://streams.80s80s.de/web/mp3-192/streams.80s80s.de/" },
	{ id: "iloveradio", name: "I Love Radio", url: "https://streams.ilovemusic.de/iloveradio1.mp3" },
	{ id: "chillout", name: "Chillout (Antenne)", url: "https://stream.antenne.de/chillout" },
	{ id: "dlf", name: "Deutschlandfunk", url: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3?aggregator=web" },
	{ id: "custom", name: "Eigener Sender (Stream-Link)", url: "" },
];

/**
 * Standalone keys: every command as its own entry in Stream Deck's action
 * list, ready to drag onto a key without choosing anything. Each reuses the
 * action named by `base` with fixed settings.
 */
export type Variant = { base: string; id: string; name: string; tooltip: string; settings: Record<string, string> };

export const variantUuid = (v: Pick<Variant, "base" | "id">) => `com.lazydeck.plugin.${v.base}.${v.id.toLowerCase()}`;

const groupName = (g: Group, c: Choice): string => {
	const plain = c.name.replace(/\s*\(zweimal drücken\)/, "");
	if (g.uuid === "apps") return `${c.name} starten`;
	if (g.uuid === "website") return `${c.name} öffnen`;
	if (g.uuid === "folder") return `Ordner ${c.name}`;
	return plain;
};

const groupTip = (g: Group, c: Choice): string => {
	if (g.uuid === "apps") return `Startet ${c.name} mit einem Druck.`;
	if (g.uuid === "website") return `Öffnet ${c.name} im Browser.`;
	if (g.uuid === "folder") return `Öffnet den Ordner ${c.name}.`;
	if (g.uuid === "gamebar") return `${c.name} über die Xbox Game Bar von Windows.`;
	return c.confirm ? `${c.name.replace(/\s*\(zweimal drücken\)/, "")}. Zur Sicherheit zweimal drücken.` : `${c.name}.`;
};

export const VARIANTS: Variant[] = [
	{ base: "media", id: "playpause", name: "Play / Pause", tooltip: "Startet oder pausiert die Musik: Spotify, YouTube, Browser und die meisten Player. Läuft etwas, hat Sam die Augen offen.", settings: { key: "playpause" } },
	{ base: "media", id: "previous", name: "Zurück", tooltip: "Vorheriger Titel.", settings: { key: "previous" } },
	{ base: "media", id: "next", name: "Weiter", tooltip: "Nächster Titel.", settings: { key: "next" } },
	{ base: "media", id: "volumedown", name: "Leiser", tooltip: "Macht alles leiser und zeigt, wo die Lautstärke steht.", settings: { key: "volumeDown" } },
	{ base: "media", id: "volumeup", name: "Lauter", tooltip: "Macht alles lauter und zeigt, wo die Lautstärke steht.", settings: { key: "volumeUp" } },
	{ base: "media", id: "mute", name: "Lautstärke / Ton aus", tooltip: "Zeigt die Lautstärke als Schild am Ast. Drücken schaltet den Ton aus und wieder an.", settings: { key: "mute" } },
	{ base: "discord", id: "mute", name: "Discord Mikro", tooltip: "Schaltet nur Discord stumm, egal welches Mikro dort gewählt ist. Die Taste zeigt den echten Zustand.", settings: { mode: "mute" } },
	{ base: "discord", id: "deafen", name: "Discord taub", tooltip: "Discord hört und sendet nichts mehr: Ton und Mikro zusammen aus.", settings: { mode: "deafen" } },
	{ base: "discord", id: "open", name: "Discord öffnen", tooltip: "Öffnet Discord.", settings: { mode: "open" } },
	{ base: "appvolume", id: "fgdown", name: "Spiel leiser", tooltip: "Macht nur das Spiel (oder die App im Vordergrund) leiser, Discord und Musik bleiben gleich.", settings: { app: "fg", mode: "down" } },
	{ base: "appvolume", id: "fgup", name: "Spiel lauter", tooltip: "Macht nur das Spiel (oder die App im Vordergrund) lauter.", settings: { app: "fg", mode: "up" } },
	{ base: "appvolume", id: "spotifymute", name: "Spotify stumm", tooltip: "Schaltet nur Spotify stumm und wieder an.", settings: { app: "spotify", mode: "mute" } },
	{ base: "appmic", id: "teams", name: "Teams Mikro", tooltip: "Schaltet nur das Mikro in Microsoft Teams stumm.", settings: { app: "teams" } },
	{ base: "appmic", id: "zoom", name: "Zoom Mikro", tooltip: "Schaltet nur das Mikro in Zoom stumm.", settings: { app: "zoom" } },
	{ base: "appmic", id: "browser", name: "Meet Mikro (Browser)", tooltip: "Schaltet das Mikro im Browser stumm, z. B. bei Google Meet oder Jitsi.", settings: { app: "browser" } },
	{ base: "brightness", id: "down", name: "Dunkler", tooltip: "Alle Bildschirme dunkler, auch externe Monitore.", settings: { mode: "down" } },
	{ base: "brightness", id: "up", name: "Heller", tooltip: "Alle Bildschirme heller, auch externe Monitore.", settings: { mode: "up" } },
	{ base: "steam", id: "last", name: "Zuletzt gespielt", tooltip: "Startet dein zuletzt gespieltes Steam-Spiel.", settings: { mode: "last" } },
	{ base: "steam", id: "friends", name: "Steam Freunde", tooltip: "Öffnet deine Freundesliste in Steam.", settings: { mode: "friends" } },
	{ base: "steam", id: "library", name: "Steam Bibliothek", tooltip: "Öffnet deine Steam-Bibliothek.", settings: { mode: "library" } },
	{ base: "steam", id: "bigpicture", name: "Steam Big Picture", tooltip: "Startet Steam im Big-Picture-Modus, für Fernseher und Controller.", settings: { mode: "bigpicture" } },
	{ base: "steam", id: "store", name: "Steam Shop", tooltip: "Öffnet den Steam-Shop.", settings: { mode: "store" } },
	{ base: "countdown", id: "feierabend", name: "Bis Feierabend", tooltip: "Wie lange noch bis Feierabend (17:00, einstellbar).", settings: { mode: "feierabend" } },
	{ base: "countdown", id: "weekend", name: "Bis Wochenende", tooltip: "Wie lange noch bis Freitag Feierabend.", settings: { mode: "weekend" } },
	{ base: "reminder", id: "water", name: "Trinken", tooltip: "Erinnert dich jede Stunde ans Trinken. Drücken heißt erledigt.", settings: { mode: "water" } },
	{ base: "reminder", id: "move", name: "Bewegen", tooltip: "Erinnert dich alle 45 Minuten, dich zu bewegen. Drücken heißt erledigt.", settings: { mode: "move" } },
	{ base: "chance", id: "coin", name: "Münzwurf", tooltip: "Kopf oder Zahl. Kopf zeigt Sam.", settings: { mode: "coin" } },
	{ base: "chance", id: "dice", name: "Würfel", tooltip: "Würfelt eine Zahl von 1 bis 6.", settings: { mode: "dice" } },
	{ base: "github", id: "notifications", name: "GitHub-Mitteilungen", tooltip: "Ungelesene GitHub-Mitteilungen. Nutzt die gh-CLI, mit der du angemeldet bist.", settings: { mode: "notifications" } },
	{ base: "github", id: "reviews", name: "GitHub-Reviews", tooltip: "Reviews, die auf dich warten. Neue lösen einen Alarm aus.", settings: { mode: "reviews" } },
	...GROUPS.flatMap((g) => g.choices.map((c) => ({ base: g.uuid, id: c.id, name: groupName(g, c), tooltip: groupTip(g, c), settings: { [g.setting]: c.id } }))),
];

/** Actions that stay for older profiles but leave the list: their commands are standalone now. */
export const HIDDEN_BASES = ["alert", "windows", "window", "tools", "gamebar", "apps", "website", "folder", "media", "discord", "steam", "github", "countdown", "reminder", "chance"];

/** Order of the action list: by topic, everyday first. */
export const LIST_ORDER = [
	"sloth", "test", "alert", "mic", "output", "media", "nowplaying", "radio", "appvolume", "appmic", "discord", "steam", "steamdownloads", "gamebar",
	"brightness", "windows", "window", "awake", "sleeptimer", "clock", "weather", "timer", "stopwatch", "countdown", "reminder", "internet", "wifi", "battery",
	"apps", "website", "folder", "tools", "chance", "system", "pomodoro", "github",
];
