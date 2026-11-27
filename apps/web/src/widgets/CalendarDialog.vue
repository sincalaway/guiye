<script setup lang="ts">
/** 日历窗口（子幽样式）：月历 + 农历/节日/节气，右侧黄历详情（宜忌、星座、月相、物候、神位） */
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Solar } from 'lunar-javascript'
import Modal from '@/components/common/Modal.vue'
import { dayOfYear, isoWeek } from './dateUtils'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth()) // 0-11
const selected = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
watch(
  () => props.open,
  (v) => v && ((year.value = today.getFullYear()), (month.value = today.getMonth()), (selected.value = new Date(today.getFullYear(), today.getMonth(), today.getDate()))),
)

const YEARS = Array.from({ length: 21 }, (_, i) => today.getFullYear() - 10 + i)
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** 格子下方的小字：节日 > 节气 > 农历日（初一显示月份） */
function subLabel(d: Date) {
  const s = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const l = s.getLunar()
  const fest = [...l.getFestivals(), ...s.getFestivals()][0]
  if (fest) return { text: fest, hl: true }
  const jq = l.getJieQi()
  if (jq) return { text: jq, hl: true }
  return { text: l.getDay() === 1 ? `${l.getMonthInChinese()}月` : l.getDayInChinese(), hl: false }
}

const cells = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const start = new Date(year.value, month.value, 1 - first.getDay()) // 周日开头（与子幽一致）
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { d, key: d.toDateString(), inMonth: d.getMonth() === month.value, weekend: d.getDay() === 0 || d.getDay() === 6, ...subLabel(d) }
  })
})

function shift(n: number) {
  const d = new Date(year.value, month.value + n, 1)
  year.value = d.getFullYear()
  month.value = d.getMonth()
}
function pick(d: Date) {
  selected.value = d
  if (d.getMonth() !== month.value) ((year.value = d.getFullYear()), (month.value = d.getMonth()))
}

const WEEK = '日一二三四五六'
const detail = computed(() => {
  const d = selected.value
  const s = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const l = s.getLunar()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    head: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 周${WEEK[d.getDay()]}`,
    day: d.getDate(),
    lunar: `${l.getYearInChinese()}年${l.getMonthInChinese()}月${l.getDayInChinese()}`,
    ganzhi: `${l.getYearInGanZhi()}（${l.getYearShengXiao()}）年 ${l.getMonthInGanZhi()}月 ${l.getDayInGanZhi()}日`,
    nth: `本年第${dayOfYear(d)}天 第${isoWeek(d)}周`,
    shengxiao: l.getYearShengXiao(),
    xingzuo: `${s.getXingZuo()}座`,
    yi: (l.getDayYi() as string[]).slice(0, 8).join(' '),
    ji: (l.getDayJi() as string[]).slice(0, 8).join(' '),
    yuexiang: `${l.getYueXiang()}月`,
    wuhou: l.getWuHou(),
    pos: [
      ['喜神位', l.getDayPositionXiDesc()],
      ['阳贵位', l.getDayPositionYangGuiDesc()],
      ['阴贵位', l.getDayPositionYinGuiDesc()],
      ['福神位', l.getDayPositionFuDesc()],
      ['财神位', l.getDayPositionCaiDesc()],
    ] as [string, string][],
  }
})
</script>

<template>
  <Modal :open="open" width="760px" body-class="p-0" @close="emit('close')">
    <div class="flex flex-col gap-4 p-5 md:flex-row">
      <!-- 月历 -->
      <div class="min-w-0 flex-1">
        <div class="mb-3 flex items-center gap-2">
          <select v-model="year" class="gy-input !w-auto !py-1 text-sm"><option v-for="y in YEARS" :key="y" :value="y">{{ y }}</option></select>
          <select v-model="month" class="gy-input !w-auto !py-1 text-sm"><option v-for="(m, i) in MONTHS" :key="m" :value="i">{{ m }}</option></select>
          <div class="ml-auto flex gap-1">
            <button class="rounded-md border border-black/10 p-1 hover:bg-black/5 dark:border-white/10" aria-label="上个月" @click="shift(-1)"><ChevronLeft :size="16" /></button>
            <button class="rounded-md border border-black/10 px-2 text-xs hover:bg-black/5 dark:border-white/10" @click="pick(new Date(today.getFullYear(), today.getMonth(), today.getDate()))">今天</button>
            <button class="rounded-md border border-black/10 p-1 hover:bg-black/5 dark:border-white/10" aria-label="下个月" @click="shift(1)"><ChevronRight :size="16" /></button>
          </div>
        </div>
        <div class="grid grid-cols-7 pb-1 text-center text-xs text-zinc-500">
          <span v-for="(w, i) in WEEK" :key="w" :class="{ 'text-red-500': i === 0 || i === 6 }">{{ w }}</span>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="c in cells"
            :key="c.key"
            class="flex h-11 flex-col items-center justify-center rounded-lg transition"
            :class="[
              same(c.d, today) ? 'bg-[#1677ff] text-white' : same(c.d, selected) ? 'ring-1 ring-[#1677ff]' : 'hover:bg-black/5 dark:hover:bg-white/10',
              !c.inMonth && 'opacity-35',
            ]"
            @click="pick(c.d)"
          >
            <span class="text-sm leading-none tabular-nums" :class="{ 'text-red-500': c.weekend && !same(c.d, today) }">{{ c.d.getDate() }}</span>
            <span class="mt-1 max-w-full truncate px-0.5 text-[10px] leading-none" :class="same(c.d, today) ? 'text-white/85' : c.hl ? 'text-[#1677ff]' : 'text-zinc-400'">{{ c.text }}</span>
          </button>
        </div>
      </div>
      <!-- 黄历详情 -->
      <aside class="w-full shrink-0 rounded-xl bg-[#f7f8fa] p-4 text-[13px] md:w-[230px] dark:bg-zinc-800">
        <div class="text-center text-xs text-zinc-500">{{ detail.head }}</div>
        <div class="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1677ff] text-3xl font-semibold text-white">{{ detail.day }}</div>
        <div class="text-center font-medium">{{ detail.lunar }}</div>
        <div class="mt-0.5 text-center text-xs text-zinc-500">{{ detail.ganzhi }}</div>
        <div class="mb-3 text-center text-xs text-zinc-500">{{ detail.nth }}</div>
        <div class="space-y-1.5 text-xs">
          <div class="flex gap-2"><span class="gy-chip bg-zinc-200 text-zinc-600">生肖</span>{{ detail.shengxiao }}</div>
          <div class="flex gap-2"><span class="gy-chip bg-pink-100 text-pink-600">星座</span>{{ detail.xingzuo }}</div>
          <div class="flex gap-2"><span class="gy-chip bg-emerald-100 text-emerald-600">宜</span><span class="leading-relaxed">{{ detail.yi || '—' }}</span></div>
          <div class="flex gap-2"><span class="gy-chip bg-zinc-200 text-zinc-600">忌</span><span class="leading-relaxed">{{ detail.ji || '—' }}</span></div>
          <div class="flex gap-2"><span class="gy-chip bg-amber-100 text-amber-600">月相</span>{{ detail.yuexiang }}</div>
          <div class="flex gap-2"><span class="gy-chip bg-sky-100 text-sky-600">物候</span>{{ detail.wuhou }}</div>
          <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-zinc-500">
            <span v-for="[k, v] in detail.pos" :key="k">{{ k }}：{{ v }}</span>
          </div>
        </div>
      </aside>
    </div>
  </Modal>
</template>

<style scoped>
.gy-chip { flex-shrink: 0; border-radius: 4px; padding: 0 5px; line-height: 18px; height: 18px; }
</style>
