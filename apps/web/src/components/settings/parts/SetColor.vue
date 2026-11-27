<script setup lang="ts">
/**
 * 设置行 + 颜色选择（子幽为 Element 颜色选择器：色板 + 透明度 + 文本框 + 清空/确定）。
 * 这里用原生取色器 + 透明度滑块 + 文本框实现，结果写回 css 颜色字符串（#rrggbb 或 rgba()）。
 */
import { computed, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import SetRow from './SetRow.vue'

const model = defineModel<string>({ required: true })
const props = defineProps<{ label: string; alpha?: boolean; fallback: string }>()
const open = ref(false)
const box = ref<HTMLElement>()
onClickOutside(box, () => (open.value = false))

function parse(c: string): { hex: string; a: number } {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c.trim())
  if (m) {
    const hex = '#' + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('')
    return { hex, a: m[4] === undefined ? 1 : Number(m[4]) }
  }
  if (/^#[0-9a-f]{6}$/i.test(c)) return { hex: c.toLowerCase(), a: 1 }
  if (/^#[0-9a-f]{3}$/i.test(c)) return { hex: '#' + [...c.slice(1)].map((x) => x + x).join('').toLowerCase(), a: 1 }
  return { hex: '#ffffff', a: 1 }
}
function build(hex: string, a: number) {
  if (!props.alpha) return hex
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.round(a * 100) / 100})`
}

const hex = ref('#ffffff')
const a = ref(1)
const text = ref('')
function load() {
  const p = parse(model.value || props.fallback)
  hex.value = p.hex
  a.value = p.a
  text.value = model.value || props.fallback
}
watch(open, (v) => v && load())
watch([hex, a], () => (text.value = build(hex.value, a.value)))
const swatch = computed(() => model.value || props.fallback)

function confirm() {
  const t = text.value.trim()
  const p = parse(t)
  model.value = /^(#|rgba?\()/i.test(t) ? build(p.hex, p.a) : build(hex.value, a.value)
  open.value = false
}
function clear() {
  model.value = props.fallback
  open.value = false
}
</script>

<template>
  <SetRow :label="label">
    <div ref="box" class="relative">
      <button type="button" class="flex h-8 w-8 items-center justify-center rounded border border-black/15 bg-white p-1 dark:border-white/20 dark:bg-zinc-800" :aria-label="label" @click="open = !open">
        <span class="h-full w-full rounded-sm border border-black/10" :style="{ background: swatch }" />
      </button>
      <div v-if="open" class="absolute top-10 right-0 z-10 w-60 space-y-2.5 rounded-lg border border-black/10 bg-white p-3 text-zinc-700 shadow-xl dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200">
        <input v-model="hex" type="color" class="h-28 w-full cursor-pointer rounded border-0 bg-transparent p-0" aria-label="颜色" />
        <div v-if="alpha" class="flex items-center gap-2 text-xs">
          <span class="shrink-0">透明度</span>
          <input v-model.number="a" type="range" min="0" max="1" step="0.01" class="min-w-0 flex-1 accent-[#1677ff]" aria-label="选择透明度的值" />
          <span class="w-8 text-right tabular-nums">{{ Math.round(a * 100) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="text" class="min-w-0 flex-1 rounded border border-black/15 px-2 py-1 text-xs dark:border-white/15 dark:bg-zinc-900" @keydown.enter="confirm" />
          <button type="button" class="text-xs text-[#1677ff] hover:underline" @click="clear">清空</button>
          <button type="button" class="rounded border border-black/15 px-2 py-0.5 text-xs hover:border-[#1677ff] hover:text-[#1677ff] dark:border-white/15" @click="confirm">确定</button>
        </div>
      </div>
    </div>
  </SetRow>
</template>
