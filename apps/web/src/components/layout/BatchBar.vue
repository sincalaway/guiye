<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

const app = useAppStore()
const ui = useUiStore()
const count = computed(() => ui.selected.size)
const allIds = computed(() => app.activeCategory.items.map((i) => i.id))

function selectAll() {
  ui.selected = count.value === allIds.value.length ? new Set() : new Set(allIds.value)
}
async function remove() {
  if (!count.value) return
  if (await ui.confirm(`删除选中的 ${count.value} 个项目？`)) {
    app.removeItems([...ui.selected])
    ui.selected = new Set()
  }
}
function moveTo(id: string) {
  if (!id || !count.value) return
  app.moveItems([...ui.selected], id)
  ui.toast(`已移动 ${count.value} 项`)
  ui.selected = new Set()
}
function toFolder() {
  if (app.createFolder([...ui.selected])) ui.selected = new Set()
  else ui.toast('只能将网站图标放入文件夹', 'error')
}
</script>

<template>
  <Transition name="pop">
    <div v-if="ui.editMode" class="glass fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl p-2 text-sm text-zinc-800 shadow-2xl dark:text-zinc-100" @contextmenu.stop.prevent>
      <span class="px-2 whitespace-nowrap">已选 {{ count }} 项</span>
      <button class="gy-btn-ghost !py-1.5" @click="selectAll">{{ count === allIds.length && count ? '取消全选' : '全选' }}</button>
      <select class="gy-input !w-auto !py-1.5" :disabled="!count" @change="moveTo(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''">
        <option value="">移动到…</option>
        <option v-for="c in app.categories.filter((c) => c.id !== app.activeCategory.id)" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <button class="gy-btn-ghost !py-1.5" :disabled="!count" @click="toFolder">建文件夹</button>
      <button class="gy-btn-danger !py-1.5" :disabled="!count" @click="remove">删除</button>
      <button class="gy-btn-primary !py-1.5" @click="ui.setEditMode(false)">完成</button>
    </div>
  </Transition>
</template>
