import { fetchJson } from './http'

export interface Verse {
  content: string
  from: string
  author: string
}

/** 今日诗词（v1 免 token 接口）/ 一言 */
export async function fetchVerse(type: 'jinrishici' | 'hitokoto'): Promise<Verse> {
  if (type === 'hitokoto') {
    const r = await fetchJson<any>('https://v1.hitokoto.cn/?encode=json')
    return { content: r.hitokoto, from: r.from ?? '', author: r.from_who ?? '' }
  }
  const r = await fetchJson<any>('https://v1.jinrishici.com/all.json')
  return { content: r.content, from: r.origin ?? '', author: r.author ?? '' }
}
