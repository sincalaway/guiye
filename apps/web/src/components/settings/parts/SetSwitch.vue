<script setup lang="ts">
/** 设置行 + 开关（Element 风格 40×20） */
import SetRow from './SetRow.vue'
const model = defineModel<boolean>({ required: true })
defineProps<{ label: string; hint?: string; off?: string; on?: string }>()
</script>

<template>
  <SetRow :label="label" :hint="hint">
    <span v-if="off" class="text-xs" :class="!model ? 'text-[#1677ff]' : ''">{{ off }}</span>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-label="label"
      class="relative h-5 w-10 shrink-0 rounded-full transition-colors"
      :class="model ? 'bg-[#1677ff]' : 'bg-zinc-300 dark:bg-zinc-600'"
      @click="model = !model"
    >
      <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" :class="model ? 'translate-x-5' : ''" />
    </button>
    <span v-if="on" class="text-xs" :class="model ? 'text-[#1677ff]' : ''">{{ on }}</span>
  </SetRow>
</template>
