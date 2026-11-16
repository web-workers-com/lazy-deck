/**
 * GitHub through the `gh` CLI the user is already logged into: unread
 * notifications and pull requests waiting for a review. A new review request
 * raises a waiting alert, so nobody has to watch for it.
 */
import type { AlertCenter } from "./alerts.js";
import { cli } from "./system.js";
import { tr } from "./i18n.js";

export type GitHubState = {
	available: boolean;
	notifications?: number;
	reviews?: Array<{ number: number; title: string; url: string; repo: string }>;
	checkedAt: number;
};

const POLL_MS = 2 * 60_000;

export class GitHubWatcher {
	state: GitHubState = { available: false, checkedAt: 0 };
	#seen: Set<string> | undefined;
	#timer: NodeJS.Timeout | undefined;
	#listeners = new Set<() => void>();

	constructor(
		private readonly center: AlertCenter,
		private readonly log: (message: string) => void,
	) {}

	onChange(listener: () => void): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	start(): void {
		if (this.#timer) return;
		void this.poll();
		this.#timer = setInterval(() => void this.poll(), POLL_MS);
		this.#timer.unref?.();
	}

	async poll(): Promise<void> {
		const count = await cli("gh api notifications --jq length", { timeoutMs: 30_000 });
		if (!count.ok) {
			if (this.state.available || this.state.checkedAt === 0) {
				this.log(`github: gh not usable (${count.stderr.trim().split("\n").pop() ?? "?"})`);
			}
			this.state = { available: false, checkedAt: Date.now() };
			this.#emit();
			return;
		}
		const reviews = await cli(
			"gh search prs --review-requested=@me --state=open --json number,title,url,repository --limit 30",
			{ timeoutMs: 30_000 },
		);
		let list: GitHubState["reviews"] = [];
		try {
			const raw = JSON.parse(lastJson(reviews.stdout)) as Array<{ number: number; title: string; url: string; repository?: { nameWithOwner?: string; name?: string } }>;
			list = raw.map((pr) => ({ number: pr.number, title: pr.title, url: pr.url, repo: pr.repository?.nameWithOwner ?? pr.repository?.name ?? "" }));
		} catch {
			list = this.state.reviews ?? [];
		}

		// The first look only learns what is there; later looks alert on news.
		const fresh = this.#seen ? list.filter((pr) => !this.#seen!.has(pr.url)) : [];
		this.#seen = new Set(list.map((pr) => pr.url));
		const newest = fresh[0];
		if (newest) {
			this.center.raise({
				level: "wait",
				title: fresh.length > 1 ? tr("{n} Reviews warten", { n: fresh.length }) : tr("Review wartet"),

				source: `GitHub · ${newest.repo.split("/").pop()} #${newest.number}`,
				detail: newest.title,
				url: fresh.length > 1 ? "https://github.com/pulls/review-requested" : newest.url,
			});
		}

		this.state = { available: true, notifications: Number(lastJson(count.stdout)) || 0, reviews: list, checkedAt: Date.now() };
		this.#emit();
	}

	#emit(): void {
		for (const listener of this.#listeners) listener();
	}
}

/** WSL login shells may print banners first; the answer is the last line. */
function lastJson(stdout: string): string {
	const lines = stdout.trim().split(/\r?\n/);
	return lines[lines.length - 1] ?? "";
}
