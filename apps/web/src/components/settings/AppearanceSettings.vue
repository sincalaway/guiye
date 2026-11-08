<script setup lang="ts">
import { computed } from 'vue'
import Toggle from '@/components/common/Toggle.vue'
import { useAppStore } from '@/stores/app'
import { IS_EXTENSION } from '@/platform'

const app = useAppStore()
const s = computed(() => app.settings)
const THEMES = [
  { v: 'light', l: '亮色' },
  { v: 'dark', l: '暗色' },
  { v: 'auto', l: '跟随系统' },
] as const
</script>

<template>
  <section class="space-y-6">
    <div>
      <h3 class="mb-2 text-sm font-semibold">主题</h3>
      <div class="flex gap-2">
        <button
          v-for="t in THEMES"
          :key="t.v"
          class="flex-1 rounded-lg border px-3 py-2 text-sm"
          :class="s.theme === t.v ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'border-black/10 dark:border-white/10'"
          @click="s.theme = t.v"
        >
          {{ t.l }}
        </button>
      </div>
      <Toggle v-model="s.minimal" label="极简模式" hint="只保留时间与搜索框（快捷键 Alt+M，或双击空白处）" class="mt-2" />
    </div>

    <div>
      <h3 class="mb-2 text-sm font-semibold">图标</h3>
      <label class="gy-label">图标大小：{{ s.layout.iconSize }}px</label>
      <input v-model.number="s.layout.iconSize" type="range" min="40" max="96" step="2" class="w-full accent-brand-500" />
      <label class="gy-label mt-3">圆角：{{ s.layout.iconRadius }}%</label>
      <input v-model.number="s.layout.iconRadius" type="range" min="0" max="50" class="w-full accent-brand-500" />
      <label class="gy-label mt-3">间距：{{ s.layout.gap }}px</label>
      <input v-model.number="s.layout.gap" type="range" min="8" max="56" step="2" class="w-full accent-brand-500" />
      <label class="gy-label mt-3">内容最大宽度：{{ s.layout.maxWidth }}px</label>
      <input v-model.number="s.layout.maxWidth" type="range" min="640" max="1800" step="20" class="w-full accent-brand-500" />
      <Toggle v-model="s.layout.showTitle" label="显示图标名称" />
      <Toggle v-model="s.layout.dock" label="显示 WebApp Dock 栏" />
      <div class="mt-2 grid grid-cols-2 gap-3">
        <div>
          <label class="gy-label">默认打开方式</label>
          <select v-model="s.defaultOpenMode" class="gy-input">
            <option value="newTab">新标签页</option>
            <option value="self">当前页</option>
            <option value="webapp">内嵌窗口</option>
          </select>
        </div>
        <div>
          <label class="gy-label">网站图标来源</label>
          <select v-model="s.faviconProvider" class="gy-input">
            <option value="iconhorse">icon.horse</option>
            <option value="google">Google（需可访问）</option>
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="browser" :disabled="!IS_EXTENSION">浏览器缓存（仅扩展）</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <h3 class="mb-1 text-sm font-semibold">时间与日期</h3>
      <Toggle v-model="s.clock.show" label="显示时间" />
      <template v-if="s.clock.show">
        <Toggle v-model="s.clock.hour12" label="12 小时制" />
        <Toggle v-model="s.clock.showSeconds" label="显示秒" />
        <Toggle v-model="s.clock.showDate" label="显示日期" />
        <Toggle v-model="s.clock.showWeek" label="显示星期" />
        <Toggle v-model="s.clock.showLunar" label="显示农历" />
        <label class="gy-label mt-2">日期格式（留空为「11月8日」）</label>
        <input v-model="s.clock.dateFormat" class="gy-input" placeholder="如 YYYY-MM-DD 或 YYYY年M月D日" />
      </template>
    </div>
  </section>
</template>
