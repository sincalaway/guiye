<script setup lang="ts">
import { computed, onMounted } from 'vue'
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

  <div class="relative h-full w-full" @contextmenu.prevent="onPageMenu" @dblclick="onDblClick">
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

    <main class="scrollbar-thin h-full overflow-y-auto" :class="showSidebar ? 'md:pl-[84px]' : ''">
      <div class="flex flex-col transition-all duration-500" :class="minimal ? 'min-h-full justify-center pb-[18vh]' : 'pt-[7vh] md:pt-[9vh]'">
        <div class="mb-6 px-4 md:mb-8"><ClockHeader /></div>
        <div class="mb-6 px-4 md:mb-10"><SearchBox /></div>
        <template v-if="!minimal">
          <div class="mb-5 md:hidden"><Sidebar variant="mobile" /></div>
          <GridView />
        </template>
      </div>
    </main>
  </div>

  <WebAppLayer />
  <BatchBar />
  <ContextMenu />
  <SiteEditor />
  <LibraryDialog />
  <FolderDialog />
  <CategoryEditor />
  <SettingsPanel />
  <ConfirmDialog />
  <ToastHost />
</template>
