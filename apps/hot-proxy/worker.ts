/**
 * 归页 热搜代理 —— Cloudflare Worker 版
 * GET /:source  (weibo | baidu | zhihu)  →  { code: 200, data: [{ title, url, hot }] }
 * 部署：cd apps/hot-proxy && npx wrangler deploy
 */
import { fetchHotDirect, HOT_SOURCE_IDS } from '../../packages/shared/src/hot'
import type { HotSource } from '../../packages/shared/src/types'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

export default {
  async fetch(req: Request, _env: unknown, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
    const url = new URL(req.url)
    const source = url.pathname.split('/').filter(Boolean).pop() as HotSource
    if (!HOT_SOURCE_IDS.includes(source)) {
      return new Response(JSON.stringify({ code: 200, sources: HOT_SOURCE_IDS }), { headers: CORS })
    }
    // 边缘缓存 5 分钟，减少对上游的请求
    const cache = (caches as any).default as Cache
    const cacheKey = new Request(url.toString(), req)
    const hit = await cache.match(cacheKey)
    if (hit) return hit
    try {
      const data = await fetchHotDirect(source)
      const res = new Response(JSON.stringify({ code: 200, data }), { headers: { ...CORS, 'Cache-Control': 'public, max-age=300' } })
      ctx.waitUntil(cache.put(cacheKey, res.clone()))
      return res
    } catch (e: any) {
      return new Response(JSON.stringify({ code: 502, message: String(e?.message ?? e) }), { status: 502, headers: CORS })
    }
  },
}
