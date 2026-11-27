<script setup lang="ts">
/**
 * 设置面板（子幽样式）：贴近左下角的白色面板，左侧浅灰栏 = 账号 + 6 个分组
 * 手机端为底部全宽面板，分组标签换行显示。
 */
import { computed } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { X, SlidersHorizontal, Palette, Image, Clock3, History, Info, UserRound } from 'lucide-vue-next'
import SyncSettings from './SyncSettings.vue'
import GeneralSettings from './GeneralSettings.vue'
import AppearanceSettings from './AppearanceSettings.vue'
import WallpaperSettings from './WallpaperSettings.vue'
import TimeSettings from './TimeSettings.vue'
import HistorySettings from './HistorySettings.vue'
import AboutSettings from './AboutSettings.vue'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'

const ui = useUiStore()
const sync = useSyncStore()
const TABS = [
  { id: 'general', label: '常规设置', icon: SlidersHorizontal, comp: GeneralSettings },
  { id: 'appearance', label: '主题标签', icon: Palette, comp: AppearanceSettings },
  { id: 'wallpaper', label: '壁纸设置', icon: Image, comp: WallpaperSettings },
  { id: 'time', label: '时间日期', icon: Clock3, comp: TimeSettings },
  { id: 'history', label: '数据变动记录', icon: History, comp: HistorySettings },
  { id: 'about', label: '关于我们', icon: Info, comp: AboutSettings },
]
/** 旧的分组 id 映射到新分组 */
const ALIAS: Record<string, string> = { sync: 'account', data: 'general', widgets: 'general', search: 'general' }
const tabId = computed(() => ALIAS[ui.settingsTab] ?? ui.settingsTab)
const current = computed(() => (tabId.value === 'account' ? { id: 'account', label: '账号', comp: SyncSettings } : (TABS.find((t) => t.id === tabId.value) ?? TABS[0]!)))
const accountLabel = computed(() => (sync.email ? sync.nickname || sync.email : '账号未登录'))
onKeyStroke('Escape', () => ui.settingsOpen && (ui.settingsOpen = false))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.settingsOpen" class="fixed inset-0 z-[900]" @mousedown.self="ui.settingsOpen = false" @contextmenu.stop.prevent>
        <Transition name="pop" appear>
          <div
            class="gy-settings absolute inset-x-0 bottom-0 flex h-[86vh] flex-col overflow-hidden rounded-t-2xl bg-white text-zinc-800 shadow-[0_12px_48px_rgb(0_0_0/0.28)] sm:inset-x-auto sm:bottom-4 sm:left-[72px] sm:h-[min(620px,calc(100vh-32px))] sm:w-[min(760px,calc(100vw-90px))] sm:flex-row sm:rounded-xl dark:bg-zinc-900 dark:text-zinc-100"
            role="dialog"
            aria-label="设置"
          >
            <!-- 左栏 -->
            <nav class="flex shrink-0 flex-wrap gap-1 bg-[#f7f8fa] p-2 sm:w-[168px] sm:flex-col sm:flex-nowrap sm:gap-0.5 sm:px-2.5 sm:py-3 dark:bg-zinc-800/60">
              <button
                class="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[13px] sm:mb-2 sm:py-2.5"
                :class="tabId === 'account' ? 'bg-white shadow-sm dark:bg-zinc-700' : 'hover:bg-black/5 dark:hover:bg-white/5'"
                @click="ui.settingsTab = 'account'"
              >
                <img v-if="sync.avatarUrl" :src="sync.avatarUrl" alt="" class="h-7 w-7 rounded-full" referrerpolicy="no-referrer" />
                <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-600"><UserRound :size="16" /></span>
                <span class="min-w-0 truncate">{{ accountLabel }}</span>
              </button>
              <button
                v-for="t in TABS"
                :key="t.id"
                class="flex shrink-0 items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[13px] sm:py-0 sm:leading-[42px]"
                :class="tabId === t.id ? 'bg-white font-medium text-[#1677ff] shadow-sm dark:bg-zinc-700 dark:text-sky-300' : 'text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5'"
                @click="ui.settingsTab = t.id"
              >
                <component :is="t.icon" :size="16" />{{ t.label }}
              </button>
            </nav>
            <!-- 内容 -->
            <div class="flex min-h-0 flex-1 flex-col">
              <header class="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
                <h2 class="text-[15px] font-semibold">{{ current.label }}</h2>
                <button class="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-600 dark:hover:bg-white/10" aria-label="关闭" @click="ui.settingsOpen = false"><X :size="17" /></button>
              </header>
              <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                <component :is="current.comp" />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
