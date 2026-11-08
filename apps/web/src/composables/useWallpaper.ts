import { ref, watch } from 'vue'
import type { Wallpaper } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { pickSessionWallpaper } from '@/services/wallpaper'

const session = ref<Wallpaper | null>(null)
let initialized = false

/** 本次页面显示的壁纸（随机来源时每次打开都会不同） */
export function useWallpaper() {
  const app = useAppStore()
  if (!initialized) {
    initialized = true
    session.value = pickSessionWallpaper(app.settings.wallpaper)
    watch(
      () => [app.settings.wallpaper.current.value, app.settings.wallpaper.source, app.settings.wallpaper.randomCategory],
      () => (session.value = pickSessionWallpaper(app.settings.wallpaper)),
    )
  }
  function next() {
    const s = app.settings.wallpaper
    session.value = pickSessionWallpaper(s.source === 'fixed' ? { ...s, source: 'random-library' } : s)
    // 固定模式下「换一张」直接设为当前壁纸
    if (s.source === 'fixed' && session.value) s.current = { ...session.value }
  }
  function set(w: Wallpaper) {
    const s = app.settings.wallpaper
    s.current = { ...w }
    s.source = 'fixed'
    session.value = { ...w }
  }
  return { session, next, set }
}
