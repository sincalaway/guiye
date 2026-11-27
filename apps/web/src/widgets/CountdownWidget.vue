<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import DateCardEditor from './DateCardEditor.vue'
import { daysBetween, fmtDate, parseLocalDate, today0 } from './dateUtils'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const editing = ref(false)
const cfg = computed(() => props.item.config as { title?: string; date?: string })
const target = computed(() => parseLocalDate(cfg.value.date ?? ''))
const days = computed(() => (target.value ? daysBetween(today0(), target.value) : null))

function save(v: { title: string; date: string }) {
  Object.assign(props.item.config, { title: v.title, date: v.date })
  editing.value = false
}
</script>

<template>
  <WidgetShell dense>
    <div class="flex h-full flex-col">
      <div class="flex shrink-0 items-center justify-between bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 py-1.5 text-[13px] text-white">
        <span class="truncate">{{ !target ? '倒计时' : days! >= 0 ? `距离 ${cfg.title || '目标日'} 还有` : `${cfg.title || '目标日'} 已过去` }}</span>
        <button class="shrink-0 opacity-80 hover:opacity-100" aria-label="编辑" @click="editing = !editing"><Pencil :size="12" /></button>
      </div>
      <div class="min-h-0 flex-1 px-3.5 py-2">
        <DateCardEditor v-if="editing || !target" :title="cfg.title ?? ''" :date="cfg.date ?? ''" label="倒计时" @save="save" @cancel="editing = false" />
        <div v-else class="flex h-full flex-col items-center justify-center">
          <div class="flex items-baseline gap-1">
            <span class="text-5xl font-semibold tabular-nums">{{ Math.abs(days!) }}</span>
            <span class="text-sm text-zinc-500">天</span>
          </div>
          <div class="mt-1 text-[11px] text-zinc-400">{{ days === 0 ? '就是今天' : fmtDate(target) }}</div>
        </div>
      </div>
    </div>
  </WidgetShell>
</template>
