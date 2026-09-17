// ============================================================
// NRIG · World 1 位权矿坑：采矿 + 建造 + 合成
// 交互原语: PLACE_DIGIT_BLOCK / ASSEMBLE_NUMBER / READ
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Stage } from '../three/stage'
import { block, labelBlock } from '../three/voxel'
import { DIGITS, expand, legalDigits, toBase } from '../game/bases'
import type { W1Q } from '../game/qgs'
import type { Engine } from '../game/engine'
import type { LevelDef } from '../game/levels'
import { sfx } from '../game/audio'
import { Keypad, SlotRow } from '../components/answer'

export interface WorldPlayProps {
  stage: Stage | null
  engine: Engine
  level: LevelDef
}

export function World1Play({ stage, engine }: WorldPlayProps) {
  const q = engine.question as W1Q
  const active = engine.phase === 'active'

  // build 题的槽位状态
  const [placed, setPlaced] = useState<(string | null)[]>([])
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null)
  // read 题的输入
  const [input, setInput] = useState('')

  useEffect(() => {
    setPlaced(Array.from({ length: q.digits }, () => null))
    setInput('')
    setSelectedDigit(null)
  }, [engine.idx, q.digits])

  // ---------- 3D 道具 ----------
  const propsRef = useRef<THREE.Group | null>(null)
  useEffect(() => {
    if (!stage) return
    const root = new THREE.Group()
    stage.add(root)
    propsRef.current = root
    return () => {
      stage.remove(root)
      propsRef.current = null
    }
  }, [stage])

  // 重建场景道具
  useEffect(() => {
    const root = propsRef.current
    if (!root || !stage) return
    root.clear()

    if (q.kind === 'build') {
      // 建造台：一排基座 + 上方数字方块
      const n = q.digits
      const weights = expand(q.value, q.base).map((p) => p.weight)
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 1.5
        const pedestal = block(1, { top: 'stonebrick', side: 'stonebrick' })
        pedestal.scale.set(1, 0.5, 1)
        pedestal.position.set(x, 0.25, 2.2)
        root.add(pedestal)
        const d = placed[i]
        const cube = labelBlock(
          0.85,
          d ?? '?',
          d
            ? { color: '#ffe9a0', bg: '#4a3a1e', emissive: 0x553d10, emissiveIntensity: 0.8 }
            : { color: '#8a8a8a', bg: '#2a2a2a', emissive: 0x000000 },
        )
        cube.position.set(x, 1.35, 2.2)
        root.add(cube)
        if (q.weights) {
          const w = labelBlock(0.5, String(weights[i]), { color: '#ffd75e', bg: '#1a1a1a', emissive: 0x443300, emissiveIntensity: 0.7 })
          w.position.set(x, 0.62, 3.0)
          root.add(w)
        }
        // 点击基座：放置选中的数字 / 无选中则循环
        stage.addClickable(pedestal, () => {
          if (engine.phase !== 'active') return
          setPlaced((prev) => {
            const next = prev.slice()
            if (selectedDigit) {
              next[i] = selectedDigit
            } else {
              const legal = legalDigits(q.base)
              const cur = prev[i]
              next[i] = legal[(legal.indexOf(cur ?? '') + 1) % legal.length] ?? legal[0]
            }
            return next
          })
          sfx.place()
        })
        stage.addClickable(cube, () => {
          if (engine.phase !== 'active') return
          setPlaced((prev) => {
            const next = prev.slice()
            if (selectedDigit) {
              next[i] = selectedDigit
            } else {
              const legal = legalDigits(q.base)
              const cur = prev[i]
              next[i] = legal[(legal.indexOf(cur ?? '') + 1) % legal.length] ?? legal[0]
            }
            return next
          })
          sfx.place()
        })
      }
    } else {
      // read：石壁上刻着数字
      const s = toBase(q.value, q.base)
      const n = s.length
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 1.3
        const cube = labelBlock(1.1, s[i], { color: '#9fe8ff', bg: '#23303a', emissive: 0x1a3a4a, emissiveIntensity: 0.9 })
        cube.position.set(x, 2.4, -6.4)
        root.add(cube)
      }
      if (q.weights) {
        const weights = expand(q.value, q.base).map((p) => p.weight)
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * 1.3
          const w = labelBlock(0.5, String(weights[i]), { color: '#ffd75e', bg: '#1a1a1a' })
          w.position.set(x, 1.5, -6.4)
          root.add(w)
        }
      }
    }
  }, [stage, q, placed, selectedDigit, engine.phase])

  const palette = useMemo(() => [...legalDigits(q.base)], [q.base])

  const submitBuild = () => {
    if (placed.some((p) => p === null)) {
      engine.submit(false, '还有空槽位——每个位置都必须放置数字方块（没有就补 0）')
      return
    }
    const answer = placed.join('')
    const truth = toBase(q.value, q.base)
    if (answer === truth) {
      engine.submit(true, `建造完成！${truth}${q.base === 10 ? '₁₀' : ''} = ${q.value}₁₀`)
      if (stage) {
        const pos = new THREE.Vector3(0, 2, 2.2)
        stage.burst(pos, [0xffd75e, 0x55ff55, 0xffffff], 26)
      }
      sfx.levelup()
    } else if (placed[0] === '0') {
      engine.submit(false, '最高位不能是 0（前导零不改变数值）。重新想想需要几位？')
    } else {
      engine.submit(false, `数值不对。检查每一位：位权 × 数字 的总和要等于 ${q.value}`)
    }
  }

  const submitRead = () => {
    if (!input) return
    const v = parseInt(input, 10)
    if (v === q.value) {
      engine.submit(true, `正确！${toBase(q.value, q.base)} 的值就是 ${q.value}₁₀`)
      if (stage) stage.burst(new THREE.Vector3(0, 2.4, -6), [0x55ff55, 0x9fe8ff], 22)
    } else {
      engine.submit(false, '再算一次：每一位 × 位权，然后全部相加')
    }
  }

  // ---------- DOM 交互 ----------
  if (q.kind === 'build') {
    return (
      <div className="flex flex-col items-center gap-3">
        <SlotRow
          slots={placed}
          weights={expand(q.value, q.base).map((p) => p.weight)}
          showWeights={q.weights}
          base={q.base}
          disabled={!active}
          onSlotClick={(i) => {
            if (!active) return
            setPlaced((prev) => {
              const next = prev.slice()
              if (selectedDigit) {
                next[i] = selectedDigit
              } else {
                const cur = prev[i]
                next[i] = palette[(palette.indexOf(cur ?? '') + 1) % palette.length] ?? palette[0]
              }
              return next
            })
            sfx.place()
          }}
        />
        <div className="text-[11px] text-[#c8c8c8] mc-shadow-sm font-zh">
          选中数字方块，点击槽位放置（或直接点槽位循环）
        </div>
        <div className="mc-hotbar">
          {palette.map((d) => (
            <button
              key={d}
              className={`mc-slot ${selectedDigit === d ? 'selected' : ''}`}
              style={DIGITS.indexOf(d) >= 10 ? { color: '#ffd75e' } : undefined}
              disabled={!active}
              onClick={() => {
                sfx.click()
                setSelectedDigit(selectedDigit === d ? null : d)
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <button className="mc-btn mc-btn-green" disabled={!active} onClick={submitBuild}>
          ⚒ 组装数值
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="mc-panel px-6 py-3 text-2xl tracking-widest text-[#55ffff] mc-shadow">
        {input || '·'}
      </div>
      <Keypad
        keys={[...'0123456789']}
        disabled={!active}
        onKey={(k) => {
          if (k === '⌫') setInput((s) => s.slice(0, -1))
          else if (input.length < 5) setInput((s) => s + k)
        }}
        onSubmit={submitRead}
        submitLabel="⛏ 开采数值"
      />
    </div>
  )
}
