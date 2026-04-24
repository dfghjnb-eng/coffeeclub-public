import { supabase, Coffee } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRSection from '@/components/QRSection'
import FlavorBars from '@/components/FlavorBars'

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
  const coffee = await getCoffee(id)
  if (!coffee) notFound()

  const drip = coffee.extraction_guide?.drip || {}
  const esp = coffee.extraction_guide?.espresso || {}
  const quote = coffee.literary_quote || {}
  const fg = coffee.flavor_graph || {}

  return (
    <div className="min-h-screen bg-[#F4F1FF]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="커피기술커피클럽" width={36} height={36} className="object-contain" />
          <div className="font-black text-[16px] text-[#111]">커피기술커피클럽</div>
        </div>
        <Link href="/" className="text-[13px] font-bold text-[#666] hover:text-[#111]">← 목록</Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Hero */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-black text-[#111] leading-tight">{coffee.name}</h1>
            <span className="inline-block mt-2 bg-[#E8FBF2] text-[#25B872] text-[12px] font-bold px-3 py-1 rounded-full">
              {coffee.origin}
            </span>
          </div>
          <QRSection coffeeId={id} coffeeName={coffee.name} />
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5">
          <div className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-4">기본 정보</div>
          <div className="divide-y divide-[#F0F0F0]">
            {[
              ['원산지', coffee.origin],
              ['가공방식', coffee.processing],
              ['고도', coffee.altitude],
              ['품종', coffee.variety],
            ].map(([k, v]) => v && (
              <div key={k} className="flex py-3 gap-4">
                <span className="text-[12px] font-bold text-[#AAAAAA] w-16 flex-shrink-0 pt-0.5">{k}</span>
                <span className="text-[14px] font-bold text-[#111]">{v}</span>
              </div>
            ))}
          </div>
          {coffee.flavor_notes && (
            <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
              <div className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-3">맛 노트</div>
              <div className="flex flex-wrap gap-2">
                {coffee.flavor_notes.split(',').map((t: string) => (
                  <span key={t} className="bg-[#E8FBF2] text-[#25B872] text-[12px] font-bold px-3 py-1 rounded-full">
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 향미 그래프 */}
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5">
          <div className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-4">향미 그래프</div>
          <FlavorBars fg={fg} />
        </div>

        {/* 추출 가이드 */}
        <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5">
          <div className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-4">추출 가이드</div>
          <div className="mb-4">
            <div className="text-[12px] font-bold text-[#25B872] mb-3">드립 (Pour Over)</div>
            <div className="grid grid-cols-2 gap-2">
              {[['물 온도', drip.temperature], ['비율', drip.ratio], ['분쇄도', drip.grind], ['추출 시간', drip.time]].map(([k, v]) => (
                <div key={k} className="bg-[#FAFAFA] rounded-xl p-3 border border-[#F0F0F0]">
                  <div className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-[14px] font-black text-[#111]">{v || '-'}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#666] mb-3">에스프레소</div>
            <div className="grid grid-cols-2 gap-2">
              {[['물 온도', esp.temperature], ['도징', esp.dose], ['수율', esp.yield], ['추출 시간', esp.time]].map(([k, v]) => (
                <div key={k} className="bg-[#FAFAFA] rounded-xl p-3 border border-[#F0F0F0]">
                  <div className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-[14px] font-black text-[#111]">{v || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 문학 인용구 */}
        {quote.text && (
          <div className="bg-[#111] rounded-2xl p-7 relative overflow-hidden">
            <div className="absolute top-[-20px] left-4 text-[140px] font-black text-[#3DD68C]/10 leading-none font-serif">"</div>
            <div className="text-[11px] font-bold text-white/35 uppercase tracking-widest mb-4">문학 속 한 구절</div>
            <p className="text-white text-[16px] italic leading-relaxed mb-4 relative">"{quote.text}"</p>
            <div className="flex justify-end items-center gap-2 text-[12px] font-bold text-[#3DD68C]">
              <div className="w-1 h-1 rounded-full bg-[#3DD68C]" />
              <span>{quote.author}</span>
              <span className="text-white/20">/</span>
              <span className="italic">{quote.source}</span>
            </div>
          </div>
        )}

        {/* 원산지 이야기 */}
        {coffee.origin_story && (
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5">
            <div className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-4">원산지 이야기</div>
            <p className="text-[14px] leading-relaxed text-[#666]">{coffee.origin_story}</p>
          </div>
        )}
      </div>
    </div>
  )
}
