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

function Cell({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="rounded-xl p-3 border" style={{ background: 'var(--c-page-bg)', borderColor: 'var(--c-border)' }}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-3)' }}>{label}</div>
      <div className="text-[13px] font-black" style={{ color: 'var(--c-text-1)' }}>{value}</div>
    </div>
  )
}

function TipBox({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div className="rounded-xl p-3 border col-span-2" style={{ background: 'var(--c-primary-bg)', borderColor: 'var(--c-border)' }}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-3)' }}>추출 팁</div>
      <div className="text-[13px] font-bold leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{text}</div>
    </div>
  )
}

export default function ExtractionGuide({ drip, esp }: { drip: DripGuide; esp: EspGuide }) {
  const [tab, setTab] = useState<'drip' | 'esp'>('drip')

  const tabBtn = (id: 'drip' | 'esp', label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '6px 16px',
        borderRadius: 999,
        border: 'none',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        background: tab === id ? 'var(--c-text-1)' : 'transparent',
        color: tab === id ? '#fff' : 'var(--c-text-3)',
        transition: 'all 0.15s',
      }}
    >{label}</button>
  )

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 mb-4 p-1 rounded-full w-fit" style={{ background: 'var(--c-page-bg)' }}>
        {tabBtn('drip', '드립 (Pour Over)')}
        {tabBtn('esp', '에스프레소')}
      </div>

      {/* 드립 탭 */}
      {tab === 'drip' && (
        <div className="grid grid-cols-2 gap-2">
          <Cell label="물 온도"     value={drip.temperature} />
          <Cell label="커피:물 비율" value={drip.ratio} />
          <Cell label="분쇄도"      value={drip.grind} />
          <Cell label="총 추출 시간" value={drip.time} />
          <Cell label="뜸 들이기"   value={drip.bloom_time} />
          <Cell label="뜸 물량"     value={drip.bloom_water} />
          <Cell label="붓기 방식"   value={drip.pour_method} />
          <Cell label="권장 드리퍼" value={drip.dripper} />
          <TipBox text={drip.notes} />
        </div>
      )}

      {/* 에스프레소 탭 */}
      {tab === 'esp' && (
        <div className="grid grid-cols-2 gap-2">
          <Cell label="물 온도"   value={esp.temperature} />
          <Cell label="도징"      value={esp.dose} />
          <Cell label="수율"      value={esp.yield} />
          <Cell label="추출 비율" value={esp.ratio} />
          <Cell label="추출 시간" value={esp.time} />
          <Cell label="압력"      value={esp.pressure} />
          <Cell label="프리인퓨전" value={esp.pre_infusion} />
          <TipBox text={esp.notes} />
        </div>
      )}
    </div>
  )
}
