<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside, useDebounceFn, useEventListener } from '@vueuse/core'
import { Search, Languages, History, X, Settings2, Copy, ExternalLink } from 'lucide-vue-next'
import { buildSearchUrl, isProbablyUrl, normalizeUrl, TRANSLATE_SITE_URL, type SearchEngine } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { fetchSuggestions, quickTranslate } from '@/services/search'

const app = useAppStore()
const ui = useUiStore()
const s = computed(() => app.settings.search)
const engines = computed(() => s.value.engines)
const engine = computed<SearchEngine>(() => engines.value.find((e) => e.id === s.value.engineId) ?? engines.value[0]!)

const q = ref('')
const focused = ref(false)
const showEngines = ref(false)
const suggestions = ref<string[]>([])
const active = ref(-1)
const translation = ref<{ text: string; error?: string; loading: boolean } | null>(null)
const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
/** 加载失败的引擎图标，回退为放大镜 */
const badIcons = ref(new Set<string>())
const iconOk = (e: SearchEngine) => !!e.icon && !badIcons.value.has(e.id)
const markBad = (id: string) => (badIcons.value = new Set([...badIcons.value, id]))

onClickOutside(root, () => {
  focused.value = false
  showEngines.value = false
})

/** 下拉列表：输入为空时显示历史，否则显示建议 */
const rows = computed<{ kind: 'history' | 'suggest'; text: string }[]>(() => {
  if (!q.value.trim()) return s.value.history ? app.data.searchHistory.slice(0, 8).map((text) => ({ kind: 'history' as const, text })) : []
  return s.value.suggestions ? suggestions.value.map((text) => ({ kind: 'suggest' as const, text })) : []
})
const dropdownOpen = computed(() => focused.value && !showEngines.value && (rows.value.length > 0 || !!translation.value))

const loadSuggest = useDebounceFn(async (kw: string) => {
  if (!s.value.suggestions || !kw.trim()) return (suggestions.value = [])
  const r = await fetchSuggestions(kw, engine.value.id)
  if (kw === q.value) suggestions.value = r.filter((x) => x !== kw)
}, 180)

const loadTranslate = useDebounceFn(async (kw: string) => {
  if (!s.value.translate || !kw.trim() || isProbablyUrl(kw)) return (translation.value = null)
  translation.value = { text: '', loading: true }
  try {
    const text = await quickTranslate(kw, s.value.translateProvider)
    if (kw === q.value) translation.value = { text, loading: false }
  } catch (e: any) {
    if (kw === q.value) translation.value = { text: '', loading: false, error: e?.message ?? '翻译失败' }
  }
}, 500)

watch(q, (v) => {
  active.value = -1
  loadSuggest(v)
  loadTranslate(v)
  if (!v.trim()) translation.value = null
})

function cycleEngine(delta: number) {
  const list = engines.value
  const i = list.findIndex((e) => e.id === engine.value.id)
  s.value.engineId = list[(i + delta + list.length) % list.length]!.id
  if (q.value.trim()) loadSuggest(q.value)
}

function pickEngine(id: string) {
  s.value.engineId = id
  showEngines.value = false
  input.value?.focus()
}

function go(text = q.value) {
  const kw = text.trim()
  if (!kw) return
  const url = isProbablyUrl(kw) ? normalizeUrl(kw) : buildSearchUrl(engine.value.url, kw)
  app.pushHistory(kw)
  if (s.value.openInNewTab) window.open(url, '_blank', 'noopener')
  else location.href = url
  q.value = ''
  focused.value = false
  input.value?.blur()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    cycleEngine(e.shiftKey ? -1 : 1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (rows.value.length) active.value = (active.value + 1) % rows.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (rows.value.length) active.value = (active.value - 1 + rows.value.length) % rows.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    go(active.value >= 0 ? rows.value[active.value]!.text : q.value)
  } else if (e.key === 'Escape') {
    focused.value = false
    input.value?.blur()
  }
}

function removeHistory(text: string) {
  app.data.searchHistory = app.data.searchHistory.filter((x) => x !== text)
}

async function copyTranslation() {
  if (!translation.value?.text) return
  await navigator.clipboard.writeText(translation.value.text)
  ui.toast('译文已复制', 'success')
}

function openTranslateSite() {
  window.open(buildSearchUrl(TRANSLATE_SITE_URL, q.value.trim()), '_blank', 'noopener')
}

// 在页面任意空白处直接打字或按 "/" 时聚焦搜索框
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  const t = e.target as HTMLElement
  if (t?.closest('input, textarea, [contenteditable="true"], select')) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === '/') {
    e.preventDefault()
    input.value?.focus()
  } else if (e.key.length === 1 && !document.querySelector('[role="dialog"]')) {
    input.value?.focus()
  }
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div ref="root" class="relative mx-auto w-full max-w-[640px]" @contextmenu.stop>
    <div
      class="flex h-12 items-center rounded-full pr-2 pl-1.5 shadow-lg transition md:h-[52px]"
      :class="focused ? 'bg-white/95 dark:bg-zinc-900/95' : 'glass-soft hover:bg-white/30'"
    >
      <button
        class="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
        :title="`当前：${engine.name}（Tab 切换）`"
        @click="showEngines = !showEngines"
      >
        <img v-if="iconOk(engine)" :src="engine.icon" alt="" class="h-5 w-5 rounded" referrerpolicy="no-referrer" @error="markBad(engine.id)" />
        <Search v-else :size="18" :class="focused ? 'text-zinc-500' : 'text-white'" />
        <span class="hidden text-xs sm:inline" :class="focused ? 'text-zinc-500' : 'text-white/90'">{{ engine.name }}</span>
      </button>
      <input
        ref="input"
        v-model="q"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="`${engine.name} 搜索，或输入网址`"
        class="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none"
        :class="focused ? 'text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100' : 'text-white placeholder:text-white/75'"
        @focus="focused = true"
        @keydown="onKeydown"
      />
      <button v-if="q" class="rounded-full p-1.5 text-zinc-400 hover:text-zinc-600" aria-label="清空" @click="q = ''"><X :size="16" /></button>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full transition"
        :class="focused ? 'text-brand-500 hover:bg-brand-500/10' : 'text-white hover:bg-white/15'"
        aria-label="搜索"
        @click="go()"
      >
        <Search :size="19" />
      </button>
    </div>

    <!-- 引擎选择 -->
    <Transition name="pop">
      <div v-if="showEngines" class="glass absolute top-14 left-0 z-50 w-full rounded-2xl p-3 shadow-2xl md:top-16">
        <div class="grid grid-cols-4 gap-1 sm:grid-cols-6">
          <button
            v-for="e in engines"
            :key="e.id"
            class="flex flex-col items-center gap-1 rounded-xl p-2 text-xs text-zinc-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
            :class="{ 'bg-brand-500/10 !text-brand-600 dark:!text-brand-400': e.id === engine.id }"
            @click="pickEngine(e.id)"
          >
            <img v-if="iconOk(e)" :src="e.icon" alt="" class="h-6 w-6 rounded" referrerpolicy="no-referrer" @error="markBad(e.id)" />
            <Search v-else :size="22" />
            <span class="w-full truncate text-center">{{ e.name }}</span>
          </button>
          <button
            class="flex flex-col items-center gap-1 rounded-xl p-2 text-xs text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            @click="(showEngines = false), ui.openSettings('search')"
          >
            <Settings2 :size="22" />
            <span>管理</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 建议 / 历史 / 翻译 -->
    <Transition name="fade">
      <div v-if="dropdownOpen" class="glass absolute top-14 left-0 z-50 w-full overflow-hidden rounded-2xl py-2 text-zinc-800 shadow-2xl md:top-16 dark:text-zinc-100">
        <div v-if="translation" class="mx-2 mb-1 flex items-start gap-2 rounded-xl bg-brand-500/8 px-3 py-2 text-sm">
          <Languages :size="16" class="mt-0.5 shrink-0 text-brand-500" />
          <div class="min-w-0 flex-1">
            <span v-if="translation.loading" class="text-zinc-400">翻译中…</span>
            <span v-else-if="translation.error" class="text-zinc-500">{{ translation.error }}</span>
            <span v-else class="break-words">{{ translation.text }}</span>
          </div>
          <button v-if="translation.text" class="rounded p-1 text-zinc-400 hover:text-zinc-700" title="复制译文" @click="copyTranslation"><Copy :size="14" /></button>
          <button class="rounded p-1 text-zinc-400 hover:text-zinc-700" title="在翻译网站打开" @click="openTranslateSite"><ExternalLink :size="14" /></button>
        </div>
        <div v-if="!q.trim() && rows.length" class="flex items-center justify-between px-4 pt-1 pb-1 text-xs text-zinc-400">
          <span>搜索历史</span>
          <button class="hover:text-zinc-600" @click="app.clearHistory()">清空</button>
        </div>
        <button
          v-for="(r, i) in rows"
          :key="r.kind + r.text"
          class="group flex w-full items-center gap-3 px-4 py-2 text-left text-sm"
          :class="i === active ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'"
          @mouseenter="active = i"
          @click="go(r.text)"
        >
          <History v-if="r.kind === 'history'" :size="15" class="shrink-0 text-zinc-400" />
          <Search v-else :size="15" class="shrink-0 text-zinc-400" />
          <span class="flex-1 truncate">{{ r.text }}</span>
          <X v-if="r.kind === 'history'" :size="14" class="text-zinc-400 opacity-0 group-hover:opacity-100" @click.stop="removeHistory(r.text)" />
        </button>
      </div>
    </Transition>
  </div>
</template>
