// ============================================================
// NRIG · 体素方块构建助手
// ============================================================

import * as THREE from 'three'
import { tex, textTexture } from './textures'

const geoCache = new Map<number, THREE.BoxGeometry>()

export function boxGeo(size = 1): THREE.BoxGeometry {
  let g = geoCache.get(size)
  if (!g) {
    g = new THREE.BoxGeometry(size, size, size)
    geoCache.set(size, g)
  }
  return g
}

export function lambert(map: THREE.Texture, emissive = 0x000000, emissiveIntensity = 0): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    map,
    emissive: new THREE.Color(emissive),
    emissiveIntensity,
  })
}

const matCache = new Map<string, THREE.MeshLambertMaterial>()

export function mat(texName: string, emissive = 0x000000, emissiveIntensity = 0): THREE.MeshLambertMaterial {
  const key = `${texName}|${emissive}|${emissiveIntensity}`
  let m = matCache.get(key)
  if (!m) {
    m = lambert(tex(texName), emissive, emissiveIntensity)
    matCache.set(key, m)
  }
  return m
}

export interface BlockOpts {
  top?: string
  side?: string
  bottom?: string
  all?: string
  emissive?: number
  emissiveIntensity?: number
}

/** 标准方块：可指定 顶/侧/底 不同纹理（材质顺序 +x,-x,+y,-y,+z,-z） */
export function block(size = 1, opts: BlockOpts): THREE.Mesh {
  const side = opts.side ?? opts.all ?? 'stone'
  const top = opts.top ?? side
  const bottom = opts.bottom ?? side
  const e = opts.emissive ?? 0x000000
  const ei = opts.emissiveIntensity ?? 0
  const mats = [
    mat(side, e, ei),
    mat(side, e, ei),
    mat(top, e, ei),
    mat(bottom, e, ei),
    mat(side, e, ei),
    mat(side, e, ei),
  ]
  return new THREE.Mesh(boxGeo(size), mats)
}

/** 显示文字/数字的方块（所有面贴同一文字纹理） */
export function labelBlock(
  size: number,
  text: string,
  opts: { color?: string; bg?: string; emissive?: number; emissiveIntensity?: number } = {},
): THREE.Mesh {
  const t = textTexture(text, { color: opts.color ?? '#fff', bg: opts.bg ?? '#3a3a3a', size: 64 })
  const m = new THREE.MeshLambertMaterial({
    map: t,
    emissive: new THREE.Color(opts.emissive ?? 0x222222),
    emissiveIntensity: opts.emissiveIntensity ?? 0.6,
  })
  return new THREE.Mesh(boxGeo(size), m)
}

/** 数值平滑逼近动画助手 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, dt)
}
