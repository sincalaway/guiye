<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { Plus, Settings, Cloud, CloudOff, RefreshCw, User } from 'lucide-vue-next'
import type { Category } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'
import { categoryIcon } from '@/utils/categoryIcons'

defineProps<{ variant: 'desktop' | 'mobile' }>()
const app = useAppStore()
const ui = useUiStore()
const sync = useSyncStore()

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
        if (await ui.confirm(`删除「${c.name}」及其中 ${c.items.length} 个项目？此操作不可撤销。`)) app.removeCategory(c.id)
      },
    },
  ])
}

function addCategory() {
  Object.assign(ui.categoryEditor, { open: true, id: null })
}
</script>

<template>
  <!-- 桌面：左侧竖栏 -->
  <aside v-if="variant === 'desktop'" class="glass-soft fixed top-1/2 left-3 z-30 hidden max-h-[86vh] w-[68px] -translate-y-1/2 flex-col items-center rounded-2xl py-3 text-white md:flex" @contextmenu.stop.prevent>
    <button
      class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
      :title="sync.status === 'idle' || sync.status === 'syncing' ? `已登录：${sync.email}` : '登录以同步'"
      @click="ui.openSettings('sync')"
    >
      <RefreshCw v-if="sync.status === 'syncing'" :size="18" class="animate-spin" />
      <Cloud v-else-if="sync.status === 'idle'" :size="18" />
      <CloudOff v-else-if="sync.status === 'error'" :size="18" class="text-amber-300" />
      <User v-else :size="18" />
    </button>
    <VueDraggable v-model="app.data.categories" :animation="180" class="no-scrollbar flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5" ghost-class="gy-ghost">
      <button
        v-for="c in app.categories"
        :key="c.id"
        class="flex w-full flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition"
        :class="c.id === app.data.activeCategoryId ? 'bg-white/25' : 'opacity-80 hover:bg-white/10 hover:opacity-100'"
        :title="c.name"
        @click="app.setActiveCategory(c.id)"
        @contextmenu.stop.prevent="onCategoryMenu($event, c)"
      >
        <component :is="categoryIcon(c.icon)" :size="20" />
        <span class="w-full truncate px-1 text-center">{{ c.name }}</span>
      </button>
    </VueDraggable>
    <button class="mt-1 rounded-xl p-2 opacity-80 hover:bg-white/10 hover:opacity-100" title="新建分类" @click="addCategory"><Plus :size="20" /></button>
    <button class="rounded-xl p-2 opacity-80 hover:bg-white/10 hover:opacity-100" title="设置" @click="ui.openSettings()"><Settings :size="20" /></button>
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
      <component :is="categoryIcon(c.icon)" :size="15" />{{ c.name }}
    </button>
    <button class="glass-soft shrink-0 rounded-full px-2.5" title="新建分类" @click="addCategory"><Plus :size="16" /></button>
  </nav>
</template>
