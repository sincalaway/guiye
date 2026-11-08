import type { SearchEngine } from '../types'

/** 内置搜索引擎。url 中的 %s 会被替换为编码后的关键词 */
export const BUILTIN_ENGINES: SearchEngine[] = [
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=%s', icon: 'https://www.baidu.com/favicon.ico', builtin: true },
  { id: 'bing', name: '必应', url: 'https://www.bing.com/search?q=%s', icon: 'https://www.bing.com/favicon.ico', builtin: true },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s', icon: 'https://www.google.com/favicon.ico', builtin: true },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query=%s', icon: 'https://www.sogou.com/favicon.ico', builtin: true },
  { id: 'so360', name: '360', url: 'https://www.so.com/s?q=%s', icon: 'https://www.so.com/favicon.ico', builtin: true },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', icon: 'https://duckduckgo.com/favicon.ico', builtin: true },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=%s', icon: 'https://github.com/favicon.ico', builtin: true },
  { id: 'bilibili', name: '哔哩哔哩', url: 'https://search.bilibili.com/all?keyword=%s', icon: 'https://www.bilibili.com/favicon.ico', builtin: true },
]

export const DEFAULT_ENGINE_ID = 'bing'

/** 打开翻译网站（翻译开关打开时，作为「在翻译网站中打开」的目标） */
export const TRANSLATE_SITE_URL = 'https://fanyi.baidu.com/mtpe-individual/multimodal?query=%s'
