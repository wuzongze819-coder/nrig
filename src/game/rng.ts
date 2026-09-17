// ============================================================
// NRIG · Deterministic RNG（对应 Design §23/§24）
// 所有题目随机性必须由 seed + substreamId + algorithmVersion 决定，
// 禁止直接使用 Math.random() 作为语义随机源。
// ============================================================

export const RNG_ALGORITHM_VERSION = 'mulberry32/v1'

export type RngNext = () => number

/** FNV-1a 32bit 字符串/数字混合哈希 → 种子 */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5
  const s = parts.join('|')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mulberry32(seed: number): RngNext {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 带 substream 的确定性随机流 */
export class RngStream {
  private next: RngNext
  constructor(seedParts: (string | number)[], substream: string) {
    this.next = mulberry32(hashSeed(RNG_ALGORITHM_VERSION, substream, ...seedParts))
  }
  float(): number {
    return this.next()
  }
  int(min: number, max: number): number {
    // 闭区间 [min, max]
    return min + Math.floor(this.next() * (max - min + 1))
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
  chance(p: number): boolean {
    return this.next() < p
  }
  shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}
