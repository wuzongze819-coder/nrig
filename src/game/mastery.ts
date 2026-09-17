// ============================================================
// NRIG · 简化掌握模型（Spec §4 M0-M4 的本地简化版）
// M0 UNSEEN → M1 GUIDED → M2 INDEPENDENT → M3 FLUENT → M4 TRANSFER
// 说明：这是 Spec 完整证据链的简化实现——保留证据底线语义
// （次数/正确率/无提示/用时中位数），不含密码学级 attestation。
// ============================================================

import type { Attempt } from './storage'

export interface MasteryInfo {
  level: 0 | 1 | 2 | 3 | 4
  label: string
  en: string
  color: string
  detail: string
}

export const MASTERY_META: MasteryInfo[] = [
  { level: 0, label: 'M0 未学习', en: 'UNSEEN', color: '#7a7a7a', detail: '还没有有效学习证据' },
  { level: 1, label: 'M1 指导', en: 'GUIDED', color: '#5ac8fa', detail: '已开始接触，允许使用提示' },
  { level: 2, label: 'M2 独立', en: 'INDEPENDENT', color: '#55ff55', detail: '最近 5 次 ≥4 正确且未用提示' },
  { level: 3, label: 'M3 流畅', en: 'FLUENT', color: '#ffd75e', detail: '最近 10 次 ≥9 正确、无提示、用时达标' },
  { level: 4, label: 'M4 迁移', en: 'TRANSFER', color: '#ff9efc', detail: '通过 Final Boss，含全新表面与迁移基数' },
]

/** 各世界 M3 流畅度时间预算（毫秒，中位数） */
const FLUENCY_BUDGET_MS = 30000

export function computeMastery(attempts: Attempt[], finalBossPassed: boolean): MasteryInfo {
  if (attempts.length === 0) return MASTERY_META[0]

  // M1: 至少 2 次有效尝试，至少 1 次正确
  const m1 = attempts.length >= 2 && attempts.some((a) => a.correct)

  // M2: 最近 5 次 ≥4 正确且全部未用提示
  const last5 = attempts.slice(-5)
  const m2 =
    last5.length >= 5 && last5.filter((a) => a.correct).length >= 4 && last5.every((a) => !a.hint)

  // M3: 前置 M2 + 最近 10 次 ≥9 正确、无提示、用时中位数 ≤ 预算
  const last10 = attempts.slice(-10)
  const times = last10.map((a) => a.ms).sort((a, b) => a - b)
  const median = times.length ? times[Math.floor(times.length / 2)] : Infinity
  const m3 =
    m2 &&
    last10.length >= 10 &&
    last10.filter((a) => a.correct).length >= 9 &&
    last10.every((a) => !a.hint) &&
    median <= FLUENCY_BUDGET_MS

  // M4: 前置 M3 + Final Boss 已通过（含迁移题）
  const m4 = m3 && finalBossPassed

  const lv = m4 ? 4 : m3 ? 3 : m2 ? 2 : m1 ? 1 : 0
  return MASTERY_META[lv]
}
