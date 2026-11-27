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
    clock: { show: true, hour12: false, showSeconds: true, showDate: true, showWeek: true, showLunar: true, showGanzhi: true, color: '#ffffff', dateFormat: '' },
    search: {
      engineId: DEFAULT_ENGINE_ID,
      engines: BUILTIN_ENGINES.map((e) => ({ ...e })),
      openInNewTab: true,
      suggestions: true,
      history: true,
      translate: false,
      translateProvider: 'volc',
      autoFocus: false,
      show: true,
      iconMatch: true,
    },
    layout: {
      iconSize: 60,
      iconRadius: 26,
      gap: 33,
      showTitle: true,
      maxWidth: 1180,
      sidebar: 'left',
      dock: true,
      wheelSwitch: true,
      colorIcons: false,
      dockMode: 'link',
      barColor: 'rgba(46, 46, 46, 0.4)',
      sidebarAutoHide: false,
      rememberCategory: false,
      loopScroll: true,
      accountPos: 'left',
      titleColor: '#ffffff',
      iconBg: false,
      iconRound: 12,
      maxCols: 14,
      tooltip: false,
    },
    wallpaper: { current: { ...DEFAULT_WALLPAPER }, source: 'fixed', mask: 0.1, blur: 0, custom: [] },
    sync: { enabled: false, supabaseUrl: '', supabaseAnonKey: '' },
  }
}

/** 首次打开时的默认布局（配置驱动，可修改） */
export function createDefaultCategories(): Category[] {
  const home: GridItem[] = [
    // 与子幽首页一致：热搜、天气、书签管理、记事本 / 待办、日历、背景设置
    widget('hot', '4x2', { source: 'baidu' }),
    widget('weather', '4x2', { city: '', lat: null, lon: null }),
    widget('bookmarks', '1x2'),
    widget('notes', '2x2', { noteId: '' }),
    widget('todo', '2x2'),
    widget('calendar', '2x2'),
    widget('wallpaper', '1x2'),
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
  ]
  const ai: GridItem[] = [
    site('Hugging Face', 'https://huggingface.co', { bgColor: '#ff9d00' }),
    site('魔搭社区', 'https://www.modelscope.cn', { bgColor: '#624aff' }),
    site('Civitai', 'https://civitai.com', { bgColor: '#1971c2' }),
    site('ChatGPT', 'https://chatgpt.com', { bgColor: '#10a37f' }),
    site('Gemini', 'https://gemini.google.com', { bgColor: '#4e7cf6' }),
    site('Grok', 'https://grok.com', { bgColor: '#111111' }),
    site('Hark', 'https://hark.com', { bgColor: '#18181b' }),
  ]
  const social: GridItem[] = [
    site('X', 'https://x.com', { bgColor: '#000000' }),
    site('Reddit', 'https://www.reddit.com', { bgColor: '#ff4500' }),
    site('Discord', 'https://discord.com/app', { bgColor: '#5865f2' }),
    site('NodeLoc', 'https://www.nodeloc.com', { bgColor: '#2563eb' }),
  ]
  // 书籍：2x1 卡片，描述写优缺点
  const books: GridItem[] = [
    site('Z-Library', 'https://zh.z-library.sk', { size: '2x1', bgColor: '#2d6cdf', description: '优：源最多、更新快、搜索强；缺：易封、需镜像' }),
    site('WeLib', 'https://zh.welib.org', { size: '2x1', bgColor: '#0ea5e9', description: '优：界面好、资源全、体验佳；缺：镜像稳定性一般' }),
    site("Anna's Archive", 'https://annas-archive.gl', { size: '2x1', bgColor: '#7c3aed', description: '优：索引最全、永久保存；缺：需跳转下载、界面简陋' }),
    site('苦瓜书盘', 'https://kgbook.com', { size: '2x1', bgColor: '#16a34a', description: '优：电纸书优化好、无广告；缺：藏书量较小' }),
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
    { id: 'cat_social', name: '社区', icon: 'users', items: social },
    { id: 'cat_books', name: '书籍', icon: 'book', items: books },
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
    todos: [],
    todoLists: [],
    trash: [],
    dock: [
      site('Gmail', 'https://mail.google.com', { bgColor: '#ea4335' }),
      site('GitHub', 'https://github.com', { bgColor: '#181717' }),
      site('ChatGPT', 'https://chatgpt.com', { bgColor: '#10a37f' }),
    ],
    searchHistory: [],
  }
}
