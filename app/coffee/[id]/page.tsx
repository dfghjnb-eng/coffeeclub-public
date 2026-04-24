import { supabase, Coffee } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRSection from '@/components/QRSection'
import FlavorChart from '@/components/FlavorChart'

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

const card = (extra?: string) => ({
  background: 'var(--c-card-bg)',
  borderColor: 'var(--c-border)',
  borderRadius: 'var(--sz-radius)',
  padding: 'var(--sz-padding)',
  borderWidth: 'var(--sz-border)',
  borderStyle: 'solid',
  ...(extra ? {} : {}),
} as React.CSSProperties)

export default async function CoffeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coffee = await getCoffee(id)
  if (!coffee) notFound()

  const drip = coffee.extraction_guide?.drip || {}
  const esp = coffee.extraction_guide?.espresso || {}
  const quote = coffee.literary_quote || {}
  const fg = coffee.flavor_graph || {}

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-page-bg)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ background: 'var(--c-header-bg)', borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="커피기술커피클럽" width={36} height={36} className="object-contain" />
          <div className="font-black text-[16px]" style={{ color: 'var(--c-text-1)' }}>커피기술커피클럽</div>
        </div>
        <Link href="/" className="text-[13px] font-bold hover:opacity-70" style={{ color: 'var(--c-text-2)' }}>← 목록</Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ gap: 'var(--sz-gap)' }}>
        {/* Hero */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-black leading-tight" style={{ fontSize: 'var(--sz-hero)', color: 'var(--c-text-1)' }}>{coffee.name}</h1>
            <span className="inline-block mt-2 text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: 'var(--c-primary-bg)', color: 'var(--c-primary)' }}>
              {coffee.origin}
            </span>
          </div>
          <QRSection coffeeId={id} coffeeName={coffee.name} />
        </div>

        {/* 기본 정보 */}
        <div className="sec-info" style={card()}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-text-3)' }}>기본 정보</div>
          <div className="divide-y" style={{ borderColor: 'var(--c-border)' }}>
            {[
              ['원산지', coffee.origin],
              ['가공방식', coffee.processing],
              ['고도', coffee.altitude],
              ['품종', coffee.variety],
            ].map(([k, v]) => v && (
              <div key={k} className="flex py-3 gap-4">
                <span className="text-[12px] font-bold w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--c-text-3)' }}>{k}</span>
                <span className="text-[14px] font-bold" style={{ color: 'var(--c-text-1)' }}>{v}</span>
              </div>
            ))}
          </div>
          {coffee.flavor_notes && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-text-3)' }}>맛 노트</div>
              <div className="flex flex-wrap gap-2">
                {coffee.flavor_notes.split(',').map((t: string) => (
                  <span key={t} className="font-bold px-3 py-1 rounded-full" style={{ fontSize: 'var(--sz-tag)', background: 'var(--c-primary-bg)', color: 'var(--c-primary)' }}>
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 향미 그래프 */}
        <div className="sec-flavor" style={card()}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-text-3)' }}>향미 그래프</div>
          <FlavorChart fg={fg} />
        </div>

        {/* 추출 가이드 */}
        <div className="sec-extraction" style={card()}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-text-3)' }}>추출 가이드</div>
          <div className="mb-4">
            <div className="text-[12px] font-bold mb-3" style={{ color: 'var(--c-primary)' }}>드립 (Pour Over)</div>
            <div className="grid grid-cols-2 gap-2">
              {[['물 온도', drip.temperature], ['비율', drip.ratio], ['분쇄도', drip.grind], ['추출 시간', drip.time]].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3 border" style={{ background: 'var(--c-page-bg)', borderColor: 'var(--c-border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-3)' }}>{k}</div>
                  <div className="text-[14px] font-black" style={{ color: 'var(--c-text-1)' }}>{v || '-'}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold mb-3" style={{ color: 'var(--c-text-2)' }}>에스프레소</div>
            <div className="grid grid-cols-2 gap-2">
              {[['물 온도', esp.temperature], ['도징', esp.dose], ['수율', esp.yield], ['추출 시간', esp.time]].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3 border" style={{ background: 'var(--c-page-bg)', borderColor: 'var(--c-border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--c-text-3)' }}>{k}</div>
                  <div className="text-[14px] font-black" style={{ color: 'var(--c-text-1)' }}>{v || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 문학 인용구 */}
        {quote.text && (
          <div className="rounded-2xl p-7 relative overflow-hidden sec-quote" style={{ background: 'var(--c-quote-bg)' }}>
            <div className="absolute top-[-20px] left-4 text-[140px] font-black leading-none font-serif" style={{ color: 'rgba(61,214,140,0.1)' }}>"</div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>문학 속 한 구절</div>
            <p className="text-white text-[16px] italic leading-relaxed mb-4 relative">"{quote.text}"</p>
            <div className="flex justify-end items-center gap-2 text-[12px] font-bold" style={{ color: 'var(--c-primary)' }}>
              <div className="w-1 h-1 rounded-full" style={{ background: 'var(--c-primary)' }} />
              <span>{quote.author}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span className="italic">{quote.source}</span>
            </div>
          </div>
        )}

        {/* 원산지 이야기 */}
        {coffee.origin_story && (
          <div className="sec-story" style={card()}>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-text-3)' }}>원산지 이야기</div>
            <p className="leading-relaxed" style={{ fontSize: 'var(--sz-body)', color: 'var(--c-text-2)' }}>{coffee.origin_story}</p>
          </div>
        )}
      </div>
    </div>
  )
}
