// ============================================================
// NRIG · 游戏主屏幕：Stage + HUD + 状态机覆盖层
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from '../three/stage'
import { buildEnv } from '../three/themes'
import { useLevelEngine } from '../game/engine'
import { BOSS_TYPE_LABEL, WORLDS, type LevelDef } from '../game/levels'
import { computeMastery } from '../game/mastery'
import { markLevel, nextLevelId, recordAttempt, type SaveData } from '../game/storage'
import { sfx } from '../game/audio'
import { Hearts, McButton, McPanel, TimeBar, XpBar } from './mc'
import { HintBox } from './answer'
import { World1Play } from '../worlds/World1'
import { World2Play } from '../worlds/World2'
import { World3Play } from '../worlds/World3'
import { World4Play } from '../worlds/World4'
import { World5Play } from '../worlds/World5'

export function GameScreen({
  level,
  save,
  settings,
  onCommit,
  onExit,
  onNext,
  onRetry,
}: {
  level: LevelDef
  save: SaveData
  settings: SaveData['settings']
  onCommit: (fn: (s: SaveData) => SaveData) => void
  onExit: () => void
  onNext: (levelId: string) => void
  onRetry: () => void
}) {
  const world = WORLDS[level.world - 1]
  const engine = useLevelEngine(level)
  const holderRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage | null>(null)
  const [paused, setPaused] = useState(false)
  const committedRef = useRef(false)

  // 挂载 3D 舞台
  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return
    const s = new Stage(holder, {})
    s.reducedMotion = settings.reducedMotion
    buildEnv(s, level.world)
    setStage(s)
    return () => {
      s.dispose()
      setStage(null)
    }
  }, [level, settings.reducedMotion])

  // 关卡结束 → 提交存档（一次性）
  useEffect(() => {
    if (engine.phase !== 'done' || committedRef.current) return
    committedRef.current = true
    const attempts = engine.stats.attempts
    const passed = engine.stats.passed
    const isFinal = level.type === 'final'
    onCommit((s) => {
      let next = s
      for (const a of attempts) next = recordAttempt(next, level.world, a)
      if (passed) {
        next = markLevel(
          next,
          level.id,
          {
            passed: true,
            ...(isFinal ? { mastered: true } : {}),
            bestStreak: engine.stats.correct,
          },
          engine.stats.correct * 10 + 50,
        )
      }
      return next
    })
  }, [engine.phase, engine.stats, level, onCommit])

  const mastery = useMemo(() => {
    const attempts = save.attempts[String(level.world)] ?? []
    const finalPassed = !!save.levels[`${level.world}.9`]?.passed
    return computeMastery(attempts, finalPassed)
  }, [save, level.world])

  const nextId = nextLevelId(level.id)

  const playProps = { stage, engine, level }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 3D 场景 */}
      <div ref={holderRef} className="absolute inset-0" />

      {/* 顶部 HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 gap-3 pointer-events-none">
        <div className="mc-panel px-3 py-2 pointer-events-auto">
          <div className="text-[10px] text-[#9a9a9a] mc-shadow-sm">
            {world.name} · {BOSS_TYPE_LABEL[level.type]}
          </div>
          <div className="text-[13px] text-white mc-shadow font-zh mt-0.5">
            {level.id} {level.name}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="mc-panel px-3 py-2 flex items-center gap-3">
            <Hearts total={level.hearts} left={engine.heartsLeft} />
            <span className="text-[11px] text-[#7ec850] mc-shadow-sm">
              LV.{mastery.level} {mastery.en}
            </span>
          </div>
          <div className="flex gap-2">
            {level.hints && engine.phase === 'active' && !engine.hintVisible && (
              <McButton className="!py-1.5 !px-3 !text-[11px]" onClick={engine.useHint}>
                火把提示
              </McButton>
            )}
            <McButton className="!py-1.5 !px-3 !text-[11px]" onClick={() => setPaused(true)}>
              ‖ 暂停
            </McButton>
          </div>
        </div>
      </div>

      {/* 题目面板 + 作答区 */}
      {(engine.phase === 'active' || engine.phase === 'feedback') && (
        <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center gap-2 p-3 pb-4 pointer-events-none">
          <div className="w-full max-w-2xl flex flex-col items-center gap-2 pointer-events-auto">
            <div className="mc-panel px-4 py-3 w-full text-center">
              <div className="text-[13px] md:text-[14px] font-zh text-white mc-shadow leading-relaxed">
                {engine.question.prompt}
              </div>
              {engine.hintVisible && (
                <div className="mt-2">
                  <HintBox text={engine.question.hint} />
                </div>
              )}
            </div>
            {engine.timeLeft !== null && engine.phase === 'active' && (
              <div className="w-full max-w-md">
                <TimeBar left={engine.timeLeft} total={level.timeLimit ?? 30} />
              </div>
            )}
            {level.world === 1 && <World1Play {...playProps} />}
            {level.world === 2 && <World2Play {...playProps} />}
            {level.world === 3 && <World3Play {...playProps} />}
            {level.world === 4 && <World4Play {...playProps} />}
            {level.world === 5 && <World5Play {...playProps} />}
          </div>
        </div>
      )}

      {/* 进度 XP 条 */}
      {engine.phase !== 'briefing' && engine.phase !== 'done' && (
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7ec850] mc-shadow-sm">
              {engine.idx + 1}/{level.count}
            </span>
            <XpBar value={engine.idx + (engine.phase === 'feedback' ? 1 : 0)} max={level.count} />
            <span className="text-[10px] text-[#ffd75e] mc-shadow-sm">✔{engine.correctCount}</span>
          </div>
        </div>
      )}

      {/* 反馈闪屏 */}
      {engine.phase === 'feedback' && engine.lastOutcome && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`pop-in text-2xl md:text-4xl mc-shadow ${
              engine.lastOutcome.correct ? 'text-[#55ff55]' : 'text-[#ff5555]'
            }`}
            style={{ marginTop: '-20vh' }}
          >
            {engine.lastOutcome.correct ? '✔ 正确！' : '✘ 错误'}
          </div>
          <div
            className="pop-in absolute text-[12px] md:text-[13px] font-zh text-white mc-shadow max-w-xl text-center px-4"
            style={{ marginTop: '-12vh' }}
          >
            {engine.lastOutcome.message}
          </div>
        </div>
      )}

      {/* 任务简报 */}
      {engine.phase === 'briefing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
          <McPanel className="max-w-lg w-full text-center flex flex-col gap-4 items-center p-6">
            {level.type !== 'training' && (
              <div className="boss-title text-[#ff5555] text-lg mc-shadow tracking-widest">
                ⚔ {BOSS_TYPE_LABEL[level.type]} ⚔
              </div>
            )}
            <div className="text-xl text-white mc-shadow font-zh">
              {level.id} {level.name}
            </div>
            <div className="text-[12px] font-zh text-[#c8c8c8] leading-relaxed">{level.desc}</div>
            <div className="flex gap-4 text-[11px] mc-shadow-sm">
              <span className="text-[#9fe8ff]">题目 × {level.count}</span>
              <span className="text-[#55ff55]">过关 ≥ {level.need}</span>
              <span className="text-[#ff5555]">红心 × {level.hearts}</span>
              {level.timeLimit && <span className="text-[#ffd75e]">限时 {level.timeLimit}s/题</span>}
            </div>
            <McButton variant="green" className="text-[15px] px-8" onClick={engine.begin}>
              ▶ 开始任务
            </McButton>
            <McButton className="!text-[11px]" onClick={onExit}>
              返回地图
            </McButton>
          </McPanel>
        </div>
      )}

      {/* 结算 */}
      {engine.phase === 'done' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <McPanel className="max-w-lg w-full text-center flex flex-col gap-4 items-center p-6">
            <div
              className={`text-2xl mc-shadow ${engine.stats.passed ? 'text-[#55ff55]' : 'text-[#ff5555]'}`}
            >
              {engine.stats.passed ? '★ 任务完成 ★' : '任务失败'}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12px] font-zh text-[#c8c8c8] mc-shadow-sm">
              <span>正确</span>
              <span className="text-[#55ff55]">
                {engine.stats.correct} / {engine.stats.total}
              </span>
              <span>平均用时</span>
              <span className="text-[#9fe8ff]">{(engine.stats.avgMs / 1000).toFixed(1)}s</span>
              <span>提示使用</span>
              <span className="text-[#ffd75e]">{engine.stats.hintsUsed}</span>
              <span>获得经验</span>
              <span className="text-[#7ec850]">{engine.stats.passed ? engine.stats.correct * 10 + 50 : 0} XP</span>
            </div>
            {engine.stats.passed && (
              <div className="text-[11px] font-zh text-[#9fe8ff] mc-shadow-sm">
                当前掌握度：{mastery.label}（{mastery.detail}）
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              {engine.stats.passed && nextId && (
                <McButton variant="green" onClick={() => onNext(nextId)}>
                  下一关 ▶
                </McButton>
              )}
              <McButton variant="gold" onClick={onRetry}>
                再试一次
              </McButton>
              <McButton onClick={onExit}>返回地图</McButton>
            </div>
          </McPanel>
        </div>
      )}

      {/* 暂停菜单 */}
      {paused && engine.phase !== 'done' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 z-10">
          <McPanel className="max-w-sm w-full text-center flex flex-col gap-3 items-center p-6">
            <div className="text-lg text-white mc-shadow font-zh">游戏暂停</div>
            <McButton variant="green" onClick={() => setPaused(false)}>
              继续游戏
            </McButton>
            <McButton
              onClick={() => {
                setPaused(false)
                onRetry()
              }}
            >
              重新开始本关
            </McButton>
            <McButton
              variant="red"
              onClick={() => {
                sfx.break()
                onExit()
              }}
            >
              返回世界地图
            </McButton>
          </McPanel>
        </div>
      )}
    </div>
  )
}
