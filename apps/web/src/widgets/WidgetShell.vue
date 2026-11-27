<script setup lang="ts">
/**
 * 卡片外壳：统一圆角与标题栏。
 * tone：glass 默认毛玻璃；dark 深色半透明（热搜、待办）；light 浅色渐变（天气）；solid 白底（记事本、日历）
 */
withDefaults(defineProps<{ title?: string; dense?: boolean; tone?: 'glass' | 'dark' | 'light' | 'solid' }>(), { tone: 'glass' })
</script>

<template>
  <div
    class="@container flex h-full w-full flex-col overflow-hidden rounded-[18px] shadow-[0_6px_24px_rgb(0_0_0/0.18)]"
    :class="{
      'glass text-zinc-800 dark:text-zinc-100': tone === 'glass',
      'gy-tone-dark text-white': tone === 'dark',
      'gy-tone-light text-zinc-800': tone === 'light',
      'bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100': tone === 'solid',
    }"
  >
    <div v-if="title || $slots.actions" class="flex shrink-0 items-center justify-between px-3.5 pt-2.5 pb-1">
      <span class="text-xs font-semibold opacity-60">{{ title }}</span>
      <div class="flex items-center gap-0.5"><slot name="actions" /></div>
    </div>
    <div class="min-h-0 flex-1" :class="dense ? '' : 'px-3.5 pb-3'"><slot /></div>
  </div>
</template>

<style>
.gy-tone-dark {
  background: rgb(30 30 34 / 0.55);
  backdrop-filter: blur(18px) saturate(1.3);
  -webkit-backdrop-filter: blur(18px) saturate(1.3);
}
.gy-tone-light {
  background: linear-gradient(135deg, rgb(255 247 237 / 0.96), rgb(239 246 255 / 0.96) 60%, rgb(224 242 254 / 0.96));
}
</style>
