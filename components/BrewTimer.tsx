'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { Coffee } from '@/lib/supabase'

/* ── 추출 단계 ── */
const PHASES = [
  { label: '뜸들이기', en: 'BLOOM',  duration: 30 },
  { label: '1차 붓기', en: 'POUR 1', duration: 60 },
  { label: '2차 붓기', en: 'POUR 2', duration: 60 },
  { label: '3차 붓기', en: 'POUR 3', duration: 60 },
]
const TOTAL_SEC = PHASES.reduce((s, p) => s + p.duration, 0) // 210초

function pad2(n: number) { return String(Math.floor(n)).padStart(2, '0') }

function formatTime(totalMs: number) {
  const s  = totalMs / 1000
  const m  = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  const cs = Math.floor((totalMs % 1000) / 10)
  return { m: pad2(m), s: pad2(ss), cs: pad2(cs) }
}

/* 원두별 pour 물량 계산 */
function getPourWaters(coffee: Coffee) {
  const drip = coffee.extraction_guide?.drip
  const bloomW = drip?.bloom_water || '40ml'
  const totalWater = parseInt(drip?.water_amount || '300')
  const dose = parseInt(drip?.coffee_amount || '20')
  const remaining = totalWater - dose * 2
  const p = Math.round(remaining / 3)
  return [bloomW, `${p}ml`, `${p}ml`, `${remaining - p * 2}ml`]
}

export default function BrewTimer({ coffee }: { coffee: Coffee }) {
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* 현재 단계 계산 */
  const totalSec = ms / 1000
  let phase = 0, accumulated = 0
  for (let i = 0; i < PHASES.length; i++) {
    if (totalSec < accumulated + PHASES[i].duration) { phase = i; break }
    accumulated += PHASES[i].duration
    phase = PHASES.length - 1
  }
  const isDone  = ms >= TOTAL_SEC * 1000
  const phaseMs = PHASES[phase].duration * 1000
  const phaseStart = PHASES.slice(0, phase).reduce((s, p) => s + p.duration * 1000, 0)
  const phaseProg  = isDone ? 1 : Math.min(1, (ms - phaseStart) / phaseMs)
  const totalProg  = Math.min(1, ms / (TOTAL_SEC * 1000))

  /* 틱 */
  const tick = useCallback(() => {
    setMs(prev => {
      const next = prev + 50
      if (next >= TOTAL_SEC * 1000) { setRunning(false); return TOTAL_SEC * 1000 }
      return next
    })
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 50)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  const handleStartStop = () => { if (!isDone) setRunning(r => !r) }
  const handleReset = () => { setRunning(false); setMs(0) }

  const { m, s, cs } = formatTime(ms)
  const pourWaters = getPourWaters(coffee)
  const drip = coffee.extraction_guide?.drip

  return (
    <div style={{ background: 'var(--p-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 120px' }}>

        {/* ── 상단 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 0 16px' }}>
          <Link href="/timer" style={{ textDecoration: 'none' }}>
            <div className="neu-sm" style={{
              width: 42, height: 42, borderRadius: 21, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 18l-6-6 6-6"/>
              </svg>
            </div>
          </Link>
          <div>
            <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              BREW TIMER
            </div>
            <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: 'var(--p-ink)' }}>
              {coffee.name}
            </div>
          </div>
        </div>

        {/* ── 메인 타이머 카드 ── */}
        <div className="neu" style={{ borderRadius: 28, padding: '28px 24px', textAlign: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 4,
              background: running ? '#FF7F40' : '#B0AC9E',
              transition: 'background 0.3s',
            }} />
            <div style={{
              fontSize: 9, fontWeight: 600, color: 'var(--p-muted)',
              letterSpacing: 1.5, fontFamily: 'Inter, sans-serif',
            }}>
              {isDone ? 'DONE' : running ? 'RECORDING' : 'PAUSED'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="serif" style={{
              fontSize: 64, fontWeight: 300, color: 'var(--p-ink)',
              letterSpacing: -3, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {m}:{s}
            </div>
            <div className="serif" style={{
              fontSize: 28, fontWeight: 300, color: 'var(--p-muted)',
              marginBottom: 4, marginLeft: 2,
              fontVariantNumeric: 'tabular-nums',
            }}>
              .{cs}
            </div>
          </div>
        </div>

        {/* ── 현재 Phase 카드 ── */}
        {!isDone ? (
          <div className="neu" style={{ borderRadius: 24, padding: '18px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 4 }}>
                  PHASE {phase + 1} / {PHASES.length}
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--p-ink)' }}>
                  {PHASES[phase].label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 4 }}>
                  WATER
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: '#FFB48A' }}>
                  {pourWaters[phase]}
                </div>
              </div>
            </div>
            {/* 단계 진행률 바 */}
            <div className="neu-inset" style={{ borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                background: 'var(--p-ink)',
                width: `${phaseProg * 100}%`,
                transition: 'width 0.1s linear',
              }} />
            </div>
            <div style={{
              fontSize: 10, color: 'var(--p-muted)', marginTop: 6,
              fontFamily: 'Inter, sans-serif', textAlign: 'right',
            }}>
              {Math.max(0, Math.ceil(PHASES[phase].duration - (ms - phaseStart) / 1000))}초 남음
            </div>
          </div>
        ) : (
          <div className="neu" style={{
            borderRadius: 24, padding: '24px 20px', marginBottom: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>☕</div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--p-ink)', marginBottom: 4 }}>
              추출 완료!
            </div>
            <div style={{ fontSize: 13, color: 'var(--p-muted)', fontFamily: 'Inter, sans-serif' }}>
              총 {m}:{s} 소요
            </div>
          </div>
        )}

        {/* ── 5단계 인디케이터 ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[...PHASES, { label: '완료', en: 'DONE', duration: 0 }].map((p, i) => {
            const isCompleted = isDone || i < phase
            const isCurrent   = !isDone && i === phase
            const isWaiting   = !isDone && i > phase
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  className={isCompleted ? 'neu-sm' : isCurrent ? 'neu-sm' : 'neu-inset'}
                  style={{
                    borderRadius: 12, padding: '8px 4px',
                    background: isCompleted ? 'var(--p-bg)' : undefined,
                  }}
                >
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: isCompleted ? '#FF7F40' : isCurrent ? 'var(--p-ink)' : 'var(--p-dim)',
                    marginBottom: 2,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <div style={{
                    fontSize: 7, letterSpacing: 0.5, fontWeight: 600,
                    color: isCurrent ? 'var(--p-text)' : 'var(--p-dim)',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {p.en}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 전체 진행률 ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 6,
          }}>
            <span>TOTAL</span>
            <span>{Math.round(totalProg * 100)}%</span>
          </div>
          <div className="neu-inset" style={{ borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8,
              background: `linear-gradient(to right, #FFB48A, #F5D547)`,
              width: `${totalProg * 100}%`,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>

        {/* ── 컨트롤 ── */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={handleStartStop}
            disabled={isDone}
            className="neu-pill"
            style={{
              flex: 1, height: 64, borderRadius: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 10px 0 22px',
              border: 'none', cursor: isDone ? 'default' : 'pointer',
              opacity: isDone ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                {running ? 'PAUSE' : ms === 0 ? 'START' : 'RESUME'}
              </div>
              <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: 'var(--p-ink)' }}>
                {running ? '일시정지' : ms === 0 ? '추출 시작' : '계속'}
              </div>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: 'var(--p-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '3px 3px 8px rgba(0,0,0,0.2)',
            }}>
              {running ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="5" width="4" height="14" rx="1"/>
                  <rect x="14" y="5" width="4" height="14" rx="1"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                  <path d="M7 5l12 7-12 7V5z"/>
                </svg>
              )}
            </div>
          </button>

          <button onClick={handleReset} className="neu-sm" style={{
            width: 64, height: 64, borderRadius: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#2B2B2B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 109-9"/>
              <path d="M3 4v5h5"/>
            </svg>
          </button>
        </div>

        {/* ── 레시피 요약 ── */}
        <div className="neu-inset" style={{ borderRadius: 20, padding: '16px 20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          }}>
            {[
              { label: 'DOSE',  value: drip?.coffee_amount || '-' },
              { label: 'WATER', value: drip?.water_amount  || '-' },
              { label: 'TEMP',  value: drip?.temperature   || '-' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid #E5E2DB' : 'none',
              }}>
                <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: 'var(--p-ink)', marginBottom: 4 }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: 8, fontWeight: 600, color: 'var(--p-muted)',
                  letterSpacing: 1.5, fontFamily: 'Inter, sans-serif',
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
