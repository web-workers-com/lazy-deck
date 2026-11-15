/**
 * Standalone keys (catalog VARIANTS): the same action class under its own
 * UUID, with its settings fixed. Every event passes through here and gets
 * the fixed settings merged in, so the class itself needs no changes.
 */
import { action, type SingletonAction } from "@elgato/streamdeck";

import { variantUuid, VARIANTS, type Variant } from "../catalog.js";

const EVENTS = ["onWillAppear", "onWillDisappear", "onDidReceiveSettings", "onKeyDown", "onKeyUp", "onDialRotate", "onDialDown", "onDialUp", "onTouchTap", "onSendToPlugin"] as const;

type Ctor = new () => SingletonAction<any>;

function variantOf(Base: Ctor, v: Variant): SingletonAction<any> {
	class Fixed extends Base {}
	for (const name of EVENTS) {
		const original = (Base.prototype as any)[name] as ((ev: any) => unknown) | undefined;
		if (typeof original !== "function") continue;
		Object.defineProperty(Fixed.prototype, name, {
			configurable: true,
			writable: true,
			value(this: unknown, ev: any) {
				if (ev?.payload && typeof ev.payload === "object" && "settings" in ev.payload) {
					ev.payload.settings = Object.assign(ev.payload.settings ?? {}, v.settings);
				}
				return original.call(this, ev);
			},
		});
	}
	const Decorated = action({ UUID: variantUuid(v) })(Fixed, { kind: "class", name: v.id } as ClassDecoratorContext);
	return new Decorated();
}

/** Builds every standalone key from the base actions already created. */
export function variantActions(bases: SingletonAction<any>[]): SingletonAction<any>[] {
	const byUuid = new Map(bases.map((b) => [b.manifestId, b]));
	return VARIANTS.flatMap((v) => {
		const base = byUuid.get(`com.lazydeck.plugin.${v.base}`);
		return base ? [variantOf(base.constructor as Ctor, v)] : [];
	});
}
