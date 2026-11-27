<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Eye, Pencil, Maximize2, List, Plus, GripVertical, X } from 'lucide-vue-next'
import { VueDraggable } from 'vue-draggable-plus'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import Modal from '@/components/common/Modal.vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const app = useAppStore()
const preview = ref(false)
const expanded = ref(false)
/** 笔记列表（可拖拽排序、切换当前卡片显示的笔记） */
const listOpen = ref(false)
function pick(id: string) {
  props.item.config.noteId = id
  listOpen.value = false
}
function newNote() {
  const n = app.upsertNote({ content: '' })
  pick(n.id)
}
function delNote(id: string) {
  app.data.notes = app.data.notes.filter((n) => n.id !== id)
  if (props.item.config.noteId === id) props.item.config.noteId = ''
}

const note = computed(() => app.data.notes.find((n) => n.id === props.item.config.noteId))

const content = computed({
  get: () => note.value?.content ?? '',
  set: (v: string) => {
    const n = app.upsertNote({ id: (props.item.config.noteId as string) || undefined, content: v, title: v.split('\n')[0]?.slice(0, 30) ?? '' })
    if (props.item.config.noteId !== n.id) props.item.config.noteId = n.id
  },
})

const html = computed(() => DOMPurify.sanitize(marked.parse(content.value || '*空白笔记*', { async: false, breaks: true }) as string))
</script>

<template>
  <WidgetShell dense tone="solid">
    <div class="flex h-full flex-col">
      <!-- 黄色标题栏（子幽样式） -->
      <div class="flex shrink-0 items-center gap-2 bg-[#4b8df8] px-3.5 py-1.5 text-white">
        <span class="text-[15px] font-semibold">记事本</span>
        <button class="opacity-85 hover:opacity-100" :title="preview ? '编辑' : '预览 Markdown'" @click="preview = !preview">
          <Pencil v-if="preview" :size="14" /><Eye v-else :size="15" />
        </button>
        <div class="ml-auto flex items-center gap-1.5">
          <button class="opacity-85 hover:opacity-100" title="全部笔记（可拖拽排序）" @click="listOpen = !listOpen"><List :size="15" /></button>
          <button class="opacity-85 hover:opacity-100" title="放大编辑" @click="expanded = true"><Maximize2 :size="13" /></button>
        </div>
      </div>
      <div v-if="listOpen" class="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-white/90 p-1.5 text-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200">
        <VueDraggable v-model="app.data.notes" :animation="160" handle=".gy-note-handle" class="space-y-0.5">
          <div
            v-for="n in app.data.notes"
            :key="n.id"
            class="group flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-[13px] hover:bg-black/5 dark:hover:bg-white/10"
            :class="{ 'bg-[#4b8df8]/15': n.id === item.config.noteId }"
            @click="pick(n.id)"
          >
            <GripVertical :size="13" class="gy-note-handle shrink-0 cursor-grab text-zinc-400" @click.stop />
            <span class="min-w-0 flex-1 truncate">{{ n.title || '无标题' }}</span>
            <button class="shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-red-500" title="删除笔记" @click.stop="delNote(n.id)"><X :size="13" /></button>
          </div>
        </VueDraggable>
        <button class="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10" @click="newNote"><Plus :size="13" />新建笔记</button>
      </div>
      <template v-else>
        <div v-if="preview" class="gy-md gy-paper scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3.5 text-sm" v-html="html" />
        <textarea
          v-else
          v-bind:value="content"
          class="gy-paper scrollbar-thin min-h-0 w-full flex-1 resize-none px-3.5 text-[15px] outline-none placeholder:text-zinc-400"
          placeholder="写点什么…（支持 Markdown）"
          @input="content = ($event.target as HTMLTextAreaElement).value"
          @keydown.stop
        />
      </template>
    </div>
    <Modal :open="expanded" title="记事本" width="760px" @close="expanded = false">
      <div class="grid h-[60vh] gap-4 md:grid-cols-2">
        <textarea v-model="content" class="gy-input h-full resize-none font-mono leading-relaxed" placeholder="支持 Markdown" @keydown.stop />
        <div class="gy-md scrollbar-thin h-full overflow-y-auto rounded-lg bg-black/[0.03] p-3 text-sm dark:bg-white/5" v-html="html" />
      </div>
    </Modal>
  </WidgetShell>
</template>

<style>
/* 横线信纸（子幽记事本样式） */
.gy-paper {
  background-color: rgb(255 255 255 / 0.92);
  color: #3f3f46;
  line-height: 30px;
  
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 29px, rgb(0 0 0 / 0.08) 29px, rgb(0 0 0 / 0.08) 30px);
  background-attachment: local;
}
.dark .gy-paper { background-color: rgb(39 39 42 / 0.9); color: #e4e4e7; background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 29px, rgb(255 255 255 / 0.08) 29px, rgb(255 255 255 / 0.08) 30px); }

.gy-md h1 { font-size: 1.25em; font-weight: 700; margin: 0.4em 0; }
.gy-md h2 { font-size: 1.12em; font-weight: 700; margin: 0.4em 0; }
.gy-md h3 { font-weight: 600; margin: 0.3em 0; }
.gy-md p { margin: 0.3em 0; }
.gy-md ul { list-style: disc; padding-left: 1.2em; }
.gy-md ol { list-style: decimal; padding-left: 1.2em; }
.gy-md code { background: rgb(127 127 127 / 0.15); padding: 0 0.3em; border-radius: 4px; font-size: 0.9em; }
.gy-md pre { background: rgb(127 127 127 / 0.12); padding: 0.6em; border-radius: 8px; overflow-x: auto; }
.gy-md a { color: var(--color-brand-500); text-decoration: underline; }
.gy-md blockquote { border-left: 3px solid rgb(127 127 127 / 0.4); padding-left: 0.6em; color: rgb(113 113 122); }
.gy-md input[type='checkbox'] { margin-right: 0.3em; }
</style>
