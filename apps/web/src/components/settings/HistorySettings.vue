<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { History, RotateCcw, Trash2 } from 'lucide-vue-next'
import { listSnapshots, removeSnapshot, type Snapshot } from '@/services/history'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

const app = useAppStore()
const ui = useUiStore()
const list = ref<Snapshot[]>([])
const load = async () => (list.value = await listSnapshots())
onMounted(load)

const fmt = (t: number) => new Date(t).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

async function restore(s: Snapshot) {
  if (!(await ui.confirm(`恢复到 ${fmt(s.time)} 的数据？当前数据会先自动备份一份。`))) return
  app.replaceData({ ...s.data, updatedAt: Date.now() })
  ui.toast('已恢复', 'success')
  setTimeout(load, 500)
}
async function remove(s: Snapshot) {
  await removeSnapshot(s.id)
  load()
}
</script>

<template>
  <section class="space-y-3">
    <div class="rounded-lg bg-[#eaf2ff] px-4 py-3 text-center text-[13px] leading-relaxed text-[#1677ff] dark:bg-sky-500/10 dark:text-sky-300">
      本机自动保留最近 30 份数据记录<br />误删、误导入或同步覆盖后可一键恢复
    </div>
    <div v-for="s in list" :key="s.id" class="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-black/5 dark:hover:bg-white/5">
      <History :size="16" class="shrink-0 text-zinc-400" />
      <div class="min-w-0 flex-1">
        <div class="text-[13px]">{{ fmt(s.time) }} <span class="text-xs text-zinc-400">· {{ s.reason }}</span></div>
        <div class="text-xs text-zinc-400">{{ s.categories }} 个分类 · {{ s.sites }} 个网站 · {{ s.widgets }} 个组件</div>
      </div>
      <button class="gy-btn-ghost !px-2 !py-1 text-xs" @click="restore(s)"><RotateCcw :size="13" />恢复</button>
      <button class="rounded p-1 text-zinc-400 hover:text-red-500" title="删除记录" @click="remove(s)"><Trash2 :size="14" /></button>
    </div>
    <div v-if="!list.length" class="py-10 text-center text-sm text-zinc-400">暂无记录，修改数据后会自动生成</div>
  </section>
</template>
