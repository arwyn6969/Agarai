import { parseBrain } from "./brain.ts";
import { clampWeights, sanitizeHandle, sanitizeMotto, sanitizeName, type Brain, type PlayerSource, type Weights } from "./types.ts";

const PROFILE = "dish-profile-v1";
const NOTABLES = "dish-notables-v1";
const SAVED = "dish-saved-v1";

export interface SavedAgent {
  name: string;
  handle: string;
  motto: string;
  weights: Weights;
  brain?: Brain;
  source: Extract<PlayerSource, "grok" | "import" | "preset">;
}

export interface Notable {
  name: string;
  handle: string;
  mass: number;
  kills: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function loadProfile(): { name: string; handle: string } {
  const row = read(PROFILE, { name: "", handle: "" });
  return {
    name: typeof row.name === "string" ? row.name.slice(0, 16) : "",
    handle: sanitizeHandle(row.handle),
  };
}

export function saveProfile(name: string, handle: string): void {
  write(PROFILE, { name: name.slice(0, 16), handle: sanitizeHandle(handle) });
}

export function loadSaved(): SavedAgent[] {
  const rows = read<unknown[]>(SAVED, []);
  if (!Array.isArray(rows)) return [];
  const out: SavedAgent[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Partial<SavedAgent>;
    const source = rec.source === "grok" || rec.source === "import" || rec.source === "preset" ? rec.source : "preset";
    const brain = parseBrain(rec.brain);
    out.push({
      name: sanitizeName(rec.name),
      handle: sanitizeHandle(rec.handle),
      motto: sanitizeMotto(rec.motto),
      weights: clampWeights(rec.weights),
      ...(brain ? { brain } : {}),
      source,
    });
  }
  return out.slice(0, 12);
}

export function saveSaved(rows: SavedAgent[]): void {
  write(SAVED, rows.slice(0, 12));
}

export function loadNotables(): Notable[] {
  const rows = read<unknown[]>(NOTABLES, []);
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Notable => {
      if (!row || typeof row !== "object") return false;
      const rec = row as Partial<Notable>;
      return typeof rec.mass === "number" && typeof rec.name === "string";
    })
    .slice(0, 6);
}

export function pushNotable(row: Notable): Notable[] {
  const next = [row, ...loadNotables().filter((n) => !(n.name === row.name && n.handle === row.handle && n.mass === row.mass))];
  next.sort((a, b) => b.mass - a.mass || b.kills - a.kills);
  const trimmed = next.slice(0, 6);
  write(NOTABLES, trimmed);
  return trimmed;
}
