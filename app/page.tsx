import { supabase, Coffee } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import CatalogSearch from '@/components/CatalogSearch'

export const revalidate = 60

async function getCoffees(query?: string): Promise<Coffee[]> {
  let req = supabase
    .from('coffees')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (query) {
    req = req.or(`name.ilike.%${query}%,origin.ilike.%${query}%,flavor_notes.ilike.%${query}%`)
  }

  const { data } = await req
  return data ?? []
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const coffees = await getCoffees(query)

  return (
    <div className="min-h-screen bg-[#F4F1FF]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center gap-3">
        <Image src="/logo.png" alt="커피기술커피클럽" width={40} height={40} className="object-contain" />
        <div>
          <div className="font-black text-[17px] text-[#111]">커피기술커피클럽</div>
          <div className="text-[11px] text-[#AAAAAA]">생두 정보 카탈로그</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 검색 */}
        <CatalogSearch defaultValue={query} />

        {/* 결과 */}
        {coffees.length === 0 ? (
          <div className="text-center py-20 text-[#AAAAAA] font-semibold">
            {query ? `"${query}" 검색 결과가 없습니다` : '등록된 원두가 없습니다'}
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-6">
            {coffees.map((coffee) => (
              <Link key={coffee.id} href={`/coffee/${coffee.id}`}>
                <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-[18px] text-[#111] mb-1">{coffee.name}</div>
                      <div className="text-[13px] text-[#666]">
                        {[coffee.origin, coffee.processing, coffee.variety].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span className="bg-[#E8FBF2] text-[#25B872] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap mt-1">
                      {coffee.origin?.split(' ')[0] || '생두'}
                    </span>
                  </div>
                  {coffee.flavor_notes && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {coffee.flavor_notes.split(',').slice(0, 4).map((tag: string) => (
                        <span key={tag} className="bg-[#F4F1FF] text-[#666] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
