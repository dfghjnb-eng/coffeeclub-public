/* 사진 속 커피 가루의 입자 크기를 잰다.
   AI 없이 픽셀만 세므로 같은 사진, 같은 동전 위치, 같은 기준값이면 결과가 항상 같다.
   브라우저 전용 API를 쓰지 않아 Node 에서도 검증할 수 있다. */

export const COINS = [
  { key: 'w100', label: '100원', mm: 24 },
  { key: 'w500', label: '500원', mm: 26.5 },
  { key: 'w50', label: '50원', mm: 21.6 },
  { key: 'w10', label: '10원(작은 것)', mm: 18 },
] as const

export type Circle = { x: number; y: number; r: number }

/* EK43 참고 눈금. 실측이 아니라 환산값이다.
   Honest Coffee Guide 는 EK43 전체 범위를 180~803μm 로 적고, 브루잉별 눈금 구간이 이 범위를 직선으로
   나눈 값과 맞는다. 예: 400μm → 0~16 눈금판 5.7, 700μm → 13.3 (V60 구간).
   눈금은 기계, 버, 0점에 따라 달라지므로 매장 EK43 실측표가 생기면 그것으로 바꿀 것. */
const EK43_MIN_UM = 180
const EK43_MAX_UM = 803
export const EK43_DIALS = [
  { key: 'ek16', label: '0~16 눈금판', min: 0, max: 16 },
  { key: 'ek11', label: '1~11 눈금판', min: 1, max: 11 },
] as const

export function ek43DialText(um: number, dial: { min: number; max: number }) {
  if (um < EK43_MIN_UM) return `${dial.min} 아래`
  if (um > EK43_MAX_UM) return `${dial.max} 이상`
  const value = dial.min + ((um - EK43_MIN_UM) / (EK43_MAX_UM - EK43_MIN_UM)) * (dial.max - dial.min)
  return `약 ${Math.round(value * 2) / 2}`
}

export type GrindOptions = {
  umPerPx: number
  coin?: Circle
  threshold?: number
}

export type HistogramBin = { from: number; to: number; percent: number }

export type GrindOverlay = {
  count: number
  row: Int32Array
  x0: Int32Array
  x1: Int32Array
  kind: Uint8Array // 1 = 측정한 입자, 2 = 뭉침으로 보고 제외
}

export type GrindResult = {
  umPerPx: number
  threshold: number
  count: number
  d10: number
  d50: number
  d90: number
  span: number // (D90-D10)/D50. 작을수록 고르다
  coverage: number
  clumpCount: number
  clumpShare: number
  tooSmallCount: number
  histogram: HistogramBin[]
  warnings: string[]
  overlay: GrindOverlay
  ms: number
}

export const DEFAULT_THRESHOLD = 0.65 // 가루(배경의 약 30%)와 종이의 중간쯤을 경계로 본다
const MIN_DIAMETER_PX = 3             // 이보다 작으면 크기를 잴 수 없어 세지 않는다
const CLUMP_UM = 2500                 // 굵은 분쇄보다도 큰 덩어리는 입자가 뭉친 것으로 본다
const CLUMP_FILL = 0.35               // 외곽 사각형을 이 비율도 못 채우면 입자가 이어진 모양이다
const COIN_MARGIN = 1.12              // 동전 그림자까지 빼려고 원보다 조금 넓게 제외한다
const EDGE_PX = 2

function luminance(data: Uint8ClampedArray, width: number, height: number) {
  const n = width * height
  const lum = new Uint8Array(n)
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    lum[i] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000
  }
  return lum
}

/* 칸마다 밝은 쪽(90%)을 종이 밝기로 본다. 조명이 고르지 않아도 칸별로 비교할 수 있다. */
function paperGrid(lum: Uint8Array, width: number, height: number) {
  const block = Math.max(48, Math.round(Math.min(width, height) / 32))
  const cols = Math.ceil(width / block)
  const rows = Math.ceil(height / block)
  const level = new Float32Array(cols * rows)
  const hist = new Int32Array(256)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      hist.fill(0)
      const y1 = Math.min(height, (r + 1) * block)
      const x1 = Math.min(width, (c + 1) * block)
      let total = 0
      for (let y = r * block; y < y1; y++) {
        const start = y * width
        for (let x = c * block; x < x1; x++) { hist[lum[start + x]]++; total++ }
      }
      const target = total * 0.9
      let sum = 0, v = 0
      for (; v < 255; v++) { sum += hist[v]; if (sum >= target) break }
      level[r * cols + c] = v
    }
  }
  const sorted = Float32Array.from(level).sort()
  const paper = sorted[Math.floor(sorted.length * 0.9)] || 1
  // 종이 밖(책상 등)으로 보이는 어두운 칸은 재지 않는다
  const valid = new Uint8Array(level.length)
  for (let i = 0; i < level.length; i++) valid[i] = level[i] >= paper * 0.6 ? 1 : 0
  return { block, cols, rows, level, valid }
}

const STATE_NONE = 0, STATE_DARK = 1, STATE_FORBIDDEN = 2

function buildMask(lum: Uint8Array, width: number, height: number, threshold: number, coin?: Circle) {
  const { block, cols, rows, level, valid } = paperGrid(lum, width, height)
  const state = new Uint8Array(width * height)
  const fx0 = new Int32Array(width), fx1 = new Int32Array(width), fxT = new Float32Array(width)
  for (let x = 0; x < width; x++) {
    const g = (x + 0.5) / block - 0.5
    const i = Math.max(0, Math.min(cols - 1, Math.floor(g)))
    fx0[x] = i
    fx1[x] = Math.min(cols - 1, i + 1)
    fxT[x] = Math.max(0, Math.min(1, g - i))
  }
  const coinR2 = coin ? (coin.r * COIN_MARGIN) ** 2 : 0
  let measured = 0, dark = 0
  for (let y = 0; y < height; y++) {
    const g = (y + 0.5) / block - 0.5
    const r0 = Math.max(0, Math.min(rows - 1, Math.floor(g)))
    const r1 = Math.min(rows - 1, r0 + 1)
    const t = Math.max(0, Math.min(1, g - r0))
    const rowNear = Math.min(rows - 1, Math.floor(y / block))
    const edgeY = y < EDGE_PX || y >= height - EDGE_PX
    const dy2 = coin ? (y - coin.y) ** 2 : 0
    const start = y * width
    for (let x = 0; x < width; x++) {
      const near = valid[rowNear * cols + Math.min(cols - 1, Math.floor(x / block))]
      const inCoin = coin ? (x - coin.x) ** 2 + dy2 <= coinR2 : false
      if (edgeY || x < EDGE_PX || x >= width - EDGE_PX || !near || inCoin) {
        state[start + x] = STATE_FORBIDDEN
        continue
      }
      measured++
      const c0 = fx0[x], c1 = fx1[x], s = fxT[x]
      const top = level[r0 * cols + c0] * (1 - s) + level[r0 * cols + c1] * s
      const bottom = level[r1 * cols + c0] * (1 - s) + level[r1 * cols + c1] * s
      const paper = top * (1 - t) + bottom * t
      if (lum[start + x] < paper * threshold) { state[start + x] = STATE_DARK; dark++ }
    }
  }
  return { state, coverage: measured ? dark / measured : 0 }
}

/* 가로 구간(run) 단위로 이어진 덩어리를 찾는다. 대각선으로 닿아도 한 덩어리다. */
function findComponents(state: Uint8Array, width: number, height: number) {
  let cap = 1 << 16
  let row = new Int32Array(cap), x0 = new Int32Array(cap), x1 = new Int32Array(cap)
  let parent = new Int32Array(cap), bad = new Uint8Array(cap)
  let n = 0
  const find = (a: number) => {
    while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a] }
    return a
  }
  let prevStart = 0, prevEnd = 0
  for (let y = 0; y < height; y++) {
    const start = y * width
    const rowStart = n
    let x = 0, p = prevStart
    while (x < width) {
      if (state[start + x] === STATE_NONE) { x++; continue }
      const a = x
      let forbidden = 0
      while (x < width && state[start + x] !== STATE_NONE) {
        if (state[start + x] === STATE_FORBIDDEN) forbidden = 1
        x++
      }
      const b = x - 1
      if (n === cap) {
        cap *= 2
        const grow = <T extends Int32Array | Uint8Array>(old: T, next: T) => { next.set(old); return next }
        row = grow(row, new Int32Array(cap)); x0 = grow(x0, new Int32Array(cap)); x1 = grow(x1, new Int32Array(cap))
        parent = grow(parent, new Int32Array(cap)); bad = grow(bad, new Uint8Array(cap))
      }
      row[n] = y; x0[n] = a; x1[n] = b; parent[n] = n; bad[n] = forbidden
      while (p < prevEnd && x1[p] < a - 1) p++
      for (let q = p; q < prevEnd && x0[q] <= b + 1; q++) {
        const ra = find(n), rb = find(q)
        if (ra !== rb) parent[ra] = rb
      }
      n++
    }
    prevStart = rowStart
    prevEnd = n
  }
  return { n, row, x0, x1, bad, find }
}

function weightedQuantile(values: Float64Array, weights: Float64Array, total: number, q: number) {
  const target = total * q
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += weights[i]
    if (sum >= target) return values[i]
  }
  return values.length ? values[values.length - 1] : 0
}

/* 3분의 1 옥타브 간격. 100~2500μm 를 14칸으로 나눈다. */
function buildHistogram(diameters: Float64Array, weights: Float64Array, total: number): HistogramBin[] {
  const bins: HistogramBin[] = []
  let from = 100
  while (from < 2500) {
    const to = Math.min(2500, from * 2 ** (1 / 3))
    bins.push({ from, to, percent: 0 })
    from = to
  }
  for (let i = 0; i < diameters.length; i++) {
    const d = diameters[i]
    const bin = bins.find((b) => d >= b.from && d < b.to) ?? (d < 100 ? bins[0] : bins[bins.length - 1])
    bin.percent += (weights[i] / (total || 1)) * 100
  }
  return bins
}

export function analyzeGrind(
  image: { data: Uint8ClampedArray; width: number; height: number },
  options: GrindOptions,
): GrindResult {
  const startedAt = Date.now()
  const { width, height, data } = image
  const { umPerPx, coin } = options
  const threshold = options.threshold ?? DEFAULT_THRESHOLD

  const lum = luminance(data, width, height)
  const { state, coverage } = buildMask(lum, width, height, threshold, coin)
  const { n, row, x0, x1, bad, find } = findComponents(state, width, height)

  // 덩어리별 면적과 외곽 사각형을 모은다
  const roots = new Int32Array(n)
  const index = new Map<number, number>()
  const area: number[] = [], minX: number[] = [], maxX: number[] = []
  const minY: number[] = [], maxY: number[] = [], blocked: number[] = []
  for (let i = 0; i < n; i++) {
    const root = find(i)
    let k = index.get(root)
    if (k === undefined) {
      k = area.length
      index.set(root, k)
      area.push(0); minX.push(x0[i]); maxX.push(x1[i]); minY.push(row[i]); maxY.push(row[i]); blocked.push(0)
    }
    roots[i] = k
    area[k] += x1[i] - x0[i] + 1
    if (x0[i] < minX[k]) minX[k] = x0[i]
    if (x1[i] > maxX[k]) maxX[k] = x1[i]
    if (row[i] > maxY[k]) maxY[k] = row[i]
    if (bad[i]) blocked[k] = 1
  }

  // 분류: 동전·가장자리에 닿은 덩어리는 잘렸을 수 있어 세지 않는다
  const kindOf = new Uint8Array(area.length)
  const sizes: number[] = []
  let clumpVolume = 0, tooSmallCount = 0, clumpCount = 0
  for (let k = 0; k < area.length; k++) {
    if (blocked[k]) continue
    const px = 2 * Math.sqrt(area[k] / Math.PI)
    if (px < MIN_DIAMETER_PX) { tooSmallCount++; continue }
    const um = px * umPerPx
    const fill = area[k] / ((maxX[k] - minX[k] + 1) * (maxY[k] - minY[k] + 1))
    if (um > CLUMP_UM || (fill < CLUMP_FILL && px > MIN_DIAMETER_PX * 4)) {
      kindOf[k] = 2
      clumpCount++
      clumpVolume += um ** 3
      continue
    }
    kindOf[k] = 1
    sizes.push(um)
  }

  // 체나 레이저 측정처럼 부피 기준으로 낸다. 입자 수로 세면 작은 먼지가 값을 끌어내린다.
  sizes.sort((a, b) => a - b)
  const diameters = Float64Array.from(sizes)
  const weights = new Float64Array(diameters.length)
  let totalVolume = 0
  for (let i = 0; i < diameters.length; i++) {
    weights[i] = diameters[i] ** 3
    totalVolume += weights[i]
  }
  const d10 = weightedQuantile(diameters, weights, totalVolume, 0.1)
  const d50 = weightedQuantile(diameters, weights, totalVolume, 0.5)
  const d90 = weightedQuantile(diameters, weights, totalVolume, 0.9)
  const span = d50 ? (d90 - d10) / d50 : 0
  const clumpShare = totalVolume + clumpVolume ? clumpVolume / (totalVolume + clumpVolume) : 0

  // 화면에 입자를 칠할 때 쓰는 구간 목록. row 순서로 정렬돼 있다
  let kept = 0
  for (let i = 0; i < n; i++) if (kindOf[roots[i]]) kept++
  const overlay: GrindOverlay = {
    count: kept,
    row: new Int32Array(kept), x0: new Int32Array(kept), x1: new Int32Array(kept), kind: new Uint8Array(kept),
  }
  for (let i = 0, j = 0; i < n; i++) {
    const kind = kindOf[roots[i]]
    if (!kind) continue
    overlay.row[j] = row[i]; overlay.x0[j] = x0[i]; overlay.x1[j] = x1[i]; overlay.kind[j] = kind
    j++
  }

  const warnings: string[] = []
  if (umPerPx > 40) warnings.push('너무 멀리서 찍었거나 해상도가 낮습니다. 더 가까이에서 다시 찍어 주세요.')
  if (diameters.length < 300) warnings.push(`입자가 ${diameters.length}개뿐입니다. 300개 이상이어야 값이 안정적입니다.`)
  if (coverage > 0.3) warnings.push('가루가 너무 많습니다. 입자가 서로 닿지 않게 더 얇게 펴 주세요.')
  if (clumpShare > 0.1) warnings.push('뭉친 입자가 많아 제외했습니다. 더 얇게 펴 주세요.')
  if (d50 && d50 / umPerPx < 12) warnings.push('입자가 사진 해상도에 비해 작아 값을 믿기 어렵습니다. 더 가까이에서 찍어 주세요.')

  return {
    umPerPx, threshold, count: diameters.length,
    d10, d50, d90, span, coverage, clumpCount, clumpShare, tooSmallCount,
    histogram: buildHistogram(diameters, weights, totalVolume),
    warnings, overlay,
    ms: Date.now() - startedAt,
  }
}
