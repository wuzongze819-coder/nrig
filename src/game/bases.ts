// ============================================================
// NRIG · 进制数学内核（Domain 层，独立于任何表现）
// 通用位值公式: V = Σ d_i × b^i   (K06)
// ============================================================

export const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function toBase(n: number, base: number): string {
  return n.toString(base).toUpperCase()
}

export function fromBase(s: string, base: number): number {
  return parseInt(s, base)
}

/** 某基数下的合法数字字符集 (K03) */
export function legalDigits(base: number): string {
  return DIGITS.slice(0, base)
}

export function isLegalInBase(s: string, base: number): boolean {
  const legal = legalDigits(base)
  return s.length > 0 && [...s.toUpperCase()].every((c) => legal.includes(c))
}

const SUBSCRIPT: Record<number, string> = {
  2: '₂',
  3: '₃',
  4: '₄',
  5: '₅',
  6: '₆',
  7: '₇',
  8: '₈',
  10: '₁₀',
  16: '₁₆',
}

export function sub(base: number): string {
  return SUBSCRIPT[base] ?? `(${base})`
}

export const BASE_EN: Record<number, string> = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' }
export const BASE_ZH: Record<number, string> = {
  2: '二进制',
  8: '八进制',
  10: '十进制',
  16: '十六进制',
}

export function baseZh(base: number): string {
  return BASE_ZH[base] ?? `${base} 进制`
}

export function baseEn(base: number): string {
  return BASE_EN[base] ?? `B${base}`
}

/** 位值展开：低位在右。返回 [{digit, weight, position}]，position 0 = 最右 */
export interface PlaceDigit {
  digit: number
  weight: number
  position: number
}

export function expand(n: number, base: number): PlaceDigit[] {
  const s = toBase(n, base)
  return [...s].map((c, i) => {
    const position = s.length - 1 - i
    return { digit: DIGITS.indexOf(c), weight: Math.pow(base, position), position }
  })
}

/** 数字字符串 → 位值数组（高位在前） */
export function digitsOf(s: string): number[] {
  return [...s.toUpperCase()].map((c) => DIGITS.indexOf(c))
}

/** 左侧补零到 width (K04/K21) */
export function padLeft(s: string, width: number): string {
  return s.padStart(width, '0')
}

/** 按 groupSize 分组（从右往左，K20），自动补零到整组 */
export function groupBits(bits: string, groupSize: number): string[] {
  const width = Math.ceil(bits.length / groupSize) * groupSize
  const padded = padLeft(bits, width)
  const groups: string[] = []
  for (let i = 0; i < padded.length; i += groupSize) {
    groups.push(padded.slice(i, i + groupSize))
  }
  return groups
}

/** 格式化展示: "231" + 基数下标 */
export function fmt(s: string | number, base: number): string {
  return `${s}${sub(base)}`
}

/** 常用进制范围说明 */
export function maxValueForBits(bits: number): number {
  return Math.pow(2, bits) - 1
}
