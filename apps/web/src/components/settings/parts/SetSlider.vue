<script setup lang="ts">
/** 设置行 + 滑块（显示当前值） */
const model = defineModel<number>({ required: true })
withDefaults(defineProps<{ label: string; min: number; max: number; step?: number; unit?: string }>(), { step: 1, unit: '' })
</script>

<template>
  <div class="flex min-h-[46px] items-center gap-4 text-[13px]">
    <span class="w-28 shrink-0">{{ label }}</span>
    <input v-model.number="model" type="range" :min="min" :max="max" :step="step" class="gy-range min-w-0 flex-1" :aria-label="label" />
    <span class="w-10 shrink-0 text-right text-xs text-zinc-500 tabular-nums">{{ model }}{{ unit }}</span>
  </div>
</template>

<style scoped>
.gy-range {
  accent-color: #1677ff;
  height: 4px;
}
</style>
