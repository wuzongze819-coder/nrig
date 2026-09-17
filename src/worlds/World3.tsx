// ============================================================
// NRIG · World 3 进制交易村：分组、装箱、轨道物流
// 交互原语: GROUP_CARGO / PAD_CONTAINER / MAP_GROUP
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { block, labelBlock } from '../three/voxel'
import { groupBits, legalDigits, padLeft, toBase } from '../game/bases'
import type { W3Q } from '../game/qgs'
import { sfx } from '../game/audio'
import { SlotRow } from '../components/answer'
import type { WorldPlayProps } from './World1'

interface Plan {
  sourceText: string // 展示给玩家的源串
  sourceBase: number
  targetBase: number
  answer: string
  slots: number
  palette: string[]
  groupSize: number | null // 需要展示的分组宽度
  groups: string[] | null
}

function planOf(q: W3Q): Plan {
  switch (q.kind) {
    case 'bin2hex': {
      const bin = padLeft(toBase(q.value, 2), q.bits)
      return {
        sourceText: bin, sourceBase: 2, targetBase: 16,
        answer: toBase(q.value, 16), slots: q.bits / 4,
        palette: [...legalDigits(16)], groupSize: 4, groups: groupBits(bin, 4),
      }
    }
    case 'bin2oct': {
      const bin = padLeft(toBase(q.value, 2), q.bits)
      return {
        sourceText: bin, sourceBase: 2, targetBase: 8,
        answer: toBase(q.value, 8), slots: q.bits / 3,
        palette: [...legalDigits(8)], groupSize: 3, groups: groupBits(bin, 3),
      }
    }
    case 'pad': {
      const bin = toBase(q.value, 2)
      const targetBase = q.padTarget === 4 ? 16 : 8
      const groups = groupBits(bin, q.padTarget)
      return {
        sourceText: bin, sourceBase: 2, targetBase,
        answer: toBase(q.value, targetBase), slots: groups.length,
        palette: [...legalDigits(targetBase)], groupSize: q.padTarget, groups,
      }
    }
    case 'hex2bin': {
      const hex = toBase(q.value, 16)
      const width = hex.length * 4
      return {
        sourceText: hex, sourceBase: 16, targetBase: 2,
        answer: padLeft(toBase(q.value, 2), width), slots: width,
        palette: ['0', '1'], groupSize: 4, groups: null,
      }
    }
    case 'oct2bin': {
      const oct = toBase(q.value, 8)
      const width = oct.length * 3
      return {
        sourceText: oct, sourceBase: 8, targetBase: 2,
        answer: padLeft(toBase(q.value, 2), width), slots: width,
        palette: ['0', '1'], groupSize: 3, groups: null,
      }
    }
    case 'oct2hex': {
      return {
        sourceText: toBase(q.value, 8), sourceBase: 8, targetBase: 16,
        answer: toBase(q.value, 16), slots: toBase(q.value, 16).length,
        palette: [...legalDigits(16)], groupSize: null, groups: null,
      }
    }
    default: {
      // hex2oct
      return {
        sourceText: toBase(q.value, 16), sourceBase: 16, targetBase: 8,
        answer: toBase(q.value, 8), slots: toBase(q.value, 8).length,
        palette: [...legalDigits(8)], groupSize: null, groups: null,
      }
    }
  }
}

export function World3Play({ stage, engine }: WorldPlayProps) {
  const q = engine.question as W3Q
  const active = engine.phase === 'active'
  const plan = useMemo(() => planOf(q), [q])

  const [placed, setPlaced] = useState<(string | null)[]>([])
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null)

  useEffect(() => {
    setPlaced(Array.from({ length: plan.slots }, () => null))
    setSelectedDigit(null)
  }, [engine.idx, plan.slots])

  // ---------- 3D：传送带上的货物 ----------
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

  useEffect(() => {
    const root = propsRef.current
    if (!root || !stage) return
    root.clear()
    const chars = [...plan.sourceText]
    const n = chars.length
    const spacing = Math.min(1.05, 12 / Math.max(n, 1))
    chars.forEach((c, i) => {
      const x = (i - (n - 1) / 2) * spacing
      const crate = block(0.85, { all: 'planks' })
      crate.position.set(x, 0.45, -1.5)
      root.add(crate)
      const label = labelBlock(0.7, c, {
        color: plan.sourceBase === 2 ? '#9fe8ff' : plan.sourceBase === 8 ? '#7ec850' : '#ffd75e',
        bg: '#241a10',
        emissive: 0x332211,
        emissiveIntensity: 0.8,
      })
      label.position.set(x, 1.35, -1.5)
      root.add(label)
      // 分组边界标记（金色立柱）
      if (plan.groupSize && i > 0 && (n - i) % plan.groupSize === 0) {
        const marker = block(0.12, { all: 'glowstone' })
        marker.scale.y = 10
        marker.position.set(x - spacing / 2, 0.75, -1.5)
        root.add(marker)
      }
    })
    // 卸货槽位基座
    for (let i = 0; i < plan.slots; i++) {
      const x = (i - (plan.slots - 1) / 2) * 1.4
      const ped = block(1, { top: 'stonebrick', side: 'stonebrick' })
      ped.scale.set(1, 0.5, 1)
      ped.position.set(x, 0.25, 2.4)
      root.add(ped)
      const d = placed[i]
      const cube = labelBlock(
        0.85,
        d ?? '?',
        d
          ? { color: '#a0ffb0', bg: '#1e3a1e', emissive: 0x1a4410, emissiveIntensity: 0.9 }
          : { color: '#8a8a8a', bg: '#2a2a2a' },
      )
      cube.position.set(x, 1.35, 2.4)
      root.add(cube)
      stage.addClickable(cube, () => cycle(i))
      stage.addClickable(ped, () => cycle(i))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, q, plan, placed, selectedDigit, engine.phase])

  const cycle = (i: number) => {
    if (engine.phase !== 'active') return
    setPlaced((prev) => {
      const next = prev.slice()
      if (selectedDigit) {
        next[i] = selectedDigit
      } else {
        const cur = prev[i]
        next[i] = plan.palette[(plan.palette.indexOf(cur ?? '') + 1) % plan.palette.length] ?? plan.palette[0]
      }
      return next
    })
    sfx.place()
  }

  const submit = () => {
    if (placed.some((p) => p === null)) {
      engine.submit(false, '还有空货位——每组都要贴上标签')
      return
    }
    const answer = placed.join('')
    if (answer === plan.answer) {
      engine.submit(true, `发货成功！${plan.sourceText} → ${plan.answer}`)
      if (stage) stage.burst(new THREE.Vector3(0, 1.6, 2.4), [0x7ec850, 0xffd75e, 0x55ff55], 24)
    } else {
      engine.submit(false, `标签不对。逐组检查：${plan.groupSize ? `每 ${plan.groupSize} 个 bit 是一组` : '先拆成 bit 再重新分组'}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {plan.groups && (
        <div className="mc-panel px-4 py-2 text-[13px] mc-shadow text-[#9fe8ff] tracking-widest">
          {plan.groups.join(' · ')}
        </div>
      )}
      <SlotRow
        slots={placed}
        base={plan.targetBase}
        disabled={!active}
        onSlotClick={cycle}
      />
      <div className="mc-hotbar" style={{ flexWrap: 'wrap', justifyContent: 'center', maxWidth: 620 }}>
        {plan.palette.map((d) => (
          <button
            key={d}
            className={`mc-slot ${selectedDigit === d ? 'selected' : ''}`}
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
      <div className="text-[11px] text-[#c8c8c8] mc-shadow-sm font-zh">
        选中标签后点击货位贴标（或直接点击货位循环）
      </div>
      <button className="mc-btn mc-btn-green" disabled={!active} onClick={submit}>
        ▶ 发货
      </button>
    </div>
  )
}
