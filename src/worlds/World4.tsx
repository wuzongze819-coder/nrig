// ============================================================
// NRIG · World 4 编码遗迹：RGB / 字符编码 / 日志 / 权限
// 交互原语: INSPECT_SYMBOL / READ_PANEL / SELECT_REPRESENTATION / UNLOCK_DEVICE
// ============================================================

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { block, labelBlock } from '../three/voxel'
import { legalDigits, padLeft, toBase } from '../game/bases'
import type { W4Q } from '../game/qgs'
import { sfx } from '../game/audio'
import { OptionGrid, SlotRow } from '../components/answer'
import type { WorldPlayProps } from './World1'

function css(rgb: [number, number, number]) {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

export function World4Play({ stage, engine }: WorldPlayProps) {
  const q = engine.question as W4Q
  const active = engine.phase === 'active'

  const [hexSlots, setHexSlots] = useState<(string | null)[]>([])
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null)

  const hexLen = q.kind === 'rgb2hex' ? 6 : q.kind === 'char' && q.charToCode ? 2 : 0

  useEffect(() => {
    setHexSlots(Array.from({ length: hexLen }, () => null))
    setSelectedDigit(null)
  }, [engine.idx, hexLen])

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

  useEffect(() => {
    const root = propsRef.current
    if (!root || !stage) return
    root.clear()

    if (q.kind === 'hex2rgb' && q.colorOptions) {
      q.colorOptions.forEach((rgb, i) => {
        const x = (i - 1.5) * 2.6
        const ped = block(1, { top: 'stonebrick', side: 'stonebrick' })
        ped.scale.set(1, 0.5, 1)
        ped.position.set(x, 0.25, 1.8)
        root.add(ped)
        const stone = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshLambertMaterial({ color: new THREE.Color(css(rgb)) }),
        )
        stone.position.set(x, 1.3, 1.8)
        root.add(stone)
        const tag = labelBlock(0.4, String.fromCharCode(65 + i), { color: '#fff', bg: '#1a1a1a' })
        tag.position.set(x, 2.1, 1.8)
        root.add(tag)
        const pick = () => {
          if (engine.phase !== 'active') return
          const correct = rgb[0] === q.rgb![0] && rgb[1] === q.rgb![1] && rgb[2] === q.rgb![2]
          if (correct) {
            engine.submit(true, '圣石点亮！颜色编码完全匹配')
            stage.burst(new THREE.Vector3(x, 1.5, 1.8), [rgb[0] << 16 | rgb[1] << 8 | rgb[2], 0xffffff], 24)
            sfx.levelup()
          } else {
            engine.submit(false, '这块圣石的颜色比例不对——把 HEX 每两位拆成一个通道再比')
          }
        }
        stage.addClickable(stone, pick)
        stage.addClickable(ped, pick)
      })
    }

    if (q.kind === 'rgb2hex' && q.rgb) {
      // 目标颜色圣石 + 祭坛光束跟随玩家答案
      const target = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.6, 1.6),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(css(q.rgb)) }),
      )
      target.position.set(-3.4, 1.6, -3)
      root.add(target)
      const tt = labelBlock(0.45, '目标', { color: '#ffd75e', bg: '#1a1a1a' })
      tt.position.set(-3.4, 2.8, -3)
      root.add(tt)

      const current = hexSlots.every((s) => s !== null)
        ? (hexSlots.join('') as string)
        : '000000'
      const pv = parseInt(current, 16)
      const preview = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.6, 1.6),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(`#${padLeft(toBase(pv, 16), 6)}`) }),
      )
      preview.position.set(3.4, 1.6, -3)
      root.add(preview)
      const pt = labelBlock(0.45, '你的', { color: '#55ffff', bg: '#1a1a1a' })
      pt.position.set(3.4, 2.8, -3)
      root.add(pt)
    }

    if (q.kind === 'char') {
      const text = q.charToCode ? q.charGlyph! : `0x${toBase(q.charCode!, 16)}`
      const tablet = block(1, { all: 'stonebrick' })
      tablet.scale.set(2.2, 2.6, 0.4)
      tablet.position.set(0, 1.8, -4.5)
      root.add(tablet)
      const glyph = labelBlock(1.8, text, { color: '#b57ede', bg: '#241a30', emissive: 0x3a2050, emissiveIntensity: 1 })
      glyph.position.set(0, 1.85, -4.2)
      root.add(glyph)
    }

    if (q.kind === 'perm' && q.permBits) {
      const names = ['R', 'W', 'X']
      q.permBits.forEach((on, i) => {
        const x = (i - 1) * 1.8
        const lamp = block(0.9, { all: q.permToDigit ? (on ? 'lamp_on' : 'lamp_off') : 'lamp_off' })
        lamp.position.set(x, 1.9, -4.5)
        root.add(lamp)
        const tag = labelBlock(0.45, names[i], { color: on && q.permToDigit ? '#ffd75e' : '#9a9a9a', bg: '#141414' })
        tag.position.set(x, 2.75, -4.5)
        root.add(tag)
      })
    }

    if ((q.kind === 'format' || q.kind === 'equiv') && (q.formatStr || q.equivValue !== undefined)) {
      const text = q.kind === 'format' ? q.formatStr! : `${q.equivValue}`
      const tablet = block(1, { all: 'obsidian' })
      tablet.scale.set(3.2, 1.8, 0.4)
      tablet.position.set(0, 1.9, -4.5)
      root.add(tablet)
      const glyph = labelBlock(1.4, text, { color: '#ff9efc', bg: '#1a0f22', emissive: 0x401040, emissiveIntensity: 1 })
      glyph.position.set(0, 1.95, -4.2)
      root.add(glyph)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, q, hexSlots, engine.phase])

  // ---------- 各题型 DOM ----------
  if (q.kind === 'hex2rgb') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">
          {q.colorOptions!.map((rgb, i) => (
            <button
              key={i}
              className="mc-slot"
              style={{ width: 64, height: 64, background: css(rgb), boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.4), inset -2px -2px 0 rgba(255,255,255,0.35)' }}
              disabled={!active}
              onClick={() => {
                const correct = rgb[0] === q.rgb![0] && rgb[1] === q.rgb![1] && rgb[2] === q.rgb![2]
                if (correct) {
                  sfx.correct()
                  engine.submit(true, '圣石点亮！颜色编码完全匹配')
                } else {
                  sfx.wrong()
                  engine.submit(false, '颜色比例不对——把 HEX 每两位拆成一个通道（R/G/B）再比较')
                }
              }}
            >
              <span className="mc-shadow text-[#fff]">{String.fromCharCode(65 + i)}</span>
            </button>
          ))}
        </div>
        <div className="text-[11px] text-[#c8c8c8] font-zh mc-shadow-sm">点击正确的圣石（也可以直接点遗迹里的方块）</div>
      </div>
    )
  }

  if (q.kind === 'rgb2hex') {
    const cycle = (i: number) => {
      if (!active) return
      setHexSlots((prev) => {
        const next = prev.slice()
        const pal = [...legalDigits(16)]
        if (selectedDigit) next[i] = selectedDigit
        else next[i] = pal[(pal.indexOf(prev[i] ?? '') + 1) % pal.length] ?? pal[0]
        return next
      })
      sfx.place()
    }
    const submit = () => {
      if (hexSlots.some((s) => s === null)) {
        engine.submit(false, '六个 HEX 位都要填满（通道值不足 16 时前面补 0）')
        return
      }
      const truth = q.rgb!.map((v) => padLeft(toBase(v, 16), 2)).join('')
      if (hexSlots.join('') === truth) {
        engine.submit(true, `祭坛苏醒！#${truth} 正是这束光的编码`)
        if (stage) stage.burst(new THREE.Vector3(0, 2, -3), [0xb57ede, 0xff9efc, 0xffffff], 26)
      } else {
        engine.submit(false, '逐通道换算：每个十进制通道值 → 两位十六进制')
      }
    }
    return (
      <div className="flex flex-col items-center gap-3">
        <SlotRow slots={hexSlots} disabled={!active} onSlotClick={cycle} />
        <div className="mc-hotbar" style={{ flexWrap: 'wrap', justifyContent: 'center', maxWidth: 620 }}>
          {[...legalDigits(16)].map((d) => (
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
        <button className="mc-btn mc-btn-green" disabled={!active} onClick={submit}>
          ◆ 点亮祭坛
        </button>
      </div>
    )
  }

  if (q.kind === 'char') {
    if (q.charToCode) {
      const submit = () => {
        if (hexSlots.some((s) => s === null)) return
        const truth = padLeft(toBase(q.charCode!, 16), 2)
        if (hexSlots.join('') === truth) {
          engine.submit(true, `石板亮起！'${q.charGlyph}' = ${q.charCode}₁₀ = ${truth}₁₆`)
        } else {
          engine.submit(false, `把 ${q.charCode} 拆成 商×16+余数，商和余数各是一位 HEX`)
        }
      }
      const cycle = (i: number) => {
        if (!active) return
        setHexSlots((prev) => {
          const next = prev.slice()
          const pal = [...legalDigits(16)]
          if (selectedDigit) next[i] = selectedDigit
          else next[i] = pal[(pal.indexOf(prev[i] ?? '') + 1) % pal.length] ?? pal[0]
          return next
        })
        sfx.place()
      }
      return (
        <div className="flex flex-col items-center gap-3">
          <SlotRow slots={hexSlots} disabled={!active} onSlotClick={cycle} />
          <div className="mc-hotbar" style={{ flexWrap: 'wrap', justifyContent: 'center', maxWidth: 620 }}>
            {[...legalDigits(16)].map((d) => (
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
          <button className="mc-btn mc-btn-green" disabled={!active} onClick={submit}>
            ◆ 铭刻编码
          </button>
        </div>
      )
    }
    return (
      <OptionGrid
        options={q.charOptions!}
        disabled={!active}
        onPick={(opt) => {
          if (opt === q.charGlyph) {
            engine.submit(true, `正确！0x${toBase(q.charCode!, 16)} = ${q.charCode}₁₀ = '${q.charGlyph}'`)
          } else {
            engine.submit(false, '编码对不上。记住锚点：0-9 从 48 开始，A-Z 从 65 开始')
          }
        }}
      />
    )
  }

  if (q.kind === 'perm') {
    if (q.permToDigit) {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="mc-hotbar">
            {[...legalDigits(8)].map((d) => (
              <button
                key={d}
                className="mc-slot"
                style={{ fontSize: 24 }}
                disabled={!active}
                onClick={() => {
                  const digit = (q.permBits![0] ? 4 : 0) + (q.permBits![1] ? 2 : 0) + (q.permBits![2] ? 1 : 0)
                  if (Number(d) === digit) {
                    engine.submit(true, `密室开启！rwx=${q.permBits!.map((b) => (b ? 1 : 0)).join('')}₂ = ${digit}₈`)
                  } else {
                    engine.submit(false, 'r=4，w=2，x=1。把打开的权限加起来')
                  }
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-[#c8c8c8] font-zh mc-shadow-sm">点击正确的权限值</div>
        </div>
      )
    }
    return (
      <OptionGrid
        options={q.permOptions!}
        disabled={!active}
        onPick={(opt) => {
          const digit = (q.permBits![0] ? 4 : 0) + (q.permBits![1] ? 2 : 0) + (q.permBits![2] ? 1 : 0)
          const truth = `${digit & 4 ? 'r' : '-'}${digit & 2 ? 'w' : '-'}${digit & 1 ? 'x' : '-'}`
          if (opt === truth) {
            engine.submit(true, `密室开启！${digit}₈ = ${padLeft(toBase(digit, 2), 3)}₂ = ${truth}`)
          } else {
            engine.submit(false, '把权限码拆成 3 个 bit：分别对应 r/w/x')
          }
        }}
      />
    )
  }

  if (q.kind === 'format') {
    const names = ['二进制', '八进制', '十进制', '十六进制']
    const baseOf = [2, 8, 10, 16]
    return (
      <OptionGrid
        options={names}
        disabled={!active}
        onPick={(opt) => {
          const b = baseOf[names.indexOf(opt)]
          if (b === q.formatBase) {
            engine.submit(true, `识别成功！前缀指明了它是${opt}`)
          } else {
            engine.submit(false, '看前缀：0b=二进制，0o=八进制，0x=十六进制，无前缀=十进制')
          }
        }}
      />
    )
  }

  // equiv
  return (
    <OptionGrid
      options={q.equivOptions!}
      disabled={!active}
      onPick={(opt) => {
        const truth = `${toBase(q.equivValue!, q.equivFromBase!)}`
        if (opt.startsWith(truth)) {
          engine.submit(true, `铭文共鸣！${opt} 与 ${q.equivValue}₁₀ 等价`)
        } else {
          engine.submit(false, '把选项逐个换算回十进制，再与目标比较')
        }
      }}
    />
  )
}
