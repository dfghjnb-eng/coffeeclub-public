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

/* EK43 참고 눈금. 매장 기계를 잰 값이 아니라 공개 자료로 환산한 값이다.
   Onyx Coffee Lab Grind Calculator 의 EK43(0~16) 측정 곡선: μm = 396.01 × e^(0.057 × 눈금) (DiFluid Omni).
   눈금 0~4 는 측정값이 430~480μm 로 거의 평평해 구분할 수 없고, 이웃 눈금끼리 흔들려 정밀도는 ±1 정도다.
   이 페이지의 D50 은 Onyx 값보다 크게 나와서 곡선에 넣기 전에 EK43_D50_RATIO 로 나눈다.
   이 비율은 매장 EK43 눈금 9 측정 1건에서 정한 임시값이다: 휴대폰 측정 1,315μm 에 입자 분할 효과(-5%)를 반영한 약 1,249μm ÷ 곡선의 눈금 9 값 661μm.
   그래서 눈금 9 는 맞도록 정해져 있고, 다른 눈금은 아직 검증하지 않았다. 눈금별 측정이 쌓이면 다시 정할 것.
   구형 1~11 눈금판은 Honest Coffee Guide 의 두 눈금판 표가 보여 주는 관계(구형 = 1 + 눈금 × 10/16)로 바꾼다. */
const EK43_CURVE_A = 396.01
const EK43_CURVE_K = 0.057
const EK43_D50_RATIO = 1.89
const EK43_FLAT_BELOW = 4
const EK43_TOP = 16
export const EK43_DIALS = [
  { key: 'ek16', label: '0~16 눈금판', scale: (dial: number) => dial },
  { key: 'ek11', label: '1~11 눈금판', scale: (dial: number) => 1 + dial * (10 / 16) },
] as const

export const EK43_SOURCE_URL = 'https://onyxcoffeelab.com/pages/grind-size-calculator'

export function ek43DialText(um: number, dial: { scale: (dial: number) => number }) {
  const value = Math.log(um / EK43_D50_RATIO / EK43_CURVE_A) / EK43_CURVE_K
  const show = (d: number) => Math.round(dial.scale(d) * 2) / 2
  if (value <= EK43_FLAT_BELOW) return `${show(EK43_FLAT_BELOW)} 이하 (구분 어려움)`
  if (value >= EK43_TOP) return `${show(EK43_TOP)} 이상`
  return `약 ${Math.round(dial.scale(value))}`
}

export type GrindOptions = {
  umPerPx: number
  coin?: Circle
  threshold?: number
  neck?: number
}

export type HistogramBin = { from: number; to: number; percent: number }

export type GrindOverlay = {
  count: number
  row: Int32Array
  x0: Int32Array
  x1: Int32Array
  kind: Uint8Array // 1·3 = 측정한 입자(나눈 조각끼리 번갈아 표시), 2 = 뭉침으로 보고 제외
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
  splitCount: number // 닿은 입자로 보고 나눈 덩어리 수
  tooSmallCount: number
  histogram: HistogramBin[]
  warnings: string[]
  overlay: GrindOverlay
  ms: number
}

export const DEFAULT_THRESHOLD = 0.69 // 매장 EK43 실측에서 이 값이 맞게 나왔다 (2026-11-07, 비율 EK43_D50_RATIO 와 함께 쓴다)
const MIN_DIAMETER_PX = 3             // 이보다 작으면 크기를 잴 수 없어 세지 않는다
const CLUMP_UM = 2500                 // 굵은 분쇄보다도 큰 덩어리는 입자가 뭉친 것으로 본다
const CLUMP_FILL = 0.35               // 외곽 사각형을 이 비율도 못 채우면 입자가 이어진 모양이다
const COIN_MARGIN = 1.12              // 동전 그림자까지 빼려고 원보다 조금 넓게 제외한다
const EDGE_PX = 2
const SPLIT_MIN_PX = 40               // 이보다 작은 덩어리는 나누지 않는다
const SPLIT_NECK = 0.8                // 잘록한 곳이 작은 쪽 봉우리의 이 비율보다 좁으면 닿은 입자로 본다
const SPLIT_MIN_PIECE_PX = 12         // 이보다 작은 조각은 옆 조각에 합친다

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

type Piece = { area: number; width: number; height: number; runs: number[] } // runs: row, x0, x1 반복

/* 한 덩어리를 거리 지도로 나눈다. 안쪽 깊이의 봉우리를 입자로 보고, 봉우리 사이가 충분히 잘록할 때만 가른다.
   둘레가 울퉁불퉁한 한 알이 쪼개지지 않도록 얕은 골짜기는 합친다. */
function splitComponent(
  runIds: number[], row: Int32Array, x0: Int32Array, x1: Int32Array,
  box: { minX: number; maxX: number; minY: number; maxY: number }, neck: number,
): Piece[] {
  const left = box.minX - 1, top = box.minY - 1
  const w = box.maxX - box.minX + 3, h = box.maxY - box.minY + 3
  const mask = new Uint8Array(w * h)
  const dist = new Int32Array(w * h)
  const pixels: number[] = []
  const FAR = 1 << 28
  for (const i of runIds) {
    const start = (row[i] - top) * w - left
    for (let x = x0[i]; x <= x1[i]; x++) { mask[start + x] = 1; dist[start + x] = FAR; pixels.push(start + x) }
  }
  // 3-4 체임퍼 거리: 곧은 방향 3, 대각선 4
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x
    if (mask[p]) dist[p] = Math.min(dist[p], dist[p - 1] + 3, dist[p - w] + 3, dist[p - w - 1] + 4, dist[p - w + 1] + 4)
  }
  for (let y = h - 2; y > 0; y--) for (let x = w - 2; x > 0; x--) {
    const p = y * w + x
    if (mask[p]) dist[p] = Math.min(dist[p], dist[p + 1] + 3, dist[p + w] + 3, dist[p + w + 1] + 4, dist[p + w - 1] + 4)
  }

  const label = new Int32Array(w * h) // 0 = 아직 없음
  const parent: number[] = [0], peak: number[] = [0]
  const find = (a: number) => {
    while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a] }
    return a
  }
  const around = [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1]
  pixels.sort((a, b) => dist[b] - dist[a])
  for (const p of pixels) {
    let best = 0
    const roots: number[] = []
    for (const d of around) {
      const l = label[p + d]
      if (!l) continue
      const r = find(l)
      if (!roots.includes(r)) roots.push(r)
      if (!best || peak[r] > peak[best]) best = r
    }
    if (!best) {
      best = parent.length
      parent.push(best); peak.push(dist[p])
    } else {
      for (const r of roots) {
        if (r !== best && dist[p] >= neck * Math.min(peak[r], peak[best])) parent[r] = best
      }
    }
    label[p] = best
  }

  // 작은 조각은 가장 많이 닿은 옆 조각에 합친다
  const areaOf = new Map<number, number>()
  for (const p of pixels) { const r = find(label[p]); areaOf.set(r, (areaOf.get(r) ?? 0) + 1) }
  for (const [root, size] of [...areaOf.entries()].sort((a, b) => a[1] - b[1])) {
    if (size >= SPLIT_MIN_PIECE_PX || areaOf.size < 2) continue
    const votes = new Map<number, number>()
    for (const p of pixels) {
      if (find(label[p]) !== root) continue
      for (const d of around) {
        const l = label[p + d]
        if (!l) continue
        const r = find(l)
        if (r !== root) votes.set(r, (votes.get(r) ?? 0) + 1)
      }
    }
    const target = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]
    if (target) { parent[root] = target[0]; areaOf.set(target[0], (areaOf.get(target[0]) ?? 0) + size); areaOf.delete(root) }
  }

  // 조각별 면적·크기·가로 구간
  const pieces = new Map<number, Piece & { minX: number; maxX: number; minY: number; maxY: number }>()
  for (let y = 1; y < h - 1; y++) {
    let x = 1
    while (x < w - 1) {
      const p = y * w + x
      if (!mask[p]) { x++; continue }
      const root = find(label[p])
      let end = x
      while (end + 1 < w - 1 && mask[y * w + end + 1] && find(label[y * w + end + 1]) === root) end++
      let piece = pieces.get(root)
      if (!piece) {
        piece = { area: 0, width: 0, height: 0, runs: [], minX: x, maxX: end, minY: y, maxY: y }
        pieces.set(root, piece)
      }
      piece.area += end - x + 1
      piece.minX = Math.min(piece.minX, x); piece.maxX = Math.max(piece.maxX, end); piece.maxY = y
      piece.runs.push(y + top, x + left, end + left)
      x = end + 1
    }
  }
  return [...pieces.values()].map((piece) => ({
    area: piece.area, runs: piece.runs,
    width: piece.maxX - piece.minX + 1, height: piece.maxY - piece.minY + 1,
  }))
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

  // 덩어리별 구간 목록
  const head = new Int32Array(area.length).fill(-1), next = new Int32Array(n)
  for (let i = n - 1; i >= 0; i--) { next[i] = head[roots[i]]; head[roots[i]] = i }

  // 동전·가장자리에 닿은 덩어리는 잘렸을 수 있어 세지 않는다. 나머지는 닿은 입자를 나눈 뒤 분류한다
  const neck = options.neck ?? SPLIT_NECK
  const sizes: number[] = []
  const shown: number[] = [] // row, x0, x1, kind 반복
  let clumpVolume = 0, tooSmallCount = 0, clumpCount = 0, splitCount = 0
  for (let k = 0; k < area.length; k++) {
    if (blocked[k]) continue
    const runIds: number[] = []
    for (let i = head[k]; i !== -1; i = next[i]) runIds.push(i)
    let pieces: Piece[]
    if (area[k] >= SPLIT_MIN_PX) {
      pieces = splitComponent(runIds, row, x0, x1, { minX: minX[k], maxX: maxX[k], minY: minY[k], maxY: maxY[k] }, neck)
    } else {
      pieces = [{
        area: area[k], width: maxX[k] - minX[k] + 1, height: maxY[k] - minY[k] + 1,
        runs: runIds.flatMap((i) => [row[i], x0[i], x1[i]]),
      }]
    }
    if (pieces.length > 1) splitCount++
    pieces.forEach((piece, index) => {
      const px = 2 * Math.sqrt(piece.area / Math.PI)
      if (px < MIN_DIAMETER_PX) { tooSmallCount++; return }
      const um = px * umPerPx
      const fill = piece.area / (piece.width * piece.height)
      let kind = index % 2 ? 3 : 1
      if (um > CLUMP_UM || (fill < CLUMP_FILL && px > MIN_DIAMETER_PX * 4)) {
        kind = 2
        clumpCount++
        clumpVolume += um ** 3
      } else {
        sizes.push(um)
      }
      for (let i = 0; i < piece.runs.length; i += 3) shown.push(piece.runs[i], piece.runs[i + 1], piece.runs[i + 2], kind)
    })
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

  // 화면에 입자를 칠할 때 쓰는 구간 목록. 확대 보기가 row 순서에 기대므로 정렬한다
  const kept = shown.length / 4
  const order = Array.from({ length: kept }, (_, i) => i).sort((a, b) => shown[a * 4] - shown[b * 4])
  const overlay: GrindOverlay = {
    count: kept,
    row: new Int32Array(kept), x0: new Int32Array(kept), x1: new Int32Array(kept), kind: new Uint8Array(kept),
  }
  order.forEach((from, to) => {
    overlay.row[to] = shown[from * 4]; overlay.x0[to] = shown[from * 4 + 1]
    overlay.x1[to] = shown[from * 4 + 2]; overlay.kind[to] = shown[from * 4 + 3]
  })

  const warnings: string[] = []
  if (umPerPx > 40) warnings.push('너무 멀리서 찍었거나 해상도가 낮습니다. 더 가까이에서 다시 찍어 주세요.')
  if (diameters.length < 300) warnings.push(`입자가 ${diameters.length}개뿐입니다. 300개 이상이어야 값이 안정적입니다.`)
  if (coverage > 0.1) warnings.push('가루가 많아 입자가 겹쳤을 수 있습니다. 값이 실제보다 크게 나옵니다. 더 얇게 펴 주세요.')
  if (clumpShare > 0.1) warnings.push('뭉친 가루가 많아 제외했습니다. 뭉친 곳을 흩어서 다시 찍으면 값이 더 정확합니다.')
  if (d50 && d50 / umPerPx < 12) warnings.push('입자가 사진 해상도에 비해 작아 값을 믿기 어렵습니다. 더 가까이에서 찍어 주세요.')

  return {
    umPerPx, threshold, count: diameters.length,
    d10, d50, d90, span, coverage, clumpCount, clumpShare, splitCount, tooSmallCount,
    histogram: buildHistogram(diameters, weights, totalVolume),
    warnings, overlay,
    ms: Date.now() - startedAt,
  }
}
