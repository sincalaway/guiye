// 归页 热搜代理 —— Node 版（Docker / 任意 VPS）
// 运行：node --experimental-strip-types node-server.mjs   （Node ≥ 22.6）
// 环境变量：PORT（默认 8787）、CACHE_SECONDS（默认 300）
import { createServer } from 'node:http'
import { fetchHotDirect, HOT_SOURCE_IDS } from '../../packages/shared/src/hot.ts'

const PORT = Number(process.env.PORT || 8787)
const TTL = Number(process.env.CACHE_SECONDS || 300) * 1000
const cache = new Map()

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  const source = (req.url || '').split('?')[0].split('/').filter(Boolean).pop()
  if (!HOT_SOURCE_IDS.includes(source)) return res.end(JSON.stringify({ code: 200, sources: HOT_SOURCE_IDS }))
  const hit = cache.get(source)
  if (hit && Date.now() - hit.t < TTL) return res.end(hit.body)
  try {
    const body = JSON.stringify({ code: 200, data: await fetchHotDirect(source) })
    cache.set(source, { t: Date.now(), body })
    res.end(body)
  } catch (e) {
    if (hit) return res.end(hit.body) // 上游失败时返回旧缓存
    res.statusCode = 502
    res.end(JSON.stringify({ code: 502, message: String(e?.message ?? e) }))
  }
}).listen(PORT, () => console.log(`[guiye-hot] listening on :${PORT}`))
