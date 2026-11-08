import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import {
  createDefaultData,
  migrateData,
  site,
  uid,
  type AppData,
  type Category,
  type FolderItem,
  type GridItem,
  type Note,
  type ParsedFolder,
  type SiteItem,
} from '@guiye/shared'
import { broadcastChange, getDeviceId, loadData, onBroadcastChange, saveData } from '@/services/storage'

/** 应用主状态：唯一的数据源，所有修改都经过这里，自动持久化 */
export const useAppStore = defineStore('app', () => {
  const data = ref<AppData>(createDefaultData())
  const ready = ref(false)
  /** 本次修改来自远端（同步/其他标签页）时不刷新 updatedAt，避免回写 */
  let applyingExternal = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  const changeListeners = new Set<(d: AppData) => void>()

  const settings = computed(() => data.value.settings)
  const categories = computed(() => data.value.categories)
  const activeCategory = computed<Category>(
    () => data.value.categories.find((c) => c.id === data.value.activeCategoryId) ?? data.value.categories[0]!,
  )

  async function init() {
    const deviceId = getDeviceId()
    const raw = await loadData()
    if (raw) {
      try {
        data.value = migrateData(raw, deviceId)
      } catch (e) {
        console.error('[guiye] 本地数据损坏，已使用默认数据', e)
        data.value = createDefaultData(deviceId)
      }
    } else {
      data.value = createDefaultData(deviceId)
      await saveData(data.value)
    }

    watch(
      () => [data.value.categories, data.value.settings, data.value.notes, data.value.searchHistory, data.value.activeCategoryId],
      () => {
        if (!applyingExternal) data.value.updatedAt = Date.now()
        const external = applyingExternal
        clearTimeout(saveTimer)
        saveTimer = setTimeout(async () => {
          await saveData(toRaw(data.value))
          if (!external) {
            broadcastChange(data.value.updatedAt)
            changeListeners.forEach((fn) => fn(data.value))
          }
        }, 300)
      },
      { deep: true },
    )

    // 同一浏览器中其他标签页修改了数据 → 重新载入
    onBroadcastChange(async (updatedAt) => {
      if (updatedAt <= data.value.updatedAt) return
      const fresh = await loadData()
      if (fresh) replaceData(migrateData(fresh, data.value.deviceId), true)
    })
    ready.value = true
  }

  /** 整体替换数据（导入备份 / 云端拉取） */
  function replaceData(next: AppData, external = false) {
    applyingExternal = external
    // 同步配置、设备 id 永远保留本机的
    const keepSync = data.value.settings.sync
    data.value = { ...next, deviceId: data.value.deviceId, settings: { ...next.settings, sync: keepSync } }
    // 等 watcher 执行完后复位
    setTimeout(() => (applyingExternal = false), 0)
  }

  /** 订阅本地修改（供云同步使用） */
  function onLocalChange(fn: (d: AppData) => void) {
    changeListeners.add(fn)
    return () => changeListeners.delete(fn)
  }

  // ---------- 分类 ----------
  function setActiveCategory(id: string) {
    data.value.activeCategoryId = id
  }
  function addCategory(name: string, icon = 'folder'): Category {
    const c: Category = { id: uid('c_'), name, icon, items: [] }
    data.value.categories.push(c)
    return c
  }
  function updateCategory(id: string, patch: Partial<Omit<Category, 'id' | 'items'>>) {
    const c = data.value.categories.find((x) => x.id === id)
    if (c) Object.assign(c, patch)
  }
  function removeCategory(id: string) {
    if (data.value.categories.length <= 1) return false
    const idx = data.value.categories.findIndex((c) => c.id === id)
    if (idx < 0) return false
    data.value.categories.splice(idx, 1)
    if (data.value.activeCategoryId === id) data.value.activeCategoryId = data.value.categories[Math.max(0, idx - 1)]!.id
    return true
  }
  function switchCategory(delta: 1 | -1) {
    const list = data.value.categories
    const i = list.findIndex((c) => c.id === data.value.activeCategoryId)
    const next = list[(i + delta + list.length) % list.length]
    if (next) data.value.activeCategoryId = next.id
  }

  // ---------- 网格项 ----------
  interface Located {
    category: Category
    list: GridItem[]
    index: number
    item: GridItem
    folder?: FolderItem
  }
  function locate(id: string): Located | null {
    for (const category of data.value.categories) {
      const index = category.items.findIndex((i) => i.id === id)
      if (index >= 0) return { category, list: category.items, index, item: category.items[index]! }
      for (const it of category.items) {
        if (it.type === 'folder') {
          const ci = it.children.findIndex((c) => c.id === id)
          if (ci >= 0) return { category, list: it.children, index: ci, item: it.children[ci]!, folder: it }
        }
      }
    }
    return null
  }

  function addItem(item: GridItem, categoryId = data.value.activeCategoryId, index?: number) {
    const c = data.value.categories.find((x) => x.id === categoryId) ?? activeCategory.value
    if (index === undefined) c.items.push(item)
    else c.items.splice(index, 0, item)
    return item
  }

  function updateItem(id: string, patch: Partial<GridItem>) {
    const loc = locate(id)
    if (loc) Object.assign(loc.item, patch)
  }

  function removeItems(ids: string[]) {
    for (const id of ids) {
      const loc = locate(id)
      if (loc) loc.list.splice(loc.index, 1)
    }
  }

  function moveItems(ids: string[], toCategoryId: string) {
    const target = data.value.categories.find((c) => c.id === toCategoryId)
    if (!target) return
    for (const id of ids) {
      const loc = locate(id)
      if (!loc || loc.category.id === toCategoryId && !loc.folder) continue
      const [it] = loc.list.splice(loc.index, 1)
      if (it) target.items.push(it)
    }
  }

  /** 把若干网站合并成文件夹 */
  function createFolder(ids: string[], title = '新建文件夹'): FolderItem | null {
    const sites: SiteItem[] = []
    let insertAt = -1
    let cat: Category | null = null
    for (const id of ids) {
      const loc = locate(id)
      if (!loc || loc.item.type !== 'site' || loc.folder) continue
      if (!cat) {
        cat = loc.category
        insertAt = loc.index
      }
      sites.push(loc.item)
    }
    if (!cat || !sites.length) return null
    removeItems(sites.map((s) => s.id))
    const folder: FolderItem = { id: uid('f_'), type: 'folder', title, size: '1x1', createdAt: Date.now(), children: sites }
    cat.items.splice(Math.min(insertAt, cat.items.length), 0, folder)
    return folder
  }

  function moveOutOfFolder(childId: string) {
    const loc = locate(childId)
    if (!loc?.folder) return
    const [child] = loc.list.splice(loc.index, 1)
    const folderIdx = loc.category.items.indexOf(loc.folder)
    loc.category.items.splice(folderIdx + 1, 0, child!)
    if (loc.folder.children.length === 0) loc.category.items.splice(folderIdx, 1)
  }

  // ---------- 书签导入 ----------
  function importBookmarkGroups(groups: ParsedFolder[], mode: 'per-folder' | 'current') {
    let count = 0
    const toSite = (b: ParsedFolder['bookmarks'][number]) =>
      site(b.title.slice(0, 40), b.url, b.icon?.startsWith('data:image') ? { icon: { kind: 'url', value: b.icon } } : {})
    if (mode === 'current') {
      for (const g of groups) for (const b of g.bookmarks) (addItem(toSite(b)), count++)
    } else {
      for (const g of groups) {
        const c = addCategory(g.path.length ? g.path[g.path.length - 1]! : g.name, 'bookmark')
        for (const b of g.bookmarks) (c.items.push(toSite(b)), count++)
      }
    }
    return count
  }

  // ---------- 记事本 ----------
  function upsertNote(note: Partial<Note> & { id?: string }): Note {
    let n = note.id ? data.value.notes.find((x) => x.id === note.id) : undefined
    if (!n) {
      n = { id: note.id ?? uid('n_'), title: note.title ?? '', content: note.content ?? '', updatedAt: Date.now() }
      data.value.notes.push(n)
    } else {
      Object.assign(n, note, { updatedAt: Date.now() })
    }
    return n
  }

  // ---------- 搜索历史 ----------
  function pushHistory(q: string) {
    if (!data.value.settings.search.history) return
    const list = data.value.searchHistory.filter((x) => x !== q)
    list.unshift(q)
    data.value.searchHistory = list.slice(0, 20)
  }
  function clearHistory() {
    data.value.searchHistory = []
  }

  function resetAll() {
    replaceData(createDefaultData(data.value.deviceId))
  }

  return {
    data,
    ready,
    settings,
    categories,
    activeCategory,
    init,
    replaceData,
    onLocalChange,
    setActiveCategory,
    addCategory,
    updateCategory,
    removeCategory,
    switchCategory,
    locate,
    addItem,
    updateItem,
    removeItems,
    moveItems,
    createFolder,
    moveOutOfFolder,
    importBookmarkGroups,
    upsertNote,
    pushHistory,
    clearHistory,
    resetAll,
  }
})
