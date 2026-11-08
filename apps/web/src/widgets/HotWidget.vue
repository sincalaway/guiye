<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { HOT_SOURCES, HOT_SOURCE_IDS, type HotEntry, type HotSource, type WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import { fetchHot } from '@/services/hot'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const app = useAppStore()
const ui = useUiStore()
const list = ref<HotEntry[]>([])
const loading = ref(false)
const error = ref('')
const source = () => (props.item.config.source as HotSource) || 'baidu'
const SHORT: Record<HotSource, string> = { weibo: '微博', baidu: '百度', zhihu: '知乎' }

async function load(force = false) {
  loading.value = true
  error.value = ''
  try {
    list.value = await fetchHot(source(), app.settings.hotApiBase, force)
    if (!list.value.length) error.value = '暂无数据'
  } catch {
    list.value = []
    error.value = '获取失败'
  } finally {
    loading.value = false
  }
}

function setSource(s: HotSource) {
  props.item.config.source = s
}
watch(() => props.item.config.source, () => load())
onMounted(() => load())

const fmtHot = (h: HotEntry['hot']) => {
  const n = Number(h)
  if (!h || !Number.isFinite(n)) return typeof h === 'string' ? h.replace(/热度$/, '') : ''
  return n >= 10000 ? `${(n / 10000).toFixed(n >= 1e6 ? 0 : 1)}万` : String(n)
}
const rankClass = (i: number) => (i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-500 text-white' : i === 2 ? 'bg-amber-400 text-white' : 'bg-black/5 text-zinc-500 dark:bg-white/10')
</script>

<template>
  <WidgetShell dense>
    <div class="flex h-full flex-col">
      <div class="flex items-center gap-1 px-3 pt-2.5 pb-1.5">
        <button
          v-for="s in HOT_SOURCE_IDS"
          :key="s"
          class="shrink-0 rounded-full px-2 py-0.5 text-xs whitespace-nowrap transition"
          :class="source() === s ? 'bg-brand-500 text-white' : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10'"
          :title="HOT_SOURCES[s].name"
          @click="setSource(s)"
        >
          {{ SHORT[s] }}
        </button>
        <button class="ml-auto rounded p-1 text-zinc-400 hover:text-zinc-700" title="刷新" @click="load(true)"><RefreshCw :size="13" :class="{ 'animate-spin': loading }" /></button>
      </div>
      <ol v-if="list.length" class="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2" :class="{ 'grid grid-cols-2 content-start gap-x-2': cols >= 4 && rows >= 4 }">
        <li v-for="(h, i) in list" :key="h.url + i">
          <a :href="h.url" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] hover:bg-black/5 dark:hover:bg-white/10">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold" :class="rankClass(i)">{{ i + 1 }}</span>
            <span class="min-w-0 flex-1 truncate">{{ h.title }}</span>
            <span v-if="cols >= 4 || rows >= 4" class="shrink-0 text-[11px] text-zinc-400">{{ fmtHot(h.hot) }}</span>
          </a>
        </li>
      </ol>
      <div v-if="error && !list.length" class="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-xs text-zinc-400">
        <span>{{ error }}</span>
        <button class="text-brand-500" @click="ui.openSettings('widgets')">配置热搜 API</button>
      </div>
    </div>
  </WidgetShell>
</template>
