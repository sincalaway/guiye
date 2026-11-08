<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Eye, Pencil, Maximize2 } from 'lucide-vue-next'
import type { WidgetItem } from '@guiye/shared'
import WidgetShell from './WidgetShell.vue'
import Modal from '@/components/common/Modal.vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ item: WidgetItem; cols: number; rows: number }>()
const app = useAppStore()
const preview = ref(false)
const expanded = ref(false)

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
  <WidgetShell title="记事本">
    <template #actions>
      <button class="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" :title="preview ? '编辑' : '预览 Markdown'" @click="preview = !preview">
        <Pencil v-if="preview" :size="13" /><Eye v-else :size="13" />
      </button>
      <button class="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" title="放大编辑" @click="expanded = true"><Maximize2 :size="13" /></button>
    </template>
    <div v-if="preview" class="gy-md scrollbar-thin h-full overflow-y-auto text-sm" v-html="html" />
    <textarea
      v-else
      v-bind:value="content"
      class="scrollbar-thin h-full w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-zinc-400"
      placeholder="写点什么…（支持 Markdown）"
      @input="content = ($event.target as HTMLTextAreaElement).value"
      @keydown.stop
    />
    <Modal :open="expanded" title="记事本" width="760px" @close="expanded = false">
      <div class="grid h-[60vh] gap-4 md:grid-cols-2">
        <textarea v-model="content" class="gy-input h-full resize-none font-mono leading-relaxed" placeholder="支持 Markdown" @keydown.stop />
        <div class="gy-md scrollbar-thin h-full overflow-y-auto rounded-lg bg-black/[0.03] p-3 text-sm dark:bg-white/5" v-html="html" />
      </div>
    </Modal>
  </WidgetShell>
</template>

<style>
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
