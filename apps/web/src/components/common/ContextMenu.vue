<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { onClickOutside, onKeyStroke, useWindowSize } from '@vueuse/core'
import { ChevronRight } from 'lucide-vue-next'
import { useUiStore, type MenuEntry } from '@/stores/ui'

const ui = useUiStore()
const el = ref<HTMLElement>()
const pos = ref({ x: 0, y: 0 })
const sub = ref<number | null>(null)
const { width, height } = useWindowSize()

watch(
  () => [ui.menu.open, ui.menu.x, ui.menu.y],
  async () => {
    sub.value = null
    if (!ui.menu.open) return
    pos.value = { x: ui.menu.x, y: ui.menu.y }
    await nextTick()
    const r = el.value?.getBoundingClientRect()
    if (!r) return
    pos.value = { x: Math.min(ui.menu.x, width.value - r.width - 8), y: Math.min(ui.menu.y, height.value - r.height - 8) }
  },
)

onClickOutside(el, () => ui.closeMenu())
onKeyStroke('Escape', () => ui.closeMenu())

function run(e: MenuEntry) {
  if (e.disabled || e.children) return
  ui.closeMenu()
  e.action?.()
}
const subLeft = computed(() => pos.value.x + 380 > width.value)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="ui.menu.open"
        ref="el"
        class="glass fixed z-[1000] min-w-44 rounded-xl p-1.5 text-sm text-zinc-800 shadow-2xl dark:text-zinc-100"
        :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
        @contextmenu.prevent
      >
        <template v-for="(e, i) in ui.menu.entries" :key="i">
          <div v-if="e.label === '-'" class="my-1 h-px bg-black/5 dark:bg-white/10" />
          <div v-else class="relative" @mouseenter="sub = e.children ? i : null">
            <button
              class="flex w-full items-center justify-between gap-6 rounded-lg px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
              :class="{ 'text-red-600 dark:text-red-400': e.danger, 'opacity-40': e.disabled }"
              @click="e.children ? (sub = i) : run(e)"
            >
              <span>{{ e.label }}</span>
              <ChevronRight v-if="e.children" :size="14" class="opacity-50" />
            </button>
            <div
              v-if="e.children && sub === i"
              class="glass absolute top-0 max-h-72 min-w-36 overflow-y-auto rounded-xl p-1.5 shadow-2xl"
              :class="subLeft ? 'right-full mr-1' : 'left-full ml-1'"
            >
              <button
                v-for="(c, j) in e.children"
                :key="j"
                class="block w-full rounded-lg px-3 py-1.5 text-left whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10"
                :class="{ 'opacity-40': c.disabled }"
                @click="run(c)"
              >
                {{ c.label }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
