// ============================================================
// NRIG · 关卡引擎（对应 Design §18 Mission State Machine 简化版）
// BRIEFING → ACTIVE → (EVALUATING → FEEDBACK) × N → SUCCESS / FAILURE
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generateQuestions, type AnyQuestion } from './qgs'
import type { LevelDef } from './levels'
import type { Attempt } from './storage'
import { sfx } from './audio'

export type Phase = 'briefing' | 'active' | 'feedback' | 'done'

export interface LevelStats {
  correct: number
  total: number
  mistakes: number
  hintsUsed: number
  avgMs: number
  passed: boolean
  attempts: Attempt[]
}

export interface Engine {
  phase: Phase
  idx: number
  question: AnyQuestion
  heartsLeft: number
  correctCount: number
  hintVisible: boolean
  usedHintThisQ: boolean
  lastOutcome: { correct: boolean; message: string } | null
  timeLeft: number | null
  passed: boolean
  stats: LevelStats
  begin: () => void
  submit: (correct: boolean, message?: string) => void
  useHint: () => void
}

export function useLevelEngine(level: LevelDef): Engine {
  const attemptSeed = useMemo(() => Date.now() % 100000, [])
  const questions = useMemo(() => generateQuestions(level, attemptSeed), [level, attemptSeed])

  const [phase, setPhase] = useState<Phase>('briefing')
  const [idx, setIdx] = useState(0)
  const [heartsLeft, setHeartsLeft] = useState(level.hearts)
  const [correctCount, setCorrectCount] = useState(0)
  const [hintVisible, setHintVisible] = useState(false)
  const [usedHintThisQ, setUsedHintThisQ] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [lastOutcome, setLastOutcome] = useState<Engine['lastOutcome']>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [passed, setPassed] = useState(false)
  const [attempts, setAttempts] = useState<Attempt[]>([])

  const qStartRef = useRef(0)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const question = questions[Math.min(idx, questions.length - 1)]

  const begin = useCallback(() => {
    qStartRef.current = performance.now()
    setPhase('active')
    if (level.timeLimit) setTimeLeft(level.timeLimit)
    if (level.type !== 'training') sfx.boss()
  }, [level])

  const finishRef = useRef<(nextAttempts: Attempt[], correct: number, hearts: number) => void>(() => {})
  finishRef.current = (nextAttempts, correct, _hearts) => {
    const isPassed = correct >= level.need
    setPassed(isPassed)
    setPhase('done')
    if (isPassed) sfx.levelup()
    else sfx.wrong()
    void nextAttempts
  }

  const submit = useCallback(
    (correct: boolean, message?: string) => {
      if (phaseRef.current !== 'active') return
      const ms = Math.max(1, Math.round(performance.now() - qStartRef.current))
      const attempt: Attempt = { ts: Date.now(), levelId: level.id, correct, hint: usedHintThisQ, ms }
      const nextAttempts = [...attempts, attempt]
      setAttempts(nextAttempts)

      const nextCorrect = correctCount + (correct ? 1 : 0)
      const nextHearts = heartsLeft - (correct ? 0 : 1)
      setCorrectCount(nextCorrect)
      setHeartsLeft(nextHearts)
      setLastOutcome({ correct, message: message ?? (correct ? '回答正确！' : '回答错误') })
      setPhase('feedback')
      if (correct) sfx.correct()
      else {
        sfx.wrong()
        sfx.hurt()
      }

      window.setTimeout(() => {
        if (nextHearts <= 0 || idx + 1 >= questions.length) {
          finishRef.current(nextAttempts, nextCorrect, nextHearts)
        } else {
          setIdx(idx + 1)
          setHintVisible(false)
          setUsedHintThisQ(false)
          setLastOutcome(null)
          qStartRef.current = performance.now()
          if (level.timeLimit) setTimeLeft(level.timeLimit)
          setPhase('active')
        }
      }, 1200)
    },
    [attempts, correctCount, heartsLeft, idx, level, questions.length, usedHintThisQ],
  )

  const useHint = useCallback(() => {
    if (!level.hints || hintVisible) return
    setHintVisible(true)
    setUsedHintThisQ(true)
    setHintsUsed((h) => h + 1)
    sfx.click()
  }, [level.hints, hintVisible])

  // 限时倒计时（超时计一次失误，E18 时间压力）
  useEffect(() => {
    if (phase !== 'active' || !level.timeLimit) return
    const iv = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return t
        if (t <= 0.2) {
          window.clearInterval(iv)
          submit(false, '时间耗尽！敌人突破了防线')
          return 0
        }
        return +(t - 0.1).toFixed(1)
      })
    }, 100)
    return () => window.clearInterval(iv)
  }, [phase, level.timeLimit, submit])

  const stats: LevelStats = useMemo(
    () => ({
      correct: correctCount,
      total: questions.length,
      mistakes: attempts.filter((a) => !a.correct).length,
      hintsUsed,
      avgMs: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.ms, 0) / attempts.length) : 0,
      passed,
      attempts,
    }),
    [correctCount, questions.length, attempts, hintsUsed, passed],
  )

  return {
    phase,
    idx,
    question,
    heartsLeft,
    correctCount,
    hintVisible,
    usedHintThisQ,
    lastOutcome,
    timeLeft,
    passed,
    stats,
    begin,
    submit,
    useHint,
  }
}
