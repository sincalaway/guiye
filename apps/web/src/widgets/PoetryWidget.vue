<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RefreshCw, Repeat } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import { fetchVerse, type Verse } from '@/services/poetry'
import { cacheGet, cacheSet } from '@/services/storage'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const verse = ref<Verse | null>(null)
const loading = ref(false)
const error = ref('')
const type = () => (props.item.config.type as 'jinrishici' | 'hitokoto') ?? 'jinrishici'

async function load(force = false) {
  const key = `verse:${type()}`
  if (!force) {
    const c = cacheGet<Verse>(key, 60 * 60 * 1000)
    if (c) return (verse.value = c)
  }
  loading.value = true
  error.value = ''
  try {
    verse.value = await fetchVerse(type())
    cacheSet(key, verse.value)
  } catch {
    error.value = '加载失败，点击刷新重试'
  } finally {
    loading.value = false
  }
}

function switchType() {
  props.item.config.type = type() === 'jinrishici' ? 'hitokoto' : 'jinrishici'
  load(true)
}

onMounted(() => load())
</script>

<template>
  <WidgetShell :title="type() === 'jinrishici' ? '每日诗词' : '一言'">
    <template #actions>
      <button class="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" :title="type() === 'jinrishici' ? '切换为一言' : '切换为诗词'" @click="switchType"><Repeat :size="13" /></button>
      <button class="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" title="换一句" @click="load(true)"><RefreshCw :size="13" :class="{ 'animate-spin': loading }" /></button>
    </template>
    <div class="flex h-full flex-col justify-center px-1">
      <p v-if="error" class="text-sm text-zinc-400">{{ error }}</p>
      <template v-else-if="verse">
        <p class="leading-relaxed font-medium" :class="cols >= 4 ? 'text-lg' : 'line-clamp-4 text-sm'" style="font-family: 'Songti SC', 'STSong', 'SimSun', serif">{{ verse.content }}</p>
        <p class="mt-2 truncate text-right text-xs text-zinc-500 dark:text-zinc-400">
          —— {{ verse.author }}<span v-if="verse.from">《{{ verse.from.replace(/^《|》$/g, '') }}》</span>
        </p>
      </template>
    </div>
  </WidgetShell>
</template>
