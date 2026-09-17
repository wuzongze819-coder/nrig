// ============================================================
// NRIG · 应用入口：标题 → 世界地图 → 关卡
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { TitleScreen } from './components/TitleScreen'
import { WorldMap } from './components/WorldMap'
import { GameScreen } from './components/GameScreen'
import { AboutModal, SettingsModal } from './components/Modals'
import { getLevel } from './game/levels'
import { loadSave, persistSave, resetSave, type SaveData } from './game/storage'
import { setSoundEnabled } from './game/audio'

type Screen = 'title' | 'map' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [levelId, setLevelId] = useState<string | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [save, setSave] = useState<SaveData>(() => loadSave())
  const [showSettings, setShowSettings] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  // 音效开关同步
  useEffect(() => {
    setSoundEnabled(save.settings.sound)
  }, [save.settings.sound])

  const commit = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = fn(prev)
      persistSave(next)
      return next
    })
  }, [])

  const play = useCallback((id: string) => {
    setLevelId(id)
    setGameKey((k) => k + 1)
    setScreen('game')
  }, [])

  const scale = save.settings.textScale

  return (
    <div
      className={`h-full w-full ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}
      style={{ fontSize: `${scale}em` }}
    >
      {screen === 'title' && (
        <TitleScreen
          save={save}
          onStart={() => setScreen('map')}
          onSettings={() => setShowSettings(true)}
          onAbout={() => setShowAbout(true)}
        />
      )}
      {screen === 'map' && (
        <WorldMap
          save={save}
          onPlay={play}
          onBack={() => setScreen('title')}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {screen === 'game' && levelId && (
        <GameScreen
          key={`${levelId}-${gameKey}`}
          level={getLevel(levelId)}
          save={save}
          settings={save.settings}
          onCommit={commit}
          onExit={() => setScreen('map')}
          onNext={play}
          onRetry={() => setGameKey((k) => k + 1)}
        />
      )}

      {showSettings && (
        <SettingsModal
          save={save}
          onChange={(settings) => commit((s) => ({ ...s, settings }))}
          onClose={() => setShowSettings(false)}
          onReset={() => {
            resetSave()
            setSave(loadSave())
            setShowSettings(false)
          }}
        />
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  )
}
