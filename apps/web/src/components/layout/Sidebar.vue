<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { computed } from 'vue'
import { Plus, Settings, ArrowLeftRight } from 'lucide-vue-next'
import AccountButton from './AccountButton.vue'
import type { Category } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { categoryIcon, categoryColor } from '@/utils/categoryIcons'

defineProps<{ variant: 'desktop' | 'mobile' }>()
const app = useAppStore()
const ui = useUiStore()

function onCategoryMenu(e: MouseEvent, c: Category) {
  ui.openMenu(e, [
    { label: '编辑分类', action: () => Object.assign(ui.categoryEditor, { open: true, id: c.id }) },
    { label: '在此分类添加图标', action: () => (app.setActiveCategory(c.id), (ui.libraryOpen = true)) },
    { label: '-' },
    {
      label: '删除分类',
      danger: true,
      disabled: app.categories.length <= 1,
      action: async () => {
        if (await ui.confirm(`删除「${c.name}」及其中 ${c.items.length} 个项目？其中的图标会进入回收站。`)) app.removeCategory(c.id)
      },
    },
  ])
}

function addCategory() {
  Object.assign(ui.categoryEditor, { open: true, id: null })
}
const layout = computed(() => app.settings.layout)
const colorIcons = computed(() => layout.value.colorIcons)
</script>

<template>
  <!-- 桌面：左侧通栏（贴边、全高、半透明深色毛玻璃，参照子幽） -->
  <!-- 自动隐藏：鼠标移到左边缘时滑出 -->
  <div v-if="variant === 'desktop' && layout.sidebarAutoHide" class="fixed inset-y-0 left-0 z-30 hidden w-2 md:block" @mouseenter="ui.sidebarPeek = true" />
  <aside
    v-if="variant === 'desktop'"
    class="gy-sidebar fixed inset-y-0 left-0 z-30 hidden w-[60px] flex-col text-white transition-transform duration-300 md:flex"
    :class="layout.sidebarAutoHide && !ui.sidebarPeek ? '-translate-x-full' : ''"
    @mouseleave="layout.sidebarAutoHide && (ui.sidebarPeek = false)"
    @contextmenu.stop.prevent
  >
    <!-- 账户（个人中心位置 = 左侧时） -->
    <AccountButton v-if="layout.accountPos !== 'right'" variant="sidebar" />
    <div v-else class="h-6 shrink-0" />

    <VueDraggable v-model="app.data.categories" :animation="180" class="no-scrollbar flex w-full min-h-0 flex-col overflow-y-auto" ghost-class="gy-ghost">
      <button
        v-for="c in app.categories"
        :key="c.id"
        class="flex h-[60px] w-full shrink-0 flex-col items-center justify-center gap-1 text-[13px] leading-none transition"
        :class="c.id === app.data.activeCategoryId ? 'bg-white/20' : 'hover:bg-white/10'"
        :title="c.name"
        @click="app.setActiveCategory(c.id)"
        @contextmenu.stop.prevent="onCategoryMenu($event, c)"
      >
        <span
          v-if="colorIcons"
          class="flex h-[26px] w-[26px] items-center justify-center rounded-lg"
          :style="{ background: categoryColor(c) }"
        >
          <component :is="categoryIcon(c.icon)" :size="16" />
        </span>
        <component :is="categoryIcon(c.icon)" v-else :size="21" :stroke-width="1.6" />
        <span class="w-full truncate px-1 text-center">{{ c.name }}</span>
      </button>
    </VueDraggable>
    <button class="flex h-12 w-full shrink-0 items-center justify-center transition hover:bg-white/10" title="新建分类" @click="addCategory"><Plus :size="21" :stroke-width="1.6" /></button>

    <button class="mt-auto flex h-12 w-full shrink-0 items-center justify-center transition hover:bg-white/10" title="局域网传输" @click="ui.openWebApp({ title: '局域网传输', url: 'https://pairdrop.net', iconUrl: '' })"><ArrowLeftRight :size="19" :stroke-width="1.6" /></button>
    <button class="flex h-14 w-full shrink-0 items-center justify-center transition hover:bg-white/10" title="设置" @click="ui.openSettings()"><Settings :size="20" :stroke-width="1.6" /></button>
  </aside>

  <!-- 移动端：顶部横向分类条 -->
  <nav v-else class="no-scrollbar flex gap-1.5 overflow-x-auto px-4 text-white md:hidden" @contextmenu.stop.prevent>
    <button
      v-for="c in app.categories"
      :key="c.id"
      class="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
      :class="c.id === app.data.activeCategoryId ? 'bg-white/30' : 'glass-soft'"
      @click="app.setActiveCategory(c.id)"
      @contextmenu.stop.prevent="onCategoryMenu($event, c)"
    >
      <span v-if="colorIcons" class="flex h-5 w-5 items-center justify-center rounded-md text-white" :style="{ background: categoryColor(c) }"><component :is="categoryIcon(c.icon)" :size="13" /></span><component :is="categoryIcon(c.icon)" v-else :size="15" />{{ c.name }}
    </button>
    <button class="glass-soft shrink-0 rounded-full px-2.5" title="新建分类" @click="addCategory"><Plus :size="16" /></button>
  </nav>
</template>
