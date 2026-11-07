import type { Metadata } from 'next'
import GrindLab from '@/components/GrindLab'

// 상단 바로가기 메뉴에서 연결한다. 참고용 도구라 검색에는 잡히지 않게 둔다.
export const metadata: Metadata = {
  title: '분쇄도 측정',
  robots: { index: false, follow: false },
}

export default function GrindLabPage() {
  return <GrindLab />
}
