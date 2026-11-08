<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, Upload, FileUp, Globe, RotateCcw } from 'lucide-vue-next'
import { migrateData, toBookmarksHtml, wrapExport, type ParsedFolder, type SiteItem } from '@guiye/shared'
import Modal from '@/components/common/Modal.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { canReadBrowserBookmarks, download, parseBookmarkFile, readBrowserBookmarks } from '@/services/bookmarks'
import { gcBlobs } from '@/services/storage'

const app = useAppStore()
const ui = useUiStore()
const preview = ref<ParsedFolder[] | null>(null)
const picked = ref<Set<number>>(new Set())
const mode = ref<'per-folder' | 'current'>('per-folder')
const total = computed(() => (preview.value ?? []).reduce((n, f, i) => n + (picked.value.has(i) ? f.bookmarks.length : 0), 0))
const stamp = () => new Date().toISOString().slice(0, 10)

function exportJson() {
  download(`guiye-backup-${stamp()}.json`, JSON.stringify(wrapExport(app.data), null, 2))
}

async function importJson(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!f) return
  try {
    const data = migrateData(JSON.parse(await f.text()), app.data.deviceId)
    if (!(await ui.confirm('导入备份会覆盖当前所有书签、布局与设置（同步配置除外），确定继续？'))) return
    app.replaceData({ ...data, updatedAt: Date.now() })
    ui.toast('备份已恢复', 'success')
  } catch (err: any) {
    ui.toast(`导入失败：${err.message}`, 'error')
  }
}

function showPreview(groups: ParsedFolder[]) {
  if (!groups.length) return ui.toast('没有找到可导入的书签', 'error')
  preview.value = groups
  picked.value = new Set(groups.map((_, i) => i))
}

async function importHtml(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (f) showPreview(await parseBookmarkFile(f))
}

async function importBrowser() {
  try {
    showPreview(await readBrowserBookmarks())
  } catch (err: any) {
    ui.toast(`读取浏览器书签失败：${err.message}`, 'error')
  }
}

function togglePick(i: number) {
  const s = new Set(picked.value)
  s.has(i) ? s.delete(i) : s.add(i)
  picked.value = s
}

function doImport() {
  const groups = (preview.value ?? []).filter((_, i) => picked.value.has(i))
  const n = app.importBookmarkGroups(groups, mode.value)
  preview.value = null
  ui.toast(`已导入 ${n} 个书签`, 'success')
}

function exportHtml() {
  const groups = app.categories.map((c) => ({
    name: c.name,
    bookmarks: c.items.flatMap((i): SiteItem[] => (i.type === 'site' ? [i] : i.type === 'folder' ? i.children : [])).map((s) => ({ title: s.title, url: s.url })),
  }))
  download(`guiye-bookmarks-${stamp()}.html`, toBookmarksHtml(groups), 'text/html')
}

async function reset() {
  if (!(await ui.confirm('恢复默认会清空所有书签、组件、记事本与设置，建议先导出备份。确定？', '恢复默认'))) return
  app.resetAll()
  await gcBlobs(app.data)
  ui.toast('已恢复默认')
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h3 class="mb-1 text-sm font-semibold">导入浏览器书签</h3>
      <p class="mb-2 text-xs text-zinc-500">Chrome / Edge：书签管理器 → ⋮ → 导出书签，得到 .html 文件后在这里导入。</p>
      <div class="flex flex-wrap gap-2">
        <label class="gy-btn-ghost cursor-pointer"><FileUp :size="15" />选择书签 HTML<input type="file" accept=".html,.htm,text/html" class="hidden" @change="importHtml" /></label>
        <button v-if="canReadBrowserBookmarks()" class="gy-btn-ghost" @click="importBrowser"><Globe :size="15" />直接读取浏览器书签</button>
      </div>
    </div>

    <div>
      <h3 class="mb-1 text-sm font-semibold">备份与恢复</h3>
      <p class="mb-2 text-xs text-zinc-500">JSON 备份包含书签、分类、组件、记事本、搜索引擎与全部设置。本地上传的壁纸文件不包含在内。</p>
      <div class="flex flex-wrap gap-2">
        <button class="gy-btn-primary" @click="exportJson"><Download :size="15" />导出 JSON 备份</button>
        <label class="gy-btn-ghost cursor-pointer"><Upload :size="15" />导入 JSON 备份<input type="file" accept=".json,application/json" class="hidden" @change="importJson" /></label>
        <button class="gy-btn-ghost" @click="exportHtml"><Download :size="15" />导出为浏览器书签 HTML</button>
      </div>
    </div>

    <div>
      <h3 class="mb-1 text-sm font-semibold text-red-600 dark:text-red-400">危险操作</h3>
      <button class="gy-btn-ghost !text-red-600" @click="reset"><RotateCcw :size="15" />恢复默认设置</button>
    </div>

    <Modal :open="!!preview" title="选择要导入的书签文件夹" width="560px" @close="preview = null">
      <div class="mb-3 flex gap-2 text-sm">
        <label class="flex items-center gap-1.5"><input v-model="mode" type="radio" value="per-folder" class="accent-brand-500" />每个文件夹新建一个分类</label>
        <label class="flex items-center gap-1.5"><input v-model="mode" type="radio" value="current" class="accent-brand-500" />全部放入当前分类</label>
      </div>
      <div class="max-h-80 space-y-1 overflow-y-auto">
        <label v-for="(f, i) in preview ?? []" :key="i" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5">
          <input type="checkbox" class="accent-brand-500" :checked="picked.has(i)" @change="togglePick(i)" />
          <span class="flex-1 truncate text-sm">{{ f.path.length ? f.path.join(' / ') : f.name }}</span>
          <span class="text-xs text-zinc-400">{{ f.bookmarks.length }}</span>
        </label>
      </div>
      <template #footer>
        <button class="gy-btn-ghost" @click="preview = null">取消</button>
        <button class="gy-btn-primary" :disabled="!total" @click="doImport">导入 {{ total }} 个书签</button>
      </template>
    </Modal>
  </section>
</template>
