<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import Modal from '@/components/common/Modal.vue'
import GridTile from '@/components/layout/GridTile.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import type { FolderItem } from '@guiye/shared'

const app = useAppStore()
const ui = useUiStore()
const folder = computed(() => {
  const loc = ui.openFolderId ? app.locate(ui.openFolderId) : null
  return loc?.item.type === 'folder' ? (loc.item as FolderItem) : null
})
const title = ref('')
watch(folder, (f) => (title.value = f?.title ?? ''), { immediate: true })
watch(
  () => folder.value?.children.length,
  (n) => {
    if (ui.openFolderId && !n) ui.openFolderId = null
  },
)
function saveTitle() {
  if (folder.value && title.value.trim()) folder.value.title = title.value.trim()
}
</script>

<template>
  <Modal :open="!!folder" width="560px" @close="ui.openFolderId = null">
    <template #header>
      <input v-model="title" class="w-full bg-transparent text-base font-semibold outline-none" @blur="saveTitle" @keydown.enter="($event.target as HTMLInputElement).blur()" />
    </template>
    <div v-if="folder" :style="{ '--icon-size': '56px', '--icon-radius': `${app.settings.layout.iconRadius}%` }">
      <VueDraggable v-model="folder.children" :animation="180" ghost-class="gy-ghost" class="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-5">
        <GridTile v-for="c in folder.children" :key="c.id" :item="c" :mobile="false" in-folder />
      </VueDraggable>
      <p class="mt-4 text-xs text-zinc-400">拖动排序，右键可编辑或移出文件夹</p>
    </div>
  </Modal>
</template>
