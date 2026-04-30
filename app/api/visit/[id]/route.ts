import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await supabase.rpc('increment_visit', { coffee_id: id })
  } catch {
    // 카운트 실패해도 페이지 로딩에 영향 없도록 무시
  }
  return NextResponse.json({ ok: true })
}
