<script setup lang="ts">
/** 数据变动记录（子幽：说明 + 最近 10 条，可恢复） */
import { onMounted, ref } from 'vue'
import { Inbox } from 'lucide-vue-next'
import SetBanner from './parts/SetBanner.vue'
import { listSnapshots, type Snapshot } from '@/services/history'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

const app = useAppStore()
const ui = useUiStore()
const list = ref<Snapshot[]>([])
const loading = ref(true)
const load = async () => {
  list.value = await listSnapshots()
  loading.value = false
}
onMounted(load)

const fmt = (t: number) => new Date(t).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })

async function restore(s: Snapshot) {
  if (!(await ui.confirm(`恢复到 ${fmt(s.time)} 的数据？当前数据会先自动记录一份。`, '恢复'))) return
  app.replaceData({ ...s.data, updatedAt: Date.now() })
  ui.toast('已恢复', 'success')
  setTimeout(load, 500)
}
</script>

<template>
  <section>
    <SetBanner>该功能主要是用于恢复误操作导致的标签数据丢失的场景<br />点击恢复按钮即可恢复到最新的10条中、选中的时间点的数据</SetBanner>
    <div v-if="loading" class="py-10 text-center text-sm text-zinc-400">加载中…</div>
    <template v-else-if="list.length">
      <div v-for="s in list" :key="s.id" class="flex min-h-[46px] items-center gap-3 border-b border-black/5 text-[13px] last:border-0 dark:border-white/5">
        <div class="min-w-0 flex-1">
          <div>{{ fmt(s.time) }}</div>
          <div class="text-xs text-zinc-400">{{ s.reason }} · {{ s.categories }} 个分类 · {{ s.sites }} 个网站 · {{ s.widgets }} 个组件</div>
        </div>
        <button class="rounded border border-black/15 px-3 py-1 text-xs hover:border-[#1677ff] hover:text-[#1677ff] dark:border-white/15" @click="restore(s)">恢复</button>
      </div>
    </template>
    <div v-else class="flex flex-col items-center gap-2 py-12 text-zinc-400">
      <Inbox :size="56" :stroke-width="1" />
      <span class="text-[13px]">暂无数据</span>
    </div>
  </section>
</template>
