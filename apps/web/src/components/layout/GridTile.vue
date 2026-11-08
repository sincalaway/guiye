<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { parseSize, hostnameOf, type GridItem } from '@guiye/shared'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useOpenSite } from '@/composables/useSite'
import { useItemMenu } from '@/composables/useItemMenu'
import { widgetDef } from '@/widgets/registry'

const props = defineProps<{ item: GridItem; mobile: boolean; inFolder?: boolean }>()
const app = useAppStore()
const ui = useUiStore()
const open = useOpenSite()
const menu = useItemMenu()
const layout = computed(() => app.settings.layout)
const size = computed(() => parseSize(props.item.size))
const selected = computed(() => ui.selected.has(props.item.id))
const isCard = computed(() => props.item.type === 'site' && size.value.cols >= 2)
const def = computed(() => (props.item.type === 'widget' ? widgetDef(props.item.widget) : undefined))

const gridStyle = computed(() => {
  if (props.inFolder) return {}
  const { cols, rows } = size.value
  return {
    gridColumn: props.mobile && cols >= 4 ? '1 / -1' : `span ${cols}`,
    gridRow: `span ${rows}`,
  }
})

function onClick(e: MouseEvent) {
  if (ui.editMode && !props.inFolder) {
    e.preventDefault()
    return ui.toggleSelect(props.item.id)
  }
  if (props.item.type === 'site') {
    e.preventDefault()
    open(props.item, e.ctrlKey || e.metaKey ? 'newTab' : undefined)
  } else if (props.item.type === 'folder') {
    ui.openFolderId = props.item.id
  }
}

function onMiddle(e: MouseEvent) {
  if (e.button === 1 && props.item.type === 'site') {
    e.preventDefault()
    open(props.item, 'newTab')
  }
}
</script>

<template>
  <div class="group relative min-w-0" :style="gridStyle" :data-id="item.id" @contextmenu.prevent.stop="menu($event, item, inFolder)">
    <div class="h-full w-full" :class="{ 'gy-jiggle': ui.editMode && !inFolder }">
      <!-- 组件卡片 -->
      <div v-if="item.type === 'widget'" class="h-full w-full" :class="{ 'pointer-events-none': ui.editMode }" @click="ui.editMode && onClick($event)">
        <component :is="def.component" v-if="def" :item="item" :cols="mobile && size.cols >= 4 ? 4 : size.cols" :rows="size.rows" />
        <div v-else class="glass flex h-full items-center justify-center rounded-[22px] text-xs text-zinc-500">未知组件：{{ item.widget }}</div>
      </div>

      <!-- 网站卡片 (2x1 / 2x2) -->
      <a
        v-else-if="item.type === 'site' && isCard"
        :href="item.url"
        class="glass flex h-full w-full cursor-pointer overflow-hidden rounded-[22px] p-3 text-zinc-800 shadow-lg transition hover:-translate-y-0.5 dark:text-zinc-100"
        :class="size.rows >= 2 ? 'flex-col justify-between' : 'items-center gap-3'"
        draggable="false"
        @click="onClick"
        @mousedown="onMiddle"
      >
        <div class="shrink-0 overflow-hidden shadow" :style="{ width: 'calc(var(--icon-size) * 0.8)', height: 'calc(var(--icon-size) * 0.8)', borderRadius: 'var(--icon-radius)' }">
          <SiteIcon :item="item" :size="layout.iconSize * 0.8" />
        </div>
        <div class="min-w-0" :class="size.rows >= 2 ? 'mt-2' : 'flex-1'">
          <div class="truncate text-sm font-semibold">{{ item.title }}</div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400" :class="size.rows >= 2 ? 'line-clamp-3' : 'truncate'">{{ item.description || hostnameOf(item.url) }}</div>
        </div>
      </a>

      <!-- 网站图标 / 文件夹 (1x1) -->
      <a
        v-else
        :href="item.type === 'site' ? item.url : undefined"
        class="flex h-full w-full cursor-pointer flex-col items-center"
        draggable="false"
        @click="onClick"
        @mousedown="onMiddle"
      >
        <div
          class="overflow-hidden shadow-lg transition group-hover:-translate-y-0.5 group-hover:shadow-xl"
          :style="{ width: 'var(--icon-size)', height: 'var(--icon-size)', borderRadius: 'var(--icon-radius)' }"
        >
          <SiteIcon v-if="item.type === 'site'" :item="item" :size="layout.iconSize" />
          <div v-else-if="item.type === 'folder'" class="glass grid h-full w-full grid-cols-3 content-start gap-[6%] p-[12%]">
            <div v-for="c in item.children.slice(0, 9)" :key="c.id" class="aspect-square overflow-hidden rounded-[22%]">
              <SiteIcon :item="c" :size="layout.iconSize / 4" />
            </div>
          </div>
        </div>
        <span
          v-if="layout.showTitle"
          class="mt-1.5 w-full truncate px-0.5 text-center text-xs"
          :class="inFolder ? 'text-zinc-700 dark:text-zinc-200' : 'text-white text-shadow'"
        >
          {{ item.title }}
        </span>
      </a>
    </div>

    <!-- 批量选择标记 -->
    <button
      v-if="ui.editMode && !inFolder"
      class="absolute -top-1.5 -left-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow"
      :class="selected ? 'bg-brand-500 text-white' : 'bg-black/30'"
      :aria-label="selected ? '取消选择' : '选择'"
      @click.stop="ui.toggleSelect(item.id)"
    >
      <Check v-if="selected" :size="12" :stroke-width="3" />
    </button>
  </div>
</template>
