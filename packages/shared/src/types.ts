/**
 * 归页 数据模型
 *
 * 整个应用状态是一棵可序列化的 JSON 树（AppData），本地存 IndexedDB，
 * 导出/导入/云同步都以它为单位。二进制文件（本地上传的壁纸）单独存放在
 * IndexedDB 的 blob 仓库中，AppData 内只保存 `idb:<key>` 引用。
 */

export const SCHEMA_VERSION = 1

/** 图标来源 */
export type IconSpec =
  | { kind: 'favicon' } // 根据链接域名自动获取
  | { kind: 'url'; value: string } // 远程图片 / data URL / idb: 引用
  | { kind: 'text'; value: string } // 文字图标（取 1~2 个字）
  | { kind: 'iconify'; value: string } // Iconify 图标名，如 "mdi:github"

/** 网格中的尺寸：列 x 行 */
export type ItemSize = '1x1' | '1x2' | '2x1' | '2x2' | '2x4' | '4x2' | '4x4'

/** 打开方式 */
export type OpenMode = 'newTab' | 'self' | 'webapp'

interface BaseItem {
  id: string
  size: ItemSize
  createdAt: number
}

/** 网站图标 / 网站卡片 */
export interface SiteItem extends BaseItem {
  type: 'site'
  title: string
  url: string
  icon: IconSpec
  /** 图标背景色（文字图标或透明图标时使用） */
  bgColor?: string
  /** 卡片尺寸下展示的描述 */
  description?: string
  openMode?: OpenMode // 缺省时使用全局设置
}

/** 已注册的组件类型；新增卡片只需在 widget 注册表里加一项 */
export type WidgetKind = 'notes' | 'weather' | 'hot' | 'calendar' | 'poetry' | 'clock' | 'todo' | 'countdown' | 'anniversary' | 'bookmarks' | (string & {})

/** 组件卡片 */
export interface WidgetItem extends BaseItem {
  type: 'widget'
  widget: WidgetKind
  /** 每个组件自己的配置，结构由组件定义 */
  config: Record<string, unknown>
}

/** 文件夹（多个网站收纳为一个格子） */
export interface FolderItem extends BaseItem {
  type: 'folder'
  title: string
  children: SiteItem[]
}

export type GridItem = SiteItem | WidgetItem | FolderItem

/** 分类（侧栏上的一页） */
export interface Category {
  id: string
  name: string
  /** lucide 图标名，见 web/src/utils/categoryIcons.ts */
  icon: string
  /** 侧栏图标底色（十六进制），缺省按图标自动取色 */
  color?: string
  items: GridItem[]
}

export interface SearchEngine {
  id: string
  name: string
  /** 带 %s 的搜索地址 */
  url: string
  icon?: string
  builtin?: boolean
}

export type WallpaperType = 'image' | 'video' | 'color' | 'gradient'

export interface Wallpaper {
  type: WallpaperType
  /** 图片/视频地址（http(s) / data: / idb:），或 CSS 颜色 / 渐变 */
  value: string
  /** 视频封面或缩略图 */
  thumb?: string
  /** 来源描述 */
  credit?: string
}

export type WallpaperSource = 'fixed' | 'random-library' | 'bing-daily' | 'picsum-random'

export interface WallpaperSettings {
  current: Wallpaper
  source: WallpaperSource
  /** 随机壁纸限定的分类，空表示全部 */
  randomCategory?: string
  /** 遮罩不透明度 0~0.8 */
  mask: number
  /** 模糊 px */
  blur: number
  /** 用户自己添加过的壁纸 */
  custom: Wallpaper[]
}

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ClockSettings {
  show: boolean
  hour12: boolean
  showSeconds: boolean
  showDate: boolean
  showWeek: boolean
  showLunar: boolean
  /** 时辰干支 */
  showGanzhi: boolean
  /** 时间日期文字颜色 */
  color: string
  /** 自定义日期格式，如 "YYYY年M月D日"；留空用默认 */
  dateFormat: string
}

export interface SearchSettings {
  engineId: string
  engines: SearchEngine[]
  openInNewTab: boolean
  suggestions: boolean
  history: boolean
  translate: boolean
  /** 翻译服务（volc/baidu：译文由 MyMemory 提供，外链打开对应翻译网站） */
  translateProvider: 'volc' | 'baidu' | 'mymemory' | 'google'
  /** 进入程序自动聚焦搜索 */
  autoFocus: boolean
  /** 显示搜索框 */
  show: boolean
  /** 输入时展示匹配的图标（快捷打开已收藏网站） */
  iconMatch: boolean
}

export interface LayoutSettings {
  iconSize: number // px，40~96
  iconRadius: number // 0~50 (%)
  gap: number // px
  showTitle: boolean
  maxWidth: number // 网格最大宽度 px
  sidebar: 'left' | 'hidden'
  dock: boolean
  /** 鼠标滚轮切换分类（页面无需滚动时） */
  wheelSwitch: boolean
  /** 侧栏分类图标使用彩色底（默认单色白线，与子幽一致） */
  colorIcons: boolean
  /** Dock 栏：关闭 / 联动（与侧栏同色、随侧栏自动隐藏） / 独立 */
  dockMode: 'off' | 'link' | 'solo'
  /** Dock 和侧栏背景色（css 颜色，支持 rgba） */
  barColor: string
  /** 侧栏自动隐藏（鼠标移到左边缘显示） */
  sidebarAutoHide: boolean
  /** 打开时保留上次查看的分类 */
  rememberCategory: boolean
  /** 分类首尾循环切换 */
  loopScroll: boolean
  /** 个人中心（账户入口）位置 */
  accountPos: 'left' | 'right'
  /** 图标名称文字颜色 */
  titleColor: string
  /** 图标统一白色背景 */
  iconBg: boolean
  /** 图标圆角 px（6~20） */
  iconRound: number
  /** 图标最大列数（4~16） */
  maxCols: number
  /** 鼠标悬停显示名称提示 */
  tooltip: boolean
}

export interface SyncSettings {
  enabled: boolean
  /** 自定义 Supabase 配置（为空则用构建时环境变量） */
  supabaseUrl: string
  supabaseAnonKey: string
  /** 显示 QQ 登录（需在 Supabase 部署 supabase/functions/qq-auth） */
  qqLogin?: boolean
}

export interface Settings {
  theme: ThemeMode
  minimal: boolean
  defaultOpenMode: OpenMode
  faviconProvider: 'iconhorse' | 'google' | 'duckduckgo' | 'browser'
  /** 热搜 API 地址（兼容 DailyHotApi 格式），空表示自动 */
  hotApiBase: string
  clock: ClockSettings
  search: SearchSettings
  layout: LayoutSettings
  wallpaper: WallpaperSettings
  sync: SyncSettings
}

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
}

/** 待办事项 */
export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: number
  /** 所属清单名，空为默认 */
  list?: string
}

/** 回收站条目：删除的图标/卡片及其原位置 */
export interface TrashEntry {
  item: GridItem
  categoryId: string
  categoryName: string
  deletedAt: number
}

export interface AppData {
  schemaVersion: number
  /** 最近一次修改时间（毫秒），用于同步冲突判断 */
  updatedAt: number
  /** 设备 id，便于区分是哪台设备写入的云端快照 */
  deviceId: string
  categories: Category[]
  activeCategoryId: string
  settings: Settings
  notes: Note[]
  todos: Todo[]
  /** 待办清单名 */
  todoLists: string[]
  /** 回收站（最近 100 条） */
  trash: TrashEntry[]
  /** 底部 Dock 固定的网站 */
  dock: SiteItem[]
  searchHistory: string[]
}

/** 热搜条目，与 DailyHotApi 返回格式兼容 */
export interface HotEntry {
  title: string
  url: string
  hot?: number | string
}

export type HotSource = 'baidu' | 'weibo' | 'bilibili' | 'zhihu' | 'douyin' | 'toutiao'
