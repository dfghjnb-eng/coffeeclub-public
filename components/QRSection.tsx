'use client'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/coffee/${coffeeId}`
    : `https://coffeeclub-public.vercel.app/coffee/${coffeeId}`

  const base = new URLSearchParams({ ecc: 'L', color: '000000', bgcolor: 'ffffff', margin: '2', data: url })
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?format=svg&${base}`        // 화면용 SVG
  const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&${base}`      // 다운로드용 PNG

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrPng
    a.download = `${coffeeName}_QR.png`
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt="QR"
        width={110}
        height={110}
        style={{ background: '#fff', borderRadius: 4, display: 'block' }}
      />
      <button
        onClick={downloadQR}
        style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
      >
        QR 저장
      </button>
    </div>
  )
}
