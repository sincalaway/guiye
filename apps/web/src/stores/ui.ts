import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { GridItem, SiteItem } from '@guiye/shared'

export interface MenuEntry {
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean
  children?: MenuEntry[]
  action?: () => void
}

export interface WebAppWindow {
  id: string
  title: string
  url: string
  iconUrl: string
  state: 'normal' | 'min' | 'max'
  x: number
  y: number
  w: number
  h: number
  z: number
}

/** 纯界面状态（不持久化） */
export const useUiStore = defineStore('ui', () => {
  const settingsOpen = ref(false)
  const settingsTab = ref('appearance')
  const libraryOpen = ref(false)
  const libraryTab = ref<'sites' | 'widgets' | 'custom'>('sites')

  /** 编辑网站弹窗：null 关闭；item 为空表示新建 */
  const siteEditor = reactive<{ open: boolean; item: SiteItem | null; categoryId?: string }>({ open: false, item: null })
  const openFolderId = ref<string | null>(null)
  const categoryEditor = reactive<{ open: boolean; id: string | null }>({ open: false, id: null })

  // 右键菜单
  const menu = reactive<{ open: boolean; x: number; y: number; entries: MenuEntry[] }>({ open: false, x: 0, y: 0, entries: [] })
  function openMenu(e: MouseEvent | { clientX: number; clientY: number }, entries: MenuEntry[]) {
    menu.entries = entries
    menu.x = e.clientX
    menu.y = e.clientY
    menu.open = true
  }
  function closeMenu() {
    menu.open = false
  }

  // 批量编辑
  const editMode = ref(false)
  const selected = ref<Set<string>>(new Set())
  function toggleSelect(id: string) {
    const s = new Set(selected.value)
    s.has(id) ? s.delete(id) : s.add(id)
    selected.value = s
  }
  function setEditMode(v: boolean) {
    editMode.value = v
    if (!v) selected.value = new Set()
  }

  // WebApp 窗口
  const windows = ref<WebAppWindow[]>([])
  let zTop = 100
  function openWebApp(item: { title: string; url: string; iconUrl: string }) {
    const exist = windows.value.find((w) => w.url === item.url)
    if (exist) return focusWindow(exist.id, true)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const mobile = vw < 768
    const w = mobile ? vw : Math.min(1100, vw - 160)
    const h = mobile ? vh : Math.min(760, vh - 140)
    const offset = (windows.value.length % 5) * 28
    windows.value.push({
      id: `win_${Date.now()}`,
      ...item,
      state: mobile ? 'max' : 'normal',
      x: Math.max(0, (vw - w) / 2 + offset),
      y: Math.max(0, (vh - h) / 2 - 30 + offset),
      w,
      h,
      z: ++zTop,
    })
  }
  function focusWindow(id: string, restore = false) {
    const w = windows.value.find((x) => x.id === id)
    if (!w) return
    w.z = ++zTop
    if (restore && w.state === 'min') w.state = 'normal'
  }
  function closeWindow(id: string) {
    windows.value = windows.value.filter((w) => w.id !== id)
  }

  // Toast
  const toasts = ref<{ id: number; text: string; type: 'info' | 'error' | 'success' }[]>([])
  function toast(text: string, type: 'info' | 'error' | 'success' = 'info') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, text, type })
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 2600)
  }

  // 确认框
  const confirmState = reactive<{ open: boolean; title: string; message: string; resolve?: (v: boolean) => void }>({ open: false, title: '', message: '' })
  function confirm(message: string, title = '请确认'): Promise<boolean> {
    return new Promise((resolve) => Object.assign(confirmState, { open: true, title, message, resolve }))
  }

  function editSite(item: SiteItem | null, categoryId?: string) {
    Object.assign(siteEditor, { open: true, item, categoryId })
  }

  function openSettings(tab = 'appearance') {
    settingsTab.value = tab
    settingsOpen.value = true
  }

  return {
    settingsOpen,
    settingsTab,
    openSettings,
    libraryOpen,
    libraryTab,
    siteEditor,
    editSite,
    openFolderId,
    categoryEditor,
    menu,
    openMenu,
    closeMenu,
    editMode,
    selected,
    toggleSelect,
    setEditMode,
    windows,
    openWebApp,
    focusWindow,
    closeWindow,
    toasts,
    toast,
    confirmState,
    confirm,
  }
})

export type { GridItem }
