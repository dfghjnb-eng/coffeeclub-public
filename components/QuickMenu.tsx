'use client'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'

const ROW: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
  borderRadius: 'calc(var(--sz-radius) * 0.5)', textDecoration: 'none',
  color: 'var(--p-ink)', fontFamily: 'Inter, sans-serif',
  fontSize: 'calc(var(--sz-body) * 0.929)', fontWeight: 500, whiteSpace: 'nowrap',
}

const icon = (children: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p-muted)"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
)

/* 홈 상단 오른쪽 바로가기 메뉴: 검색, 타이머 PRO, 네이버 스토어 */
export default function QuickMenu({ storeUrl }: { storeUrl?: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={root} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        className="neu-sm"
        aria-label="바로가기 메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 38, height: 38, padding: 0, border: 'none', cursor: 'pointer',
          borderRadius: 'calc(var(--sz-radius) * 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p-muted)" strokeWidth="1.6" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      </button>

      {open && (
        <div className="neu" style={{
          position: 'absolute', top: 48, right: 0, zIndex: 200, padding: 6,
          borderRadius: 'calc(var(--sz-radius) * 0.75)',
        }}>
          <Link href="/search" onClick={close} style={ROW}>
            {icon(<><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></>)}
            검색
          </Link>
          <Link href="/timer" onClick={close} style={ROW}>
            {icon(<><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6M12 2v2"/></>)}
            타이머 PRO
          </Link>
          {storeUrl && (
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" onClick={close} style={ROW}>
              {icon(<><path d="M4 9h16l-1.2 11H5.2L4 9z"/><path d="M8.5 9V7a3.5 3.5 0 017 0v2"/></>)}
              네이버 스토어 가기
            </a>
          )}
        </div>
      )}
    </div>
  )
}
