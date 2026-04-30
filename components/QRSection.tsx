'use client'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/coffee/${coffeeId}`
    : `https://coffeeclub-public.vercel.app/coffee/${coffeeId}`

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&margin=4&data=${encodeURIComponent(url)}`
  const qrSrcHD = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=8&data=${encodeURIComponent(url)}`

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrSrcHD
    a.download = `${coffeeName}_QR.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrSrc} alt="QR" width={80} height={80} className="rounded-lg border border-[#E8E8E8]" />
      <button onClick={downloadQR} className="text-[10px] font-bold text-[#25B872] hover:underline">
        QR 저장
      </button>
    </div>
  )
}
