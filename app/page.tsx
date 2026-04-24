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
    <div className="min-h-screen t-page">
      <header className="t-header border-b px-6 py-4 flex items-center gap-3">
        <Image src="/logo.png" alt="커피기술커피클럽" width={40} height={40} className="object-contain" />
        <div>
          <div className="font-black text-[17px] t-text-1">커피기술커피클럽</div>
          <div className="t-label" style={{ textTransform: 'none', letterSpacing: 0 }}>생두 정보 카탈로그</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <CatalogSearch defaultValue={query} />

        {coffees.length === 0 ? (
          <div className="text-center py-20 font-semibold t-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {query ? `"${query}" 검색 결과가 없습니다` : '등록된 원두가 없습니다'}
          </div>
        ) : (
          <div className="flex flex-col mt-6 t-sections">
            {coffees.map((coffee) => (
              <Link key={coffee.id} href={`/coffee/${coffee.id}`}>
                <div className="t-card hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black mb-1 t-name">{coffee.name}</div>
                      <div className="t-body">
                        {[coffee.origin, coffee.processing, coffee.variety].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span className="t-badge text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap mt-1">
                      {coffee.origin?.split(' ')[0] || '생두'}
                    </span>
                  </div>
                  {coffee.flavor_notes && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {coffee.flavor_notes.split(',').slice(0, 4).map((tag: string) => (
                        <span key={tag} className="t-tag-flavor font-semibold px-2.5 py-1 rounded-full">
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
