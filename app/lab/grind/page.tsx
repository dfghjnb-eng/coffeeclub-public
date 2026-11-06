import type { Metadata } from 'next'
import GrindLab from '@/components/GrindLab'

// 내부 테스트용. 메뉴에서 연결하지 않고 검색에도 잡히지 않게 한다.
export const metadata: Metadata = {
  title: '분쇄도 측정 시제품',
  robots: { index: false, follow: false },
}

export default function GrindLabPage() {
  return <GrindLab />
}
