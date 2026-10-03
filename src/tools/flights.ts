// Matrix wire format adapted from YogevKr/itamx (MIT); see third-party notice.
// This is Matrix's public web-app key, not a personal API credential.
const PUBLIC_APP_KEY = 'AIza' + 'SyBH1mte6BdKzvf0c2mYprkyvfHCRWmfX7g'

export interface FlightTask { from: string; to: string; date: string }
export interface FlightResult extends FlightTask {
  price: number | null
  airline: string
  flights: string
  departure: string
  arrival: string
  fetchedAt: string
}

const cities: Record<string, string> = {
  上海: 'SHA', 北京: 'BJS', 广州: 'CAN', 深圳: 'SZX', 杭州: 'HGH', 成都: 'CTU',
  香港: 'HKG', 台北: 'TPE', 东京: 'TYO', 大阪: 'OSA', 名古屋: 'NGO', 福冈: 'FUK',
  札幌: 'SPK', 冲绳: 'OKA', 首尔: 'SEL', 新加坡: 'SIN', 曼谷: 'BKK',
}

export function cityName(code: string): string {
  const airports: Record<string, string> = { PVG: '上海浦东', NRT: '东京成田', HND: '东京羽田', KIX: '大阪关西', PEK: '北京首都', PKX: '北京大兴' }
  return airports[code] ?? Object.entries(cities).find(([, value]) => value === code)?.[0] ?? code
}

export function parseCities(value: string): string[] {
  const tokens = value.trim().split(/[\s,，、;；]+/).filter(Boolean)
  const codes = tokens.map(token => cities[token] ?? token.toUpperCase())
  const invalid = codes.find(code => !/^[A-Z]{3}$/.test(code))
  if (invalid) throw new Error(`无法识别「${invalid}」，请用三字码，例如 PVG、TYO。`)
  return [...new Set(codes)]
}

export function makeTasks(from: string, to: string, start: string, end: string): FlightTask[] {
  const origins = parseCities(from), destinations = parseCities(to)
  if (!origins.length || !destinations.length) throw new Error('请填写出发和目的城市。')
  const first = Date.parse(`${start}T00:00:00Z`), last = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(first) || !Number.isFinite(last) || first > last) throw new Error('请填写有效日期区间，结束日期不能早于开始日期。')
  const tasks: FlightTask[] = []
  for (let day = first; day <= last; day += 86400000) {
    const date = new Date(day).toISOString().slice(0, 10)
    for (const src of origins) for (const dst of destinations) {
      if (src !== dst) tasks.push({ from: src, to: dst, date })
    }
  }
  if (!tasks.length) throw new Error('出发和目的城市不能全部相同。')
  return tasks
}

export const taskKey = (task: FlightTask) => `${task.date}:${task.from}:${task.to}`

interface MatrixSolution {
  displayTotal?: string
  itinerary?: {
    carriers?: { shortName?: string; code?: string }[]
    slices?: { flights?: string[]; departure?: string; arrival?: string }[]
  }
}
interface MatrixResponse {
  error?: { message?: string }
  solutionList?: { minPrice?: string; solutions?: MatrixSolution[] }
}

function parsePrice(value: string | undefined): number | null {
  const match = value?.match(/^CNY\s*([\d,]+(?:\.\d+)?)$/)
  return match ? Number(match[1].replaceAll(',', '')) : null
}

export function readMatrixResult(raw: string, task: FlightTask): FlightResult {
  const start = raw.indexOf('{'), end = raw.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('没有收到有效航班数据。')
  const data: MatrixResponse = JSON.parse(raw.slice(start, end + 1))
  if (data.error) throw new Error(data.error.message ?? 'Matrix 查询失败。')
  if (!data.solutionList || !Array.isArray(data.solutionList.solutions)) throw new Error('航班响应不完整，请重新查询。')
  const solutions = data.solutionList.solutions
    .map(solution => ({ solution, price: parsePrice(solution.displayTotal) }))
    .filter((item): item is { solution: MatrixSolution; price: number } => item.price !== null)
    .sort((a, b) => a.price - b.price)
  const summaryPrice = parsePrice(data.solutionList.minPrice)
  const price = summaryPrice ?? solutions[0]?.price ?? null
  if (data.solutionList.solutions.length && price === null) throw new Error('未能读取人民币报价，请重新查询。')
  // A minimum summary can cover more results than the returned page. Only show
  // flight details when they actually match that price.
  const best = solutions.find(item => item.price === price)?.solution
  const slice = best?.itinerary?.slices?.[0]
  return {
    ...task, price,
    airline: best?.itinerary?.carriers?.map(carrier => carrier.shortName ?? carrier.code).join(' / ') ?? '',
    flights: slice?.flights?.join(' / ') ?? '',
    departure: slice?.departure ?? '', arrival: slice?.arrival ?? '',
    fetchedAt: new Date().toISOString(),
  }
}

export async function searchFlight(task: FlightTask, signal: AbortSignal): Promise<FlightResult> {
  const boundary = `batch${Date.now()}${Math.random().toString(16).slice(2)}`
  const payload = {
    summarizers: ['carrierStopMatrix', 'currencyNotice', 'solutionList', 'itineraryPriceSlider',
      'itineraryCarrierList', 'itineraryDepartureTimeRanges', 'itineraryArrivalTimeRanges',
      'durationSliderItinerary', 'itineraryOrigins', 'itineraryDestinations', 'itineraryStopCountList', 'warningsItinerary'],
    inputs: {
      filter: {}, page: { current: 1, size: 100 }, pax: { adults: 1 },
      slices: [{ origins: [task.from], destinations: [task.to], date: task.date,
        dateModifier: { minus: 0, plus: 0 }, isArrivalDate: false,
        filter: { warnings: { values: [] } }, selected: false }],
      firstDayOfWeek: 'SUNDAY', internalUser: false, sliceIndex: 0, sorts: 'default',
      cabin: 'COACH', maxLegsRelativeToMin: 1, changeOfAirport: false,
      checkAvailability: true, currency: 'CNY',
    },
    summarizerSet: 'wholeTrip', name: 'specificDatesSlice',
  }
  const body = [
    `--${boundary}`, 'Content-Type: application/http', 'Content-Transfer-Encoding: binary',
    `Content-ID: <${boundary}+gapiRequest@googleapis.com>`, '',
    `POST /v1/search?key=${PUBLIC_APP_KEY}&alt=json`,
    'x-alkali-application-key: applications/matrix',
    'x-alkali-auth-apps-namespace: alkali_v2', 'x-alkali-auth-entities-namespace: alkali_v2',
    'X-Requested-With: XMLHttpRequest', 'Content-Type: application/json', '',
    JSON.stringify(payload), `--${boundary}--`, '',
  ].join('\r\n')
  const controller = new AbortController()
  const cancel = () => controller.abort(signal.reason)
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) cancel()
  const timeout = setTimeout(() => controller.abort(new Error('查询超过 90 秒，请稍后重试。')), 90000)
  try {
    const params = new URLSearchParams({ $ct: `multipart/mixed; boundary=${boundary}` })
    const response = await fetch(`https://content-alkalimatrix-pa.googleapis.com/batch?${params}`, {
      method: 'POST', headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      body, signal: controller.signal, credentials: 'omit',
    })
    if (!response.ok) throw new Error(`查询失败（HTTP ${response.status}）。`)
    return readMatrixResult(await response.text(), task)
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason
    throw error
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', cancel)
  }
}
