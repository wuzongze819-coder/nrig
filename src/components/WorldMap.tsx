// ============================================================
// NRIG · 世界地图：五世界 + 45 关选择（进度/掌握可视化）
// ============================================================

import { useMemo } from 'react'
import { LEVELS, WORLDS, type LevelDef } from '../game/levels'
import { computeMastery } from '../game/mastery'
import { isLevelAvailable, isLevelPassed, worldProgress, type SaveData } from '../game/storage'
import { blockIcon } from '../three/blockIcon'
import { McButton } from './mc'
import { sfx } from '../game/audio'

const WORLD_BLOCK: Record<number, [string, string]> = {
  1: ['ore_gold', 'ore_gold'],
  2: ['lamp_on', 'lamp_on'],
  3: ['rail', 'planks'],
  4: ['glowstone', 'obsidian'],
  5: ['obsidian', 'netherrack'],
}

const TYPE_BLOCK: Record<string, [string, string]> = {
  training: ['grass_top', 'grass_side'],
  mini: ['ore_redstone', 'ore_redstone'],
  mid: ['ore_diamond', 'ore_diamond'],
  final: ['bedrock', 'obsidian'],
}

function LevelCell({
  level,
  save,
  onPlay,
}: {
  level: LevelDef
  save: SaveData
  onPlay: (id: string) => void
}) {
  const available = isLevelAvailable(save, level.id)
  const passed = isLevelPassed(save, level.id)
  const mastered = !!save.levels[level.id]?.mastered
  const [top, side] = TYPE_BLOCK[level.type]
  const icon = useMemo(() => blockIcon(top, side, 48), [top, side])

  return (
    <button
      className="relative flex flex-col items-center gap-1 p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed"
      disabled={!available}
      title={`${level.id} ${level.name}`}
      onClick={() => {
        sfx.click()
        onPlay(level.id)
      }}
    >
      <span
        className="block w-10 h-10 border-2"
        style={{
          borderColor: mastered ? '#ff9efc' : passed ? '#55ff55' : available ? '#c8c8c8' : '#3a3a3a',
          boxShadow: mastered
            ? '0 0 10px #ff9efc88'
            : passed
              ? '0 0 8px #55ff5566'
              : undefined,
          filter: available ? undefined : 'grayscale(1) brightness(0.5)',
          backgroundImage: `url(${icon})`,
          backgroundSize: 'cover',
        }}
      />
      <span
        className="text-[8px] mc-shadow-sm"
        style={{ color: available ? (passed ? '#55ff55' : '#fff') : '#5a5a5a' }}
      >
        {level.id}
      </span>
      {passed && (
        <span className="absolute -top-1 -right-1 text-[10px] text-[#55ff55] mc-shadow">✔</span>
      )}
    </button>
  )
}

export function WorldMap({
  save,
  onPlay,
  onBack,
  onSettings,
}: {
  save: SaveData
  onPlay: (id: string) => void
  onBack: () => void
  onSettings: () => void
}) {
  const totalPassed = LEVELS.filter((l) => isLevelPassed(save, l.id)).length

  return (
    <div className="h-full w-full overflow-y-auto" style={{ background: '#1a1208' }}>
      <div
        className="min-h-full p-4 md:p-6"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(60,45,20,0.5), rgba(10,8,4,0.92))',
        }}
      >
        {/* 顶栏 */}
        <div className="flex items-center justify-between max-w-6xl mx-auto mb-5 flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-[#9fe8ff] mc-shadow-sm">NRIG</div>
            <h1 className="text-xl md:text-2xl text-white mc-shadow font-zh">世界地图</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="mc-panel px-3 py-2 text-[11px] mc-shadow-sm">
              <span className="text-[#7ec850]">⬆ {save.xp} XP</span>
              <span className="text-[#c8c8c8] ml-3">进度 {totalPassed}/45</span>
            </div>
            <McButton className="!py-1.5 !px-3 !text-[11px]" onClick={onSettings}>
              设置
            </McButton>
            <McButton className="!py-1.5 !px-3 !text-[11px]" onClick={onBack}>
              标题
            </McButton>
          </div>
        </div>

        {/* 五世界 */}
        <div className="max-w-6xl mx-auto flex flex-col gap-5">
          {WORLDS.map((w) => {
            const prog = worldProgress(save, w.id)
            const mastery = computeMastery(
              save.attempts[String(w.id)] ?? [],
              !!save.levels[`${w.id}.9`]?.passed,
            )
            const firstLevel = LEVELS.find((l) => l.world === w.id)!
            const worldUnlocked = isLevelAvailable(save, firstLevel.id)
            const [top, side] = WORLD_BLOCK[w.id]
            const icon = blockIcon(top, side, 96)
            return (
              <div key={w.id} className="mc-panel p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* 世界信息 */}
                  <div className="flex items-start gap-3 md:w-80 shrink-0">
                    <img
                      src={icon}
                      alt={w.name}
                      className="w-16 h-16 border-2 border-black"
                      style={{ filter: worldUnlocked ? undefined : 'grayscale(1) brightness(0.5)' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] text-white mc-shadow font-zh">
                          世界{w.id} · {w.name}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 border mc-shadow-sm"
                          style={{ color: mastery.color, borderColor: mastery.color }}
                        >
                          {mastery.label}
                        </span>
                      </div>
                      <div className="text-[9px] tracking-widest mt-0.5" style={{ color: w.accent }}>
                        {w.en}
                      </div>
                      <div className="text-[11px] font-zh text-[#b8b8b8] mt-2 leading-relaxed">
                        {worldUnlocked ? w.gameplay : '完成前一个世界的 Mini Boss 后解锁'}
                      </div>
                      <div className="text-[10px] text-[#7a7a7a] mt-1 mc-shadow-sm">
                        {prog.passed}/{prog.total} 关已通过
                      </div>
                    </div>
                  </div>
                  {/* 关卡格子 */}
                  <div className="flex flex-wrap gap-1 items-start content-start">
                    {LEVELS.filter((l) => l.world === w.id).map((l) => (
                      <LevelCell key={l.id} level={l} save={save} onPlay={onPlay} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="max-w-6xl mx-auto mt-5 text-[10px] font-zh text-[#8a8a8a] leading-relaxed mc-shadow-sm">
          掌握度说明：M0 未学习 → M1 指导 → M2 独立（近5次≥4对且无提示）→ M3 流畅（近10次≥9对、无提示、用时达标）→ M4 迁移（通过 Final Boss）。
          Boss 关用于验证对应掌握等级。
        </div>
      </div>
    </div>
  )
}
