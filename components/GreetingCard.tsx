'use client'
import { useState, useEffect } from 'react'

export default function GreetingCard() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (!now) return null   // SSR에서는 아무것도 렌더 안 함

  const month = now.getMonth() + 1
  const day   = now.getDate()
  const hour  = now.getHours()
  const h12   = hour % 12 || 12
  const ampm  = hour >= 12 ? 'PM' : 'AM'

  return (
    <div className="neu" style={{ borderRadius: 'calc(var(--sz-radius) * 1.167)', padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div className="serif" style={{
            fontSize: 'calc(var(--sz-hero) * 1.286)', fontWeight: 400, color: 'var(--p-ink)',
            lineHeight: 1, letterSpacing: -1,
          }}>
            {month}/{day}
          </div>
          <div className="serif" style={{
            fontSize: 'calc(var(--sz-name) * 1.444)', fontWeight: 300, color: 'var(--p-muted)',
            lineHeight: 1.2, letterSpacing: -0.5, marginTop: 4,
          }}>
            {h12} {ampm}
          </div>
        </div>
        <div style={{
          background: 'var(--p-ink)', borderRadius: 'calc(var(--sz-radius) * 0.833)',
          padding: '5px 12px',
        }}>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 'var(--sz-label)', fontWeight: 600,
            color: '#fff', letterSpacing: 1,
          }}>R/24</span>
        </div>
      </div>
      <div className="neu-inset" style={{
        borderRadius: 'calc(var(--sz-radius) * 1.25)', padding: '10px 18px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 'calc(var(--sz-body) * 0.857)', color: 'var(--p-muted)', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
          Your last brew
        </span>
      </div>
    </div>
  )
}
