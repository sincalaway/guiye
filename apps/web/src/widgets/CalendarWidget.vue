<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { lunarOf, type WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const big = computed(() => props.cols >= 4 && props.rows >= 4)

const cells = computed(() => {
  const y = cursor.value.getFullYear()
  const m = cursor.value.getMonth()
  const first = new Date(y, m, 1)
  const start = new Date(y, m, 1 - ((first.getDay() + 6) % 7)) // 周一开头
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const lunar = big.value ? lunarOf(d) : null
    return {
      key: d.toDateString(),
      day: d.getDate(),
      inMonth: d.getMonth() === m,
      isToday: d.toDateString() === today.toDateString(),
      weekend: d.getDay() === 0 || d.getDay() === 6,
      lunar: lunar ? (lunar.day === '初一' ? lunar.month : lunar.day) : '',
    }
  })
})

function shift(n: number) {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + n, 1)
}
function reset() {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
}
</script>

<template>
  <WidgetShell>
    <div class="flex h-full flex-col pt-2">
      <div class="mb-1 flex items-center justify-between">
        <button class="text-sm font-semibold" title="回到今天" @click="reset">{{ cursor.getFullYear() }}年{{ cursor.getMonth() + 1 }}月</button>
        <div class="flex text-zinc-400">
          <button class="rounded p-0.5 hover:text-zinc-700" aria-label="上个月" @click="shift(-1)"><ChevronLeft :size="15" /></button>
          <button class="rounded p-0.5 hover:text-zinc-700" aria-label="下个月" @click="shift(1)"><ChevronRight :size="15" /></button>
        </div>
      </div>
      <div class="grid grid-cols-7 text-center text-[10px] text-zinc-400">
        <span v-for="w in '一二三四五六日'" :key="w">{{ w }}</span>
      </div>
      <div class="grid flex-1 grid-cols-7 grid-rows-6 text-center" :class="big ? 'text-sm' : 'text-[11px]'">
        <div
          v-for="c in cells"
          :key="c.key"
          class="flex flex-col items-center justify-center rounded-md"
          :class="[c.isToday ? 'bg-brand-500 text-white' : '', !c.inMonth ? 'opacity-30' : '', c.weekend && !c.isToday ? 'text-red-500' : '']"
        >
          <span class="leading-none tabular-nums">{{ c.day }}</span>
          <span v-if="big" class="mt-0.5 text-[9px] leading-none" :class="c.isToday ? 'text-white/80' : 'text-zinc-400'">{{ c.lunar }}</span>
        </div>
      </div>
    </div>
  </WidgetShell>
</template>
