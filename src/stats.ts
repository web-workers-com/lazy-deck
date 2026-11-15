/** CPU and memory load from Node itself; works on every system. */
import { cpus, freemem, totalmem } from "node:os";

let previous = snapshot();

function snapshot(): { idle: number; total: number } {
	let idle = 0;
	let total = 0;
	for (const cpu of cpus()) {
		const t = cpu.times;
		idle += t.idle;
		total += t.user + t.nice + t.sys + t.irq + t.idle;
	}
	return { idle, total };
}

/** CPU busy share since the last call, and memory in use, both 0..100. */
export function load(): { cpu: number; ram: number } {
	const now = snapshot();
	const total = now.total - previous.total;
	const idle = now.idle - previous.idle;
	previous = now;
	const cpu = total > 0 ? Math.round((1 - idle / total) * 100) : 0;
	const ram = Math.round((1 - freemem() / totalmem()) * 100);
	return { cpu: Math.max(0, Math.min(100, cpu)), ram };
}
