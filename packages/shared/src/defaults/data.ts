import type { AppData, Category, GridItem, Settings, SiteItem, WidgetItem } from '../types'
import { SCHEMA_VERSION } from '../types'
import { BUILTIN_ENGINES, DEFAULT_ENGINE_ID } from './engines'
import { DEFAULT_WALLPAPER } from './wallpapers'
import { uid } from '../utils'

export const site = (title: string, url: string, extra: Partial<SiteItem> = {}): SiteItem => ({
  id: uid('s_'),
  type: 'site',
  title,
  url,
  icon: { kind: 'favicon' },
  size: '1x1',
  createdAt: Date.now(),
  ...extra,
})

export const widget = (kind: string, size: WidgetItem['size'], config: Record<string, unknown> = {}): WidgetItem => ({
  id: uid('w_'),
  type: 'widget',
  widget: kind,
  size,
  config,
  createdAt: Date.now(),
})

export function createDefaultSettings(): Settings {
  return {
    theme: 'auto',
    minimal: false,
    defaultOpenMode: 'newTab',
    faviconProvider: 'iconhorse',
    hotApiBase: '',
    clock: { show: true, hour12: false, showSeconds: false, showDate: true, showWeek: true, showLunar: true, dateFormat: '' },
    search: {
      engineId: DEFAULT_ENGINE_ID,
      engines: BUILTIN_ENGINES.map((e) => ({ ...e })),
      openInNewTab: true,
      suggestions: true,
      history: true,
      translate: true,
      translateProvider: 'mymemory',
    },
    layout: { iconSize: 60, iconRadius: 26, gap: 28, showTitle: true, maxWidth: 1180, sidebar: 'left', dock: true },
    wallpaper: { current: { ...DEFAULT_WALLPAPER }, source: 'fixed', mask: 0.15, blur: 0, custom: [] },
    sync: { enabled: false, supabaseUrl: '', supabaseAnonKey: '' },
  }
}

/** 首次打开时的默认布局（配置驱动，可修改） */
export function createDefaultCategories(): Category[] {
  const home: GridItem[] = [
    widget('clock', '2x2'),
    widget('weather', '2x2', { city: '', lat: null, lon: null }),
    site('哔哩哔哩', 'https://www.bilibili.com', { bgColor: '#fb7299' }),
    site('知乎', 'https://www.zhihu.com', { bgColor: '#0066ff' }),
    site('GitHub', 'https://github.com', { bgColor: '#181717' }),
    site('微博', 'https://weibo.com', { bgColor: '#e6162d' }),
    site('淘宝', 'https://www.taobao.com', { bgColor: '#ff5000' }),
    site('京东', 'https://www.jd.com', { bgColor: '#e1251b' }),
    site('ChatGPT', 'https://chatgpt.com', { bgColor: '#10a37f' }),
    site('DeepSeek', 'https://chat.deepseek.com', { bgColor: '#4d6bfe' }),
    widget('hot', '2x4', { source: 'baidu' }),
    widget('poetry', '4x2', { type: 'jinrishici' }),
    widget('calendar', '2x2'),
    widget('notes', '2x2', { noteId: '' }),
  ]
  const work: GridItem[] = [
    site('MDN', 'https://developer.mozilla.org'),
    site('Vue', 'https://vuejs.org', { bgColor: '#42b883' }),
    site('掘金', 'https://juejin.cn'),
    site('Stack Overflow', 'https://stackoverflow.com'),
    site('npm', 'https://www.npmjs.com'),
    site('Figma', 'https://www.figma.com'),
    site('飞书', 'https://www.feishu.cn', { openMode: 'webapp' }),
    site('GitHub', 'https://github.com', { size: '2x1', description: '全球最大的代码托管平台' }),
  ]
  return [
    { id: 'cat_home', name: '主页', icon: 'house', items: home },
    { id: 'cat_work', name: '工作', icon: 'briefcase', items: work },
    { id: 'cat_fun', name: '娱乐', icon: 'gamepad-2', items: [site('YouTube', 'https://www.youtube.com'), site('网易云音乐', 'https://music.163.com'), site('豆瓣', 'https://www.douban.com')] },
  ]
}

export function createDefaultData(deviceId = uid('d_')): AppData {
  const categories = createDefaultCategories()
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
    deviceId,
    categories,
    activeCategoryId: categories[0]!.id,
    settings: createDefaultSettings(),
    notes: [],
    searchHistory: [],
  }
}
