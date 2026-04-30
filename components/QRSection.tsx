'use client'

export default function QRSection({ coffeeId, coffeeName }: { coffeeId: string; coffeeName: string }) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/coffee/${coffeeId}`
    : `https://coffeeclub-public.vercel.app/coffee/${coffeeId}`

  const base = new URLSearchParams({ ecc: 'L', color: '000000', bgcolor: 'ffffff', margin: '2', data: url })
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?format=svg&${base}`  // 화면용

  // 13mm × 13mm @ 600dpi = 307px
  const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=307x307&${base}`

  async function downloadQR() {
    try {
      // PNG 다운로드
      const resp = await fetch(qrPng)
      const blob = await resp.blob()
      const filename = `${coffeeName}_QR_13mm.png`

      // 경로 선택창 (Chrome/Edge 지원)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'PNG 이미지', accept: { 'image/png': ['.png'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          return
        } catch (e: any) {
          if (e?.name === 'AbortError') return  // 사용자가 취소
        }
      }

      // Safari 등 미지원 시 기본 다운로드
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    } catch (e) {
      alert('다운로드 실패: ' + (e as Error).message)
    }
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
