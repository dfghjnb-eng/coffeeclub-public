'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { analyzeGrind, COINS, DEFAULT_THRESHOLD, EK43_DIALS, ek43DialText } from '@/lib/grind'
import type { Circle, GrindResult, HistogramBin } from '@/lib/grind'

const MAX_PIXELS = 16_000_000   // 아이폰 사파리 캔버스 한도
const VIEW_WIDTH = 1000         // 화면 캔버스의 내부 폭
const ZOOM_SIZE = 320           // 원본 크기로 보는 확대 영역(픽셀)
const STORE_KEY = 'grind_lab_records'
const KEPT_COLOR = 'rgba(255, 90, 20, 0.8)'
const CLUMP_COLOR = 'rgba(20, 110, 255, 0.8)'
const SPLIT_COLOR = 'rgba(250, 190, 0, 0.85)'

function runColor(kind: number) {
  return kind === 2 ? CLUMP_COLOR : kind === 3 ? SPLIT_COLOR : KEPT_COLOR
}

type Shot = { canvas: HTMLCanvasElement; width: number; height: number; name: string }
type GrindRecord = {
  label: string; d10: number; d50: number; d90: number; span: number; count: number; umPerPx: number; photo: string
  ek16?: string; ek11?: string // 이 항목을 넣기 전에 저장한 기록에는 없다
}

const CARD: CSSProperties = { borderRadius: 'var(--sz-radius)', padding: 18, marginBottom: 14 }
const LABEL: CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 'calc(var(--sz-body) * 0.857)', fontWeight: 600, color: 'var(--p-ink)', marginBottom: 6 }
const NOTE: CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 'calc(var(--sz-body) * 0.857)', color: 'var(--p-muted)', lineHeight: 1.6 }
const BUTTON: CSSProperties = {
  border: 'none', cursor: 'pointer', padding: '12px 16px', fontFamily: 'Inter, sans-serif',
  fontSize: 'calc(var(--sz-body) * 0.929)', fontWeight: 600, color: 'var(--p-ink)',
  borderRadius: 'calc(var(--sz-radius) * 0.6)', textAlign: 'center',
}
const PRIMARY: CSSProperties = { ...BUTTON, background: 'var(--p-ink)', color: 'var(--p-bg)' }
const FIELD: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid var(--p-line)',
  borderRadius: 10, background: 'var(--p-bg)', color: 'var(--p-ink)', fontSize: 16, fontFamily: 'Inter, sans-serif',
}

function readRecords(): GrindRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRecords(records: GrindRecord[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(records)) } catch { /* 저장 못 해도 측정은 된다 */ }
}

function umText(value: number) {
  return `${Math.round(value).toLocaleString()}μm`
}

/* 부피 기준 입자 크기 분포. 한 계열이라 범례 없이 제목이 이름을 대신한다. */
function DistributionChart({ bins, d50 }: { bins: HistogramBin[]; d50: number }) {
  const W = 340, H = 150, TOP = 18, BASE = 118
  const max = Math.max(...bins.map((b) => b.percent), 1)
  const slot = W / bins.length
  const logX = (um: number) => (Math.log(um / bins[0].from) / Math.log(bins[bins.length - 1].to / bins[0].from)) * W
  const ticks = [100, 200, 400, 800, 1600]
  const d50X = Math.max(0, Math.min(W, logX(d50)))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="입자 크기 분포 그래프" style={{ width: '100%', display: 'block' }}>
      <line x1={0} x2={W} y1={BASE} y2={BASE} stroke="var(--p-line)" strokeWidth={1} />
      {bins.map((b, i) => {
        const height = (b.percent / max) * (BASE - TOP)
        const x = i * slot + 1, width = slot - 2, y = BASE - height
        const rad = Math.min(4, width / 2, height)
        return (
          <g key={b.from}>
            {/* 막대가 낮아도 올려서 값을 볼 수 있게 칸 전체를 대상으로 한다 */}
            <rect x={i * slot} y={TOP} width={slot} height={BASE - TOP} fill="transparent">
              <title>{`${Math.round(b.from)}~${Math.round(b.to)}μm: ${b.percent.toFixed(1)}%`}</title>
            </rect>
            {height > 0.5 && (
              <path
                d={`M${x},${BASE} V${y + rad} Q${x},${y} ${x + rad},${y} H${x + width - rad} Q${x + width},${y} ${x + width},${y + rad} V${BASE} Z`}
                fill="var(--p-accent)" pointerEvents="none"
              />
            )}
          </g>
        )
      })}
      <line x1={d50X} x2={d50X} y1={TOP - 4} y2={BASE} stroke="var(--p-ink)" strokeWidth={1.5} strokeDasharray="3 3" pointerEvents="none" />
      <text x={Math.min(W - 44, d50X + 4)} y={TOP - 6} fontSize={10} fill="var(--p-ink)" fontFamily="Inter, sans-serif">
        D50 {Math.round(d50)}
      </text>
      {ticks.map((t) => (
        <text key={t} x={Math.max(10, Math.min(W - 14, logX(t)))} y={BASE + 15} fontSize={10} fill="var(--p-muted)" textAnchor="middle" fontFamily="Inter, sans-serif">
          {t}
        </text>
      ))}
      <text x={W / 2} y={BASE + 30} fontSize={10} fill="var(--p-muted)" textAnchor="middle" fontFamily="Inter, sans-serif">
        입자 크기 (μm, 로그 눈금)
      </text>
    </svg>
  )
}

/* 내부 테스트용 분쇄도 측정 화면. 사진은 이 브라우저 안에서만 처리하고 어디로도 보내지 않는다. */
export default function GrindLab() {
  const [shot, setShot] = useState<Shot | null>(null)
  const [coin, setCoin] = useState<Circle | null>(null)
  const [coinKey, setCoinKey] = useState<string>(COINS[0].key)
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [result, setResult] = useState<GrindResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showOverlay, setShowOverlay] = useState(true)
  const [zoomAt, setZoomAt] = useState<{ x: number; y: number } | null>(null)
  const [label, setLabel] = useState('')
  const [records, setRecords] = useState<GrindRecord[]>([])
  const [copied, setCopied] = useState(false)

  const viewRef = useRef<HTMLCanvasElement>(null)
  const zoomRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  useEffect(() => { setRecords(readRecords()) }, [])

  const coinMm = COINS.find((c) => c.key === coinKey)?.mm ?? COINS[0].mm
  const umPerPx = coin ? (coinMm * 1000) / (coin.r * 2) : 0

  const onFile = useCallback(async (file?: File) => {
    if (!file) return
    setError(''); setResult(null); setZoomAt(null)
    overlayRef.current = null
    const url = URL.createObjectURL(file)
    try {
      // img.decode() 는 화면이 가려져 있으면 끝나지 않을 수 있어 onload 로 기다린다
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('load'))
        img.src = url
      })
      const scale = Math.min(1, Math.sqrt(MAX_PIXELS / (img.naturalWidth * img.naturalHeight)))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      setShot({ canvas, width: canvas.width, height: canvas.height, name: file.name })
      const short = Math.min(canvas.width, canvas.height)
      setCoin({ x: short * 0.2, y: short * 0.2, r: short * 0.12 })
    } catch {
      setError('사진을 열지 못했습니다. JPG나 PNG로 다시 시도해 주세요. (HEIC는 일부 브라우저에서 열리지 않습니다)')
    } finally {
      URL.revokeObjectURL(url)
    }
  }, [])

  // 사진 + 입자 표시 + 동전 원 그리기
  useEffect(() => {
    const view = viewRef.current
    if (!view || !shot) return
    const width = Math.min(VIEW_WIDTH, shot.width)
    const k = width / shot.width
    view.width = width
    view.height = Math.round(shot.height * k)
    const ctx = view.getContext('2d')
    if (!ctx) return
    ctx.drawImage(shot.canvas, 0, 0, view.width, view.height)

    if (result && showOverlay) {
      if (!overlayRef.current) {
        const layer = document.createElement('canvas')
        layer.width = view.width
        layer.height = view.height
        const lc = layer.getContext('2d')
        const o = result.overlay
        if (lc) {
          for (let i = 0; i < o.count; i++) {
            lc.fillStyle = runColor(o.kind[i])
            lc.fillRect(o.x0[i] * k, o.row[i] * k, Math.max(1, (o.x1[i] - o.x0[i] + 1) * k), Math.max(1, k))
          }
        }
        overlayRef.current = layer
      }
      ctx.drawImage(overlayRef.current, 0, 0)
    }

    if (coin) {
      const cx = coin.x * k, cy = coin.y * k, cr = coin.r * k
      const line = Math.max(2, view.width / 300)
      ctx.lineWidth = line + 2
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke()
      ctx.lineWidth = line
      ctx.strokeStyle = '#E8200C'
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - cr * 0.15, cy); ctx.lineTo(cx + cr * 0.15, cy)
      ctx.moveTo(cx, cy - cr * 0.15); ctx.lineTo(cx, cy + cr * 0.15)
      ctx.stroke()
    }
  }, [shot, coin, result, showOverlay])

  // 확대 보기: 사진 원본 픽셀에 입자 표시를 겹친다
  useEffect(() => {
    const zoom = zoomRef.current
    if (!zoom || !shot || !zoomAt) return
    zoom.width = ZOOM_SIZE
    zoom.height = ZOOM_SIZE
    const ctx = zoom.getContext('2d')
    if (!ctx) return
    const left = Math.max(0, Math.min(shot.width - ZOOM_SIZE, Math.round(zoomAt.x - ZOOM_SIZE / 2)))
    const top = Math.max(0, Math.min(shot.height - ZOOM_SIZE, Math.round(zoomAt.y - ZOOM_SIZE / 2)))
    ctx.drawImage(shot.canvas, left, top, ZOOM_SIZE, ZOOM_SIZE, 0, 0, ZOOM_SIZE, ZOOM_SIZE)
    if (result && showOverlay) {
      const o = result.overlay
      for (let i = 0; i < o.count; i++) {
        const y = o.row[i]
        if (y < top) continue
        if (y >= top + ZOOM_SIZE) break
        if (o.x1[i] < left || o.x0[i] >= left + ZOOM_SIZE) continue
        ctx.globalAlpha = 0.55
        ctx.fillStyle = runColor(o.kind[i])
        ctx.fillRect(o.x0[i] - left, y - top, o.x1[i] - o.x0[i] + 1, 1)
      }
    }
  }, [shot, zoomAt, result, showOverlay])

  function toImage(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = shot?.width ?? 1, height = shot?.height ?? 1
    return { x: ((e.clientX - rect.left) / rect.width) * width, y: ((e.clientY - rect.top) / rect.height) * height }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const p = toImage(e)
    if (result) { setZoomAt(p); return }
    if (!coin) return
    e.currentTarget.setPointerCapture(e.pointerId)
    // 원 안을 잡으면 그만큼 옮기고, 바깥을 누르면 그 자리로 옮긴다
    const inside = Math.hypot(p.x - coin.x, p.y - coin.y) <= coin.r
    if (!inside) setCoin({ ...coin, x: p.x, y: p.y })
    dragRef.current = inside ? { dx: coin.x - p.x, dy: coin.y - p.y } : { dx: 0, dy: 0 }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !coin) return
    const p = toImage(e)
    setCoin({ ...coin, x: p.x + dragRef.current.dx, y: p.y + dragRef.current.dy })
  }

  function endDrag() { dragRef.current = null }

  async function measure() {
    if (!shot || !coin || busy) return
    setBusy(true); setError('')
    // 측정 중 문구가 화면에 먼저 그려지게 잠깐 기다린다
    await new Promise((resolve) => setTimeout(resolve, 50))
    try {
      const ctx = shot.canvas.getContext('2d')
      if (!ctx) throw new Error('캔버스를 열지 못했습니다.')
      const image = ctx.getImageData(0, 0, shot.width, shot.height)
      overlayRef.current = null
      setResult(analyzeGrind(image, { umPerPx, coin, threshold }))
      setZoomAt({ x: shot.width / 2, y: shot.height / 2 })
    } catch (e) {
      setError(`측정하지 못했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally {
      setBusy(false)
    }
  }

  function addRecord() {
    if (!result || !shot) return
    const next = [...records, {
      label: label.trim() || `측정 ${records.length + 1}`,
      d10: Math.round(result.d10), d50: Math.round(result.d50), d90: Math.round(result.d90),
      span: Math.round(result.span * 100) / 100, count: result.count,
      umPerPx: Math.round(result.umPerPx * 10) / 10, photo: shot.name,
      ek16: ek43DialText(result.d50, EK43_DIALS[0]), ek11: ek43DialText(result.d50, EK43_DIALS[1]),
    }]
    setRecords(next); writeRecords(next); setLabel('')
  }

  function clearRecords() {
    if (!window.confirm('이 브라우저에 저장한 측정 기록을 모두 지울까요?')) return
    setRecords([]); writeRecords([])
  }

  async function copyRecords() {
    const header = '설정\tD10\tD50\tD90\t퍼짐\t입자수\t1픽셀(μm)\t말코닉 참고(0~16)\t말코닉 참고(1~11)\t사진'
    const rows = records.map((r) => [r.label, r.d10, r.d50, r.d90, r.span, r.count, r.umPerPx, r.ek16 ?? '', r.ek11 ?? '', r.photo].join('\t'))
    try {
      await navigator.clipboard.writeText([header, ...rows].join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('복사하지 못했습니다. 표를 직접 선택해 복사해 주세요.')
    }
  }

  const short = shot ? Math.min(shot.width, shot.height) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-bg)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px 140px' }}>
        <div className="serif" style={{ fontSize: 'calc(var(--sz-name) * 1.111)', fontWeight: 600, color: 'var(--p-ink)' }}>분쇄도 측정</div>
        <div style={{ ...NOTE, marginBottom: 16 }}>
          내부 테스트용 시제품입니다. 메뉴에는 없는 페이지이고, 사진은 이 브라우저 안에서만 처리됩니다.
        </div>

        <div className="neu" style={CARD}>
          <div style={LABEL}>1. 사진 찍기</div>
          <ol style={{ ...NOTE, margin: '0 0 14px', paddingLeft: 18 }}>
            <li>흰 종이에 가루를 조금만, 입자가 서로 닿지 않게 얇게 펴 주세요.</li>
            <li>가루 옆에 동전을 놓아 주세요.</li>
            <li>그림자 없이 밝은 곳에서, 종이가 화면을 채우도록 바로 위에서 수평으로 찍어 주세요.</li>
          </ol>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ ...PRIMARY, display: 'block' }}>
              사진 찍기
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
            <label className="neu-sm" style={{ ...BUTTON, display: 'block' }}>
              사진 고르기
              <input type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          </div>
        </div>

        {error && <div role="alert" style={{ ...NOTE, color: '#B3261E', marginBottom: 14 }}>{error}</div>}

        {shot && (
          <div className="neu" style={CARD}>
            <div style={LABEL}>{result ? '측정 결과 사진' : '2. 빨간 원을 동전에 맞추기'}</div>
            <canvas
              ref={viewRef}
              aria-label={result ? '측정 결과 사진. 누르면 그 부분을 확대합니다' : '사진. 끌어서 원을 동전으로 옮깁니다'}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ width: '100%', display: 'block', borderRadius: 12, touchAction: result ? 'auto' : 'none', cursor: result ? 'zoom-in' : 'grab' }}
            />

            {!result && coin && (
              <>
                <div style={{ ...LABEL, marginTop: 14 }}>원 크기</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" aria-label="원 조금 줄이기" className="neu-sm" style={{ ...BUTTON, padding: '6px 14px' }}
                    onClick={() => setCoin({ ...coin, r: Math.max(short * 0.01, coin.r - short * 0.002) })}>−</button>
                  <input type="range" aria-label="원 크기" min={short * 0.01} max={short * 0.45} step={short * 0.001} value={coin.r}
                    onChange={(e) => setCoin({ ...coin, r: Number(e.target.value) })} style={{ flex: 1, minWidth: 0 }} />
                  <button type="button" aria-label="원 조금 키우기" className="neu-sm" style={{ ...BUTTON, padding: '6px 14px' }}
                    onClick={() => setCoin({ ...coin, r: Math.min(short * 0.45, coin.r + short * 0.002) })}>+</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                  <div>
                    <div style={LABEL}>동전</div>
                    <select aria-label="동전 종류" value={coinKey} onChange={(e) => setCoinKey(e.target.value)} style={FIELD}>
                      {COINS.map((c) => <option key={c.key} value={c.key}>{c.label} ({c.mm}mm)</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={LABEL}>사진 정밀도</div>
                    <div style={{ ...NOTE, paddingTop: 10 }}>1픽셀 = {umPerPx.toFixed(1)}μm</div>
                  </div>
                </div>
              </>
            )}

            <div style={{ ...LABEL, marginTop: 14 }}>가루로 볼 어둡기: 종이의 {Math.round(threshold * 100)}%보다 어두우면</div>
            <input type="range" aria-label="가루로 볼 어둡기" min={0.4} max={0.9} step={0.01} value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: '100%' }} />

            <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 10, marginTop: 14 }}>
              <button type="button" onClick={measure} disabled={busy} style={{ ...PRIMARY, opacity: busy ? 0.6 : 1 }}>
                {busy ? '측정 중…' : result ? '다시 측정' : '측정하기'}
              </button>
              {result && (
                <button type="button" className="neu-sm" style={BUTTON}
                  onClick={() => { setResult(null); setZoomAt(null); overlayRef.current = null }}>
                  동전 다시 맞추기
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <>
            <div className="neu" style={CARD}>
              <div style={{ ...NOTE, marginBottom: 2 }}>대표 입자 크기 (D50, 부피 기준)</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'calc(var(--sz-name) * 1.778)', fontWeight: 600, color: 'var(--p-ink)', letterSpacing: -0.5 }}>
                {result.count ? umText(result.d50) : '측정 불가'}
              </div>
              {result.count > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 'calc(var(--sz-body) * 1.143)', fontWeight: 600, color: 'var(--p-ink)' }}>
                    말코닉 EK43 기준 {ek43DialText(result.d50, EK43_DIALS[0])}
                  </div>
                  <div style={NOTE}>구형 1~11 눈금판이면 {ek43DialText(result.d50, EK43_DIALS[1])}</div>
                  <div style={{ ...NOTE, marginTop: 4 }}>
                    아직 매장 EK43으로 보정하지 않은 참고값입니다. D50을 Honest Coffee Guide 표로 환산했으며, 실제 눈금과 다를 수 있습니다.
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '12px 0' }}>
                {[
                  ['D10', umText(result.d10)],
                  ['D90', umText(result.d90)],
                  ['퍼짐', result.span.toFixed(2)],
                  ['입자 수', result.count.toLocaleString()],
                  ['뭉침 제외', `${result.clumpCount}개 (${Math.round(result.clumpShare * 100)}%)`],
                  ['1픽셀', `${result.umPerPx.toFixed(1)}μm`],
                ].map(([name, value]) => (
                  <div key={name}>
                    <div style={NOTE}>{name}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'var(--p-ink)' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={NOTE}>퍼짐은 (D90−D10)÷D50 입니다. 작을수록 입자가 고릅니다. 계산 {result.ms}ms.</div>
              {result.warnings.length > 0 && (
                <ul role="status" style={{ ...NOTE, color: '#B3261E', margin: '10px 0 0', paddingLeft: 18 }}>
                  {result.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              )}
            </div>

            {result.count > 0 && (
              <div className="neu" style={CARD}>
                <div style={LABEL}>입자 크기 분포 (부피 비율)</div>
                <DistributionChart bins={result.histogram} d50={result.d50} />
              </div>
            )}

            <div className="neu" style={CARD}>
              <div style={LABEL}>입자를 제대로 찾았는지 확인</div>
              <label style={{ ...NOTE, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} />
                입자 표시 (주황·노랑: 측정, 색이 다르면 나눈 입자 / 파랑: 뭉쳐서 제외)
              </label>
              <div style={{ ...NOTE, marginBottom: 8 }}>위 사진을 누르면 그 부분을 원본 크기로 보여 줍니다.</div>
              <canvas ref={zoomRef} aria-label="사진 확대 보기" style={{ width: '100%', maxWidth: ZOOM_SIZE, display: 'block', borderRadius: 12, imageRendering: 'pixelated' }} />
            </div>

            <div className="neu" style={CARD}>
              <div style={LABEL}>기록에 추가</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input aria-label="그라인더 설정" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="그라인더 설정 (예: 커맨던테 25클릭)" style={{ ...FIELD, flex: 1, minWidth: 0 }} />
                <button type="button" style={PRIMARY} onClick={addRecord}>추가</button>
              </div>
            </div>
          </>
        )}

        {records.length > 0 && (
          <div className="neu" style={CARD}>
            <div style={LABEL}>측정 기록 (이 브라우저에만 저장)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 'calc(var(--sz-body) * 0.857)', color: 'var(--p-ink)' }}>
                <thead>
                  <tr style={{ color: 'var(--p-muted)', textAlign: 'left' }}>
                    {['설정', 'D50', '말코닉', '구형 눈금', 'D10', 'D90', '퍼짐', '입자'].map((h) =><th key={h} style={{ padding: '6px 8px 6px 0', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={`${r.label}-${i}`} style={{ borderTop: '1px solid var(--p-line)' }}>
                      <td style={{ padding: '6px 8px 6px 0' }}>{r.label}</td>
                      <td style={{ padding: '6px 8px 6px 0', fontWeight: 600 }}>{r.d50}</td>
                      <td style={{ padding: '6px 8px 6px 0', whiteSpace: 'nowrap' }}>{r.ek16 ?? '-'}</td>
                      <td style={{ padding: '6px 8px 6px 0', whiteSpace: 'nowrap' }}>{r.ek11 ?? '-'}</td>
                      <td style={{ padding: '6px 8px 6px 0' }}>{r.d10}</td>
                      <td style={{ padding: '6px 8px 6px 0' }}>{r.d90}</td>
                      <td style={{ padding: '6px 8px 6px 0' }}>{r.span}</td>
                      <td style={{ padding: '6px 8px 6px 0' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <button type="button" className="neu-sm" style={BUTTON} onClick={copyRecords}>{copied ? '복사했습니다' : '기록 복사'}</button>
              <button type="button" className="neu-sm" style={BUTTON} onClick={clearRecords}>기록 지우기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
