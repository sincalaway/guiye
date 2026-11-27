<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { formatDate, lunarOf } from '@guiye/shared'
import { useAppStore } from '@/stores/app'

defineProps<{ preview?: boolean }>()
const app = useAppStore()
const c = computed(() => app.settings.clock)
const now = useNow({ interval: 1000 })
const WEEK = ['日', '一', '二', '三', '四', '五', '六']
/** 时辰干支（与子幽一致）：以 2026-11-27 日柱乙巳（六十甲子第 42 位）为基准，23 点起算次日 */
const GAN = '甲乙丙丁戊己庚辛壬癸'
const ZHI = '子丑寅卯辰巳午未申酉戌亥'
function hourGanZhi(d: Date) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (d.getHours() >= 23 ? 1 : 0))
  const days = Math.round((Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) - Date.UTC(2026, 10, 27)) / 86_400_000)
  const dayIdx = (((41 + days) % 60) + 60) % 60
  const zhi = Math.floor((d.getHours() + 1) / 2) % 12
  const gan = (((dayIdx % 10) % 5) * 2 + zhi) % 10
  return GAN[gan]! + ZHI[zhi]!
}

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
  if (c.value.showGanzhi ?? true) parts.push(hourGanZhi(d))
  return parts.join('  ')
})
</script>

<template>
  <div v-if="c.show || dateLine || preview" class="text-center select-none text-shadow" :style="{ color: c.color || '#ffffff' }">
    <template v-if="c.show">
    <div class="flex items-baseline justify-center gap-2">
      <span v-if="time.suffix" class="text-lg opacity-80">{{ time.suffix }}</span>
      <span class="font-light tracking-tight tabular-nums" :class="preview ? 'text-5xl leading-none' : 'text-6xl md:text-[64px] md:leading-none'">{{ time.main }}</span>
    </div>
    </template>
    <div v-if="dateLine" class="mt-2 text-sm tracking-[0.12em] opacity-90 md:text-[15px]">{{ dateLine }}</div>
  </div>
</template>
