import streamDeck from "@elgato/streamdeck";

import { AlertAction, SlothAction, TestAction } from "./actions/alert-keys.js";
import { DiscordAction, MediaAction, SteamAction } from "./actions/apps.js";
import { GitHubAction, MicAction, NowPlayingAction, PomodoroAction, SystemAction } from "./actions/more.js";
import { EVERYDAY_ACTIONS } from "./actions/everyday.js";
import { HOME_ACTIONS } from "./actions/home.js";
import { GROUP_ACTIONS } from "./actions/table.js";
import { routerActions } from "./actions/router.js";
import { variantActions } from "./actions/variants.js";
import { center, github, pomodoro } from "./runtime.js";
import { startServer } from "./server.js";
import { pluginDir, shutdown } from "./system.js";
import { setLanguage, tr } from "./i18n.js";

streamDeck.logger.setLevel("info");

// Every text the plugin draws follows Stream Deck's language.
const language = setLanguage(streamDeck.info.application.language, pluginDir());
streamDeck.logger.info(`language: ${language}`);

process.on("unhandledRejection", (reason) => {
	streamDeck.logger.error(`unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`);
});
process.on("uncaughtException", (error) => {
	streamDeck.logger.error(`uncaught exception: ${error.stack ?? error.message}`);
});
process.on("exit", shutdown);

const bases = [
	new SlothAction(),
	new TestAction(),
	new AlertAction(),
	new MediaAction(),
	new DiscordAction(),
	new SteamAction(),
	new MicAction(),
	new NowPlayingAction(),
	new SystemAction(),
	new PomodoroAction(),
	...GROUP_ACTIONS,
	...HOME_ACTIONS,
	...EVERYDAY_ACTIONS,
	new GitHubAction(),
];
// Every command also as its own (hidden) key for profiles (catalog VARIANTS),
// and the combined actions that pick one of the live keys (catalog ROUTERS).
for (const a of [...bases, ...variantActions(bases), ...routerActions(bases)]) {
	streamDeck.actions.registerAction(a);
}

// The focus timer runs even while its key is off screen (e.g. during an alert).
setInterval(() => {
	const ended = pomodoro.tick();
	if (ended) {
		center.raise(
			ended === "focus"
				? { level: "wait", title: tr("Pause!"), source: "Pomodoro", detail: tr("25 Minuten geschafft. 5 Minuten durchatmen.") }
				: { level: "wait", title: tr("Weiter geht's"), source: "Pomodoro", detail: tr("Die Pause ist um.") },

			{ immediate: true },
		);
	}
}, 1000).unref?.();

// GitHub via gh, if it is installed and logged in; quiet otherwise.
setTimeout(() => github.start(), 10_000).unref?.();

startServer(center, (message) => streamDeck.logger.info(message));

await streamDeck.connect();
