<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onKeyStroke } from '@vueuse/core'

const props = withDefaults(defineProps<{ open: boolean; title?: string; width?: string; bodyClass?: string }>(), { width: '520px', bodyClass: 'p-5' })
const emit = defineEmits<{ close: [] }>()
onKeyStroke('Escape', () => props.open && emit('close'))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[900] flex items-center justify-center bg-black/30 p-3 backdrop-blur-[2px]" @mousedown.self="emit('close')">
        <Transition name="pop" appear>
          <div
            class="glass flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl text-zinc-800 shadow-2xl dark:text-zinc-100"
            :style="{ maxWidth: width }"
            role="dialog"
            @contextmenu.stop
          >
            <header v-if="title || $slots.header" class="flex items-center justify-between border-b border-black/5 px-5 py-3.5 dark:border-white/5">
              <slot name="header"><h2 class="text-base font-semibold">{{ title }}</h2></slot>
              <button class="rounded-md p-1 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10" aria-label="关闭" @click="emit('close')"><X :size="18" /></button>
            </header>
            <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto" :class="bodyClass"><slot /></div>
            <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-black/5 px-5 py-3 dark:border-white/5"><slot name="footer" /></footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
