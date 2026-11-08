<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { MapPin, RefreshCw, Search, LocateFixed } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import { DEFAULT_POINT, fetchWeather, geocodeCity, locateMe, weatherInfo, type GeoPoint, type WeatherData } from '@/services/weather'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const w = ref<WeatherData | null>(null)
const loading = ref(false)
const error = ref('')
const picking = ref(false)
const kw = ref('')
const results = ref<GeoPoint[]>([])

const point = computed<GeoPoint | null>(() => {
  const c = props.item.config
  return typeof c.lat === 'number' && typeof c.lon === 'number' ? { name: String(c.city || ''), lat: c.lat, lon: c.lon } : null
})

async function load(force = false) {
  loading.value = true
  error.value = ''
  try {
    let p = point.value
    if (!p) {
      try {
        p = await locateMe()
      } catch {
        p = DEFAULT_POINT
      }
      Object.assign(props.item.config, { city: p.name, lat: p.lat, lon: p.lon })
    }
    w.value = await fetchWeather(p, force)
  } catch {
    error.value = '天气加载失败'
  } finally {
    loading.value = false
  }
}

async function search() {
  if (!kw.value.trim()) return
  try {
    results.value = await geocodeCity(kw.value.trim())
    if (!results.value.length) error.value = '没有找到该城市'
  } catch {
    error.value = '城市搜索失败'
  }
}

function choose(p: GeoPoint) {
  Object.assign(props.item.config, { city: p.name.split(' · ')[0], lat: p.lat, lon: p.lon })
  picking.value = false
  results.value = []
  kw.value = ''
  load(true)
}

async function useLocation() {
  try {
    choose(await locateMe())
  } catch {
    error.value = '定位失败，请检查浏览器定位权限'
  }
}

const info = computed(() => (w.value ? weatherInfo(w.value.code, w.value.isDay) : null))
const WEEK = '日一二三四五六'
const dayLabel = (d: string, i: number) => (i === 0 ? '今天' : i === 1 ? '明天' : `周${WEEK[new Date(d + 'T00:00').getDay()]}`)

onMounted(() => load())
</script>

<template>
  <WidgetShell>
    <!-- 选择城市 -->
    <div v-if="picking" class="flex h-full flex-col gap-2 pt-3">
      <div class="flex gap-1">
        <input v-model="kw" class="gy-input !py-1.5" placeholder="输入城市名" @keydown.enter="search" />
        <button class="gy-btn-ghost !px-2" @click="search"><Search :size="15" /></button>
      </div>
      <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto text-sm">
        <button v-for="r in results" :key="`${r.lat},${r.lon}`" class="block w-full truncate rounded px-2 py-1 text-left hover:bg-black/5 dark:hover:bg-white/10" @click="choose(r)">{{ r.name }}</button>
        <p v-if="error" class="px-2 text-xs text-zinc-400">{{ error }}</p>
      </div>
      <div class="flex justify-between text-xs">
        <button class="flex items-center gap-1 text-brand-500" @click="useLocation"><LocateFixed :size="13" />自动定位</button>
        <button class="text-zinc-400" @click="picking = false">取消</button>
      </div>
    </div>

    <div v-else class="flex h-full" :class="cols >= 4 ? 'items-center gap-4 pt-2' : 'flex-col pt-3'">
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <button class="flex min-w-0 items-center gap-1 hover:text-brand-500" title="切换城市" @click="picking = true">
            <MapPin :size="12" /><span class="truncate">{{ w?.city || item.config.city || '定位中' }}</span>
          </button>
          <button class="p-0.5 hover:text-zinc-700" title="刷新" @click="load(true)"><RefreshCw :size="12" :class="{ 'animate-spin': loading }" /></button>
        </div>
        <div v-if="w && info" class="mt-1 flex items-center gap-1">
          <Icon :icon="info.icon" class="h-14 w-14 shrink-0" />
          <div>
            <div class="text-3xl font-light tabular-nums">{{ w.temp }}°</div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ info.text }} · 体感 {{ w.feels }}°</div>
          </div>
        </div>
        <div v-else-if="error" class="mt-4 text-sm text-zinc-400">{{ error }}</div>
        <div v-else class="mt-4 text-sm text-zinc-400">加载中…</div>
        <div v-if="w && rows >= 2 && cols < 4" class="mt-auto flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>湿度 {{ w.humidity }}%</span><span>风速 {{ w.wind }}km/h</span>
        </div>
      </div>
      <div v-if="w && cols >= 4" class="flex flex-1 justify-around">
        <div v-for="(d, i) in w.daily" :key="d.date" class="flex flex-col items-center text-xs">
          <span class="text-zinc-500 dark:text-zinc-400">{{ dayLabel(d.date, i) }}</span>
          <Icon :icon="weatherInfo(d.code).icon" class="h-9 w-9" />
          <span class="tabular-nums">{{ d.min }}° / {{ d.max }}°</span>
        </div>
      </div>
    </div>
  </WidgetShell>
</template>
