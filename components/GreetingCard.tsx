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
    <div className="neu" style={{ borderRadius: 28, padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div className="serif" style={{
            fontSize: 36, fontWeight: 400, color: 'var(--p-ink)',
            lineHeight: 1, letterSpacing: -1,
          }}>
            {month}/{day}
          </div>
          <div className="serif" style={{
            fontSize: 26, fontWeight: 300, color: 'var(--p-muted)',
            lineHeight: 1.2, letterSpacing: -0.5, marginTop: 4,
          }}>
            {h12} {ampm}
          </div>
        </div>
        <div style={{
          background: 'var(--p-ink)', borderRadius: 20,
          padding: '5px 12px',
        }}>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
            color: '#fff', letterSpacing: 1,
          }}>R/24</span>
        </div>
      </div>
      <div className="neu-inset" style={{
        borderRadius: 30, padding: '10px 18px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 12, color: 'var(--p-muted)', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
          Your last brew
        </span>
      </div>
    </div>
  )
}
