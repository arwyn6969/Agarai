import { useEffect, useState } from "react";
import { BrainCircuit, X } from "lucide-react";
import { cloneBrain, mixGain, randomBrain, brainFromWeights, mutateBrain, saltOf } from "@/game/brain";
import {
  HIDDEN_LABELS,
  HIDDEN_N,
  OUT_N,
  SENSE_LABELS,
  SENSE_N,
  WEIGHT_KEYS,
  type Brain,
  type BrainTrace,
  type Weights,
} from "@/game/types";

export interface NeuralPlayer {
  id: number;
  name: string;
  handle: string;
  hue: number;
  kind: "human" | "agent";
  weights: Weights;
  brain: Brain;
  trace: BrainTrace;
  brainRev: number;
}

type Slot =
  | { kind: "sense"; index: number }
  | { kind: "hidden"; index: number }
  | { kind: "out"; index: number };

const DRIVE_LABEL: Record<(typeof WEIGHT_KEYS)[number], string> = {
  food: "Food",
  hunt: "Hunt",
  flee: "Flee",
  virus: "Virus",
  center: "Center",
  split: "Split",
  eject: "Eject",
  wander: "Wander",
};

export function NeuralBench({
  open,
  players,
  onClose,
  onWeight,
  onBrain,
  onFocus,
}: {
  open: boolean;
  players: NeuralPlayer[];
  onClose: () => void;
  onWeight: (id: number, key: (typeof WEIGHT_KEYS)[number], value: number) => void;
  onBrain: (id: number, brain: Brain) => void;
  onFocus: (id: number) => void;
}) {
  const [pick, setPick] = useState<number | null>(null);
  const [slot, setSlot] = useState<Slot>({ kind: "hidden", index: 1 });
  const [draft, setDraft] = useState<Brain | null>(null);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = players.find((p) => p.id === pick) ?? players.find((p) => p.kind === "agent") ?? null;

  useEffect(() => {
    if (!selected) return;
    setWeights({ ...selected.weights });
  }, [selected?.id]);

  useEffect(() => {
    if (!selected?.brain?.w1) return;
    setDraft(cloneBrain(selected.brain));
  }, [selected?.id, selected?.brainRev]);

  useEffect(() => {
    if (!open || !selected || selected.kind !== "agent") return;
    onFocus(selected.id);
  }, [open, selected?.id]);

  if (!open) return null;

  function choose(id: number) {
    setPick(id);
    onFocus(id);
  }

  function commit(next: Brain) {
    if (!selected || selected.kind === "human") return;
    setDraft(next);
    onBrain(selected.id, next);
  }

  function writeSynapse(index: number, value: number, bias = false) {
    if (!draft || !selected || selected.kind === "human") return;
    const next = cloneBrain(draft);
    if (bias) {
      if (slot.kind === "hidden") next.b1[slot.index] = value;
      else if (slot.kind === "out") next.b2[slot.index] = value;
    } else if (slot.kind === "hidden") {
      next.w1[slot.index * SENSE_N + index] = value;
    } else if (slot.kind === "out") {
      next.w2[slot.index * HIDDEN_N + index] = value;
    } else {
      next.w1[index * SENSE_N + slot.index] = value;
    }
    commit(next);
  }

  const trace = selected?.trace;
  const liveWeights = weights && selected ? weights : null;

  return (
    <section className="fixed inset-0 z-20 flex flex-col overflow-y-auto bg-ink p-4 sm:absolute sm:inset-auto sm:top-16 sm:bottom-24 sm:left-3 sm:w-96 sm:rounded-2xl sm:border sm:border-sage/25 sm:bg-membrane/95 sm:p-4 sm:backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-balance">
            <BrainCircuit className="size-5 text-acid" />
            Neural controls
          </h2>
          <p className="mt-1 text-sm text-pretty text-sage">
            Senses fire, hidden cells mix them, drives steer. Acid excites, sage inhibits.
          </p>
        </div>
        <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-sage/30" aria-label="Close neural controls" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>

      {players.length === 0 ? <p className="text-sm text-sage">The dish is empty.</p> : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {players.map((player) => (
          <button
            key={player.id}
            type="button"
            aria-pressed={player.id === selected?.id}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm ${player.id === selected?.id ? "border-acid text-foam" : "border-sage/30 text-sage"}`}
            onClick={() => choose(player.id)}
          >
            <span className="size-2 rounded-full" style={{ background: `hsl(${player.hue} 75% 55%)` }} />
            {player.name}
          </button>
        ))}
      </div>

      {selected?.kind === "human" ? (
        <p className="mt-4 text-sm text-pretty text-sage">You're driving this cell. Neural controls run the other organisms.</p>
      ) : null}

      {selected && selected.kind === "agent" && draft && liveWeights && trace ? (
        <>
          <p className="mt-3 font-mono text-xs text-sage">
            Live drive{" "}
            <span className="text-acid">
              {hottest(liveWeights, trace)}
            </span>
          </p>

          <NetDiagram brain={draft} trace={trace} slot={slot} onPick={setSlot} />
          <p className="font-mono text-xs text-sage">Hidden cells: S snack, D danger, T target, B bulk, E edge, P spore.</p>

          <div className="mt-3">
            <h3 className="text-sm font-semibold">{slotTitle(slot)}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {synapseRows(slot).map((row) => (
                <Synapse
                  key={row.key}
                  label={row.label}
                  value={readSynapse(draft, slot, row)}
                  min={-3}
                  max={3}
                  onChange={(value) => writeSynapse(row.index, value, row.bias)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="min-h-11 rounded-full bg-acid px-4 text-sm font-semibold text-ink" onClick={() => commit(mutateBrain(draft))}>
              Mutate
            </button>
            <button type="button" className="min-h-11 rounded-full border border-sage/40 px-4 text-sm" onClick={() => commit(randomBrain())}>
              Rewire
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-sage/40 px-4 text-sm"
              onClick={() => commit(brainFromWeights(liveWeights, saltOf(selected.handle || selected.name)))}
            >
              Reset
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-sage/40 px-4 text-sm"
              onClick={() => {
                const payload = JSON.stringify(
                  { name: selected.name, handle: selected.handle, weights: liveWeights, brain: draft },
                  null,
                  2,
                );
                void navigator.clipboard?.writeText(payload).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                });
              }}
            >
              {copied ? "Copied" : "Copy brain"}
            </button>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">Resting drives</h3>
            <p className="mt-1 text-sm text-pretty text-sage">The net pushes these up or down from what it senses. The acid number is the live gain.</p>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
              {WEIGHT_KEYS.map((key, index) => {
                const base = liveWeights[key];
                const now = mixGain(base, trace.out[index] ?? 0);
                return (
                  <label key={key} className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between font-mono text-xs text-sage">
                      <span>{DRIVE_LABEL[key]}</span>
                      <span className="text-acid tabular-nums">{now.toFixed(2)}</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={base}
                      aria-label={`${DRIVE_LABEL[key]} drive`}
                      aria-valuemin={0}
                      aria-valuemax={2}
                      aria-valuenow={base}
                      aria-valuetext={`${base.toFixed(2)}, live ${now.toFixed(2)}`}
                      className="h-11"
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const next = { ...liveWeights, [key]: value };
                        setWeights(next);
                        onWeight(selected.id, key, value);
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function hottest(weights: Weights, trace: BrainTrace): string {
  let best = "Food";
  let score = -1;
  for (let i = 0; i < WEIGHT_KEYS.length; i += 1) {
    const key = WEIGHT_KEYS[i]!;
    const gain = mixGain(weights[key], trace.out[i] ?? 0);
    if (gain > score) {
      score = gain;
      best = DRIVE_LABEL[key];
    }
  }
  return `${best} ${score.toFixed(2)}`;
}

function slotTitle(slot: Slot): string {
  if (slot.kind === "sense") return `${SENSE_LABELS[slot.index]} synapses`;
  if (slot.kind === "hidden") return `${HIDDEN_LABELS[slot.index]} cell`;
  return `${DRIVE_LABEL[WEIGHT_KEYS[slot.index]!] ?? "Drive"} output`;
}

function synapseRows(slot: Slot): { key: string; label: string; index: number; bias: boolean }[] {
  if (slot.kind === "hidden") {
    return [
      ...SENSE_LABELS.map((label, index) => ({ key: `s${index}`, label, index, bias: false })),
      { key: "bias", label: "Bias", index: 0, bias: true },
    ];
  }
  if (slot.kind === "out") {
    return [
      ...HIDDEN_LABELS.map((label, index) => ({ key: `h${index}`, label, index, bias: false })),
      { key: "bias", label: "Bias", index: 0, bias: true },
    ];
  }
  return HIDDEN_LABELS.map((label, index) => ({ key: `h${index}`, label, index, bias: false }));
}

function readSynapse(brain: Brain, slot: Slot, row: { index: number; bias: boolean }): number {
  if (row.bias) {
    if (slot.kind === "hidden") return brain.b1[slot.index] ?? 0;
    if (slot.kind === "out") return brain.b2[slot.index] ?? 0;
    return 0;
  }
  if (slot.kind === "hidden") return brain.w1[slot.index * SENSE_N + row.index] ?? 0;
  if (slot.kind === "out") return brain.w2[slot.index * HIDDEN_N + row.index] ?? 0;
  return brain.w1[row.index * SENSE_N + slot.index] ?? 0;
}

function Synapse({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-16 shrink-0 truncate font-mono text-xs text-sage">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number(value.toFixed(2))}
        className="h-11 min-w-0 flex-1"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={`w-10 shrink-0 text-right font-mono text-xs tabular-nums ${value >= 0 ? "text-acid" : "text-sage"}`}>{value.toFixed(2)}</span>
    </label>
  );
}

function NetDiagram({
  brain,
  trace,
  slot,
  onPick,
}: {
  brain: Brain;
  trace: BrainTrace;
  slot: Slot;
  onPick: (slot: Slot) => void;
}) {
  const width = 360;
  const height = 292;
  const yOf = (index: number, count: number) => 18 + (index * (height - 36)) / Math.max(1, count - 1);
  const selected = (kind: Slot["kind"], index: number) => slot.kind === kind && slot.index === index;

  const lines: { x1: number; y1: number; x2: number; y2: number; w: number; key: string }[] = [];
  if (slot.kind === "sense") {
    for (let h = 0; h < HIDDEN_N; h += 1) {
      lines.push({
        key: `s${h}`,
        x1: 86,
        y1: yOf(slot.index, SENSE_N),
        x2: 180,
        y2: yOf(h, HIDDEN_N),
        w: brain.w1[h * SENSE_N + slot.index] ?? 0,
      });
    }
  } else if (slot.kind === "hidden") {
    for (let s = 0; s < SENSE_N; s += 1) {
      lines.push({
        key: `in${s}`,
        x1: 86,
        y1: yOf(s, SENSE_N),
        x2: 180,
        y2: yOf(slot.index, HIDDEN_N),
        w: brain.w1[slot.index * SENSE_N + s] ?? 0,
      });
    }
    for (let o = 0; o < OUT_N; o += 1) {
      lines.push({
        key: `out${o}`,
        x1: 180,
        y1: yOf(slot.index, HIDDEN_N),
        x2: 274,
        y2: yOf(o, OUT_N),
        w: brain.w2[o * HIDDEN_N + slot.index] ?? 0,
      });
    }
  } else {
    for (let h = 0; h < HIDDEN_N; h += 1) {
      lines.push({
        key: `h${h}`,
        x1: 180,
        y1: yOf(h, HIDDEN_N),
        x2: 274,
        y2: yOf(slot.index, OUT_N),
        w: brain.w2[slot.index * HIDDEN_N + h] ?? 0,
      });
    }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full text-foam" role="group" aria-label="Neural net">
      {lines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.w >= 0 ? "var(--color-acid)" : "var(--color-sage)"}
          strokeWidth={Math.max(1, Math.min(4, Math.abs(line.w) * 1.6))}
          strokeOpacity={Math.min(0.95, 0.2 + Math.abs(line.w) / 3)}
        />
      ))}
      {SENSE_LABELS.map((label, index) => (
        <Node
          key={label}
          x={86}
          y={yOf(index, SENSE_N)}
          label={label}
          labelX={6}
          anchor="start"
          hot={heat(trace.sense[index] ?? 0)}
          picked={selected("sense", index)}
          mark=""
          onClick={() => onPick({ kind: "sense", index })}
        />
      ))}
      {["S", "D", "T", "B", "E", "P"].map((mark, index) => (
        <Node
          key={HIDDEN_LABELS[index]}
          x={180}
          y={yOf(index, HIDDEN_N)}
          label={HIDDEN_LABELS[index] ?? mark}
          labelX={180}
          anchor="middle"
          hot={heat(trace.hidden[index] ?? 0)}
          picked={selected("hidden", index)}
          mark={mark}
          onClick={() => onPick({ kind: "hidden", index })}
        />
      ))}
      {WEIGHT_KEYS.map((key, index) => (
        <Node
          key={key}
          x={274}
          y={yOf(index, OUT_N)}
          label={DRIVE_LABEL[key]}
          labelX={292}
          anchor="start"
          hot={heat(trace.out[index] ?? 0)}
          picked={selected("out", index)}
          mark=""
          onClick={() => onPick({ kind: "out", index })}
        />
      ))}
    </svg>
  );
}

function heat(value: number): number {
  return Math.min(1, Math.abs(value));
}

function Node({
  x,
  y,
  label,
  labelX,
  anchor,
  hot,
  picked,
  mark,
  onClick,
}: {
  x: number;
  y: number;
  label: string;
  labelX: number;
  anchor: "start" | "middle";
  hot: number;
  picked: boolean;
  mark: string;
  onClick: () => void;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={picked}
      className="cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <circle cx={x} cy={y} r={picked ? 11 : 8} fill={picked ? "var(--color-acid)" : "var(--color-ink)"} stroke="var(--color-foam)" strokeOpacity={0.35 + hot * 0.65} strokeWidth={picked ? 2 : 1.5} />
      {mark ? (
        <text x={x} y={y + 3} textAnchor="middle" fill={picked ? "var(--color-ink)" : "var(--color-foam)"} style={{ fontSize: 9, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}>
          {mark}
        </text>
      ) : (
        <text
          x={labelX}
          y={y + 3}
          textAnchor={anchor}
          fill={picked ? "var(--color-acid)" : "var(--color-sage)"}
          style={{ fontSize: 10, fontFamily: "IBM Plex Mono, ui-monospace, monospace" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
