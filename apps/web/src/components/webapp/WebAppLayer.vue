<script setup lang="ts">
import { computed, ref } from 'vue'
import { Globe } from 'lucide-vue-next'
import WebAppWindow from './WebAppWindow.vue'
import { useUiStore, type WebAppWindow as Win } from '@/stores/ui'
import { useAppStore } from '@/stores/app'

const ui = useUiStore()
const app = useAppStore()
const topId = computed(() => [...ui.windows].sort((a, b) => b.z - a.z).find((w) => w.state !== 'min')?.id)
const failed = ref(new Set<string>())

/** Dock 点击：最小化的还原；在最前的最小化；否则置顶 */
function onDock(w: Win) {
  if (w.state === 'min') ui.focusWindow(w.id, true)
  else if (w.id === topId.value) w.state = 'min'
  else ui.focusWindow(w.id)
}

function dockMenu(e: MouseEvent, w: Win) {
  ui.openMenu(e, [
    { label: w.state === 'min' ? '还原' : '最小化', action: () => (w.state === 'min' ? ui.focusWindow(w.id, true) : (w.state = 'min')) },
    { label: w.state === 'max' ? '退出全屏' : '全屏', action: () => ((w.state = w.state === 'max' ? 'normal' : 'max'), ui.focusWindow(w.id)) },
    { label: '在新标签页打开', action: () => window.open(w.url, '_blank', 'noopener') },
    { label: '-' },
    { label: '关闭', danger: true, action: () => ui.closeWindow(w.id) },
    { label: '关闭全部', danger: true, action: () => (ui.windows = []) },
  ])
}
</script>

<template>
  <WebAppWindow v-for="w in ui.windows" :key="w.id" :win="w" />
  <!-- Dock 栏：管理已打开的 WebApp -->
  <Transition name="pop">
    <div
      v-if="app.settings.layout.dock && ui.windows.length && !ui.editMode"
      class="glass fixed bottom-3 left-1/2 z-[800] flex -translate-x-1/2 items-end gap-2 rounded-2xl px-3 py-2 shadow-2xl"
      @contextmenu.stop.prevent
    >
      <button v-for="w in ui.windows" :key="w.id" class="group relative flex flex-col items-center" :title="w.title" @click="onDock(w)" @contextmenu.stop.prevent="dockMenu($event, w)">
        <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow transition group-hover:-translate-y-1 dark:bg-zinc-800" :class="{ 'opacity-60': w.state === 'min' }">
          <img v-if="w.iconUrl && !failed.has(w.id)" :src="w.iconUrl" alt="" class="h-7 w-7" @error="failed = new Set([...failed, w.id])" />
          <Globe v-else :size="22" class="text-zinc-400" />
        </div>
        <span class="mt-1 h-1 w-1 rounded-full" :class="w.id === topId ? 'bg-brand-500' : 'bg-zinc-400'" />
      </button>
    </div>
  </Transition>
</template>
