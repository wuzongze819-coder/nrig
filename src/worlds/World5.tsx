// ============================================================
// NRIG · World 5 数字堡垒：扫描、识别、防御（限时施压）
// 交互原语: SCAN / SELECT_TARGET / VERIFY / ATTACK / DEFEND
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { block } from '../three/voxel'
import { makeLabelSprite } from '../three/textures'
import type { W5Q } from '../game/qgs'
import { sfx } from '../game/audio'
import { Keypad, OptionGrid } from '../components/answer'
import type { WorldPlayProps } from './World1'

const START_Z = -9
const WALL_Z = 2.6

export function World5Play({ stage, engine, level }: WorldPlayProps) {
  const q = engine.question as W5Q
  const active = engine.phase === 'active'
  const cfg = level.cfg as { speed?: number }
  const speed = cfg.speed ?? 1

  // 每题预算：限时关用 timeLimit，否则由敌人速度推导
  const budget = level.timeLimit ?? Math.round(26 / speed)

  const [input, setInput] = useState('')
  const [progress, setProgress] = useState(0) // 0..1 敌人逼近度
  const progressRef = useRef(0)
  const submittedRef = useRef(false)

  useEffect(() => {
    setInput('')
    setProgress(0)
    progressRef.current = 0
    submittedRef.current = false
  }, [engine.idx])

  // ---------- 3D 敌人 ----------
  const enemyRef = useRef<THREE.Group | null>(null)
  const enemy2Ref = useRef<THREE.Group | null>(null)
  useEffect(() => {
    if (!stage) return
    const mkEnemy = (text: string, x: number, tag?: string): THREE.Group => {
      const g = new THREE.Group()
      const body = block(1.1, { all: 'wool_red' })
      body.position.y = 0.9
      // 眼睛
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
      for (const dx of [-0.25, 0.25]) {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.05), eyeMat)
        eye.position.set(dx, 1.05, 0.56)
        g.add(eye)
        const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), pupilMat)
        pupil.position.set(dx, 1.05, 0.58)
        g.add(pupil)
      }
      g.add(body)
      const label = makeLabelSprite(text, '#ff8a8a', 1.5)
      label.position.y = 2.3
      g.add(label)
      if (tag) {
        const tagS = makeLabelSprite(tag, '#ffd75e', 0.9)
        tagS.position.set(0, 3.2, 0)
        g.add(tagS)
      }
      g.position.set(x, 0, START_Z)
      stage.add(g)
      return g
    }

    const e1 = mkEnemy(q.display, q.kind === 'compare' ? -2 : 0, q.kind === 'compare' ? 'A' : undefined)
    enemyRef.current = e1
    let e2: THREE.Group | null = null
    if (q.kind === 'compare' && q.secondDisplay) {
      e2 = mkEnemy(q.secondDisplay, 2, 'B')
      enemy2Ref.current = e2
    }
    return () => {
      stage.remove(e1)
      if (e2) stage.remove(e2)
      enemyRef.current = null
      enemy2Ref.current = null
    }
  }, [stage, q, engine.idx])

  // 敌人推进
  useEffect(() => {
    if (!stage) return
    const off = stage.addTicker((dt) => {
      if (engine.phase !== 'active') return
      progressRef.current = Math.min(1, progressRef.current + dt / budget)
      setProgress(progressRef.current)
      const z = START_Z + progressRef.current * (WALL_Z - START_Z)
      for (const ref of [enemyRef, enemy2Ref]) {
        const g = ref.current
        if (g) {
          g.position.z = z
          g.position.y = Math.abs(Math.sin(progressRef.current * 20)) * 0.15
        }
      }
      if (progressRef.current >= 1 && !submittedRef.current) {
        submittedRef.current = true
        engine.submit(false, '敌人抵达城墙！堡垒受到冲击')
      }
    })
    return () => {
      off()
    }
  }, [stage, budget, engine])

  // 答对时爆炸
  useEffect(() => {
    if (engine.phase === 'feedback' && engine.lastOutcome?.correct && stage) {
      for (const ref of [enemyRef, enemy2Ref]) {
        const g = ref.current
        if (g) {
          stage.burst(g.position.clone().add(new THREE.Vector3(0, 1, 0)), [0xe05a5a, 0xff8a8a, 0xffd75e], 22)
          g.visible = false
        }
      }
      sfx.hit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.phase])

  const answer = useMemo(() => q.answer, [q])

  const pick = (opt: string) => {
    if (!active || submittedRef.current) return
    if (String(answer) === opt) {
      submittedRef.current = true
      engine.submit(true, victoryText(q.kind))
    } else {
      submittedRef.current = true
      engine.submit(false, wrongText(q.kind))
    }
  }

  const submitConvert = () => {
    if (!input || !active || submittedRef.current) return
    if (parseInt(input, 10) === q.value) {
      submittedRef.current = true
      engine.submit(true, `命中！${q.display} = ${q.value}₁₀，敌人被击毁`)
    } else {
      submittedRef.current = true
      engine.submit(false, `弹道偏移。${q.display} 的十进制值是 ${q.value}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 逼近度条 */}
      <div className="w-full max-w-md">
        <div className={`mc-timebar ${progress > 0.7 ? 'danger' : ''}`}>
          <div
            className="fill"
            style={{
              width: `${(1 - progress) * 100}%`,
              background: progress > 0.7 ? undefined : 'linear-gradient(#5ac8fa,#2a7fc4)',
            }}
          />
        </div>
        <div className="text-[10px] text-[#c8c8c8] font-zh mt-1 text-center mc-shadow-sm">
          敌人距离城墙 {Math.max(0, Math.ceil((1 - progress) * 10))} 格
        </div>
      </div>

      {q.kind === 'convert' ? (
        <div className="flex flex-col items-center gap-2">
          <div className="mc-panel px-6 py-2 text-2xl tracking-widest text-[#55ffff] mc-shadow">
            {input || '·'}
          </div>
          <Keypad
            keys={[...'0123456789']}
            disabled={!active}
            onKey={(k) => {
              if (k === '⌫') setInput((s) => s.slice(0, -1))
              else if (input.length < 5) setInput((s) => s + k)
            }}
            onSubmit={submitConvert}
            submitLabel="⚔ 开火"
          />
        </div>
      ) : (
        <OptionGrid
          options={q.options ?? []}
          disabled={!active}
          cols={q.kind === 'compare' ? 2 : Math.min(4, q.options?.length ?? 2)}
          onPick={pick}
        />
      )}
    </div>
  )
}

function victoryText(kind: W5Q['kind']): string {
  switch (kind) {
    case 'identify': return '扫描完成！格式识别正确，炮台锁定'
    case 'compare': return '威胁评估正确！优先目标已被击毁'
    case 'equiv': return '等价验证通过！真正的威胁被击毁'
    case 'illegal': return '幻象识破！假目标烟消云散'
    default: return '命中！'
  }
}

function wrongText(kind: W5Q['kind']): string {
  switch (kind) {
    case 'identify': return '识别错误！记住前缀：0b/0o/0x'
    case 'compare': return '评估错误。先把两个数都换算成十进制'
    case 'equiv': return '验证失败。把每个表示换算回十进制再比较'
    case 'illegal': return '被幻象骗了！检查每个数字是否在该进制合法'
    default: return '弹道偏移'
  }
}
