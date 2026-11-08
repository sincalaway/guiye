<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Plus, Search } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { SITE_LIBRARY, hostnameOf, parseSize, site, widget, type LibrarySite } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { WIDGETS, type WidgetDef } from '@/widgets/registry'

const app = useAppStore()
const ui = useUiStore()
const group = ref(SITE_LIBRARY[0]!.id)
const kw = ref('')

const sites = computed<LibrarySite[]>(() => {
  const k = kw.value.trim().toLowerCase()
  if (k) return SITE_LIBRARY.flatMap((g) => g.sites).filter((s) => s.title.toLowerCase().includes(k) || s.url.includes(k))
  return SITE_LIBRARY.find((g) => g.id === group.value)?.sites ?? []
})

/** 当前分类中已存在的域名 */
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
  ui.toast(`已添加「${w.name}」`, 'success')
}

function custom() {
  ui.libraryOpen = false
  ui.editSite(null)
}

const TABS = [
  { id: 'sites', label: '网站库' },
  { id: 'widgets', label: '组件' },
] as const
</script>

<template>
  <Modal :open="ui.libraryOpen" width="760px" body-class="p-0" @close="ui.libraryOpen = false">
    <template #header>
      <div class="flex items-center gap-1">
        <button
          v-for="t in TABS"
          :key="t.id"
          class="rounded-lg px-3 py-1.5 text-sm"
          :class="ui.libraryTab === t.id ? 'bg-brand-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'"
          @click="ui.libraryTab = t.id"
        >
          {{ t.label }}
        </button>
        <button class="rounded-lg px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10" @click="custom">自定义添加</button>
        <span class="ml-2 hidden text-xs text-zinc-400 sm:inline">添加到「{{ app.activeCategory.name }}」</span>
      </div>
    </template>

    <div v-if="ui.libraryTab === 'sites'" class="flex h-[60vh] flex-col sm:flex-row">
      <nav class="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-black/5 p-2 sm:w-32 sm:flex-col sm:border-r sm:border-b-0 dark:border-white/5">
        <button
          v-for="g in SITE_LIBRARY"
          :key="g.id"
          class="shrink-0 rounded-lg px-3 py-1.5 text-left text-sm"
          :class="group === g.id && !kw ? 'bg-black/5 font-medium dark:bg-white/10' : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'"
          @click="(group = g.id), (kw = '')"
        >
          {{ g.name }}
        </button>
      </nav>
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="relative p-3 pb-0">
          <Search :size="15" class="absolute top-[22px] left-6 text-zinc-400" />
          <input v-model="kw" class="gy-input !pl-9" placeholder="搜索网站库" />
        </div>
        <div class="scrollbar-thin grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3 sm:grid-cols-3">
          <button
            v-for="s in sites"
            :key="s.url"
            class="flex items-center gap-3 rounded-xl border border-black/5 p-2.5 text-left transition hover:border-brand-500/40 hover:bg-brand-500/5 dark:border-white/5"
            @click="addSite(s)"
          >
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-[26%] shadow">
              <SiteIcon :item="{ title: s.title, url: s.url, icon: { kind: 'favicon' }, bgColor: s.color }" :size="40" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">{{ s.title }}</div>
              <div class="truncate text-xs text-zinc-400">{{ hostnameOf(s.url) }}</div>
            </div>
            <Check v-if="existing.has(hostnameOf(s.url))" :size="16" class="shrink-0 text-emerald-500" />
            <Plus v-else :size="16" class="shrink-0 text-zinc-400" />
          </button>
          <p v-if="!sites.length" class="col-span-full py-10 text-center text-sm text-zinc-400">
            没有找到，<button class="text-brand-500" @click="custom">自定义添加</button>
          </p>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      <div v-for="w in WIDGETS" :key="w.kind" class="flex items-center gap-3 rounded-xl border border-black/5 p-3 dark:border-white/5">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500"><component :is="w.icon" :size="22" /></div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium">{{ w.name }}</div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ w.description }}</div>
          <div class="mt-0.5 text-[11px] text-zinc-400">尺寸：{{ w.sizes.map((s) => `${parseSize(s).cols}×${parseSize(s).rows}`).join(' / ') }}</div>
        </div>
        <button class="gy-btn-primary shrink-0 !px-2.5 !py-1.5" @click="addWidget(w)"><Plus :size="15" />添加</button>
      </div>
    </div>
  </Modal>
</template>
