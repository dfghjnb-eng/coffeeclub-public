'use client'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/coffee/${coffeeId}`
    : `https://coffeeclub-public.vercel.app/coffee/${coffeeId}`

  // 감열지 최적화: ecc=L(최소 패턴), 순수 흑백, 여백 충분히
  const params = new URLSearchParams({
    size: '96x96',
    margin: '6',
    ecc: 'L',
    color: '000000',
    bgcolor: 'ffffff',
    data: url,
  })
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?${params}`

  const paramsHD = new URLSearchParams({
    size: '600x600',
    margin: '20',
    ecc: 'L',
    color: '000000',
    bgcolor: 'ffffff',
    data: url,
  })
  const qrHD = `https://api.qrserver.com/v1/create-qr-code/?${paramsHD}`

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrHD
    a.download = `${coffeeName}_QR.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrSrc} alt="QR" width={96} height={96}
        style={{ imageRendering: 'pixelated', border: '1px solid #E8E8E8', borderRadius: 8 }} />
      <button onClick={downloadQR} className="text-[10px] font-bold text-[#25B872] hover:underline">
        QR 저장
      </button>
    </div>
  )
}
