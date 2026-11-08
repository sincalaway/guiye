import { allLibraryWallpapers, bingDailyUrl, picsumRandomUrl, type Wallpaper, type WallpaperSettings } from '@guiye/shared'
import { putBlob } from './storage'

/** 按壁纸来源决定本次打开显示哪张（随机类来源每次打开新标签页都会换一张） */
export function pickSessionWallpaper(s: WallpaperSettings): Wallpaper {
  switch (s.source) {
    case 'random-library': {
      const pool = [...allLibraryWallpapers(s.randomCategory || undefined), ...s.custom.filter((w) => w.type === 'image')]
      return pool[Math.floor(Math.random() * pool.length)] ?? s.current
    }
    case 'bing-daily':
      return { type: 'image', value: bingDailyUrl(0), credit: 'Bing 每日一图' }
    case 'picsum-random':
      return { type: 'image', value: picsumRandomUrl(), credit: 'Picsum 随机' }
    default:
      return s.current
  }
}

const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i

export function guessWallpaperType(url: string): 'image' | 'video' {
  return VIDEO_EXT.test(url) ? 'video' : 'image'
}

/** 本地文件 → 壁纸（存入 IndexedDB） */
export async function wallpaperFromFile(file: File): Promise<Wallpaper> {
  if (!/^image\/|^video\//.test(file.type)) throw new Error('只支持图片或视频文件')
  if (file.size > 200 * 1024 * 1024) throw new Error('文件超过 200MB')
  const ref = await putBlob(file)
  return { type: file.type.startsWith('video/') ? 'video' : 'image', value: ref, credit: file.name }
}

/** 从剪贴板事件中取出图片/视频文件或链接 */
export async function wallpaperFromClipboard(e: ClipboardEvent): Promise<Wallpaper | null> {
  const files = Array.from(e.clipboardData?.files ?? [])
  const f = files.find((x) => /^image\/|^video\//.test(x.type))
  if (f) return wallpaperFromFile(f)
  const text = e.clipboardData?.getData('text')?.trim()
  if (text && /^https?:\/\//i.test(text)) return { type: guessWallpaperType(text), value: text }
  return null
}
