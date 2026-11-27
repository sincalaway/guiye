<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, X, Check, ClipboardList } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import TodoDialog from './TodoDialog.vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const app = useAppStore()
const draft = ref('')
const dialog = ref(false)
const todos = computed(() => app.data.todos)
const pending = computed(() => todos.value.filter((t) => !t.done).length)
const wide = computed(() => props.cols >= 4 || props.rows >= 4)

function add() {
  if (app.addTodo(draft.value)) draft.value = ''
}
</script>

<template>
  <WidgetShell dense tone="dark">
    <div class="flex h-full flex-col px-3.5 pt-3 pb-2.5">
      <!-- 头部：未完成数量 + To Do（与子幽一致） -->
      <div class="flex shrink-0 cursor-pointer items-end gap-2" title="打开待办" @click="dialog = true">
        <ClipboardList :size="30" class="text-amber-400" :stroke-width="1.8" />
        <span class="text-[28px] leading-none font-semibold tabular-nums">{{ pending }}</span>
        <span class="pb-0.5 text-[12px] leading-tight font-semibold text-white/70">To<br />Do</span>
        <button v-if="todos.some((t) => t.done)" class="ml-auto text-[11px] text-white/50 hover:text-red-300" @click.stop="app.clearDoneTodos()">清除已完成</button>
      </div>
      <ul class="scrollbar-thin mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        <li v-for="t in todos" :key="t.id" class="group flex items-center gap-2 rounded-md px-1 py-1 text-[13px] hover:bg-white/10">
          <button
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition"
            :class="t.done ? 'border-brand-500 bg-brand-500 text-white' : 'border-white/50'"
            :aria-label="t.done ? '标为未完成' : '完成'"
            @click="app.toggleTodo(t.id)"
          >
            <Check v-if="t.done" :size="11" :stroke-width="3" />
          </button>
          <span class="min-w-0 flex-1 truncate" :class="{ 'text-white/40 line-through': t.done }" :title="t.text">{{ t.text }}</span>
          <button class="shrink-0 text-white/50 opacity-0 group-hover:opacity-100 hover:text-red-500" aria-label="删除" @click="app.removeTodo(t.id)"><X :size="13" /></button>
        </li>
        <li v-if="!todos.length" class="flex h-full items-center justify-center pb-4 text-xs text-white/60">暂无待办哟</li>
      </ul>
      <form class="mt-1 flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2" @submit.prevent="add">
        <input v-model="draft" class="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] outline-none placeholder:text-white/40" :placeholder="wide ? '添加待办，回车保存' : '添加待办'" @keydown.stop />
        <button type="submit" class="text-white/60 hover:text-white" aria-label="添加"><Plus :size="15" /></button>
      </form>
    </div>
  </WidgetShell>
  <TodoDialog :open="dialog" @close="dialog = false" />
</template>
