// ============================================================
// NRIG · 本地持久化（对应 Design §32-§35，简化实现）
// 匿名本地优先：无需登录即可完成主线。数据只存在本浏览器。
// ============================================================

import { LEVELS, levelOrder } from './levels'

export interface Settings {
  sound: boolean
  reducedMotion: boolean
  textScale: number // 1 | 1.15 | 1.3
}

export interface Attempt {
  ts: number
  levelId: string
  correct: boolean
  hint: boolean
  ms: number // elapsedMs：原始墙钟作答时长
}

export interface LevelSave {
  passed: boolean
  mastered: boolean
  bestStreak: number
}

export interface SaveData {
  version: 1
  xp: number
  levels: Record<string, LevelSave>
  attempts: Record<string, Attempt[]> // key = worldId
  settings: Settings
}

const KEY = 'nrig_save_v1'
const BACKUP_KEY = 'nrig_save_v1_backup'

const DEFAULT_SETTINGS: Settings = { sound: true, reducedMotion: false, textScale: 1 }

function defaultSave(): SaveData {
  return { version: 1, xp: 0, levels: {}, attempts: {}, settings: { ...DEFAULT_SETTINGS } }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSave()
    const data = JSON.parse(raw) as SaveData
    if (data.version !== 1) return defaultSave()
    return { ...defaultSave(), ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } }
  } catch {
    // 损坏存档不得导致应用无法启动（PS-NFR-021）：尝试备份恢复
    try {
      const backup = localStorage.getItem(BACKUP_KEY)
      if (backup) return JSON.parse(backup) as SaveData
    } catch {
      /* ignore */
    }
    return defaultSave()
  }
}

export function persistSave(data: SaveData) {
  try {
    const prev = localStorage.getItem(KEY)
    if (prev) localStorage.setItem(BACKUP_KEY, prev)
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* 存储不可用时静默降级为内存态 */
  }
}

export function resetSave() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(BACKUP_KEY)
  } catch {
    /* ignore */
  }
}

// ---------------- 进度推导 ----------------

export function isLevelPassed(save: SaveData, levelId: string): boolean {
  return !!save.levels[levelId]?.passed
}

/** 线性主线：第一关始终可用，其余关卡需要主线上一关通过 */
export function isLevelAvailable(save: SaveData, levelId: string): boolean {
  const order = levelOrder(levelId)
  if (order <= 0) return true
  return isLevelPassed(save, LEVELS[order - 1].id)
}

export function nextLevelId(levelId: string): string | null {
  const order = levelOrder(levelId)
  return order >= 0 && order < LEVELS.length - 1 ? LEVELS[order + 1].id : null
}

export function recordAttempt(save: SaveData, worldId: number, a: Attempt): SaveData {
  const key = String(worldId)
  const list = [...(save.attempts[key] ?? []), a].slice(-30)
  return { ...save, attempts: { ...save.attempts, [key]: list } }
}

export function markLevel(
  save: SaveData,
  levelId: string,
  patch: Partial<LevelSave>,
  xpGain: number,
): SaveData {
  const cur = save.levels[levelId] ?? { passed: false, mastered: false, bestStreak: 0 }
  return {
    ...save,
    xp: save.xp + xpGain,
    levels: { ...save.levels, [levelId]: { ...cur, ...patch } },
  }
}

export function worldProgress(save: SaveData, worldId: number): { passed: number; total: number } {
  const lv = LEVELS.filter((l) => l.world === worldId)
  return { passed: lv.filter((l) => isLevelPassed(save, l.id)).length, total: lv.length }
}
