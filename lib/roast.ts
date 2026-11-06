// 로스팅 라인. A = Aroma Forever(라이트 라인), R = Roastery Never Die(다크 라인).
// 관리자 앱의 app.py ROASTS, templates/index.html ROASTS 와 같게 유지할 것.
export const ROASTS = {
  light:  { code: 'A3', line: 'Aroma Forever',      label: '라이트 로스팅', desc: '꽃과 과일 향, 산뜻한 산미가 돋보이는 밝은 로스팅이에요.' },
  medium: { code: 'R1', line: 'Roastery Never Die', label: '미디엄 로스팅', desc: '단맛과 균형이 좋아 편하게 마시기 좋은 로스팅이에요.' },
  dark:   { code: 'R2', line: 'Roastery Never Die', label: '다크 로스팅',   desc: '묵직한 바디와 쌉쌀한 맛이 진하게 남는 로스팅이에요.' },
} as const

export type RoastKey = keyof typeof ROASTS

export function roastInfo(key?: string | null) {
  return key && key in ROASTS ? ROASTS[key as RoastKey] : null
}
