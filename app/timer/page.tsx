import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 60

type CoffeeListItem = { id: string; name: string; origin: string; processing: string }

async function getCoffees(): Promise<CoffeeListItem[]> {
  const { data } = await supabase
    .from('coffees')
    .select('id, name, origin, processing')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return (data ?? []) as CoffeeListItem[]
}

function OriginEmoji({ origin }: { origin: string | null }) {
  if (!origin) return <>☕</>
  if (origin.includes('브라질'))    return <>🇧🇷</>
  if (origin.includes('에티오피아')) return <>🇪🇹</>
  if (origin.includes('케냐'))      return <>🇰🇪</>
  if (origin.includes('콜롬비아'))  return <>🇨🇴</>
  if (origin.includes('온두라스'))  return <>🇭🇳</>
  return <>☕</>
}

export default async function TimerIndexPage() {
  const coffees = await getCoffees()

  return (
    <div style={{ background: 'var(--p-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '52px 20px 120px' }}>
        <h1 className="serif" style={{
          fontSize: 28, fontWeight: 500, color: 'var(--p-ink)',
          letterSpacing: -0.5, marginBottom: 6,
        }}>
          Brew Timer
        </h1>
        <p style={{
          fontSize: 12, color: 'var(--p-muted)', marginBottom: 24,
          fontFamily: 'Inter, sans-serif',
        }}>
          추출할 원두를 선택하세요
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coffees.map(coffee => (
            <Link key={coffee.id} href={`/timer/${coffee.id}`} style={{ textDecoration: 'none' }}>
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
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 500, color: 'var(--p-ink)', marginBottom: 2 }}>
                    {coffee.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--p-muted)', fontFamily: 'Inter, sans-serif' }}>
                    {[coffee.origin, coffee.processing].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: 'var(--p-ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 3l14 9-14 9V3z"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
