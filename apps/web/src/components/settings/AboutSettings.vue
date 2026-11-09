<script setup lang="ts">
import { IS_EXTENSION } from '@/platform'
const SHORTCUTS = [
  ['Tab / Shift+Tab', '在搜索框中切换搜索引擎'],
  ['/ 或直接打字', '聚焦搜索框'],
  ['↑ ↓ Enter', '选择搜索建议'],
  ['Alt + M', '切换极简模式'],
  ['Alt + ← / →', '切换分类'],
  ['Alt + E', '批量编辑'],
  ['双击空白处', '切换极简模式'],
  ['Ctrl/⌘ + 点击图标', '强制在新标签页打开'],
  ['Esc', '关闭弹窗 / 退出批量编辑'],
]
const logoUrl = `${import.meta.env.BASE_URL}logo.png`
const logoLightUrl = `${import.meta.env.BASE_URL}logo-light.png`
</script>

<template>
  <section class="space-y-5 text-sm">
    <div class="flex items-center gap-3">
      <img :src="logoUrl" alt="归页" class="h-16 w-16 dark:hidden" /><img :src="logoLightUrl" alt="归页" class="hidden h-16 w-16 dark:block" />
      <div>
        <div class="text-lg font-semibold">归页</div>
        <div class="text-xs text-zinc-500">v0.1.2 · {{ IS_EXTENSION ? '浏览器扩展版' : 'Web 版' }} · MIT 开源，干净无广告</div>
      </div>
    </div>
    <p class="leading-relaxed text-zinc-600 dark:text-zinc-300">个人起始页 + 书签管理 + 组件式主页。数据本地优先，可选自建云同步。</p>
    <div>
      <h3 class="mb-2 font-semibold">快捷键</h3>
      <div class="divide-y divide-black/5 rounded-xl border border-black/5 dark:divide-white/5 dark:border-white/5">
        <div v-for="[k, v] in SHORTCUTS" :key="k" class="flex justify-between px-3 py-2">
          <kbd class="rounded bg-black/5 px-1.5 font-mono text-xs dark:bg-white/10">{{ k }}</kbd><span class="text-zinc-500">{{ v }}</span>
        </div>
      </div>
    </div>
    <div class="text-xs leading-relaxed text-zinc-400">
      第三方服务：Open-Meteo（天气）、今日诗词 / Hitokoto（诗词一言）、MyMemory（翻译）、icon.horse（网站图标）、Picsum / Bing（壁纸）。
    </div>
  </section>
</template>
