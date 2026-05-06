import { getSiteSettings } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// 캐시 없음 — 관리자가 저장하면 즉시 반영
export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
