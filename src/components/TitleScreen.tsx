// ============================================================
// NRIG · 标题界面：3D 全景 + 像素 Logo（MC 主菜单风格）
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from '../three/stage'
import { buildWorld1Env } from '../three/themes'
import { McButton } from './mc'
import { dirtBgDataUrl } from '../three/textures'
import type { SaveData } from '../game/storage'

const SPLASHES = [
  '1010₂ 也是 10！',
  '0xFF 也很可爱！',
  '位权即力量！',
  '4095 = FFF₁₆',
  '原创体素世界！',
  '三个 bit 一箱！',
  'rwx = 421！',
  '先补零，再装箱！',
  '本地运行 · 无需登录！',
]

export function TitleScreen({
  save,
  onStart,
  onSettings,
  onAbout,
}: {
  save: SaveData
  onStart: () => void
  onSettings: () => void
  onAbout: () => void
}) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [splash] = useState(() => SPLASHES[Math.floor(Math.random() * SPLASHES.length)])
  const hasProgress = useMemo(() => Object.values(save.levels).some((l) => l.passed), [save])
  const dirtBg = useMemo(() => dirtBgDataUrl(), [])

  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return
    const stage = new Stage(holder, {})
    buildWorld1Env(stage)
    // 主菜单全景：缓慢环绕
    let az = 0
    stage.addTicker((_, t) => {
      az = t * 0.08
      stage.setCamera(13, 6.5, Math.PI * 0.22 + az, [0, 1.2, 0])
    })
    return () => stage.dispose()
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={holderRef} className="absolute inset-0" />
      <div className="absolute inset-0 dirt-overlay" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-4">
        <div className="relative flex flex-col items-center">
          <div className="text-[11px] md:text-[13px] tracking-[0.5em] text-[#9fe8ff] mc-shadow mb-3">
            NUMBER REPRESENTATION INTUITION GAME
          </div>
          <h1 className="mc-logo font-zh text-center leading-tight">
            数字表示
            <span className="text-[#ffd75e]">直觉</span>
          </h1>
          <div className="mc-logo font-zh text-center text-[#7ec850]" style={{ fontSize: 'clamp(18px,3.4vw,34px)' }}>
            进 制 大 冒 险
          </div>
          <div className="mc-splash absolute -right-6 md:-right-14 top-8 text-[10px] md:text-[12px] max-w-[140px]">
            {splash}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-72">
          <McButton variant="green" className="!text-[15px] !py-3" onClick={onStart}>
            {hasProgress ? '▶ 继续冒险' : '▶ 开始冒险'}
          </McButton>
          <McButton onClick={onAbout}>项目档案</McButton>
          <McButton onClick={onSettings}>设置…</McButton>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between text-[9px] text-[#c8c8c8] mc-shadow-sm font-zh">
          <span>NRIG v0.1 · 基于 Spec v0.4 / Design v0.4</span>
          <span>原创体素素材 · 进度仅保存在本浏览器</span>
        </div>
      </div>

      {/* 底部泥土条 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 dirt-bg opacity-70"
        style={{ backgroundImage: `url(${dirtBg})` }}
      />
    </div>
  )
}
