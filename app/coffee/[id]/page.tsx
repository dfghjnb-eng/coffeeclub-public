import { supabase, Coffee, getSiteSettings } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

export default async function CoffeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [coffee, settings] = await Promise.all([getCoffee(id), getSiteSettings()])
  if (!coffee) notFound()

  const storeUrl   = settings['store_url'] || ''
  const storeLabel = settings['store_label'] || '스마트스토어 가기'
  const storeBg    = settings['store_color'] || '#03C75A'
  const storeText  = settings['store_text_color'] || '#ffffff'

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-bg)' }}>
      <VisitTracker coffeeId={id} />

      {/* 헤더 */}
      <header style={{
        padding: '18px 20px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--p-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="neu-sm" style={{
            width: 44, height: 44, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Image src="/logo.png" alt="커피기술커피클럽" width={30} height={30} className="object-contain" />
          </div>
          <div>
            <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: 'var(--p-ink)', lineHeight: 1, letterSpacing: -0.3 }}>
              커기커피클럽
            </div>
            <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginTop: 3, fontWeight: 500 }}>
              커피기술 아카이브 · COFFEE ARCHIVE
            </div>
          </div>
        </div>
        <Link href="/" style={{
          textDecoration: 'none',
          fontSize: 12, fontWeight: 600, color: 'var(--p-muted)',
        }}>← 목록</Link>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 20px 48px' }}>

        {/* 타이틀 카드 */}
        <div className="neu" style={{
          borderRadius: 28, padding: '22px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 원산지 배지 */}
              <div style={{
                display: 'inline-block',
                fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5,
                marginBottom: 10, fontWeight: 500,
              }}>
                {coffee.origin?.toUpperCase()}
              </div>
              <h1 className="serif" style={{
                fontSize: 28, fontWeight: 500, color: 'var(--p-ink)',
                lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
              }}>
                {coffee.name}
              </h1>
              {coffee.processing && (
                <div style={{ fontSize: 12, color: 'var(--p-muted)', marginTop: 6 }}>
                  {coffee.processing}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <QRSection coffeeId={id} coffeeName={coffee.name} />
            </div>
          </div>

          {/* 맛 노트 태그 */}
          {coffee.flavor_notes && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {coffee.flavor_notes.split(',').map((t: string) => (
                <div key={t} className="neu-sm" style={{
                  padding: '5px 12px', borderRadius: 12,
                  fontSize: 10, fontWeight: 500, color: 'var(--p-text)',
                }}>
                  {t.trim()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFO / BREW / STORY 탭 */}
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
