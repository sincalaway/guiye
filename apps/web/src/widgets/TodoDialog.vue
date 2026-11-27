<script setup lang="ts">
/** 待办窗口（子幽样式）：左侧搜索 + 所有/今天/最近七天 + 自定义清单，右侧列表与底部输入 */
import { computed, ref } from 'vue'
import { Search, Check, X, ListTodo, CalendarCheck, CalendarRange, List, Plus } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { today0, DAY } from './dateUtils'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const app = useAppStore()
const ui = useUiStore()
const view = ref<string>('all') // all | today | week | list:<名称>
const q = ref('')
const draft = ref('')
const targetList = ref('')

const inView = (v: string, t: { createdAt: number; list?: string }) => {
  if (v === 'today') return t.createdAt >= today0().getTime()
  if (v === 'week') return t.createdAt >= today0().getTime() - 6 * DAY
  if (v.startsWith('list:')) return (t.list ?? '') === v.slice(5)
  return true
}
const countOf = (v: string) => app.data.todos.filter((t) => !t.done && inView(v, t)).length
const items = computed(() => {
  const k = q.value.trim()
  return app.data.todos.filter((t) => inView(view.value, t) && (!k || t.text.includes(k))).sort((a, b) => Number(a.done) - Number(b.done))
})
const title = computed(() => (view.value === 'today' ? '今天' : view.value === 'week' ? '最近七天' : view.value.startsWith('list:') ? view.value.slice(5) : '所有待办'))

function add() {
  const list = view.value.startsWith('list:') ? view.value.slice(5) : targetList.value
  if (app.addTodo(draft.value, list || undefined)) draft.value = ''
}
async function newList() {
  const name = window.prompt('新建清单名称')?.trim()
  if (!name) return
  if (app.data.todoLists.includes(name)) return ui.toast('清单已存在', 'error')
  app.data.todoLists.push(name)
  view.value = `list:${name}`
}
async function removeList(name: string) {
  if (!(await ui.confirm(`删除清单「${name}」？其中的待办会移到默认清单。`))) return
  app.data.todoLists = app.data.todoLists.filter((x) => x !== name)
  app.data.todos.forEach((t) => t.list === name && delete t.list)
  if (view.value === `list:${name}`) view.value = 'all'
}
</script>

<template>
  <Modal :open="open" width="720px" body-class="p-0" @close="emit('close')">
    <div class="flex h-[min(460px,75vh)] flex-col sm:flex-row" @keydown.stop>
      <aside class="flex shrink-0 flex-col gap-1 bg-[#f7f8fa] p-3 text-[13px] sm:w-[190px] dark:bg-zinc-800/60">
        <label class="mb-1 flex items-center gap-1.5 rounded-lg bg-white px-2.5 dark:bg-zinc-700">
          <Search :size="14" class="text-zinc-400" />
          <input v-model="q" class="min-w-0 flex-1 bg-transparent py-1.5 outline-none" placeholder="搜索待办" />
        </label>
        <button v-for="f in [{ v: 'all', l: '所有', i: ListTodo }, { v: 'today', l: '今天', i: CalendarCheck }, { v: 'week', l: '最近七天', i: CalendarRange }]" :key="f.v" class="gy-todo-nav" :class="{ 'is-active': view === f.v }" @click="view = f.v">
          <component :is="f.i" :size="15" />{{ f.l }}<span class="ml-auto text-xs text-zinc-400">{{ countOf(f.v) }}</span>
        </button>
        <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div v-for="name in app.data.todoLists" :key="name" class="gy-todo-nav group" :class="{ 'is-active': view === `list:${name}` }" role="button" @click="view = `list:${name}`">
            <List :size="15" /><span class="min-w-0 truncate">{{ name }}</span>
            <span class="ml-auto text-xs text-zinc-400 group-hover:hidden">{{ countOf(`list:${name}`) }}</span>
            <button class="ml-auto hidden text-zinc-400 group-hover:block hover:text-red-500" title="删除清单" @click.stop="removeList(name)"><X :size="13" /></button>
          </div>
        </div>
        <button class="mt-1 flex items-center justify-center gap-1 rounded-lg bg-[#1677ff]/10 py-1.5 text-[#1677ff] hover:bg-[#1677ff]/15" @click="newList"><Plus :size="14" />新建列表</button>
      </aside>
      <section class="flex min-h-0 flex-1 flex-col p-4">
        <header class="mb-2 flex items-center justify-between">
          <h3 class="text-[15px] font-bold">{{ title }}</h3>
          <select v-if="!view.startsWith('list:')" v-model="targetList" class="gy-input !w-auto !py-1 text-xs" title="新待办加入的清单">
            <option value="">请选择</option>
            <option v-for="n in app.data.todoLists" :key="n" :value="n">{{ n }}</option>
          </select>
        </header>
        <ul class="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          <li v-for="t in items" :key="t.id" class="group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">
            <button class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border" :class="t.done ? 'border-[#1677ff] bg-[#1677ff] text-white' : 'border-zinc-300'" @click="app.toggleTodo(t.id)">
              <Check v-if="t.done" :size="12" :stroke-width="3" />
            </button>
            <span class="min-w-0 flex-1" :class="{ 'text-zinc-400 line-through': t.done }">{{ t.text }}</span>
            <span v-if="t.list && !view.startsWith('list:')" class="shrink-0 rounded bg-black/5 px-1.5 text-[11px] text-zinc-500 dark:bg-white/10">{{ t.list }}</span>
            <button class="shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500" aria-label="删除" @click="app.removeTodo(t.id)"><X :size="14" /></button>
          </li>
          <li v-if="!items.length" class="flex h-full items-center justify-center text-sm text-zinc-400">暂无待办哟</li>
        </ul>
        <form class="mt-2" @submit.prevent="add">
          <input v-model="draft" class="h-10 w-full rounded-full bg-[#f2f3f5] px-4 text-sm outline-none focus:ring-1 focus:ring-[#1677ff] dark:bg-zinc-800" placeholder="请输入待办内容，回车添加" />
        </form>
      </section>
    </div>
  </Modal>
</template>

<style scoped>
.gy-todo-nav { display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 7px 10px; color: rgb(82 82 91); cursor: pointer; }
.gy-todo-nav:hover { background: rgb(0 0 0 / 0.04); }
.gy-todo-nav.is-active { background: #fff; color: #1677ff; font-weight: 500; box-shadow: 0 1px 2px rgb(0 0 0 / 0.06); }
:global(.dark) .gy-todo-nav { color: rgb(212 212 216); }
:global(.dark) .gy-todo-nav.is-active { background: rgb(63 63 70); color: #7dd3fc; }
</style>
