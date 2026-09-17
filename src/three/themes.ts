// ============================================================
// NRIG · 五世界环境主题（装饰性场景，不影响数学真值）
// ============================================================

import * as THREE from 'three'
import { mulberry32, hashSeed } from '../game/rng'
import { Stage } from './stage'
import { block, mat } from './voxel'
import { textTexture } from './textures'

function ground(
  stage: Stage,
  rng: () => number,
  size: number,
  topName: string,
  opts: { patchy?: string; wallTop?: string } = {},
) {
  const half = Math.floor(size / 2)
  for (let x = -half; x <= half; x++) {
    for (let z = -half; z <= half; z++) {
      let name = topName
      if (opts.patchy && rng() < 0.18) name = opts.patchy
      const b = block(1, { top: name, side: name })
      b.position.set(x, -0.5, z)
      stage.add(b)
    }
  }
  // 边缘裙边
  const skirt = block(1, { all: 'dirt' })
  skirt.scale.set(size + 2, 0.6, size + 2)
  skirt.position.y = -1.3
  stage.add(skirt)
}

function tree(stage: Stage, rng: () => number, x: number, z: number) {
  const h = 3 + Math.floor(rng() * 2)
  for (let i = 0; i < h; i++) {
    const t = block(1, { side: 'log_side', top: 'log_top', bottom: 'log_top' })
    t.position.set(x, 0.5 + i, z)
    stage.add(t)
  }
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      for (let dy = 0; dy <= 1; dy++) {
        if (dx === 0 && dz === 0 && dy === 0) continue
        if (Math.abs(dx) + Math.abs(dz) + dy > 2) continue
        const l = block(1, { all: 'leaves' })
        l.position.set(x + dx, h + dy - 0.5, z + dz)
        stage.add(l)
      }
}

function torch(stage: Stage, x: number, y: number, z: number) {
  const stick = block(0.16, { all: 'log_side' })
  stick.scale.y = 4
  stick.position.set(x, y + 0.3, z)
  stage.add(stick)
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshLambertMaterial({ color: 0xffd75e, emissive: 0xffb830, emissiveIntensity: 1.4 }),
  )
  head.position.set(x, y + 0.75, z)
  stage.add(head)
  const light = new THREE.PointLight(0xffb830, 6, 7)
  light.position.set(x, y + 1, z)
  stage.add(light)
  stage.addTicker((_, t) => {
    light.intensity = 5.4 + Math.sin(t * 9 + x * 3) * 0.8
  })
}

function stoneWall(stage: Stage, rng: () => number, z: number, width: number, height: number, ores: string[]) {
  for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
    for (let y = 0; y < height; y++) {
      const isOre = rng() < 0.12
      const name = isOre ? ores[Math.floor(rng() * ores.length)] : rng() < 0.3 ? 'cobble' : 'stone'
      const b = block(1, { all: name })
      b.position.set(x, y + 0.5, z)
      stage.add(b)
    }
  }
}

// ---------------- World 1 位权矿坑 ----------------
export function buildWorld1Env(stage: Stage) {
  stage.setSky(0x87b7dc, 0.016)
  stage.setSun(1.5, 0.72)
  stage.setCamera(15, 8.5, Math.PI * 0.22, [0, 1.2, 0])
  const rng = mulberry32(hashSeed('decor', 1))
  ground(stage, rng, 16, 'grass_top', { patchy: 'gravel' })
  stoneWall(stage, rng, -7, 15, 6, ['ore_coal', 'ore_iron', 'ore_gold', 'ore_diamond'])
  // 矿洞木支架
  for (const x of [-4, 0, 4]) {
    for (const px of [-0.8, 0.8]) {
      const post = block(1, { side: 'log_side', top: 'log_top', bottom: 'log_top' })
      post.scale.set(0.4, 2.4, 0.4)
      post.position.set(x + px, 1.2, -5.6)
      stage.add(post)
    }
    const beam = block(1, { all: 'planks' })
    beam.scale.set(2.4, 0.35, 0.45)
    beam.position.set(x, 2.55, -5.6)
    stage.add(beam)
  }
  torch(stage, -6, 0, -5.4)
  torch(stage, 6, 0, -5.4)
  tree(stage, rng, -7.5, 3)
  tree(stage, rng, 7.5, 2)
  // 散落矿石
  for (let i = 0; i < 5; i++) {
    const o = block(0.8, { all: ['ore_gold', 'ore_iron', 'ore_diamond', 'ore_emerald', 'ore_redstone'][i] })
    o.position.set(-6 + i * 3, 0.4, 5.5 + (i % 2))
    o.rotation.y = rng() * 0.6
    stage.add(o)
  }
}

// ---------------- World 2 晶能电站 ----------------
export function buildWorld2Env(stage: Stage) {
  stage.setSky(0x0b0d1a, 0.02)
  stage.setSun(0.5, 0.5, 0x8fb0ff)
  stage.setCamera(13, 6.5, Math.PI * 0.15, [0, 1.6, -1])
  const rng = mulberry32(hashSeed('decor', 2))
  ground(stage, rng, 16, 'stone', { patchy: 'bedrock' })
  // 背墙
  stoneWall(stage, rng, -7, 15, 7, ['ore_redstone', 'ore_lapis'])
  // 电缆沟
  for (const z of [2.5, 4.5]) {
    for (let x = -7; x <= 7; x++) {
      const c = block(1, { all: 'wool_black' })
      c.scale.set(1, 0.12, 0.3)
      c.position.set(x, 0.03, z)
      stage.add(c)
    }
  }
  // 发光装饰柱
  for (const x of [-7, 7]) {
    for (let y = 0; y < 4; y++) {
      const p = block(1, { all: y === 3 ? 'glowstone' : 'obsidian' })
      p.position.set(x, 0.5 + y, -5)
      stage.add(p)
    }
    const l = new THREE.PointLight(0xffd75e, 8, 9)
    l.position.set(x, 4, -4.4)
    stage.add(l)
  }
  torch(stage, -3.5, 0, 5.5)
  torch(stage, 3.5, 0, 5.5)
}

// ---------------- World 3 进制交易村 ----------------
export function buildWorld3Env(stage: Stage) {
  stage.setSky(0x8ec9e8, 0.014)
  stage.setSun(1.6, 0.75)
  stage.setCamera(15, 8, Math.PI * 0.28, [0, 1, 0])
  const rng = mulberry32(hashSeed('decor', 3))
  ground(stage, rng, 16, 'grass_top', { patchy: 'dirt' })
  // 铁轨横穿
  for (let x = -8; x <= 8; x++) {
    const r = block(1, { top: 'rail', side: 'planks' })
    r.position.set(x, 0.02, -3)
    r.scale.y = 0.08
    stage.add(r)
  }
  // 矿车
  const cart = new THREE.Group()
  const body = block(1, { all: 'stone' })
  body.scale.set(1.4, 0.7, 0.9)
  const rim = block(1, { all: 'cobble' })
  rim.scale.set(1.55, 0.18, 1.0)
  rim.position.y = 0.4
  cart.add(body, rim)
  for (const [wx, wz] of [[-0.5, 0.45], [0.5, 0.45], [-0.5, -0.45], [0.5, -0.45]] as const) {
    const wheel = block(1, { all: 'bedrock' })
    wheel.scale.set(0.3, 0.3, 0.12)
    wheel.position.set(wx, -0.42, wz)
    cart.add(wheel)
  }
  cart.position.set(-4, 0.62, -3)
  stage.add(cart)
  stage.addTicker((_, t) => {
    cart.position.x = Math.sin(t * 0.35) * 5.5
    cart.position.y = 0.62 + Math.abs(Math.sin(t * 6)) * 0.02
  })
  // 货箱堆
  const crateSpots: [number, number, number][] = [[-6, 2, 0.5], [-5, 2.6, 0.5], [-5.5, 2.3, 1.5], [5.5, 3, 0.5], [6.3, 2.2, 0.5], [6, 1, 0.5]]
  for (const [x, z, y] of crateSpots) {
    const c = block(1, { all: 'planks' })
    c.position.set(x, y, z)
    c.rotation.y = rng() * 0.5
    stage.add(c)
  }
  // 小屋
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 3; y++)
      for (let z = 0; z < 4; z++) {
        const edge = x === 0 || x === 3 || z === 0 || z === 3
        if (!edge && y < 2) continue
        const corner = (x === 0 || x === 3) && (z === 0 || z === 3)
        const b = block(1, corner ? { side: 'log_side', top: 'log_top', bottom: 'log_top' } : { all: 'planks' })
        b.position.set(-8 + x, 0.5 + y, -7.5 + z)
        stage.add(b)
      }
  tree(stage, rng, 7.6, -6.5)
  tree(stage, rng, 3, 6.8)
  tree(stage, rng, -2.5, 6.5)
}

// ---------------- World 4 编码遗迹 ----------------
export function buildWorld4Env(stage: Stage) {
  stage.setSky(0x2a1f3d, 0.02)
  stage.setSun(0.7, 0.55, 0xc8b0ff)
  stage.setCamera(14, 7.5, Math.PI * 0.2, [0, 1.4, 0])
  const rng = mulberry32(hashSeed('decor', 4))
  ground(stage, rng, 16, 'sand', { patchy: 'stonebrick' })
  // 残破石柱
  const pillars: [number, number, number][] = [[-6, -5, 4], [6, -5, 3], [-7, 0, 2], [7, 1, 5], [-5, 5, 3], [5, 6, 2]]
  for (const [x, z, h] of pillars) {
    for (let y = 0; y < h; y++) {
      const p = block(1, { all: rng() < 0.2 ? 'obsidian' : 'stonebrick' })
      p.position.set(x, 0.5 + y, z)
      stage.add(p)
    }
    const cap = block(1, { all: 'stonebrick' })
    cap.scale.set(1.2, 0.25, 1.2)
    cap.position.set(x, h + 0.12, z)
    stage.add(cap)
  }
  // 中央祭坛
  for (const [s, y] of [[4, 0.15], [3, 0.45], [2, 0.75]] as const) {
    const step = block(1, { all: 'stonebrick' })
    step.scale.set(s, 0.3, s)
    step.position.set(0, y, -3)
    stage.add(step)
  }
  const beacon = block(1, { all: 'glowstone' })
  beacon.position.set(0, 1.4, -3)
  stage.add(beacon)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xb57ede,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  })
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.7, 14, 0.7), beamMat)
  beam.position.set(0, 8.4, -3)
  stage.add(beam)
  const bl = new THREE.PointLight(0xb57ede, 10, 12)
  bl.position.set(0, 2.4, -3)
  stage.add(bl)
  stage.addTicker((_, t) => {
    beamMat.opacity = 0.3 + Math.sin(t * 1.4) * 0.08
    beam.rotation.y = t * 0.4
  })
  torch(stage, -3, 0, 3)
  torch(stage, 3, 0, 3)
}

// ---------------- World 5 数字堡垒 ----------------
export function buildWorld5Env(stage: Stage) {
  stage.setSky(0x0b1026, 0.016)
  stage.setSun(0.45, 0.42, 0xa0b8ff)
  stage.setCamera(13, 7, Math.PI, [0, 1.2, -2]) // 从城墙向外看
  const rng = mulberry32(hashSeed('decor', 5))
  ground(stage, rng, 16, 'stone', { patchy: 'gravel' })
  // 月亮
  const moon = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({ map: textTexture('◼', { size: 32, color: '#f5f3ce' }), transparent: true }),
  )
  moon.position.set(-10, 12, -20)
  moon.lookAt(0, 2, 0)
  stage.add(moon)
  // 星星
  const starGeo = new THREE.BufferGeometry()
  const starPos = new Float32Array(60 * 3)
  for (let i = 0; i < 60; i++) {
    starPos[i * 3] = (rng() - 0.5) * 60
    starPos[i * 3 + 1] = 6 + rng() * 16
    starPos[i * 3 + 2] = -10 - rng() * 30
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true }),
  )
  stage.add(stars)
  // 进攻路径（碎石）
  for (let z = -8; z <= 3; z++) {
    const p = block(1, { top: 'gravel', side: 'gravel' })
    p.scale.set(2.6, 0.06, 1)
    p.position.set(0, 0.04, z)
    stage.add(p)
  }
  // 两侧岩浆沟
  for (const x of [-6.5, 6.5]) {
    const lava = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.2, 16),
      new THREE.MeshLambertMaterial({ map: mat('lava').map, emissive: 0xff6a00, emissiveIntensity: 0.9 }),
    )
    lava.position.set(x, 0.05, -2)
    stage.add(lava)
    const ll = new THREE.PointLight(0xff6a00, 5, 8)
    ll.position.set(x, 1, -2)
    stage.add(ll)
  }
  // 后方城墙剪影
  for (let x = -8; x <= 8; x++) {
    for (let y = 0; y < 3; y++) {
      const b = block(1, { all: 'stonebrick' })
      b.position.set(x, 0.5 + y, 5.5)
      stage.add(b)
    }
    if (x % 2 === 0) {
      const c = block(1, { all: 'stonebrick' })
      c.position.set(x, 3.5, 5.5)
      stage.add(c)
    }
  }
  torch(stage, -3, 3.6, 5.4)
  torch(stage, 3, 3.6, 5.4)
}

export function buildEnv(stage: Stage, worldId: number) {
  switch (worldId) {
    case 1: return buildWorld1Env(stage)
    case 2: return buildWorld2Env(stage)
    case 3: return buildWorld3Env(stage)
    case 4: return buildWorld4Env(stage)
    case 5: return buildWorld5Env(stage)
  }
}
