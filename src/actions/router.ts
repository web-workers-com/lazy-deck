/**
 * Combined actions (catalog ROUTERS): one entry in the action list that shows
 * one of several existing actions, picked in the settings page. Every event
 * goes to the picked action's own class; when the pick changes, the old one
 * lets go of the key and the new one takes it over.
 */
import { action, SingletonAction } from "@elgato/streamdeck";

import { ROUTERS, type Router } from "../catalog.js";

type Handler = ((ev: any) => unknown) | undefined;
const FORWARD = ["onKeyDown", "onKeyUp", "onDialRotate", "onDialDown", "onDialUp", "onTouchTap", "onSendToPlugin", "onPropertyInspectorDidAppear"] as const;

function routerOf(r: Router, targets: Map<string, SingletonAction<any>>): SingletonAction<any> {
	const picked = new Map<string, SingletonAction<any>>();
	const pick = (settings: Record<string, unknown> | undefined) => {
		const id = settings?.[r.setting];
		const choice = r.choices.find((c) => c.id === id) ?? r.choices[0];
		return targets.get(`com.lazydeck.plugin.${choice.base}`);
	};
	const call = (target: SingletonAction<any> | undefined, name: string, ev: unknown) => (target as unknown as Record<string, Handler> | undefined)?.[name]?.call(target, ev);

	class Routed extends SingletonAction<any> {
		override async onWillAppear(ev: any): Promise<void> {
			const target = pick(ev.payload.settings);
			if (target) picked.set(ev.action.id, target);
			await call(target, "onWillAppear", ev);
		}
		override async onDidReceiveSettings(ev: any): Promise<void> {
			const before = picked.get(ev.action.id);
			const target = pick(ev.payload.settings);
			if (target === before) {
				await call(target, "onDidReceiveSettings", ev);
				return;
			}
			await call(before, "onWillDisappear", ev);
			if (target) picked.set(ev.action.id, target);
			await call(target, "onWillAppear", ev);
		}
		override async onWillDisappear(ev: any): Promise<void> {
			const target = picked.get(ev.action.id);
			picked.delete(ev.action.id);
			await call(target, "onWillDisappear", ev);
		}
	}
	for (const name of FORWARD) {
		Object.defineProperty(Routed.prototype, name, {
			configurable: true,
			writable: true,
			value(ev: any) {
				return call(picked.get(ev.action.id) ?? pick(ev.payload?.settings), name, ev);
			},
		});
	}
	const Decorated = action({ UUID: `com.lazydeck.plugin.${r.uuid}` })(Routed, { kind: "class", name: r.uuid } as ClassDecoratorContext);
	return new Decorated();
}

/** Builds every combined action from the actions already created. */
export function routerActions(bases: SingletonAction<any>[]): SingletonAction<any>[] {
	const byUuid = new Map(bases.map((b) => [b.manifestId!, b]));
	return ROUTERS.map((r) => routerOf(r, byUuid));
}
