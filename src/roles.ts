/**
 * What each key of the full-deck alert does, by its place on the grid.
 *
 * The right column talks (bubble) and answers (Ansehen, Später); the left
 * column explains (reason sign, Erklären). Everything else is picture.
 */
export type Role = "picture" | "bubble" | "view" | "snooze" | "reason" | "explain";

export function roleAt(columns: number, rows: number, column: number, row: number): Role {
	const last = columns - 1;
	if (columns < 3) {
		// Too narrow for a picture: every key is a way out.
		return row === 0 && column === 0 ? "view" : "snooze";
	}
	if (rows >= 3) {
		if (column === last) {
			return (["bubble", "view", "snooze"] as const)[row] ?? "picture";
		}
		if (column === 0) {
			return row === 1 ? "reason" : row === 2 ? "explain" : "picture";
		}
		return "picture";
	}
	// Two rows (Mini, Neo, Plus, Studio).
	if (column === last) {
		return row === 0 ? "bubble" : "view";
	}
	if (column === 0) {
		return row === 0 ? "reason" : "snooze";
	}
	return "picture";
}

/** Keys across and down per Stream Deck device type. */
export const KEY_GRID: Record<number, [number, number]> = {
	0: [5, 3],
	1: [3, 2],
	2: [8, 4],
	3: [5, 3],
	7: [4, 2],
	9: [4, 2],
	10: [16, 2],
	11: [8, 8],
	12: [3, 4],
	13: [9, 4],
};
