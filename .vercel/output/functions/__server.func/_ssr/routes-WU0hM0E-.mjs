import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { _ as sanitizeHandle, a as PRESETS, b as sourceLabel, c as SENSE, d as WEIGHT_KEYS, f as WORLD_R, g as radiusOf, h as maxSpeed, i as OUT_N, l as SENSE_LABELS, m as formatMass, n as HIDDEN_LABELS, o as PROTOCOL_SNIPPET, p as clampWeights, r as OUT, s as RESIDENTS, t as FOOD_MASS, u as VISION, v as sanitizeMotto, x as traitLabel, y as sanitizeName } from "./types-BpSPkcoP.mjs";
import { a as Plus, c as Bot, n as VolumeX, o as Copy, r as Volume2, s as BrainCircuit, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-WU0hM0E-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var draftAgent = createServerFn({ method: "POST" }).validator((input) => ({ vibe: String(input?.vibe ?? "").replace(/\s+/g, " ").trim().slice(0, 240) })).handler(createSsrRpc("ef58d6f1476c62b0f0d94f14a787dfe54dd17b97e603c6886d9c7f03b95dd7fe"));
/** Tiny synthesized dish sounds. Unlocked from the first pointer or key. */
var DishAudio = class {
	ctx = null;
	muted = false;
	voices = 0;
	lastCrumb = 0;
	unlock() {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		if (!this.ctx) this.ctx = new AC();
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	resume() {
		if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
	}
	crumb() {
		const now = performance.now();
		if (now - this.lastCrumb < 45) return;
		this.lastCrumb = now;
		this.tone(680 + Math.random() * 220, .045, "sine", .045);
	}
	bite() {
		this.tone(180 + Math.random() * 30, .12, "triangle", .08);
		this.tone(440 + Math.random() * 40, .08, "sine", .04);
	}
	split() {
		this.tone(240, .09, "sawtooth", .03);
	}
	pop() {
		this.tone(90, .16, "square", .04);
	}
	wipe() {
		this.tone(280, .18, "sine", .06);
		this.tone(120, .22, "triangle", .05);
	}
	tone(freq, dur, type, gain) {
		if (this.muted || !this.ctx || this.voices > 10) return;
		const ctx = this.ctx;
		const osc = ctx.createOscillator();
		const amp = ctx.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		const t = ctx.currentTime;
		amp.gain.setValueAtTime(1e-4, t);
		amp.gain.exponentialRampToValueAtTime(Math.max(2e-4, gain), t + .012);
		amp.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		osc.connect(amp);
		amp.connect(ctx.destination);
		osc.start(t);
		osc.stop(t + dur + .02);
		this.voices += 1;
		osc.onended = () => {
			this.voices = Math.max(0, this.voices - 1);
			osc.disconnect();
			amp.disconnect();
		};
	}
};
var SYNAPSE_LIMIT = 3;
function clamp01(n) {
	return Math.min(1, Math.max(0, n));
}
function clampSynapse(n) {
	return Math.min(SYNAPSE_LIMIT, Math.max(-3, n));
}
function zeroTrace() {
	return {
		sense: Array.from({ length: 9 }, () => 0),
		hidden: Array.from({ length: 6 }, () => 0),
		out: Array.from({ length: OUT_N }, () => 0)
	};
}
function cloneBrain(brain) {
	return {
		w1: brain.w1.slice(),
		b1: brain.b1.slice(),
		w2: brain.w2.slice(),
		b2: brain.b2.slice()
	};
}
function saltOf(text) {
	let h = 2166136261;
	for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	return h >>> 0;
}
function unitNoise(salt, i) {
	const x = Math.sin(salt * .017 + i * 12.9898) * 43758.5453;
	return (x - Math.floor(x)) * 2 - 1;
}
/**
* Resting drive stays near the personality weight. Context can only spend
* part of the remaining headroom, so a grazer never turns into a hunter
* just because prey walked past.
*/
function mixGain(base, delta) {
	const clamped = Math.min(1, Math.max(-1, delta));
	const shift = clamped >= 0 ? clamped * (2.4 - base) * .42 : clamped * base * .72;
	return Math.min(2.4, Math.max(0, base + shift));
}
function forward(brain, sense) {
	const hidden = [];
	for (let h = 0; h < 6; h += 1) {
		let sum = brain.b1[h] ?? 0;
		const row = h * 9;
		for (let i = 0; i < 9; i += 1) sum += (brain.w1[row + i] ?? 0) * (sense[i] ?? 0);
		hidden.push(Math.tanh(sum));
	}
	const out = [];
	for (let o = 0; o < OUT_N; o += 1) {
		let sum = brain.b2[o] ?? 0;
		const row = o * 6;
		for (let h = 0; h < 6; h += 1) sum += (brain.w2[row + h] ?? 0) * (hidden[h] ?? 0);
		out.push(Math.tanh(sum));
	}
	return {
		hidden,
		out
	};
}
function setIn(w1, hidden, sense, value) {
	w1[hidden * 9 + sense] = value;
}
function setOut(w2, output, hidden, value) {
	w2[output * 6 + hidden] = value;
}
/** Standard reflex wiring. Personality lives in the output biases. */
function brainFromWeights(weights, salt = 0) {
	const w1 = Array.from({ length: 54 }, () => 0);
	const b1 = Array.from({ length: 6 }, () => 0);
	const w2 = Array.from({ length: OUT_N * 6 }, () => 0);
	const b2 = Array.from({ length: OUT_N }, () => 0);
	setIn(w1, 0, SENSE.food, 2.5);
	b1[0] = -.85;
	setIn(w1, 1, SENSE.threat, 2.7);
	b1[1] = -.55;
	setIn(w1, 2, SENSE.prey, 2.6);
	b1[2] = -.8;
	setIn(w1, 3, SENSE.mass, 2.2);
	b1[3] = -1;
	setIn(w1, 4, SENSE.rim, 2.8);
	b1[4] = -.7;
	setIn(w1, 5, SENSE.virus, 2.1);
	setIn(w1, 5, SENSE.mass, 1.15);
	b1[5] = -1.25;
	setOut(w2, OUT.food, 0, 1.05);
	setOut(w2, OUT.food, 1, -.85);
	setOut(w2, OUT.hunt, 2, .7);
	setOut(w2, OUT.hunt, 1, -.55);
	setOut(w2, OUT.flee, 1, 1.15);
	setOut(w2, OUT.flee, 2, -.2);
	setOut(w2, OUT.virus, 5, 1.05);
	setOut(w2, OUT.virus, 3, .25);
	setOut(w2, OUT.center, 4, 1.2);
	setOut(w2, OUT.wander, 0, .12);
	setOut(w2, OUT.split, 2, .85);
	setOut(w2, OUT.split, 3, .35);
	setOut(w2, OUT.split, 1, -.4);
	setOut(w2, OUT.eject, 1, .7);
	setOut(w2, OUT.eject, 3, .85);
	b2[OUT.food] = (weights.food - 1) * .2;
	b2[OUT.hunt] = (weights.hunt - .85) * .28;
	b2[OUT.flee] = (weights.flee - .95) * .28;
	b2[OUT.virus] = (weights.virus - .85) * .22;
	b2[OUT.center] = (weights.center - .35) * .35;
	b2[OUT.split] = (weights.split - .5) * .85;
	b2[OUT.eject] = -1.15 + weights.eject * .45;
	b2[OUT.wander] = (weights.wander - .3) * .4;
	if (salt) {
		for (let i = 0; i < w1.length; i += 1) w1[i] = clampSynapse((w1[i] ?? 0) + unitNoise(salt, i) * .07);
		for (let i = 0; i < w2.length; i += 1) w2[i] = clampSynapse((w2[i] ?? 0) + unitNoise(salt, i + 80) * .06);
	}
	return {
		w1,
		b1,
		w2,
		b2
	};
}
function mutateBrain(brain, amount = .32) {
	const next = cloneBrain(brain);
	const kick = (n, scale) => clampSynapse(n + (Math.random() * 2 - 1) * amount * scale);
	next.w1 = next.w1.map((n) => kick(n, 1));
	next.w2 = next.w2.map((n) => kick(n, 1));
	next.b1 = next.b1.map((n) => kick(n, .65));
	next.b2 = next.b2.map((n) => kick(n, .65));
	return next;
}
function randomBrain() {
	const fill = (n, scale) => Array.from({ length: n }, () => clampSynapse((Math.random() * 2 - 1) * scale));
	return {
		w1: fill(54, 1.7),
		b1: fill(6, 1.1),
		w2: fill(OUT_N * 6, 1.5),
		b2: fill(OUT_N, .8)
	};
}
function parseBrain(raw) {
	if (!raw || typeof raw !== "object") return null;
	const rec = raw;
	if (!Array.isArray(rec.w1) || rec.w1.length !== 54) return null;
	if (!Array.isArray(rec.b1) || rec.b1.length !== 6) return null;
	if (!Array.isArray(rec.w2) || rec.w2.length !== OUT_N * 6) return null;
	if (!Array.isArray(rec.b2) || rec.b2.length !== OUT_N) return null;
	const num = (value) => typeof value === "number" && Number.isFinite(value) ? clampSynapse(value) : 0;
	return {
		w1: rec.w1.map(num),
		b1: rec.b1.map(num),
		w2: rec.w2.map(num),
		b2: rec.b2.map(num)
	};
}
var DRIVE_LABEL = {
	food: "Food",
	hunt: "Hunt",
	flee: "Flee",
	virus: "Virus",
	center: "Center",
	split: "Split",
	eject: "Eject",
	wander: "Wander"
};
function NeuralBench({ open, players, onClose, onWeight, onBrain, onFocus }) {
	const [pick, setPick] = (0, import_react.useState)(null);
	const [slot, setSlot] = (0, import_react.useState)({
		kind: "hidden",
		index: 1
	});
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [weights, setWeights] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const selected = players.find((p) => p.id === pick) ?? players.find((p) => p.kind === "agent") ?? null;
	(0, import_react.useEffect)(() => {
		if (!selected) return;
		setWeights({ ...selected.weights });
	}, [selected?.id]);
	(0, import_react.useEffect)(() => {
		if (!selected?.brain?.w1) return;
		setDraft(cloneBrain(selected.brain));
	}, [selected?.id, selected?.brainRev]);
	(0, import_react.useEffect)(() => {
		if (!open || !selected || selected.kind !== "agent") return;
		onFocus(selected.id);
	}, [open, selected?.id]);
	if (!open) return null;
	function choose(id) {
		setPick(id);
		onFocus(id);
	}
	function commit(next) {
		if (!selected || selected.kind === "human") return;
		setDraft(next);
		onBrain(selected.id, next);
	}
	function writeSynapse(index, value, bias = false) {
		if (!draft || !selected || selected.kind === "human") return;
		const next = cloneBrain(draft);
		if (bias) {
			if (slot.kind === "hidden") next.b1[slot.index] = value;
			else if (slot.kind === "out") next.b2[slot.index] = value;
		} else if (slot.kind === "hidden") next.w1[slot.index * 9 + index] = value;
		else if (slot.kind === "out") next.w2[slot.index * 6 + index] = value;
		else next.w1[index * 9 + slot.index] = value;
		commit(next);
	}
	const trace = selected?.trace;
	const liveWeights = weights && selected ? weights : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "fixed inset-0 z-20 flex flex-col overflow-y-auto bg-ink p-4 sm:absolute sm:inset-auto sm:top-16 sm:bottom-24 sm:left-3 sm:w-96 sm:rounded-2xl sm:border sm:border-sage/25 sm:bg-membrane/95 sm:p-4 sm:backdrop-blur-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "flex items-center gap-2 text-xl font-bold tracking-tight text-balance",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrainCircuit, { className: "size-5 text-acid" }), "Neural controls"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-pretty text-sage",
					children: "Senses fire, hidden cells mix them, drives steer. Acid excites, sage inhibits."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex size-11 shrink-0 items-center justify-center rounded-full border border-sage/30",
					"aria-label": "Close neural controls",
					onClick: onClose,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			players.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-sage",
				children: "The dish is empty."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: players.map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					"aria-pressed": player.id === selected?.id,
					className: `flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm ${player.id === selected?.id ? "border-acid text-foam" : "border-sage/30 text-sage"}`,
					onClick: () => choose(player.id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "size-2 rounded-full",
						style: { background: `hsl(${player.hue} 75% 55%)` }
					}), player.name]
				}, player.id))
			}),
			selected?.kind === "human" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-pretty text-sage",
				children: "You're driving this cell. Neural controls run the other organisms."
			}) : null,
			selected && selected.kind === "agent" && draft && liveWeights && trace ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 font-mono text-xs text-sage",
					children: [
						"Live drive",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-acid",
							children: hottest(liveWeights, trace)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NetDiagram, {
					brain: draft,
					trace,
					slot,
					onPick: setSlot
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs text-sage",
					children: "Hidden cells: S snack, D danger, T target, B bulk, E edge, P spore."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: slotTitle(slot)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-col gap-2",
						children: synapseRows(slot).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Synapse, {
							label: row.label,
							value: readSynapse(draft, slot, row),
							min: -3,
							max: 3,
							onChange: (value) => writeSynapse(row.index, value, row.bias)
						}, row.key))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full bg-acid px-4 text-sm font-semibold text-ink",
							onClick: () => commit(mutateBrain(draft)),
							children: "Mutate"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-sage/40 px-4 text-sm",
							onClick: () => commit(randomBrain()),
							children: "Rewire"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-sage/40 px-4 text-sm",
							onClick: () => commit(brainFromWeights(liveWeights, saltOf(selected.handle || selected.name))),
							children: "Reset"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-sage/40 px-4 text-sm",
							onClick: () => {
								const payload = JSON.stringify({
									name: selected.name,
									handle: selected.handle,
									weights: liveWeights,
									brain: draft
								}, null, 2);
								navigator.clipboard?.writeText(payload).then(() => {
									setCopied(true);
									window.setTimeout(() => setCopied(false), 1200);
								});
							},
							children: copied ? "Copied" : "Copy brain"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold",
							children: "Resting drives"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-pretty text-sage",
							children: "The net pushes these up or down from what it senses. The acid number is the live gain."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 grid grid-cols-2 gap-x-3 gap-y-2",
							children: WEIGHT_KEYS.map((key, index) => {
								const base = liveWeights[key];
								const now = mixGain(base, trace.out[index] ?? 0);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-baseline justify-between font-mono text-xs text-sage",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: DRIVE_LABEL[key] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-acid tabular-nums",
											children: now.toFixed(2)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: 0,
										max: 2,
										step: .05,
										value: base,
										"aria-label": `${DRIVE_LABEL[key]} drive`,
										"aria-valuemin": 0,
										"aria-valuemax": 2,
										"aria-valuenow": base,
										"aria-valuetext": `${base.toFixed(2)}, live ${now.toFixed(2)}`,
										className: "h-11",
										onChange: (e) => {
											const value = Number(e.target.value);
											const next = {
												...liveWeights,
												[key]: value
											};
											setWeights(next);
											onWeight(selected.id, key, value);
										}
									})]
								}, key);
							})
						})
					]
				})
			] }) : null
		]
	});
}
function hottest(weights, trace) {
	let best = "Food";
	let score = -1;
	for (let i = 0; i < WEIGHT_KEYS.length; i += 1) {
		const key = WEIGHT_KEYS[i];
		const gain = mixGain(weights[key], trace.out[i] ?? 0);
		if (gain > score) {
			score = gain;
			best = DRIVE_LABEL[key];
		}
	}
	return `${best} ${score.toFixed(2)}`;
}
function slotTitle(slot) {
	if (slot.kind === "sense") return `${SENSE_LABELS[slot.index]} synapses`;
	if (slot.kind === "hidden") return `${HIDDEN_LABELS[slot.index]} cell`;
	return `${DRIVE_LABEL[WEIGHT_KEYS[slot.index]] ?? "Drive"} output`;
}
function synapseRows(slot) {
	if (slot.kind === "hidden") return [...SENSE_LABELS.map((label, index) => ({
		key: `s${index}`,
		label,
		index,
		bias: false
	})), {
		key: "bias",
		label: "Bias",
		index: 0,
		bias: true
	}];
	if (slot.kind === "out") return [...HIDDEN_LABELS.map((label, index) => ({
		key: `h${index}`,
		label,
		index,
		bias: false
	})), {
		key: "bias",
		label: "Bias",
		index: 0,
		bias: true
	}];
	return HIDDEN_LABELS.map((label, index) => ({
		key: `h${index}`,
		label,
		index,
		bias: false
	}));
}
function readSynapse(brain, slot, row) {
	if (row.bias) {
		if (slot.kind === "hidden") return brain.b1[slot.index] ?? 0;
		if (slot.kind === "out") return brain.b2[slot.index] ?? 0;
		return 0;
	}
	if (slot.kind === "hidden") return brain.w1[slot.index * 9 + row.index] ?? 0;
	if (slot.kind === "out") return brain.w2[slot.index * 6 + row.index] ?? 0;
	return brain.w1[row.index * 9 + slot.index] ?? 0;
}
function Synapse({ label, value, min, max, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-16 shrink-0 truncate font-mono text-xs text-sage",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "range",
				min,
				max,
				step: .05,
				value,
				"aria-label": label,
				"aria-valuemin": min,
				"aria-valuemax": max,
				"aria-valuenow": Number(value.toFixed(2)),
				className: "h-11 min-w-0 flex-1",
				onChange: (e) => onChange(Number(e.target.value))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `w-10 shrink-0 text-right font-mono text-xs tabular-nums ${value >= 0 ? "text-acid" : "text-sage"}`,
				children: value.toFixed(2)
			})
		]
	});
}
function NetDiagram({ brain, trace, slot, onPick }) {
	const width = 360;
	const height = 292;
	const yOf = (index, count) => 18 + index * 256 / Math.max(1, count - 1);
	const selected = (kind, index) => slot.kind === kind && slot.index === index;
	const lines = [];
	if (slot.kind === "sense") for (let h = 0; h < 6; h += 1) lines.push({
		key: `s${h}`,
		x1: 86,
		y1: yOf(slot.index, 9),
		x2: 180,
		y2: yOf(h, 6),
		w: brain.w1[h * 9 + slot.index] ?? 0
	});
	else if (slot.kind === "hidden") {
		for (let s = 0; s < 9; s += 1) lines.push({
			key: `in${s}`,
			x1: 86,
			y1: yOf(s, 9),
			x2: 180,
			y2: yOf(slot.index, 6),
			w: brain.w1[slot.index * 9 + s] ?? 0
		});
		for (let o = 0; o < OUT_N; o += 1) lines.push({
			key: `out${o}`,
			x1: 180,
			y1: yOf(slot.index, 6),
			x2: 274,
			y2: yOf(o, OUT_N),
			w: brain.w2[o * 6 + slot.index] ?? 0
		});
	} else for (let h = 0; h < 6; h += 1) lines.push({
		key: `h${h}`,
		x1: 180,
		y1: yOf(h, 6),
		x2: 274,
		y2: yOf(slot.index, OUT_N),
		w: brain.w2[slot.index * 6 + h] ?? 0
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${width} ${height}`,
		className: "mt-2 w-full text-foam",
		role: "group",
		"aria-label": "Neural net",
		children: [
			lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: line.x1,
				y1: line.y1,
				x2: line.x2,
				y2: line.y2,
				stroke: line.w >= 0 ? "var(--color-acid)" : "var(--color-sage)",
				strokeWidth: Math.max(1, Math.min(4, Math.abs(line.w) * 1.6)),
				strokeOpacity: Math.min(.95, .2 + Math.abs(line.w) / 3)
			}, line.key)),
			SENSE_LABELS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Node, {
				x: 86,
				y: yOf(index, 9),
				label,
				labelX: 6,
				anchor: "start",
				hot: heat(trace.sense[index] ?? 0),
				picked: selected("sense", index),
				mark: "",
				onClick: () => onPick({
					kind: "sense",
					index
				})
			}, label)),
			[
				"S",
				"D",
				"T",
				"B",
				"E",
				"P"
			].map((mark, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Node, {
				x: 180,
				y: yOf(index, 6),
				label: HIDDEN_LABELS[index] ?? mark,
				labelX: 180,
				anchor: "middle",
				hot: heat(trace.hidden[index] ?? 0),
				picked: selected("hidden", index),
				mark,
				onClick: () => onPick({
					kind: "hidden",
					index
				})
			}, HIDDEN_LABELS[index])),
			WEIGHT_KEYS.map((key, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Node, {
				x: 274,
				y: yOf(index, OUT_N),
				label: DRIVE_LABEL[key],
				labelX: 292,
				anchor: "start",
				hot: heat(trace.out[index] ?? 0),
				picked: selected("out", index),
				mark: "",
				onClick: () => onPick({
					kind: "out",
					index
				})
			}, key))
		]
	});
}
function heat(value) {
	return Math.min(1, Math.abs(value));
}
function Node({ x, y, label, labelX, anchor, hot, picked, mark, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		role: "button",
		tabIndex: 0,
		"aria-label": label,
		"aria-pressed": picked,
		className: "cursor-pointer",
		onClick,
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onClick();
			}
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: x,
			cy: y,
			r: picked ? 11 : 8,
			fill: picked ? "var(--color-acid)" : "var(--color-ink)",
			stroke: "var(--color-foam)",
			strokeOpacity: .35 + hot * .65,
			strokeWidth: picked ? 2 : 1.5
		}), mark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
			x,
			y: y + 3,
			textAnchor: "middle",
			fill: picked ? "var(--color-ink)" : "var(--color-foam)",
			style: {
				fontSize: 9,
				fontFamily: "IBM Plex Mono, ui-monospace, monospace"
			},
			children: mark
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
			x: labelX,
			y: y + 3,
			textAnchor: anchor,
			fill: picked ? "var(--color-acid)" : "var(--color-sage)",
			style: {
				fontSize: 10,
				fontFamily: "IBM Plex Mono, ui-monospace, monospace"
			},
			children: label
		})]
	});
}
var INK = "#07140f";
var DISH = "#0c1c16";
var GRID = "rgba(231, 246, 238, 0.055)";
var ACID = "#d6ff4a";
var FOAM = "#e7f6ee";
function makeFx() {
	return {
		particles: [],
		floaters: [],
		trauma: 0
	};
}
function burst(fx, x, y, hue, n, speed) {
	for (let i = 0; i < n; i += 1) {
		const a = Math.random() * Math.PI * 2;
		const s = speed * (.35 + Math.random());
		fx.particles.push({
			x,
			y,
			vx: Math.cos(a) * s,
			vy: Math.sin(a) * s,
			life: .28 + Math.random() * .28,
			max: .5,
			hue,
			r: 1.6 + Math.random() * 2.4
		});
	}
	if (fx.particles.length > 260) fx.particles.splice(0, fx.particles.length - 260);
}
function floatText(fx, x, y, text) {
	fx.floaters.push({
		x,
		y,
		text,
		life: .7,
		max: .7
	});
	if (fx.floaters.length > 24) fx.floaters.shift();
}
function tickFx(fx, dt, reduced) {
	if (!reduced) fx.trauma = Math.max(0, fx.trauma - dt * 1.7);
	else fx.trauma = 0;
	for (const p of fx.particles) {
		p.life -= dt;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vx *= .96;
		p.vy *= .96;
	}
	fx.particles = fx.particles.filter((p) => p.life > 0);
	for (const f of fx.floaters) {
		f.life -= dt;
		f.y -= 36 * dt;
	}
	fx.floaters = fx.floaters.filter((f) => f.life > 0);
}
function drawDish(ctx, sim, cam, cssW, cssH, dpr, fx, followId, humanId, showMap, reduced) {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, cssW * dpr, cssH * dpr);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.fillStyle = INK;
	ctx.fillRect(0, 0, cssW, cssH);
	const shake = reduced ? 0 : fx.trauma * fx.trauma;
	const sx = Math.sin(sim.time * 41) * 16 * shake;
	const sy = Math.cos(sim.time * 37) * 12 * shake;
	ctx.save();
	ctx.translate(cssW / 2 + sx, cssH / 2 + sy);
	ctx.scale(cam.zoom, cam.zoom);
	ctx.translate(-cam.x, -cam.y);
	ctx.beginPath();
	ctx.arc(0, 0, WORLD_R, 0, Math.PI * 2);
	ctx.fillStyle = DISH;
	ctx.fill();
	ctx.save();
	ctx.clip();
	const gap = 88;
	const view = Math.max(cssW, cssH) / cam.zoom;
	const left = cam.x - view;
	const right = cam.x + view;
	const top = cam.y - view;
	const bottom = cam.y + view;
	ctx.beginPath();
	ctx.strokeStyle = GRID;
	ctx.lineWidth = 1 / cam.zoom;
	const x0 = Math.floor(left / gap) * gap;
	const y0 = Math.floor(top / gap) * gap;
	for (let x = x0; x <= right; x += gap) {
		ctx.moveTo(x, top);
		ctx.lineTo(x, bottom);
	}
	for (let y = y0; y <= bottom; y += gap) {
		ctx.moveTo(left, y);
		ctx.lineTo(right, y);
	}
	ctx.stroke();
	for (const food of sim.foods) {
		if (food.x < left - 20 || food.x > right + 20 || food.y < top - 20 || food.y > bottom + 20) continue;
		ctx.fillStyle = `hsl(${food.hue} 72% 64%)`;
		ctx.beginPath();
		ctx.arc(food.x, food.y, 5.4, 0, Math.PI * 2);
		ctx.fill();
	}
	for (const pellet of sim.pellets) {
		ctx.fillStyle = `hsl(${pellet.hue} 80% 62%)`;
		ctx.beginPath();
		ctx.arc(pellet.x, pellet.y, 8, 0, Math.PI * 2);
		ctx.fill();
	}
	for (const virus of sim.viruses) drawVirus(ctx, virus.x, virus.y, radiusOf(virus.mass) * .92, sim.time, virus.id);
	const largest = /* @__PURE__ */ new Map();
	for (const cell of sim.cells) {
		const prev = largest.get(cell.owner);
		if (prev == null || cell.mass > prev) largest.set(cell.owner, cell.mass);
	}
	const ordered = sim.cells.slice().sort((a, b) => a.mass - b.mass);
	const byId = new Map(sim.players.map((p) => [p.id, p]));
	for (const cell of ordered) {
		const player = byId.get(cell.owner);
		if (!player) continue;
		if (cell.x < left - 200 || cell.x > right + 200 || cell.y < top - 200 || cell.y > bottom + 200) continue;
		const r = radiusOf(cell.mass);
		const sp = Math.hypot(cell.vx, cell.vy);
		const stretch = reduced ? 0 : Math.min(.16, sp / 1600);
		const ang = Math.atan2(cell.vy, cell.vx);
		ctx.save();
		ctx.translate(cell.x, cell.y);
		ctx.rotate(ang);
		ctx.scale(1 + stretch, 1 - stretch * .55);
		ctx.beginPath();
		ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
		ctx.fillStyle = `hsla(${player.hue} 80% 48% / 0.16)`;
		ctx.fill();
		const g = ctx.createRadialGradient(-r * .28, -r * .34, r * .08, 0, 0, r);
		g.addColorStop(0, `hsl(${player.hue} 90% 74%)`);
		g.addColorStop(.5, `hsl(${player.hue} 76% 52%)`);
		g.addColorStop(1, `hsl(${player.hue} 68% 34%)`);
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fillStyle = g;
		ctx.fill();
		ctx.lineWidth = Math.max(1.5, r * .045);
		ctx.strokeStyle = `hsl(${player.hue} 55% 22%)`;
		ctx.stroke();
		ctx.restore();
		const look = Math.atan2(player.targetY - cell.y, player.targetX - cell.x);
		drawEyes(ctx, cell.x, cell.y - r * .12, r, look);
		if (largest.get(cell.owner) === cell.mass && r * cam.zoom >= 20) {
			const px = Math.min(18, Math.max(12, r * cam.zoom * .32)) / cam.zoom;
			const nameY = cell.y + r * .28;
			ctx.font = `700 ${px}px Syne, sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.lineWidth = 3 / cam.zoom;
			ctx.strokeStyle = "rgba(7, 20, 15, 0.88)";
			ctx.strokeText(player.name, cell.x, nameY);
			ctx.fillStyle = FOAM;
			ctx.fillText(player.name, cell.x, nameY);
		}
		if (cell.owner === humanId || cell.owner === followId) {
			ctx.beginPath();
			ctx.arc(cell.x, cell.y, r + 7, 0, Math.PI * 2);
			ctx.strokeStyle = cell.owner === humanId ? ACID : "rgba(231, 246, 238, 0.45)";
			ctx.lineWidth = (cell.owner === humanId ? 2.5 : 1.5) / cam.zoom;
			ctx.stroke();
		}
	}
	for (const p of fx.particles) {
		ctx.globalAlpha = Math.max(0, p.life / p.max);
		ctx.fillStyle = `hsl(${p.hue} 80% 64%)`;
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	ctx.font = `${14 / cam.zoom}px "IBM Plex Mono", monospace`;
	ctx.textAlign = "center";
	for (const f of fx.floaters) {
		ctx.globalAlpha = Math.max(0, f.life / f.max);
		ctx.fillStyle = ACID;
		ctx.fillText(f.text, f.x, f.y);
	}
	ctx.globalAlpha = 1;
	ctx.restore();
	ctx.beginPath();
	ctx.arc(0, 0, WORLD_R, 0, Math.PI * 2);
	ctx.strokeStyle = "rgba(214, 255, 74, 0.55)";
	ctx.lineWidth = 10 / cam.zoom;
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(0, 0, WORLD_R - 18, 0, Math.PI * 2);
	ctx.strokeStyle = "rgba(231, 246, 238, 0.18)";
	ctx.lineWidth = 2 / cam.zoom;
	ctx.stroke();
	ctx.restore();
	const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, cssW * .25, cssW / 2, cssH / 2, cssW * .72);
	vignette.addColorStop(0, "rgba(7, 20, 15, 0)");
	vignette.addColorStop(1, "rgba(7, 20, 15, 0.45)");
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, cssW, cssH);
	if (showMap) drawMap(ctx, sim, followId, humanId, cssW, cssH);
}
function drawEyes(ctx, x, y, r, look) {
	if (r < 11) return;
	const ex = Math.cos(look) * r * .28;
	const ey = Math.sin(look) * r * .28;
	const px = -Math.sin(look) * r * .28;
	const py = Math.cos(look) * r * .28;
	const er = Math.max(2.2, r * .15);
	const pr = er * .48;
	for (const sign of [-1, 1]) {
		const ox = x + ex + px * sign;
		const oy = y + ey + py * sign;
		ctx.beginPath();
		ctx.arc(ox, oy, er, 0, Math.PI * 2);
		ctx.fillStyle = "#f4fff8";
		ctx.fill();
		ctx.beginPath();
		ctx.arc(ox + Math.cos(look) * er * .35, oy + Math.sin(look) * er * .35, pr, 0, Math.PI * 2);
		ctx.fillStyle = "#102018";
		ctx.fill();
	}
}
function drawVirus(ctx, x, y, r, time, id) {
	const spikes = 16;
	ctx.beginPath();
	for (let i = 0; i < spikes; i += 1) {
		const a = i / spikes * Math.PI * 2 + Math.sin(time * .7 + id) * .04;
		const rad = r * (i % 2 === 0 ? 1.2 : .8);
		const px = x + Math.cos(a) * rad;
		const py = y + Math.sin(a) * rad;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
	ctx.fillStyle = "hsl(152 48% 34%)";
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = "rgba(214, 255, 74, 0.35)";
	ctx.stroke();
}
function drawMap(ctx, sim, followId, humanId, cssW, cssH) {
	const size = 116;
	const x = cssW - size - 16;
	const y = cssH - size - 108;
	ctx.save();
	ctx.translate(x, y);
	ctx.beginPath();
	ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(7, 20, 15, 0.72)";
	ctx.fill();
	ctx.strokeStyle = "rgba(214, 255, 74, 0.45)";
	ctx.lineWidth = 1.5;
	ctx.stroke();
	const scale = size / 2 / WORLD_R;
	const cx = size / 2;
	const cy = size / 2;
	for (const cell of sim.cells) {
		const px = cx + cell.x * scale;
		const py = cy + cell.y * scale;
		const player = sim.players.find((p) => p.id === cell.owner);
		ctx.fillStyle = cell.owner === humanId ? ACID : `hsl(${player?.hue ?? 80} 70% 58%)`;
		ctx.beginPath();
		ctx.arc(px, py, cell.owner === followId || cell.owner === humanId ? 3.2 : 2.1, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
}
var FOOD_HUES = [
	48,
	152,
	200,
	330,
	18,
	78
];
var DishSim = class {
	time = 0;
	players = [];
	cells = [];
	foods = [];
	viruses = [];
	pellets = [];
	events = [];
	feed = [];
	seq = 1;
	feedSeq = 1;
	hueSeq = 24;
	constructor() {
		for (let i = 0; i < 540; i += 1) this.spawnFood();
		for (let i = 0; i < 11; i += 1) this.spawnVirus();
		for (const seed of RESIDENTS) this.join({
			name: seed.name,
			handle: seed.handle,
			motto: seed.motto,
			weights: seed.weights,
			hue: seed.hue,
			source: "resident",
			kind: "agent"
		});
	}
	join(input) {
		if (this.players.length >= 16) return {
			ok: false,
			error: "The dish is full. Remove an agent first."
		};
		const preset = input.preset && PRESETS[input.preset] ? input.preset : null;
		const weights = clampWeights(input.weights, preset ? PRESETS[preset].weights : void 0);
		const kind = input.kind === "human" ? "human" : "agent";
		const source = input.source ?? (kind === "human" ? "human" : preset ? "preset" : "protocol");
		const spot = this.spawnPoint();
		const id = this.seq++;
		const hue = typeof input.hue === "number" && Number.isFinite(input.hue) ? (input.hue % 360 + 360) % 360 : this.hueSeq;
		this.hueSeq = (this.hueSeq + 47) % 360;
		const handle = sanitizeHandle(input.handle);
		const name = sanitizeName(input.name);
		const brain = parseBrain(input.brain) ?? brainFromWeights(weights, saltOf(handle || name));
		const player = {
			id,
			name,
			handle,
			motto: sanitizeMotto(input.motto),
			kind,
			source,
			preset,
			weights,
			brain,
			trace: zeroTrace(),
			brainRev: 1,
			hue,
			kills: 0,
			peak: 34,
			targetX: spot.x + 180,
			targetY: spot.y,
			aimX: 1,
			aimY: 0,
			wander: Math.random() * Math.PI * 2,
			nextDecision: 0,
			splitCd: 0,
			ejectCd: 0,
			splitQueued: false,
			splitAll: kind === "human",
			ejectHeld: false,
			ejectQueued: false,
			pilot: "brain",
			manualUntil: 0,
			respawnAt: 0,
			lastX: spot.x,
			lastY: spot.y,
			alive: true
		};
		this.players.push(player);
		this.cells.push(this.makeCell(player, spot.x, spot.y, 34, 0, 0));
		return {
			ok: true,
			id,
			name: player.name,
			handle: player.handle
		};
	}
	leave(id) {
		const idx = this.players.findIndex((p) => p.id === id);
		if (idx < 0) return false;
		this.players.splice(idx, 1);
		this.cells = this.cells.filter((c) => c.owner !== id);
		this.pellets = this.pellets.filter((p) => p.owner !== id);
		return true;
	}
	restock() {
		for (const seed of RESIDENTS) {
			if (this.players.some((p) => p.source === "resident" && p.handle === seed.handle)) continue;
			this.join({
				name: seed.name,
				handle: seed.handle,
				motto: seed.motto,
				weights: seed.weights,
				hue: seed.hue,
				source: "resident",
				kind: "agent"
			});
		}
	}
	setAim(id, x, y) {
		const player = this.player(id);
		if (!player) return;
		player.targetX = x;
		player.targetY = y;
		this.noteAim(player);
	}
	setEjectHeld(id, held) {
		const player = this.player(id);
		if (player) player.ejectHeld = held;
	}
	queueSplit(id, all = false) {
		const player = this.player(id);
		if (!player) return;
		player.splitQueued = true;
		if (all) player.splitAll = true;
	}
	act(id, action) {
		const player = this.player(id);
		if (!player || !player.alive) return;
		if (Number.isFinite(action.targetX) && Number.isFinite(action.targetY)) {
			player.targetX = action.targetX;
			player.targetY = action.targetY;
			this.noteAim(player);
		}
		player.pilot = "manual";
		player.manualUntil = this.time + 1.6;
		if (action.split) {
			player.splitQueued = true;
			player.splitAll = Boolean(action.splitAll);
		}
		if (action.eject) player.ejectQueued = true;
	}
	setWeight(id, key, value) {
		const player = this.player(id);
		if (!player || player.kind === "human") return;
		if (!WEIGHT_KEYS.includes(key)) return;
		if (typeof value !== "number" || !Number.isFinite(value)) return;
		player.weights[key] = Math.min(2, Math.max(0, value));
	}
	setBrain(id, brain) {
		const player = this.player(id);
		const next = parseBrain(brain);
		if (!player || player.kind === "human" || !next) return false;
		player.brain = next;
		player.brainRev += 1;
		return true;
	}
	observe(id) {
		const player = this.player(id);
		if (!player) return null;
		const mine = this.cells.filter((c) => c.owner === id);
		const mass = mine.reduce((sum, c) => sum + c.mass, 0);
		const biggest = mine.reduce((best, c) => !best || c.mass > best.mass ? c : best, null);
		const cx = mine.length ? mine.reduce((s, c) => s + c.x * c.mass, 0) / mass : player.lastX;
		const cy = mine.length ? mine.reduce((s, c) => s + c.y * c.mass, 0) / mass : player.lastY;
		const myR = biggest ? radiusOf(biggest.mass) : 0;
		const threats = [];
		const prey = [];
		const rivals = [];
		for (const cell of this.cells) {
			if (cell.owner === id) continue;
			if (Math.hypot(cell.x - cx, cell.y - cy) > 1100) continue;
			const owner = this.player(cell.owner);
			if (!owner) continue;
			const row = {
				id: owner.id,
				name: owner.name,
				handle: owner.handle,
				x: cell.x,
				y: cell.y,
				r: radiusOf(cell.mass),
				mass: cell.mass
			};
			if (biggest && cell.mass > biggest.mass * 1.08) threats.push(row);
			else if (biggest && biggest.mass > cell.mass * 1.1) prey.push(row);
			else rivals.push(row);
		}
		const byDist = (a, b) => {
			return (a.x - cx) ** 2 + (a.y - cy) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2);
		};
		threats.sort(byDist);
		prey.sort(byDist);
		rivals.sort(byDist);
		const food = this.foods.map((f) => ({
			x: f.x,
			y: f.y,
			mass: f.mass,
			d: (f.x - cx) ** 2 + (f.y - cy) ** 2
		})).filter((f) => f.d < VISION * VISION).sort((a, b) => a.d - b.d).slice(0, 24).map(({ x, y, mass: m }) => ({
			x,
			y,
			mass: m
		}));
		const pellets = this.pellets.filter((p) => Math.hypot(p.x - cx, p.y - cy) < VISION).slice(0, 10).map((p) => ({
			x: p.x,
			y: p.y,
			mass: p.mass
		}));
		const viruses = this.viruses.filter((v) => Math.hypot(v.x - cx, v.y - cy) < VISION).slice(0, 8).map((v) => ({
			x: v.x,
			y: v.y,
			r: radiusOf(v.mass) * .92
		}));
		return {
			time: this.time,
			radius: WORLD_R,
			you: {
				id: player.id,
				name: player.name,
				handle: player.handle,
				alive: player.alive,
				mass,
				x: cx,
				y: cy,
				r: myR,
				cells: mine.map((c) => ({
					x: c.x,
					y: c.y,
					r: radiusOf(c.mass),
					mass: c.mass
				}))
			},
			food,
			threats: threats.slice(0, 12),
			prey: prey.slice(0, 12),
			rivals: rivals.slice(0, 12),
			viruses,
			pellets
		};
	}
	leaderboard() {
		return this.players.map((p) => ({
			id: p.id,
			name: p.name,
			handle: p.handle,
			mass: this.massOf(p.id),
			kills: p.kills,
			hue: p.hue
		})).filter((p) => p.mass > 0).sort((a, b) => b.mass - a.mass || b.kills - a.kills);
	}
	step(rawDt) {
		const dt = Math.min(.05, Math.max(0, rawDt));
		if (dt <= 0) return;
		this.time += dt;
		this.events = [];
		for (const player of this.players) {
			if (player.splitCd > 0) player.splitCd -= dt;
			if (player.ejectCd > 0) player.ejectCd -= dt;
			if (player.pilot === "manual" && this.time > player.manualUntil) player.pilot = "brain";
			if (player.alive && player.kind !== "human" && player.pilot === "brain" && player.nextDecision <= this.time) {
				this.decide(player);
				player.nextDecision = this.time + .12;
			}
		}
		const beforeSplit = this.cells.length;
		for (const player of this.players) {
			if (!player.splitQueued || player.splitCd > 0) {
				player.splitQueued = false;
				continue;
			}
			let did = false;
			for (let i = 0; i < beforeSplit; i += 1) {
				const cell = this.cells[i];
				if (!cell || cell.owner !== player.id) continue;
				if (!this.shouldSplitCell(player, cell)) continue;
				this.splitCell(player, cell);
				did = true;
				if (!player.splitAll) break;
			}
			if (did) player.splitCd = .42;
			player.splitQueued = false;
		}
		for (const player of this.players) {
			if ((player.ejectHeld || player.ejectQueued) && player.ejectCd <= 0 && player.alive) {
				this.ejectFrom(player);
				player.ejectCd = .13;
			}
			player.ejectQueued = false;
		}
		for (const cell of this.cells) {
			const player = this.player(cell.owner);
			if (!player) continue;
			if (cell.shield > 0) cell.shield -= dt;
			if (cell.launch > 0) {
				cell.launch -= dt;
				cell.x += cell.vx * dt;
				cell.y += cell.vy * dt;
				const drag = Math.exp(-2.7 * dt);
				cell.vx *= drag;
				cell.vy *= drag;
			} else this.steer(cell, player.targetX, player.targetY, dt);
		}
		this.separateSiblings();
		this.containAll();
		this.jostleRivals();
		this.eatFood();
		this.eatPellets();
		this.eatCells();
		this.hitViruses();
		this.mergeSiblings();
		this.decay(dt);
		this.driftPellets(dt);
		this.respawn();
		this.refillFood();
	}
	player(id) {
		return this.players.find((p) => p.id === id);
	}
	makeCell(player, x, y, mass, vx, vy) {
		return {
			id: this.seq++,
			owner: player.id,
			x,
			y,
			vx,
			vy,
			mass,
			mergeAt: 0,
			launch: 0,
			shield: 0
		};
	}
	spawnPoint() {
		for (let i = 0; i < 10; i += 1) {
			const spot = randomInCircle(WORLD_R * .78);
			const crowded = this.cells.some((c) => Math.hypot(c.x - spot.x, c.y - spot.y) < radiusOf(c.mass) + 80);
			const viral = this.viruses.some((v) => Math.hypot(v.x - spot.x, v.y - spot.y) < radiusOf(v.mass) + 70);
			if (!crowded && !viral) return spot;
		}
		return randomInCircle(WORLD_R * .7);
	}
	spawnFood() {
		const spot = randomInCircle(WORLD_R - 30);
		this.foods.push({
			id: this.seq++,
			x: spot.x,
			y: spot.y,
			mass: FOOD_MASS,
			hue: FOOD_HUES[this.foods.length % FOOD_HUES.length]
		});
	}
	spawnVirus() {
		const spot = randomInCircle(WORLD_R * .82);
		this.viruses.push({
			id: this.seq++,
			x: spot.x,
			y: spot.y,
			mass: 108
		});
	}
	noteAim(player) {
		const mine = this.cells.filter((c) => c.owner === player.id);
		if (!mine.length) return;
		const mass = mine.reduce((s, c) => s + c.mass, 0);
		const cx = mine.reduce((s, c) => s + c.x * c.mass, 0) / mass;
		const cy = mine.reduce((s, c) => s + c.y * c.mass, 0) / mass;
		const dx = player.targetX - cx;
		const dy = player.targetY - cy;
		const d = Math.hypot(dx, dy);
		if (d > 12) {
			player.aimX = dx / d;
			player.aimY = dy / d;
		}
	}
	centroid(player) {
		const mine = this.cells.filter((c) => c.owner === player.id);
		if (!mine.length) return {
			x: player.lastX,
			y: player.lastY,
			mass: 0,
			biggest: null
		};
		const mass = mine.reduce((s, c) => s + c.mass, 0);
		let biggest = mine[0];
		for (const cell of mine) if (cell.mass > biggest.mass) biggest = cell;
		return {
			x: mine.reduce((s, c) => s + c.x * c.mass, 0) / mass,
			y: mine.reduce((s, c) => s + c.y * c.mass, 0) / mass,
			mass,
			biggest
		};
	}
	decide(player) {
		const { x: cx, y: cy, mass, biggest } = this.centroid(player);
		if (!biggest || mass <= 0) return;
		player.lastX = cx;
		player.lastY = cy;
		if (!player.brain?.w1 || !player.trace?.out) {
			player.brain = brainFromWeights(player.weights, saltOf(player.handle || player.name));
			player.trace = zeroTrace();
			player.brainRev = (player.brainRev ?? 0) + 1;
		}
		const w = player.weights;
		let bestFood = 0;
		let fx = 0;
		let fy = 0;
		let foodClose = 0;
		for (const food of this.foods) {
			const dx = food.x - cx;
			const dy = food.y - cy;
			const d2 = dx * dx + dy * dy;
			if (d2 > 121e4 || d2 < 1) continue;
			const score = 1 / d2;
			if (score > bestFood) {
				bestFood = score;
				const d = Math.sqrt(d2);
				fx = dx / d;
				fy = dy / d;
				foodClose = clamp01(1 - d / 720);
			}
		}
		for (const pellet of this.pellets) {
			if (pellet.owner === player.id && pellet.safe > 0) continue;
			const dx = pellet.x - cx;
			const dy = pellet.y - cy;
			const d2 = dx * dx + dy * dy;
			if (d2 > 121e4 || d2 < 1) continue;
			const score = 3.2 / d2;
			if (score > bestFood) {
				bestFood = score;
				const d = Math.sqrt(d2);
				fx = dx / d;
				fy = dy / d;
				foodClose = clamp01(1 - d / 640);
			}
		}
		let nearestThreat = null;
		let nearestPrey = null;
		let huntX = 0;
		let huntY = 0;
		let fleeX = 0;
		let fleeY = 0;
		for (const cell of this.cells) {
			if (cell.owner === player.id) continue;
			const dx = cell.x - cx;
			const dy = cell.y - cy;
			const d = Math.hypot(dx, dy) || 1;
			if (d > 1100) continue;
			const dirx = dx / d;
			const diry = dy / d;
			if (cell.mass > biggest.mass * 1.1) {
				const threat = (1.35 - d / VISION) * Math.min(2.4, cell.mass / biggest.mass);
				fleeX -= dirx * threat;
				fleeY -= diry * threat;
				if (!nearestThreat || d < nearestThreat.d) nearestThreat = {
					x: cell.x,
					y: cell.y,
					d,
					mass: cell.mass,
					r: radiusOf(cell.mass)
				};
			} else if (biggest.mass > cell.mass * 1.12) {
				const interest = (1.15 - d / VISION) * Math.min(2, biggest.mass / cell.mass);
				huntX += dirx * interest;
				huntY += diry * interest;
				if (!nearestPrey || d < nearestPrey.d) nearestPrey = {
					x: cell.x,
					y: cell.y,
					d,
					mass: cell.mass
				};
			}
		}
		let virusX = 0;
		let virusY = 0;
		let virusClose = 0;
		let nearestVirus = null;
		let nearestVirusD = Infinity;
		for (const virus of this.viruses) {
			const dx = virus.x - cx;
			const dy = virus.y - cy;
			const d = Math.hypot(dx, dy) || 1;
			if (d < nearestVirusD) {
				nearestVirusD = d;
				nearestVirus = virus;
			}
			if (d < 560) virusClose = Math.max(virusClose, clamp01(1 - d / 560));
			if (biggest.mass > 150 && d < 560) {
				const push = 1 - d / 560;
				virusX -= dx / d * push * 1.7;
				virusY -= dy / d * push * 1.7;
			}
		}
		const cd = Math.hypot(cx, cy);
		const cellCount = this.cells.reduce((n, c) => n + (c.owner === player.id ? 1 : 0), 0);
		const ready = player.splitCd <= 0 && biggest.mass >= 48 && cellCount < 15 ? 1 : 0;
		const sense = [
			nearestPrey ? clamp01(1 - nearestPrey.d / VISION) : 0,
			nearestThreat ? clamp01(1 - nearestThreat.d / VISION) : 0,
			foodClose,
			virusClose,
			clamp01(Math.log(Math.max(mass, 1) / 34) / Math.log(40)),
			cd > 1 ? clamp01((cd - WORLD_R * .5) / (WORLD_R * .45)) : 0,
			cellCount / 16,
			ready,
			Math.sin(player.wander)
		];
		const fired = forward(player.brain, sense);
		player.trace = {
			sense,
			hidden: fired.hidden,
			out: fired.out
		};
		const foodG = mixGain(w.food, fired.out[OUT.food] ?? 0);
		const huntG = mixGain(w.hunt, fired.out[OUT.hunt] ?? 0);
		const fleeG = mixGain(w.flee, fired.out[OUT.flee] ?? 0);
		const virusG = mixGain(w.virus, fired.out[OUT.virus] ?? 0);
		const centerG = mixGain(w.center, fired.out[OUT.center] ?? 0);
		const wanderG = mixGain(w.wander, fired.out[OUT.wander] ?? 0);
		let ax = 0;
		let ay = 0;
		if (bestFood > 0) {
			ax += fx * foodG;
			ay += fy * foodG;
		}
		ax += huntX * huntG;
		ay += huntY * huntG;
		ax += fleeX * fleeG;
		ay += fleeY * fleeG;
		ax += virusX * virusG;
		ay += virusY * virusG;
		if (biggest.mass <= 150 && nearestThreat && fleeG > .7 && nearestVirus && nearestVirusD < 640) {
			const dx = nearestVirus.x - cx;
			const dy = nearestVirus.y - cy;
			const d = Math.hypot(dx, dy) || 1;
			const hide = .85 * Math.min(1.3, fleeG);
			ax += dx / d * hide;
			ay += dy / d * hide;
		}
		if (cd > 1368) {
			ax -= cx / cd * (.6 + centerG);
			ay -= cy / cd * (.6 + centerG);
		} else if (cd > 1) {
			ax -= cx / WORLD_R * centerG * .45;
			ay -= cy / WORLD_R * centerG * .45;
		}
		player.wander += (Math.random() - .5) * .7;
		ax += Math.cos(player.wander) * wanderG;
		ay += Math.sin(player.wander) * wanderG;
		const mag = Math.hypot(ax, ay);
		if (mag > .001) {
			player.targetX = cx + ax / mag * 480;
			player.targetY = cy + ay / mag * 480;
			player.aimX = ax / mag;
			player.aimY = ay / mag;
		}
		const myR = radiusOf(biggest.mass);
		const splitSignal = fired.out[OUT.split] ?? 0;
		const splitUrge = clamp01(w.split / 2 + splitSignal * .35);
		if (ready) {
			if (nearestPrey && splitUrge > .4 && biggest.mass * .5 > nearestPrey.mass * 1.18 && nearestPrey.d < myR + 260) {
				const pdx = nearestPrey.x - biggest.x;
				const pdy = nearestPrey.y - biggest.y;
				if (pdx * player.aimX + pdy * player.aimY > 0) player.splitQueued = true;
			} else if (nearestThreat && biggest.mass > 80 && nearestThreat.d < myR + nearestThreat.r + 36 && (fleeG > 1.7 || w.split > .8 || splitUrge > .62)) player.splitQueued = true;
		}
		const ejectSignal = fired.out[OUT.eject] ?? 0;
		if (nearestThreat && ejectSignal > .42 && biggest.mass > 110 && nearestThreat.d < 400 && player.ejectCd <= 0 && Math.random() < .16) player.ejectQueued = true;
	}
	shouldSplitCell(player, cell) {
		if (cell.mass < 36) return false;
		if (this.cells.filter((c) => c.owner === player.id).length >= 16) return false;
		if (!player.splitAll) {
			let biggest = cell.mass;
			for (const other of this.cells) if (other.owner === player.id && other.mass > biggest) return false;
		}
		return true;
	}
	splitCell(player, cell) {
		const half = cell.mass / 2;
		cell.mass = half;
		cell.mergeAt = this.time + 10;
		const nx = player.aimX || 1;
		const ny = player.aimY || 0;
		const baby = {
			id: this.seq++,
			owner: player.id,
			x: cell.x + nx * 10,
			y: cell.y + ny * 10,
			vx: nx * 880,
			vy: ny * 880,
			mass: half,
			mergeAt: this.time + 10,
			launch: .42,
			shield: .2
		};
		this.cells.push(baby);
		this.events.push({
			type: "split",
			x: cell.x,
			y: cell.y,
			owner: player.id
		});
	}
	ejectFrom(player) {
		let biggest = null;
		for (const cell of this.cells) {
			if (cell.owner !== player.id) continue;
			if (!biggest || cell.mass > biggest.mass) biggest = cell;
		}
		if (!biggest || biggest.mass < 42) return;
		biggest.mass -= 16;
		const nx = player.aimX || 1;
		const ny = player.aimY || 0;
		this.pellets.push({
			id: this.seq++,
			x: biggest.x + nx * (radiusOf(biggest.mass) + 8),
			y: biggest.y + ny * (radiusOf(biggest.mass) + 8),
			vx: nx * 640,
			vy: ny * 640,
			mass: 12,
			hue: player.hue,
			owner: player.id,
			safe: .45
		});
		if (this.pellets.length > 80) this.pellets.splice(0, this.pellets.length - 80);
	}
	steer(cell, tx, ty, dt) {
		const dx = tx - cell.x;
		const dy = ty - cell.y;
		const dist = Math.hypot(dx, dy) || 1;
		const r = radiusOf(cell.mass);
		const urge = Math.min(1, dist / (r * .9));
		const spd = maxSpeed(cell.mass) * urge;
		const desiredX = dx / dist * spd;
		const desiredY = dy / dist * spd;
		const k = 1 - Math.exp(-9 * dt);
		cell.vx += (desiredX - cell.vx) * k;
		cell.vy += (desiredY - cell.vy) * k;
		cell.x += cell.vx * dt;
		cell.y += cell.vy * dt;
	}
	separateSiblings() {
		const groups = /* @__PURE__ */ new Map();
		for (const cell of this.cells) {
			const list = groups.get(cell.owner);
			if (list) list.push(cell);
			else groups.set(cell.owner, [cell]);
		}
		for (const list of groups.values()) for (let i = 0; i < list.length; i += 1) for (let j = i + 1; j < list.length; j += 1) {
			const a = list[i];
			const b = list[j];
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			let d = Math.hypot(dx, dy);
			const ra = radiusOf(a.mass);
			const rb = radiusOf(b.mass);
			if (d < .001) {
				const ang = (a.id * 13 + b.id) % 32 * .2;
				a.x -= Math.cos(ang);
				a.y -= Math.sin(ang);
				d = 1;
			}
			const min = ra + rb + 1.5;
			if (d < min && (a.mergeAt > this.time || b.mergeAt > this.time)) {
				const push = (min - d) * .5;
				const nx = dx / d;
				const ny = dy / d;
				a.x -= nx * push;
				a.y -= ny * push;
				b.x += nx * push;
				b.y += ny * push;
			}
		}
	}
	containAll() {
		for (const cell of this.cells) this.contain(cell);
		for (const pellet of this.pellets) {
			const d = Math.hypot(pellet.x, pellet.y);
			const limit = WORLD_R - 16;
			if (d > limit) {
				pellet.x = pellet.x / d * limit;
				pellet.y = pellet.y / d * limit;
				pellet.vx *= .2;
				pellet.vy *= .2;
			}
		}
	}
	contain(cell) {
		const d = Math.hypot(cell.x, cell.y);
		const limit = WORLD_R - radiusOf(cell.mass) - 6;
		if (d > limit && d > 0) {
			const nx = cell.x / d;
			const ny = cell.y / d;
			cell.x = nx * limit;
			cell.y = ny * limit;
			const outward = cell.vx * nx + cell.vy * ny;
			if (outward > 0) {
				cell.vx -= outward * nx;
				cell.vy -= outward * ny;
			}
		}
	}
	jostleRivals() {
		for (let n = 0; n < 2; n += 1) for (let i = 0; i < this.cells.length; i += 1) for (let j = i + 1; j < this.cells.length; j += 1) {
			const a = this.cells[i];
			const b = this.cells[j];
			if (a.owner === b.owner) continue;
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const d = Math.hypot(dx, dy);
			if (d <= .001) continue;
			const ra = radiusOf(a.mass);
			const rb = radiusOf(b.mass);
			if (d >= ra + rb) continue;
			if (Math.max(a.mass, b.mass) > Math.min(a.mass, b.mass) * 1.1) continue;
			const push = (ra + rb - d) * .35;
			const nx = dx / d;
			const ny = dy / d;
			a.x -= nx * push;
			a.y -= ny * push;
			b.x += nx * push;
			b.y += ny * push;
		}
	}
	eatFood() {
		if (!this.foods.length || !this.cells.length) return;
		const keep = [];
		for (const food of this.foods) {
			let eaten = false;
			for (const cell of this.cells) {
				const r = radiusOf(cell.mass);
				const dx = food.x - cell.x;
				const dy = food.y - cell.y;
				if (dx * dx + dy * dy <= r * r) {
					cell.mass += food.mass;
					const owner = this.player(cell.owner);
					if (owner) {
						const total = this.massOf(owner.id);
						if (total > owner.peak) owner.peak = total;
					}
					this.events.push({
						type: "crumb",
						x: food.x,
						y: food.y,
						hue: food.hue,
						eater: cell.owner
					});
					eaten = true;
					break;
				}
			}
			if (!eaten) keep.push(food);
		}
		this.foods = keep;
	}
	eatPellets() {
		const keep = [];
		for (const pellet of this.pellets) {
			let eaten = false;
			for (const cell of this.cells) {
				if (cell.owner === pellet.owner && pellet.safe > 0) continue;
				const r = radiusOf(cell.mass);
				const dx = pellet.x - cell.x;
				const dy = pellet.y - cell.y;
				if (dx * dx + dy * dy <= r * r) {
					cell.mass += pellet.mass;
					this.events.push({
						type: "crumb",
						x: pellet.x,
						y: pellet.y,
						hue: pellet.hue,
						eater: cell.owner
					});
					eaten = true;
					break;
				}
			}
			if (!eaten) keep.push(pellet);
		}
		this.pellets = keep;
	}
	eatCells() {
		const dead = /* @__PURE__ */ new Set();
		const wipes = [];
		const ordered = this.cells.slice().sort((a, b) => b.mass - a.mass);
		for (const a of ordered) {
			if (dead.has(a.id)) continue;
			const ra = radiusOf(a.mass);
			for (const b of ordered) {
				if (a.id === b.id || a.owner === b.owner || dead.has(b.id)) continue;
				const rb = radiusOf(b.mass);
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const d = Math.hypot(dx, dy);
				if (!canEngulf(a.mass, ra, b.mass, rb, d)) continue;
				dead.add(b.id);
				a.mass += b.mass;
				const eater = this.player(a.owner);
				const victim = this.player(b.owner);
				this.events.push({
					type: "bite",
					x: b.x,
					y: b.y,
					hue: victim?.hue ?? 70,
					eater: a.owner,
					mass: b.mass,
					victimName: victim?.name ?? "someone",
					eaterName: eater?.name ?? "someone"
				});
				if (victim && eater && !this.cells.some((c) => c.owner === victim.id && c.id !== b.id && !dead.has(c.id))) wipes.push({
					owner: victim.id,
					by: eater.id
				});
			}
		}
		if (dead.size) this.cells = this.cells.filter((c) => !dead.has(c.id));
		for (const wipe of wipes) this.wipe(wipe.owner, wipe.by);
	}
	wipe(ownerId, byId) {
		const owner = this.player(ownerId);
		if (!owner || !owner.alive) return;
		if (this.cells.some((c) => c.owner === ownerId)) return;
		const by = byId != null ? this.player(byId) : void 0;
		if (by && by.id !== owner.id) by.kills += 1;
		owner.alive = false;
		owner.respawnAt = this.time + 2.1;
		owner.ejectHeld = false;
		this.events.push({
			type: "wipe",
			owner: owner.id,
			by: by?.id ?? null,
			ownerName: owner.name,
			byName: by?.name ?? "the dish"
		});
		this.pushFeed(by && by.id !== owner.id ? `${by.name} engulfed ${owner.name}` : `${owner.name} dissolved`);
	}
	hitViruses() {
		const spawned = [];
		const dead = /* @__PURE__ */ new Set();
		for (const cell of this.cells) {
			if (cell.mass < 170 || cell.shield > 0) continue;
			const r = radiusOf(cell.mass);
			for (const virus of this.viruses) {
				const vr = radiusOf(virus.mass) * .92;
				if (Math.hypot(virus.x - cell.x, virus.y - cell.y) > r * .82 + vr * .25) continue;
				const owner = this.player(cell.owner);
				const existing = this.cells.reduce((n, c) => n + (c.owner === cell.owner && c.id !== cell.id ? 1 : 0), 0);
				const room = Math.max(0, 16 - existing);
				if (room < 2) continue;
				const pieces = Math.min(room, 10, Math.max(2, Math.floor(cell.mass / 40)));
				dead.add(cell.id);
				const share = cell.mass / pieces;
				for (let i = 0; i < pieces; i += 1) {
					const ang = i / pieces * Math.PI * 2;
					spawned.push({
						id: this.seq++,
						owner: cell.owner,
						x: cell.x + Math.cos(ang) * 12,
						y: cell.y + Math.sin(ang) * 12,
						vx: Math.cos(ang) * 520,
						vy: Math.sin(ang) * 520,
						mass: share,
						mergeAt: this.time + 12,
						launch: .55,
						shield: 1.15
					});
				}
				this.events.push({
					type: "pop",
					x: cell.x,
					y: cell.y,
					owner: cell.owner
				});
				if (owner) this.pushFeed(`${owner.name} burst on a virus`);
				break;
			}
		}
		if (dead.size) this.cells = this.cells.filter((c) => !dead.has(c.id));
		if (spawned.length) this.cells.push(...spawned);
	}
	mergeSiblings() {
		const dead = /* @__PURE__ */ new Set();
		for (let i = 0; i < this.cells.length; i += 1) {
			const a = this.cells[i];
			if (dead.has(a.id) || a.mergeAt > this.time) continue;
			for (let j = i + 1; j < this.cells.length; j += 1) {
				const b = this.cells[j];
				if (dead.has(b.id) || a.owner !== b.owner || b.mergeAt > this.time) continue;
				const ra = radiusOf(a.mass);
				const rb = radiusOf(b.mass);
				if (Math.hypot(b.x - a.x, b.y - a.y) > (ra + rb) * .62) continue;
				const keep = a.mass >= b.mass ? a : b;
				const drop = keep === a ? b : a;
				const sum = keep.mass + drop.mass;
				keep.x = (keep.x * keep.mass + drop.x * drop.mass) / sum;
				keep.y = (keep.y * keep.mass + drop.y * drop.mass) / sum;
				keep.vx = (keep.vx * keep.mass + drop.vx * drop.mass) / sum;
				keep.vy = (keep.vy * keep.mass + drop.vy * drop.mass) / sum;
				keep.mass = sum;
				dead.add(drop.id);
			}
		}
		if (dead.size) this.cells = this.cells.filter((c) => !dead.has(c.id));
	}
	decay(dt) {
		for (const player of this.players) {
			const total = this.massOf(player.id);
			if (total > player.peak) player.peak = total;
			if (total < 520) continue;
			let biggest = null;
			for (const cell of this.cells) {
				if (cell.owner !== player.id) continue;
				if (!biggest || cell.mass > biggest.mass) biggest = cell;
			}
			if (!biggest) continue;
			biggest.mass = Math.max(24, biggest.mass - total * .0035 * dt);
		}
	}
	driftPellets(dt) {
		for (const pellet of this.pellets) {
			if (pellet.safe > 0) pellet.safe -= dt;
			pellet.x += pellet.vx * dt;
			pellet.y += pellet.vy * dt;
			const drag = Math.exp(-1.7 * dt);
			pellet.vx *= drag;
			pellet.vy *= drag;
		}
	}
	respawn() {
		for (const player of this.players) {
			if (player.alive || player.respawnAt > this.time) continue;
			const spot = this.spawnPoint();
			player.alive = true;
			player.respawnAt = 0;
			player.lastX = spot.x;
			player.lastY = spot.y;
			player.targetX = spot.x + player.aimX * 200;
			player.targetY = spot.y + player.aimY * 200;
			this.cells.push(this.makeCell(player, spot.x, spot.y, 34, 0, 0));
		}
	}
	refillFood() {
		let guard = 0;
		while (this.foods.length < 540 && guard < 12) {
			this.spawnFood();
			guard += 1;
		}
	}
	massOf(id) {
		let mass = 0;
		for (const cell of this.cells) if (cell.owner === id) mass += cell.mass;
		return mass;
	}
	pushFeed(text) {
		this.feed.unshift({
			id: this.feedSeq++,
			text
		});
		if (this.feed.length > 5) this.feed.pop();
	}
};
function canEngulf(aMass, aR, bMass, _bR, dist) {
	if (!(aMass > bMass * 1.12)) return false;
	return dist < aR * .94;
}
function randomInCircle(radius) {
	const t = Math.random() * Math.PI * 2;
	const u = Math.sqrt(Math.random()) * radius;
	return {
		x: Math.cos(t) * u,
		y: Math.sin(t) * u
	};
}
var PROFILE = "dish-profile-v1";
var NOTABLES = "dish-notables-v1";
var SAVED = "dish-saved-v1";
function read(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function write(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}
function loadProfile() {
	const row = read(PROFILE, {
		name: "",
		handle: ""
	});
	return {
		name: typeof row.name === "string" ? row.name.slice(0, 16) : "",
		handle: sanitizeHandle(row.handle)
	};
}
function saveProfile(name, handle) {
	write(PROFILE, {
		name: name.slice(0, 16),
		handle: sanitizeHandle(handle)
	});
}
function loadSaved() {
	const rows = read(SAVED, []);
	if (!Array.isArray(rows)) return [];
	const out = [];
	for (const row of rows) {
		if (!row || typeof row !== "object") continue;
		const rec = row;
		const source = rec.source === "grok" || rec.source === "import" || rec.source === "preset" ? rec.source : "preset";
		const brain = parseBrain(rec.brain);
		out.push({
			name: sanitizeName(rec.name),
			handle: sanitizeHandle(rec.handle),
			motto: sanitizeMotto(rec.motto),
			weights: clampWeights(rec.weights),
			...brain ? { brain } : {},
			source
		});
	}
	return out.slice(0, 12);
}
function saveSaved(rows) {
	write(SAVED, rows.slice(0, 12));
}
function loadNotables() {
	const rows = read(NOTABLES, []);
	if (!Array.isArray(rows)) return [];
	return rows.filter((row) => {
		if (!row || typeof row !== "object") return false;
		const rec = row;
		return typeof rec.mass === "number" && typeof rec.name === "string";
	}).slice(0, 6);
}
function pushNotable(row) {
	const next = [row, ...loadNotables().filter((n) => !(n.name === row.name && n.handle === row.handle && n.mass === row.mass))];
	next.sort((a, b) => b.mass - a.mass || b.kills - a.kills);
	const trimmed = next.slice(0, 6);
	write(NOTABLES, trimmed);
	return trimmed;
}
var STEP = 1 / 60;
function Arena() {
	const canvasRef = (0, import_react.useRef)(null);
	const simRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const camRef = (0, import_react.useRef)({
		x: 0,
		y: 0,
		zoom: .42
	});
	const fxRef = (0, import_react.useRef)(makeFx());
	const humanRef = (0, import_react.useRef)(null);
	const pinRef = (0, import_react.useRef)(null);
	const keysRef = (0, import_react.useRef)({
		eject: false,
		split: false
	});
	const pointerRef = (0, import_react.useRef)({
		x: 0,
		y: 0,
		seen: false
	});
	const joyRef = (0, import_react.useRef)({
		x: 0,
		y: 0,
		active: false
	});
	const touchEject = (0, import_react.useRef)(false);
	const mutedRef = (0, import_react.useRef)(false);
	const obitRef = (0, import_react.useRef)("");
	const savedRef = (0, import_react.useRef)([]);
	const [hud, setHud] = (0, import_react.useState)(null);
	const [panel, setPanel] = (0, import_react.useState)(false);
	const [neural, setNeural] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [obit, setObit] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [handle, setHandle] = (0, import_react.useState)("");
	const [notice, setNotice] = (0, import_react.useState)("");
	const [notables, setNotables] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let dead = false;
		const sim = new DishSim();
		const audio = new DishAudio();
		simRef.current = sim;
		audioRef.current = audio;
		savedRef.current = loadSaved();
		for (const agent of savedRef.current) sim.join({
			...agent,
			kind: "agent"
		});
		const profile = loadProfile();
		setName(profile.name);
		setHandle(profile.handle);
		setNotables(loadNotables());
		const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const unlock = () => audio.unlock();
		window.addEventListener("pointerdown", unlock);
		window.addEventListener("keydown", unlock);
		const onKeyDown = (e) => {
			if (isTyping(e.target)) return;
			if (e.code === "Space") {
				e.preventDefault();
				keysRef.current.split = true;
			} else if (e.code === "KeyW") {
				e.preventDefault();
				keysRef.current.eject = true;
			}
		};
		const onKeyUp = (e) => {
			if (e.code === "KeyW") keysRef.current.eject = false;
		};
		const onMove = (e) => {
			pointerRef.current.x = e.clientX;
			pointerRef.current.y = e.clientY;
			pointerRef.current.seen = true;
		};
		const onVis = () => {
			if (document.visibilityState === "visible") audio.resume();
		};
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("pointermove", onMove);
		document.addEventListener("visibilitychange", onVis);
		window.__dish = {
			world: {
				radius: WORLD_R,
				origin: "center",
				y: "down"
			},
			join: (input) => sim.join({
				kind: "agent",
				source: "protocol",
				...input
			}),
			leave: (id) => sim.leave(id),
			observe: (id) => sim.observe(id),
			act: (id, action) => sim.act(id, action),
			leaderboard: () => sim.leaderboard()
		};
		let last = performance.now();
		let acc = 0;
		let hudAt = 0;
		let raf = 0;
		const frame = (now) => {
			if (dead) return;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			acc += dt;
			const canvas = canvasRef.current;
			const humanId = humanRef.current;
			const reduced = reducedQuery.matches;
			if (humanId != null) {
				if (sim.players.find((p) => p.id === humanId)?.alive) {
					if (joyRef.current.active) {
						const focus = bodyFocus(sim, humanId);
						if (focus) sim.setAim(humanId, focus.x + joyRef.current.x * 620, focus.y + joyRef.current.y * 620);
					} else if (pointerRef.current.seen && canvas) {
						const world = clientToWorld(pointerRef.current.x, pointerRef.current.y, canvas, camRef.current);
						sim.setAim(humanId, world.x, world.y);
					}
					sim.setEjectHeld(humanId, keysRef.current.eject || touchEject.current);
					if (keysRef.current.split) {
						sim.queueSplit(humanId, true);
						keysRef.current.split = false;
					}
				}
			}
			let follow = humanId != null && sim.players.some((p) => p.id === humanId && p.alive) ? humanId : pinRef.current;
			if (follow == null || !sim.players.some((p) => p.id === follow && p.alive)) follow = sim.leaderboard()[0]?.id ?? null;
			let steps = 0;
			while (acc >= STEP && steps < 5) {
				sim.step(STEP);
				for (const event of sim.events) if (event.type === "crumb" && (event.eater === humanId || event.eater === follow)) {
					if (event.eater === humanId) audio.crumb();
					burst(fxRef.current, event.x, event.y, event.hue, 2, 50);
				} else if (event.type === "bite") {
					burst(fxRef.current, event.x, event.y, event.hue, 12, 150);
					floatText(fxRef.current, event.x, event.y - 10, `+${Math.floor(event.mass)}`);
					if (event.eater === humanId) {
						audio.bite();
						fxRef.current.trauma = Math.min(1, fxRef.current.trauma + .32);
					}
				} else if (event.type === "split" && event.owner === humanId) audio.split();
				else if (event.type === "pop") {
					burst(fxRef.current, event.x, event.y, 140, 18, 220);
					audio.pop();
					if (event.owner === humanId) fxRef.current.trauma = Math.min(1, fxRef.current.trauma + .55);
				} else if (event.type === "wipe") {
					audio.wipe();
					const owner = sim.players.find((p) => p.id === event.owner);
					if (owner && owner.peak >= 90) setNotables(pushNotable({
						name: owner.name,
						handle: owner.handle,
						mass: Math.floor(owner.peak),
						kills: owner.kills
					}));
					if (event.owner === humanId) {
						const line = event.by ? `${event.byName} engulfed you` : "You dissolved";
						obitRef.current = line;
						setObit(line);
						fxRef.current.trauma = Math.min(1, fxRef.current.trauma + .7);
					}
				}
				acc -= STEP;
				steps += 1;
			}
			if ((humanId != null ? sim.players.find((p) => p.id === humanId) : void 0)?.alive && obitRef.current) {
				obitRef.current = "";
				setObit("");
			}
			if (canvas) {
				const rect = canvas.getBoundingClientRect();
				const dpr = Math.min(2, window.devicePixelRatio || 1);
				const bw = Math.max(1, Math.floor(rect.width * dpr));
				const bh = Math.max(1, Math.floor(rect.height * dpr));
				if (canvas.width !== bw || canvas.height !== bh) {
					canvas.width = bw;
					canvas.height = bh;
				}
				const cam = camRef.current;
				const focus = follow != null ? bodyFocus(sim, follow) : null;
				if (focus) {
					const k = Math.hypot(focus.x - cam.x, focus.y - cam.y) > 900 ? 1 : 1 - Math.exp(-3.4 * dt);
					cam.x += (focus.x - cam.x) * k;
					cam.y += (focus.y - cam.y) * k;
					const minSide = Math.min(rect.width, rect.height);
					const playingNow = humanId != null && sim.players.some((p) => p.id === humanId && p.alive);
					const pad = playingNow ? 820 : 1500;
					const want = minSide / (focus.span * 1.15 + pad);
					cam.zoom += (Math.min(playingNow ? 1.2 : .7, Math.max(.32, want)) - cam.zoom) * (1 - Math.exp(-4 * dt));
				}
				tickFx(fxRef.current, dt, reduced);
				const ctx = canvas.getContext("2d");
				if (ctx) drawDish(ctx, sim, cam, rect.width, rect.height, dpr, fxRef.current, follow, humanId, rect.width >= 900, reduced);
			}
			if (now - hudAt > 120) {
				hudAt = now;
				setHud(readHud(sim, humanId, follow));
			}
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => {
			dead = true;
			cancelAnimationFrame(raf);
			window.removeEventListener("pointerdown", unlock);
			window.removeEventListener("keydown", unlock);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("pointermove", onMove);
			document.removeEventListener("visibilitychange", onVis);
			if (window.__dish) delete window.__dish;
		};
	}, []);
	function remember(agent) {
		const next = [agent, ...savedRef.current.filter((row) => !(row.handle === agent.handle && row.name === agent.name))].slice(0, 12);
		savedRef.current = next;
		saveSaved(next);
	}
	function forget(playerName, playerHandle) {
		const next = savedRef.current.filter((row) => !(row.name === playerName && row.handle === playerHandle));
		savedRef.current = next;
		saveSaved(next);
	}
	function dropIn() {
		const sim = simRef.current;
		audioRef.current?.unlock();
		if (!sim) return;
		if (humanRef.current != null) sim.leave(humanRef.current);
		const res = sim.join({
			name: name.trim() || "You",
			handle,
			kind: "human",
			source: "human",
			hue: 78
		});
		if (!res.ok) {
			setNotice(res.error);
			return;
		}
		humanRef.current = res.id;
		pinRef.current = null;
		saveProfile(name, handle);
		setNotice("");
		setHud(readHud(sim, res.id, res.id));
	}
	function leaveDish() {
		const sim = simRef.current;
		if (!sim || humanRef.current == null) return;
		sim.leave(humanRef.current);
		humanRef.current = null;
		setHud(readHud(sim, null, pinRef.current));
	}
	function seat(input, saved) {
		const sim = simRef.current;
		if (!sim) return;
		const res = sim.join(input);
		if (!res.ok) {
			setNotice(res.error);
			return;
		}
		if (saved) remember(saved);
		setNotice("");
		setPanel(true);
	}
	function removePlayer(id) {
		const sim = simRef.current;
		if (!sim) return;
		const player = sim.players.find((p) => p.id === id);
		if (!player) return;
		if (player.kind === "human") {
			leaveDish();
			return;
		}
		sim.leave(id);
		if (pinRef.current === id) pinRef.current = null;
		forget(player.name, player.handle);
		setHud(readHud(sim, humanRef.current, pinRef.current));
	}
	const playing = hud?.playing ?? false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-ink text-foam",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "dish absolute inset-0 h-full w-full",
				"aria-label": "Petri dish arena"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "pointer-events-none absolute top-3 left-3 z-10 max-w-44 sm:max-w-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-2 rounded-full bg-acid",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-extrabold tracking-tight",
							children: "Dish"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 hidden font-mono text-xs text-sage sm:block",
						children: "Petri dish for agents"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-32 truncate text-sm text-foam sm:max-w-none",
						children: playing ? "You are in the dish" : hud?.followName ? `Watching ${hud.followName}` : "The dish is waking"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-3 right-3 z-10 flex gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 items-center justify-center rounded-full border border-sage/30 bg-membrane/90 text-foam",
						"aria-label": muted ? "Unmute" : "Mute",
						onClick: () => {
							mutedRef.current = !mutedRef.current;
							if (audioRef.current) audioRef.current.muted = mutedRef.current;
							setMuted(mutedRef.current);
						},
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "flex size-11 items-center justify-center rounded-full border border-sage/30 bg-membrane/90 text-foam",
						"aria-label": "Neural controls",
						"aria-pressed": neural,
						onClick: () => {
							setNeural((open) => !open);
							setPanel(false);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrainCircuit, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex min-h-11 items-center gap-2 rounded-full border border-sage/30 bg-membrane/90 px-4 text-sm font-semibold",
						onClick: () => {
							setPanel((open) => !open);
							setNeural(false);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-4" }), "Agents"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "pointer-events-auto absolute top-24 right-3 z-10 w-36 rounded-2xl border border-sage/25 bg-membrane/90 p-2 backdrop-blur-md sm:top-16 sm:w-56 sm:p-3",
				children: [(hud?.board ?? []).slice(0, 7).map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-ink/40",
					onClick: () => {
						if (humanRef.current == null) pinRef.current = row.id;
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-4 font-mono text-xs text-sage tabular-nums",
							children: index + 1
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-2 shrink-0 rounded-full",
							style: { background: `hsl(${row.hue} 75% 55%)` }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 truncate text-sm",
							children: row.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-acid tabular-nums",
							children: formatMass(row.mass)
						})
					]
				}) }, row.id)), hud && hud.board.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-1 py-2 text-sm text-sage",
					children: "The dish is quiet."
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "pointer-events-none absolute top-20 left-3 z-10 hidden max-w-xs flex-col gap-1 sm:flex",
				"aria-live": "polite",
				children: (hud?.feed ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "font-mono text-xs text-sage",
					children: row.text
				}, row.id))
			}),
			obit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute top-1/3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-membrane/90 px-4 py-2 text-center text-sm font-semibold",
				children: obit
			}) : null,
			playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 bottom-28 left-3 z-10 flex items-end justify-between md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stick, { onChange: (x, y, active) => {
					joyRef.current = {
						x,
						y,
						active
					};
				} }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "size-14 rounded-full border border-sage/40 bg-membrane/90 text-xs font-semibold",
						onPointerDown: (e) => {
							e.preventDefault();
							touchEject.current = true;
						},
						onPointerUp: () => {
							touchEject.current = false;
						},
						onPointerLeave: () => {
							touchEject.current = false;
						},
						children: "Eject"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "size-14 rounded-full bg-acid text-xs font-semibold text-ink",
						onPointerDown: (e) => {
							e.preventDefault();
							keysRef.current.split = true;
						},
						children: "Split"
					})]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute bottom-3 left-3 right-3 z-10 flex justify-center sm:left-1/2 sm:right-auto sm:-translate-x-1/2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-sage/25 bg-membrane/90 p-2 backdrop-blur-md",
					children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "px-2 font-mono text-sm text-acid tabular-nums",
							children: [
								formatMass(hud?.youMass ?? 0),
								" mass",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sage",
									children: [
										" · ",
										hud?.youCells ?? 1,
										" cells"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden font-mono text-xs text-sage md:block",
							children: "Space split · W eject"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full border border-sage/40 px-4 text-sm",
							onClick: leaveDish,
							children: "Leave"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"aria-label": "Your name",
							value: name,
							onChange: (e) => setName(e.target.value.slice(0, 16)),
							placeholder: "Your name",
							suppressHydrationWarning: true,
							className: "min-h-11 w-28 rounded-full border border-sage/30 bg-ink px-4 text-sm text-foam placeholder:text-sage sm:w-36"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"aria-label": "X handle",
							value: handle,
							onChange: (e) => setHandle(sanitizeHandle(e.target.value)),
							placeholder: "handle",
							suppressHydrationWarning: true,
							className: "min-h-11 w-24 rounded-full border border-sage/30 bg-ink px-4 font-mono text-sm text-foam placeholder:text-sage sm:w-32"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 rounded-full bg-acid px-4 text-sm font-semibold text-ink",
							onClick: dropIn,
							children: "Drop in"
						})
					] })
				})
			}),
			notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "absolute bottom-20 left-1/2 z-10 -translate-x-1/2 text-center text-sm text-foam",
				children: notice
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeuralBench, {
				open: neural,
				players: hud?.players ?? [],
				onClose: () => setNeural(false),
				onFocus: (id) => {
					if (humanRef.current == null) pinRef.current = id;
				},
				onWeight: (id, key, value) => simRef.current?.setWeight(id, key, value),
				onBrain: (id, brain) => {
					simRef.current?.setBrain(id, brain);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentPanel, {
				open: panel,
				notables,
				players: hud?.players ?? [],
				onClose: () => setPanel(false),
				onSeat: seat,
				onRemove: removePlayer,
				onRestock: () => {
					simRef.current?.restock();
					setNotice("");
				},
				onNotice: setNotice
			})
		]
	});
}
function bodyFocus(sim, id) {
	let mass = 0;
	let sx = 0;
	let sy = 0;
	let minX = Infinity;
	let maxX = -Infinity;
	let minY = Infinity;
	let maxY = -Infinity;
	let count = 0;
	for (const cell of sim.cells) {
		if (cell.owner !== id) continue;
		const r = radiusOf(cell.mass);
		mass += cell.mass;
		sx += cell.x * cell.mass;
		sy += cell.y * cell.mass;
		minX = Math.min(minX, cell.x - r);
		maxX = Math.max(maxX, cell.x + r);
		minY = Math.min(minY, cell.y - r);
		maxY = Math.max(maxY, cell.y + r);
		count += 1;
	}
	if (!count || mass <= 0) return null;
	return {
		x: sx / mass,
		y: sy / mass,
		span: Math.max(maxX - minX, maxY - minY)
	};
}
function clientToWorld(clientX, clientY, canvas, cam) {
	const rect = canvas.getBoundingClientRect();
	const sx = clientX - rect.left - rect.width / 2;
	const sy = clientY - rect.top - rect.height / 2;
	return {
		x: cam.x + sx / cam.zoom,
		y: cam.y + sy / cam.zoom
	};
}
function massOf(sim, id) {
	let mass = 0;
	for (const cell of sim.cells) if (cell.owner === id) mass += cell.mass;
	return mass;
}
function readHud(sim, humanId, follow) {
	const human = humanId != null ? sim.players.find((p) => p.id === humanId) : void 0;
	const playing = Boolean(human);
	const followPlayer = sim.players.find((p) => p.id === follow);
	return {
		board: sim.leaderboard(),
		feed: sim.feed.slice(0, 4),
		followName: human?.alive ? human.name : followPlayer?.name ?? "",
		youMass: humanId != null ? massOf(sim, humanId) : 0,
		youCells: humanId != null ? sim.cells.filter((c) => c.owner === humanId).length : 0,
		playing,
		players: sim.players.map((p) => ({
			id: p.id,
			name: p.name,
			handle: p.handle,
			motto: p.motto,
			mass: massOf(sim, p.id),
			kills: p.kills,
			peak: p.peak,
			hue: p.hue,
			alive: p.alive,
			source: p.source,
			trait: p.preset ? PRESETS[p.preset].label : traitLabel(p.weights),
			kind: p.kind,
			weights: p.weights,
			brain: p.brain?.w1 ? p.brain : brainFromWeights(p.weights, saltOf(p.handle || p.name)),
			trace: p.trace?.out ? p.trace : zeroTrace(),
			brainRev: p.brainRev ?? 1
		}))
	};
}
function isTyping(target) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || target.isContentEditable;
}
function Stick({ onChange }) {
	const ref = (0, import_react.useRef)(null);
	const [knob, setKnob] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	function update(clientX, clientY) {
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const dx = clientX - (rect.left + rect.width / 2);
		const dy = clientY - (rect.top + rect.height / 2);
		const max = rect.width / 2;
		const dist = Math.hypot(dx, dy) || 1;
		const scale = Math.min(1, dist / max);
		const x = dx / dist * scale;
		const y = dy / dist * scale;
		setKnob({
			x: x * max * .62,
			y: y * max * .62
		});
		onChange(x, y, true);
	}
	function end() {
		setKnob({
			x: 0,
			y: 0
		});
		onChange(0, 0, false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "relative size-28 touch-none rounded-full border border-sage/40 bg-membrane/80",
		"aria-label": "Move",
		role: "slider",
		"aria-valuemin": -1,
		"aria-valuemax": 1,
		"aria-valuenow": 0,
		onPointerDown: (e) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			update(e.clientX, e.clientY);
		},
		onPointerMove: (e) => {
			if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e.clientX, e.clientY);
		},
		onPointerUp: end,
		onPointerCancel: end,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute top-1/2 left-1/2 size-10 rounded-full bg-acid",
			style: { transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }
		})
	});
}
function AgentPanel({ open, players, notables, onClose, onSeat, onRemove, onRestock, onNotice }) {
	const [agentName, setAgentName] = (0, import_react.useState)("");
	const [agentHandle, setAgentHandle] = (0, import_react.useState)("");
	const [preset, setPreset] = (0, import_react.useState)("hunt");
	const [vibe, setVibe] = (0, import_react.useState)("");
	const [drafting, setDrafting] = (0, import_react.useState)(false);
	const [draftError, setDraftError] = (0, import_react.useState)("");
	const [importText, setImportText] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)("");
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "fixed inset-0 z-20 flex flex-col overflow-y-auto bg-ink p-4 sm:absolute sm:inset-auto sm:top-16 sm:right-3 sm:bottom-24 sm:w-96 sm:rounded-2xl sm:border sm:border-sage/25 sm:bg-membrane/95 sm:p-4 sm:backdrop-blur-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-bold tracking-tight text-balance",
					children: "Seat an agent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-pretty text-sage",
					children: "Grok can draft one. An @handle is claimed, not verified. Paste a brain, or tune synapses from the neural button."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "flex size-11 items-center justify-center rounded-full border border-sage/30",
					"aria-label": "Close agents",
					onClick: onClose,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"aria-label": "Agent name",
							value: agentName,
							placeholder: "Name",
							onChange: (e) => setAgentName(e.target.value.slice(0, 16)),
							className: "min-h-11 min-w-0 flex-1 rounded-full border border-sage/30 bg-ink px-4 text-sm"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"aria-label": "Agent handle",
							value: agentHandle,
							placeholder: "handle",
							onChange: (e) => setAgentHandle(sanitizeHandle(e.target.value)),
							className: "min-h-11 w-28 rounded-full border border-sage/30 bg-ink px-3 font-mono text-sm"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 text-sm text-sage",
						children: ["Brain", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							"aria-label": "Brain",
							value: preset,
							onChange: (e) => setPreset(e.target.value),
							className: "min-h-11 flex-1 rounded-full border border-sage/30 bg-ink px-3 text-foam",
							children: Object.keys(PRESETS).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: id,
								children: [
									PRESETS[id].label,
									" — ",
									PRESETS[id].blurb
								]
							}, id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex min-h-11 items-center justify-center gap-2 rounded-full bg-acid font-semibold text-ink",
						onClick: () => {
							const weights = PRESETS[preset].weights;
							const seatedName = sanitizeName(agentName || PRESETS[preset].label);
							const seatedHandle = sanitizeHandle(agentHandle);
							onSeat({
								name: seatedName,
								handle: seatedHandle,
								preset,
								weights,
								kind: "agent",
								source: "preset"
							}, {
								name: seatedName,
								handle: seatedHandle,
								motto: "",
								weights,
								source: "preset"
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Seat this brain"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-5 flex flex-col gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					if (drafting) return;
					setDrafting(true);
					setDraftError("");
					draftAgent({ data: { vibe } }).then((result) => {
						if (!result.ok) {
							setDraftError(result.error);
							return;
						}
						onSeat({
							...result.agent,
							kind: "agent",
							source: "grok"
						}, {
							...result.agent,
							source: "grok"
						});
						setVibe("");
					}).catch(() => setDraftError("Couldn't draft a player. Try again.")).finally(() => setDrafting(false));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: "Ask Grok"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Vibe for Grok",
						value: vibe,
						placeholder: "A polite librarian who only eats crumbs",
						onChange: (e) => setVibe(e.target.value.slice(0, 240)),
						className: "min-h-11 rounded-full border border-sage/30 bg-ink px-4 text-sm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: drafting,
						className: "min-h-11 rounded-full border border-acid px-4 font-semibold text-acid disabled:opacity-50",
						children: drafting ? "Drafting…" : "Draft a player"
					}),
					draftError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-foam",
						children: draftError
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-sm font-semibold",
						children: "Import a policy"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						"aria-label": "Agent JSON",
						value: importText,
						onChange: (e) => setImportText(e.target.value.slice(0, 12e3)),
						placeholder: "{\"name\":\"Marrow\",\"handle\":\"marrow\",\"weights\":{\"food\":0.4,\"hunt\":1.4,\"flee\":0.8,\"virus\":1,\"center\":0.2,\"split\":0.9,\"eject\":0,\"wander\":0.2}}",
						className: "mt-2 min-h-28 w-full rounded-2xl border border-sage/30 bg-ink p-3 font-mono text-xs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-2 min-h-11 rounded-full border border-sage/40 px-4 text-sm",
						onClick: () => {
							try {
								const parsed = JSON.parse(importText);
								const brain = parseBrain(parsed.brain);
								const seated = {
									name: sanitizeName(parsed.name),
									handle: sanitizeHandle(parsed.handle),
									motto: sanitizeMotto(parsed.motto),
									weights: clampWeights(parsed.weights),
									source: "import",
									...brain ? { brain } : {}
								};
								onSeat({
									...seated,
									kind: "agent"
								}, seated);
								onNotice("");
							} catch {
								onNotice("That policy wasn't JSON.");
							}
						},
						children: "Seat imported policy"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: "In the dish"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "font-mono text-xs text-sage",
						onClick: onRestock,
						children: "Restock lab"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-2",
					children: players.map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-2 rounded-2xl bg-ink/50 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 size-2 shrink-0 rounded-full",
								style: { background: `hsl(${player.hue} 75% 55%)` }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "truncate text-sm font-semibold",
										children: [
											player.name,
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono text-xs font-normal text-sage",
												children: player.handle ? `@${player.handle}` : ""
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-mono text-xs text-sage",
										children: [
											sourceLabel(player.source),
											" · ",
											player.trait,
											player.alive ? ` · ${formatMass(player.mass)}` : " · respawning",
											player.kills ? ` · ${player.kills} eats` : ""
										]
									}),
									player.motto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-pretty text-sage",
										children: player.motto
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "font-mono text-xs text-sage",
								"aria-label": `Copy ${player.name}`,
								onClick: () => {
									const payload = JSON.stringify({
										name: player.name,
										handle: player.handle,
										motto: player.motto,
										weights: player.weights,
										brain: player.brain
									}, null, 2);
									navigator.clipboard?.writeText(payload).then(() => {
										setCopied(String(player.id));
										window.setTimeout(() => setCopied(""), 1200);
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: copied === String(player.id) ? "Copied" : "Copy"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "font-mono text-xs text-sage",
								"aria-label": `Remove ${player.name}`,
								onClick: () => onRemove(player.id),
								children: "Remove"
							})
						]
					}, player.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-sm font-semibold",
						children: "Seat from code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-pretty text-sage",
						children: "Any Grok bot, browser agent, or script in this page can play. World origin is the center of the dish. +x is right, +y is down."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-2 max-w-full overflow-x-auto rounded-2xl bg-ink p-3 font-mono text-xs text-foam",
						children: PROTOCOL_SNIPPET
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-2 min-h-11 rounded-full border border-sage/40 px-4 text-sm",
						onClick: () => {
							navigator.clipboard?.writeText(PROTOCOL_SNIPPET).then(() => setCopied("proto"));
						},
						children: copied === "proto" ? "Copied" : "Copy protocol"
					})
				]
			}),
			notables.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold",
					children: "Notables on this browser"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 flex flex-col gap-1",
					children: notables.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between font-mono text-xs text-sage",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [row.name, row.handle ? ` @${row.handle}` : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-acid tabular-nums",
							children: formatMass(row.mass)
						})]
					}, `${row.name}-${row.handle}-${row.mass}`))
				})]
			}) : null
		]
	});
}
var SplitComponent = Arena;
//#endregion
export { SplitComponent as component };
