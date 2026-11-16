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
    layout: { iconSize: 60, iconRadius: 26, gap: 28, showTitle: true, maxWidth: 1180, sidebar: 'left', dock: true, wheelSwitch: true, colorIcons: false },
    wallpaper: { current: { ...DEFAULT_WALLPAPER }, source: 'fixed', mask: 0.15, blur: 0, custom: [] },
    sync: { enabled: false, supabaseUrl: '', supabaseAnonKey: '' },
  }
}

/** 首次打开时的默认布局（配置驱动，可修改） */
export function createDefaultCategories(): Category[] {
  const home: GridItem[] = [
    widget('clock', '2x2'),
    widget('weather', '2x2', { city: '', lat: null, lon: null }),
    widget('hot', '2x4', { source: 'baidu' }),
    widget('poetry', '4x2', { type: 'jinrishici' }),
    widget('calendar', '2x2'),
    widget('notes', '2x2', { noteId: '' }),
  ]
  const mail: GridItem[] = [
    site('Gmail', 'https://mail.google.com', { bgColor: '#ea4335' }),
    site('Outlook', 'https://outlook.live.com/mail/', { bgColor: '#0078d4' }),
    site('Proton Mail', 'https://mail.proton.me', { bgColor: '#6d4aff' }),
  ]
  const dev: GridItem[] = [
    site('GitHub', 'https://github.com', { bgColor: '#181717' }),
    site('Gitee', 'https://gitee.com', { bgColor: '#c71d23' }),
    site('GitLab', 'https://gitlab.com', { bgColor: '#fc6d26' }),
    site('Railway', 'https://railway.com', { bgColor: '#13111c' }),
    site('谷歌云', 'https://console.cloud.google.com', { bgColor: '#4285f4' }),
    site('NodeLoc', 'https://www.nodeloc.com', { bgColor: '#2563eb' }),
  ]
  const ai: GridItem[] = [
    site('Hugging Face', 'https://huggingface.co', { bgColor: '#ff9d00' }),
    site('魔搭社区', 'https://www.modelscope.cn', { bgColor: '#624aff' }),
    site('Civitai', 'https://civitai.com', { bgColor: '#1971c2' }),
  ]
  const fun: GridItem[] = [
    site('哔哩哔哩', 'https://www.bilibili.com', { bgColor: '#fb7299' }),
    site('YouTube', 'https://www.youtube.com', { bgColor: '#ff0000' }),
    site('Pixiv', 'https://www.pixiv.net', { bgColor: '#0096fa' }),
  ]
  return [
    { id: 'cat_home', name: '主页', icon: 'house', items: home },
    { id: 'cat_mail', name: '邮箱', icon: 'mail', items: mail },
    { id: 'cat_dev', name: '开发', icon: 'code', items: dev },
    { id: 'cat_ai', name: 'AI', icon: 'bot', items: ai },
    { id: 'cat_fun', name: '娱乐', icon: 'gamepad-2', items: fun },
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
