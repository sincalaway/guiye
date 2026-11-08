import type { HotEntry, HotSource } from './types'

/**
 * 热搜数据源：上游地址 + 归一化函数。
 * 被 hot-proxy（Cloudflare Worker / Node）、Vite 开发中间件、浏览器扩展共同使用。
 * 返回格式与 DailyHotApi 兼容：{ code: 200, data: HotEntry[] }
 */
export const HOT_SOURCES: Record<HotSource, { name: string; upstream: string; normalize: (json: any) => HotEntry[] }> = {
  weibo: {
    name: '微博热搜',
    upstream: 'https://weibo.com/ajax/side/hotSearch',
    normalize: (json) =>
      (json?.data?.realtime ?? [])
        .filter((x: any) => !x.is_ad)
        .map((x: any) => ({
          title: x.word ?? x.note,
          url: `https://s.weibo.com/weibo?q=${encodeURIComponent('#' + (x.word ?? x.note) + '#')}`,
          hot: x.num,
        })),
  },
  baidu: {
    name: '百度热搜',
    upstream: 'https://top.baidu.com/api/board?platform=wise&tab=realtime',
    normalize: (json) => {
      const cards = json?.data?.cards ?? []
      const list: any[] = cards.flatMap((c: any) => (c?.content ?? []).flatMap((x: any) => (Array.isArray(x?.content) ? x.content : [x])))
      return list
        .filter((x) => x?.word)
        .map((x) => ({
          title: x.word,
          url: `https://www.baidu.com/s?wd=${encodeURIComponent(x.word)}`,
          hot: x.hotScore,
        }))
    },
  },
  zhihu: {
    name: '知乎热榜',
    upstream: 'https://api.zhihu.com/topstory/hot-lists/total?limit=50',
    normalize: (json) =>
      (json?.data ?? []).map((x: any) => {
        const t = x.target ?? {}
        const id = t.id ?? ''
        return {
          title: t.title ?? t.title_area?.text ?? '',
          url: id ? `https://www.zhihu.com/question/${id}` : (t.link?.url ?? 'https://www.zhihu.com/hot'),
          hot: x.detail_text ?? t.metrics_area?.text,
        }
      }),
  },
}

export const HOT_SOURCE_IDS = Object.keys(HOT_SOURCES) as HotSource[]

/** 请求上游时附带的头（服务端/扩展环境使用） */
export const HOT_UPSTREAM_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
}

/** 服务端/扩展直接抓取上游并归一化 */
export async function fetchHotDirect(source: HotSource, fetchImpl: typeof fetch = fetch): Promise<HotEntry[]> {
  const def = HOT_SOURCES[source]
  if (!def) throw new Error(`unknown source ${source}`)
  const res = await fetchImpl(def.upstream, { headers: HOT_UPSTREAM_HEADERS })
  if (!res.ok) throw new Error(`${def.name} 上游返回 ${res.status}`)
  return def.normalize(await res.json()).filter((x) => x.title).slice(0, 50)
}
