// ============================================================
// NRIG · 程序化像素纹理工坊（原创体素资产，对应 ADR-005）
// 全部为 16×16 代码生成纹理，不使用任何 Minecraft 官方素材。
// ============================================================

import * as THREE from 'three'

const SIZE = 16

/** 确定性像素哈希，保证每次加载纹理一致 */
function ph(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Ctx = CanvasRenderingContext2D

function pick<T>(arr: T[], r: number): T {
  return arr[Math.min(arr.length - 1, Math.floor(r * arr.length))]
}

function fillNoise(ctx: Ctx, palette: string[], seed: number) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = pick(palette, ph(x, y, seed))
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function speckle(ctx: Ctx, color: string, count: number, seed: number, w = 1) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(ph(i, 7, seed) * (SIZE - w))
    const y = Math.floor(ph(i, 13, seed) * (SIZE - w))
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, w)
  }
}

function makeTex(name: string, draw: (ctx: Ctx) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  draw(ctx)
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.name = name
  return tex
}

// ---------------- 调色板 ----------------
const GRASS_TOP = ['#79b74c', '#6fad43', '#83c156', '#66a23c', '#74b248']
const DIRT = ['#8a5f3c', '#7d5535', '#946545', '#6e4b2e', '#855a38']
const STONE = ['#7d7d7d', '#858585', '#747474', '#8e8e8e', '#6c6c6c']
const SAND = ['#dcd29f', '#d5ca8f', '#e2d9ab', '#cec487']
const GRAVEL = ['#8a837c', '#9c948c', '#6f6a64', '#a89e92', '#7c756e']
const PLANKS = ['#a2804d', '#967652', '#ac8a55', '#8a6c40']
const LOG_SIDE = ['#6b5230', '#5d472a', '#77603a', '#4f3d24']
const LEAVES = ['#3c6e1e', '#35631a', '#447a24', '#2d5715']
const BEDROCK = ['#3a3a3a', '#565656', '#222222', '#6b6b6b', '#101010']
const SNOW = ['#f2fbfb', '#e6f2f2', '#ffffff', '#ddecec']
const NETHERRACK = ['#6e2727', '#7d3030', '#5a1f1f', '#823939']
const OBSIDIAN = ['#150f1f', '#1d1430', '#0d0a14', '#241a3d']
const STONEBRICK = ['#7a7a7a', '#858585', '#6e6e6e']
const LAVA = ['#e25822', '#f07b1d', '#c33e10', '#ffa53c']
const WATER = ['#3f76e4', '#3467d6', '#4a82ee', '#2f5ec2']

// ---------------- 纹理绘制 ----------------

function drawGrassTop(ctx: Ctx) {
  fillNoise(ctx, GRASS_TOP, 1)
  speckle(ctx, '#5c9133', 14, 2)
}

function drawDirt(ctx: Ctx) {
  fillNoise(ctx, DIRT, 3)
  speckle(ctx, '#5e3f24', 10, 4)
  speckle(ctx, '#a4785a', 6, 5)
}

function drawGrassSide(ctx: Ctx) {
  fillNoise(ctx, DIRT, 3)
  speckle(ctx, '#5e3f24', 8, 4)
  for (let x = 0; x < SIZE; x++) {
    const depth = 2 + Math.floor(ph(x, 0, 6) * 3)
    for (let y = 0; y < depth; y++) {
      ctx.fillStyle = pick(GRASS_TOP, ph(x, y, 7))
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function drawStone(ctx: Ctx) {
  fillNoise(ctx, STONE, 8)
  speckle(ctx, '#5f5f5f', 8, 9)
  speckle(ctx, '#989898', 6, 10)
}

function drawCobble(ctx: Ctx) {
  fillNoise(ctx, STONE, 11)
  ctx.fillStyle = '#4a4a4a'
  for (let i = 0; i <= SIZE; i += 5) {
    for (let x = 0; x < SIZE; x++) ctx.fillRect(x, (i + Math.floor(ph(x, i, 12) * 2)) % SIZE, 1, 1)
    for (let y = 0; y < SIZE; y++) ctx.fillRect((i + Math.floor(ph(i, y, 13) * 2)) % SIZE, y, 1, 1)
  }
}

function drawPlanks(ctx: Ctx) {
  const shades = PLANKS
  for (let row = 0; row < 4; row++) {
    for (let y = row * 4; y < row * 4 + 4; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = pick(shades, ph(x, y, 14))
        ctx.fillRect(x, y, 1, 1)
      }
    }
    ctx.fillStyle = '#5e4626'
    for (let x = 0; x < SIZE; x++) ctx.fillRect(x, row * 4, 1, 1)
    const joint = Math.floor(ph(row, 0, 15) * SIZE)
    for (let y = row * 4; y < row * 4 + 4; y++) ctx.fillRect(joint, y, 1, 1)
  }
}

function drawLogSide(ctx: Ctx) {
  for (let x = 0; x < SIZE; x++) {
    const band = Math.floor(ph(x, 0, 16) * LOG_SIDE.length)
    for (let y = 0; y < SIZE; y++) {
      ctx.fillStyle = LOG_SIDE[(band + (ph(x, y, 17) > 0.85 ? 1 : 0)) % LOG_SIDE.length]
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function drawLogTop(ctx: Ctx) {
  fillNoise(ctx, ['#b59a68', '#ab8f5e', '#c0a473'], 18)
  const rings = ['#6b5230', '#b59a68']
  for (let r = 0; r < 7; r++) {
    ctx.fillStyle = rings[r % 2]
    ctx.fillRect(r, r, SIZE - 2 * r, 1)
    ctx.fillRect(r, SIZE - 1 - r, SIZE - 2 * r, 1)
    ctx.fillRect(r, r, 1, SIZE - 2 * r)
    ctx.fillRect(SIZE - 1 - r, r, 1, SIZE - 2 * r)
  }
}

function drawLeaves(ctx: Ctx) {
  fillNoise(ctx, LEAVES, 19)
  speckle(ctx, '#1e3d0c', 22, 20)
  speckle(ctx, '#558c2e', 10, 21)
}

function drawBedrock(ctx: Ctx) {
  for (let y = 0; y < SIZE; y += 2)
    for (let x = 0; x < SIZE; x += 2) {
      ctx.fillStyle = pick(BEDROCK, ph(x / 2, y / 2, 22))
      ctx.fillRect(x, y, 2, 2)
    }
}

function drawSand(ctx: Ctx) {
  fillNoise(ctx, SAND, 23)
  speckle(ctx, '#bfb276', 8, 24)
}

function drawGravel(ctx: Ctx) {
  fillNoise(ctx, GRAVEL, 25)
  speckle(ctx, '#5c564f', 8, 26)
}

function drawSnow(ctx: Ctx) {
  fillNoise(ctx, SNOW, 27)
  speckle(ctx, '#cfe3e3', 6, 28)
}

function drawNetherrack(ctx: Ctx) {
  fillNoise(ctx, NETHERRACK, 29)
  speckle(ctx, '#451414', 14, 30)
}

function drawObsidian(ctx: Ctx) {
  fillNoise(ctx, OBSIDIAN, 31)
  speckle(ctx, '#3d2a66', 5, 32)
}

function drawStoneBrick(ctx: Ctx) {
  fillNoise(ctx, STONEBRICK, 33)
  ctx.fillStyle = '#4f4f4f'
  for (let y = 3; y < SIZE; y += 4) for (let x = 0; x < SIZE; x++) ctx.fillRect(x, y, 1, 1)
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 7 : 3
    for (let x = off; x < SIZE; x += 8)
      for (let y = row * 4; y < row * 4 + 3; y++) ctx.fillRect(x, y, 1, 1)
  }
}

function drawLava(ctx: Ctx) {
  fillNoise(ctx, LAVA, 34)
  speckle(ctx, '#ffd75e', 12, 35)
  speckle(ctx, '#8c2408', 10, 36)
}

function drawWater(ctx: Ctx) {
  fillNoise(ctx, WATER, 37)
  speckle(ctx, '#5e97f2', 10, 38)
}

function drawOre(base: 'stone' | 'netherrack', color: string, hi: string) {
  return (ctx: Ctx) => {
    if (base === 'stone') drawStone(ctx)
    else drawNetherrack(ctx)
    const clusters = 5
    for (let i = 0; i < clusters; i++) {
      const cx = 1 + Math.floor(ph(i, 3, 40) * 12)
      const cy = 1 + Math.floor(ph(i, 9, 41) * 12)
      ctx.fillStyle = color
      ctx.fillRect(cx, cy, 2, 2)
      ctx.fillRect(cx - 1, cy + 1, 1, 1)
      ctx.fillRect(cx + 2, cy + 1, 1, 1)
      ctx.fillStyle = hi
      ctx.fillRect(cx, cy, 1, 1)
    }
  }
}

function drawLamp(on: boolean) {
  return (ctx: Ctx) => {
    const base = on ? ['#ffd75e', '#ffec9e', '#f0b93c', '#e8a52e'] : ['#7a5a2e', '#6b4e26', '#86652f', '#5d441f']
    fillNoise(ctx, base, on ? 42 : 43)
    ctx.fillStyle = on ? '#c88a1e' : '#3f2e14'
    for (let i = 0; i < SIZE; i++) {
      ctx.fillRect(i, 0, 1, 1)
      ctx.fillRect(i, SIZE - 1, 1, 1)
      ctx.fillRect(0, i, 1, 1)
      ctx.fillRect(SIZE - 1, i, 1, 1)
    }
    ctx.fillStyle = on ? '#fff3c0' : '#523c1c'
    for (let i = 2; i < SIZE - 2; i++) {
      ctx.fillRect(i, i, 1, 1)
      ctx.fillRect(SIZE - 1 - i, i, 1, 1)
    }
  }
}

function drawGlowstone(ctx: Ctx) {
  fillNoise(ctx, ['#ffdf8a', '#f7b955', '#ffeec0', '#d8963a'], 44)
  speckle(ctx, '#fff8dc', 16, 45)
  speckle(ctx, '#b8762e', 8, 46)
}

function drawRail(ctx: Ctx) {
  drawPlanks(ctx)
  // 枕木
  ctx.fillStyle = '#5e4626'
  for (let y = 1; y < SIZE; y += 4) for (let x = 1; x < SIZE - 1; x++) ctx.fillRect(x, y, 1, 2)
  // 铁轨
  ctx.fillStyle = '#9a9a9a'
  for (let y = 0; y < SIZE; y++) {
    ctx.fillRect(3, y, 1, 1)
    ctx.fillRect(12, y, 1, 1)
  }
  ctx.fillStyle = '#c8c8c8'
  for (let y = 0; y < SIZE; y += 2) {
    ctx.fillRect(3, y, 1, 1)
    ctx.fillRect(12, y, 1, 1)
  }
}

function drawWool(color: string, dark: string) {
  return (ctx: Ctx) => {
    fillNoise(ctx, [color, color, dark], 47)
  }
}

// ---------------- 纹理注册表 ----------------

const cache = new Map<string, THREE.CanvasTexture>()

export function tex(name: string): THREE.CanvasTexture {
  const hit = cache.get(name)
  if (hit) return hit
  const t = createTex(name)
  cache.set(name, t)
  return t
}

function createTex(name: string): THREE.CanvasTexture {
  switch (name) {
    case 'grass_top': return makeTex(name, drawGrassTop)
    case 'grass_side': return makeTex(name, drawGrassSide)
    case 'dirt': return makeTex(name, drawDirt)
    case 'stone': return makeTex(name, drawStone)
    case 'cobble': return makeTex(name, drawCobble)
    case 'planks': return makeTex(name, drawPlanks)
    case 'log_side': return makeTex(name, drawLogSide)
    case 'log_top': return makeTex(name, drawLogTop)
    case 'leaves': return makeTex(name, drawLeaves)
    case 'bedrock': return makeTex(name, drawBedrock)
    case 'sand': return makeTex(name, drawSand)
    case 'gravel': return makeTex(name, drawGravel)
    case 'snow': return makeTex(name, drawSnow)
    case 'netherrack': return makeTex(name, drawNetherrack)
    case 'obsidian': return makeTex(name, drawObsidian)
    case 'stonebrick': return makeTex(name, drawStoneBrick)
    case 'lava': return makeTex(name, drawLava)
    case 'water': return makeTex(name, drawWater)
    case 'glowstone': return makeTex(name, drawGlowstone)
    case 'rail': return makeTex(name, drawRail)
    case 'lamp_on': return makeTex(name, drawLamp(true))
    case 'lamp_off': return makeTex(name, drawLamp(false))
    case 'ore_coal': return makeTex(name, drawOre('stone', '#2b2b2b', '#4a4a4a'))
    case 'ore_iron': return makeTex(name, drawOre('stone', '#d8af93', '#f0d0b8'))
    case 'ore_gold': return makeTex(name, drawOre('stone', '#fce94e', '#fff8b0'))
    case 'ore_diamond': return makeTex(name, drawOre('stone', '#5ff5e8', '#c0fff8'))
    case 'ore_redstone': return makeTex(name, drawOre('stone', '#e82e2e', '#ff8a8a'))
    case 'ore_emerald': return makeTex(name, drawOre('stone', '#3ddc50', '#a0ffb0'))
    case 'ore_lapis': return makeTex(name, drawOre('stone', '#3450c8', '#6a86e8'))
    case 'wool_red': return makeTex(name, drawWool('#b02e26', '#8f241e'))
    case 'wool_blue': return makeTex(name, drawWool('#35399d', '#2a2d7d'))
    case 'wool_green': return makeTex(name, drawWool('#5e7c16', '#4a6211'))
    case 'wool_yellow': return makeTex(name, drawWool('#f9c628', '#d4a51e'))
    case 'wool_purple': return makeTex(name, drawWool('#792aac', '#5f2088'))
    case 'wool_white': return makeTex(name, drawWool('#e9ecec', '#c6cbcb'))
    case 'wool_black': return makeTex(name, drawWool('#1e1b1b', '#100e0e'))
    case 'wool_orange': return makeTex(name, drawWool('#f07613', '#c45e0e'))
    default: return makeTex('stone', drawStone)
  }
}

// ---------------- 文字纹理（数字方块/名牌） ----------------

const textCache = new Map<string, THREE.CanvasTexture>()

export interface TextTexOpts {
  size?: number // canvas px
  color?: string
  bg?: string | null
  fontPx?: number
  border?: string | null
}

export function textTexture(text: string, opts: TextTexOpts = {}): THREE.CanvasTexture {
  const key = `${text}|${JSON.stringify(opts)}`
  const hit = textCache.get(key)
  if (hit) return hit
  const size = opts.size ?? 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  if (opts.bg) {
    ctx.fillStyle = opts.bg
    ctx.fillRect(0, 0, size, size)
  }
  if (opts.border) {
    ctx.strokeStyle = opts.border
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, size - 4, size - 4)
  }
  ctx.fillStyle = opts.color ?? '#ffffff'
  ctx.font = `bold ${opts.fontPx ?? Math.floor(size * 0.55)}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 3
  ctx.shadowBlur = 0
  ctx.fillText(text, size / 2, size / 2 + 2)
  const t = new THREE.CanvasTexture(canvas)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.LinearFilter
  t.colorSpace = THREE.SRGBColorSpace
  textCache.set(key, t)
  return t
}

/** MC 风格悬浮名牌 Sprite */
export function makeLabelSprite(text: string, color = '#ffffff', scale = 1): THREE.Sprite {
  const t = textTexture(text, { size: 128, color, bg: 'rgba(16,16,16,0.72)', fontPx: 56 })
  const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(2.2 * scale, 2.2 * scale, 1)
  return sprite
}

// ---------------- CSS 背景用 dataURL ----------------

let dirtUrl: string | null = null
export function dirtBgDataUrl(): string {
  if (dirtUrl) return dirtUrl
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  drawDirt(canvas.getContext('2d')!)
  dirtUrl = canvas.toDataURL()
  return dirtUrl
}

let stoneUrl: string | null = null
export function stoneBgDataUrl(): string {
  if (stoneUrl) return stoneUrl
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  drawStone(canvas.getContext('2d')!)
  stoneUrl = canvas.toDataURL()
  return stoneUrl
}
