<script setup lang="ts">
/** 添加标签（子幽样式）：在线添加 / 手动添加 / 卡片组件 */
import { computed, ref, watch } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { Search, Link2 } from 'lucide-vue-next'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { SITE_LIBRARY, hostnameOf, isProbablyUrl, normalizeUrl, parseSize, site, widget, type LibrarySite } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { WIDGETS, type WidgetDef } from '@/widgets/registry'

const app = useAppStore()
const ui = useUiStore()
const group = ref('all')
const kw = ref('')
const PAGE = 12
const page = ref(0)

const GROUPS = computed(() => [{ id: 'all', name: '全部' }, ...SITE_LIBRARY.map((g) => ({ id: g.id, name: g.name }))])
const filtered = computed<LibrarySite[]>(() => {
  const k = kw.value.trim().toLowerCase()
  const pool = group.value === 'all' || k ? SITE_LIBRARY.flatMap((g) => g.sites) : (SITE_LIBRARY.find((g) => g.id === group.value)?.sites ?? [])
  const seen = new Set<string>()
  return pool.filter((s) => {
    if (seen.has(s.url)) return false
    seen.add(s.url)
    return !k || s.title.toLowerCase().includes(k) || s.url.includes(k) || (s.description ?? '').includes(k)
  })
})
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE)))
const sites = computed(() => filtered.value.slice(page.value * PAGE, page.value * PAGE + PAGE))
watch([group, kw], () => (page.value = 0))

const existing = computed(() => {
  const set = new Set<string>()
  for (const it of app.activeCategory.items) {
    if (it.type === 'site') set.add(hostnameOf(it.url))
    if (it.type === 'folder') it.children.forEach((c) => set.add(hostnameOf(c.url)))
  }
  return set
})

function addSite(s: LibrarySite) {
  if (existing.value.has(hostnameOf(s.url))) return
  app.addItem(site(s.title, s.url, { bgColor: s.color, description: s.description }))
  ui.toast(`已添加「${s.title}」到「${app.activeCategory.name}」`, 'success')
}
function addWidget(w: WidgetDef) {
  app.addItem(widget(w.kind, w.defaultSize, w.defaultConfig()))
  ui.toast(`已添加「${w.name}」到「${app.activeCategory.name}」`, 'success')
}

// 手动添加
const manual = ref({ url: '', title: '' })
function addManual() {
  const url = manual.value.url.trim()
  if (!isProbablyUrl(url)) return ui.toast('请输入正确的网址', 'error')
  const title = manual.value.title.trim() || hostnameOf(normalizeUrl(url))
  app.addItem(site(title, normalizeUrl(url)))
  ui.toast(`已添加「${title}」`, 'success')
  manual.value = { url: '', title: '' }
}
function advanced() {
  ui.libraryOpen = false
  ui.editSite(null)
}

const TABS = [
  { id: 'sites', label: '在线添加' },
  { id: 'custom', label: '手动添加' },
  { id: 'widgets', label: '卡片组件' },
] as const
onKeyStroke('Escape', () => ui.libraryOpen && (ui.libraryOpen = false))
const desc = (s: LibrarySite) => s.description || hostnameOf(s.url)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.libraryOpen" class="fixed inset-0 z-[900] flex items-center justify-center bg-black/25 p-3" @mousedown.self="ui.libraryOpen = false" @contextmenu.stop.prevent>
        <Transition name="pop" appear>
          <div class="flex h-[min(560px,90vh)] w-full max-w-[780px] flex-col overflow-hidden rounded-xl bg-white text-zinc-800 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100" role="dialog" aria-label="添加标签">
            <header class="flex shrink-0 items-center justify-between px-4 pt-4">
              <div class="flex rounded-lg bg-[#f2f3f5] p-1 dark:bg-zinc-800">
                <button
                  v-for="t in TABS"
                  :key="t.id"
                  class="rounded-md px-3.5 py-1 text-[13px] transition"
                  :class="ui.libraryTab === t.id ? 'bg-[#1677ff] text-white shadow' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300'"
                  @click="ui.libraryTab = t.id"
                >
                  {{ t.label }}
                </button>
              </div>
              <!-- 红绿灯（右上） -->
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span class="h-3 w-3 rounded-full bg-[#28c840]" />
                <button class="h-3 w-3 rounded-full bg-[#ff5f57] hover:brightness-90" aria-label="关闭" title="关闭" @click="ui.libraryOpen = false" />
              </div>
            </header>

            <!-- 在线添加 -->
            <template v-if="ui.libraryTab === 'sites'">
              <div class="flex shrink-0 justify-center px-4 pt-4">
                <label class="flex w-full max-w-[340px] items-center gap-2 rounded-full bg-[#f2f3f5] px-4 dark:bg-zinc-800">
                  <input v-model="kw" class="min-w-0 flex-1 bg-transparent py-2 text-[13px] outline-none" placeholder="快捷搜索标签" @keydown.stop />
                  <Search :size="15" class="text-zinc-400" />
                </label>
              </div>
              <nav class="no-scrollbar flex shrink-0 gap-4 overflow-x-auto px-5 pt-3 text-[13px]">
                <button
                  v-for="g in GROUPS"
                  :key="g.id"
                  class="shrink-0 border-b-2 pb-1.5 transition"
                  :class="group === g.id && !kw ? 'border-[#1677ff] text-[#1677ff]' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                  @click="(group = g.id), (kw = '')"
                >
                  {{ g.name }}
                </button>
              </nav>
              <div class="scrollbar-thin grid min-h-0 flex-1 grid-cols-1 content-start gap-2.5 overflow-y-auto px-5 py-3 sm:grid-cols-3">
                <div v-for="s in sites" :key="s.url" class="flex min-h-[68px] flex-col rounded-lg bg-[#f7f8fa] p-3 dark:bg-zinc-800">
                  <div class="flex gap-3">
                    <div class="h-10 w-10 shrink-0 overflow-hidden rounded-[10px]">
                      <SiteIcon :item="{ title: s.title, url: s.url, icon: { kind: 'favicon' }, bgColor: s.color }" :size="40" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm font-bold">{{ s.title }}</div>
                      <div class="line-clamp-2 text-xs leading-snug text-zinc-400">{{ desc(s) }}</div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-end gap-2">
                    <a :href="s.url" target="_blank" rel="noopener" class="text-zinc-400 hover:text-[#1677ff]" title="访问"><Link2 :size="14" /></a>
                    <button
                      class="rounded-full px-3 py-0.5 text-xs transition"
                      :class="existing.has(hostnameOf(s.url)) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-200/80 text-zinc-600 hover:bg-[#1677ff] hover:text-white dark:bg-zinc-700 dark:text-zinc-300'"
                      @click="addSite(s)"
                    >
                      {{ existing.has(hostnameOf(s.url)) ? '已添加' : '添加' }}
                    </button>
                  </div>
                </div>
                <p v-if="!sites.length" class="col-span-full py-10 text-center text-sm text-zinc-400">
                  没有找到，<button class="text-[#1677ff]" @click="ui.libraryTab = 'custom'">手动添加</button>
                </p>
              </div>
              <div v-if="pages > 1" class="flex shrink-0 justify-center gap-1.5 pb-3">
                <button v-for="i in pages" :key="i" class="h-2 rounded-full transition-all" :class="page === i - 1 ? 'w-5 bg-[#1677ff]' : 'w-2 bg-zinc-300 dark:bg-zinc-600'" :aria-label="`第 ${i} 页`" @click="page = i - 1" />
              </div>
            </template>

            <!-- 手动添加 -->
            <form v-else-if="ui.libraryTab === 'custom'" class="mx-auto w-full max-w-[420px] space-y-4 px-5 pt-8" @submit.prevent="addManual" @keydown.stop>
              <div>
                <label class="mb-1.5 block text-xs text-[#86909c]">网址</label>
                <input v-model="manual.url" class="gy-input" placeholder="例如 github.com" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs text-[#86909c]">名称（可留空，自动取域名）</label>
                <input v-model="manual.title" class="gy-input" placeholder="网站名称" />
              </div>
              <button type="submit" class="h-10 w-full rounded-lg bg-[#1677ff] text-sm text-white hover:bg-[#4096ff]">添加到「{{ app.activeCategory.name }}」</button>
              <button type="button" class="w-full text-center text-xs text-zinc-400 hover:text-[#1677ff]" @click="advanced">更多选项（图标、颜色、打开方式）</button>
            </form>

            <!-- 卡片组件 -->
            <div v-else class="scrollbar-thin grid min-h-0 flex-1 grid-cols-1 content-start gap-2.5 overflow-y-auto px-5 py-4 sm:grid-cols-3">
              <div v-for="w in WIDGETS" :key="w.kind" class="flex flex-col rounded-lg bg-[#f7f8fa] p-3 dark:bg-zinc-800">
                <div class="flex gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#1677ff]/10 text-[#1677ff]"><component :is="w.icon" :size="21" /></div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-bold">{{ w.name }}</div>
                    <div class="line-clamp-2 text-xs leading-snug text-zinc-400">{{ w.description }}</div>
                  </div>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-[11px] text-zinc-400">{{ w.sizes.map((s) => `${parseSize(s).cols}×${parseSize(s).rows}`).join(' / ') }}</span>
                  <button class="rounded-full bg-zinc-200/80 px-3 py-0.5 text-xs text-zinc-600 transition hover:bg-[#1677ff] hover:text-white dark:bg-zinc-700 dark:text-zinc-300" @click="addWidget(w)">添加</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
