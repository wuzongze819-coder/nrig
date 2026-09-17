// ============================================================
// NRIG · QGS 题目生成器（浏览器本地，确定性种子驱动）
// 对应 Design §6：生成 QuestionCore → 真值 → 干扰项 → 提示
// 简化实现：QuestionCore 即各世界的题目对象，可凭 seed 重放。
// ============================================================

import { RngStream } from './rng'
import { toBase, fromBase, baseZh, baseEn, sub, expand, groupBits, padLeft, legalDigits, isLegalInBase, DIGITS } from './bases'
import type { LevelDef } from './levels'

// ---------------- 题型定义 ----------------

export interface W1Q {
  world: 1
  kind: 'build' | 'read'
  base: number
  value: number
  digits: number
  weights: boolean
  prompt: string
  hint: string
}

export interface W2Q {
  world: 2
  kind: 'set' | 'read'
  bits: number
  value: number
  readout: boolean
  prompt: string
  hint: string
}

export type W3Kind = 'bin2hex' | 'bin2oct' | 'hex2bin' | 'oct2bin' | 'pad' | 'oct2hex' | 'hex2oct'

export interface W3Q {
  world: 3
  kind: W3Kind
  bits: number
  value: number
  padTarget: 3 | 4 // pad 题的对齐组宽
  prompt: string
  hint: string
}

export type W4Kind = 'hex2rgb' | 'rgb2hex' | 'char' | 'perm' | 'format' | 'equiv'

export interface W4Q {
  world: 4
  kind: W4Kind
  prompt: string
  hint: string
  // hex2rgb: 给出 hex，选颜色；rgb2hex: 给出颜色+通道十进制，写 hex
  rgb?: [number, number, number]
  colorOptions?: [number, number, number][] // hex2rgb 的 4 个候选颜色
  // char
  charCode?: number
  charGlyph?: string
  charToCode?: boolean // true: 给字符求编码; false: 给编码求字符
  charOptions?: string[]
  // perm
  permBits?: [boolean, boolean, boolean] // r w x
  permToDigit?: boolean
  permOptions?: string[] // 'rwx' 形式
  // format
  formatStr?: string
  formatBase?: number
  formatOptions?: number[] // bases
  // equiv
  equivValue?: number
  equivFromBase?: number
  equivOptions?: string[] // 每个是 "XX(b)" 文本
}

export type W5Kind = 'identify' | 'convert' | 'compare' | 'equiv' | 'illegal'

export interface W5Q {
  world: 5
  kind: W5Kind
  prompt: string
  hint: string
  display: string // 敌人身上显示的数字
  displayBase: number
  value: number
  options?: string[] // 选择题
  answer?: number | string // identify: base; convert: dec; compare: 'A'|'B'; equiv: 选项文本; illegal: 选项文本
  secondDisplay?: string
  secondBase?: number
  secondValue?: number
}

export type AnyQuestion = W1Q | W2Q | W3Q | W4Q | W5Q

// ---------------- 生成 ----------------

export function generateQuestions(level: LevelDef, attemptSeed: number): AnyQuestion[] {
  const rng = new RngStream([level.id, attemptSeed], 'QGS_CORE')
  const out: AnyQuestion[] = []
  for (let i = 0; i < level.count; i++) {
    out.push(genOne(level, rng, i))
  }
  return out
}

function genOne(level: LevelDef, rng: RngStream, _i: number): AnyQuestion {
  switch (level.world) {
    case 1: return genW1(level, rng)
    case 2: return genW2(level, rng)
    case 3: return genW3(level, rng)
    case 4: return genW4(level, rng)
    case 5: return genW5(level, rng)
    default: throw new Error('bad world')
  }
}

// ---------------- World 1 位权矿坑 ----------------

function genW1(level: LevelDef, rng: RngStream): W1Q {
  const cfg = level.cfg as { kinds: string[]; bases: number[]; maxValue: number; weights: boolean }
  const kind = rng.pick(cfg.kinds) as 'build' | 'read'
  const base = rng.pick(cfg.bases)
  const value = rng.int(1, cfg.maxValue as number)
  const digits = toBase(value, base).length
  const s = toBase(value, base)
  const parts = expand(value, base)
    .map((p) => `${p.digit}×${p.weight}`)
    .join(' + ')

  if (kind === 'build') {
    return {
      world: 1, kind, base, value, digits, weights: cfg.weights,
      prompt: `在建造台上放置数字方块，用${baseZh(base)}建造出数值 ${value}₁₀`,
      hint: `从最高位开始拆解：${value} = ${parts}（${baseZh(base)}）`,
    }
  }
  return {
    world: 1, kind, base, value, digits, weights: cfg.weights,
    prompt: `矿洞石壁上刻着 ${s}${sub(base)}，它的十进制值是多少？`,
    hint: `把每一位乘上它的位权再相加：${s}${sub(base)} = ${parts} = ${value}₁₀`,
  }
}

// ---------------- World 2 晶能电站 ----------------

function genW2(level: LevelDef, rng: RngStream): W2Q {
  const cfg = level.cfg as { kinds: string[]; bits: number; readout: boolean }
  const kind = rng.pick(cfg.kinds) as 'set' | 'read'
  const bits = cfg.bits
  const value = rng.int(1, Math.pow(2, bits) - 1)
  const bin = padLeft(toBase(value, 2), bits)
  const powers = Array.from({ length: bits }, (_, i) => Math.pow(2, bits - 1 - i)).join(' · ')

  if (kind === 'set') {
    return {
      world: 2, kind, bits, value, readout: cfg.readout,
      prompt: `目标能量读数：${value}₁₀。扳动 ${bits} 个晶体开关，点亮正确的二进制组合`,
      hint: `从大到小贪心：每盏灯的位权依次是 ${powers}。先点不超过 ${value} 的最大位权。`,
    }
  }
  return {
    world: 2, kind, bits, value, readout: true,
    prompt: `灯阵当前状态为 ${bin}₂。读出它的十进制能量值`,
    hint: `亮灯位置的位权相加：${powers}，只把亮灯（1）的位权加起来。`,
  }
}

// ---------------- World 3 进制交易村 ----------------

function genW3(level: LevelDef, rng: RngStream): W3Q {
  const cfg = level.cfg as { kinds: string[]; bits: number }
  const kind = rng.pick(cfg.kinds) as W3Kind
  const bits = cfg.bits

  if (kind === 'pad') {
    // 非整组长度 → 补零对齐后转换
    const padTarget = rng.pick([3, 4]) as 3 | 4
    const rawLen = padTarget * 2 - 1 // 例如 3→5bit, 4→7bit
    const value = rng.int(Math.pow(2, rawLen - 1), Math.pow(2, rawLen) - 1)
    const bin = toBase(value, 2)
    const targetBase = padTarget === 4 ? 16 : 8
    return {
      world: 3, kind, bits: rawLen, value, padTarget,
      prompt: `到货的 bit 串 ${bin}₂ 长度不是 ${padTarget} 的倍数。先向左补零对齐，再贴上 ${baseEn(targetBase)} 标签`,
      hint: `在左侧补 0 直到长度是 ${padTarget} 的倍数：${groupBits(bin, padTarget).join(' ')}，每组换成一位${baseZh(targetBase)}数字。`,
    }
  }

  if (kind === 'oct2hex' || kind === 'hex2oct') {
    const fromB = kind === 'oct2hex' ? 8 : 16
    const toB = kind === 'oct2hex' ? 16 : 8
    const value = rng.int(8, Math.pow(2, Math.min(bits, 10)) - 1)
    const s = toBase(value, fromB)
    const via = toBase(value, 2)
    return {
      world: 3, kind, bits, value, padTarget: 4,
      prompt: `跨港直达订单：${s}${sub(fromB)} 要换成${baseZh(toB)}文书（经由 BIN 中转）`,
      hint: `先把 ${s}${sub(fromB)} 每位拆成 bit：${via}₂，再按 ${toB === 16 ? 4 : 3} 位一组重新装箱。`,
    }
  }

  const value = rng.int(1, Math.pow(2, bits) - 1)
  const bin = padLeft(toBase(value, 2), bits)

  switch (kind) {
    case 'bin2hex': {
      const groups = groupBits(bin, 4)
      return {
        world: 3, kind, bits, value, padTarget: 4,
        prompt: `传送带送来 bit 串 ${bin}₂。按 4 位一组装箱，贴上 HEX 标签`,
        hint: `分组：${groups.join(' | ')}。每组 4 bit 正好是一位十六进制数字。`,
      }
    }
    case 'bin2oct': {
      const groups = groupBits(bin, 3)
      return {
        world: 3, kind, bits, value, padTarget: 3,
        prompt: `码头收到 bit 串 ${bin}₂。按 3 位一组装箱，贴上 OCT 标签`,
        hint: `分组：${groups.join(' | ')}。每组 3 bit 正好是一位八进制数字（0-7）。`,
      }
    }
    case 'hex2bin': {
      const hex = toBase(value, 16)
      return {
        world: 3, kind, bits, value, padTarget: 4,
        prompt: `HEX 货物 ${hex}₁₆ 到货。卸货：把每位拆成 4 个 bit`,
        hint: `${[...hex].map((c) => `${c}=${padLeft(toBase(DIGITS.indexOf(c), 2), 4)}`).join('，')}。按顺序拼起来。`,
      }
    }
    default: {
      // oct2bin
      const oct = toBase(value, 8)
      return {
        world: 3, kind: 'oct2bin', bits, value, padTarget: 3,
        prompt: `OCT 货物 ${oct}₈ 到货。卸货：把每位拆成 3 个 bit`,
        hint: `${[...oct].map((c) => `${c}=${padLeft(toBase(Number(c), 2), 3)}`).join('，')}。按顺序拼起来。`,
      }
    }
  }
}

// ---------------- World 4 编码遗迹 ----------------

const ASCII_CORE: [string, number][] = [
  ...'0123456789'.split('').map((c, i) => [c, 48 + i] as [string, number]),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => [c, 65 + i] as [string, number]),
]

function genW4(level: LevelDef, rng: RngStream): W4Q {
  const cfg = level.cfg as { kinds: string[]; novel?: boolean }
  const kind = rng.pick(cfg.kinds) as W4Kind

  switch (kind) {
    case 'hex2rgb': {
      const rgb: [number, number, number] = [rng.int(0, 255), rng.int(0, 255), rng.int(0, 255)]
      const hex = rgb.map((v) => padLeft(toBase(v, 16), 2)).join('')
      const options: [number, number, number][] = [rgb]
      while (options.length < 4) {
        const ch = rng.int(0, 2)
        const cand: [number, number, number] = [...rgb]
        cand[ch] = (cand[ch] + rng.pick([64, 96, 128, -64, -96, -128]) + 256) % 256
        if (!options.some((o) => o[0] === cand[0] && o[1] === cand[1] && o[2] === cand[2])) options.push(cand)
      }
      return {
        world: 4, kind, rgb, colorOptions: rng.shuffle(options),
        prompt: `祭坛铭文写着 #${hex}。哪一块圣石会点亮同样的颜色？`,
        hint: `#${hex} 即 R=${toBase(rgb[0], 16)}₁₆=${rgb[0]}₁₀，G=${toBase(rgb[1], 16)}₁₆=${rgb[1]}₁₀，B=${toBase(rgb[2], 16)}₁₆=${rgb[2]}₁₀。红绿蓝按这个比例混合。`,
      }
    }
    case 'rgb2hex': {
      const rgb: [number, number, number] = [rng.int(0, 255), rng.int(0, 255), rng.int(0, 255)]
      return {
        world: 4, kind, rgb,
        prompt: `祭坛光束的配方：R=${rgb[0]} G=${rgb[1]} B=${rgb[2]}（十进制）。写出它的 HEX 颜色编码 #______`,
        hint: `每个通道分别转成两位十六进制：${rgb.map((v) => `${v}₁₀=${padLeft(toBase(v, 16), 2)}₁₆`).join('，')}。`,
      }
    }
    case 'char': {
      const [glyph, code] = rng.pick(ASCII_CORE)
      const charToCode = rng.chance(0.5)
      if (charToCode) {
        return {
          world: 4, kind, charCode: code, charGlyph: glyph, charToCode: true,
          prompt: `字符石板上刻着 '${glyph}'。它的编码是 ${code}₁₀，写成两位 HEX？`,
          hint: `${code} = ${Math.floor(code / 16)}×16 + ${code % 16}，所以是 ${toBase(code, 16)}₁₆。`,
        }
      }
      const options = new Set<string>([glyph])
      while (options.size < 4) options.add(rng.pick(ASCII_CORE)[0])
      return {
        world: 4, kind, charCode: code, charGlyph: glyph, charToCode: false,
        charOptions: rng.shuffle([...options]),
        prompt: `石碑铭文 0x${toBase(code, 16)} 指向哪个字符？`,
        hint: `0x${toBase(code, 16)} = ${code}₁₀。编码表：0-9 从 48 开始，A-Z 从 65 开始。`,
      }
    }
    case 'perm': {
      const bits: [boolean, boolean, boolean] = [rng.chance(0.5), rng.chance(0.5), rng.chance(0.5)]
      const digit = (bits[0] ? 4 : 0) + (bits[1] ? 2 : 0) + (bits[2] ? 1 : 0)
      const permToDigit = rng.chance(0.5)
      if (permToDigit) {
        return {
          world: 4, kind, permBits: bits, permToDigit: true,
          prompt: `权限密室：读=${bits[0] ? '开' : '关'} 写=${bits[1] ? '开' : '关'} 执行=${bits[2] ? '开' : '关'}。门锁密码是几？（八进制一位）`,
          hint: `rwx 就是 3 个 bit：r=4, w=2, x=1。${bits[0] ? 4 : 0}+${bits[1] ? 2 : 0}+${bits[2] ? 1 : 0} = ${digit}。`,
        }
      }
      const mk = (d: number) => `${d & 4 ? 'r' : '-'}${d & 2 ? 'w' : '-'}${d & 1 ? 'x' : '-'}`
      const options = new Set<string>([mk(digit)])
      while (options.size < 4) options.add(mk(rng.int(0, 7)))
      return {
        world: 4, kind, permBits: bits, permToDigit: false, permOptions: rng.shuffle([...options]),
        prompt: `门锁刻着权限码 ${digit}₈。正确的 rwx 开关组合是？`,
        hint: `${digit}₈ = ${padLeft(toBase(digit, 2), 3)}₂，三位分别对应 r/w/x 开关。`,
      }
    }
    case 'format': {
      const base = rng.pick([2, 8, 16])
      const prefix = base === 2 ? '0b' : base === 8 ? '0o' : '0x'
      const value = rng.int(1, 255)
      return {
        world: 4, kind, formatStr: `${prefix}${toBase(value, base)}`, formatBase: base,
        formatOptions: [2, 8, 10, 16],
        prompt: `故障日志里有一行状态码 ${prefix}${toBase(value, base)}。它使用的是哪种进制？`,
        hint: `前缀约定：0b=二进制，0o=八进制，0x=十六进制，无前缀通常是十进制。`,
      }
    }
    default: {
      // equiv
      const value = rng.int(9, 255)
      const fromBase = rng.pick([2, 8, 10, 16])
      const correct = `${toBase(value, fromBase)}${sub(fromBase)}`
      const options = new Set<string>([correct])
      const otherBases = [2, 8, 10, 16].filter((b) => b !== fromBase)
      while (options.size < 4) {
        const mode = rng.chance(0.5)
        const wrongValue = mode ? value + rng.pick([-2, -1, 1, 2]) : value
        const wrongBase = mode ? fromBase : rng.pick(otherBases)
        options.add(`${toBase(Math.max(1, wrongValue), wrongBase)}${sub(wrongBase)}`)
      }
      return {
        world: 4, kind: 'equiv', equivValue: value, equivFromBase: fromBase,
        equivOptions: rng.shuffle([...options]),
        prompt: `遗迹中枢显示数值 ${value}₁₀。哪一块铭文与它等价？`,
        hint: `把每个选项都换算回十进制再比较。${value}₁₀ = ${toBase(value, 2)}₂ = ${toBase(value, 8)}₈ = ${toBase(value, 16)}₁₆。`,
      }
    }
  }
}

// ---------------- World 5 数字堡垒 ----------------

function prefixed(value: number, base: number): string {
  const s = toBase(value, base)
  if (base === 2) return `0b${s}`
  if (base === 8) return `0o${s}`
  if (base === 16) return `0x${s}`
  return s
}

function genW5(level: LevelDef, rng: RngStream): W5Q {
  const cfg = level.cfg as { kinds: string[]; bases: number[]; maxValue: number }
  const kind = rng.pick(cfg.kinds) as W5Kind
  const bases = cfg.bases

  switch (kind) {
    case 'identify': {
      const base = rng.pick(bases)
      const value = rng.int(2, Math.min(cfg.maxValue, 255))
      return {
        world: 5, kind, display: prefixed(value, base), displayBase: base, value,
        options: ['二进制', '八进制', '十进制', '十六进制'],
        answer: baseZh(base),
        prompt: '扫描敌人身上的编号——它使用的是哪种进制？',
        hint: '看前缀：0b=二进制，0o=八进制，0x=十六进制，无前缀=十进制。',
      }
    }
    case 'convert': {
      const base = rng.pick(bases)
      const value = rng.int(1, cfg.maxValue)
      return {
        world: 5, kind, display: prefixed(value, base), displayBase: base, value,
        answer: value,
        prompt: '把敌人身上的编号换算成十进制，输入炮台坐标开火！',
        hint: `${prefixed(value, base)} 是${baseZh(base)}。逐位乘位权相加，或分组结构换算。`,
      }
    }
    case 'compare': {
      const b1 = rng.pick(bases)
      const b2 = rng.pick(bases)
      let v1 = rng.int(1, cfg.maxValue)
      let v2 = rng.int(1, cfg.maxValue)
      if (v1 === v2) v2 = v1 + 1
      return {
        world: 5, kind,
        display: prefixed(v1, b1), displayBase: b1, value: v1,
        secondDisplay: prefixed(v2, b2), secondBase: b2, secondValue: v2,
        options: ['A', 'B'], answer: v1 > v2 ? 'A' : 'B',
        prompt: '两只敌人同时逼近！哪一只的威胁值更大？',
        hint: `都换算成十进制再比：${prefixed(v1, b1)}=${v1}₁₀，${prefixed(v2, b2)}=${v2}₁₀。`,
      }
    }
    case 'illegal': {
      const base = rng.pick([2, 8])
      const legal = legalDigits(base)
      const illegalDigit = rng.pick(DIGITS.slice(base, base === 2 ? 10 : base === 8 ? 9 : 10).split('').filter((c) => !legal.includes(c)))
      const pos = rng.int(0, 2)
      const good1 = toBase(rng.int(1, 63), base)
      const good2 = toBase(rng.int(1, 63), base)
      let bad = toBase(rng.int(10, 63), base)
      bad = bad.slice(0, pos) + illegalDigit + bad.slice(pos + 1)
      if (isLegalInBase(bad, base)) bad = bad.slice(0, pos) + (base === 2 ? '2' : '8') + bad.slice(pos + 1)
      const options = rng.shuffle([good1, good2, bad])
      return {
        world: 5, kind, display: '', displayBase: base, value: 0,
        options: options.map((o) => `${o}${sub(base)}`),
        answer: `${bad}${sub(base)}`,
        prompt: `幻象军团混入了一个假冒的${baseZh(base)}编号。找出非法的那个！`,
        hint: `${baseZh(base)}只允许数字 ${legal}。含有其它数字的一定是幻象。`,
      }
    }
    default: {
      // equiv
      const value = rng.int(9, Math.min(cfg.maxValue, 1023))
      const fromBase = rng.pick(bases)
      const correct = prefixed(value, fromBase)
      const options = new Set<string>([correct])
      while (options.size < 4) {
        const wb = rng.pick(bases)
        const wv = rng.chance(0.4) ? value : value + rng.pick([-17, -9, -1, 1, 9, 16])
        options.add(prefixed(Math.max(1, wv), wb))
      }
      // 保证唯一正确
      const list = rng.shuffle([...options]).filter((o, i, arr) => arr.indexOf(o) === i).slice(0, 4)
      if (!list.includes(correct)) list[0] = correct
      const seen = new Set<number>()
      const final = list.filter((o) => {
        const v = parsePrefixed(o)
        if (v === value) {
          if (seen.has(value)) return false
          seen.add(value)
          return true
        }
        return true
      })
      return {
        world: 5, kind: 'equiv', display: `${value}`, displayBase: 10, value,
        options: final, answer: correct,
        prompt: `城防核心锁定威胁值 ${value}₁₀。哪只敌人与它等价？优先击落！`,
        hint: `把每个选项换算成十进制。${value}₁₀ = 0b${toBase(value, 2)} = 0o${toBase(value, 8)} = 0x${toBase(value, 16)}。`,
      }
    }
  }
}

export function parsePrefixed(s: string): number {
  if (s.startsWith('0b')) return fromBase(s.slice(2), 2)
  if (s.startsWith('0o')) return fromBase(s.slice(2), 8)
  if (s.startsWith('0x')) return fromBase(s.slice(2), 16)
  return Number(s)
}
