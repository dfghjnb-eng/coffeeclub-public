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
    <div className="min-h-screen" style={{ background: 'var(--c-page-bg)' }}>
      <header className="border-b px-6 py-4 flex items-center gap-3" style={{ background: 'var(--c-header-bg)', borderColor: 'var(--c-border)' }}>
        <Image src="/logo.png" alt="커피기술커피클럽" width={40} height={40} className="object-contain" />
        <div>
          <div className="font-black text-[17px]" style={{ color: 'var(--c-text-1)' }}>커피기술커피클럽</div>
          <div className="text-[11px]" style={{ color: 'var(--c-text-3)' }}>생두 정보 카탈로그</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <CatalogSearch defaultValue={query} />

        {coffees.length === 0 ? (
          <div className="text-center py-20 font-semibold" style={{ color: 'var(--c-text-3)' }}>
            {query ? `"${query}" 검색 결과가 없습니다` : '등록된 원두가 없습니다'}
          </div>
        ) : (
          <div className="flex flex-col mt-6" style={{ gap: 'var(--sz-gap)' }}>
            {coffees.map((coffee) => (
              <Link key={coffee.id} href={`/coffee/${coffee.id}`}>
                <div
                  className="hover:shadow-md transition-shadow cursor-pointer border"
                  style={{
                    background: 'var(--c-card-bg)',
                    borderColor: 'var(--c-border)',
                    borderRadius: 'var(--sz-radius)',
                    padding: 'var(--sz-padding)',
                    borderWidth: 'var(--sz-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black mb-1" style={{ fontSize: 'var(--sz-name)', color: 'var(--c-text-1)' }}>{coffee.name}</div>
                      <div style={{ fontSize: 'var(--sz-body)', color: 'var(--c-text-2)' }}>
                        {[coffee.origin, coffee.processing, coffee.variety].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span className="font-bold px-3 py-1 rounded-full whitespace-nowrap mt-1" style={{ background: 'var(--c-primary-bg)', color: 'var(--c-primary)', fontSize: 'var(--sz-tag)' }}>
                      {coffee.origin?.split(' ')[0] || '생두'}
                    </span>
                  </div>
                  {coffee.flavor_notes && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {coffee.flavor_notes.split(',').slice(0, 4).map((tag: string) => (
                        <span key={tag} className="font-semibold px-2.5 py-1 rounded-full" style={{ fontSize: 'var(--sz-tag)', background: 'var(--c-tag-bg)', color: 'var(--c-tag-text)' }}>
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
