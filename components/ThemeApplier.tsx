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
    const fetchAndApply = () =>
      fetch('/api/theme', { cache: 'no-store' })
        .then(r => r.json())
        .then(applySettings)
        .catch(() => {})

    fetchAndApply()

    // 어드민에서 저장 후 3초 내 자동 반영
    const interval = setInterval(fetchAndApply, 3000)
    return () => clearInterval(interval)
  }, [])

  return null
}
