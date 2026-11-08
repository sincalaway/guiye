<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { Icon } from '@iconify/vue'
import { colorFromString, textIconOf, type SiteItem } from '@guiye/shared'
import { useIconUrl } from '@/composables/useSite'
import { resolveMediaUrl } from '@/services/storage'

/** 渲染网站图标：图片（favicon/远程/上传）、文字、Iconify */
const props = defineProps<{ item: Pick<SiteItem, 'icon' | 'url' | 'title' | 'bgColor'>; size?: number }>()
const iconUrl = useIconUrl()
const failed = ref(false)
const src = ref('')

watchEffect(async () => {
  failed.value = false
  const raw = iconUrl(props.item)
  src.value = raw ? await resolveMediaUrl(raw) : ''
})
watch(() => props.item.url, () => (failed.value = false))

const bg = computed(() => props.item.bgColor || colorFromString(props.item.title || props.item.url))
const showText = computed(() => props.item.icon.kind === 'text' || (!src.value && props.item.icon.kind !== 'iconify') || failed.value)
const text = computed(() => (props.item.icon.kind === 'text' && props.item.icon.value ? props.item.icon.value.slice(0, 2) : textIconOf(props.item.title)))
</script>

<template>
  <div class="relative flex h-full w-full items-center justify-center overflow-hidden" :style="showText || item.icon.kind === 'iconify' ? { background: bg } : { background: '#fff' }">
    <span v-if="showText" class="font-semibold text-white select-none" :style="{ fontSize: `${(size ?? 60) * (text.length > 1 ? 0.34 : 0.42)}px` }">{{ text }}</span>
    <Icon v-else-if="item.icon.kind === 'iconify'" :icon="item.icon.value" class="text-white" :style="{ fontSize: `${(size ?? 60) * 0.58}px` }" />
    <img v-else :src="src" alt="" class="h-[72%] w-[72%] object-contain" loading="lazy" draggable="false" referrerpolicy="no-referrer" @error="failed = true" />
  </div>
</template>
