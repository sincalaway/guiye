<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { Maximize, Minimize, Plus, Settings, LayoutGrid, Shuffle } from 'lucide-vue-next'
import WallpaperLayer from '@/components/layout/WallpaperLayer.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import ClockHeader from '@/components/layout/ClockHeader.vue'
import SearchBox from '@/components/layout/SearchBox.vue'
import GridView from '@/components/layout/GridView.vue'
import BatchBar from '@/components/layout/BatchBar.vue'
import ContextMenu from '@/components/common/ContextMenu.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SiteEditor from '@/components/dialogs/SiteEditor.vue'
import LibraryDialog from '@/components/dialogs/LibraryDialog.vue'
import FolderDialog from '@/components/dialogs/FolderDialog.vue'
import CategoryEditor from '@/components/dialogs/CategoryEditor.vue'
import TrashDialog from '@/components/dialogs/TrashDialog.vue'
import DockBar from '@/components/layout/DockBar.vue'
import LoginDialog from '@/components/dialogs/LoginDialog.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import WebAppLayer from '@/components/webapp/WebAppLayer.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'
import { useTheme } from '@/composables/useTheme'
import { useWallpaper } from '@/composables/useWallpaper'

const app = useAppStore()
const ui = useUiStore()
const sync = useSyncStore()
const { isDark } = useTheme()
const wallpaper = useWallpaper()
const minimal = computed(() => app.settings.minimal)
const showSidebar = computed(() => !minimal.value && app.settings.layout.sidebar === 'left')

onMounted(() => sync.init())

function toggleMinimal() {
  app.settings.minimal = !app.settings.minimal
  if (app.settings.minimal) ui.setEditMode(false)
}

/** 空白处右键菜单 */
function onPageMenu(e: MouseEvent) {
  ui.openMenu(e, [
    { label: '添加网站', action: () => ui.editSite(null) },
    { label: '从网站库添加', action: () => ((ui.libraryTab = 'sites'), (ui.libraryOpen = true)) },
    { label: '添加组件', action: () => ((ui.libraryTab = 'widgets'), (ui.libraryOpen = true)) },
    { label: '新建分类', action: () => Object.assign(ui.categoryEditor, { open: true, id: null }) },
    { label: '回收站', action: () => (ui.trashOpen = true) },
    { label: '-' },
    { label: '换一张壁纸', action: () => wallpaper.next() },
    { label: '壁纸设置', action: () => ui.openSettings('wallpaper') },
    { label: minimal.value ? '退出极简模式' : '极简模式', action: toggleMinimal },
    { label: ui.editMode ? '退出批量编辑' : '批量编辑', disabled: minimal.value, action: () => ui.setEditMode(!ui.editMode) },
    { label: '-' },
    { label: '设置', action: () => ui.openSettings() },
  ])
}

function onDblClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (t.closest('[data-id], input, textarea, button, a, aside, nav, [role="dialog"]')) return
  toggleMinimal()
}

// 鼠标滚轮翻页：页面本身（或鼠标下的可滚动区域）还能滚动时正常滚动，到头后再滚一下切换分类
const mainEl = ref<HTMLElement>()
let wheelAcc = 0
let wheelLast = 0
let wheelLockUntil = 0
function canScroll(el: HTMLElement, dy: number) {
  if (el.scrollHeight <= el.clientHeight + 1) return false
  if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return false
  return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0
}
function onWheel(e: WheelEvent) {
  if (minimal.value || ui.editMode || !app.settings.layout.wheelSwitch || e.ctrlKey) return
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || app.categories.length < 2) return
  for (let n = e.target as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
    if (n.closest('input, textarea, select, [role="dialog"]')) return
    if (canScroll(n, e.deltaY)) return
  }
  e.preventDefault()
  const now = Date.now()
  if (now - wheelLast > 250) wheelAcc = 0
  wheelLast = now
  if (now < wheelLockUntil) return
  wheelAcc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY
  if (Math.abs(wheelAcc) < 50) return
  if (app.switchCategory(wheelAcc > 0 ? 1 : -1, false)) mainEl.value?.scrollTo({ top: 0 })
  wheelAcc = 0
  wheelLockUntil = now + 700
}

// 全局快捷键
onKeyStroke((e) => {
  const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]')
  if (e.key === 'Escape' && ui.editMode) return ui.setEditMode(false)
  if (!e.altKey || typing) return
  if (e.code === 'KeyM') (e.preventDefault(), toggleMinimal())
  else if (e.code === 'KeyE') (e.preventDefault(), ui.setEditMode(!ui.editMode))
  else if (e.key === 'ArrowRight') (e.preventDefault(), app.switchCategory(1))
  else if (e.key === 'ArrowLeft') (e.preventDefault(), app.switchCategory(-1))
})
</script>

<template>
  <WallpaperLayer v-if="wallpaper.session.value" :wallpaper="wallpaper.session.value" :mask="app.settings.wallpaper.mask" :blur="app.settings.wallpaper.blur" :dark="isDark" />

  <div class="relative h-full w-full" @contextmenu.prevent="onPageMenu" @dblclick="onDblClick" @wheel="onWheel">
    <Sidebar v-if="showSidebar" variant="desktop" />

    <!-- 右上角操作 -->
    <div class="fixed top-3 right-3 z-30 flex gap-1 text-white" @contextmenu.stop.prevent>
      <template v-if="!minimal">
        <button class="rounded-full p-2 opacity-80 transition hover:bg-white/15 hover:opacity-100" title="换一张壁纸" @click="wallpaper.next()"><Shuffle :size="18" /></button>
        <button class="rounded-full p-2 opacity-80 transition hover:bg-white/15 hover:opacity-100" :class="{ 'bg-white/20': ui.editMode }" title="批量编辑 (Alt+E)" @click="ui.setEditMode(!ui.editMode)"><LayoutGrid :size="18" /></button>
        <button class="rounded-full p-2 opacity-80 transition hover:bg-white/15 hover:opacity-100" title="添加" @click="ui.libraryOpen = true"><Plus :size="18" /></button>
        <button class="rounded-full p-2 opacity-80 transition hover:bg-white/15 hover:opacity-100 md:hidden" title="设置" @click="ui.openSettings()"><Settings :size="18" /></button>
      </template>
      <button class="rounded-full p-2 opacity-80 transition hover:bg-white/15 hover:opacity-100" :title="minimal ? '退出极简 (Alt+M)' : '极简模式 (Alt+M)'" @click="toggleMinimal">
        <Maximize v-if="minimal" :size="18" /><Minimize v-else :size="18" />
      </button>
    </div>

    <!-- 右侧分类页码 -->
    <div v-if="showSidebar && app.categories.length > 1" class="fixed top-1/2 right-4 z-20 hidden -translate-y-1/2 flex-col gap-2.5 md:flex" @contextmenu.stop.prevent>
      <button
        v-for="c in app.categories"
        :key="c.id"
        class="h-2 w-2 rounded-full transition-all"
        :class="c.id === app.data.activeCategoryId ? 'h-5 bg-white' : 'bg-white/40 hover:bg-white/70'"
        :title="c.name"
        @click="app.setActiveCategory(c.id)"
      />
    </div>

    <main ref="mainEl" class="scrollbar-thin h-full overflow-y-auto" :class="showSidebar ? 'md:pl-[60px]' : ''">
      <div class="flex flex-col transition-all duration-500" :class="minimal ? 'min-h-full justify-center pb-[18vh]' : 'pt-[6vh] md:pt-[6.5vh]'">
        <div class="mb-6 px-4 md:mb-8"><ClockHeader /></div>
        <div class="mb-7 px-4 md:mb-12"><SearchBox /></div>
        <template v-if="!minimal">
          <div class="mb-5 md:hidden"><Sidebar variant="mobile" /></div>
          <GridView />
        </template>
      </div>
    </main>
  </div>

  <WebAppLayer />
  <DockBar v-if="!minimal" />
  <BatchBar />
  <ContextMenu />
  <SiteEditor />
  <LibraryDialog />
  <FolderDialog />
  <CategoryEditor />
  <TrashDialog />
  <LoginDialog />
  <SettingsPanel />
  <ConfirmDialog />
  <ToastHost />
</template>
