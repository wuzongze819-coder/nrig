// ============================================================
// NRIG · 体素舞台：渲染器 / 相机 / 交互射线 / 粒子
// ============================================================

import * as THREE from 'three'
import { makeLabelSprite } from './textures'

export interface Particle {
  mesh: THREE.Mesh
  vel: THREE.Vector3
  life: number
  maxLife: number
  gravity: number
}

export class Stage {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  readonly world = new THREE.Group() // 关卡内容根节点
  private clock = new THREE.Clock()
  private raf = 0
  private tickers = new Set<(dt: number, t: number) => void>()
  private clickables: { obj: THREE.Object3D; cb: () => void }[] = []
  private raycaster = new THREE.Raycaster()
  private particles: Particle[] = []
  private particleRoot = new THREE.Group()
  private container: HTMLElement
  private resizeObs: ResizeObserver
  reducedMotion = false

  // 相机环绕（轻微拖拽视角）
  private baseAzimuth: number
  private azimuth: number
  private camDist: number
  private camHeight: number
  private target = new THREE.Vector3()
  private dragging = false
  private dragStartX = 0
  private dragStartAzimuth = 0
  private dragMoved = 0

  constructor(container: HTMLElement, opts: { sky?: number; fogDensity?: number } = {}) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.imageRendering = 'pixelated'

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(opts.sky ?? 0x7fb8e8)
    if (opts.fogDensity) this.scene.fog = new THREE.FogExp2(opts.sky ?? 0x7fb8e8, opts.fogDensity)

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    this.baseAzimuth = Math.PI / 4
    this.azimuth = this.baseAzimuth
    this.camDist = 14
    this.camHeight = 9

    const ambient = new THREE.AmbientLight(0xffffff, 0.75)
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.6)
    sun.position.set(8, 16, 6)
    this.scene.add(ambient, sun)

    this.scene.add(this.world)
    this.scene.add(this.particleRoot)

    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(container)
    this.resize()

    const el = this.renderer.domElement
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)

    this.loop()
  }

  setCamera(dist: number, height: number, azimuth: number, target: [number, number, number]) {
    this.camDist = dist
    this.camHeight = height
    this.baseAzimuth = azimuth
    this.azimuth = azimuth
    this.target.set(...target)
  }

  setSky(color: number, fogDensity?: number) {
    this.scene.background = new THREE.Color(color)
    this.scene.fog = fogDensity ? new THREE.FogExp2(color, fogDensity) : null
  }

  setSun(intensity: number, ambient: number, color = 0xfff2d8) {
    for (const l of this.scene.children) {
      if (l instanceof THREE.DirectionalLight) {
        l.intensity = intensity
        l.color.set(color)
      }
      if (l instanceof THREE.AmbientLight) l.intensity = ambient
    }
  }

  add(obj: THREE.Object3D) {
    this.world.add(obj)
    return obj
  }

  remove(obj: THREE.Object3D) {
    this.world.remove(obj)
  }

  addTicker(fn: (dt: number, t: number) => void) {
    this.tickers.add(fn)
    return () => this.tickers.delete(fn)
  }

  addClickable(obj: THREE.Object3D, cb: () => void) {
    this.clickables.push({ obj, cb })
    return () => {
      this.clickables = this.clickables.filter((c) => c.obj !== obj)
    }
  }

  /** 正确/庆祝粒子爆发（方块碎屑） */
  burst(pos: THREE.Vector3, colors: number[], n = 18, speed = 4, gravity = 9) {
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12)
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }),
      )
      m.position.copy(pos)
      const a = Math.random() * Math.PI * 2
      const up = Math.random() * speed * 0.9 + speed * 0.3
      const out = Math.random() * speed * 0.6
      const vel = new THREE.Vector3(Math.cos(a) * out, up, Math.sin(a) * out)
      const life = 0.7 + Math.random() * 0.5
      this.particleRoot.add(m)
      this.particles.push({ mesh: m, vel, life, maxLife: life, gravity })
    }
  }

  /** 漂浮文字（伤害数字 / 反馈） */
  floatText(pos: THREE.Vector3, text: string, color = '#ffffff') {
    const sprite = makeLabelSprite(text, color, 1.1)
    sprite.position.copy(pos)
    this.particleRoot.add(sprite)
    const start = performance.now()
    const off = this.addTicker(() => {
      const k = (performance.now() - start) / 1200
      sprite.position.y = pos.y + k * 1.6
      sprite.material.opacity = 1 - k
      if (k >= 1) {
        this.particleRoot.remove(sprite)
        off()
      }
    })
  }

  private onDown = (e: PointerEvent) => {
    this.dragging = true
    this.dragStartX = e.clientX
    this.dragStartAzimuth = this.azimuth
    this.dragMoved = 0
  }

  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return
    const dx = e.clientX - this.dragStartX
    this.dragMoved = Math.max(this.dragMoved, Math.abs(dx))
    this.azimuth = THREE.MathUtils.clamp(
      this.dragStartAzimuth - dx * 0.004,
      this.baseAzimuth - 0.6,
      this.baseAzimuth + 0.6,
    )
  }

  private onUp = (e: PointerEvent) => {
    const wasClick = this.dragging && this.dragMoved < 6
    this.dragging = false
    if (!wasClick) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(ndc, this.camera)
    const objs = this.clickables.map((c) => c.obj)
    const hits = this.raycaster.intersectObjects(objs, true)
    if (hits.length > 0) {
      let o: THREE.Object3D | null = hits[0].object
      while (o) {
        const entry = this.clickables.find((c) => c.obj === o)
        if (entry) {
          entry.cb()
          return
        }
        o = o.parent
      }
    }
  }

  private resize() {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime

    // 相机：基础方位 + 轻微呼吸感
    const sway = this.reducedMotion ? 0 : Math.sin(t * 0.3) * 0.02
    const az = this.azimuth + sway
    this.camera.position.set(
      this.target.x + Math.sin(az) * this.camDist,
      this.target.y + this.camHeight,
      this.target.z + Math.cos(az) * this.camDist,
    )
    this.camera.lookAt(this.target)

    for (const fn of this.tickers) fn(dt, t)

    // 粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      p.vel.y -= p.gravity * dt
      p.mesh.position.addScaledVector(p.vel, dt)
      p.mesh.rotation.x += dt * 4
      p.mesh.rotation.y += dt * 5
      if (p.life <= 0) {
        this.particleRoot.remove(p.mesh)
        this.particles.splice(i, 1)
      }
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.resizeObs.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onDown)
    el.removeEventListener('pointermove', this.onMove)
    el.removeEventListener('pointerup', this.onUp)
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry?.dispose?.()
      }
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
