import { supabase, Coffee } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import CatalogSearch from '@/components/CatalogSearch'
import GreetingCard from '@/components/GreetingCard'

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
  const params  = await searchParams
  const query   = params.q || ''
  const coffees = await getCoffees(query)
  const pick    = coffees[0] ?? null   // 최신 원두 = Today's Pick

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-bg)' }}>

      {/* ── Brand Header ── */}
      <header style={{ padding: '18px 20px 14px', background: 'var(--p-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="neu-sm" style={{
              width: 44, height: 44, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Image src="/logo.png" alt="커기커피클럽" width={30} height={30} className="object-contain" />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: 'var(--p-ink)', lineHeight: 1, letterSpacing: -0.3 }}>
                커기커피클럽
              </div>
              <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginTop: 3, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                커피기술 아카이브 · COFFEE ARCHIVE
              </div>
            </div>
          </div>
          {/* 그리드 버튼 */}
          <div className="neu-sm" style={{
            width: 38, height: 38, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888578" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '4px 20px 60px' }}>

        {/* ── Greeting 카드 (클라이언트 – 날짜/시간) ── */}
        {!query && <GreetingCard />}

        {/* ── Today's Pick ── */}
        {!query && pick && (
          <div className="neu" style={{ borderRadius: 28, padding: '22px', marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: 'var(--p-muted)', letterSpacing: 1.5, marginBottom: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              TODAY&rsquo;S PICK
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{
                  fontSize: 28, fontWeight: 500, color: 'var(--p-ink)',
                  lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 12,
                }}>
                  {pick.name}
                </div>
                {pick.flavor_notes && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {pick.flavor_notes.split(',').slice(0, 3).map((t: string) => (
                      <span key={t} style={{
                        fontSize: 10, padding: '3px 10px', borderRadius: 20,
                        background: 'var(--p-bg-alt)', color: 'var(--p-text)',
                        fontFamily: 'Inter, sans-serif', fontWeight: 500,
                      }}>{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              {/* 원산지 플래그 영역 */}
              <div className="neu-sm" style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0, marginLeft: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <OriginEmoji origin={pick.origin ?? ''} />
              </div>
            </div>
            <Link href={`/coffee/${pick.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--p-ink)', borderRadius: 30,
                padding: '12px 10px 12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  자세히 보기
                </span>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── 검색 ── */}
        <CatalogSearch defaultValue={query} />

        {coffees.length === 0 ? (
          <div className="neu-inset" style={{ borderRadius: 24, padding: '48px 20px', textAlign: 'center', marginTop: 8 }}>
            <div className="serif" style={{ fontSize: 18, color: 'var(--p-muted)' }}>
              {query ? `"${query}" 검색 결과가 없습니다` : '등록된 원두가 없습니다'}
            </div>
          </div>
        ) : (
          <>
            {/* 리스트 헤더 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 14, padding: '0 4px',
            }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--p-ink)', letterSpacing: -0.4 }}>
                {query ? '검색 결과' : 'All beans'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--p-muted)', fontFamily: 'Inter, sans-serif' }}>
                {coffees.length} items
              </div>
            </div>

            {/* 원두 카드 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {coffees.map((coffee) => (
                <Link key={coffee.id} href={`/coffee/${coffee.id}`} style={{ textDecoration: 'none' }}>
                  <div className="neu" style={{
                    borderRadius: 22, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer',
                    transition: 'transform 0.18s ease',
                  }}>
                    {/* 원산지 아이콘 박스 */}
                    <div className="neu-sm" style={{
                      width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <OriginEmoji origin={coffee.origin ?? ''} large />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="serif" style={{
                        fontSize: 16, fontWeight: 500, color: 'var(--p-ink)',
                        lineHeight: 1.2, marginBottom: 3,
                      }}>{coffee.name}</div>
                      <div style={{
                        fontSize: 11, color: 'var(--p-muted)', marginBottom: 7,
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {[coffee.origin, coffee.processing].filter(Boolean).join(' · ')}
                      </div>
                      {coffee.flavor_notes && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {coffee.flavor_notes.split(',').slice(0, 3).map((tag: string) => (
                            <span key={tag} style={{
                              fontSize: 9, padding: '2px 8px', borderRadius: 8,
                              background: 'var(--p-bg-alt)', color: 'var(--p-text)',
                              fontFamily: 'Inter, sans-serif', fontWeight: 500,
                            }}>{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>

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

/* 원산지별 이모지/아이콘 */
function OriginEmoji({ origin, large }: { origin: string; large?: boolean }) {
  const size = large ? 28 : 22
  if (origin.includes('브라질'))   return <span style={{ fontSize: size }}>🇧🇷</span>
  if (origin.includes('에티오피아')) return <span style={{ fontSize: size }}>🇪🇹</span>
  if (origin.includes('케냐'))     return <span style={{ fontSize: size }}>🇰🇪</span>
  if (origin.includes('콜롬비아')) return <span style={{ fontSize: size }}>🇨🇴</span>
  if (origin.includes('온두라스')) return <span style={{ fontSize: size }}>🇭🇳</span>
  if (origin.includes('과테말라')) return <span style={{ fontSize: size }}>🇬🇹</span>
  if (origin.includes('인도네시아')) return <span style={{ fontSize: size }}>🇮🇩</span>
  if (origin.includes('파나마'))   return <span style={{ fontSize: size }}>🇵🇦</span>
  if (origin.includes('코스타리카')) return <span style={{ fontSize: size }}>🇨🇷</span>
  if (origin.includes('예멘'))     return <span style={{ fontSize: size }}>🇾🇪</span>
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888578" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(-25 12 12)"/>
      <path d="M9 5.5C9 9.5 14 13.5 15 18.5" transform="rotate(-25 12 12)"/>
    </svg>
  )
}
