// ============================================================
// NRIG · 程序化音效（WebAudio 合成，无任何外部音频素材）
// ============================================================

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(v: boolean) {
  enabled = v
}

function ac(): AudioContext | null {
  if (!enabled) return null
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'square',
  vol = 0.12,
  when = 0,
  slideTo?: number,
) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, vol = 0.15, when = 0, lowpass = 1200) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + when
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = lowpass
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(t0)
}

export const sfx = {
  click() {
    tone(880, 0.06, 'square', 0.08)
  },
  place() {
    noise(0.09, 0.18, 0, 900)
    tone(220, 0.08, 'triangle', 0.1)
  },
  break() {
    noise(0.16, 0.22, 0, 1800)
  },
  toggle() {
    tone(520, 0.05, 'square', 0.09)
    tone(660, 0.05, 'square', 0.07, 0.05)
  },
  correct() {
    tone(523, 0.1, 'square', 0.1)
    tone(659, 0.1, 'square', 0.1, 0.09)
    tone(784, 0.16, 'square', 0.12, 0.18)
  },
  wrong() {
    tone(196, 0.22, 'sawtooth', 0.12, 0, 130)
  },
  xp() {
    tone(1174, 0.06, 'sine', 0.07)
    tone(1568, 0.09, 'sine', 0.06, 0.05)
  },
  levelup() {
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.1, i * 0.11))
  },
  boss() {
    tone(110, 0.4, 'sawtooth', 0.14)
    tone(116, 0.4, 'sawtooth', 0.14, 0.02)
    noise(0.5, 0.1, 0, 400)
  },
  hit() {
    noise(0.12, 0.2, 0, 2500)
    tone(1400, 0.07, 'square', 0.06, 0, 900)
  },
  hurt() {
    tone(330, 0.15, 'sawtooth', 0.12, 0, 180)
  },
  unlock() {
    ;[392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'triangle', 0.1, i * 0.08))
  },
}
