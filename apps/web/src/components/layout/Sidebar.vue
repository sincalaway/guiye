<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { computed } from 'vue'
import { Plus, Settings, RefreshCw, CloudOff, ArrowLeftRight } from 'lucide-vue-next'
import type { Category } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'
import { categoryIcon, categoryColor } from '@/utils/categoryIcons'

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
        if (await ui.confirm(`删除「${c.name}」及其中 ${c.items.length} 个项目？其中的图标会进入回收站。`)) app.removeCategory(c.id)
      },
    },
  ])
}

function addCategory() {
  Object.assign(ui.categoryEditor, { open: true, id: null })
}
const logoUrl = `${import.meta.env.BASE_URL}logo-light.png`
const colorIcons = computed(() => app.settings.layout.colorIcons)
const signedIn = computed(() => sync.status === 'idle' || sync.status === 'syncing' || (sync.status === 'error' && !!sync.email))
const accountLabel = computed(() => (signedIn.value ? sync.nickname || '已登录' : '登录'))
const avatarText = computed(() => (sync.nickname || sync.email || '?').slice(0, 1).toUpperCase())
</script>

<template>
  <!-- 桌面：左侧通栏（贴边、全高、半透明深色毛玻璃，参照子幽） -->
  <aside v-if="variant === 'desktop'" class="gy-sidebar fixed inset-y-0 left-0 z-30 hidden w-[60px] flex-col text-white md:flex" @contextmenu.stop.prevent>
    <!-- 账户：未登录显示 logo + 登录，已登录显示头像 -->
    <button
      class="flex shrink-0 flex-col items-center gap-1 pt-7 pb-4 transition hover:bg-white/10"
      :title="signedIn ? `已登录：${sync.provider === 'qq' ? 'QQ ' + sync.nickname : sync.email}（点击管理同步）` : '登录以同步数据'"
      @click="signedIn ? ui.openSettings('account') : (ui.loginOpen = true)"
    >
      <span class="relative flex h-8 w-8 items-center justify-center">
        <img v-if="!signedIn" :src="logoUrl" alt="归页" class="h-8 w-8" draggable="false" />
        <img v-else-if="sync.avatarUrl" :src="sync.avatarUrl" alt="" class="h-8 w-8 rounded-full object-cover" referrerpolicy="no-referrer" draggable="false" />
        <span v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-zinc-700">{{ avatarText }}</span>
        <RefreshCw v-if="sync.status === 'syncing'" :size="11" class="absolute -right-1 -bottom-1 animate-spin rounded-full bg-black/50 p-px" />
        <CloudOff v-else-if="sync.status === 'error'" :size="11" class="absolute -right-1 -bottom-1 rounded-full bg-black/50 p-px text-amber-300" />
      </span>
      <span class="w-full truncate px-1 text-center text-xs leading-tight">{{ accountLabel }}</span>
    </button>

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
