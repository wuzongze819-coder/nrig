// ============================================================
// NRIG · World 2 晶能电站：二进制开关与能量控制
// 交互原语: TOGGLE_SWITCH / READ_PANEL / SET_PANEL
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { block, labelBlock } from '../three/voxel'
import { padLeft, toBase } from '../game/bases'
import type { W2Q } from '../game/qgs'
import { sfx } from '../game/audio'
import { Keypad } from '../components/answer'
import type { WorldPlayProps } from './World1'

export function World2Play({ stage, engine }: WorldPlayProps) {
  const q = engine.question as W2Q
  const active = engine.phase === 'active'
  const truth = useMemo(() => padLeft(toBase(q.value, 2), q.bits), [q])

  // 开关状态：index 0 = 最高位（最左）
  const [bits, setBits] = useState<boolean[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    setBits(Array.from({ length: q.bits }, (_, i) => (q.kind === 'read' ? truth[i] === '1' : false)))
    setInput('')
  }, [engine.idx, q.bits, q.kind, truth])

  const currentValue = useMemo(
    () => bits.reduce((sum, on, i) => sum + (on ? Math.pow(2, q.bits - 1 - i) : 0), 0),
    [bits, q.bits],
  )

  // ---------- 3D 灯阵 ----------
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
    const n = q.bits
    const perRow = n > 8 ? Math.ceil(n / 2) : n
    const spacing = Math.min(1.5, 13 / perRow)
    for (let i = 0; i < n; i++) {
      const row = n > 8 ? Math.floor(i / perRow) : 0
      const col = n > 8 ? i % perRow : i
      const inRow = n > 8 ? (row === 0 ? perRow : n - perRow) : n
      const x = (col - (inRow - 1) / 2) * spacing
      const y = 2.6 - row * 1.6
      const on = bits[i]
      // 灯座
      const frame = block(1, { all: 'obsidian' })
      frame.scale.set(1.05, 1.05, 0.3)
      frame.position.set(x, y, -5.8)
      root.add(frame)
      const lamp = block(0.9, { all: on ? 'lamp_on' : 'lamp_off' })
      lamp.position.set(x, y, -5.6)
      root.add(lamp)
      if (on) {
        const glow = new THREE.PointLight(0xffd75e, 4, 4)
        glow.position.set(x, y, -4.8)
        root.add(glow)
      }
      // 位权标签
      const w = labelBlock(0.42, String(Math.pow(2, n - 1 - i)), {
        color: on ? '#ffd75e' : '#9a9a9a',
        bg: '#141414',
      })
      w.position.set(x, y - 0.85, -5.5)
      root.add(w)
      // bit 值标签
      const bv = labelBlock(0.34, on ? '1' : '0', { color: on ? '#55ff55' : '#7a7a7a', bg: '#0c0c0c' })
      bv.position.set(x, y + 0.72, -5.5)
      root.add(bv)

      if (q.kind === 'set') {
        stage.addClickable(lamp, () => {
          if (engine.phase !== 'active') return
          setBits((prev) => {
            const next = prev.slice()
            next[i] = !next[i]
            return next
          })
          sfx.toggle()
        })
      }
    }
  }, [stage, q, bits, engine.phase])

  const toggleBit = (i: number) => {
    if (!active || q.kind !== 'set') return
    setBits((prev) => {
      const next = prev.slice()
      next[i] = !next[i]
      return next
    })
    sfx.toggle()
  }

  const submitSet = () => {
    if (currentValue === q.value) {
      engine.submit(true, `能量配置成功！${truth}₂ = ${q.value}₁₀`)
      if (stage) stage.burst(new THREE.Vector3(0, 2.6, -5), [0xffd75e, 0x55ff55, 0xfff3c0], 26)
    } else {
      const diff = currentValue - q.value
      engine.submit(
        false,
        diff > 0
          ? `能量过载 ${diff}：当前 ${currentValue}₁₀，需要关掉一些位权`
          : `能量不足 ${-diff}：当前 ${currentValue}₁₀，还需要更多位权`,
      )
    }
  }

  const submitRead = () => {
    if (!input) return
    if (parseInt(input, 10) === q.value) {
      engine.submit(true, `读数正确！${truth}₂ = ${q.value}₁₀`)
      if (stage) stage.burst(new THREE.Vector3(0, 2.6, -5), [0x55ff55, 0x9fe8ff], 22)
    } else {
      engine.submit(false, '只把亮灯（1）位置的位权加起来')
    }
  }

  if (q.kind === 'read') {
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
          submitLabel="⚡ 读取能量"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {q.readout ? (
        <div className="mc-panel px-4 py-2 text-[13px] mc-shadow">
          当前读数 <span className="text-[#55ffff] text-lg">{currentValue}</span>
          <span className="text-[#7a7a7a]"> / 目标 </span>
          <span className="text-[#ffd75e] text-lg">{q.value}</span>
        </div>
      ) : (
        <div className="mc-panel px-4 py-2 text-[12px] font-zh text-[#c8c8c8] mc-shadow-sm">
          控制室一片黑暗——读数面板已关闭，只能相信位权直觉
        </div>
      )}
      <div className="mc-hotbar" style={{ flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 }}>
        {bits.map((on, i) => (
          <button
            key={i}
            className={`mc-slot ${on ? 'filled' : 'dark'}`}
            style={{
              fontSize: 20,
              color: on ? '#ffd75e' : '#5a5a5a',
              boxShadow: on
                ? 'inset 2px 2px 0 #8a6a1e, inset -2px -2px 0 #ffec9e, 0 0 12px rgba(255,215,94,0.5)'
                : undefined,
            }}
            disabled={!active}
            onClick={() => toggleBit(i)}
          >
            {on ? '1' : '0'}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-[#c8c8c8] mc-shadow-sm font-zh">
        点击开关切换 0/1（也可以直接点墙上的晶灯）
      </div>
      <button className="mc-btn mc-btn-gold" disabled={!active} onClick={submitSet}>
        ⚡ 接通电网
      </button>
    </div>
  )
}
