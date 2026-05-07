'use client'
import { useEffect } from 'react'

const ALLOWED_PREFIXES = ['--p-', '--sz-', '--order-', '--dot-']

function applySettings(settings: Record<string, string>) {
  const el = document.documentElement
  Object.entries(settings).forEach(([k, v]) => {
    if (ALLOWED_PREFIXES.some(prefix => k.startsWith(prefix))) {
      el.style.setProperty(k, v)
    }
  })
}

export default function ThemeApplier() {
  useEffect(() => {
    // 최초 로드 시 Supabase 색상 적용
    fetch('/api/theme', { cache: 'no-store' })
      .then(r => r.json())
      .then(applySettings)
      .catch(() => {})

    // 어드민에서 저장 후 3초 내 자동 반영 (폴링)
    const interval = setInterval(() => {
      fetch('/api/theme', { cache: 'no-store' })
        .then(r => r.json())
        .then(applySettings)
        .catch(() => {})
    }, 3000)

    // 어드민 편집창에서 postMessage로 실시간 색상 수신
    // (iframe 안에서 부모 localhost:5001이 보내는 메시지)
    function onMessage(e: MessageEvent) {
      const msg = e.data
      if (!msg || msg.type !== 'cssVar') return
      const { key, value } = msg
      if (!key || value === undefined) return
      if (ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix))) {
        document.documentElement.style.setProperty(key, value)
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
