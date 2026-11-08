<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label?: string; hint?: string }>()
</script>

<template>
  <label class="flex cursor-pointer items-center justify-between gap-4 py-2">
    <span class="min-w-0">
      <span class="block text-sm">{{ label }}</span>
      <span v-if="hint" class="block text-xs text-zinc-500 dark:text-zinc-400">{{ hint }}</span>
    </span>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      class="relative h-6 w-11 shrink-0 rounded-full transition"
      :class="model ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-600'"
      @click="model = !model"
    >
      <span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition" :class="model ? 'translate-x-5' : ''" />
    </button>
  </label>
</template>
