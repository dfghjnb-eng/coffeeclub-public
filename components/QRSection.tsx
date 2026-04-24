'use client'
import { useEffect, useRef } from 'react'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const url = `${window.location.origin}/coffee/${coffeeId}`
    import('qrcode').then(QRCode => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, url, {
          width: 80, margin: 1,
          color: { dark: '#111111', light: '#ffffff' },
        })
      }
    })
  }, [coffeeId])

  function downloadQR() {
    const canvas = canvasRef.current
    if (!canvas) return
    // 고해상도 QR
    const url = `${window.location.origin}/coffee/${coffeeId}`
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: '#111111', light: '#ffffff' } })
        .then((dataUrl: string) => {
          const a = document.createElement('a')
          a.download = `${coffeeName}_QR.png`
          a.href = dataUrl
          a.click()
        })
    })
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <canvas ref={canvasRef} className="rounded-lg border border-[#E8E8E8]" />
      <button
        onClick={downloadQR}
        className="text-[10px] font-bold text-[#25B872] hover:underline"
      >
        QR 저장
      </button>
    </div>
  )
}
