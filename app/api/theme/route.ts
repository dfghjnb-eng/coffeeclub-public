import { getSiteSettings } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}
