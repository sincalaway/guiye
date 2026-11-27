<script setup lang="ts">
/**
 * 底部 Dock（子幽样式）：固定的网站 + 已打开的 WebApp，竖线分隔，最右是垃圾桶（回收站）。
 * 拖动排序；右键移除；网站拖到垃圾桶即删除。
 */
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Globe } from 'lucide-vue-next'
import type { SiteItem } from '@guiye/shared'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useOpenSite } from '@/composables/useSite'

const app = useAppStore()
const ui = useUiStore()
const openSite = useOpenSite()
const failed = ref(new Set<string>())
const mode = computed(() => app.settings.layout.dockMode ?? 'link')
/** 联动：侧栏自动隐藏且未展开时，Dock 一起隐藏 */
const hideWithSidebar = computed(() => app.settings.layout.sidebarAutoHide && !ui.sidebarPeek)
const trashCount = computed(() => app.data.trash.length)
const topId = computed(() => [...ui.windows].sort((a, b) => b.z - a.z).find((w) => w.state !== 'min')?.id)

function dockMenu(e: MouseEvent, s: SiteItem) {
  ui.openMenu(e, [
    { label: '新标签页打开', action: () => openSite(s, 'newTab') },
    { label: '内嵌窗口打开', action: () => openSite(s, 'webapp') },
    { label: '-' },
    { label: '从 Dock 移除', danger: true, action: () => app.unpinDock(s.id) },
  ])
}
function winClick(w: (typeof ui.windows)[number]) {
  if (w.state === 'min') ui.focusWindow(w.id, true)
  else if (w.id === topId.value) w.state = 'min'
  else ui.focusWindow(w.id)
}
function winMenu(e: MouseEvent, w: (typeof ui.windows)[number]) {
  ui.openMenu(e, [
    { label: w.state === 'min' ? '还原' : '最小化', action: () => (w.state === 'min' ? ui.focusWindow(w.id, true) : (w.state = 'min')) },
    { label: w.state === 'max' ? '退出全屏' : '全屏', action: () => ((w.state = w.state === 'max' ? 'normal' : 'max'), ui.focusWindow(w.id)) },
    { label: '在新标签页打开', action: () => window.open(w.url, '_blank', 'noopener') },
    { label: '-' },
    { label: '关闭', danger: true, action: () => ui.closeWindow(w.id) },
  ])
}
</script>

<template>
  <Transition name="pop">
    <div
      v-if="mode !== 'off' && !ui.editMode && !(mode === 'link' && hideWithSidebar)"
      class="gy-dock fixed bottom-3 left-1/2 z-[800] flex -translate-x-1/2 items-center gap-3 rounded-[22px] px-3 py-2.5"
      :class="{ 'gy-dock-link': mode === 'link' }"
      @contextmenu.stop.prevent
    >
      <VueDraggable v-model="app.data.dock" :animation="160" class="flex items-center gap-3">
        <button v-for="s in app.data.dock" :key="s.id" class="gy-dock-item" :title="s.title" @click="openSite(s)" @contextmenu.stop.prevent="dockMenu($event, s)">
          <div class="h-[46px] w-[46px]" style="--icon-radius: 13px"><SiteIcon :item="s" :size="46" /></div>
        </button>
      </VueDraggable>
      <button v-for="w in ui.windows" :key="w.id" class="gy-dock-item relative" :title="w.title" @click="winClick(w)" @contextmenu.stop.prevent="winMenu($event, w)">
        <div class="flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-[13px] bg-white" :class="{ 'opacity-60': w.state === 'min' }">
          <img v-if="w.iconUrl && !failed.has(w.id)" :src="w.iconUrl" alt="" class="h-8 w-8" @error="failed = new Set([...failed, w.id])" />
          <Globe v-else :size="24" class="text-zinc-400" />
        </div>
        <span class="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" :class="w.id === topId ? 'bg-white' : 'bg-white/50'" />
      </button>
      <span v-if="app.data.dock.length || ui.windows.length" class="h-10 w-px bg-white/35" />
      <button class="gy-dock-item relative" :title="`垃圾桶（${trashCount}）`" @click="ui.trashOpen = true">
        <svg viewBox="0 0 48 48" class="h-[46px] w-[46px]" aria-hidden="true">
          <defs>
            <linearGradient id="gy-bin" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95" /><stop offset="1" stop-color="#dfe3ea" stop-opacity=".9" /></linearGradient>
          </defs>
          <ellipse cx="24" cy="9" rx="15" ry="4" fill="#eef1f5" stroke="#c9ced8" stroke-width="1" />
          <path d="M9 9 L12.5 41 Q13 44 16 44 L32 44 Q35 44 35.5 41 L39 9 Q24 15 9 9Z" fill="url(#gy-bin)" stroke="#c9ced8" stroke-width="1" />
          <path v-if="trashCount" d="M15 11 Q24 15 33 11 L32 15 Q24 18 16 15Z" fill="#9aa3b2" opacity=".55" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.gy-dock {
  background: rgb(0 0 0 / 0.28);
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.25), inset 0 0 0 1px rgb(255 255 255 / 0.12);
}
.gy-dock-link {
  background: var(--gy-bar, rgb(46 46 46 / 0.4));
}
.gy-dock-item { transition: transform 0.18s ease; }
.gy-dock-item:hover { transform: translateY(-4px) scale(1.06); }
</style>
