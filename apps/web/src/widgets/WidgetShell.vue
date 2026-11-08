<script setup lang="ts">
/** 卡片外壳：统一圆角、毛玻璃与标题栏 */
defineProps<{ title?: string; dense?: boolean }>()
</script>

<template>
  <div class="@container glass flex h-full w-full flex-col overflow-hidden rounded-[22px] text-zinc-800 shadow-lg dark:text-zinc-100">
    <div v-if="title || $slots.actions" class="flex shrink-0 items-center justify-between px-3.5 pt-2.5 pb-1">
      <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{{ title }}</span>
      <div class="flex items-center gap-0.5"><slot name="actions" /></div>
    </div>
    <div class="min-h-0 flex-1" :class="dense ? '' : 'px-3.5 pb-3'"><slot /></div>
  </div>
</template>
