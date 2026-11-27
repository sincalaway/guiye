<script setup lang="ts">
/** 关于我们（子幽样式的链接行；内容为归页自己的） */
import { ref } from 'vue'
import { ExternalLink } from 'lucide-vue-next'
import SetRow from './parts/SetRow.vue'
import { IS_EXTENSION } from '@/platform'

const REPO = 'https://github.com/sincalaway/guiye'
const open = (u: string) => window.open(u, '_blank', 'noopener')
const showKeys = ref(false)
const SHORTCUTS = [
  ['Tab / Shift+Tab', '在搜索框中切换搜索引擎'],
  ['/ 或直接打字', '聚焦搜索框'],
  ['Alt + M / 双击空白处', '极简模式'],
  ['Alt + ← / →', '切换分类'],
  ['Alt + E', '批量编辑'],
  ['Ctrl/⌘ + 点击图标', '强制在新标签页打开'],
  ['Esc', '关闭弹窗 / 退出批量编辑'],
]
const logoUrl = `${import.meta.env.BASE_URL}logo.png`
const logoLightUrl = `${import.meta.env.BASE_URL}logo-light.png`
</script>

<template>
  <section>
    <div class="mb-2 flex items-center gap-3 py-2">
      <img :src="logoUrl" alt="归页" class="h-12 w-12 dark:hidden" /><img :src="logoLightUrl" alt="归页" class="hidden h-12 w-12 dark:block" />
      <div>
        <div class="text-[15px] font-semibold">归页</div>
        <div class="text-xs text-zinc-500">v0.1.6 · {{ IS_EXTENSION ? '浏览器扩展版' : 'Web 版' }} · MIT 开源</div>
      </div>
    </div>
    <SetRow label="开源仓库" chevron @click="open(REPO)"><span class="text-xs text-[#1677ff]">github.com/sincalaway/guiye</span></SetRow>
    <SetRow label="产品反馈" chevron @click="open(`${REPO}/issues`)" />
    <SetRow label="应用官网" chevron @click="open('https://sincalaway.github.io/guiye/')"><span class="text-xs">在线预览👉</span></SetRow>
    <SetRow label="下载浏览器扩展" chevron @click="open(`${REPO}/releases/latest`)" />
    <SetRow label="使用文档" chevron @click="open(`${REPO}#readme`)" />
    <SetRow label="快捷键" chevron @click="showKeys = !showKeys" />
    <div v-if="showKeys" class="mb-2 divide-y divide-black/5 rounded-lg border border-black/5 text-[13px] dark:divide-white/5 dark:border-white/5">
      <div v-for="[k, v] in SHORTCUTS" :key="k" class="flex justify-between px-3 py-2">
        <kbd class="rounded bg-black/5 px-1.5 font-mono text-xs dark:bg-white/10">{{ k }}</kbd><span class="text-zinc-500">{{ v }}</span>
      </div>
    </div>
    <p class="mt-3 flex items-start gap-1 text-xs leading-relaxed text-zinc-400">
      <ExternalLink :size="12" class="mt-0.5 shrink-0" />第三方服务：Open-Meteo（天气）、今日诗词 / Hitokoto、MyMemory（翻译）、icon.horse（网站图标）、Picsum / Bing（壁纸）。
    </p>
  </section>
</template>
