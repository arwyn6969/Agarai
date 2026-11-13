import {
  brainFromWeights,
  clamp01,
  forward,
  mixGain,
  parseBrain,
  saltOf,
  zeroTrace,
} from "./brain.ts";
import {
  FOOD_MASS,
  FOOD_N,
  MAX_CELLS,
  MAX_PLAYERS,
  OUT,
  PRESETS,
  RESIDENTS,
  START_MASS,
  VIRUS_MASS,
  VIRUS_N,
  VISION,
  WEIGHT_KEYS,
  WORLD_R,
  clampWeights,
  maxSpeed,
  radiusOf,
  sanitizeHandle,
  sanitizeMotto,
  sanitizeName,
  type ActInput,
  type Brain,
  type Cell,
  type Food,
  type GameEvent,
  type JoinError,
  type JoinInput,
  type JoinResult,
  type Nearby,
  type Observation,
  type Pellet,
  type Player,
  type PlayerSource,
  type PresetId,
  type Virus,
  type WeightKey,
  type Weights,
} from "./types.ts";

const FOOD_HUES = [48, 152, 200, 330, 18, 78];

interface WipeNote {
  owner: number;
  by: number | null;
}

export class DishSim {
  time = 0;
  players: Player[] = [];
  cells: Cell[] = [];
  foods: Food[] = [];
  viruses: Virus[] = [];
  pellets: Pellet[] = [];
  events: GameEvent[] = [];
  feed: { id: number; text: string }[] = [];
  private seq = 1;
  private feedSeq = 1;
  private hueSeq = 24;

  constructor() {
    for (let i = 0; i < FOOD_N; i += 1) this.spawnFood();
    for (let i = 0; i < VIRUS_N; i += 1) this.spawnVirus();
    for (const seed of RESIDENTS) {
      this.join({
        name: seed.name,
        handle: seed.handle,
        motto: seed.motto,
        weights: seed.weights,
        hue: seed.hue,
        source: "resident",
        kind: "agent",
      });
    }
  }

  join(input: JoinInput): JoinResult | JoinError {
    if (this.players.length >= MAX_PLAYERS) {
      return { ok: false, error: "The dish is full. Remove an agent first." };
    }
    const preset: PresetId | null =
      input.preset && PRESETS[input.preset] ? input.preset : null;
    const weights = clampWeights(input.weights, preset ? PRESETS[preset].weights : undefined);
    const kind = input.kind === "human" ? "human" : "agent";
    const source: PlayerSource = input.source ?? (kind === "human" ? "human" : preset ? "preset" : "protocol");
    const spot = this.spawnPoint();
    const id = this.seq++;
    const hue = typeof input.hue === "number" && Number.isFinite(input.hue) ? ((input.hue % 360) + 360) % 360 : this.hueSeq;
    this.hueSeq = (this.hueSeq + 47) % 360;
    const handle = sanitizeHandle(input.handle);
    const name = sanitizeName(input.name);
    const brain = parseBrain(input.brain) ?? brainFromWeights(weights, saltOf(handle || name));
    const player: Player = {
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
      peak: START_MASS,
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
      alive: true,
    };
    this.players.push(player);
    this.cells.push(this.makeCell(player, spot.x, spot.y, START_MASS, 0, 0));
    return { ok: true, id, name: player.name, handle: player.handle };
  }

  leave(id: number): boolean {
    const idx = this.players.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    this.players.splice(idx, 1);
    this.cells = this.cells.filter((c) => c.owner !== id);
    this.pellets = this.pellets.filter((p) => p.owner !== id);
    return true;
  }

  restock(): void {
    for (const seed of RESIDENTS) {
      const exists = this.players.some((p) => p.source === "resident" && p.handle === seed.handle);
      if (exists) continue;
      this.join({
        name: seed.name,
        handle: seed.handle,
        motto: seed.motto,
        weights: seed.weights,
        hue: seed.hue,
        source: "resident",
        kind: "agent",
      });
    }
  }

  setAim(id: number, x: number, y: number): void {
    const player = this.player(id);
    if (!player) return;
    player.targetX = x;
    player.targetY = y;
    this.noteAim(player);
  }

  setEjectHeld(id: number, held: boolean): void {
    const player = this.player(id);
    if (player) player.ejectHeld = held;
  }

  queueSplit(id: number, all = false): void {
    const player = this.player(id);
    if (!player) return;
    player.splitQueued = true;
    if (all) player.splitAll = true;
  }

  act(id: number, action: ActInput): void {
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

  setWeight(id: number, key: WeightKey, value: number): void {
    const player = this.player(id);
    if (!player || player.kind === "human") return;
    if (!WEIGHT_KEYS.includes(key)) return;
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    player.weights[key] = Math.min(2, Math.max(0, value));
  }

  setBrain(id: number, brain: Brain): boolean {
    const player = this.player(id);
    const next = parseBrain(brain);
    if (!player || player.kind === "human" || !next) return false;
    player.brain = next;
    player.brainRev += 1;
    return true;
  }

  observe(id: number): Observation | null {
    const player = this.player(id);
    if (!player) return null;
    const mine = this.cells.filter((c) => c.owner === id);
    const mass = mine.reduce((sum, c) => sum + c.mass, 0);
    const biggest = mine.reduce<Cell | null>((best, c) => (!best || c.mass > best.mass ? c : best), null);
    const cx = mine.length ? mine.reduce((s, c) => s + c.x * c.mass, 0) / mass : player.lastX;
    const cy = mine.length ? mine.reduce((s, c) => s + c.y * c.mass, 0) / mass : player.lastY;
    const myR = biggest ? radiusOf(biggest.mass) : 0;
    const threats: Nearby[] = [];
    const prey: Nearby[] = [];
    const rivals: Nearby[] = [];
    for (const cell of this.cells) {
      if (cell.owner === id) continue;
      const d = Math.hypot(cell.x - cx, cell.y - cy);
      if (d > VISION) continue;
      const owner = this.player(cell.owner);
      if (!owner) continue;
      const row: Nearby = {
        id: owner.id,
        name: owner.name,
        handle: owner.handle,
        x: cell.x,
        y: cell.y,
        r: radiusOf(cell.mass),
        mass: cell.mass,
      };
      if (biggest && cell.mass > biggest.mass * 1.08) threats.push(row);
      else if (biggest && biggest.mass > cell.mass * 1.1) prey.push(row);
      else rivals.push(row);
    }
    const byDist = (a: Nearby, b: Nearby) => {
      const da = (a.x - cx) ** 2 + (a.y - cy) ** 2;
      const db = (b.x - cx) ** 2 + (b.y - cy) ** 2;
      return da - db;
    };
    threats.sort(byDist);
    prey.sort(byDist);
    rivals.sort(byDist);
    const food = this.foods
      .map((f) => ({ x: f.x, y: f.y, mass: f.mass, d: (f.x - cx) ** 2 + (f.y - cy) ** 2 }))
      .filter((f) => f.d < VISION * VISION)
      .sort((a, b) => a.d - b.d)
      .slice(0, 24)
      .map(({ x, y, mass: m }) => ({ x, y, mass: m }));
    const pellets = this.pellets
      .filter((p) => Math.hypot(p.x - cx, p.y - cy) < VISION)
      .slice(0, 10)
      .map((p) => ({ x: p.x, y: p.y, mass: p.mass }));
    const viruses = this.viruses
      .filter((v) => Math.hypot(v.x - cx, v.y - cy) < VISION)
      .slice(0, 8)
      .map((v) => ({ x: v.x, y: v.y, r: radiusOf(v.mass) * 0.92 }));
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
        cells: mine.map((c) => ({ x: c.x, y: c.y, r: radiusOf(c.mass), mass: c.mass })),
      },
      food,
      threats: threats.slice(0, 12),
      prey: prey.slice(0, 12),
      rivals: rivals.slice(0, 12),
      viruses,
      pellets,
    };
  }

  leaderboard(): { id: number; name: string; handle: string; mass: number; kills: number; hue: number }[] {
    return this.players
      .map((p) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        mass: this.massOf(p.id),
        kills: p.kills,
        hue: p.hue,
      }))
      .filter((p) => p.mass > 0)
      .sort((a, b) => b.mass - a.mass || b.kills - a.kills);
  }

  step(rawDt: number): void {
    const dt = Math.min(0.05, Math.max(0, rawDt));
    if (dt <= 0) return;
    this.time += dt;
    this.events = [];

    for (const player of this.players) {
      if (player.splitCd > 0) player.splitCd -= dt;
      if (player.ejectCd > 0) player.ejectCd -= dt;
      if (player.pilot === "manual" && this.time > player.manualUntil) player.pilot = "brain";
      if (player.alive && player.kind !== "human" && player.pilot === "brain" && player.nextDecision <= this.time) {
        this.decide(player);
        player.nextDecision = this.time + 0.12;
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
      if (did) player.splitCd = 0.42;
      player.splitQueued = false;
    }

    for (const player of this.players) {
      if ((player.ejectHeld || player.ejectQueued) && player.ejectCd <= 0 && player.alive) {
        this.ejectFrom(player);
        player.ejectCd = 0.13;
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
      } else {
        this.steer(cell, player.targetX, player.targetY, dt);
      }
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

  private player(id: number): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  private makeCell(player: Player, x: number, y: number, mass: number, vx: number, vy: number): Cell {
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
      shield: 0,
    };
  }

  private spawnPoint(): { x: number; y: number } {
    for (let i = 0; i < 10; i += 1) {
      const spot = randomInCircle(WORLD_R * 0.78);
      const crowded = this.cells.some((c) => Math.hypot(c.x - spot.x, c.y - spot.y) < radiusOf(c.mass) + 80);
      const viral = this.viruses.some((v) => Math.hypot(v.x - spot.x, v.y - spot.y) < radiusOf(v.mass) + 70);
      if (!crowded && !viral) return spot;
    }
    return randomInCircle(WORLD_R * 0.7);
  }

  private spawnFood(): void {
    const spot = randomInCircle(WORLD_R - 30);
    this.foods.push({
      id: this.seq++,
      x: spot.x,
      y: spot.y,
      mass: FOOD_MASS,
      hue: FOOD_HUES[this.foods.length % FOOD_HUES.length]!,
    });
  }

  private spawnVirus(): void {
    const spot = randomInCircle(WORLD_R * 0.82);
    this.viruses.push({ id: this.seq++, x: spot.x, y: spot.y, mass: VIRUS_MASS });
  }

  private noteAim(player: Player): void {
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

  private centroid(player: Player): { x: number; y: number; mass: number; biggest: Cell | null } {
    const mine = this.cells.filter((c) => c.owner === player.id);
    if (!mine.length) return { x: player.lastX, y: player.lastY, mass: 0, biggest: null };
    const mass = mine.reduce((s, c) => s + c.mass, 0);
    let biggest = mine[0]!;
    for (const cell of mine) if (cell.mass > biggest.mass) biggest = cell;
    return {
      x: mine.reduce((s, c) => s + c.x * c.mass, 0) / mass,
      y: mine.reduce((s, c) => s + c.y * c.mass, 0) / mass,
      mass,
      biggest,
    };
  }

  private decide(player: Player): void {
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
      if (d2 > VISION * VISION || d2 < 1) continue;
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
      if (d2 > VISION * VISION || d2 < 1) continue;
      const score = 3.2 / d2;
      if (score > bestFood) {
        bestFood = score;
        const d = Math.sqrt(d2);
        fx = dx / d;
        fy = dy / d;
        foodClose = clamp01(1 - d / 640);
      }
    }

    let nearestThreat: { x: number; y: number; d: number; mass: number; r: number } | null = null;
    let nearestPrey: { x: number; y: number; d: number; mass: number } | null = null;
    let huntX = 0;
    let huntY = 0;
    let fleeX = 0;
    let fleeY = 0;
    for (const cell of this.cells) {
      if (cell.owner === player.id) continue;
      const dx = cell.x - cx;
      const dy = cell.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      if (d > VISION) continue;
      const dirx = dx / d;
      const diry = dy / d;
      if (cell.mass > biggest.mass * 1.1) {
        const threat = (1.35 - d / VISION) * Math.min(2.4, cell.mass / biggest.mass);
        fleeX -= dirx * threat;
        fleeY -= diry * threat;
        if (!nearestThreat || d < nearestThreat.d) {
          nearestThreat = { x: cell.x, y: cell.y, d, mass: cell.mass, r: radiusOf(cell.mass) };
        }
      } else if (biggest.mass > cell.mass * 1.12) {
        const interest = (1.15 - d / VISION) * Math.min(2, biggest.mass / cell.mass);
        huntX += dirx * interest;
        huntY += diry * interest;
        if (!nearestPrey || d < nearestPrey.d) nearestPrey = { x: cell.x, y: cell.y, d, mass: cell.mass };
      }
    }

    let virusX = 0;
    let virusY = 0;
    let virusClose = 0;
    let nearestVirus: Virus | null = null;
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
        virusX -= (dx / d) * push * 1.7;
        virusY -= (dy / d) * push * 1.7;
      }
    }

    const cd = Math.hypot(cx, cy);
    const cellCount = this.cells.reduce((n, c) => n + (c.owner === player.id ? 1 : 0), 0);
    const ready = player.splitCd <= 0 && biggest.mass >= 48 && cellCount < MAX_CELLS - 1 ? 1 : 0;
    const sense = [
      nearestPrey ? clamp01(1 - nearestPrey.d / VISION) : 0,
      nearestThreat ? clamp01(1 - nearestThreat.d / VISION) : 0,
      foodClose,
      virusClose,
      clamp01(Math.log(Math.max(mass, 1) / START_MASS) / Math.log(40)),
      cd > 1 ? clamp01((cd - WORLD_R * 0.5) / (WORLD_R * 0.45)) : 0,
      cellCount / MAX_CELLS,
      ready,
      Math.sin(player.wander),
    ];
    const fired = forward(player.brain, sense);
    player.trace = { sense, hidden: fired.hidden, out: fired.out };

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

    if (biggest.mass <= 150 && nearestThreat && fleeG > 0.7 && nearestVirus && nearestVirusD < 640) {
      const dx = nearestVirus.x - cx;
      const dy = nearestVirus.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const hide = 0.85 * Math.min(1.3, fleeG);
      ax += (dx / d) * hide;
      ay += (dy / d) * hide;
    }

    if (cd > WORLD_R * 0.72) {
      ax -= (cx / cd) * (0.6 + centerG);
      ay -= (cy / cd) * (0.6 + centerG);
    } else if (cd > 1) {
      ax -= (cx / WORLD_R) * centerG * 0.45;
      ay -= (cy / WORLD_R) * centerG * 0.45;
    }

    player.wander += (Math.random() - 0.5) * 0.7;
    ax += Math.cos(player.wander) * wanderG;
    ay += Math.sin(player.wander) * wanderG;

    const mag = Math.hypot(ax, ay);
    if (mag > 0.001) {
      player.targetX = cx + (ax / mag) * 480;
      player.targetY = cy + (ay / mag) * 480;
      player.aimX = ax / mag;
      player.aimY = ay / mag;
    }

    const myR = radiusOf(biggest.mass);
    const splitSignal = fired.out[OUT.split] ?? 0;
    const splitUrge = clamp01(w.split / 2 + splitSignal * 0.35);
    if (ready) {
      if (
        nearestPrey &&
        splitUrge > 0.4 &&
        biggest.mass * 0.5 > nearestPrey.mass * 1.18 &&
        nearestPrey.d < myR + 260
      ) {
        const pdx = nearestPrey.x - biggest.x;
        const pdy = nearestPrey.y - biggest.y;
        const align = pdx * player.aimX + pdy * player.aimY;
        if (align > 0) player.splitQueued = true;
      } else if (
        nearestThreat &&
        biggest.mass > 80 &&
        nearestThreat.d < myR + nearestThreat.r + 36 &&
        (fleeG > 1.7 || w.split > 0.8 || splitUrge > 0.62)
      ) {
        player.splitQueued = true;
      }
    }

    const ejectSignal = fired.out[OUT.eject] ?? 0;
    if (
      nearestThreat &&
      ejectSignal > 0.42 &&
      biggest.mass > 110 &&
      nearestThreat.d < 400 &&
      player.ejectCd <= 0 &&
      Math.random() < 0.16
    ) {
      player.ejectQueued = true;
    }
  }

  private shouldSplitCell(player: Player, cell: Cell): boolean {
    if (cell.mass < 36) return false;
    if (this.cells.filter((c) => c.owner === player.id).length >= MAX_CELLS) return false;
    if (!player.splitAll) {
      let biggest = cell.mass;
      for (const other of this.cells) {
        if (other.owner === player.id && other.mass > biggest) return false;
      }
    }
    return true;
  }

  private splitCell(player: Player, cell: Cell): void {
    const half = cell.mass / 2;
    cell.mass = half;
    cell.mergeAt = this.time + 10;
    const nx = player.aimX || 1;
    const ny = player.aimY || 0;
    const baby: Cell = {
      id: this.seq++,
      owner: player.id,
      x: cell.x + nx * 10,
      y: cell.y + ny * 10,
      vx: nx * 880,
      vy: ny * 880,
      mass: half,
      mergeAt: this.time + 10,
      launch: 0.42,
      shield: 0.2,
    };
    this.cells.push(baby);
    this.events.push({ type: "split", x: cell.x, y: cell.y, owner: player.id });
  }

  private ejectFrom(player: Player): void {
    let biggest: Cell | null = null;
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
      safe: 0.45,
    });
    if (this.pellets.length > 80) this.pellets.splice(0, this.pellets.length - 80);
  }

  private steer(cell: Cell, tx: number, ty: number, dt: number): void {
    const dx = tx - cell.x;
    const dy = ty - cell.y;
    const dist = Math.hypot(dx, dy) || 1;
    const r = radiusOf(cell.mass);
    const urge = Math.min(1, dist / (r * 0.9));
    const spd = maxSpeed(cell.mass) * urge;
    const desiredX = (dx / dist) * spd;
    const desiredY = (dy / dist) * spd;
    const k = 1 - Math.exp(-9 * dt);
    cell.vx += (desiredX - cell.vx) * k;
    cell.vy += (desiredY - cell.vy) * k;
    cell.x += cell.vx * dt;
    cell.y += cell.vy * dt;
  }

  private separateSiblings(): void {
    const groups = new Map<number, Cell[]>();
    for (const cell of this.cells) {
      const list = groups.get(cell.owner);
      if (list) list.push(cell);
      else groups.set(cell.owner, [cell]);
    }
    for (const list of groups.values()) {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i]!;
          const b = list[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          let d = Math.hypot(dx, dy);
          const ra = radiusOf(a.mass);
          const rb = radiusOf(b.mass);
          if (d < 0.001) {
            const ang = ((a.id * 13 + b.id) % 32) * 0.2;
            a.x -= Math.cos(ang);
            a.y -= Math.sin(ang);
            d = 1;
          }
          const min = ra + rb + 1.5;
          if (d < min && (a.mergeAt > this.time || b.mergeAt > this.time)) {
            const push = (min - d) * 0.5;
            const nx = dx / d;
            const ny = dy / d;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
          }
        }
      }
    }
  }

  private containAll(): void {
    for (const cell of this.cells) this.contain(cell);
    for (const pellet of this.pellets) {
      const d = Math.hypot(pellet.x, pellet.y);
      const limit = WORLD_R - 16;
      if (d > limit) {
        pellet.x = (pellet.x / d) * limit;
        pellet.y = (pellet.y / d) * limit;
        pellet.vx *= 0.2;
        pellet.vy *= 0.2;
      }
    }
  }

  private contain(cell: Cell): void {
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

  private jostleRivals(): void {
    for (let n = 0; n < 2; n += 1) {
      for (let i = 0; i < this.cells.length; i += 1) {
        for (let j = i + 1; j < this.cells.length; j += 1) {
          const a = this.cells[i]!;
          const b = this.cells[j]!;
          if (a.owner === b.owner) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d <= 0.001) continue;
          const ra = radiusOf(a.mass);
          const rb = radiusOf(b.mass);
          if (d >= ra + rb) continue;
          const heavier = Math.max(a.mass, b.mass);
          const lighter = Math.min(a.mass, b.mass);
          if (heavier > lighter * 1.1) continue;
          const push = (ra + rb - d) * 0.35;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }

  private eatFood(): void {
    if (!this.foods.length || !this.cells.length) return;
    const keep: Food[] = [];
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
          this.events.push({ type: "crumb", x: food.x, y: food.y, hue: food.hue, eater: cell.owner });
          eaten = true;
          break;
        }
      }
      if (!eaten) keep.push(food);
    }
    this.foods = keep;
  }

  private eatPellets(): void {
    const keep: Pellet[] = [];
    for (const pellet of this.pellets) {
      let eaten = false;
      for (const cell of this.cells) {
        if (cell.owner === pellet.owner && pellet.safe > 0) continue;
        const r = radiusOf(cell.mass);
        const dx = pellet.x - cell.x;
        const dy = pellet.y - cell.y;
        if (dx * dx + dy * dy <= r * r) {
          cell.mass += pellet.mass;
          this.events.push({ type: "crumb", x: pellet.x, y: pellet.y, hue: pellet.hue, eater: cell.owner });
          eaten = true;
          break;
        }
      }
      if (!eaten) keep.push(pellet);
    }
    this.pellets = keep;
  }

  private eatCells(): void {
    const dead = new Set<number>();
    const wipes: WipeNote[] = [];
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
          eaterName: eater?.name ?? "someone",
        });
        if (victim && eater && !this.cells.some((c) => c.owner === victim.id && c.id !== b.id && !dead.has(c.id))) {
          wipes.push({ owner: victim.id, by: eater.id });
        }
      }
    }
    if (dead.size) this.cells = this.cells.filter((c) => !dead.has(c.id));
    for (const wipe of wipes) this.wipe(wipe.owner, wipe.by);
  }

  private wipe(ownerId: number, byId: number | null): void {
    const owner = this.player(ownerId);
    if (!owner || !owner.alive) return;
    if (this.cells.some((c) => c.owner === ownerId)) return;
    const by = byId != null ? this.player(byId) : undefined;
    if (by && by.id !== owner.id) by.kills += 1;
    owner.alive = false;
    owner.respawnAt = this.time + 2.1;
    owner.ejectHeld = false;
    this.events.push({
      type: "wipe",
      owner: owner.id,
      by: by?.id ?? null,
      ownerName: owner.name,
      byName: by?.name ?? "the dish",
    });
    this.pushFeed(
      by && by.id !== owner.id ? `${by.name} engulfed ${owner.name}` : `${owner.name} dissolved`,
    );
  }

  private hitViruses(): void {
    const spawned: Cell[] = [];
    const dead = new Set<number>();
    for (const cell of this.cells) {
      if (cell.mass < 170 || cell.shield > 0) continue;
      const r = radiusOf(cell.mass);
      for (const virus of this.viruses) {
        const vr = radiusOf(virus.mass) * 0.92;
        const d = Math.hypot(virus.x - cell.x, virus.y - cell.y);
        if (d > r * 0.82 + vr * 0.25) continue;
        const owner = this.player(cell.owner);
        const existing = this.cells.reduce((n, c) => n + (c.owner === cell.owner && c.id !== cell.id ? 1 : 0), 0);
        const room = Math.max(0, MAX_CELLS - existing);
        if (room < 2) continue;
        const pieces = Math.min(room, 10, Math.max(2, Math.floor(cell.mass / 40)));
        dead.add(cell.id);
        const share = cell.mass / pieces;
        for (let i = 0; i < pieces; i += 1) {
          const ang = (i / pieces) * Math.PI * 2;
          spawned.push({
            id: this.seq++,
            owner: cell.owner,
            x: cell.x + Math.cos(ang) * 12,
            y: cell.y + Math.sin(ang) * 12,
            vx: Math.cos(ang) * 520,
            vy: Math.sin(ang) * 520,
            mass: share,
            mergeAt: this.time + 12,
            launch: 0.55,
            shield: 1.15,
          });
        }
        this.events.push({ type: "pop", x: cell.x, y: cell.y, owner: cell.owner });
        if (owner) this.pushFeed(`${owner.name} burst on a virus`);
        break;
      }
    }
    if (dead.size) this.cells = this.cells.filter((c) => !dead.has(c.id));
    if (spawned.length) this.cells.push(...spawned);
  }

  private mergeSiblings(): void {
    const dead = new Set<number>();
    for (let i = 0; i < this.cells.length; i += 1) {
      const a = this.cells[i]!;
      if (dead.has(a.id) || a.mergeAt > this.time) continue;
      for (let j = i + 1; j < this.cells.length; j += 1) {
        const b = this.cells[j]!;
        if (dead.has(b.id) || a.owner !== b.owner || b.mergeAt > this.time) continue;
        const ra = radiusOf(a.mass);
        const rb = radiusOf(b.mass);
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > (ra + rb) * 0.62) continue;
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

  private decay(dt: number): void {
    for (const player of this.players) {
      const total = this.massOf(player.id);
      if (total > player.peak) player.peak = total;
      if (total < 520) continue;
      let biggest: Cell | null = null;
      for (const cell of this.cells) {
        if (cell.owner !== player.id) continue;
        if (!biggest || cell.mass > biggest.mass) biggest = cell;
      }
      if (!biggest) continue;
      biggest.mass = Math.max(24, biggest.mass - total * 0.0035 * dt);
    }
  }

  private driftPellets(dt: number): void {
    for (const pellet of this.pellets) {
      if (pellet.safe > 0) pellet.safe -= dt;
      pellet.x += pellet.vx * dt;
      pellet.y += pellet.vy * dt;
      const drag = Math.exp(-1.7 * dt);
      pellet.vx *= drag;
      pellet.vy *= drag;
    }
  }

  private respawn(): void {
    for (const player of this.players) {
      if (player.alive || player.respawnAt > this.time) continue;
      const spot = this.spawnPoint();
      player.alive = true;
      player.respawnAt = 0;
      player.lastX = spot.x;
      player.lastY = spot.y;
      player.targetX = spot.x + player.aimX * 200;
      player.targetY = spot.y + player.aimY * 200;
      this.cells.push(this.makeCell(player, spot.x, spot.y, START_MASS, 0, 0));
    }
  }

  private refillFood(): void {
    let guard = 0;
    while (this.foods.length < FOOD_N && guard < 12) {
      this.spawnFood();
      guard += 1;
    }
  }

  private massOf(id: number): number {
    let mass = 0;
    for (const cell of this.cells) if (cell.owner === id) mass += cell.mass;
    return mass;
  }

  private pushFeed(text: string): void {
    this.feed.unshift({ id: this.feedSeq++, text });
    if (this.feed.length > 5) this.feed.pop();
  }
}

function canEngulf(aMass: number, aR: number, bMass: number, _bR: number, dist: number): boolean {
  if (!(aMass > bMass * 1.12)) return false;
  return dist < aR * 0.94;
}

function randomInCircle(radius: number): { x: number; y: number } {
  const t = Math.random() * Math.PI * 2;
  const u = Math.sqrt(Math.random()) * radius;
  return { x: Math.cos(t) * u, y: Math.sin(t) * u };
}

export function copyWeights(weights: Weights): Weights {
  return { ...weights };
}
