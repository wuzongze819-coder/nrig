// ============================================================
// NRIG · MC 风格通用 UI 组件
// ============================================================

import type { ReactNode } from 'react'
import { sfx } from '../game/audio'

export function McButton({
  children,
  onClick,
  variant,
  disabled,
  className = '',
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'green' | 'red' | 'gold'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      className={`mc-btn ${variant ? `mc-btn-${variant}` : ''} ${className}`}
      style={style}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        sfx.click()
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}

export function McPanel({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`mc-panel p-4 ${className}`} style={style}>
      {children}
    </div>
  )
}

/** 像素红心 */
export function Heart({ full, lost }: { full: boolean; lost?: boolean }) {
  return (
    <svg width="22" height="20" viewBox="0 0 11 10" style={{ imageRendering: 'pixelated' }}>
      <HeartShape color={full ? '#e82e2e' : '#2a2a2a'} edge={full ? '#8f1414' : '#1a1a1a'} flash={lost} />
    </svg>
  )
}

function HeartShape({ color, edge, flash }: { color: string; edge: string; flash?: boolean }) {
  const rows = [
    '0110 0110'.replace(/ /g, ''),
    '1111 1111'.replace(/ /g, ''),
    '11111111',
    '11111111',
    '01111110',
    '00111100',
    '00011000',
  ]
  return (
    <g style={flash ? { animation: 'pop-in 0.4s' } : undefined}>
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '1' ? (
            <rect key={`${x}-${y}`} x={x * 1.3} y={y * 1.3} width="1.3" height="1.3" fill={color} stroke={edge} strokeWidth="0.12" />
          ) : null,
        ),
      )}
    </g>
  )
}

export function Hearts({ total, left }: { total: number; left: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <Heart key={i} full={i < left} lost={i === left} />
      ))}
    </div>
  )
}

export function XpBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="mc-xpbar w-full">
      <div className="fill" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
      <div className="notches" />
    </div>
  )
}

export function TimeBar({ left, total }: { left: number; total: number }) {
  const danger = left / total < 0.3
  return (
    <div className={`mc-timebar w-full ${danger ? 'danger' : ''}`}>
      <div className="fill" style={{ width: `${(left / total) * 100}%` }} />
    </div>
  )
}

export function MasteryBadge({ level, label, color }: { level: number; label: string; color: string }) {
  return (
    <span
      className="inline-block px-2 py-1 text-[10px] mc-shadow-sm"
      style={{ background: '#141414', border: `2px solid ${color}`, color }}
    >
      M{level} · {label}
    </span>
  )
}
