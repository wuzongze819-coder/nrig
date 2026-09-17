// ============================================================
// NRIG · 3D 方块图标：把体素方块渲染成 dataURL（物品栏风格）
// ============================================================

import * as THREE from 'three'
import { boxGeo, mat } from './voxel'

const iconCache = new Map<string, string>()

/** 渲染一个等距视角方块为 PNG dataURL */
export function blockIcon(top: string, side: string, size = 96): string {
  const key = `${top}|${side}|${size}`
  const hit = iconCache.get(key)
  if (hit) return hit

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
  renderer.setSize(size, size)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  cam.position.set(1.4, 1.35, 1.4)
  cam.lookAt(0, 0, 0)
  scene.add(new THREE.AmbientLight(0xffffff, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 1.8)
  sun.position.set(3, 5, 2)
  scene.add(sun)

  const sideM = mat(side)
  const cube = new THREE.Mesh(boxGeo(1.15), [sideM, sideM, mat(top), sideM, sideM, sideM])
  scene.add(cube)
  renderer.render(scene, cam)
  const url = renderer.domElement.toDataURL()
  renderer.dispose()
  iconCache.set(key, url)
  return url
}
