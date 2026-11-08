<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<template>
  <div class="pointer-events-none fixed top-5 left-1/2 z-[1200] flex -translate-x-1/2 flex-col items-center gap-2">
    <TransitionGroup name="pop">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="glass rounded-full px-4 py-2 text-sm shadow-lg"
        :class="{ 'text-red-600 dark:text-red-400': t.type === 'error', 'text-emerald-700 dark:text-emerald-400': t.type === 'success', 'text-zinc-800 dark:text-zinc-100': t.type === 'info' }"
      >
        {{ t.text }}
      </div>
    </TransitionGroup>
  </div>
</template>
