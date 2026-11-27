<script setup lang="ts">
/** 壁纸设置（子幽：预览 + 在线壁纸 / 恢复默认 + 背景模糊值 / 遮罩透明度） */
import { computed, ref } from 'vue'
import { DEFAULT_WALLPAPER } from '@guiye/shared'
import WallpaperThumb from './WallpaperThumb.vue'
import WallpaperDialog from './WallpaperDialog.vue'
import SetSlider from './parts/SetSlider.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useWallpaper } from '@/composables/useWallpaper'

const app = useAppStore()
const ui = useUiStore()
const wp = useWallpaper()
const s = computed(() => app.settings.wallpaper)
const online = ref(false)

function restore() {
  s.value.source = 'fixed'
  wp.set({ ...DEFAULT_WALLPAPER })
  s.value.blur = 0
  s.value.mask = 0.1
  ui.toast('已恢复默认壁纸')
}
</script>

<template>
  <section>
    <div class="flex items-end gap-4">
      <div class="w-56 shrink-0 overflow-hidden rounded-lg">
        <WallpaperThumb v-if="wp.session.value" :w="wp.session.value" />
      </div>
      <div class="flex flex-col gap-2">
        <button class="rounded bg-[#1677ff] px-4 py-1.5 text-[13px] text-white hover:brightness-110" @click="online = true">在线壁纸</button>
        <button class="rounded border border-black/15 px-4 py-1.5 text-[13px] hover:border-[#1677ff] hover:text-[#1677ff] dark:border-white/15" @click="restore">恢复默认</button>
      </div>
    </div>
    <div class="mt-3">
      <SetSlider v-model="s.blur" label="背景模糊值" :min="0" :max="20" />
      <SetSlider v-model="s.mask" label="遮罩透明度" :min="0" :max="1" :step="0.05" />
    </div>
    <WallpaperDialog :open="online" @close="online = false" />
  </section>
</template>
