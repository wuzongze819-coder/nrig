// ============================================================
// NRIG · 作答控件：MC 物品栏风格的键盘/选项/槽位
// ============================================================

import { sfx } from '../game/audio'
import { sub } from '../game/bases'

/** 数字/字符键盘（0-9 A-F 退格 确认） */
export function Keypad({
  keys,
  onKey,
  onSubmit,
  submitLabel = '确认',
  disabled,
}: {
  keys: string[]
  onKey: (k: string) => void
  onSubmit: () => void
  submitLabel?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-1.5" style={{ maxWidth: 420 }}>
        {keys.map((k) => (
          <button
            key={k}
            className="mc-slot"
            disabled={disabled}
            onClick={() => {
              sfx.click()
              onKey(k)
            }}
          >
            {k}
          </button>
        ))}
        <button
          className="mc-slot"
          disabled={disabled}
          style={{ color: '#ff8a8a' }}
          onClick={() => {
            sfx.break()
            onKey('⌫')
          }}
        >
          ⌫
        </button>
      </div>
      <button
        className="mc-btn mc-btn-green"
        disabled={disabled}
        onClick={() => {
          sfx.click()
          onSubmit()
        }}
      >
        {submitLabel}
      </button>
    </div>
  )
}

/** 选择题选项网格 */
export function OptionGrid({
  options,
  onPick,
  disabled,
  cols,
}: {
  options: string[]
  onPick: (opt: string) => void
  disabled?: boolean
  cols?: number
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${cols ?? Math.min(options.length, 2)}, minmax(0,1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o}
          className="mc-btn"
          style={{ fontSize: 15, padding: '14px 10px' }}
          disabled={disabled}
          onClick={() => {
            sfx.click()
            onPick(o)
          }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/** 数字槽位行（带位权下标） */
export function SlotRow({
  slots,
  weights,
  showWeights,
  activeIdx,
  onSlotClick,
  base,
  disabled,
}: {
  slots: (string | null)[]
  weights?: number[]
  showWeights?: boolean
  activeIdx?: number
  onSlotClick?: (i: number) => void
  base?: number
  disabled?: boolean
}) {
  return (
    <div className="flex items-end justify-center gap-2">
      {slots.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <button
            className={`mc-slot filled ${activeIdx === i ? 'selected' : ''}`}
            style={{ fontSize: 24 }}
            disabled={disabled}
            onClick={() => {
              sfx.click()
              onSlotClick?.(i)
            }}
          >
            {s ?? '·'}
          </button>
          {showWeights && weights && (
            <span className="text-[10px] text-[#ffd75e] mc-shadow-sm">{weights[i]}</span>
          )}
          {base !== undefined && (
            <span className="text-[9px] text-[#9a9a9a]">{i === slots.length - 1 ? sub(base) : ''}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/** 教学提示框 */
export function HintBox({ text }: { text: string }) {
  return (
    <div className="mc-panel p-3 text-[12px] leading-relaxed font-zh text-[#ffd75e] mc-shadow-sm">
      <span className="text-[#ffec9e]">[火把提示]</span> {text}
    </div>
  )
}
