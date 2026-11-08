<script setup lang="ts">
import { computed, ref } from 'vue'
import { Minus, Maximize2, Minimize2, X, RotateCw, ExternalLink, Globe } from 'lucide-vue-next'
import { useUiStore, type WebAppWindow } from '@/stores/ui'
import { IS_EXTENSION } from '@/platform'

const props = defineProps<{ win: WebAppWindow }>()
const ui = useUiStore()
const frame = ref<HTMLIFrameElement>()
const interacting = ref(false)
const loading = ref(true)
const iconFailed = ref(false)
const frameKey = ref(0)

const style = computed(() => {
  const w = props.win
  if (w.state === 'max') return { inset: '0 0 72px 0', zIndex: w.z }
  return { left: `${w.x}px`, top: `${w.y}px`, width: `${w.w}px`, height: `${w.h}px`, zIndex: w.z }
})

/** 通用指针拖拽：移动窗口 / 调整大小 */
function drag(e: PointerEvent, mode: 'move' | 'resize') {
  if (props.win.state === 'max' && mode === 'resize') return
  if ((e.target as HTMLElement).closest('button')) return
  e.preventDefault()
  ui.focusWindow(props.win.id)
  const w = props.win
  if (w.state === 'max' && mode === 'move') {
    // 从最大化拖出时还原
    w.state = 'normal'
    w.x = Math.max(0, e.clientX - w.w / 2)
    w.y = 0
  }
  const start = { x: e.clientX, y: e.clientY, wx: w.x, wy: w.y, ww: w.w, wh: w.h }
  interacting.value = true
  const move = (ev: PointerEvent) => {
    const dx = ev.clientX - start.x
    const dy = ev.clientY - start.y
    if (mode === 'move') {
      w.x = Math.min(window.innerWidth - 120, Math.max(-w.w + 120, start.wx + dx))
      w.y = Math.min(window.innerHeight - 60, Math.max(0, start.wy + dy))
    } else {
      w.w = Math.max(360, start.ww + dx)
      w.h = Math.max(240, start.wh + dy)
    }
  }
  const up = () => {
    interacting.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

function toggleMax() {
  props.win.state = props.win.state === 'max' ? 'normal' : 'max'
}
function reload() {
  loading.value = true
  frameKey.value++
}
</script>

<template>
  <div
    v-show="win.state !== 'min'"
    class="glass fixed flex flex-col overflow-hidden shadow-2xl"
    :class="win.state === 'max' ? 'rounded-none' : 'rounded-xl'"
    :style="style"
    @pointerdown="ui.focusWindow(win.id)"
    @contextmenu.stop
  >
    <header class="flex h-10 shrink-0 cursor-default items-center gap-2 border-b border-black/5 px-3 select-none dark:border-white/5" @pointerdown="drag($event, 'move')" @dblclick="toggleMax">
      <img v-if="win.iconUrl && !iconFailed" :src="win.iconUrl" alt="" class="h-4 w-4 rounded" @error="iconFailed = true" />
      <Globe v-else :size="15" class="text-zinc-400" />
      <span class="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">{{ win.title }}</span>
      <div class="flex items-center gap-0.5 text-zinc-500">
        <button class="rounded p-1.5 hover:bg-black/5 dark:hover:bg-white/10" title="刷新" @click="reload"><RotateCw :size="14" /></button>
        <a class="rounded p-1.5 hover:bg-black/5 dark:hover:bg-white/10" title="在新标签页打开" :href="win.url" target="_blank" rel="noopener"><ExternalLink :size="14" /></a>
        <button class="rounded p-1.5 hover:bg-black/5 dark:hover:bg-white/10" title="最小化" @click="win.state = 'min'"><Minus :size="14" /></button>
        <button class="rounded p-1.5 hover:bg-black/5 dark:hover:bg-white/10" :title="win.state === 'max' ? '还原' : '全屏'" @click="toggleMax">
          <Minimize2 v-if="win.state === 'max'" :size="14" /><Maximize2 v-else :size="14" />
        </button>
        <button class="rounded p-1.5 hover:bg-red-500 hover:text-white" title="关闭" @click="ui.closeWindow(win.id)"><X :size="14" /></button>
      </div>
    </header>
    <div class="relative min-h-0 flex-1 bg-white dark:bg-zinc-900">
      <iframe
        :key="frameKey"
        ref="frame"
        :src="win.url"
        class="h-full w-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture; geolocation; microphone; camera"
        referrerpolicy="no-referrer-when-downgrade"
        @load="loading = false"
      />
      <div v-if="interacting" class="absolute inset-0" />
      <div v-if="loading" class="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-brand-500" />
      <p v-if="!IS_EXTENSION" class="pointer-events-none absolute right-2 bottom-2 rounded bg-black/50 px-2 py-1 text-[11px] text-white/90">
        空白？该站点禁止被内嵌，请点右上角在新标签页打开（扩展版可内嵌大部分网站）
      </p>
    </div>
    <div v-if="win.state === 'normal'" class="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize" @pointerdown="drag($event, 'resize')" />
  </div>
</template>
