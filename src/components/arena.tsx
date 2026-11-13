import { useEffect, useRef, useState } from "react";
import { Bot, BrainCircuit, Copy, Plus, Volume2, VolumeX, X } from "lucide-react";
import { draftAgent } from "@/lib/draft-agent";
import { DishAudio } from "@/game/audio";
import { brainFromWeights, parseBrain, saltOf, zeroTrace } from "@/game/brain";
import { NeuralBench } from "@/components/neural";
import { burst, drawDish, floatText, makeFx, tickFx, type Camera } from "@/game/render";
import { DishSim } from "@/game/sim";
import { loadNotables, loadProfile, loadSaved, pushNotable, saveProfile, saveSaved, type Notable, type SavedAgent } from "@/game/storage";
import {
  PRESETS,
  PROTOCOL_SNIPPET,
  WORLD_R,
  clampWeights,
  formatMass,
  radiusOf,
  sanitizeHandle,
  sanitizeMotto,
  sanitizeName,
  sourceLabel,
  traitLabel,
  type ActInput,
  type Brain,
  type BrainTrace,
  type JoinInput,
  type PlayerSource,
  type PresetId,
  type Weights,
} from "@/game/types";

type HudPlayerWeights = Weights;

const STEP = 1 / 60;

interface HudPlayer {
  id: number;
  name: string;
  handle: string;
  motto: string;
  mass: number;
  kills: number;
  peak: number;
  hue: number;
  alive: boolean;
  source: PlayerSource;
  trait: string;
  kind: "human" | "agent";
  weights: HudPlayerWeights;
  brain: Brain;
  trace: BrainTrace;
  brainRev: number;
}

interface Hud {
  board: { id: number; name: string; handle: string; mass: number; hue: number; kills: number }[];
  players: HudPlayer[];
  feed: { id: number; text: string }[];
  followName: string;
  youMass: number;
  youCells: number;
  playing: boolean;
}

declare global {
  interface Window {
    __dish?: {
      world: { radius: number; origin: "center"; y: "down" };
      join: (input: JoinInput) => ReturnType<DishSim["join"]>;
      leave: (id: number) => boolean;
      observe: (id: number) => ReturnType<DishSim["observe"]>;
      act: (id: number, action: ActInput) => void;
      leaderboard: () => ReturnType<DishSim["leaderboard"]>;
    };
  }
}

export function Arena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<DishSim | null>(null);
  const audioRef = useRef<DishAudio | null>(null);
  const camRef = useRef<Camera>({ x: 0, y: 0, zoom: 0.42 });
  const fxRef = useRef(makeFx());
  const humanRef = useRef<number | null>(null);
  const pinRef = useRef<number | null>(null);
  const keysRef = useRef({ eject: false, split: false });
  const pointerRef = useRef({ x: 0, y: 0, seen: false });
  const joyRef = useRef({ x: 0, y: 0, active: false });
  const touchEject = useRef(false);
  const mutedRef = useRef(false);
  const obitRef = useRef("");
  const savedRef = useRef<SavedAgent[]>([]);

  const [hud, setHud] = useState<Hud | null>(null);
  const [panel, setPanel] = useState(false);
  const [neural, setNeural] = useState(false);
  const [muted, setMuted] = useState(false);
  const [obit, setObit] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [notice, setNotice] = useState("");
  const [notables, setNotables] = useState<Notable[]>([]);

  useEffect(() => {
    let dead = false;
    const sim = new DishSim();
    const audio = new DishAudio();
    simRef.current = sim;
    audioRef.current = audio;
    savedRef.current = loadSaved();
    for (const agent of savedRef.current) {
      sim.join({ ...agent, kind: "agent" });
    }
    const profile = loadProfile();
    setName(profile.name);
    setHandle(profile.handle);
    setNotables(loadNotables());

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.code === "Space") {
        e.preventDefault();
        keysRef.current.split = true;
      } else if (e.code === "KeyW") {
        e.preventDefault();
        keysRef.current.eject = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keysRef.current.eject = false;
    };
    const onMove = (e: PointerEvent) => {
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
      world: { radius: WORLD_R, origin: "center", y: "down" },
      join: (input) => sim.join({ kind: "agent", source: "protocol", ...input }),
      leave: (id) => sim.leave(id),
      observe: (id) => sim.observe(id),
      act: (id, action) => sim.act(id, action),
      leaderboard: () => sim.leaderboard(),
    };

    let last = performance.now();
    let acc = 0;
    let hudAt = 0;
    let raf = 0;

    const frame = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      const canvas = canvasRef.current;
      const humanId = humanRef.current;
      const reduced = reducedQuery.matches;

      if (humanId != null) {
        const human = sim.players.find((p) => p.id === humanId);
        if (human?.alive) {
          if (joyRef.current.active) {
            const focus = bodyFocus(sim, humanId);
            if (focus) {
              sim.setAim(humanId, focus.x + joyRef.current.x * 620, focus.y + joyRef.current.y * 620);
            }
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
      if (follow == null || !sim.players.some((p) => p.id === follow && p.alive)) {
        follow = sim.leaderboard()[0]?.id ?? null;
      }

      let steps = 0;
      while (acc >= STEP && steps < 5) {
        sim.step(STEP);
        for (const event of sim.events) {
          if (event.type === "crumb" && (event.eater === humanId || event.eater === follow)) {
            if (event.eater === humanId) audio.crumb();
            burst(fxRef.current, event.x, event.y, event.hue, 2, 50);
          } else if (event.type === "bite") {
            burst(fxRef.current, event.x, event.y, event.hue, 12, 150);
            floatText(fxRef.current, event.x, event.y - 10, `+${Math.floor(event.mass)}`);
            if (event.eater === humanId) {
              audio.bite();
              fxRef.current.trauma = Math.min(1, fxRef.current.trauma + 0.32);
            }
          } else if (event.type === "split" && event.owner === humanId) {
            audio.split();
          } else if (event.type === "pop") {
            burst(fxRef.current, event.x, event.y, 140, 18, 220);
            audio.pop();
            if (event.owner === humanId) fxRef.current.trauma = Math.min(1, fxRef.current.trauma + 0.55);
          } else if (event.type === "wipe") {
            audio.wipe();
            const owner = sim.players.find((p) => p.id === event.owner);
            if (owner && owner.peak >= 90) setNotables(pushNotable({ name: owner.name, handle: owner.handle, mass: Math.floor(owner.peak), kills: owner.kills }));
            if (event.owner === humanId) {
              const line = event.by ? `${event.byName} engulfed you` : "You dissolved";
              obitRef.current = line;
              setObit(line);
              fxRef.current.trauma = Math.min(1, fxRef.current.trauma + 0.7);
            }
          }
        }
        acc -= STEP;
        steps += 1;
      }

      const human = humanId != null ? sim.players.find((p) => p.id === humanId) : undefined;
      if (human?.alive && obitRef.current) {
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
          const dist = Math.hypot(focus.x - cam.x, focus.y - cam.y);
          const k = dist > 900 ? 1 : 1 - Math.exp(-3.4 * dt);
          cam.x += (focus.x - cam.x) * k;
          cam.y += (focus.y - cam.y) * k;
          const minSide = Math.min(rect.width, rect.height);
          const playingNow = humanId != null && sim.players.some((p) => p.id === humanId && p.alive);
          const pad = playingNow ? 820 : 1500;
          const want = minSide / (focus.span * 1.15 + pad);
          const tz = Math.min(playingNow ? 1.2 : 0.7, Math.max(0.32, want));
          cam.zoom += (tz - cam.zoom) * (1 - Math.exp(-4 * dt));
        }
        tickFx(fxRef.current, dt, reduced);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawDish(ctx, sim, cam, rect.width, rect.height, dpr, fxRef.current, follow, humanId, rect.width >= 900, reduced);
        }
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

  function remember(agent: SavedAgent) {
    const next = [agent, ...savedRef.current.filter((row) => !(row.handle === agent.handle && row.name === agent.name))].slice(0, 12);
    savedRef.current = next;
    saveSaved(next);
  }

  function forget(playerName: string, playerHandle: string) {
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
      hue: 78,
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

  function seat(input: JoinInput, saved: SavedAgent | null) {
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

  function removePlayer(id: number) {
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

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink text-foam">
      <canvas ref={canvasRef} className="dish absolute inset-0 h-full w-full" aria-label="Petri dish arena" />

      <header className="pointer-events-none absolute top-3 left-3 z-10 max-w-44 sm:max-w-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-acid" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight">Dish</h1>
        </div>
        <p className="mt-1 hidden font-mono text-xs text-sage sm:block">Petri dish for agents</p>
        <p className="mt-1 max-w-32 truncate text-sm text-foam sm:max-w-none">
          {playing ? "You are in the dish" : hud?.followName ? `Watching ${hud.followName}` : "The dish is waking"}
        </p>
      </header>

      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full border border-sage/30 bg-membrane/90 text-foam"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            mutedRef.current = !mutedRef.current;
            if (audioRef.current) audioRef.current.muted = mutedRef.current;
            setMuted(mutedRef.current);
          }}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full border border-sage/30 bg-membrane/90 text-foam"
          aria-label="Neural controls"
          aria-pressed={neural}
          onClick={() => {
            setNeural((open) => !open);
            setPanel(false);
          }}
        >
          <BrainCircuit className="size-5" />
        </button>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-full border border-sage/30 bg-membrane/90 px-4 text-sm font-semibold"
          onClick={() => {
            setPanel((open) => !open);
            setNeural(false);
          }}
        >
          <Bot className="size-4" />
          Agents
        </button>
      </div>

      <ol className="pointer-events-auto absolute top-24 right-3 z-10 w-36 rounded-2xl border border-sage/25 bg-membrane/90 p-2 backdrop-blur-md sm:top-16 sm:w-56 sm:p-3">
        {(hud?.board ?? []).slice(0, 7).map((row, index) => (
          <li key={row.id}>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-ink/40"
              onClick={() => {
                if (humanRef.current == null) pinRef.current = row.id;
              }}
            >
              <span className="w-4 font-mono text-xs text-sage tabular-nums">{index + 1}</span>
              <span className="size-2 shrink-0 rounded-full" style={{ background: `hsl(${row.hue} 75% 55%)` }} />
              <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
              <span className="font-mono text-xs text-acid tabular-nums">{formatMass(row.mass)}</span>
            </button>
          </li>
        ))}
        {hud && hud.board.length === 0 ? <li className="px-1 py-2 text-sm text-sage">The dish is quiet.</li> : null}
      </ol>

      <ul className="pointer-events-none absolute top-20 left-3 z-10 hidden max-w-xs flex-col gap-1 sm:flex" aria-live="polite">
        {(hud?.feed ?? []).map((row) => (
          <li key={row.id} className="font-mono text-xs text-sage">
            {row.text}
          </li>
        ))}
      </ul>

      {obit ? (
        <p className="pointer-events-none absolute top-1/3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-membrane/90 px-4 py-2 text-center text-sm font-semibold">
          {obit}
        </p>
      ) : null}

      {playing ? (
        <div className="absolute right-3 bottom-28 left-3 z-10 flex items-end justify-between md:hidden">
        <Stick
          onChange={(x, y, active) => {
            joyRef.current = { x, y, active };
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="size-14 rounded-full border border-sage/40 bg-membrane/90 text-xs font-semibold"
            onPointerDown={(e) => {
              e.preventDefault();
              touchEject.current = true;
            }}
            onPointerUp={() => {
              touchEject.current = false;
            }}
            onPointerLeave={() => {
              touchEject.current = false;
            }}
          >
            Eject
          </button>
          <button
            type="button"
            className="size-14 rounded-full bg-acid text-xs font-semibold text-ink"
            onPointerDown={(e) => {
              e.preventDefault();
              keysRef.current.split = true;
            }}
          >
            Split
          </button>
        </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-10 flex justify-center sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-sage/25 bg-membrane/90 p-2 backdrop-blur-md">
          {playing ? (
            <>
              <p className="px-2 font-mono text-sm text-acid tabular-nums">
                {formatMass(hud?.youMass ?? 0)} mass
                <span className="text-sage"> · {hud?.youCells ?? 1} cells</span>
              </p>
              <p className="hidden font-mono text-xs text-sage md:block">Space split · W eject</p>
              <button type="button" className="min-h-11 rounded-full border border-sage/40 px-4 text-sm" onClick={leaveDish}>
                Leave
              </button>
            </>
          ) : (
            <>
              <input
                aria-label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                placeholder="Your name"
                suppressHydrationWarning
                className="min-h-11 w-28 rounded-full border border-sage/30 bg-ink px-4 text-sm text-foam placeholder:text-sage sm:w-36"
              />
              <input
                aria-label="X handle"
                value={handle}
                onChange={(e) => setHandle(sanitizeHandle(e.target.value))}
                placeholder="handle"
                suppressHydrationWarning
                className="min-h-11 w-24 rounded-full border border-sage/30 bg-ink px-4 font-mono text-sm text-foam placeholder:text-sage sm:w-32"
              />
              <button type="button" className="min-h-11 rounded-full bg-acid px-4 text-sm font-semibold text-ink" onClick={dropIn}>
                Drop in
              </button>
            </>
          )}
        </div>
      </div>

      {notice ? <p className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 text-center text-sm text-foam">{notice}</p> : null}

      <NeuralBench
        open={neural}
        players={hud?.players ?? []}
        onClose={() => setNeural(false)}
        onFocus={(id) => {
          if (humanRef.current == null) pinRef.current = id;
        }}
        onWeight={(id, key, value) => simRef.current?.setWeight(id, key, value)}
        onBrain={(id, brain) => {
          simRef.current?.setBrain(id, brain);
        }}
      />

      <AgentPanel
        open={panel}
        notables={notables}
        players={hud?.players ?? []}
        onClose={() => setPanel(false)}
        onSeat={seat}
        onRemove={removePlayer}
        onRestock={() => {
          simRef.current?.restock();
          setNotice("");
        }}
        onNotice={setNotice}
      />
    </main>
  );
}

function bodyFocus(sim: DishSim, id: number): { x: number; y: number; span: number } | null {
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
  return { x: sx / mass, y: sy / mass, span: Math.max(maxX - minX, maxY - minY) };
}

function clientToWorld(clientX: number, clientY: number, canvas: HTMLCanvasElement, cam: Camera) {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left - rect.width / 2;
  const sy = clientY - rect.top - rect.height / 2;
  return { x: cam.x + sx / cam.zoom, y: cam.y + sy / cam.zoom };
}

function massOf(sim: DishSim, id: number): number {
  let mass = 0;
  for (const cell of sim.cells) if (cell.owner === id) mass += cell.mass;
  return mass;
}

function readHud(sim: DishSim, humanId: number | null, follow: number | null): Hud {
  const human = humanId != null ? sim.players.find((p) => p.id === humanId) : undefined;
  const playing = Boolean(human);
  const followPlayer = sim.players.find((p) => p.id === follow);
  return {
    board: sim.leaderboard(),
    feed: sim.feed.slice(0, 4),
    followName: human?.alive ? human.name : (followPlayer?.name ?? ""),
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
      brainRev: p.brainRev ?? 1,
    })),
  };
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || target.isContentEditable;
}

function Stick({ onChange }: { onChange: (x: number, y: number, active: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function update(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const max = rect.width / 2;
    const dist = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, dist / max);
    const x = (dx / dist) * scale;
    const y = (dy / dist) * scale;
    setKnob({ x: x * max * 0.62, y: y * max * 0.62 });
    onChange(x, y, true);
  }

  function end() {
    setKnob({ x: 0, y: 0 });
    onChange(0, 0, false);
  }

  return (
    <div
      ref={ref}
      className="relative size-28 touch-none rounded-full border border-sage/40 bg-membrane/80"
      aria-label="Move"
      role="slider"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span
        className="absolute top-1/2 left-1/2 size-10 rounded-full bg-acid"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

function AgentPanel({
  open,
  players,
  notables,
  onClose,
  onSeat,
  onRemove,
  onRestock,
  onNotice,
}: {
  open: boolean;
  players: HudPlayer[];
  notables: Notable[];
  onClose: () => void;
  onSeat: (input: JoinInput, saved: SavedAgent | null) => void;
  onRemove: (id: number) => void;
  onRestock: () => void;
  onNotice: (text: string) => void;
}) {
  const [agentName, setAgentName] = useState("");
  const [agentHandle, setAgentHandle] = useState("");
  const [preset, setPreset] = useState<PresetId>("hunt");
  const [vibe, setVibe] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState("");

  if (!open) return null;

  return (
    <section className="fixed inset-0 z-20 flex flex-col overflow-y-auto bg-ink p-4 sm:absolute sm:inset-auto sm:top-16 sm:right-3 sm:bottom-24 sm:w-96 sm:rounded-2xl sm:border sm:border-sage/25 sm:bg-membrane/95 sm:p-4 sm:backdrop-blur-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-balance">Seat an agent</h2>
          <p className="mt-1 text-sm text-pretty text-sage">
            Grok can draft one. An @handle is claimed, not verified. Paste a brain, or tune synapses from the neural button.
          </p>
        </div>
        <button type="button" className="flex size-11 items-center justify-center rounded-full border border-sage/30" aria-label="Close agents" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            aria-label="Agent name"
            value={agentName}
            placeholder="Name"
            onChange={(e) => setAgentName(e.target.value.slice(0, 16))}
            className="min-h-11 min-w-0 flex-1 rounded-full border border-sage/30 bg-ink px-4 text-sm"
          />
          <input
            aria-label="Agent handle"
            value={agentHandle}
            placeholder="handle"
            onChange={(e) => setAgentHandle(sanitizeHandle(e.target.value))}
            className="min-h-11 w-28 rounded-full border border-sage/30 bg-ink px-3 font-mono text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-sage">
          Brain
          <select
            aria-label="Brain"
            value={preset}
            onChange={(e) => setPreset(e.target.value as PresetId)}
            className="min-h-11 flex-1 rounded-full border border-sage/30 bg-ink px-3 text-foam"
          >
            {(Object.keys(PRESETS) as PresetId[]).map((id) => (
              <option key={id} value={id}>
                {PRESETS[id].label} — {PRESETS[id].blurb}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-acid font-semibold text-ink"
          onClick={() => {
            const weights = PRESETS[preset].weights;
            const seatedName = sanitizeName(agentName || PRESETS[preset].label);
            const seatedHandle = sanitizeHandle(agentHandle);
            onSeat(
              { name: seatedName, handle: seatedHandle, preset, weights, kind: "agent", source: "preset" },
              { name: seatedName, handle: seatedHandle, motto: "", weights, source: "preset" },
            );
          }}
        >
          <Plus className="size-4" />
          Seat this brain
        </button>
      </div>

      <form
        className="mt-5 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (drafting) return;
          setDrafting(true);
          setDraftError("");
          void draftAgent({ data: { vibe } })
            .then((result) => {
              if (!result.ok) {
                setDraftError(result.error);
                return;
              }
              onSeat(
                { ...result.agent, kind: "agent", source: "grok" },
                { ...result.agent, source: "grok" },
              );
              setVibe("");
            })
            .catch(() => setDraftError("Couldn't draft a player. Try again."))
            .finally(() => setDrafting(false));
        }}
      >
        <h3 className="text-sm font-semibold">Ask Grok</h3>
        <input
          aria-label="Vibe for Grok"
          value={vibe}
          placeholder="A polite librarian who only eats crumbs"
          onChange={(e) => setVibe(e.target.value.slice(0, 240))}
          className="min-h-11 rounded-full border border-sage/30 bg-ink px-4 text-sm"
        />
        <button type="submit" disabled={drafting} className="min-h-11 rounded-full border border-acid px-4 font-semibold text-acid disabled:opacity-50">
          {drafting ? "Drafting…" : "Draft a player"}
        </button>
        {draftError ? <p className="text-sm text-foam">{draftError}</p> : null}
      </form>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold">Import a policy</summary>
        <textarea
          aria-label="Agent JSON"
          value={importText}
          onChange={(e) => setImportText(e.target.value.slice(0, 12000))}
          placeholder='{"name":"Marrow","handle":"marrow","weights":{"food":0.4,"hunt":1.4,"flee":0.8,"virus":1,"center":0.2,"split":0.9,"eject":0,"wander":0.2}}'
          className="mt-2 min-h-28 w-full rounded-2xl border border-sage/30 bg-ink p-3 font-mono text-xs"
        />
        <button
          type="button"
          className="mt-2 min-h-11 rounded-full border border-sage/40 px-4 text-sm"
          onClick={() => {
            try {
              const parsed = JSON.parse(importText) as {
                name?: string;
                handle?: string;
                motto?: string;
                weights?: SavedAgent["weights"];
                brain?: unknown;
              };
              const brain = parseBrain(parsed.brain);
              const seated = {
                name: sanitizeName(parsed.name),
                handle: sanitizeHandle(parsed.handle),
                motto: sanitizeMotto(parsed.motto),
                weights: clampWeights(parsed.weights),
                source: "import" as const,
                ...(brain ? { brain } : {}),
              };
              onSeat({ ...seated, kind: "agent" }, seated);
              onNotice("");
            } catch {
              onNotice("That policy wasn't JSON.");
            }
          }}
        >
          Seat imported policy
        </button>
      </details>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">In the dish</h3>
          <button type="button" className="font-mono text-xs text-sage" onClick={onRestock}>
            Restock lab
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {players.map((player) => (
            <li key={player.id} className="flex items-start gap-2 rounded-2xl bg-ink/50 px-3 py-2">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: `hsl(${player.hue} 75% 55%)` }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {player.name}{" "}
                  <span className="font-mono text-xs font-normal text-sage">{player.handle ? `@${player.handle}` : ""}</span>
                </p>
                <p className="font-mono text-xs text-sage">
                  {sourceLabel(player.source)} · {player.trait}
                  {player.alive ? ` · ${formatMass(player.mass)}` : " · respawning"}
                  {player.kills ? ` · ${player.kills} eats` : ""}
                </p>
                {player.motto ? <p className="text-sm text-pretty text-sage">{player.motto}</p> : null}
              </div>
              <button
                type="button"
                className="font-mono text-xs text-sage"
                aria-label={`Copy ${player.name}`}
                onClick={() => {
                  const payload = JSON.stringify(
                    { name: player.name, handle: player.handle, motto: player.motto, weights: player.weights, brain: player.brain },
                    null,
                    2,
                  );
                  void navigator.clipboard?.writeText(payload).then(() => {
                    setCopied(String(player.id));
                    window.setTimeout(() => setCopied(""), 1200);
                  });
                }}
              >
                <Copy className="size-4" />
                <span className="sr-only">{copied === String(player.id) ? "Copied" : "Copy"}</span>
              </button>
              <button type="button" className="font-mono text-xs text-sage" aria-label={`Remove ${player.name}`} onClick={() => onRemove(player.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold">Seat from code</summary>
        <p className="mt-2 text-sm text-pretty text-sage">
          Any Grok bot, browser agent, or script in this page can play. World origin is the center of the dish. +x is right, +y is down.
        </p>
        <pre className="mt-2 max-w-full overflow-x-auto rounded-2xl bg-ink p-3 font-mono text-xs text-foam">{PROTOCOL_SNIPPET}</pre>
        <button
          type="button"
          className="mt-2 min-h-11 rounded-full border border-sage/40 px-4 text-sm"
          onClick={() => {
            void navigator.clipboard?.writeText(PROTOCOL_SNIPPET).then(() => setCopied("proto"));
          }}
        >
          {copied === "proto" ? "Copied" : "Copy protocol"}
        </button>
      </details>

      {notables.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Notables on this browser</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {notables.map((row) => (
              <li key={`${row.name}-${row.handle}-${row.mass}`} className="flex justify-between font-mono text-xs text-sage">
                <span>
                  {row.name}
                  {row.handle ? ` @${row.handle}` : ""}
                </span>
                <span className="text-acid tabular-nums">{formatMass(row.mass)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
