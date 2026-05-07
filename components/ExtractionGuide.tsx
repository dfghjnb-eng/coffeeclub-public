'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type DripGuide = {
  coffee_amount?: string; water_amount?: string;
  temperature?: string; ratio?: string; grind?: string; time?: string;
  bloom_time?: string; bloom_water?: string; pour_method?: string; dripper?: string; notes?: string;
}
type EspGuide = {
  temperature?: string; dose?: string; yield?: string; ratio?: string;
  time?: string; pressure?: string; pre_infusion?: string; notes?: string;
}

/* 아이콘 SVG */
function Ico({ name, size=14, color='#888578' }: { name: string; size?: number; color?: string }) {
  const sw = 1.6
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const icons: Record<string, React.ReactNode> = {
    bean:   <svg {...p}><ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(-25 12 12)"/><path d="M9 5.5C9 9.5 14 13.5 15 18.5" transform="rotate(-25 12 12)"/></svg>,
    drop:   <svg {...p}><path d="M12 3s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z"/></svg>,
    therm:  <svg {...p}><path d="M10 14V5a2 2 0 114 0v9a4 4 0 11-4 0z"/><circle cx="12" cy="16" r="2" fill={color}/></svg>,
    grid:   <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    ratio:  <svg {...p}><path d="M12 5v14M5 12h14"/></svg>,
    timer:  <svg {...p}><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2"/><path d="M9 3h6"/><path d="M12 3v3"/></svg>,
    press:  <svg {...p}><path d="M12 3v4M8 5l1.5 3M16 5l-1.5 3"/><circle cx="12" cy="13" r="5"/><path d="M10 10l4 6M14 10l-4 6"/></svg>,
    cup:    <svg {...p}><path d="M5 9h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4V9z"/><path d="M16 11h2a2 2 0 010 4h-2"/></svg>,
    play:   <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7 5l12 7-12 7V5z"/></svg>,
    pause:  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>,
    reset:  <svg {...p}><path d="M3 12a9 9 0 109-9"/><path d="M3 4v5h5"/></svg>,
  }
  return <>{icons[name] || null}</>
}

/* 파라미터 셀 */
function ParamCell({ label, value, icon }: { label: string; value?: string; icon: string }) {
  if (!value) return null
  return (
    <div className="neu-inset" style={{ borderRadius: 18, padding: '14px 12px' }}>
      <Ico name={icon} size={14} color="#888578" />
      <div style={{ fontSize: 9, color: '#888578', letterSpacing: 0.8, marginTop: 6, marginBottom: 3 }}>{label}</div>
      <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: '#1A1A1A', letterSpacing: -0.3 }}>{value}</div>
    </div>
  )
}

/* 팁 박스 */
function TipBox({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div className="neu-inset" style={{
      borderRadius: 18, padding: '14px 16px', gridColumn: '1 / -1',
    }}>
      <div style={{ fontSize: 9, color: '#888578', letterSpacing: 0.8, marginBottom: 6 }}>TIPS</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#2B2B2B', lineHeight: 1.65 }}>{text}</div>
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

  const mm   = String(Math.floor(ms / 60000)).padStart(2, '0')
  const ss   = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  const cs   = String(Math.floor((ms % 1000) / 10)).padStart(2, '0')

  return (
    <div style={{ marginTop: 14 }}>
      {/* 시간 표시 */}
      <div className="neu" style={{ borderRadius: 24, padding: '24px 20px', textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#888578', letterSpacing: 1.5, marginBottom: 10 }}>간편 추출 타이머</div>
        <div className="serif" style={{
          fontSize: 56, fontWeight: 300, color: running ? '#FF7F40' : '#1A1A1A',
          letterSpacing: -2, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.2s',
        }}>
          {mm}<span style={{ opacity: running ? 1 : 0.35 }}>:</span>{ss}
          <span style={{ fontSize: 24, color: '#888578', marginLeft: 4 }}>.{cs}</span>
        </div>
        <div style={{ fontSize: 10, color: '#888578', letterSpacing: 1.5, marginTop: 8 }}>
          {running ? '● RECORDING' : 'PAUSED'}
        </div>
      </div>

      {/* 컨트롤 */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={running ? pause : start} className="neu-pill" style={{
          flex: 1, borderRadius: 30, height: 60, padding: '0 8px 0 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          transition: 'all 0.18s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 9, color: '#888578', letterSpacing: 1 }}>{running ? 'PAUSE' : ms === 0 ? 'START' : 'RESUME'}</div>
            <div className="serif" style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A' }}>
              {running ? '일시정지' : ms === 0 ? '추출 시작' : '계속'}
            </div>
          </div>
          <div style={{
            width: 46, height: 46, borderRadius: 23, background: '#1A1A1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
          }}>
            <Ico name={running ? 'pause' : 'play'} size={18} color="#fff" />
          </div>
        </button>
        <button onClick={reset} className="neu-sm" style={{
          width: 60, height: 60, borderRadius: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}>
          <Ico name="reset" size={20} color="#2B2B2B" />
        </button>
      </div>
    </div>
  )
}

const TAB_ORDER_EG: Array<'drip' | 'esp'> = ['drip', 'esp']

export default function ExtractionGuide({ drip, esp }: { drip: DripGuide; esp: EspGuide }) {
  const [tab, setTab]     = useState<'drip' | 'esp'>('drip')
  const [dir, setDir]     = useState<'right' | 'left'>('right')
  const [animKey, setAnimKey] = useState(0)

  function switchTab(next: 'drip' | 'esp') {
    const oldIdx = TAB_ORDER_EG.indexOf(tab)
    const newIdx = TAB_ORDER_EG.indexOf(next)
    setDir(newIdx >= oldIdx ? 'right' : 'left')
    setTab(next)
    setAnimKey(k => k + 1)
  }

  return (
    <div>
      {/* 드립 / 에스프레소 전환 */}
      <div className="neu-inset" style={{ borderRadius: 20, padding: 4, display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['drip', 'esp'] as const).map((id) => (
          <button key={id} onClick={() => switchTab(id)} style={{
            flex: 1, padding: '9px', borderRadius: 17,
            border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            background: tab === id ? 'var(--p-bg)' : 'transparent',
            boxShadow: tab === id
              ? '4px 4px 8px rgba(180,175,160,0.35), -3px -3px 6px rgba(255,255,255,0.85)'
              : 'none',
            fontSize: 10, fontWeight: 600, letterSpacing: 1,
            color: tab === id ? '#1A1A1A' : '#888578',
            transition: 'all 0.18s ease',
          }}>
            {id === 'drip' ? 'POUR OVER' : 'ESPRESSO'}
          </button>
        ))}
      </div>

      {/* 파라미터 그리드 — 슬라이딩 애니메이션 */}
      <div key={animKey} className={dir === 'right' ? 'slide-right' : 'slide-left'}>
      <div className="neu" style={{ borderRadius: 24, padding: '18px' }}>
        <div style={{ fontSize: 9, color: '#888578', letterSpacing: 1.5, marginBottom: 14 }}>PARAMETERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {tab === 'drip' ? (
            <>
              <ParamCell label="DOSE"    value={drip.coffee_amount} icon="bean" />
              <ParamCell label="WATER"   value={drip.water_amount}  icon="drop" />
              <ParamCell label="TEMP"    value={drip.temperature}   icon="therm" />
              <ParamCell label="GRIND"   value={drip.grind}         icon="grid" />
              <ParamCell label="RATIO"   value={drip.ratio}         icon="ratio" />
              <ParamCell label="TIME"    value={drip.time}          icon="timer" />
              <ParamCell label="BLOOM"   value={drip.bloom_time}    icon="timer" />
              <ParamCell label="BLOOM W" value={drip.bloom_water}   icon="drop" />
              <ParamCell label="POUR"    value={drip.pour_method}   icon="cup" />
              <ParamCell label="DRIPPER" value={drip.dripper}       icon="cup" />
              <TipBox text={drip.notes} />
            </>
          ) : (
            <>
              <ParamCell label="TEMP"       value={esp.temperature}   icon="therm" />
              <ParamCell label="DOSE"       value={esp.dose}          icon="bean" />
              <ParamCell label="YIELD"      value={esp.yield}         icon="drop" />
              <ParamCell label="RATIO"      value={esp.ratio}         icon="ratio" />
              <ParamCell label="TIME"       value={esp.time}          icon="timer" />
              <ParamCell label="PRESSURE"   value={esp.pressure}      icon="press" />
              <ParamCell label="PRE-INFUSE" value={esp.pre_infusion}  icon="timer" />
              <TipBox text={esp.notes} />
            </>
          )}
        </div>
      </div>
      </div>{/* ── 슬라이딩 래퍼 닫기 ── */}

      {/* 타이머 — 탭 전환 시 초기화 */}
      <Stopwatch key={tab} />
    </div>
  )
}
