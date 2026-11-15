import streamDeck from "@elgato/streamdeck";

import { AlertAction, SlothAction, TestAction } from "./actions/alert-keys.js";
import { DiscordAction, MediaAction, SteamAction } from "./actions/apps.js";
import { GitHubAction, MicAction, NowPlayingAction, PomodoroAction, SystemAction } from "./actions/more.js";
import { EVERYDAY_ACTIONS } from "./actions/everyday.js";
import { HOME_ACTIONS } from "./actions/home.js";
import { GROUP_ACTIONS } from "./actions/table.js";
import { variantActions } from "./actions/variants.js";
import { center, github, pomodoro } from "./runtime.js";
import { startServer } from "./server.js";
import { shutdown } from "./system.js";

streamDeck.logger.setLevel("info");

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
// Every command also as its own key in the action list (catalog VARIANTS).
for (const a of [...bases, ...variantActions(bases)]) {
	streamDeck.actions.registerAction(a);
}

// The focus timer runs even while its key is off screen (e.g. during an alert).
setInterval(() => {
	const ended = pomodoro.tick();
	if (ended) {
		center.raise(
			ended === "focus"
				? { level: "wait", title: "Pause!", source: "Pomodoro", detail: "25 Minuten geschafft. 5 Minuten durchatmen." }
				: { level: "wait", title: "Weiter geht's", source: "Pomodoro", detail: "Die Pause ist um." },
			{ immediate: true },
		);
	}
}, 1000).unref?.();

// GitHub via gh, if it is installed and logged in; quiet otherwise.
setTimeout(() => github.start(), 10_000).unref?.();

startServer(center, (message) => streamDeck.logger.info(message));

await streamDeck.connect();
