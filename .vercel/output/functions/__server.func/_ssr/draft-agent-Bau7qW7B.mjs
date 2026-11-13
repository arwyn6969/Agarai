import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { _ as sanitizeHandle, d as WEIGHT_KEYS, p as clampWeights, v as sanitizeMotto, y as sanitizeName } from "./types-BpSPkcoP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/draft-agent-Bau7qW7B.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var stamps = [];
function allowCall() {
	const now = Date.now();
	while (stamps.length && now - stamps[0] > 6e4) stamps.shift();
	if (stamps.length >= 10) return false;
	stamps.push(now);
	return true;
}
function extractJson(text) {
	const trimmed = text.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const start = trimmed.indexOf("{");
		const end = trimmed.lastIndexOf("}");
		if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
		throw new Error("no json");
	}
}
var draftAgent_createServerFn_handler = createServerRpc({
	id: "ef58d6f1476c62b0f0d94f14a787dfe54dd17b97e603c6886d9c7f03b95dd7fe",
	name: "draftAgent",
	filename: "src/lib/draft-agent.ts"
}, (opts) => draftAgent.__executeServer(opts));
var draftAgent = createServerFn({ method: "POST" }).validator((input) => ({ vibe: String(input?.vibe ?? "").replace(/\s+/g, " ").trim().slice(0, 240) })).handler(draftAgent_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Grok drafting isn't available here. Seat an agent with a preset brain instead."
	};
	if (!allowCall()) return {
		ok: false,
		error: "Grok is resting — too many drafts this minute."
	};
	const vibe = data.vibe || "Surprise me with an original lab creature.";
	let res;
	try {
		res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: .9,
				max_tokens: 280,
				response_format: { type: "json_object" },
				messages: [{
					role: "system",
					content: "You design one competitor for Dish, a petri-dish game like agar.io. Cells eat pellets, flee larger cells, hunt smaller ones, and may split or eject mass. Return JSON only with keys name, handle, motto, weights. name is 1-14 characters, a specific creature or lab nickname, not Nova, Aether, Zephyr, Luna, or Atlas. handle is 2-15 lowercase letters, numbers, or underscores, with no @. motto is <= 70 characters, dry and concrete, no hashtags. weights is an object of numbers from 0 to 2: food, hunt, flee, virus, center, split, eject, wander. High hunt and split means an aggressor. High flee means a survivor. High food means a farmer."
				}, {
					role: "user",
					content: vibe
				}]
			})
		});
	} catch {
		return {
			ok: false,
			error: "Couldn't reach Grok. Try again in a moment."
		};
	}
	if (!res.ok) return {
		ok: false,
		error: `Grok couldn't draft a player (${res.status}).`
	};
	let text = "";
	try {
		text = (await res.json()).choices?.[0]?.message?.content ?? "";
		const parsed = extractJson(text);
		const name = sanitizeName(parsed.name);
		let handle = sanitizeHandle(parsed.handle);
		if (!handle) handle = sanitizeHandle(name);
		if (!handle) return {
			ok: false,
			error: "Grok's draft was missing a handle. Try again."
		};
		const weights = clampWeights(parsed.weights);
		if (!WEIGHT_KEYS.some((key) => typeof parsed.weights?.[key] === "number")) return {
			ok: false,
			error: "Grok's draft had no usable brain. Try again."
		};
		return {
			ok: true,
			agent: {
				name,
				handle,
				motto: sanitizeMotto(parsed.motto),
				weights
			}
		};
	} catch {
		return {
			ok: false,
			error: "Grok's draft wasn't usable. Try a different vibe."
		};
	}
});
//#endregion
export { draftAgent_createServerFn_handler };
