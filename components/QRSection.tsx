'use client'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/coffee/${coffeeId}`
    : `https://coffeeclub-public.vercel.app/coffee/${coffeeId}`

  // SVG 포맷: 벡터라 5mm×5mm에서도 선명, ecc=L(최소 패턴)
  const qrParams = new URLSearchParams({
    format: 'svg',
    ecc: 'L',
    color: '000000',
    bgcolor: 'ffffff',
    margin: '1',
    data: url,
  })
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?${qrParams}`

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrSrc
    a.download = `${coffeeName}_QR.svg`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt="QR"
        width={88}
        height={88}
        style={{ border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff' }}
      />
      <button onClick={downloadQR} className="text-[10px] font-bold hover:underline" style={{ color: 'var(--c-primary)' }}>
        QR 저장 (SVG)
      </button>
    </div>
  )
}
