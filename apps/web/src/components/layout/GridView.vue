<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSwipe, useWindowSize } from '@vueuse/core'
import { Plus } from 'lucide-vue-next'
import GridTile from './GridTile.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

const app = useAppStore()
const ui = useUiStore()
const { width } = useWindowSize()
const mobile = computed(() => width.value < 640)
const layout = computed(() => app.settings.layout)

/** 图标尺寸/间距通过 CSS 变量驱动，手机端自动收紧 */
const vars = computed(() => {
  const icon = mobile.value ? Math.min(layout.value.iconSize, 54) : layout.value.iconSize
  const gap = mobile.value ? Math.min(layout.value.gap, 16) : layout.value.gap
  return {
    '--icon-size': `${icon}px`,
    '--icon-radius': `${layout.value.iconRadius}%`,
    '--grid-gap': `${gap}px`,
    '--cell-w': `${icon + (mobile.value ? 16 : 24)}px`,
    '--cell-h': `${icon + (layout.value.showTitle ? 26 : 8)}px`,
    maxWidth: `${layout.value.maxWidth}px`,
  }
})

// 手机端左右滑动切换分类
const el = ref<HTMLElement>()
useSwipe(el, {
  threshold: 60,
  onSwipeEnd(_e, dir) {
    if (!mobile.value || ui.editMode) return
    if (dir === 'left') app.switchCategory(1)
    else if (dir === 'right') app.switchCategory(-1)
  },
})
</script>

<template>
  <div ref="el" class="mx-auto w-full px-4 md:px-6" :style="vars">
    <Transition name="fade" mode="out-in">
      <VueDraggable
        :key="app.activeCategory.id"
        v-model="app.activeCategory.items"
        :animation="200"
        :delay="mobile ? 220 : 0"
        :delay-on-touch-only="true"
        ghost-class="gy-ghost"
        draggable="[data-id]"
        class="grid justify-center pb-28"
        :style="{
          gridTemplateColumns: 'repeat(auto-fill, var(--cell-w))',
          gridAutoRows: 'var(--cell-h)',
          gridAutoFlow: 'dense',
          columnGap: 'var(--grid-gap)',
          rowGap: 'calc(var(--grid-gap) * 0.7)',
        }"
      >
        <GridTile v-for="item in app.activeCategory.items" :key="item.id" :item="item" :mobile="mobile" />
        <div v-if="!ui.editMode" class="gy-no-drag flex flex-col items-center">
          <button
            class="glass-soft flex items-center justify-center text-white transition hover:bg-white/30"
            :style="{ width: 'var(--icon-size)', height: 'var(--icon-size)', borderRadius: 'var(--icon-radius)' }"
            title="添加图标或组件"
            @click="ui.libraryOpen = true"
          >
            <Plus :size="26" />
          </button>
          <span v-if="layout.showTitle" class="mt-1.5 text-xs text-white/80 text-shadow">添加</span>
        </div>
      </VueDraggable>
    </Transition>
  </div>
</template>
