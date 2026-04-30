'use client'
import { useEffect } from 'react'

export default function VisitTracker({ coffeeId }: { coffeeId: string }) {
  useEffect(() => {
    fetch(`/api/visit/${coffeeId}`, { method: 'POST' }).catch(() => {})
  }, [coffeeId])
  return null
}
