import { IS_EXTENSION } from '@/platform'
import { fetchJson, jsonp } from './http'

/**
 * 搜索建议
 * - Web：百度 JSONP（UTF-8）
 * - 扩展：fetch（manifest 中 host_permissions 允许跨域），Google 引擎用 Google 建议
 */
export async function fetchSuggestions(q: string, engineId: string): Promise<string[]> {
  const kw = q.trim()
  if (!kw) return []
  try {
    if (IS_EXTENSION) {
      if (engineId === 'google') {
        const r = await fetchJson<[string, string[]]>(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(kw)}`, { timeout: 4000 })
        return r[1].slice(0, 8)
      }
      const r = await fetchJson<{ g?: { q: string }[] }>(`https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(kw)}`, { timeout: 4000 })
      return (r.g ?? []).map((x) => x.q).slice(0, 8)
    }
    const r = await jsonp<{ s: string[] }>(`https://suggestion.baidu.com/su?ie=utf-8&wd=${encodeURIComponent(kw)}`, 'cb')
    return (r.s ?? []).slice(0, 8)
  } catch {
    return []
  }
}

const hasCJK = (s: string) => /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(s)

/**
 * 快捷翻译：中文 → 英文，其他 → 中文
 * - mymemory：免费、无需 key、支持 CORS（按 IP 每日限额）
 * - google：translate.googleapis.com 免费端点（国内网络不可用）
 */
export async function quickTranslate(text: string, provider: 'mymemory' | 'google'): Promise<string> {
  const q = text.trim().slice(0, 500)
  if (!q) return ''
  const toZh = !hasCJK(q)
  if (provider === 'google') {
    const tl = toZh ? 'zh-CN' : 'en'
    const r = await fetchJson<any[]>(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`, { timeout: 5000 })
    return (r?.[0] ?? []).map((x: any[]) => x[0]).join('')
  }
  const pair = toZh ? 'en|zh-CN' : 'zh-CN|en'
  const r = await fetchJson<{ responseData?: { translatedText?: string }; responseStatus?: number }>(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(pair)}`,
    { timeout: 6000 },
  )
  const t = r.responseData?.translatedText ?? ''
  if (/MYMEMORY WARNING/i.test(t)) throw new Error('今日免费翻译额度已用完')
  return t
}

/** 扩展环境下抓取网页标题（Web 版受跨域限制，返回空） */
export async function fetchPageTitle(url: string): Promise<string> {
  if (!IS_EXTENSION) return ''
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    const html = await res.text()
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    return m ? m[1]!.trim().replace(/\s+/g, ' ').slice(0, 60) : ''
  } catch {
    return ''
  }
}
