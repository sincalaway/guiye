<script setup lang="ts">
/** 个人中心入口：侧栏顶部（左侧）或页面右上角（右侧），由 主题标签 → 个人中心位置 决定 */
import { computed } from 'vue'
import { RefreshCw, CloudOff, UserRound } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'

const props = defineProps<{ variant?: 'sidebar' | 'corner' }>()
const ui = useUiStore()
const sync = useSyncStore()
const logoUrl = `${import.meta.env.BASE_URL}logo-light.png`
const signedIn = computed(() => sync.status === 'idle' || sync.status === 'syncing' || (sync.status === 'error' && !!sync.email))
const accountLabel = computed(() => (signedIn.value ? sync.nickname || '已登录' : '登录'))
const avatarText = computed(() => (sync.nickname || sync.email || '?').slice(0, 1).toUpperCase())
const title = computed(() => (signedIn.value ? `已登录：${sync.provider === 'qq' ? 'QQ ' + sync.nickname : sync.email}（点击管理同步）` : '登录以同步数据'))
const open = () => (signedIn.value ? ui.openSettings('account') : (ui.loginOpen = true))
const corner = computed(() => props.variant === 'corner')
</script>

<template>
  <button v-if="corner" class="relative rounded-full p-1 opacity-90 transition hover:bg-white/15 hover:opacity-100" :title="title" @click="open">
    <img v-if="signedIn && sync.avatarUrl" :src="sync.avatarUrl" alt="" class="h-7 w-7 rounded-full object-cover" referrerpolicy="no-referrer" />
    <span v-else-if="signedIn" class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-zinc-700">{{ avatarText }}</span>
    <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><UserRound :size="17" /></span>
    <RefreshCw v-if="sync.status === 'syncing'" :size="10" class="absolute right-0 bottom-0 animate-spin rounded-full bg-black/50 p-px" />
  </button>
  <button v-else class="flex shrink-0 flex-col items-center gap-1 pt-7 pb-4 transition hover:bg-white/10" :title="title" @click="open">
    <span class="relative flex h-8 w-8 items-center justify-center">
      <img v-if="!signedIn" :src="logoUrl" alt="归页" class="h-8 w-8" draggable="false" />
      <img v-else-if="sync.avatarUrl" :src="sync.avatarUrl" alt="" class="h-8 w-8 rounded-full object-cover" referrerpolicy="no-referrer" draggable="false" />
      <span v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-zinc-700">{{ avatarText }}</span>
      <RefreshCw v-if="sync.status === 'syncing'" :size="11" class="absolute -right-1 -bottom-1 animate-spin rounded-full bg-black/50 p-px" />
      <CloudOff v-else-if="sync.status === 'error'" :size="11" class="absolute -right-1 -bottom-1 rounded-full bg-black/50 p-px text-amber-300" />
    </span>
    <span class="w-full truncate px-1 text-center text-xs leading-tight">{{ accountLabel }}</span>
  </button>
</template>
