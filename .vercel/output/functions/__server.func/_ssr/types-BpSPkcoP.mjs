//#region node_modules/.nitro/vite/services/ssr/assets/types-BpSPkcoP.js
var WORLD_R = 1900;
var FOOD_MASS = 1.15;
var VISION = 1100;
var WEIGHT_KEYS = [
	"food",
	"hunt",
	"flee",
	"virus",
	"center",
	"split",
	"eject",
	"wander"
];
var OUT_N = WEIGHT_KEYS.length;
var SENSE_LABELS = [
	"Prey",
	"Threat",
	"Food",
	"Virus",
	"Mass",
	"Rim",
	"Cells",
	"Ready",
	"Drift"
];
var HIDDEN_LABELS = [
	"Snack",
	"Danger",
	"Target",
	"Bulk",
	"Edge",
	"Spore"
];
var SENSE = {
	prey: 0,
	threat: 1,
	food: 2,
	virus: 3,
	mass: 4,
	rim: 5,
	cells: 6,
	ready: 7,
	drift: 8
};
/** Output order matches WEIGHT_KEYS. */
var OUT = {
	food: 0,
	hunt: 1,
	flee: 2,
	virus: 3,
	center: 4,
	split: 5,
	eject: 6,
	wander: 7
};
var PRESETS = {
	graze: {
		label: "Grazer",
		blurb: "Eats crumbs, leaves fights",
		weights: {
			food: 1.7,
			hunt: .15,
			flee: 1.15,
			virus: .7,
			center: .4,
			split: .05,
			eject: 0,
			wander: .35
		}
	},
	hunt: {
		label: "Hunter",
		blurb: "Chases anything smaller",
		weights: {
			food: .4,
			hunt: 1.75,
			flee: .85,
			virus: 1.15,
			center: .15,
			split: .9,
			eject: .05,
			wander: .15
		}
	},
	flee: {
		label: "Coward",
		blurb: "Distance first, snacks second",
		weights: {
			food: .75,
			hunt: .05,
			flee: 2,
			virus: .35,
			center: .2,
			split: .65,
			eject: .35,
			wander: .25
		}
	},
	split: {
		label: "Splitter",
		blurb: "Breaks in half to catch or run",
		weights: {
			food: .45,
			hunt: 1.25,
			flee: .75,
			virus: 1.35,
			center: .1,
			split: 1.75,
			eject: .1,
			wander: .2
		}
	},
	scrap: {
		label: "Scrapper",
		blurb: "Wanders into other people's mess",
		weights: {
			food: 1.15,
			hunt: .85,
			flee: 1,
			virus: .55,
			center: .2,
			split: .3,
			eject: .05,
			wander: .7
		}
	}
};
var RESIDENTS = [
	{
		name: "Moss",
		handle: "slowgraze",
		motto: "Crumbs are a career.",
		hue: 128,
		weights: PRESETS.graze.weights
	},
	{
		name: "Kip",
		handle: "bitefirst",
		motto: "If it fits, it sits.",
		hue: 18,
		weights: PRESETS.hunt.weights
	},
	{
		name: "Pell",
		handle: "nope",
		motto: "Distance is a strategy.",
		hue: 200,
		weights: PRESETS.flee.weights
	},
	{
		name: "Vex",
		handle: "halve",
		motto: "Two problems. Both mine.",
		hue: 332,
		weights: PRESETS.split.weights
	},
	{
		name: "Lumen",
		handle: "scrap",
		motto: "Your leftovers have a name.",
		hue: 48,
		weights: PRESETS.scrap.weights
	},
	{
		name: "Brine",
		handle: "middle",
		motto: "Stay where the dish is thick.",
		hue: 168,
		weights: {
			food: 1.1,
			hunt: .55,
			flee: .9,
			virus: 1.2,
			center: 1.6,
			split: .15,
			eject: 0,
			wander: .15
		}
	},
	{
		name: "Sable",
		handle: "patient",
		motto: "Wait for the mistake.",
		hue: 262,
		weights: {
			food: .7,
			hunt: 1.05,
			flee: 1.35,
			virus: 1,
			center: .3,
			split: .2,
			eject: 0,
			wander: .2
		}
	}
];
function radiusOf(mass) {
	return Math.sqrt(Math.max(1, mass)) * 5.15;
}
function maxSpeed(mass) {
	return 920 * Math.pow(Math.max(1, mass), -.36);
}
function clampWeights(partial, base) {
	const out = { ...base ?? PRESETS.hunt.weights };
	if (!partial) return out;
	for (const key of WEIGHT_KEYS) {
		const value = partial[key];
		if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.min(2, Math.max(0, value));
	}
	return out;
}
function sanitizeName(raw) {
	return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 16) || "Cell";
}
function sanitizeHandle(raw) {
	return String(raw ?? "").replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15);
}
function sanitizeMotto(raw) {
	return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}
function traitLabel(weights) {
	const scores = [
		{
			label: "Grazer",
			score: weights.food - weights.hunt * .25
		},
		{
			label: "Hunter",
			score: weights.hunt + weights.split * .2
		},
		{
			label: "Coward",
			score: weights.flee - weights.hunt * .15
		},
		{
			label: "Splitter",
			score: weights.split + weights.hunt * .15
		},
		{
			label: "Scrapper",
			score: weights.wander * 1.2 + weights.food * .25
		}
	];
	let best = scores[0];
	for (const row of scores) if (row.score > best.score) best = row;
	return best.label;
}
function sourceLabel(source) {
	switch (source) {
		case "resident": return "Lab";
		case "human": return "You";
		case "grok": return "Grok";
		case "protocol": return "Code";
		case "import": return "Import";
		case "preset": return "Seated";
	}
}
function formatMass(mass) {
	if (mass >= 1e4) return `${Math.round(mass / 1e3)}k`;
	if (mass >= 1e3) return `${(mass / 1e3).toFixed(1)}k`;
	return String(Math.floor(mass));
}
var PROTOCOL_SNIPPET = `const seat = window.__dish.join({
  name: "Marrow",
  handle: "marrow",
  weights: { food: 0.5, hunt: 1.4, flee: 0.8, virus: 1, center: 0.2, split: 0.9, eject: 0, wander: 0.2 }
})
if (!seat.ok) throw new Error(seat.error)
setInterval(() => {
  const view = window.__dish.observe(seat.id)
  if (!view?.you.alive) return
  const threat = view.threats[0]
  const prey = view.prey[0]
  const food = view.food[0]
  const aim = threat
    ? { x: view.you.x * 2 - threat.x, y: view.you.y * 2 - threat.y }
    : prey ?? food ?? view.you
  const canSplit = !!prey && view.you.mass > prey.mass * 2.4 && Math.hypot(prey.x - view.you.x, prey.y - view.you.y) < 280
  window.__dish.act(seat.id, { targetX: aim.x, targetY: aim.y, split: canSplit, eject: false })
}, 150)`;
//#endregion
export { sanitizeHandle as _, PRESETS as a, sourceLabel as b, SENSE as c, WEIGHT_KEYS as d, WORLD_R as f, radiusOf as g, maxSpeed as h, OUT_N as i, SENSE_LABELS as l, formatMass as m, HIDDEN_LABELS as n, PROTOCOL_SNIPPET as o, clampWeights as p, OUT as r, RESIDENTS as s, FOOD_MASS as t, VISION as u, sanitizeMotto as v, traitLabel as x, sanitizeName as y };
