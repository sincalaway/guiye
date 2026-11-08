import { fetchHotDirect, type HotEntry, type HotSource } from '@guiye/shared'
import { IS_EXTENSION } from '@/platform'
import { fetchJson } from './http'
import { cacheGet, cacheSet } from './storage'

/**
 * 热搜获取顺序：
 * 1. 设置中的「热搜 API 地址」（或构建变量 VITE_HOT_API_BASE），兼容 DailyHotApi 与自带 hot-proxy
 * 2. 扩展环境：直接请求微博/百度/知乎（host_permissions 绕过 CORS，并携带登录态 Cookie）
 * 3. Web 环境：同源 /api/hot/:source（开发服务器内置；生产环境由 hot-proxy 或 Nginx 反代提供）
 */
export async function fetchHot(source: HotSource, apiBase: string, force = false): Promise<HotEntry[]> {
  const cacheKey = `hot:${source}`
  if (!force) {
    const c = cacheGet<HotEntry[]>(cacheKey, 10 * 60 * 1000)
    if (c?.length) return c
  }
  const base = (apiBase || import.meta.env.VITE_HOT_API_BASE || '').replace(/\/+$/, '')
  let list: HotEntry[]
  if (base) {
    const r = await fetchJson<{ code?: number; data?: HotEntry[] }>(`${base}/${source}`)
    list = r.data ?? []
  } else if (IS_EXTENSION) {
    list = await fetchHotDirect(source, (input, init) => fetch(input, { ...init, credentials: 'include' }))
  } else {
    const r = await fetchJson<{ code?: number; data?: HotEntry[] }>(`/api/hot/${source}`)
    list = r.data ?? []
  }
  list = list.filter((x) => x.title).slice(0, 50)
  if (list.length) cacheSet(cacheKey, list)
  return list
}
