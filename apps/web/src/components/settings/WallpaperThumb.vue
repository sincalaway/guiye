<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Play } from 'lucide-vue-next'
import type { Wallpaper } from '@guiye/shared'
import { resolveMediaUrl } from '@/services/storage'

const props = defineProps<{ w: Wallpaper; active?: boolean }>()
const src = ref('')
watchEffect(async () => {
  const t = props.w.thumb ?? props.w.value
  src.value = props.w.type === 'image' || props.w.type === 'video' ? await resolveMediaUrl(t) : ''
})
</script>

<template>
  <div class="relative aspect-video overflow-hidden rounded-lg bg-zinc-200 ring-offset-2 dark:bg-zinc-700 dark:ring-offset-zinc-900" :class="{ 'ring-2 ring-brand-500': active }">
    <template v-if="w.type === 'image' || w.type === 'video'">
      <video v-if="w.type === 'video' && !w.thumb" :src="src" muted preload="metadata" class="h-full w-full object-cover" />
      <img v-else :src="src" alt="" loading="lazy" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
      <span v-if="w.type === 'video'" class="absolute right-1 bottom-1 rounded bg-black/50 p-0.5 text-white"><Play :size="10" /></span>
    </template>
    <div v-else class="h-full w-full" :style="{ background: w.value }" />
  </div>
</template>
