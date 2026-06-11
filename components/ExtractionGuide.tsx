'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const FUTURA = "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif"

type DripGuide = {
  coffee_amount?: string; water_amount?: string;
  temperature?: string; ratio?: string; grind?: string; time?: string;
  bloom_time?: string; bloom_water?: string; pour_method?: string; dripper?: string; notes?: string;
}
type EspGuide = {
  temperature?: string; dose?: string; yield?: string; ratio?: string;
  time?: string; pressure?: string; pre_infusion?: string; notes?: string;
}

/* pour_method 파싱: "4회 분할 (40-80-90-90ml)" → [40, 80, 90, 90] */
function parsePourSteps(pourMethod?: string): number[] | null {
  if (!pourMethod) return null
  const m = pourMethod.match(/\(([^)]+)\)/)
  if (!m) return null
  const nums = m[1].replace(/ml/gi, '').split('-').map(Number).filter(n => !isNaN(n) && n > 0)
  return nums.length >= 2 ? nums : null
}

/* SVG 꺾은선 그래프 */
function PourLineChart({ steps }: { steps: number[] }) {
  const W = 354
  const H = 80
  const PAD = 8
  const max = Math.max(...steps)
  const n = steps.length

  // x: 균등 분할, y: 물량 비율 (위쪽이 많음)
  const pts = steps.map((v, i) => {
    const x = PAD + (i / (n - 1)) * (W - PAD * 2)
    const y = H - PAD - (v / max) * (H - PAD * 2 - 6)
    return { x, y, v }
  })

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${H} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length - 1].x},${H}`

  const stepNames = ['BLOOM', '1ST', '2ND', '3RD', '4TH']

  return (
    <div>
      {/* 물량 라벨 (위) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
        {steps.map((v, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: FUTURA, fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{v}㎖</div>
            <div style={{ fontFamily: FUTURA, fontSize: 8, color: '#888578', letterSpacing: '1px', marginTop: 2 }}>
              {stepNames[i] ?? `${i}차`}
            </div>
          </div>
        ))}
      </div>

      {/* SVG */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888578" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#888578" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        {/* 가이드라인 */}
        {[0.25, 0.5, 0.75].map((r, i) => (
          <line key={i} x1={PAD} y1={PAD + r * (H - PAD * 2)} x2={W - PAD} y2={PAD + r * (H - PAD * 2)}
            stroke="#888578" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.2"/>
        ))}
        {/* 영역 */}
        <polygon points={area} fill="url(#areaGrad)"/>
        {/* 꺾은선 */}
        <polyline points={polyline} stroke="#888578" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        {/* 포인트 */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4.5"
            fill="#F0EDE6"
            stroke={i === 0 ? '#C8A97A' : '#888578'}
            strokeWidth="2"/>
        ))}
      </svg>
    </div>
  )
}

/* 파라미터 셀 — 큰 버전 */
function KeyCell({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{
      background: 'var(--p-bg)', borderRadius: 18,
      boxShadow: 'inset 3px 3px 8px rgba(180,175,160,0.4), inset -2px -2px 6px rgba(255,255,255,0.85)',
      padding: '16px 10px 14px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: FUTURA, fontSize: 8, color: '#888578', letterSpacing: '1.5px', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FUTURA, fontSize: 22, fontWeight: 500, color: '#1A1A1A', letterSpacing: '-0.3px' }}>{value}</div>
    </div>
  )
}

/* 파라미터 셀 — 작은 버전 */
function SubCell({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{
      background: 'var(--p-bg)', borderRadius: 14,
      boxShadow: '3px 3px 8px rgba(180,175,160,0.35), -2px -2px 6px rgba(255,255,255,0.85)',
      padding: '10px 8px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: FUTURA, fontSize: 8, color: '#888578', letterSpacing: '1.2px', marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FUTURA, fontSize: 12, fontWeight: 500, color: '#2B2B2B' }}>{value}</div>
    </div>
  )
}

/* 에스프레소 파라미터 셀 */
function EspCell({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{
      background: 'var(--p-bg)', borderRadius: 18,
      boxShadow: 'inset 3px 3px 8px rgba(180,175,160,0.4), inset -2px -2px 6px rgba(255,255,255,0.85)',
      padding: '14px 12px',
    }}>
      <div style={{ fontFamily: FUTURA, fontSize: 8, color: '#888578', letterSpacing: '1.2px', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FUTURA, fontSize: 18, fontWeight: 500, color: '#1A1A1A' }}>{value}</div>
    </div>
  )
}

/* 스톱워치 */
function Stopwatch() {
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (running) return
    setRunning(true)
    const startTime = Date.now() - ms
    intervalRef.current = setInterval(() => setMs(Date.now() - startTime), 50)
  }, [running, ms])

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setMs(0)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const mm = String(Math.floor(ms / 60000)).padStart(2, '0')
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0')

  return (
    <div style={{ marginTop: 14 }}>
      <div className="neu" style={{ borderRadius: 24, padding: '24px 20px', textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.5px', marginBottom: 10 }}>간편 추출 타이머</div>
        <div style={{
          fontFamily: FUTURA, fontSize: 56, fontWeight: 300,
          color: running ? '#FF7F40' : '#1A1A1A',
          letterSpacing: -2, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', transition: 'color 0.2s',
        }}>
          {mm}<span style={{ opacity: running ? 1 : 0.35 }}>:</span>{ss}
          <span style={{ fontSize: 24, color: '#888578', marginLeft: 4 }}>.{cs}</span>
        </div>
        <div style={{ fontFamily: FUTURA, fontSize: 10, color: '#888578', letterSpacing: '1.5px', marginTop: 8 }}>
          {running ? '● RECORDING' : 'PAUSED'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={running ? pause : start} className="neu-pill" style={{
          flex: 1, borderRadius: 30, height: 60, padding: '0 8px 0 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          border: 'none', cursor: 'pointer', fontFamily: FUTURA, transition: 'all 0.18s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 9, color: '#888578', letterSpacing: '1px' }}>{running ? 'PAUSE' : ms === 0 ? 'START' : 'RESUME'}</div>
            <div style={{ fontFamily: FUTURA, fontSize: 16, fontWeight: 500, color: '#1A1A1A' }}>
              {running ? '일시정지' : ms === 0 ? '추출 시작' : '계속'}
            </div>
          </div>
          <div style={{
            width: 46, height: 46, borderRadius: 23, background: '#1A1A1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
          }}>
            {running
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M7 5l12 7-12 7V5z"/></svg>
            }
          </div>
        </button>
        <button onClick={reset} className="neu-sm" style={{
          width: 60, height: 60, borderRadius: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer', transition: 'all 0.18s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B2B2B" strokeWidth="1.6" strokeLinecap="round">
            <path d="M3 12a9 9 0 109-9"/><path d="M3 4v5h5"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

const TAB_ORDER_EG: Array<'drip' | 'esp'> = ['drip', 'esp']

export default function ExtractionGuide({ drip, esp }: { drip: DripGuide; esp: EspGuide }) {
  const [tab, setTab] = useState<'drip' | 'esp'>('drip')
  const [dir, setDir] = useState<'right' | 'left'>('right')
  const [animKey, setAnimKey] = useState(0)

  function switchTab(next: 'drip' | 'esp') {
    const oldIdx = TAB_ORDER_EG.indexOf(tab)
    const newIdx = TAB_ORDER_EG.indexOf(next)
    setDir(newIdx >= oldIdx ? 'right' : 'left')
    setTab(next)
    setAnimKey(k => k + 1)
  }

  const pourSteps = parsePourSteps(drip.pour_method)

  return (
    <div>
      {/* 드립 / 에스프레소 전환 */}
      <div className="neu-inset" style={{ borderRadius: 20, padding: 4, display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['drip', 'esp'] as const).map((id) => (
          <button key={id} onClick={() => switchTab(id)} style={{
            flex: 1, padding: '9px', borderRadius: 17,
            border: 'none', cursor: 'pointer',
            fontFamily: FUTURA,
            background: tab === id ? 'var(--p-bg)' : 'transparent',
            boxShadow: tab === id
              ? '4px 4px 8px rgba(180,175,160,0.35), -3px -3px 6px rgba(255,255,255,0.85)'
              : 'none',
            fontSize: 10, fontWeight: 600, letterSpacing: '1.5px',
            color: tab === id ? '#1A1A1A' : '#888578',
            transition: 'all 0.18s ease',
          }}>
            {id === 'drip' ? 'POUR OVER' : 'ESPRESSO'}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div key={animKey} className={dir === 'right' ? 'slide-right' : 'slide-left'}>

        {/* ── POUR OVER ── */}
        {tab === 'drip' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* RECIPE 카드 */}
            <div className="neu" style={{ borderRadius: 24, padding: 18 }}>
              <div style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.8px', fontWeight: 600, marginBottom: 14 }}>RECIPE</div>

              {/* 핵심 3개 크게 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <KeyCell label="DOSE"  value={drip.coffee_amount} />
                <KeyCell label="WATER" value={drip.water_amount} />
                <KeyCell label="TEMP"  value={drip.temperature} />
              </div>

              {/* 보조 3개 작게 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <SubCell label="GRIND" value={drip.grind} />
                <SubCell label="RATIO" value={drip.ratio} />
                <SubCell label="TIME"  value={drip.time} />
              </div>
            </div>

            {/* POUR GUIDE 카드 */}
            {pourSteps ? (
              <div className="neu" style={{ borderRadius: 24, padding: 18 }}>
                <div style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.8px', fontWeight: 600, marginBottom: 14 }}>
                  POUR GUIDE — {drip.pour_method?.split(' ')[0]}
                </div>
                <PourLineChart steps={pourSteps} />
                {/* 타이밍 */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderTop: '1px solid rgba(136,133,120,0.15)',
                  paddingTop: 8, marginTop: 8,
                }}>
                  {pourSteps.map((_, i) => {
                    // bloom=0, 이후 균등 분배 (총 시간 약 3:30 = 210초)
                    const totalSec = 210
                    const bloomSec = 45
                    const restSec = totalSec - bloomSec
                    const sec = i === 0 ? 0 : Math.round(bloomSec + (restSec / (pourSteps.length - 1)) * i)
                    const m = Math.floor(sec / 60)
                    const s = sec % 60
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '0.5px' }}>
                        {m}:{String(s).padStart(2, '0')}
                      </div>
                    )
                  })}
                </div>
                {/* DRIPPER */}
                {drip.dripper && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(136,133,120,0.15)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.5px', fontWeight: 600 }}>DRIPPER</span>
                    <span style={{ fontFamily: FUTURA, fontSize: 12, color: '#2B2B2B' }}>{drip.dripper}</span>
                  </div>
                )}
              </div>
            ) : drip.pour_method ? (
              /* pour_method 파싱 실패 시 텍스트 폴백 */
              <div className="neu" style={{ borderRadius: 24, padding: 18 }}>
                <div style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.8px', fontWeight: 600, marginBottom: 10 }}>POUR GUIDE</div>
                <div style={{ fontFamily: FUTURA, fontSize: 13, color: '#2B2B2B' }}>{drip.pour_method}</div>
                {drip.dripper && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(136,133,120,0.15)', display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.5px', fontWeight: 600 }}>DRIPPER</span>
                    <span style={{ fontFamily: FUTURA, fontSize: 12, color: '#2B2B2B' }}>{drip.dripper}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* NOTES 카드 */}
            {drip.notes && (
              <div style={{
                background: 'var(--p-bg)', borderRadius: 20,
                boxShadow: 'inset 3px 3px 8px rgba(180,175,160,0.4), inset -2px -2px 6px rgba(255,255,255,0.85)',
                padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ width: 2, borderRadius: 2, background: '#888578', opacity: 0.45, alignSelf: 'stretch', flexShrink: 0 }}/>
                <div style={{ fontFamily: FUTURA, fontSize: 13, fontWeight: 400, color: '#2B2B2B', lineHeight: 1.75 }}>
                  {drip.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ESPRESSO ── */}
        {tab === 'esp' && (
          <div className="neu" style={{ borderRadius: 24, padding: 18 }}>
            <div style={{ fontFamily: FUTURA, fontSize: 9, color: '#888578', letterSpacing: '1.8px', fontWeight: 600, marginBottom: 14 }}>PARAMETERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <EspCell label="TEMP"       value={esp.temperature} />
              <EspCell label="DOSE"       value={esp.dose} />
              <EspCell label="YIELD"      value={esp.yield} />
              <EspCell label="RATIO"      value={esp.ratio} />
              <EspCell label="TIME"       value={esp.time} />
              <EspCell label="PRESSURE"   value={esp.pressure} />
              <EspCell label="PRE-INFUSE" value={esp.pre_infusion} />
            </div>
            {esp.notes && (
              <div style={{
                marginTop: 10,
                background: 'var(--p-bg)', borderRadius: 16,
                boxShadow: 'inset 3px 3px 8px rgba(180,175,160,0.4), inset -2px -2px 6px rgba(255,255,255,0.85)',
                padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ width: 2, borderRadius: 2, background: '#888578', opacity: 0.45, alignSelf: 'stretch', flexShrink: 0 }}/>
                <div style={{ fontFamily: FUTURA, fontSize: 13, color: '#2B2B2B', lineHeight: 1.75 }}>{esp.notes}</div>
              </div>
            )}
          </div>
        )}

      </div>{/* 슬라이딩 래퍼 닫기 */}

      {/* 타이머 */}
      <Stopwatch key={tab} />
    </div>
  )
}
