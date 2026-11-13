import { createServerFn } from "@tanstack/react-start";
import {
  WEIGHT_KEYS,
  clampWeights,
  sanitizeHandle,
  sanitizeMotto,
  sanitizeName,
  type Weights,
} from "@/game/types.ts";

export interface DraftedAgent {
  name: string;
  handle: string;
  motto: string;
  weights: Weights;
}

export type DraftResult = { ok: true; agent: DraftedAgent } | { ok: false; error: string };

const stamps: number[] = [];

function allowCall(): boolean {
  const now = Date.now();
  while (stamps.length && now - stamps[0]! > 60_000) stamps.shift();
  if (stamps.length >= 10) return false;
  stamps.push(now);
  return true;
}

function extractJson(text: string): unknown {
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

export const draftAgent = createServerFn({ method: "POST" })
  .validator((input: { vibe?: string } | undefined) => ({
    vibe: String(input?.vibe ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240),
  }))
  .handler(async ({ data }): Promise<DraftResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "Grok drafting isn't available here. Seat an agent with a preset brain instead.",
      };
    }
    if (!allowCall()) {
      return { ok: false, error: "Grok is resting — too many drafts this minute." };
    }

    const vibe = data.vibe || "Surprise me with an original lab creature.";
    let res: Response;
    try {
      res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.9,
          max_tokens: 280,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You design one competitor for Dish, a petri-dish game like agar.io. Cells eat pellets, flee larger cells, hunt smaller ones, and may split or eject mass. Return JSON only with keys name, handle, motto, weights. name is 1-14 characters, a specific creature or lab nickname, not Nova, Aether, Zephyr, Luna, or Atlas. handle is 2-15 lowercase letters, numbers, or underscores, with no @. motto is <= 70 characters, dry and concrete, no hashtags. weights is an object of numbers from 0 to 2: food, hunt, flee, virus, center, split, eject, wander. High hunt and split means an aggressor. High flee means a survivor. High food means a farmer.",
            },
            { role: "user", content: vibe },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "Couldn't reach Grok. Try again in a moment." };
    }

    if (!res.ok) {
      return { ok: false, error: `Grok couldn't draft a player (${res.status}).` };
    }

    let text = "";
    try {
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      text = body.choices?.[0]?.message?.content ?? "";
      const parsed = extractJson(text) as {
        name?: unknown;
        handle?: unknown;
        motto?: unknown;
        weights?: Partial<Weights>;
      };
      const name = sanitizeName(parsed.name);
      let handle = sanitizeHandle(parsed.handle);
      if (!handle) handle = sanitizeHandle(name);
      if (!handle) return { ok: false, error: "Grok's draft was missing a handle. Try again." };
      const weights = clampWeights(parsed.weights);
      const touched = WEIGHT_KEYS.some((key) => typeof parsed.weights?.[key] === "number");
      if (!touched) return { ok: false, error: "Grok's draft had no usable brain. Try again." };
      return {
        ok: true,
        agent: { name, handle, motto: sanitizeMotto(parsed.motto), weights },
      };
    } catch {
      return { ok: false, error: "Grok's draft wasn't usable. Try a different vibe." };
    }
  });
