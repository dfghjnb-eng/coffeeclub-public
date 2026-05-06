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
    <div className="min-h-screen" style={{ background: 'var(--p-bg)' }}>
      {/* 헤더 */}
      <header style={{
        padding: '18px 20px 16px',
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
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 20px 48px' }}>
        <CatalogSearch defaultValue={query} />

        {coffees.length === 0 ? (
          <div className="neu-inset" style={{
            borderRadius: 24, padding: '48px 20px', textAlign: 'center', marginTop: 8,
          }}>
            <div className="serif" style={{ fontSize: 18, color: 'var(--p-muted)' }}>
              {query ? `"${query}" 검색 결과가 없습니다` : '등록된 원두가 없습니다'}
            </div>
          </div>
        ) : (
          <>
            {/* 리스트 헤더 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16, padding: '0 4px',
            }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--p-ink)', letterSpacing: -0.4 }}>
                {query ? `검색 결과` : 'All beans'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--p-muted)' }}>{coffees.length} items</div>
            </div>

            {/* 원두 카드 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {coffees.map((coffee) => (
                <Link key={coffee.id} href={`/coffee/${coffee.id}`} style={{ textDecoration: 'none' }}>
                  <div className="neu" style={{
                    borderRadius: 22, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.18s ease',
                  }}>
                    {/* 썸네일 */}
                    <div className="neu-sm" style={{
                      width: 56, height: 56, borderRadius: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <BeanIcon />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="serif" style={{
                        fontSize: 16, fontWeight: 500, color: 'var(--p-ink)',
                        lineHeight: 1.2, marginBottom: 4,
                      }}>{coffee.name}</div>
                      <div style={{
                        fontSize: 11, color: 'var(--p-muted)',
                        marginBottom: 6, letterSpacing: 0.2,
                      }}>
                        {[coffee.origin, coffee.processing].filter(Boolean).join(' · ')}
                      </div>
                      {coffee.flavor_notes && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {coffee.flavor_notes.split(',').slice(0, 3).map((tag: string) => (
                            <span key={tag} style={{
                              fontSize: 9, padding: '2px 8px', borderRadius: 8,
                              background: 'var(--p-bg-alt)', color: 'var(--p-text)',
                              fontWeight: 500,
                            }}>{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 화살표 */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#B0AC9E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function BeanIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#888578" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(-25 12 12)"/>
      <path d="M9 5.5C9 9.5 14 13.5 15 18.5" transform="rotate(-25 12 12)"/>
    </svg>
  )
}
