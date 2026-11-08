import type { Wallpaper } from '../types'

export interface WallpaperCategory {
  id: string
  name: string
  items: Wallpaper[]
}

/** Picsum（Unsplash 授权图片的稳定镜像）按 id 生成地址 */
const picsum = (id: number, credit?: string): Wallpaper => ({
  type: 'image',
  value: `https://picsum.photos/id/${id}/1920/1080`,
  thumb: `https://picsum.photos/id/${id}/400/225`,
  credit: credit ?? 'Unsplash via Picsum',
})

const gradient = (value: string): Wallpaper => ({ type: 'gradient', value, thumb: value })
const color = (value: string): Wallpaper => ({ type: 'color', value, thumb: value })

/** 内置分类壁纸库（配置驱动，可自由增删） */
export const WALLPAPER_LIBRARY: WallpaperCategory[] = [
  { id: 'mountain', name: '山川', items: [29, 177, 256, 287, 327, 1016, 1018, 1036, 1043].map((i) => picsum(i)) },
  { id: 'water', name: '湖海', items: [10, 16, 124, 381, 384, 1015, 1050, 1051, 1056, 1019].map((i) => picsum(i)) },
  { id: 'forest', name: '森林原野', items: [11, 15, 17, 28, 110, 227, 277, 289, 1039, 1044].map((i) => picsum(i)) },
  {
    id: 'city',
    name: '城市建筑',
    items: [43, 49, 57, 164, 188, 214, 238, 274, 299, 308, 354, 376, 392, 402, 417, 436, 1047, 1067].map((i) => picsum(i)),
  },
  { id: 'animal', name: '动物', items: [200, 433, 1069, 1074].map((i) => picsum(i)) },
  { id: 'still', name: '静物', items: [76, 357, 365, 366, 429, 431, 1080].map((i) => picsum(i)) },
  {
    id: 'video',
    name: '动态',
    items: [
      {
        type: 'video',
        value: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        thumb: 'https://picsum.photos/id/1080/400/225',
        credit: 'MDN CC0 视频',
      },
    ],
  },
  {
    id: 'gradient',
    name: '渐变',
    items: [
      gradient('linear-gradient(135deg,#667eea 0%,#764ba2 100%)'),
      gradient('linear-gradient(135deg,#f6d365 0%,#fda085 100%)'),
      gradient('linear-gradient(135deg,#84fab0 0%,#8fd3f4 100%)'),
      gradient('linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)'),
      gradient('linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)'),
      gradient('linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)'),
      gradient('radial-gradient(circle at 20% 20%,#3b82f6 0%,#1e1b4b 60%,#020617 100%)'),
      gradient('linear-gradient(180deg,#fdfbfb 0%,#ebedee 100%)'),
    ],
  },
  {
    id: 'color',
    name: '纯色',
    items: ['#0f172a', '#1f2937', '#334155', '#f1f5f9', '#e7e5e4', '#14532d', '#7c2d12', '#312e81'].map(color),
  },
]

export const DEFAULT_WALLPAPER: Wallpaper = picsum(1015)

/** Bing 每日壁纸（第三方 bing.biturl.top 代理，CORS 友好，index 0~7） */
export const bingDailyUrl = (index = 0, mkt = 'zh-CN') =>
  `https://bing.biturl.top/?resolution=1920&format=image&index=${index}&mkt=${mkt}`

/** Picsum 随机图，附加时间戳避免缓存 */
export const picsumRandomUrl = () => `https://picsum.photos/1920/1080?random=${Date.now()}`

export function allLibraryWallpapers(categoryId?: string): Wallpaper[] {
  const cats = categoryId ? WALLPAPER_LIBRARY.filter((c) => c.id === categoryId) : WALLPAPER_LIBRARY
  return cats.flatMap((c) => c.items).filter((w) => w.type === 'image' || w.type === 'video')
}
