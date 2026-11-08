import type { IconSpec, ItemSize } from './types'

/** 生成短 id */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now().toString(36)}${rand}`
}

/** 补全协议、去除首尾空白；无法识别时原样返回 */
export function normalizeUrl(input: string): string {
  const s = input.trim()
  if (!s) return s
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s // 已有协议（http, chrome, javascript...）
  if (s.startsWith('//')) return `https:${s}`
  return `https://${s}`
}

export function isProbablyUrl(input: string): boolean {
  const s = input.trim()
  if (!s || /\s/.test(s)) return false
  if (/^https?:\/\//i.test(s)) return true
  return /^(localhost(:\d+)?|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/i.test(s)
}

export function hostnameOf(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname
  } catch {
    return ''
  }
}

export type FaviconProvider = 'iconhorse' | 'google' | 'duckduckgo' | 'browser'

/**
 * 根据网址生成图标地址。
 * browser：仅在扩展环境可用（chrome `_favicon` API），由调用方传入 extensionBase。
 */
export function faviconUrl(url: string, provider: FaviconProvider = 'iconhorse', extensionBase?: string): string {
  const host = hostnameOf(url)
  if (!host) return ''
  switch (provider) {
    case 'google':
      return `https://www.google.com/s2/favicons?domain=${host}&sz=128`
    case 'duckduckgo':
      return `https://icons.duckduckgo.com/ip3/${host}.ico`
    case 'browser':
      if (extensionBase) return `${extensionBase}/_favicon/?pageUrl=${encodeURIComponent(normalizeUrl(url))}&size=64`
      return `https://icon.horse/icon/${host}`
    case 'iconhorse':
    default:
      return `https://icon.horse/icon/${host}`
  }
}

/** 文字图标显示的字 */
export function textIconOf(title: string): string {
  const t = title.trim()
  if (!t) return '?'
  // 中文取首字，英文取首字母大写（最多 2 个）
  if (/^[\u4e00-\u9fa5]/.test(t)) return t[0]!
  const words = t.split(/[\s._-]+/).filter(Boolean)
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase()
  return t.slice(0, 1).toUpperCase()
}

/** 由字符串稳定地生成一个好看的颜色 */
export function colorFromString(s: string): string {
  const palette = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#4f46e5', '#475569']
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return palette[h % palette.length]!
}

export function parseSize(size: ItemSize): { cols: number; rows: number } {
  const [c, r] = size.split('x').map(Number)
  return { cols: c || 1, rows: r || 1 }
}

export const defaultIcon = (): IconSpec => ({ kind: 'favicon' })

/** 构造搜索地址 */
export function buildSearchUrl(template: string, keyword: string): string {
  const q = encodeURIComponent(keyword)
  return template.includes('%s') ? template.replaceAll('%s', q) : template + q
}

/** 简单日期格式化：YYYY MM M DD D HH H mm ss */
export function formatDate(d: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    M: String(d.getMonth() + 1),
    DD: pad(d.getDate()),
    D: String(d.getDate()),
    HH: pad(d.getHours()),
    H: String(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  }
  return fmt.replace(/YYYY|MM|M|DD|D|HH|H|mm|ss/g, (k) => map[k] ?? k)
}

/** 农历（基于 Intl 中国历法，无需额外依赖） */
export function lunarOf(d: Date): { month: string; day: string; year: string } | null {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' }).formatToParts(d)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    const dayNum = Number(get('day'))
    return { year: get('yearName') || get('relatedYear'), month: get('month'), day: Number.isFinite(dayNum) && dayNum > 0 ? lunarDayName(dayNum) : get('day') }
  } catch {
    return null
  }
}

const LUNAR_DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
export function lunarDayName(n: number): string {
  return LUNAR_DAYS[n - 1] ?? String(n)
}
