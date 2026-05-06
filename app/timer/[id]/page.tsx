import { supabase, Coffee } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import BrewTimer from '@/components/BrewTimer'

export const revalidate = 60

async function getCoffee(id: string): Promise<Coffee | null> {
  const { data } = await supabase
    .from('coffees')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single()
  return data
}

export default async function TimerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coffee = await getCoffee(id)
  if (!coffee) notFound()

  return <BrewTimer coffee={coffee} />
}
