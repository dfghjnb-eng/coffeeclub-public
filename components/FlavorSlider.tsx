'use client'

const LABELS: Record<string, string> = {
  acidity:   '산미',
  sweetness: '단맛',
  body:      '바디',
  bitterness:'쓴맛',
  aroma:     '향',
  balance:   '균형',
}
const KEYS = ['acidity', 'sweetness', 'body', 'bitterness', 'aroma', 'balance']

// dot colors are now driven by CSS variables (--dot-0 … --dot-5)
// keeping fallback constants only for the SVG gradient defs (which need literal values)
const FLAVOR_COLORS = {
  peach: 'var(--p-peach)',
  herb:  'var(--p-herb)',
  lemon: 'var(--p-lemon)',
}

// CSS-var fill helper
function dotFill(i: number): string {
  return `var(--dot-${Math.min(i, 5)})`
}

export default function FlavorSlider({ fg }: { fg: Record<string, number> }) {
  const activeKeys = KEYS.filter(k => fg[k] !== undefined && fg[k] !== null)
  if (activeKeys.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--p-dim)', fontSize: 'calc(var(--sz-body) * 0.929)' }}>
        향미 데이터 없음
      </div>
    )
  }

  const labels = activeKeys.map(k => LABELS[k] || k)
  // Supabase stores 0–10; normalise to 0–1
  const values = activeKeys.map(k => Math.min(1, Math.max(0, (fg[k] ?? 0) / 10)))

  const W = 290
  const ROW_H = 52
  const padL = 56
  const padR = 52
  const trackW = W - padL - padR
  const H = ROW_H * labels.length + 20

  const dotPositions = values.map((v, i) => ({
    x: padL + v * trackW,
    y: 18 + i * ROW_H,
  }))

  const pathD = dotPositions.reduce((acc, p, i) =>
    acc + (i === 0 ? `M${p.x} ${p.y}` : ` L${p.x} ${p.y}`), '')

  return (
    <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
      {/* 글로우 path */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, filter: 'blur(16px)', opacity: 0.65 }}>
        <defs>
          <linearGradient id="flavorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={FLAVOR_COLORS.peach} />
            <stop offset="100%" stopColor={FLAVOR_COLORS.lemon} />
          </linearGradient>
        </defs>
        <path d={pathD} stroke="url(#flavorGrad)" strokeWidth="24" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* 트랙 + 점 */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {labels.map((_, i) => (
          <line key={i}
            x1={padL} x2={W - padR + 6}
            y1={18 + i * ROW_H} y2={18 + i * ROW_H}
            stroke="var(--p-dim)" strokeWidth="1" />
        ))}
        {dotPositions.map((p, i) => {
          const isHighlight = i === 1
          return (
            <g key={i}>
              {isHighlight && (
                <circle cx={p.x} cy={p.y} r="11"
                  style={{ fill: dotFill(i) }} opacity="0.3" />
              )}
              <circle cx={p.x} cy={p.y} r={isHighlight ? 5.5 : 6.5}
                style={{ fill: dotFill(i) }} />
            </g>
          )
        })}
      </svg>

      {/* 좌측 라벨 */}
      {labels.map((l, i) => (
        <div key={`l-${i}`} style={{
          position: 'absolute',
          right: W - padL + 8,
          top: 18 + i * ROW_H - 6,
          fontSize: 'calc(var(--sz-label) * 0.818)',
          fontFamily: 'Inter',
          fontWeight: 500,
          color: 'var(--p-text)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          textAlign: 'right',
          width: padL - 4,
        }}>{l}</div>
      ))}

      {/* 우측 수치 */}
      {values.map((v, i) => (
        <div key={`v-${i}`} style={{
          position: 'absolute',
          left: W - padR + 12,
          top: 18 + i * ROW_H - 6,
          fontSize: 'calc(var(--sz-label) * 0.909)',
          fontFamily: 'Fraunces, serif',
          fontWeight: 500,
          color: 'var(--p-muted)',
        }}>{Math.round(v * 100)}</div>
      ))}
    </div>
  )
}
