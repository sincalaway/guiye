<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { lunarOf, type WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const now = useNow({ interval: 1000 })
const WEEK = '日一二三四五六'
const hm = computed(() => `${String(now.value.getHours()).padStart(2, '0')}:${String(now.value.getMinutes()).padStart(2, '0')}`)
const sec = computed(() => String(now.value.getSeconds()).padStart(2, '0'))
const lunar = computed(() => lunarOf(now.value))
const wide = computed(() => props.cols >= 4)
</script>

<template>
  <WidgetShell>
    <div class="flex h-full flex-col justify-center" :class="wide ? 'items-start pl-3' : 'items-center pt-3'">
      <div class="flex items-baseline gap-1 tabular-nums">
        <span class="leading-none font-light tracking-tight" :style="{ fontSize: wide ? 'min(3.75rem, 16cqw)' : 'min(3rem, 27cqw)' }">{{ hm }}</span>
        <span class="text-zinc-400" :style="{ fontSize: 'min(1.125rem, 9cqw)' }">{{ sec }}</span>
      </div>
      <div class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {{ now.getMonth() + 1 }}月{{ now.getDate() }}日 周{{ WEEK[now.getDay()] }}
      </div>
      <div v-if="lunar" class="mt-0.5 text-xs text-zinc-400">农历{{ lunar.month }}{{ lunar.day }}</div>
    </div>
  </WidgetShell>
</template>
