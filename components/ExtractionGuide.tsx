'use client'
import { useState } from 'react'

type DripGuide = {
  temperature?: string; ratio?: string; grind?: string; time?: string;
  bloom_time?: string; bloom_water?: string; pour_method?: string; dripper?: string; notes?: string;
}
type EspGuide = {
  temperature?: string; dose?: string; yield?: string; ratio?: string;
  time?: string; pressure?: string; pre_infusion?: string; notes?: string;
}

// 작성자 앱의 ext-box와 동일한 스타일
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

export default function ExtractionGuide({ drip, esp }: { drip: DripGuide; esp: EspGuide }) {
  const [tab, setTab] = useState<'drip' | 'esp'>('drip')

  const pill = (id: 'drip' | 'esp', label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
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
      {/* 탭 — 작성자 앱의 tab-row / tab-pill과 동일 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {pill('drip', '드립 (Pour Over)')}
        {pill('esp', '에스프레소')}
      </div>

      {/* 드립 */}
      {tab === 'drip' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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

      {/* 에스프레소 */}
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
    </div>
  )
}
