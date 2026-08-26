/**
 * Deterministic PRNG (mulberry32) so demo data is reproducible across runs/environments.
 */
export function createRng(seed: number) {
  let state = seed >>> 0
  return function next(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof createRng>

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

export function pickMany<T>(rng: Rng, items: readonly T[], count: number): T[] {
  const pool = [...items]
  const result: T[] = []
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}
