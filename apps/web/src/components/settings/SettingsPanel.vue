<script setup lang="ts">
import { computed } from 'vue'
import { Palette, Image, Search, LayoutGrid, Cloud, Database, Info } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'
import AppearanceSettings from './AppearanceSettings.vue'
import WallpaperSettings from './WallpaperSettings.vue'
import SearchSettings from './SearchSettings.vue'
import WidgetSettings from './WidgetSettings.vue'
import SyncSettings from './SyncSettings.vue'
import DataSettings from './DataSettings.vue'
import AboutSettings from './AboutSettings.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const TABS = [
  { id: 'appearance', label: '外观', icon: Palette, comp: AppearanceSettings },
  { id: 'wallpaper', label: '壁纸', icon: Image, comp: WallpaperSettings },
  { id: 'search', label: '搜索', icon: Search, comp: SearchSettings },
  { id: 'widgets', label: '组件', icon: LayoutGrid, comp: WidgetSettings },
  { id: 'sync', label: '同步', icon: Cloud, comp: SyncSettings },
  { id: 'data', label: '书签与备份', icon: Database, comp: DataSettings },
  { id: 'about', label: '关于', icon: Info, comp: AboutSettings },
]
const current = computed(() => TABS.find((t) => t.id === ui.settingsTab) ?? TABS[0]!)
</script>

<template>
  <Modal :open="ui.settingsOpen" width="860px" body-class="p-0" @close="ui.settingsOpen = false">
    <template #header><h2 class="text-base font-semibold">设置</h2></template>
    <div class="flex h-[72vh] flex-col sm:flex-row">
      <nav class="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-black/5 p-2 sm:w-44 sm:flex-col sm:border-r sm:border-b-0 dark:border-white/5">
        <button
          v-for="t in TABS"
          :key="t.id"
          class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm"
          :class="current.id === t.id ? 'bg-brand-500/10 font-medium text-brand-600 dark:text-brand-400' : 'text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5'"
          @click="ui.settingsTab = t.id"
        >
          <component :is="t.icon" :size="16" />{{ t.label }}
        </button>
      </nav>
      <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">
        <component :is="current.comp" />
      </div>
    </div>
  </Modal>
</template>
