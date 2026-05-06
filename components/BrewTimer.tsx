'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { Coffee } from '@/lib/supabase'

/* ══════════════════════════════════════════
   파싱 유틸리티
══════════════════════════════════════════ */

/** "30초" / "3분 30초" / "3:30" / "210" → 초(number) */
function parseSeconds(str?: string): number {
  if (!str) return 60
  const s = str.trim()

  // "3분 30초" or "3분30초"
  const minsec = s.match(/(\d+)\s*분\s*(\d+)?\s*초?/)
  if (minsec) return parseInt(minsec[1]) * 60 + parseInt(minsec[2] || '0')

  // "3분"
  const min = s.match(/^(\d+)\s*분$/)
  if (min) return parseInt(min[1]) * 60

  // "30초"
  const sec = s.match(/^(\d+)\s*초$/)
  if (sec) return parseInt(sec[1])

  // "3:30"
  if (s.includes(':')) {
    const [m, sv] = s.split(':').map(Number)
    return (m || 0) * 60 + (sv || 0)
  }

  const n = parseInt(s)
  return isNaN(n) ? 60 : n
}

/** "40ml" / "커피량의 2배 (40ml)" / "40" → ml(number) */
function parseMl(str?: string): number {
  if (!str) return 0
  const m = str.match(/(\d+)\s*ml/i)
  if (m) return parseInt(m[1])
  const n = parseInt(str)
  return isNaN(n) ? 0 : n
}

/** pour_method에서 분할 물량 파싱
 *  "3회 분할 (40-80-90-90ml)"  → [40, 80, 90, 90]
 *  "(30-120-100ml)"            → [30, 120, 100]
 *  실패 시 null 반환 */
function parsePourMethod(str?: string): number[] | null {
  if (!str) return null
  const inner = str.match(/\(([0-9\-]+ml?)\)/i)
  if (!inner) return null
  const parts = inner[1].replace(/ml/gi, '').split('-').map(Number).filter(n => !isNaN(n) && n > 0)
  return parts.length >= 2 ? parts : null
}

/* ══════════════════════════════════════════
   원두 데이터 → Phase 배열 생성
══════════════════════════════════════════ */
interface Phase {
  label: string
  en: string
  duration: number   // seconds
  water: string
}

function buildPhases(coffee: Coffee): Phase[] {
  const drip = coffee.extraction_guide?.drip ?? {}

  const bloomSec   = parseSeconds(drip.bloom_time)
  const bloomWater = drip.bloom_water || `${parseMl(drip.coffee_amount) * 2}ml`
  const bloomMl    = parseMl(bloomWater)
  const totalMl    = parseMl(drip.water_amount)
  const totalSec   = parseSeconds(drip.time)

  const remainSec  = Math.max(totalSec - bloomSec, 90)
  const remainMl   = Math.max(totalMl - bloomMl, 0)

  // pour_method에서 분할 물량 파싱 시도
  const pourParts = parsePourMethod(drip.pour_method)

  let pourWaters: string[]
  if (pourParts && pourParts.length === 3) {
    pourWaters = pourParts.map(n => `${n}ml`)
  } else if (pourParts && pourParts.length === 4) {
    // bloom 포함 4개일 경우 뒤 3개 사용
    pourWaters = pourParts.slice(1).map(n => `${n}ml`)
  } else {
    // 균등 3분할
    const p1 = Math.round(remainMl / 3)
    const p2 = Math.round(remainMl / 3)
    const p3 = remainMl - p1 - p2
    pourWaters = [`${p1}ml`, `${p2}ml`, `${p3}ml`]
  }

  // 시간 3분할
  const t1 = Math.round(remainSec / 3)
  const t2 = Math.round(remainSec / 3)
  const t3 = remainSec - t1 - t2

  return [
    { label: '뜸들이기', en: 'BLOOM',  duration: bloomSec, water: bloomWater },
    { label: '1차 붓기', en: 'POUR 1', duration: t1,       water: pourWaters[0] },
    { label: '2차 붓기', en: 'POUR 2', duration: t2,       water: pourWaters[1] },
    { label: '3차 붓기', en: 'POUR 3', duration: t3,       water: pourWaters[2] },
  ]
}

/* ══════════════════════════════════════════
   타이머 컴포넌트
══════════════════════════════════════════ */
function pad2(n: number) { return String(Math.floor(n)).padStart(2, '0') }
function formatTime(totalMs: number) {
  const s  = totalMs / 1000
  const m  = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  const cs = Math.floor((totalMs % 1000) / 10)
  return { m: pad2(m), s: pad2(ss), cs: pad2(cs) }
}

export default function BrewTimer({ coffee }: { coffee: Coffee }) {
  const phases  = buildPhases(coffee)
  const totalSec = phases.reduce((s, p) => s + p.duration, 0)

  const [ms, setMs]         = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* 현재 단계 */
  const totalMs = totalSec * 1000
  let phase = 0
  let phaseStart = 0
  {
    let acc = 0
    for (let i = 0; i < phases.length; i++) {
      if (ms < (acc + phases[i].duration) * 1000) { phase = i; phaseStart = acc * 1000; break }
      acc += phases[i].duration
      phase = phases.length - 1
      phaseStart = acc * 1000
    }
  }
  const isDone     = ms >= totalMs
  const phaseMs    = phases[phase].duration * 1000
  const phaseProg  = isDone ? 1 : Math.min(1, (ms - phaseStart) / phaseMs)
  const totalProg  = Math.min(1, ms / totalMs)
  const secLeft    = Math.max(0, Math.ceil((phaseStart + phaseMs - ms) / 1000))

  /* 틱 */
  const tick = useCallback(() => {
    setMs(prev => {
      const next = prev + 50
      if (next >= totalMs) { setRunning(false); return totalMs }
      return next
    })
  }, [totalMs])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 50)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  const handleStartStop = () => { if (!isDone) setRunning(r => !r) }
  const handleReset     = () => { setRunning(false); setMs(0) }

  const { m, s, cs } = formatTime(ms)
  const drip = coffee.extraction_guide?.drip ?? {}

  return (
    <div style={{ background: 'var(--p-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 120px' }}>

        {/* ── 상단 헤더 ── */}
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
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif' }}>
              {isDone ? 'DONE' : running ? 'RECORDING' : 'PAUSED'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="serif" style={{
              fontSize: 64, fontWeight: 300, color: 'var(--p-ink)',
              letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {m}:{s}
            </div>
            <div className="serif" style={{
              fontSize: 28, fontWeight: 300, color: 'var(--p-muted)',
              marginBottom: 4, marginLeft: 2, fontVariantNumeric: 'tabular-nums',
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
                  PHASE {phase + 1} / {phases.length}
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--p-ink)' }}>
                  {phases[phase].label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 4 }}>
                  WATER
                </div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: '#FFB48A' }}>
                  {phases[phase].water}
                </div>
              </div>
            </div>
            {/* 단계 진행률 */}
            <div className="neu-inset" style={{ borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                background: 'var(--p-ink)',
                width: `${phaseProg * 100}%`,
                transition: 'width 0.1s linear',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--p-muted)', marginTop: 6, fontFamily: 'Inter, sans-serif', textAlign: 'right' }}>
              {secLeft}초 남음 / {phases[phase].duration}초
            </div>
          </div>
        ) : (
          <div className="neu" style={{ borderRadius: 24, padding: '28px 20px', marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>☕</div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--p-ink)', marginBottom: 4 }}>
              추출 완료!
            </div>
            <div style={{ fontSize: 13, color: 'var(--p-muted)', fontFamily: 'Inter, sans-serif' }}>
              총 {m}:{s} 소요
            </div>
          </div>
        )}

        {/* ── 5단계 인디케이터 ── */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
          {[...phases, { label: '완료', en: 'DONE', duration: 0, water: '' }].map((p, i) => {
            const isCompleted = isDone || i < phase
            const isCurrent   = !isDone && i === phase
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  className={isCompleted || isCurrent ? 'neu-sm' : 'neu-inset'}
                  style={{ borderRadius: 12, padding: '8px 2px' }}
                >
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: isCompleted ? '#FF7F40' : isCurrent ? 'var(--p-ink)' : 'var(--p-dim)',
                    marginBottom: 2, fontFamily: 'Inter, sans-serif',
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
            <span>TOTAL PROGRESS</span>
            <span>{Math.round(totalProg * 100)}%</span>
          </div>
          <div className="neu-inset" style={{ borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8,
              background: 'linear-gradient(to right, #FFB48A, #F5D547)',
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

        {/* ── Pour Sequence 요약 ── */}
        <div className="neu" style={{ borderRadius: 24, padding: '18px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: 14 }}>
            POUR SEQUENCE
          </div>
          {phases.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingBottom: i < phases.length - 1 ? 12 : 0,
              marginBottom: i < phases.length - 1 ? 12 : 0,
              borderBottom: i < phases.length - 1 ? '1px solid #F2EFE8' : 'none',
              opacity: isDone || i <= phase ? 1 : 0.45,
            }}>
              <div className={i <= phase ? 'neu-sm' : 'neu-inset'} style={{
                width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                  color: i < phase || isDone ? '#FF7F40' : i === phase ? 'var(--p-ink)' : 'var(--p-dim)',
                }}>
                  {i < phase || isDone ? '✓' : i + 1}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-ink)', fontFamily: 'Inter, sans-serif', marginBottom: 1 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-muted)', fontFamily: 'Inter, sans-serif' }}>
                  {p.duration}초
                </div>
              </div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: '#FFB48A' }}>
                {p.water}
              </div>
            </div>
          ))}
        </div>

        {/* ── 레시피 요약 ── */}
        <div className="neu-inset" style={{ borderRadius: 20, padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { label: 'DOSE',  value: drip.coffee_amount || '-' },
              { label: 'WATER', value: drip.water_amount  || '-' },
              { label: 'TEMP',  value: drip.temperature   || '-' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid #E5E2DB' : 'none',
              }}>
                <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: 'var(--p-ink)', marginBottom: 4 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--p-muted)', letterSpacing: 1.5, fontFamily: 'Inter, sans-serif' }}>
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
