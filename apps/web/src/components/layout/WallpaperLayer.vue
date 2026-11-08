<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Wallpaper } from '@guiye/shared'
import { resolveMediaUrl } from '@/services/storage'

const props = defineProps<{ wallpaper: Wallpaper; mask: number; blur: number; dark: boolean }>()
const src = ref('')
const loaded = ref(false)
const failed = ref(false)
const FALLBACK = 'linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)'

watch(
  () => props.wallpaper.value,
  async () => {
    loaded.value = false
    failed.value = false
    const w = props.wallpaper
    src.value = w.type === 'image' || w.type === 'video' ? await resolveMediaUrl(w.value) : ''
    if (w.type === 'color' || w.type === 'gradient') loaded.value = true
  },
  { immediate: true },
)
</script>

<template>
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-900">
    <div
      class="absolute inset-0 transition-opacity duration-700"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      :style="{ filter: blur ? `blur(${blur}px)` : undefined, transform: blur ? 'scale(1.06)' : undefined }"
    >
      <div v-if="failed" class="h-full w-full" :style="{ background: FALLBACK }" />
      <img v-else-if="wallpaper.type === 'image' && src" :src="src" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" @load="loaded = true" @error="(failed = true), (loaded = true)" />
      <video
        v-else-if="wallpaper.type === 'video' && src"
        :src="src"
        class="h-full w-full object-cover"
        autoplay
        muted
        loop
        playsinline
        @loadeddata="loaded = true"
        @error="(failed = true), (loaded = true)"
      />
      <div v-else class="h-full w-full" :style="{ background: wallpaper.value }" />
    </div>
    <div class="absolute inset-0" :style="{ background: `rgba(0,0,0,${mask + (dark ? 0.12 : 0)})` }" />
  </div>
</template>
