<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw, Trash2, Folder, LayoutGrid } from 'lucide-vue-next'
import type { GridItem } from '@guiye/shared'
import Modal from '@/components/common/Modal.vue'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { widgetDef } from '@/widgets/registry'

const app = useAppStore()
const ui = useUiStore()
const list = computed(() => app.data.trash)

const nameOf = (it: GridItem) => (it.type === 'widget' ? (widgetDef(it.widget)?.name ?? '组件') : it.title)
const timeOf = (t: number) => new Date(t).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function restore(i: number) {
  const name = nameOf(list.value[i]!.item)
  const catId = app.restoreTrash(i)
  const cat = app.categories.find((c) => c.id === catId)
  ui.toast(`已恢复「${name}」到「${cat?.name ?? ''}」`, 'success')
}
async function empty() {
  if (await ui.confirm(`彻底删除回收站中的 ${list.value.length} 项？此操作不可撤销。`)) app.emptyTrash()
}
</script>

<template>
  <Modal :open="ui.trashOpen" title="回收站" width="560px" body-class="p-0" @close="ui.trashOpen = false">
    <div class="max-h-[60vh] min-h-[200px] overflow-y-auto px-3 py-2 scrollbar-thin">
      <div v-for="(e, i) in list" :key="e.item.id + e.deletedAt" class="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10">
        <div v-if="e.item.type === 'site'" class="h-[30px] w-[30px] shrink-0"><SiteIcon :item="e.item" :size="30" /></div>
        <span v-else class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-black/5 text-zinc-500 dark:bg-white/10">
          <Folder v-if="e.item.type === 'folder'" :size="16" /><LayoutGrid v-else :size="16" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm">{{ nameOf(e.item) }}</div>
          <div class="truncate text-xs text-zinc-400">来自「{{ e.categoryName }}」 · {{ timeOf(e.deletedAt) }}</div>
        </div>
        <button class="gy-btn-ghost !px-2 !py-1 text-xs" @click="restore(i)"><RotateCcw :size="13" />恢复</button>
        <button class="rounded p-1 text-zinc-400 hover:text-red-500" title="彻底删除" @click="app.deleteTrash(i)"><Trash2 :size="14" /></button>
      </div>
      <div v-if="!list.length" class="flex h-[200px] items-center justify-center text-sm text-zinc-400">回收站是空的</div>
    </div>
    <template v-if="list.length" #footer>
      <span class="mr-auto self-center text-xs text-zinc-400">保留最近 100 项，可同步</span>
      <button class="gy-btn-danger !py-1.5" @click="empty">清空回收站</button>
    </template>
  </Modal>
</template>
