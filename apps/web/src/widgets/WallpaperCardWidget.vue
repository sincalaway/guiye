<script setup lang="ts">
/** 背景设置：显示当前壁纸，点击打开壁纸设置（子幽同款入口卡片） */
import { ImageIcon } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import WallpaperThumb from '@/components/settings/WallpaperThumb.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const app = useAppStore()
const ui = useUiStore()
</script>

<template>
  <WidgetShell dense>
    <button class="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-white text-zinc-700" @click="ui.openSettings('wallpaper')">
      <WallpaperThumb :w="app.settings.wallpaper.current" class="!absolute inset-0 !aspect-auto h-full w-full !rounded-none" />
      <span class="relative flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur"><ImageIcon :size="12" />换壁纸</span>
    </button>
  </WidgetShell>
</template>
