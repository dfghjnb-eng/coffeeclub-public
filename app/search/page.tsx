import { supabase, Coffee } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const POPULAR_TAGS = ['에티오피아', '워시드', '블루베리', '내추럴', '브라질', '케냐', '게이샤']

async function searchCoffees(q: string): Promise<Coffee[]> {
  if (!q.trim()) return []
  const { data } = await supabase
    .from('coffees')
    .select('*')
    .eq('published', true)
    .or(`name.ilike.%${q}%,origin.ilike.%${q}%,flavor_notes.ilike.%${q}%,processing.ilike.%${q}%`)
  return data ?? []
}

function OriginEmoji({ origin }: { origin: string }) {
  if (origin.includes('브라질'))    return <>🇧🇷</>
  if (origin.includes('에티오피아')) return <>🇪🇹</>
  if (origin.includes('케냐'))      return <>🇰🇪</>
  if (origin.includes('콜롬비아'))  return <>🇨🇴</>
  if (origin.includes('온두라스'))  return <>🇭🇳</>
  if (origin.includes('과테말라'))  return <>🇬🇹</>
  if (origin.includes('인도네시아')) return <>🇮🇩</>
  if (origin.includes('파나마'))    return <>🇵🇦</>
  return <>☕</>
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params  = await searchParams
  const query   = params.q?.trim() || ''
  const results = await searchCoffees(query)

  return (
    <div style={{ background: 'var(--p-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '52px 20px 120px' }}>

        {/* 제목 */}
        <h1 className="serif" style={{
          fontSize: 30, fontWeight: 500, color: 'var(--p-ink)',
          letterSpacing: -0.6, marginBottom: 20,
        }}>
          Search
        </h1>

        {/* 검색 인풋 */}
        <form action="/search" method="GET">
          <div className="neu-inset" style={{
            borderRadius: 30, padding: '0 18px',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#888578" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="M16.5 16.5L21 21"/>
            </svg>
            <input
              name="q"
              defaultValue={query}
              placeholder="원두명 / 원산지 / 맛노트"
              autoFocus
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', padding: '16px 0',
                fontFamily: 'Inter, sans-serif', fontSize: 15,
                color: 'var(--p-text)',
              }}
            />
            {query && (
              <Link href="/search" style={{ textDecoration: 'none', color: 'var(--p-dim)', fontSize: 18, lineHeight: 1 }}>
                ×
              </Link>
            )}
          </div>
        </form>

        {/* 빈 상태: Popular Tags */}
        {!query && (
          <div>
            <div style={{
              fontSize: 9, fontWeight: 600, color: 'var(--p-muted)',
              letterSpacing: 1.5, marginBottom: 14,
              fontFamily: 'Inter, sans-serif',
            }}>
              POPULAR TAGS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR_TAGS.map(tag => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} style={{ textDecoration: 'none' }}>
                  <div className="neu-sm" style={{
                    padding: '8px 16px', borderRadius: 20,
                    fontSize: 13, fontWeight: 500, color: 'var(--p-text)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}>
                    {tag}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 결과 리스트 */}
        {query && (
          <div>
            <div style={{
              fontSize: 9, fontWeight: 600, color: 'var(--p-muted)',
              letterSpacing: 1.5, marginBottom: 14,
              fontFamily: 'Inter, sans-serif',
            }}>
              {results.length > 0 ? `${results.length}개 결과` : '결과 없음'}
            </div>

            {results.length === 0 ? (
              <div className="neu-inset" style={{
                borderRadius: 24, padding: '48px 20px', textAlign: 'center',
              }}>
                <div className="serif" style={{ fontSize: 16, color: 'var(--p-muted)' }}>
                  "{query}" 에 해당하는 원두를 찾을 수 없어요
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.map(coffee => (
                  <Link key={coffee.id} href={`/coffee/${coffee.id}`} style={{ textDecoration: 'none' }}>
                    <div className="neu" style={{
                      borderRadius: 20, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div className="neu-sm" style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26,
                      }}>
                        <OriginEmoji origin={coffee.origin ?? ''} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="serif" style={{
                          fontSize: 15, fontWeight: 500, color: 'var(--p-ink)', marginBottom: 3,
                        }}>
                          {coffee.name}
                        </div>
                        <div style={{
                          fontSize: 11, color: 'var(--p-muted)', marginBottom: 6,
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          {[coffee.origin, coffee.processing].filter(Boolean).join(' · ')}
                        </div>
                        {coffee.flavor_notes && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {coffee.flavor_notes.split(',').slice(0, 3).map((t: string) => (
                              <span key={t} style={{
                                fontSize: 9, padding: '2px 8px', borderRadius: 8,
                                background: 'var(--p-bg-alt)', color: 'var(--p-text)',
                                fontFamily: 'Inter, sans-serif', fontWeight: 500,
                              }}>{t.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#B0AC9E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 6l6 6-6 6"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
