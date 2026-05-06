'use client'
import { useEffect } from 'react'

// 유효한 CSS 변수 키 — 알 수 없는 키는 무시
const ALLOWED_PREFIXES = ['--p-', '--sz-', '--order-']

export default function ThemeApplier() {
  useEffect(() => {
    fetch('/api/theme', { cache: 'no-store' })
      .then(r => r.json())
      .then((settings: Record<string, string>) => {
        const el = document.documentElement
        Object.entries(settings).forEach(([k, v]) => {
          // --p-*, --sz-*, --order-* 만 적용 (구버전 --c-* 는 무시)
          if (ALLOWED_PREFIXES.some(prefix => k.startsWith(prefix))) {
            el.style.setProperty(k, v)
          }
        })
      })
      .catch(() => {})
  }, [])

  return null
}
