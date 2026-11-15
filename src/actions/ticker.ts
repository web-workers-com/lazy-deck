import streamDeck, { type KeyAction } from "@elgato/streamdeck";

/**
 * Animates keys: calls `paint` for every visible key on a timer and only
 * sends images that changed. Stops when no key is visible.
 */
export class Ticker<T> {
	#timer: NodeJS.Timeout | undefined;
	#sent = new Map<string, string>();
	#keys = new Map<string, KeyAction<T & Record<string, never>>>();

	constructor(
		private readonly ms: number,
		private readonly paint: (key: KeyAction<any>, t: number) => string | undefined,
	) {}

	add(key: KeyAction<any>): void {
		this.#keys.set(key.id, key);
		this.#sent.delete(key.id);
		if (!this.#timer) {
			this.#timer = setInterval(() => this.tick(), this.ms);
		}
		this.tick();
	}

	remove(id: string): void {
		this.#keys.delete(id);
		this.#sent.delete(id);
		if (this.#keys.size === 0 && this.#timer) {
			clearInterval(this.#timer);
			this.#timer = undefined;
		}
	}

	/** Forget what was sent, so the next tick repaints everything. */
	invalidate(): void {
		this.#sent.clear();
		this.tick();
	}

	tick(): void {
		const t = Date.now() / 1000;
		for (const key of this.#keys.values()) {
			let image: string | undefined;
			try {
				image = this.paint(key, t);
			} catch (error) {
				streamDeck.logger.error(`paint ${key.manifestId}: ${(error as Error).stack}`);
				continue;
			}
			if (!image || this.#sent.get(key.id) === image) {
				continue;
			}
			this.#sent.set(key.id, image);
			key.setImage(image).catch((error: Error) => streamDeck.logger.warn(`setImage: ${error.message}`));
		}
	}
}
