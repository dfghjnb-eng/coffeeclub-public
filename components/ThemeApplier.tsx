'use client'
import { useEffect } from 'react'

const ALLOWED_PREFIXES = ['--p-', '--sz-', '--order-', '--dot-', '--sh-']

// 배경색 → 뉴모피즘 그림자 색상 자동 계산
function computeShadows(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  const dr = Math.max(0, Math.round(r*0.76))
  const dg = Math.max(0, Math.round(g*0.75))
  const db = Math.max(0, Math.round(b*0.70))
  return {
    '--sh-d':  `rgba(${dr},${dg},${db},0.45)`,
    '--sh-ds': `rgba(${dr},${dg},${db},0.35)`,
    '--sh-l':  'rgba(255,255,255,0.85)',
  }
}

function applySettings(settings: Record<string, string>) {
  const el = document.documentElement
  Object.entries(settings).forEach(([k, v]) => {
    if (ALLOWED_PREFIXES.some(p => k.startsWith(p))) {
      el.style.setProperty(k, v)
    }
  })
  // 배경색 → 그림자 자동 계산
  const bg = settings['--p-bg']
  if (bg) {
    const sh = computeShadows(bg)
    if (sh) Object.entries(sh).forEach(([k, v]) => el.style.setProperty(k, v))
  }
}

export default function ThemeApplier() {
  useEffect(() => {
    const fetchAndApply = () =>
      fetch('/api/theme', { cache: 'no-store' })
        .then(r => r.json())
        .then(applySettings)
        .catch(() => {})

    fetchAndApply()

    // 어드민 저장 후 3초 내 자동 반영
    const interval = setInterval(fetchAndApply, 3000)

    // 어드민에게 "준비됨" 신호 전송 → 어드민이 현재 편집값을 즉시 flush
    try {
      window.parent.postMessage({ type: 'themeReady' }, '*')
    } catch (_) {}

    // 어드민 편집창 → postMessage 실시간 수신
    function onMessage(e: MessageEvent) {
      const msg = e.data
      if (!msg || msg.type !== 'cssVar') return
      const { key, value } = msg
      if (!key || value === undefined) return

      const el = document.documentElement
      if (ALLOWED_PREFIXES.some(p => key.startsWith(p))) {
        el.style.setProperty(key, value)
      }
      // 배경색 변경 시 그림자 자동 계산
      if (key === '--p-bg') {
        const sh = computeShadows(value)
        if (sh) Object.entries(sh).forEach(([k, v]) => el.style.setProperty(k, v))
      }
    }
    window.addEventListener('message', onMessage)

    return () => {
      clearInterval(interval)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  return null
}
