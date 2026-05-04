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

const extBox: React.CSSProperties = {
  background: '#FAFAFA',
  borderRadius: 12,
  padding: '13px 15px',
  border: '1px solid var(--c-border)',
}
const extLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--c-text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: 5,
}
const extVal: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: 'var(--c-text-1)',
  wordBreak: 'keep-all',
}

function Cell({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={extBox}>
      <div style={extLabel}>{label}</div>
      <div style={extVal}>{value}</div>
    </div>
  )
}

function TipBox({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div style={{ ...extBox, background: 'var(--c-primary-bg)', gridColumn: '1 / -1' }}>
      <div style={extLabel}>추출 팁</div>
      <div style={{ ...extVal, fontSize: 14, fontWeight: 700, color: 'var(--c-text-2)', lineHeight: 1.6 }}>{text}</div>
    </div>
  )
}

function Stopwatch() {
  const [ms, setMs] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (running) return
    setRunning(true)
    const startTime = Date.now() - ms
    intervalRef.current = setInterval(() => {
      setMs(Date.now() - startTime)
    }, 50)
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

  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const centis  = Math.floor((ms % 1000) / 10)
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`

  const btnBase: React.CSSProperties = {
    flex: 1,
    padding: '12px 8px',
    borderRadius: 12,
    border: 'none',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  }

  return (
    <div style={{
      marginTop: 16,
      padding: '20px',
      background: '#FAFAFA',
      borderRadius: 16,
      border: '1px solid var(--c-border)',
    }}>
      <div style={{ ...extLabel, marginBottom: 12 }}>추출 타이머</div>

      {/* 시간 표시 */}
      <div style={{
        textAlign: 'center',
        fontSize: 44,
        fontWeight: 900,
        letterSpacing: '0.04em',
        fontVariantNumeric: 'tabular-nums',
        color: running ? 'var(--c-primary)' : 'var(--c-text-1)',
        marginBottom: 16,
        transition: 'color 0.2s',
      }}>
        {display}
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!running ? (
          <button onClick={start} style={{ ...btnBase, background: 'var(--c-text-1)', color: '#fff' }}>
            {ms === 0 ? '시작' : '계속'}
          </button>
        ) : (
          <button onClick={pause} style={{ ...btnBase, background: '#F0F0F0', color: 'var(--c-text-2)' }}>
            일시정지
          </button>
        )}
        <button
          onClick={reset}
          style={{ ...btnBase, flex: 0.5, background: '#F0F0F0', color: 'var(--c-text-3)' }}
        >
          초기화
        </button>
      </div>
    </div>
  )
}

export default function ExtractionGuide({ drip, esp }: { drip: DripGuide; esp: EspGuide }) {
  const [tab, setTab] = useState<'drip' | 'esp'>('drip')

  const switchTab = (id: 'drip' | 'esp') => {
    setTab(id)
  }

  const pill = (id: 'drip' | 'esp', label: string) => (
    <button
      key={id}
      onClick={() => switchTab(id)}
      style={{
        padding: '7px 18px',
        borderRadius: 20,
        border: `1.5px solid ${tab === id ? 'var(--c-text-1)' : 'var(--c-border)'}`,
        background: tab === id ? 'var(--c-text-1)' : '#FAFAFA',
        color: tab === id ? '#fff' : 'var(--c-text-2)',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
    >{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {pill('drip', '드립 (Pour Over)')}
        {pill('esp', '에스프레소')}
      </div>

      {tab === 'drip' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Cell label="원두양"       value={drip.coffee_amount} />
          <Cell label="물양"         value={drip.water_amount} />
          <Cell label="물 온도"      value={drip.temperature} />
          <Cell label="커피:물 비율" value={drip.ratio} />
          <Cell label="분쇄도"       value={drip.grind} />
          <Cell label="총 추출 시간" value={drip.time} />
          <Cell label="뜸 들이기"    value={drip.bloom_time} />
          <Cell label="뜸 물량"      value={drip.bloom_water} />
          <Cell label="붓기 방식"    value={drip.pour_method} />
          <Cell label="권장 드리퍼"  value={drip.dripper} />
          <TipBox text={drip.notes} />
        </div>
      )}

      {tab === 'esp' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Cell label="물 온도"    value={esp.temperature} />
          <Cell label="도징"       value={esp.dose} />
          <Cell label="수율"       value={esp.yield} />
          <Cell label="추출 비율"  value={esp.ratio} />
          <Cell label="추출 시간"  value={esp.time} />
          <Cell label="압력"       value={esp.pressure} />
          <Cell label="프리인퓨전" value={esp.pre_infusion} />
          <TipBox text={esp.notes} />
        </div>
      )}

      {/* 타이머 — 탭 전환 시 key가 바뀌어 자동 초기화 */}
      <Stopwatch key={tab} />
    </div>
  )
}
