<script setup lang="ts">
/** 倒计时 / 纪念日 共用的小编辑表单（卡片内覆盖显示） */
import { ref } from 'vue'

const props = defineProps<{ title: string; date: string; label: string; repeatLabel?: string; repeat?: boolean }>()
const emit = defineEmits<{ save: [v: { title: string; date: string; repeat: boolean }]; cancel: [] }>()
const t = ref(props.title)
const d = ref(props.date)
const r = ref(!!props.repeat)
</script>

<template>
  <form class="flex h-full flex-col gap-1.5 text-[13px]" @submit.prevent="d && emit('save', { title: t.trim() || label, date: d, repeat: r })" @keydown.stop>
    <input v-model="t" class="rounded-md bg-black/5 px-2 py-1 outline-none dark:bg-white/10" :placeholder="`${label}名称`" />
    <input v-model="d" type="date" required class="rounded-md bg-black/5 px-2 py-1 outline-none dark:bg-white/10" />
    <label v-if="repeatLabel" class="flex items-center gap-1.5 text-xs text-zinc-500"><input v-model="r" type="checkbox" class="accent-brand-500" />{{ repeatLabel }}</label>
    <div class="mt-auto flex gap-1.5">
      <button type="submit" class="flex-1 rounded-md bg-brand-500 py-1 text-white">保存</button>
      <button type="button" class="flex-1 rounded-md bg-black/5 py-1 dark:bg-white/10" @click="emit('cancel')">取消</button>
    </div>
  </form>
</template>
