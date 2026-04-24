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
  literary_quote: { text: string; author: string; source: string }
  extraction_guide: {
    drip: { temperature: string; ratio: string; grind: string; time: string }
    espresso: { temperature: string; dose: string; yield: string; time: string }
  }
  published: boolean
  created_at: string
}
