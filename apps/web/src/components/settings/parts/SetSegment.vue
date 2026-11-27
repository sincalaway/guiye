<script setup lang="ts" generic="T extends string">
/** 设置行 + 分段按钮 */
import SetRow from './SetRow.vue'
const model = defineModel<T>({ required: true })
defineProps<{ label: string; options: { v: T; l: string }[] }>()
</script>

<template>
  <SetRow :label="label">
    <span class="flex rounded-md border border-black/10 p-0.5 dark:border-white/10">
      <button
        v-for="o in options"
        :key="o.v"
        type="button"
        class="rounded px-3 py-1 text-xs transition"
        :class="model === o.v ? 'bg-[#1677ff] text-white' : 'text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10'"
        @click="model = o.v"
      >
        {{ o.l }}
      </button>
    </span>
  </SetRow>
</template>
