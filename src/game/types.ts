export const WORLD_R = 1900;
export const START_MASS = 34;
export const FOOD_N = 540;
export const FOOD_MASS = 1.15;
export const VIRUS_N = 11;
export const VIRUS_MASS = 108;
export const MAX_PLAYERS = 16;
export const MAX_CELLS = 16;
export const VISION = 1100;

export const WEIGHT_KEYS = [
  "food",
  "hunt",
  "flee",
  "virus",
  "center",
  "split",
  "eject",
  "wander",
] as const;

export type WeightKey = (typeof WEIGHT_KEYS)[number];

export type Weights = Record<WeightKey, number>;

/** Senses are the network's inputs. Order is fixed in every genome. */
export const SENSE_N = 9;
export const HIDDEN_N = 6;
export const OUT_N = WEIGHT_KEYS.length;

export const SENSE_LABELS = ["Prey", "Threat", "Food", "Virus", "Mass", "Rim", "Cells", "Ready", "Drift"] as const;
export const HIDDEN_LABELS = ["Snack", "Danger", "Target", "Bulk", "Edge", "Spore"] as const;

export const SENSE = {
  prey: 0,
  threat: 1,
  food: 2,
  virus: 3,
  mass: 4,
  rim: 5,
  cells: 6,
  ready: 7,
  drift: 8,
} as const;

/** Output order matches WEIGHT_KEYS. */
export const OUT = {
  food: 0,
  hunt: 1,
  flee: 2,
  virus: 3,
  center: 4,
  split: 5,
  eject: 6,
  wander: 7,
} as const;

export interface Brain {
  w1: number[];
  b1: number[];
  w2: number[];
  b2: number[];
}

export interface BrainTrace {
  sense: number[];
  hidden: number[];
  out: number[];
}

export type PresetId = "graze" | "hunt" | "flee" | "split" | "scrap";

export type PlayerSource = "resident" | "human" | "preset" | "grok" | "import" | "protocol";

export const PRESETS: Record<PresetId, { label: string; blurb: string; weights: Weights }> = {
  graze: {
    label: "Grazer",
    blurb: "Eats crumbs, leaves fights",
    weights: { food: 1.7, hunt: 0.15, flee: 1.15, virus: 0.7, center: 0.4, split: 0.05, eject: 0, wander: 0.35 },
  },
  hunt: {
    label: "Hunter",
    blurb: "Chases anything smaller",
    weights: { food: 0.4, hunt: 1.75, flee: 0.85, virus: 1.15, center: 0.15, split: 0.9, eject: 0.05, wander: 0.15 },
  },
  flee: {
    label: "Coward",
    blurb: "Distance first, snacks second",
    weights: { food: 0.75, hunt: 0.05, flee: 2, virus: 0.35, center: 0.2, split: 0.65, eject: 0.35, wander: 0.25 },
  },
  split: {
    label: "Splitter",
    blurb: "Breaks in half to catch or run",
    weights: { food: 0.45, hunt: 1.25, flee: 0.75, virus: 1.35, center: 0.1, split: 1.75, eject: 0.1, wander: 0.2 },
  },
  scrap: {
    label: "Scrapper",
    blurb: "Wanders into other people's mess",
    weights: { food: 1.15, hunt: 0.85, flee: 1, virus: 0.55, center: 0.2, split: 0.3, eject: 0.05, wander: 0.7 },
  },
};

export const RESIDENTS: {
  name: string;
  handle: string;
  motto: string;
  hue: number;
  weights: Weights;
}[] = [
  { name: "Moss", handle: "slowgraze", motto: "Crumbs are a career.", hue: 128, weights: PRESETS.graze.weights },
  { name: "Kip", handle: "bitefirst", motto: "If it fits, it sits.", hue: 18, weights: PRESETS.hunt.weights },
  { name: "Pell", handle: "nope", motto: "Distance is a strategy.", hue: 200, weights: PRESETS.flee.weights },
  { name: "Vex", handle: "halve", motto: "Two problems. Both mine.", hue: 332, weights: PRESETS.split.weights },
  { name: "Lumen", handle: "scrap", motto: "Your leftovers have a name.", hue: 48, weights: PRESETS.scrap.weights },
  {
    name: "Brine",
    handle: "middle",
    motto: "Stay where the dish is thick.",
    hue: 168,
    weights: { food: 1.1, hunt: 0.55, flee: 0.9, virus: 1.2, center: 1.6, split: 0.15, eject: 0, wander: 0.15 },
  },
  {
    name: "Sable",
    handle: "patient",
    motto: "Wait for the mistake.",
    hue: 262,
    weights: { food: 0.7, hunt: 1.05, flee: 1.35, virus: 1, center: 0.3, split: 0.2, eject: 0, wander: 0.2 },
  },
];

export interface JoinInput {
  name?: string;
  handle?: string;
  motto?: string;
  weights?: Partial<Weights>;
  brain?: Brain;
  preset?: PresetId;
  source?: PlayerSource;
  kind?: "human" | "agent";
  hue?: number;
}

export interface Player {
  id: number;
  name: string;
  handle: string;
  motto: string;
  kind: "human" | "agent";
  source: PlayerSource;
  preset: PresetId | null;
  weights: Weights;
  brain: Brain;
  trace: BrainTrace;
  brainRev: number;
  hue: number;
  kills: number;
  peak: number;
  targetX: number;
  targetY: number;
  aimX: number;
  aimY: number;
  wander: number;
  nextDecision: number;
  splitCd: number;
  ejectCd: number;
  splitQueued: boolean;
  splitAll: boolean;
  ejectHeld: boolean;
  ejectQueued: boolean;
  pilot: "brain" | "manual";
  manualUntil: number;
  respawnAt: number;
  lastX: number;
  lastY: number;
  alive: boolean;
}

export interface Cell {
  id: number;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  mergeAt: number;
  launch: number;
  shield: number;
}

export interface Food {
  id: number;
  x: number;
  y: number;
  mass: number;
  hue: number;
}

export interface Virus {
  id: number;
  x: number;
  y: number;
  mass: number;
}

export interface Pellet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  hue: number;
  owner: number;
  safe: number;
}

export type GameEvent =
  | { type: "crumb"; x: number; y: number; hue: number; eater: number }
  | {
      type: "bite";
      x: number;
      y: number;
      hue: number;
      eater: number;
      mass: number;
      victimName: string;
      eaterName: string;
    }
  | { type: "split"; x: number; y: number; owner: number }
  | { type: "pop"; x: number; y: number; owner: number }
  | { type: "wipe"; owner: number; by: number | null; ownerName: string; byName: string };

export interface Nearby {
  id: number;
  name: string;
  handle: string;
  x: number;
  y: number;
  r: number;
  mass: number;
}

export interface Observation {
  time: number;
  radius: number;
  you: {
    id: number;
    name: string;
    handle: string;
    alive: boolean;
    mass: number;
    x: number;
    y: number;
    r: number;
    cells: { x: number; y: number; r: number; mass: number }[];
  };
  food: { x: number; y: number; mass: number }[];
  threats: Nearby[];
  prey: Nearby[];
  rivals: Nearby[];
  viruses: { x: number; y: number; r: number }[];
  pellets: { x: number; y: number; mass: number }[];
}

export interface ActInput {
  targetX: number;
  targetY: number;
  split?: boolean;
  eject?: boolean;
  splitAll?: boolean;
}

export interface JoinResult {
  ok: true;
  id: number;
  name: string;
  handle: string;
}

export interface JoinError {
  ok: false;
  error: string;
}

export function radiusOf(mass: number): number {
  return Math.sqrt(Math.max(1, mass)) * 5.15;
}

export function maxSpeed(mass: number): number {
  return 920 * Math.pow(Math.max(1, mass), -0.36);
}

export function clampWeights(partial?: Partial<Weights> | null, base?: Weights): Weights {
  const src = base ?? PRESETS.hunt.weights;
  const out = { ...src };
  if (!partial) return out;
  for (const key of WEIGHT_KEYS) {
    const value = partial[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = Math.min(2, Math.max(0, value));
    }
  }
  return out;
}

export function sanitizeName(raw: unknown): string {
  const text = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return text || "Cell";
}

export function sanitizeHandle(raw: unknown): string {
  return String(raw ?? "")
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 15);
}

export function sanitizeMotto(raw: unknown): string {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function traitLabel(weights: Weights): string {
  const scores: { label: string; score: number }[] = [
    { label: "Grazer", score: weights.food - weights.hunt * 0.25 },
    { label: "Hunter", score: weights.hunt + weights.split * 0.2 },
    { label: "Coward", score: weights.flee - weights.hunt * 0.15 },
    { label: "Splitter", score: weights.split + weights.hunt * 0.15 },
    { label: "Scrapper", score: weights.wander * 1.2 + weights.food * 0.25 },
  ];
  let best = scores[0]!;
  for (const row of scores) if (row.score > best.score) best = row;
  return best.label;
}

export function sourceLabel(source: PlayerSource): string {
  switch (source) {
    case "resident":
      return "Lab";
    case "human":
      return "You";
    case "grok":
      return "Grok";
    case "protocol":
      return "Code";
    case "import":
      return "Import";
    case "preset":
      return "Seated";
  }
}

export function formatMass(mass: number): string {
  if (mass >= 10000) return `${Math.round(mass / 1000)}k`;
  if (mass >= 1000) return `${(mass / 1000).toFixed(1)}k`;
  return String(Math.floor(mass));
}

export const PROTOCOL_SNIPPET = `const seat = window.__dish.join({
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
