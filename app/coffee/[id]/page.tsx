import { supabase, Coffee, getSiteSettings } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QRSection from '@/components/QRSection'
import VisitTracker from '@/components/VisitTracker'
import DetailTabs from '@/components/DetailTabs'

export const revalidate = 60

async function getCoffee(id: string): Promise<Coffee | null> {
  const { data } = await supabase
    .from('coffees')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single()
  return data
}

/* 원산지 이모지 */
function OriginFlag({ origin }: { origin: string }) {
  if (origin.includes('브라질'))    return <>🇧🇷</>
  if (origin.includes('에티오피아')) return <>🇪🇹</>
  if (origin.includes('케냐'))      return <>🇰🇪</>
  if (origin.includes('콜롬비아'))  return <>🇨🇴</>
  if (origin.includes('온두라스'))  return <>🇭🇳</>
  if (origin.includes('과테말라'))  return <>🇬🇹</>
  if (origin.includes('인도네시아')) return <>🇮🇩</>
  if (origin.includes('파나마'))    return <>🇵🇦</>
  if (origin.includes('코스타리카')) return <>🇨🇷</>
  if (origin.includes('예멘'))      return <>🇾🇪</>
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888578" strokeWidth="1.6" strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(-25 12 12)"/>
      <path d="M9 5.5C9 9.5 14 13.5 15 18.5" transform="rotate(-25 12 12)"/>
    </svg>
  )
}

export default async function CoffeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [coffee, settings] = await Promise.all([getCoffee(id), getSiteSettings()])
  if (!coffee) notFound()

  const storeUrl   = settings['store_url']        || ''
  const storeLabel = settings['store_label']      || '스마트스토어 가기'
  const storeBg    = settings['store_color']      || '#03C75A'
  const storeText  = settings['store_text_color'] || '#ffffff'

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-bg)' }}>
      <VisitTracker coffeeId={id} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* ── 상단 버튼 행 ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 0 16px',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="neu-sm" style={{
              width: 42, height: 42, borderRadius: 21,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 18l-6-6 6-6"/>
              </svg>
            </div>
          </Link>
          <QRSection coffeeId={id} coffeeName={coffee.name} />
        </div>

        {/* ── Hero 카드 ── */}
        <div className="neu" style={{ borderRadius: 28, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            {/* 원산지 국기 박스 */}
            <div className="neu-sm" style={{
              width: 80, height: 80, borderRadius: 22, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
            }}>
              <OriginFlag origin={coffee.origin ?? ''} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5,
                marginBottom: 6, fontFamily: 'Inter, sans-serif', fontWeight: 600,
              }}>
                {coffee.origin?.toUpperCase()}
              </div>
              <h1 className="serif" style={{
                fontSize: 24, fontWeight: 500, color: 'var(--p-ink)',
                lineHeight: 1.2, letterSpacing: -0.4, margin: '0 0 5px',
              }}>
                {coffee.name}
              </h1>
              {coffee.processing && (
                <div style={{ fontSize: 12, color: 'var(--p-muted)', fontFamily: 'Inter, sans-serif' }}>
                  {coffee.processing}
                </div>
              )}
            </div>
          </div>

          {/* 맛 노트 태그 */}
          {coffee.flavor_notes && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {coffee.flavor_notes.split(',').map((t: string) => (
                <div key={t} className="neu-sm" style={{
                  padding: '5px 12px', borderRadius: 14,
                  fontSize: 10, fontWeight: 500, color: 'var(--p-text)',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {t.trim()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── INFO / BREW / STORY 탭 ── */}
        <DetailTabs
          coffee={coffee}
          storeUrl={storeUrl}
          storeLabel={storeLabel}
          storeBg={storeBg}
          storeText={storeText}
        />
      </div>
    </div>
  )
}
