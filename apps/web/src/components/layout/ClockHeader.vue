<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { formatDate, lunarOf } from '@guiye/shared'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const c = computed(() => app.settings.clock)
const now = useNow({ interval: 1000 })
const WEEK = ['日', '一', '二', '三', '四', '五', '六']

const time = computed(() => {
  const d = now.value
  let h = d.getHours()
  let suffix = ''
  if (c.value.hour12) {
    suffix = h < 12 ? '上午' : '下午'
    h = h % 12 || 12
  }
  const hh = c.value.hour12 ? String(h) : String(h).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return { main: `${hh}:${mm}${c.value.showSeconds ? ':' + ss : ''}`, suffix }
})

const dateLine = computed(() => {
  const d = now.value
  const parts: string[] = []
  if (c.value.showDate) parts.push(c.value.dateFormat ? formatDate(d, c.value.dateFormat) : `${d.getMonth() + 1}月${d.getDate()}日`)
  if (c.value.showWeek) parts.push(`星期${WEEK[d.getDay()]}`)
  if (c.value.showLunar) {
    const l = lunarOf(d)
    if (l) parts.push(`${l.month}${l.day}`)
  }
  return parts.join('  ')
})
</script>

<template>
  <div v-if="c.show" class="text-center text-white select-none text-shadow">
    <div class="flex items-baseline justify-center gap-2">
      <span v-if="time.suffix" class="text-lg opacity-80">{{ time.suffix }}</span>
      <span class="text-6xl font-light tracking-tight tabular-nums md:text-7xl">{{ time.main }}</span>
    </div>
    <div v-if="dateLine" class="mt-1 text-sm opacity-90 md:text-base">{{ dateLine }}</div>
  </div>
</template>
