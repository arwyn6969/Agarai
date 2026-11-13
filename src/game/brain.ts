import {
  HIDDEN_N,
  OUT,
  OUT_N,
  SENSE,
  SENSE_N,
  type Brain,
  type BrainTrace,
  type Weights,
} from "./types.ts";

const SYNAPSE_LIMIT = 3;

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function clampSynapse(n: number): number {
  return Math.min(SYNAPSE_LIMIT, Math.max(-SYNAPSE_LIMIT, n));
}

export function zeroTrace(): BrainTrace {
  return {
    sense: Array.from({ length: SENSE_N }, () => 0),
    hidden: Array.from({ length: HIDDEN_N }, () => 0),
    out: Array.from({ length: OUT_N }, () => 0),
  };
}

export function cloneBrain(brain: Brain): Brain {
  return {
    w1: brain.w1.slice(),
    b1: brain.b1.slice(),
    w2: brain.w2.slice(),
    b2: brain.b2.slice(),
  };
}

export function saltOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function unitNoise(salt: number, i: number): number {
  const x = Math.sin(salt * 0.017 + i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Resting drive stays near the personality weight. Context can only spend
 * part of the remaining headroom, so a grazer never turns into a hunter
 * just because prey walked past.
 */
export function mixGain(base: number, delta: number): number {
  const clamped = Math.min(1, Math.max(-1, delta));
  const shift = clamped >= 0 ? clamped * (2.4 - base) * 0.42 : clamped * base * 0.72;
  return Math.min(2.4, Math.max(0, base + shift));
}

export function forward(brain: Brain, sense: number[]): { hidden: number[]; out: number[] } {
  const hidden: number[] = [];
  for (let h = 0; h < HIDDEN_N; h += 1) {
    let sum = brain.b1[h] ?? 0;
    const row = h * SENSE_N;
    for (let i = 0; i < SENSE_N; i += 1) sum += (brain.w1[row + i] ?? 0) * (sense[i] ?? 0);
    hidden.push(Math.tanh(sum));
  }
  const out: number[] = [];
  for (let o = 0; o < OUT_N; o += 1) {
    let sum = brain.b2[o] ?? 0;
    const row = o * HIDDEN_N;
    for (let h = 0; h < HIDDEN_N; h += 1) sum += (brain.w2[row + h] ?? 0) * (hidden[h] ?? 0);
    out.push(Math.tanh(sum));
  }
  return { hidden, out };
}

function setIn(w1: number[], hidden: number, sense: number, value: number): void {
  w1[hidden * SENSE_N + sense] = value;
}

function setOut(w2: number[], output: number, hidden: number, value: number): void {
  w2[output * HIDDEN_N + hidden] = value;
}

/** Standard reflex wiring. Personality lives in the output biases. */
export function brainFromWeights(weights: Weights, salt = 0): Brain {
  const w1 = Array.from({ length: HIDDEN_N * SENSE_N }, () => 0);
  const b1 = Array.from({ length: HIDDEN_N }, () => 0);
  const w2 = Array.from({ length: OUT_N * HIDDEN_N }, () => 0);
  const b2 = Array.from({ length: OUT_N }, () => 0);

  setIn(w1, 0, SENSE.food, 2.5);
  b1[0] = -0.85;
  setIn(w1, 1, SENSE.threat, 2.7);
  b1[1] = -0.55;
  setIn(w1, 2, SENSE.prey, 2.6);
  b1[2] = -0.8;
  setIn(w1, 3, SENSE.mass, 2.2);
  b1[3] = -1;
  setIn(w1, 4, SENSE.rim, 2.8);
  b1[4] = -0.7;
  setIn(w1, 5, SENSE.virus, 2.1);
  setIn(w1, 5, SENSE.mass, 1.15);
  b1[5] = -1.25;

  setOut(w2, OUT.food, 0, 1.05);
  setOut(w2, OUT.food, 1, -0.85);
  setOut(w2, OUT.hunt, 2, 0.7);
  setOut(w2, OUT.hunt, 1, -0.55);
  setOut(w2, OUT.flee, 1, 1.15);
  setOut(w2, OUT.flee, 2, -0.2);
  setOut(w2, OUT.virus, 5, 1.05);
  setOut(w2, OUT.virus, 3, 0.25);
  setOut(w2, OUT.center, 4, 1.2);
  setOut(w2, OUT.wander, 0, 0.12);
  setOut(w2, OUT.split, 2, 0.85);
  setOut(w2, OUT.split, 3, 0.35);
  setOut(w2, OUT.split, 1, -0.4);
  setOut(w2, OUT.eject, 1, 0.7);
  setOut(w2, OUT.eject, 3, 0.85);

  b2[OUT.food] = (weights.food - 1) * 0.2;
  b2[OUT.hunt] = (weights.hunt - 0.85) * 0.28;
  b2[OUT.flee] = (weights.flee - 0.95) * 0.28;
  b2[OUT.virus] = (weights.virus - 0.85) * 0.22;
  b2[OUT.center] = (weights.center - 0.35) * 0.35;
  b2[OUT.split] = (weights.split - 0.5) * 0.85;
  b2[OUT.eject] = -1.15 + weights.eject * 0.45;
  b2[OUT.wander] = (weights.wander - 0.3) * 0.4;

  if (salt) {
    for (let i = 0; i < w1.length; i += 1) w1[i] = clampSynapse((w1[i] ?? 0) + unitNoise(salt, i) * 0.07);
    for (let i = 0; i < w2.length; i += 1) w2[i] = clampSynapse((w2[i] ?? 0) + unitNoise(salt, i + 80) * 0.06);
  }

  return { w1, b1, w2, b2 };
}

export function mutateBrain(brain: Brain, amount = 0.32): Brain {
  const next = cloneBrain(brain);
  const kick = (n: number, scale: number) => clampSynapse(n + (Math.random() * 2 - 1) * amount * scale);
  next.w1 = next.w1.map((n) => kick(n, 1));
  next.w2 = next.w2.map((n) => kick(n, 1));
  next.b1 = next.b1.map((n) => kick(n, 0.65));
  next.b2 = next.b2.map((n) => kick(n, 0.65));
  return next;
}

export function randomBrain(): Brain {
  const fill = (n: number, scale: number) => Array.from({ length: n }, () => clampSynapse((Math.random() * 2 - 1) * scale));
  return {
    w1: fill(HIDDEN_N * SENSE_N, 1.7),
    b1: fill(HIDDEN_N, 1.1),
    w2: fill(OUT_N * HIDDEN_N, 1.5),
    b2: fill(OUT_N, 0.8),
  };
}

export function parseBrain(raw: unknown): Brain | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Partial<Brain>;
  if (!Array.isArray(rec.w1) || rec.w1.length !== HIDDEN_N * SENSE_N) return null;
  if (!Array.isArray(rec.b1) || rec.b1.length !== HIDDEN_N) return null;
  if (!Array.isArray(rec.w2) || rec.w2.length !== OUT_N * HIDDEN_N) return null;
  if (!Array.isArray(rec.b2) || rec.b2.length !== OUT_N) return null;
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? clampSynapse(value) : 0);
  return {
    w1: rec.w1.map(num),
    b1: rec.b1.map(num),
    w2: rec.w2.map(num),
    b2: rec.b2.map(num),
  };
}
