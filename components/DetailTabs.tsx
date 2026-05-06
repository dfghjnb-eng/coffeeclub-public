'use client'
import { useState } from 'react'
import FlavorSlider from './FlavorSlider'
import ExtractionGuide from './ExtractionGuide'
import type { Coffee } from '@/lib/supabase'

type Props = {
  coffee: Coffee
  storeUrl?: string
  storeLabel?: string
  storeBg?: string
  storeText?: string
}

export default function DetailTabs({ coffee, storeUrl, storeLabel, storeBg, storeText }: Props) {
  const [tab, setTab] = useState<'info' | 'brew' | 'story'>('info')

  const drip = coffee.extraction_guide?.drip || {}
  const esp  = coffee.extraction_guide?.espresso || {}
  const fg   = coffee.flavor_graph || {}
  const quote = coffee.literary_quote || {}

  const TABS: { id: 'info' | 'brew' | 'story'; label: string }[] = [
    { id: 'info',  label: 'INFO' },
    { id: 'brew',  label: 'BREW' },
    { id: 'story', label: 'STORY' },
  ]

  return (
    <div>
      {/* 탭 바 */}
      <div className="neu-inset" style={{
        borderRadius: 22, padding: 5,
        display: 'flex', gap: 4, marginBottom: 16,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1,
            padding: '10px',
            borderRadius: 18,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            background: tab === t.id ? 'var(--p-bg)' : 'transparent',
            boxShadow: tab === t.id
              ? '4px 4px 8px rgba(180,175,160,0.35), -3px -3px 6px rgba(255,255,255,0.85)'
              : 'none',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1,
            color: tab === t.id ? 'var(--p-ink)' : 'var(--p-muted)',
            transition: 'all 0.18s ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INFO 탭 ── */}
      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 기본 정보 카드 */}
          <div className="neu" style={{ borderRadius: 24, padding: '18px' }}>
            <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginBottom: 14 }}>
              COFFEE DATA
            </div>
            {[
              ['원산지', coffee.origin],
              ['가공방식', coffee.processing],
              ['고도', coffee.altitude],
              ['품종', coffee.variety],
            ].filter(([, v]) => v).map(([k, v], i, arr) => (
              <div key={k as string} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F2EFE8' : 'none',
              }}>
                <span style={{ fontSize: 12, color: 'var(--p-muted)' }}>{k}</span>
                <span className="serif" style={{ fontSize: 13, fontWeight: 500, color: 'var(--p-ink)' }}>{v}</span>
              </div>
            ))}

            {/* 맛 노트 태그 */}
            {coffee.flavor_notes && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F2EFE8' }}>
                <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginBottom: 10 }}>
                  TASTING NOTES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {coffee.flavor_notes.split(',').map(t => (
                    <div key={t} className="neu-sm" style={{
                      padding: '6px 12px', borderRadius: 12,
                      fontSize: 11, fontWeight: 500, color: 'var(--p-text)',
                    }}>{t.trim()}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 향미 슬라이더 */}
          {Object.keys(fg).length > 0 && (
            <div className="neu" style={{ borderRadius: 24, padding: '18px 14px' }}>
              <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginBottom: 14, padding: '0 4px' }}>
                FLAVOR PROFILE
              </div>
              <FlavorSlider fg={fg} />
            </div>
          )}

          {/* 인용구 */}
          {quote.text && (
            <div className="neu-inset" style={{ borderRadius: 22, padding: '18px' }}>
              <div className="serif" style={{
                fontSize: 14, fontWeight: 400, color: 'var(--p-text)',
                lineHeight: 1.7, fontStyle: 'italic', marginBottom: 8,
              }}>
                &ldquo;{quote.text}&rdquo;
              </div>
              {quote.translation && (
                <div style={{
                  fontSize: 12, color: 'var(--p-muted)',
                  lineHeight: 1.6, marginBottom: 10,
                }}>
                  {quote.translation}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--p-muted)', letterSpacing: 0.5 }}>
                — {quote.author}{quote.source ? ` / ${quote.source}` : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BREW 탭 ── */}
      {tab === 'brew' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ExtractionGuide drip={drip} esp={esp} />
        </div>
      )}

      {/* ── STORY 탭 ── */}
      {tab === 'story' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {coffee.origin_story ? (
            <div className="neu" style={{ borderRadius: 24, padding: '22px' }}>
              <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginBottom: 14 }}>
                ORIGIN STORY
              </div>
              <p className="serif" style={{
                fontSize: 15, fontWeight: 400, color: 'var(--p-text)', lineHeight: 1.8,
              }}>
                {coffee.origin_story}
              </p>
            </div>
          ) : (
            <div className="neu-inset" style={{ borderRadius: 22, padding: '40px 20px', textAlign: 'center' }}>
              <div className="serif" style={{ fontSize: 16, color: 'var(--p-muted)' }}>원산지 이야기가 없습니다</div>
            </div>
          )}

          {coffee.flavor_notes && (
            <div className="neu" style={{ borderRadius: 24, padding: '18px' }}>
              <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginBottom: 14 }}>
                TASTING NOTES
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {coffee.flavor_notes.split(',').map(n => (
                  <div key={n} className="neu-sm" style={{ padding: '10px 14px', borderRadius: 14 }}>
                    <div className="serif" style={{ fontSize: 14, fontWeight: 500, color: 'var(--p-ink)' }}>
                      {n.trim()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quote.text && (
            <div className="neu-inset" style={{ borderRadius: 22, padding: '20px' }}>
              <div className="serif" style={{
                fontSize: 15, fontWeight: 400, color: 'var(--p-ink)',
                lineHeight: 1.7, fontStyle: 'italic', marginBottom: 10,
              }}>
                &ldquo;{quote.text}&rdquo;
              </div>
              {quote.translation && (
                <div style={{ fontSize: 13, color: 'var(--p-muted)', lineHeight: 1.6, marginBottom: 10 }}>
                  {quote.translation}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--p-muted)', letterSpacing: 0.5 }}>
                — {quote.author}{quote.source ? ` / ${quote.source}` : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 스토어 버튼 */}
      {storeUrl && (
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '18px', borderRadius: 24,
            textDecoration: 'none',
            background: storeBg || '#03C75A',
            color: storeText || '#ffffff',
            fontSize: 15, fontWeight: 700,
            marginTop: 14,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span>{storeLabel || '스마트스토어 가기'}</span>
          <span style={{ opacity: 0.75 }}>→</span>
        </a>
      )}
    </div>
  )
}
