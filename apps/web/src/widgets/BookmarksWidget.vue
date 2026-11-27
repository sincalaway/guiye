<script setup lang="ts">
/** 书签管理：卡片本身是入口（子幽样式），点击打开管理窗口 */
import { computed, ref } from 'vue'
import { Bookmark, Search, Trash2, ExternalLink, Plus } from 'lucide-vue-next'
import { site, type SiteItem, type WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import Modal from '@/components/common/Modal.vue'
import SiteIcon from '@/components/common/SiteIcon.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useOpenSite } from '@/composables/useSite'
import { canReadBrowserBookmarks, readBrowserBookmarks } from '@/services/bookmarks'

defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const app = useAppStore()
const ui = useUiStore()
const openSite = useOpenSite()
const open = ref(false)
const tab = ref<'mine' | 'browser'>('mine')
const q = ref('')
const browserGroups = ref<Awaited<ReturnType<typeof readBrowserBookmarks>>>([])
const browserAvailable = canReadBrowserBookmarks()

/** 归页里的全部网站（含文件夹内），按分类分组 */
const mine = computed(() => {
  const kw = q.value.trim().toLowerCase()
  return app.categories
    .map((c) => {
      const sites: { s: SiteItem; where: string }[] = []
      for (const it of c.items) {
        if (it.type === 'site') sites.push({ s: it, where: c.name })
        else if (it.type === 'folder') it.children.forEach((s) => sites.push({ s, where: `${c.name} / ${it.title}` }))
      }
      return { id: c.id, name: c.name, sites: sites.filter(({ s }) => !kw || s.title.toLowerCase().includes(kw) || s.url.toLowerCase().includes(kw)) }
    })
    .filter((g) => g.sites.length)
})
const total = computed(() => mine.value.reduce((n, g) => n + g.sites.length, 0))

const browser = computed(() => {
  const kw = q.value.trim().toLowerCase()
  return browserGroups.value
    .map((g) => ({ ...g, bookmarks: g.bookmarks.filter((b) => !kw || b.title.toLowerCase().includes(kw) || b.url.toLowerCase().includes(kw)) }))
    .filter((g) => g.bookmarks.length)
})

async function show() {
  open.value = true
  if (browserAvailable && !browserGroups.value.length) browserGroups.value = await readBrowserBookmarks().catch(() => [])
}
function addToCurrent(b: { title: string; url: string }) {
  app.addItem(site(b.title.slice(0, 40), b.url))
  ui.toast(`已添加到「${app.activeCategory.name}」`, 'success')
}
function remove(s: SiteItem) {
  app.removeItems([s.id])
  ui.toast(`已删除「${s.title}」，可在回收站恢复`)
}
</script>

<template>
  <WidgetShell dense>
    <button class="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-rose-400 to-rose-500 text-white" @click="show">
      <Bookmark :size="34" :stroke-width="1.6" />
      <span class="text-xs opacity-90">书签管理</span>
    </button>
  </WidgetShell>

  <Modal :open="open" title="书签管理" width="760px" body-class="p-0" @close="open = false">
    <div class="flex items-center gap-2 border-b border-black/5 px-5 py-3 dark:border-white/5">
      <div class="flex gap-1">
        <button class="rounded-lg px-3 py-1.5 text-sm" :class="tab === 'mine' ? 'bg-black/5 font-medium dark:bg-white/10' : 'text-zinc-500'" @click="tab = 'mine'">我的书签</button>
        <button v-if="browserAvailable" class="rounded-lg px-3 py-1.5 text-sm" :class="tab === 'browser' ? 'bg-black/5 font-medium dark:bg-white/10' : 'text-zinc-500'" @click="tab = 'browser'">浏览器书签</button>
      </div>
      <label class="ml-auto flex w-56 items-center gap-1.5 rounded-lg bg-black/5 px-2.5 dark:bg-white/10">
        <Search :size="14" class="text-zinc-400" />
        <input v-model="q" class="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none" placeholder="搜索标题或网址" @keydown.stop />
      </label>
    </div>
    <div class="h-[60vh] overflow-y-auto px-5 py-3 scrollbar-thin">
      <template v-if="tab === 'mine'">
        <div class="mb-2 text-xs text-zinc-400">共 {{ total }} 个网站</div>
        <section v-for="g in mine" :key="g.id" class="mb-4">
          <h3 class="mb-1 text-xs font-semibold text-zinc-500">{{ g.name }}</h3>
          <div v-for="{ s, where } in g.sites" :key="s.id" class="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <div class="h-7 w-7 shrink-0"><SiteIcon :item="s" :size="28" /></div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm">{{ s.title }}</div>
              <div class="truncate text-xs text-zinc-400">{{ s.url }}<span v-if="where !== g.name"> · {{ where }}</span></div>
            </div>
            <button class="rounded p-1 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-brand-500" title="打开" @click="openSite(s)"><ExternalLink :size="15" /></button>
            <button class="rounded p-1 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500" title="删除" @click="remove(s)"><Trash2 :size="15" /></button>
          </div>
        </section>
        <div v-if="!total" class="py-16 text-center text-sm text-zinc-400">没有匹配的书签</div>
      </template>
      <template v-else>
        <section v-for="g in browser" :key="g.path.join('/') + g.name" class="mb-4">
          <h3 class="mb-1 text-xs font-semibold text-zinc-500">{{ g.path.join(' / ') || g.name }}</h3>
          <div v-for="b in g.bookmarks" :key="b.url" class="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <div class="min-w-0 flex-1">
              <a :href="b.url" target="_blank" rel="noopener" class="block truncate text-sm hover:text-brand-500">{{ b.title }}</a>
              <div class="truncate text-xs text-zinc-400">{{ b.url }}</div>
            </div>
            <button class="rounded p-1 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-brand-500" title="添加到当前分类" @click="addToCurrent(b)"><Plus :size="15" /></button>
          </div>
        </section>
        <div v-if="!browser.length" class="py-16 text-center text-sm text-zinc-400">没有读取到浏览器书签</div>
      </template>
    </div>
  </Modal>
</template>
