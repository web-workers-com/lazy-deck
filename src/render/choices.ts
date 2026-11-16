/** How a catalog choice looks on its key: logo, monogram, scene or icon. */
import type { Choice } from "../catalog.js";
import { iconKey, logoKey, tileKey } from "./apps.js";
import { blanketKey, clipKey, monitorKey, moonKey, sunKey, viewfinderKey } from "./scenes.js";
import { tr } from "../i18n.js";

/** Choices drawn as canvas scenes instead of a plain icon. */
export const SCENES: Record<string, (label: string, icon: string) => string> = {
	clip: (label) => clipKey(1, label),
	shot: (label) => viewfinderKey(label, 1),
	screenshot: (label) => viewfinderKey(label, 1),
	lock: (label) => blanketKey(label, 1),
	monitoroff: (label) => monitorKey(label, 1),
	sleep: (label) => moonKey(label, 1),
	darkmode: (label, icon) => (icon === "moon" ? moonKey(label, 1) : sunKey(label, 1)),
};

export function choiceKey(choice: Choice, label = tr(choice.label), icon
 = choice.icon ?? "globe"): string {
	if (choice.logo) return logoKey(choice.logo, label);
	if (choice.tile) return tileKey(choice.tile, label);
	const scene = SCENES[choice.id];
	return scene ? scene(label, icon) : iconKey(icon, label);
}
