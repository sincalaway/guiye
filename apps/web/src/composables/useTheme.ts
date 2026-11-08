import { computed, watchEffect } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { useAppStore } from '@/stores/app'

/** 根据设置切换 html.dark */
export function useTheme() {
  const app = useAppStore()
  const prefersDark = usePreferredDark()
  const isDark = computed(() => (app.settings.theme === 'auto' ? prefersDark.value : app.settings.theme === 'dark'))
  watchEffect(() => document.documentElement.classList.toggle('dark', isDark.value))
  return { isDark }
}
