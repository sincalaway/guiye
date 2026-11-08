import { fetchJson } from './http'
import { cacheGet, cacheSet } from './storage'

/** 天气：Open-Meteo（免费、无需 key、支持 CORS） */
export interface WeatherData {
  city: string
  temp: number
  feels: number
  humidity: number
  wind: number
  code: number
  isDay: boolean
  daily: { date: string; max: number; min: number; code: number }[]
}

export interface GeoPoint {
  name: string
  lat: number
  lon: number
}

/** WMO 天气代码 → 中文与图标（Iconify meteocons） */
export function weatherInfo(code: number, isDay = true): { text: string; icon: string } {
  const d = isDay ? 'day' : 'night'
  if (code === 0) return { text: '晴', icon: `meteocons:clear-${d}-fill` }
  if (code <= 2) return { text: '多云', icon: `meteocons:partly-cloudy-${d}-fill` }
  if (code === 3) return { text: '阴', icon: 'meteocons:overcast-fill' }
  if (code <= 48) return { text: '雾', icon: 'meteocons:fog-fill' }
  if (code <= 57) return { text: '毛毛雨', icon: 'meteocons:drizzle-fill' }
  if (code <= 67) return { text: code >= 65 ? '大雨' : code >= 63 ? '中雨' : '小雨', icon: 'meteocons:rain-fill' }
  if (code <= 77) return { text: '雪', icon: 'meteocons:snow-fill' }
  if (code <= 82) return { text: '阵雨', icon: 'meteocons:partly-cloudy-day-rain-fill' }
  if (code <= 86) return { text: '阵雪', icon: 'meteocons:partly-cloudy-day-snow-fill' }
  return { text: '雷阵雨', icon: 'meteocons:thunderstorms-rain-fill' }
}

export async function geocodeCity(name: string): Promise<GeoPoint[]> {
  const r = await fetchJson<{ results?: any[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=zh&format=json`,
  )
  return (r.results ?? []).map((x) => ({
    name: [x.name, x.admin1 && x.admin1 !== x.name ? x.admin1 : '', x.country].filter(Boolean).join(' · '),
    lat: x.latitude,
    lon: x.longitude,
  }))
}

/** 浏览器定位 + 反向地理编码（BigDataCloud 免费客户端接口） */
export async function locateMe(): Promise<GeoPoint> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation ? navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 3600_000 }) : reject(new Error('不支持定位')),
  )
  const { latitude: lat, longitude: lon } = pos.coords
  let name = '当前位置'
  try {
    const r = await fetchJson<any>(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`)
    name = r.city || r.locality || r.principalSubdivision || name
  } catch {
    /* ignore */
  }
  return { name, lat, lon }
}

export const DEFAULT_POINT: GeoPoint = { name: '北京', lat: 39.9042, lon: 116.4074 }

export async function fetchWeather(p: GeoPoint, force = false): Promise<WeatherData> {
  const key = `weather:${p.lat.toFixed(2)},${p.lon.toFixed(2)}`
  if (!force) {
    const c = cacheGet<WeatherData>(key, 30 * 60 * 1000)
    if (c) return { ...c, city: p.name }
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`
  const r = await fetchJson<any>(url)
  const data: WeatherData = {
    city: p.name,
    temp: Math.round(r.current.temperature_2m),
    feels: Math.round(r.current.apparent_temperature),
    humidity: r.current.relative_humidity_2m,
    wind: Math.round(r.current.wind_speed_10m),
    code: r.current.weather_code,
    isDay: r.current.is_day === 1,
    daily: (r.daily.time as string[]).map((date, i) => ({
      date,
      max: Math.round(r.daily.temperature_2m_max[i]),
      min: Math.round(r.daily.temperature_2m_min[i]),
      code: r.daily.weather_code[i],
    })),
  }
  cacheSet(key, data)
  return data
}
