<script setup lang="ts">
/** 设置行：左侧名称，右侧控件（子幽样式，行高 46px） */
import { ChevronRight } from 'lucide-vue-next'
defineProps<{ label: string; hint?: string; chevron?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <component
    :is="chevron ? 'button' : 'div'"
    class="flex min-h-[46px] w-full items-center justify-between gap-4 text-left text-[13px]"
    :class="chevron ? 'rounded-lg px-1 hover:bg-black/[0.04] dark:hover:bg-white/5' : ''"
    @click="$emit('click')"
  >
    <span class="min-w-0">
      <span class="block">{{ label }}</span>
      <span v-if="hint" class="block text-xs text-zinc-400">{{ hint }}</span>
    </span>
    <span class="flex shrink-0 items-center gap-2 text-zinc-400">
      <slot />
      <ChevronRight v-if="chevron" :size="16" />
    </span>
  </component>
</template>
