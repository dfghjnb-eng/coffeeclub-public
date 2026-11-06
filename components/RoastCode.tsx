import { roastInfo } from '@/lib/roast'

/* 원두 이름 앞에 붙는 로스팅 코드(A3·R1·R2). 로스팅을 정하지 않은 원두는 아무것도 그리지 않는다. */
export default function RoastCode({ roast }: { roast?: string | null }) {
  const info = roastInfo(roast)
  if (!info) return null
  return (
    <span style={{
      fontFamily: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif",
      fontWeight: 700, color: 'var(--p-accent)', marginRight: '0.35em',
    }}>
      {info.code}
    </span>
  )
}
