<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { widget } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { WIDGETS } from '@/widgets/registry'
import { IS_EXTENSION } from '@/platform'

const app = useAppStore()
const ui = useUiStore()
const s = computed(() => app.settings)

function add(kind: string) {
  const def = WIDGETS.find((w) => w.kind === kind)!
  app.addItem(widget(kind, def.defaultSize, def.defaultConfig()))
  ui.toast(`已添加「${def.name}」到「${app.activeCategory.name}」`, 'success')
}

async function deleteNote(id: string) {
  if (await ui.confirm('删除这条笔记？')) app.data.notes = app.data.notes.filter((n) => n.id !== id)
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h3 class="mb-2 text-sm font-semibold">添加组件到当前分类</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="w in WIDGETS" :key="w.kind" class="gy-btn-ghost" @click="add(w.kind)"><Plus :size="14" />{{ w.name }}</button>
      </div>
    </div>

    <div>
      <h3 class="mb-1 text-sm font-semibold">热搜 API 地址</h3>
      <p class="mb-2 text-xs leading-relaxed text-zinc-500">
        微博/百度/知乎不允许网页直接跨域请求，需要一个代理。<span v-if="IS_EXTENSION">扩展版可直接请求，留空即可。</span>
        <span v-else>开发环境与 Docker 部署已内置 <code>/api/hot</code> 代理，留空即可；纯静态托管时请填写自部署的 hot-proxy（Cloudflare Worker）或兼容 DailyHotApi 的地址。</span>
      </p>
      <input v-model.trim="s.hotApiBase" class="gy-input" placeholder="如 https://hot.example.workers.dev（留空为自动）" />
    </div>

    <div>
      <h3 class="mb-2 text-sm font-semibold">记事本（{{ app.data.notes.length }}）</h3>
      <div v-if="app.data.notes.length" class="divide-y divide-black/5 rounded-xl border border-black/5 dark:divide-white/5 dark:border-white/5">
        <div v-for="n in app.data.notes" :key="n.id" class="flex items-center gap-2 px-3 py-2">
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm">{{ n.title || '无标题' }}</div>
            <div class="text-[11px] text-zinc-400">{{ new Date(n.updatedAt).toLocaleString() }} · {{ n.content.length }} 字</div>
          </div>
          <button class="rounded p-1 text-zinc-400 hover:text-red-500" title="删除" @click="deleteNote(n.id)"><Trash2 :size="14" /></button>
        </div>
      </div>
      <p v-else class="text-xs text-zinc-400">还没有笔记，添加一个记事本组件开始记录。</p>
    </div>
  </section>
</template>
