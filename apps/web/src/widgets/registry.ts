import { defineAsyncComponent, type Component } from 'vue'
import { NotebookPen, CloudSun, Flame, CalendarDays, Feather, Clock } from 'lucide-vue-next'
import type { ItemSize } from '@guiye/shared'

/**
 * 组件卡片注册表 —— 新增卡片只需三步：
 * 1. 在本目录新建 XxxWidget.vue（接收 props: item: WidgetItem, cols: number, rows: number）
 * 2. 在下面 WIDGETS 中添加一项
 * 3. （可选）在 shared/defaults/data.ts 的默认布局中放一个
 */
export interface WidgetDef {
  kind: string
  name: string
  description: string
  icon: Component
  sizes: ItemSize[]
  defaultSize: ItemSize
  defaultConfig: () => Record<string, unknown>
  component: Component
}

export const WIDGETS: WidgetDef[] = [
  {
    kind: 'notes',
    name: '记事本',
    description: '随手记录，支持 Markdown，本地保存并可同步',
    icon: NotebookPen,
    sizes: ['2x2', '2x4', '4x2', '4x4'],
    defaultSize: '2x2',
    defaultConfig: () => ({ noteId: '' }),
    component: defineAsyncComponent(() => import('./NotesWidget.vue')),
  },
  {
    kind: 'weather',
    name: '天气',
    description: '自动定位或指定城市，Open-Meteo 免费数据',
    icon: CloudSun,
    sizes: ['2x2', '4x2'],
    defaultSize: '2x2',
    defaultConfig: () => ({ city: '', lat: null, lon: null }),
    component: defineAsyncComponent(() => import('./WeatherWidget.vue')),
  },
  {
    kind: 'hot',
    name: '热搜榜',
    description: '微博 / 百度 / 知乎热搜，一键切换',
    icon: Flame,
    sizes: ['2x2', '2x4', '4x2', '4x4'],
    defaultSize: '2x4',
    defaultConfig: () => ({ source: 'baidu' }),
    component: defineAsyncComponent(() => import('./HotWidget.vue')),
  },
  {
    kind: 'calendar',
    name: '日历',
    description: '月历与农历',
    icon: CalendarDays,
    sizes: ['2x2', '4x4'],
    defaultSize: '2x2',
    defaultConfig: () => ({}),
    component: defineAsyncComponent(() => import('./CalendarWidget.vue')),
  },
  {
    kind: 'poetry',
    name: '每日诗词',
    description: '今日诗词 / 一言，可切换',
    icon: Feather,
    sizes: ['2x2', '4x2'],
    defaultSize: '4x2',
    defaultConfig: () => ({ type: 'jinrishici' }),
    component: defineAsyncComponent(() => import('./PoetryWidget.vue')),
  },
  {
    kind: 'clock',
    name: '时钟',
    description: '大号时钟与日期',
    icon: Clock,
    sizes: ['2x2', '4x2'],
    defaultSize: '2x2',
    defaultConfig: () => ({}),
    component: defineAsyncComponent(() => import('./ClockWidget.vue')),
  },
]

export const widgetDef = (kind: string) => WIDGETS.find((w) => w.kind === kind)
