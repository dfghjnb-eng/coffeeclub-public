import type { ReactNode } from 'react'

const PAPER = '#FFFFFF'
const LINE = '#CFCBC1'
const GROUND = '#4A3428'
const COIN = '#B7B4AB'
const COIN_EDGE = '#8F8C83'
const RED = '#E8200C'
const BAD = '#B3261E'

const TEXT = 'Inter, sans-serif'

function Art({ label, size = 84, children }: { label: string; size?: number; children: ReactNode }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label={label} style={{ flexShrink: 0, display: 'block' }}>
      {children}
    </svg>
  )
}

const Paper = () => <rect x="8" y="12" width="80" height="72" rx="4" fill={PAPER} stroke={LINE} strokeWidth="1.5" />

/* 입자는 조금씩 다른 크기로 흩어 놓는다 */
const SPREAD: [number, number, number][] = [
  [18, 26, 2.2], [30, 22, 1.6], [24, 38, 2.6], [38, 34, 1.8], [16, 52, 1.8], [30, 50, 2.4],
  [42, 48, 1.6], [22, 68, 2.2], [36, 66, 1.8], [48, 62, 2.4], [50, 26, 2], [62, 34, 1.6],
  [60, 52, 2.2], [72, 44, 1.8], [64, 70, 2], [76, 64, 2.4], [76, 24, 1.8],
]
const Grounds = ({ points = SPREAD }: { points?: [number, number, number][] }) => (
  <>{points.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={GROUND} />)}</>
)
const LEFT_SIDE = SPREAD.filter(([x]) => x < 46)

const Coin = ({ x = 66, y = 48, r = 14 }: { x?: number; y?: number; r?: number }) => (
  <>
    <circle cx={x} cy={y} r={r} fill={COIN} stroke={COIN_EDGE} strokeWidth="1.5" />
    <text x={x} y={y + 3.5} fontSize={r * 0.72} fontWeight="700" fill={COIN_EDGE} textAnchor="middle" fontFamily={TEXT}>100</text>
  </>
)

function Mark({ good }: { good: boolean }) {
  return good
    ? <circle cx="82" cy="18" r="8" fill="none" stroke="var(--p-ink)" strokeWidth="3" />
    : <path d="M75 11 L89 25 M89 11 L75 25" stroke={BAD} strokeWidth="3.5" strokeLinecap="round" />
}

const STEPS: { title: string; body: string; label: string; art: ReactNode }[] = [
  {
    title: '가루를 얇게 펴 주세요',
    body: '흰 종이에 가루를 조금만 올리고, 입자가 서로 닿지 않게 넓게 펴 주세요.',
    label: '흰 종이 위에 커피 가루가 고르게 흩어진 그림',
    art: <><Paper /><Grounds /></>,
  },
  {
    title: '옆에 동전을 놓아 주세요',
    body: '동전이 크기 기준이 됩니다. 100원, 500원, 50원, 10원(작은 것)을 쓸 수 있어요.',
    label: '가루 옆에 100원 동전을 놓은 그림',
    art: <><Paper /><Grounds points={LEFT_SIDE} /><Coin /></>,
  },
  {
    title: '바로 위에서 찍어 주세요',
    body: '밝은 곳에서 휴대폰을 종이와 수평으로 들고, 종이가 화면을 채우도록 가까이에서 찍어 주세요.',
    label: '휴대폰을 종이 바로 위에 수평으로 든 그림',
    art: (
      <>
        <rect x="20" y="12" width="56" height="10" rx="3" fill="var(--p-ink)" />
        <circle cx="48" cy="22" r="2.5" fill={COIN} />
        <path d="M48 28 V60 M42 53 L48 60 L54 53" stroke="var(--p-muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
        <rect x="8" y="72" width="80" height="5" rx="1.5" fill={PAPER} stroke={LINE} strokeWidth="1.5" />
        <circle cx="20" cy="70.5" r="1.8" fill={GROUND} /><circle cx="30" cy="70.8" r="1.5" fill={GROUND} />
        <circle cx="40" cy="70.5" r="1.8" fill={GROUND} />
        <rect x="58" y="68.5" width="20" height="3.5" rx="1" fill={COIN} stroke={COIN_EDGE} strokeWidth="1" />
      </>
    ),
  },
  {
    title: '빨간 원을 동전에 맞춰 주세요',
    body: '원을 끌어서 동전 위로 옮기고, 크기를 조절해 테두리에 딱 맞춰 주세요. 동전 종류도 맞게 골라 주세요.',
    label: '사진 속 동전 테두리에 빨간 원을 맞추는 그림',
    art: (
      <>
        <rect x="8" y="12" width="80" height="72" rx="4" fill={PAPER} stroke={LINE} strokeWidth="1.5" />
        <Grounds points={LEFT_SIDE} />
        <Coin x={62} y={50} r={18} />
        <circle cx="62" cy="50" r="18" fill="none" stroke={RED} strokeWidth="2.5" />
        <path d="M58 50 H66 M62 46 V54" stroke={RED} strokeWidth="1.5" />
      </>
    ),
  },
  {
    title: '측정하기를 누르면 끝이에요',
    body: '대표 입자 크기와 말코닉·코만단테 기준 값이 나옵니다. 사진을 누르면 가루를 제대로 찾았는지 확대해 볼 수 있어요.',
    label: '입자 크기 숫자와 분포 그래프가 나온 결과 화면 그림',
    art: (
      <>
        <rect x="8" y="12" width="80" height="72" rx="4" fill={PAPER} stroke={LINE} strokeWidth="1.5" />
        <text x="16" y="31" fontSize="13" fontWeight="700" fill="var(--p-ink)" fontFamily={TEXT}>640μm</text>
        <line x1="16" y1="74" x2="80" y2="74" stroke={LINE} strokeWidth="1.5" />
        {[[18, 6], [28, 13], [38, 24], [48, 32], [58, 20], [68, 9]].map(([x, h]) => (
          <rect key={x} x={x} y={74 - h} width="8" height={h} rx="1.5" fill="var(--p-ink)" />
        ))}
      </>
    ),
  },
]

const EXAMPLES: { good: boolean; title: string; body: string; label: string; art: ReactNode }[] = [
  {
    good: true, title: '좋아요', body: '입자가 떨어져 있어요',
    label: '입자가 서로 떨어져 있는 좋은 예',
    art: <><Paper /><Grounds /><Mark good /></>,
  },
  {
    good: false, title: '뭉치면 안 돼요', body: '쌓인 가루는 빠져요',
    label: '가루가 한곳에 뭉친 나쁜 예',
    art: (
      <>
        <Paper />
        <circle cx="40" cy="48" r="16" fill={GROUND} /><circle cx="54" cy="42" r="11" fill={GROUND} />
        <circle cx="52" cy="58" r="10" fill={GROUND} /><circle cx="28" cy="40" r="7" fill={GROUND} />
        <Mark good={false} />
      </>
    ),
  },
  {
    good: false, title: '비스듬히 안 돼요', body: '값이 틀어져요',
    label: '비스듬히 찍어 동전이 타원으로 보이는 나쁜 예',
    art: (
      <>
        <path d="M22 26 H74 L90 80 H6 Z" fill={PAPER} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
        <ellipse cx="60" cy="56" rx="15" ry="8" fill={COIN} stroke={COIN_EDGE} strokeWidth="1.5" />
        <circle cx="30" cy="46" r="1.8" fill={GROUND} /><circle cx="24" cy="62" r="2.2" fill={GROUND} /><circle cx="40" cy="68" r="1.8" fill={GROUND} />
        <Mark good={false} />
      </>
    ),
  },
]

/* 분쇄도 측정 사용 방법. 처음에는 펼쳐 두고, 사진을 고르면 접는다. */
export default function GrindGuide({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="neu" style={{ borderRadius: 'var(--sz-radius)', padding: 18, marginBottom: 14 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        style={{
          display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
          padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--p-ink)',
          fontFamily: TEXT, fontSize: 'calc(var(--sz-body) * 1)', fontWeight: 600,
        }}
      >
        사용 방법
        <span aria-hidden style={{ color: 'var(--p-muted)', fontSize: 'calc(var(--sz-body) * 0.857)', fontWeight: 500 }}>
          {open ? '접기 ▴' : '펼치기 ▾'}
        </span>
      </button>

      {open && (
        <>
          <ol style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: 14 }}>
            {STEPS.map((step, index) => (
              <li key={step.title} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Art label={step.label}>{step.art}</Art>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: TEXT, fontWeight: 600, color: 'var(--p-ink)', fontSize: 'calc(var(--sz-body) * 0.929)', marginBottom: 3 }}>
                    {index + 1}. {step.title}
                  </div>
                  <div style={{ fontFamily: TEXT, color: 'var(--p-muted)', fontSize: 'calc(var(--sz-body) * 0.857)', lineHeight: 1.55 }}>
                    {step.body}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--p-line)' }}>
            <div style={{ fontFamily: TEXT, fontWeight: 600, color: 'var(--p-ink)', fontSize: 'calc(var(--sz-body) * 0.929)', marginBottom: 10 }}>
              이렇게 찍어 주세요
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              {EXAMPLES.map((example) => (
                <div key={example.title} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Art label={example.label} size={72}>{example.art}</Art>
                  </div>
                  <div style={{ fontFamily: TEXT, fontWeight: 600, color: example.good ? 'var(--p-ink)' : BAD, fontSize: 'calc(var(--sz-body) * 0.786)', marginTop: 4 }}>
                    {example.title}
                  </div>
                  <div style={{ fontFamily: TEXT, color: 'var(--p-muted)', fontSize: 'calc(var(--sz-body) * 0.75)', lineHeight: 1.4 }}>
                    {example.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14, fontFamily: TEXT, color: 'var(--p-muted)', fontSize: 'calc(var(--sz-body) * 0.857)', lineHeight: 1.6 }}>
            가루가 덜 칠해지면 &ldquo;가루로 볼 어둡기&rdquo;를 조금 올리고, 종이까지 칠해지면 조금 내린 뒤 다시 측정해 주세요.
          </div>
        </>
      )}
    </div>
  )
}
