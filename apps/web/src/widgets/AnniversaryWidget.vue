<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import DateCardEditor from './DateCardEditor.vue'
import { daysBetween, fmtDate, nextAnniversary, parseLocalDate, today0 } from './dateUtils'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const editing = ref(false)
const cfg = computed(() => props.item.config as { title?: string; date?: string })
const origin = computed(() => parseLocalDate(cfg.value.date ?? ''))
const passed = computed(() => (origin.value ? daysBetween(origin.value, today0()) : 0))
const next = computed(() => (origin.value ? nextAnniversary(origin.value) : null))
const toNext = computed(() => (next.value ? daysBetween(today0(), next.value) : 0))
const years = computed(() => (next.value && origin.value ? next.value.getFullYear() - origin.value.getFullYear() : 0))

function save(v: { title: string; date: string }) {
  Object.assign(props.item.config, { title: v.title, date: v.date })
  editing.value = false
}
</script>

<template>
  <WidgetShell dense>
    <div class="flex h-full flex-col">
      <div class="flex shrink-0 items-center justify-between bg-gradient-to-r from-rose-400 to-pink-500 px-3.5 py-1.5 text-[13px] text-white">
        <span class="truncate">{{ origin ? `${cfg.title || '纪念日'} 已经` : '纪念日' }}</span>
        <button class="shrink-0 opacity-80 hover:opacity-100" aria-label="编辑" @click="editing = !editing"><Pencil :size="12" /></button>
      </div>
      <div class="min-h-0 flex-1 px-3.5 py-2">
        <DateCardEditor v-if="editing || !origin" :title="cfg.title ?? ''" :date="cfg.date ?? ''" label="纪念日" @save="save" @cancel="editing = false" />
        <div v-else class="flex h-full flex-col items-center justify-center">
          <div class="flex items-baseline gap-1">
            <span class="text-5xl font-semibold tabular-nums">{{ Math.max(passed, 0) }}</span>
            <span class="text-sm text-zinc-500">天</span>
          </div>
          <div class="mt-1 text-center text-[11px] leading-snug text-zinc-400">
            <div>起始日 {{ fmtDate(origin) }}</div>
            <div v-if="years > 0">{{ toNext === 0 ? `今天是 ${years} 周年` : `距 ${years} 周年还有 ${toNext} 天` }}</div>
          </div>
        </div>
      </div>
    </div>
  </WidgetShell>
</template>
