import type { DishSim } from "./sim.ts";
import { WORLD_R, radiusOf } from "./types.ts";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  hue: number;
  r: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
}

export interface FxState {
  particles: Particle[];
  floaters: Floater[];
  trauma: number;
}

const INK = "#07140f";
const DISH = "#0c1c16";
const GRID = "rgba(231, 246, 238, 0.055)";
const ACID = "#d6ff4a";
const FOAM = "#e7f6ee";

export function makeFx(): FxState {
  return { particles: [], floaters: [], trauma: 0 };
}

export function burst(fx: FxState, x: number, y: number, hue: number, n: number, speed: number): void {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random());
    fx.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.28 + Math.random() * 0.28,
      max: 0.5,
      hue,
      r: 1.6 + Math.random() * 2.4,
    });
  }
  if (fx.particles.length > 260) fx.particles.splice(0, fx.particles.length - 260);
}

export function floatText(fx: FxState, x: number, y: number, text: string): void {
  fx.floaters.push({ x, y, text, life: 0.7, max: 0.7 });
  if (fx.floaters.length > 24) fx.floaters.shift();
}

export function tickFx(fx: FxState, dt: number, reduced: boolean): void {
  if (!reduced) fx.trauma = Math.max(0, fx.trauma - dt * 1.7);
  else fx.trauma = 0;
  for (const p of fx.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
  for (const f of fx.floaters) {
    f.life -= dt;
    f.y -= 36 * dt;
  }
  fx.floaters = fx.floaters.filter((f) => f.life > 0);
}

export function drawDish(
  ctx: CanvasRenderingContext2D,
  sim: DishSim,
  cam: Camera,
  cssW: number,
  cssH: number,
  dpr: number,
  fx: FxState,
  followId: number | null,
  humanId: number | null,
  showMap: boolean,
  reduced: boolean,
): void {
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

  for (const virus of sim.viruses) {
    drawVirus(ctx, virus.x, virus.y, radiusOf(virus.mass) * 0.92, sim.time, virus.id);
  }

  const largest = new Map<number, number>();
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
    const stretch = reduced ? 0 : Math.min(0.16, sp / 1600);
    const ang = Math.atan2(cell.vy, cell.vx);
    ctx.save();
    ctx.translate(cell.x, cell.y);
    ctx.rotate(ang);
    ctx.scale(1 + stretch, 1 - stretch * 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${player.hue} 80% 48% / 0.16)`;
    ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.28, -r * 0.34, r * 0.08, 0, 0, r);
    g.addColorStop(0, `hsl(${player.hue} 90% 74%)`);
    g.addColorStop(0.5, `hsl(${player.hue} 76% 52%)`);
    g.addColorStop(1, `hsl(${player.hue} 68% 34%)`);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    ctx.strokeStyle = `hsl(${player.hue} 55% 22%)`;
    ctx.stroke();
    ctx.restore();

    const look = Math.atan2(player.targetY - cell.y, player.targetX - cell.x);
    drawEyes(ctx, cell.x, cell.y - r * 0.12, r, look);

    const isLargest = largest.get(cell.owner) === cell.mass;
    if (isLargest && r * cam.zoom >= 20) {
      const px = Math.min(18, Math.max(12, r * cam.zoom * 0.32)) / cam.zoom;
      const nameY = cell.y + r * 0.28;
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

  const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, cssW * 0.25, cssW / 2, cssH / 2, cssW * 0.72);
  vignette.addColorStop(0, "rgba(7, 20, 15, 0)");
  vignette.addColorStop(1, "rgba(7, 20, 15, 0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, cssW, cssH);

  if (showMap) drawMap(ctx, sim, followId, humanId, cssW, cssH);
}

function drawEyes(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, look: number): void {
  if (r < 11) return;
  const ex = Math.cos(look) * r * 0.28;
  const ey = Math.sin(look) * r * 0.28;
  const px = -Math.sin(look) * r * 0.28;
  const py = Math.cos(look) * r * 0.28;
  const er = Math.max(2.2, r * 0.15);
  const pr = er * 0.48;
  for (const sign of [-1, 1]) {
    const ox = x + ex + px * sign;
    const oy = y + ey + py * sign;
    ctx.beginPath();
    ctx.arc(ox, oy, er, 0, Math.PI * 2);
    ctx.fillStyle = "#f4fff8";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox + Math.cos(look) * er * 0.35, oy + Math.sin(look) * er * 0.35, pr, 0, Math.PI * 2);
    ctx.fillStyle = "#102018";
    ctx.fill();
  }
}

function drawVirus(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number, id: number): void {
  const spikes = 16;
  ctx.beginPath();
  for (let i = 0; i < spikes; i += 1) {
    const a = (i / spikes) * Math.PI * 2 + Math.sin(time * 0.7 + id) * 0.04;
    const rad = r * (i % 2 === 0 ? 1.2 : 0.8);
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

function drawMap(
  ctx: CanvasRenderingContext2D,
  sim: DishSim,
  followId: number | null,
  humanId: number | null,
  cssW: number,
  cssH: number,
): void {
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
