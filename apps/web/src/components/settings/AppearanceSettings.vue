<script setup lang="ts">
/** 主题标签（子幽：Dock栏和侧栏 / 图标和字体），末尾为归页额外选项 */
import { computed } from 'vue'
import SetHeading from './parts/SetHeading.vue'
import SetSwitch from './parts/SetSwitch.vue'
import SetSlider from './parts/SetSlider.vue'
import SetSegment from './parts/SetSegment.vue'
import SetColor from './parts/SetColor.vue'
import SetRow from './parts/SetRow.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { IS_EXTENSION } from '@/platform'

const app = useAppStore()
const ui = useUiStore()
const s = computed(() => app.settings)
const L = computed(() => app.settings.layout)
const sidebarOn = computed({ get: () => L.value.sidebar === 'left', set: (v: boolean) => (L.value.sidebar = v ? 'left' : 'hidden') })
const accountRight = computed({ get: () => L.value.accountPos === 'right', set: (v: boolean) => (L.value.accountPos = v ? 'right' : 'left') })
const DOCK = [
  { v: 'off' as const, l: '关闭' },
  { v: 'link' as const, l: '联动' },
  { v: 'solo' as const, l: '独立' },
]
const THEMES = [
  { v: 'light' as const, l: '亮色' },
  { v: 'dark' as const, l: '暗色' },
  { v: 'auto' as const, l: '跟随系统' },
]
const selectCls = 'w-40 rounded border border-black/15 bg-white px-2 py-1.5 text-[13px] text-zinc-700 outline-none focus:border-[#1677ff] dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200'
</script>

<template>
  <section>
    <SetHeading>Dock栏和侧栏</SetHeading>
    <SetSegment v-model="L.dockMode" label="开启Dock栏" :options="DOCK" />
    <SetColor v-model="L.barColor" label="Dock和侧边背景色" alpha fallback="rgba(46, 46, 46, 0.4)" />
    <SetSwitch v-model="sidebarOn" label="页面分类功能开关" />
    <SetSwitch v-model="L.sidebarAutoHide" label="页面分类自动隐藏" />
    <SetSwitch v-model="L.rememberCategory" label="保留上次查看的分类" />
    <SetSwitch v-model="L.loopScroll" label="页面首尾循环滚动" />
    <SetSwitch v-model="accountRight" label="个人中心位置" off="左侧" on="右侧" />

    <hr class="my-2 border-black/5 dark:border-white/5" />
    <SetHeading>图标和字体</SetHeading>
    <SetColor v-model="L.titleColor" label="图标字体颜色" fallback="#ffffff" />
    <SetSwitch v-model="L.iconBg" label="图标背景" />
    <SetSlider v-model="L.iconSize" label="图标大小" :min="60" :max="80" />
    <SetSlider v-model="L.iconRound" label="图标圆角" :min="6" :max="20" />
    <SetSlider v-model="L.gap" label="图标列距" :min="25" :max="40" />
    <SetSlider v-model="L.maxCols" label="图标最大列数" :min="4" :max="16" />
    <SetSwitch v-model="L.tooltip" label="标签Tooltip文字提示" />

    <!-- 以下为归页额外选项（子幽无） -->
    <hr class="my-2 border-black/5 dark:border-white/5" />
    <SetHeading>更多</SetHeading>
    <SetSegment v-model="s.theme" label="主题模式" :options="THEMES" />
    <SetSwitch v-model="s.minimal" label="极简模式" hint="Alt+M 或双击空白处切换" />
    <SetSwitch v-model="L.showTitle" label="显示图标名称" />
    <SetSwitch v-model="L.wheelSwitch" label="鼠标滚轮切换分类" />
    <SetSwitch v-model="L.colorIcons" label="侧栏分类图标使用彩色" />
    <SetRow label="默认打开方式">
      <select v-model="s.defaultOpenMode" :class="selectCls" aria-label="默认打开方式">
        <option value="newTab">新标签页</option>
        <option value="self">当前页</option>
        <option value="webapp">内嵌窗口</option>
      </select>
    </SetRow>
    <SetRow label="网站图标来源">
      <select v-model="s.faviconProvider" :class="selectCls" aria-label="网站图标来源">
        <option value="iconhorse">icon.horse</option>
        <option value="google">Google</option>
        <option value="duckduckgo">DuckDuckGo</option>
        <option value="browser" :disabled="!IS_EXTENSION">浏览器缓存（仅扩展）</option>
      </select>
    </SetRow>
    <SetRow label="热搜 API 地址" hint="留空为自动；纯静态托管时填自部署的 hot-proxy">
      <input v-model.trim="s.hotApiBase" class="w-40 rounded border border-black/15 px-2 py-1.5 text-[13px] outline-none focus:border-[#1677ff] dark:border-white/15 dark:bg-zinc-800" placeholder="留空为自动" />
    </SetRow>
    <SetRow label="搜索引擎管理" hint="添加、排序、设为默认" chevron @click="ui.settingsTab = 'engines'" />
  </section>
</template>
