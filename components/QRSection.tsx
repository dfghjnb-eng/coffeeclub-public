'use client'
import { useState } from 'react'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const [saved, setSaved] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/coffee/${coffeeId}`
    : `https://coffeeclub-public.vercel.app/coffee/${coffeeId}`

  const base    = new URLSearchParams({ ecc: 'L', color: '000000', bgcolor: 'ffffff', margin: '2', data: url })
  const qrPng   = `https://api.qrserver.com/v1/create-qr-code/?size=307x307&${base}`

  async function saveQR() {
    try {
      const resp = await fetch(qrPng)
      const blob = await resp.blob()
      const filename = `${coffeeName}_QR.png`

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'PNG 이미지', accept: { 'image/png': ['.png'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
          return
        } catch (e: any) {
          if (e?.name === 'AbortError') return
        }
      }

      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('저장 실패: ' + (e as Error).message)
    }
  }

  return (
    <button
      onClick={saveQR}
      className="neu-sm"
      title="QR 코드 저장"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 14px', height: 42, borderRadius: 21,
        border: 'none', cursor: 'pointer', background: 'none',
        transition: 'all 0.18s ease',
      }}
    >
      {/* QR 아이콘 */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={saved ? '#FF7F40' : '#888578'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 14h2v2h-2zM18 14h3M14 18h3M20 18v3M14 20v3"/>
      </svg>
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 11, fontWeight: 600,
        color: saved ? 'var(--p-accent)' : 'var(--p-muted)',
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
        transition: 'color 0.2s',
      }}>
        {saved ? '저장됨 ✓' : 'QR 저장'}
      </span>
    </button>
  )
}
