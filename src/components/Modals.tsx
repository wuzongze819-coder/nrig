// ============================================================
// NRIG · 设置与项目档案弹窗
// ============================================================

import { useState } from 'react'
import { McButton, McPanel } from './mc'
import type { SaveData } from '../game/storage'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] font-zh text-[#e8e8e8] mc-shadow-sm">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="mc-btn !px-3 !py-1.5 !text-[11px]"
      onClick={() => onChange(!on)}
      style={on ? { background: 'linear-gradient(#7ed957,#4da03a 40%,#3a7d2c)' } : undefined}
    >
      {on ? '开' : '关'}
    </button>
  )
}

export function SettingsModal({
  save,
  onChange,
  onClose,
  onReset,
}: {
  save: SaveData
  onChange: (s: SaveData['settings']) => void
  onClose: () => void
  onReset: () => void
}) {
  const [confirmReset, setConfirmReset] = useState(false)
  const st = save.settings
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-20">
      <McPanel className="max-w-md w-full flex flex-col gap-4 p-6">
        <div className="text-lg text-white mc-shadow font-zh text-center">设置</div>
        <Row label="音效">
          <Toggle on={st.sound} onChange={(v) => onChange({ ...st, sound: v })} />
        </Row>
        <Row label="减少动画（无障碍）">
          <Toggle on={st.reducedMotion} onChange={(v) => onChange({ ...st, reducedMotion: v })} />
        </Row>
        <Row label="文字大小">
          <div className="flex gap-2">
            {[1, 1.15, 1.3].map((s) => (
              <button
                key={s}
                className="mc-btn !px-3 !py-1.5 !text-[11px]"
                style={st.textScale === s ? { outline: '2px solid #fff' } : undefined}
                onClick={() => onChange({ ...st, textScale: s })}
              >
                {s === 1 ? '标准' : s === 1.15 ? '大' : '特大'}
              </button>
            ))}
          </div>
        </Row>
        <div className="border-t-2 border-[#3a3a3a] pt-3">
          {confirmReset ? (
            <div className="flex flex-col gap-2 items-center">
              <span className="text-[11px] font-zh text-[#ff8a8a] mc-shadow-sm">
                确定删除所有进度与学习记录？此操作不可撤销。
              </span>
              <div className="flex gap-2">
                <McButton variant="red" className="!text-[11px]" onClick={onReset}>
                  确认删除
                </McButton>
                <McButton className="!text-[11px]" onClick={() => setConfirmReset(false)}>
                  取消
                </McButton>
              </div>
            </div>
          ) : (
            <McButton variant="red" className="!text-[11px] w-full" onClick={() => setConfirmReset(true)}>
              删除全部存档数据…
            </McButton>
          )}
        </div>
        <McButton variant="green" onClick={onClose}>
          完成
        </McButton>
      </McPanel>
    </div>
  )
}

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-20">
      <McPanel className="max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
        <div className="text-lg text-white mc-shadow font-zh text-center mb-1">项目档案</div>
        <div className="text-[10px] text-center text-[#9fe8ff] tracking-widest mb-4">
          NUMBER REPRESENTATION INTUITION GAME · Spec v0.4 / Design v0.4
        </div>
        <div className="flex flex-col gap-4 text-[12px] font-zh text-[#d8d8d8] leading-relaxed">
          <section>
            <h3 className="text-[#ffd75e] mc-shadow-sm mb-1">■ 学习目标</h3>
            <p>
              通过游戏行为建立「数值与表示分离」的直觉：同一个数值可以有不同表示；表示规则由基数、合法数字和位权共同决定；BIN / OCT / DEC / HEX 在数值层等价。
              课程数值范围 0–4095，覆盖 K01–K34 知识体系。
            </p>
          </section>
          <section>
            <h3 className="text-[#ffd75e] mc-shadow-sm mb-1">■ 五个世界 · 45 关</h3>
            <p>
              位权矿坑（采矿建造）→ 晶能电站（二进制开关）→ 进制交易村（分组物流）→ 编码遗迹（RGB/字符/权限）→ 数字堡垒（快速防御）。
              每个世界 6 个训练关 + Mini / Mid / Final Boss，学习节奏：发现 → 单项 → 反向 → 混合 → 撤除脚手架 → 流畅度。
            </p>
          </section>
          <section>
            <h3 className="text-[#ffd75e] mc-shadow-sm mb-1">■ 掌握度 M0–M4</h3>
            <p>
              M0 未学习 / M1 指导 / M2 独立 / M3 流畅 / M4 迁移。
              Mini Boss 验证 M2，Mid Boss 验证 M3，Final Boss 验证 M4——Final Boss 包含此前未见过的新表面形式与异域基数（Base 3–7）迁移题。
              本站为简化实现：掌握度由本地作答证据（正确率、提示使用、用时）推定。
            </p>
          </section>
          <section>
            <h3 className="text-[#ffd75e] mc-shadow-sm mb-1">■ 技术契约（简化）</h3>
            <p>
              数学内核与游戏表现解耦（QuestionCore ≠ Game Scene）；题目由确定性种子生成器本地产生；判定与动画分离；
              浏览器本地运行、匿名可玩、进度仅保存在本浏览器（localStorage），清除浏览器数据会丢失进度。
            </p>
          </section>
          <section>
            <h3 className="text-[#ffd75e] mc-shadow-sm mb-1">■ 素材声明</h3>
            <p>全部体素纹理与音效均为程序化生成的原创资产，不含 Minecraft 官方素材。</p>
          </section>
        </div>
        <div className="mt-5 text-center">
          <McButton variant="green" onClick={onClose}>
            关闭
          </McButton>
        </div>
      </McPanel>
    </div>
  )
}
