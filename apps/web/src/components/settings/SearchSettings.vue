<script setup lang="ts">
import { computed, reactive } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical, Trash2, Search, Plus, RotateCcw } from 'lucide-vue-next'
import { BUILTIN_ENGINES, faviconUrl, uid } from '@guiye/shared'
import Toggle from '@/components/common/Toggle.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'

const app = useAppStore()
const ui = useUiStore()
const s = computed(() => app.settings.search)
const form = reactive({ name: '', url: '' })

function add() {
  const url = form.url.trim()
  if (!form.name.trim() || !/^https?:\/\//.test(url)) return ui.toast('请填写名称和以 http 开头的地址', 'error')
  if (!url.includes('%s')) return ui.toast('地址中需要用 %s 表示关键词', 'error')
  s.value.engines.push({ id: uid('e_'), name: form.name.trim(), url, icon: faviconUrl(url, 'iconhorse') })
  form.name = ''
  form.url = ''
}

function remove(id: string) {
  if (s.value.engines.length <= 1) return
  s.value.engines = s.value.engines.filter((e) => e.id !== id)
  if (s.value.engineId === id) s.value.engineId = s.value.engines[0]!.id
}

function restore() {
  const custom = s.value.engines.filter((e) => !e.builtin)
  s.value.engines = [...BUILTIN_ENGINES.map((e) => ({ ...e })), ...custom]
}
</script>

<template>
  <section class="space-y-5">
    <div>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold">搜索引擎 <span class="font-normal text-zinc-400">（拖动排序，搜索框内按 Tab 切换）</span></h3>
        <button class="flex items-center gap-1 text-xs text-zinc-500 hover:text-brand-500" @click="restore"><RotateCcw :size="12" />恢复内置</button>
      </div>
      <VueDraggable v-model="s.engines" :animation="160" handle=".handle" class="divide-y divide-black/5 rounded-xl border border-black/5 dark:divide-white/5 dark:border-white/5">
        <div v-for="e in s.engines" :key="e.id" class="flex items-center gap-2 px-3 py-2">
          <GripVertical :size="15" class="handle cursor-grab text-zinc-400" />
          <img v-if="e.icon" :src="e.icon" alt="" class="h-5 w-5 rounded" referrerpolicy="no-referrer" />
          <Search v-else :size="18" />
          <div class="min-w-0 flex-1">
            <div class="text-sm">{{ e.name }}</div>
            <div class="truncate text-[11px] text-zinc-400">{{ e.url }}</div>
          </div>
          <button
            class="rounded-md px-2 py-0.5 text-xs"
            :class="s.engineId === e.id ? 'bg-brand-500 text-white' : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10'"
            @click="s.engineId = e.id"
          >
            {{ s.engineId === e.id ? '默认' : '设为默认' }}
          </button>
          <button class="rounded p-1 text-zinc-400 hover:text-red-500" title="删除" @click="remove(e.id)"><Trash2 :size="14" /></button>
        </div>
      </VueDraggable>
      <div class="mt-2 flex flex-wrap gap-2">
        <input v-model="form.name" class="gy-input !w-32" placeholder="名称" />
        <input v-model="form.url" class="gy-input min-w-60 flex-1" placeholder="https://example.com/search?q=%s" @keydown.enter="add" />
        <button class="gy-btn-primary" @click="add"><Plus :size="15" />添加</button>
      </div>
    </div>
    <div>
      <h3 class="mb-1 text-sm font-semibold">搜索行为</h3>
      <Toggle v-model="s.openInNewTab" label="在新标签页打开搜索结果" />
      <Toggle v-model="s.suggestions" label="搜索建议" hint="输入时显示联想词（百度/Google 建议接口）" />
      <Toggle v-model="s.history" label="记录搜索历史" hint="仅保存在本地，聚焦空搜索框时显示" />
      <Toggle v-model="s.translate" label="快捷翻译" hint="输入时在下拉框中显示中英互译结果" />
      <div v-if="s.translate" class="mt-1">
        <label class="gy-label">翻译服务</label>
        <select v-model="s.translateProvider" class="gy-input">
          <option value="mymemory">MyMemory（免费，国内可用，每日有额度）</option>
          <option value="google">Google（需能访问 Google）</option>
        </select>
      </div>
    </div>
  </section>
</template>
