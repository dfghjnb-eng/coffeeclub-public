'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const TABS = [
  {
    key: 'home',
    label: 'HOME',
    href: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    key: 'search',
    label: 'SEARCH',
    href: '/search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="11" cy="11" r="7"/>
        <path d="M16.5 16.5L21 21"/>
      </svg>
    ),
  },
  {
    key: 'timer',
    label: 'TIMER',
    href: '/timer',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="13" r="8"/>
        <path d="M12 9v4l2.5 2.5"/>
        <path d="M9 2h6M12 2v2"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  const activeKey =
    pathname.startsWith('/search') ? 'search' :
    pathname.startsWith('/timer')  ? 'timer'  :
    'home'

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      padding: '12px 20px 28px',
      background: 'linear-gradient(to top, var(--p-bg) 70%, transparent)',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 4, padding: 8,
        background: '#F2EFE8',
        borderRadius: 40,
        boxShadow: '6px 6px 14px rgba(180,175,160,0.4), -5px -5px 12px rgba(255,255,255,0.85)',
        pointerEvents: 'auto',
      }}>
        {TABS.map(({ key, label, href, icon }) => {
          const isActive = activeKey === key
          return (
            <Link key={key} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 16px',
                borderRadius: 30,
                background: isActive ? '#1A1A1A' : 'transparent',
                color: isActive ? '#ffffff' : '#888578',
                boxShadow: isActive ? '3px 3px 8px rgba(0,0,0,0.2)' : 'none',
                transition: 'background 0.28s ease, color 0.28s ease, box-shadow 0.28s ease',
                gap: 6,
              }}>
                {/* SVG uses currentColor → animates with parent color */}
                <span style={{
                  display: 'flex', alignItems: 'center', flexShrink: 0,
                  transition: 'color 0.28s ease',
                }}>
                  {icon}
                </span>

                {/* 라벨: max-width 슬라이드로 부드럽게 열림/닫힘 */}
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.8,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  maxWidth: isActive ? '52px' : '0px',
                  opacity: isActive ? 1 : 0,
                  transition: 'max-width 0.3s ease, opacity 0.22s ease',
                }}>
                  {label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
