import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('settings')
      .eq('id', 1)
      .single()
    return data?.settings ?? {}
  } catch {
    return {}
  }
}

export type Coffee = {
  id: string
  name: string
  origin: string
  processing: string
  altitude: string
  variety: string
  flavor_notes: string
  flavor_graph: Record<string, number>
  origin_story: string
  literary_quote: { text: string; author: string; source: string; translation?: string }
  extraction_guide: {
    roast?: string        // 원두 이름 앞 표기 (light·medium·dark)
    guide_roast?: string  // 이 추출가이드 수치의 기준 로스팅
    grind_ek43?: number   // 시작 분쇄 눈금 (말코닉 EK43 0~16)
    recipe?: { id: string; name: string; title: string; source: string }
    drip: {
      coffee_amount?: string; water_amount?: string
      temperature?: string; ratio?: string; grind?: string; time?: string
      bloom_time?: string; bloom_water?: string; pour_method?: string; dripper?: string; notes?: string
    }
    espresso: {
      temperature?: string; dose?: string; yield?: string; ratio?: string
      time?: string; pressure?: string; pre_infusion?: string; notes?: string
    }
  }
  published: boolean
  created_at: string
}
