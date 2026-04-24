'use client'
import { useEffect } from 'react'

export default function ThemeApplier() {
  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.json())
      .then((settings: Record<string, string>) => {
        const el = document.documentElement
        Object.entries(settings).forEach(([k, v]) => {
          if (k.startsWith('--')) el.style.setProperty(k, v)
        })
      })
      .catch(() => {})
  }, [])

  return null
}
