<script setup lang="ts">
/** 常规设置（与子幽一致的 7 项） */
import { computed } from 'vue'
import SetSwitch from './parts/SetSwitch.vue'
import SetRow from './parts/SetRow.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const s = computed(() => app.settings.search)
/** 标签新页面打开：开 = 新标签页，关 = 当前页（内嵌窗口模式视为开） */
const tabNewPage = computed({
  get: () => app.settings.defaultOpenMode !== 'self',
  set: (v: boolean) => (app.settings.defaultOpenMode = v ? 'newTab' : 'self'),
})
/** 快捷翻译：关闭 / 火山翻译 / 百度翻译 */
const translate = computed({
  get: () => (!s.value.translate ? 'off' : s.value.translateProvider === 'baidu' ? 'baidu' : 'volc'),
  set: (v: string) => {
    s.value.translate = v !== 'off'
    if (v !== 'off') s.value.translateProvider = v as 'volc' | 'baidu'
  },
})
</script>

<template>
  <section>
    <SetSwitch v-model="s.openInNewTab" label="搜索新页面打开" />
    <SetSwitch v-model="tabNewPage" label="标签新页面打开" />
    <SetSwitch v-model="s.autoFocus" label="进入程序自动聚焦搜索" />
    <SetSwitch v-model="s.suggestions" label="搜索词联想功能" />
    <SetSwitch v-model="s.show" label="搜索功能" />
    <SetSwitch v-model="s.iconMatch" label="图标快捷搜索展示" />
    <SetRow label="快捷翻译">
      <select v-model="translate" class="w-40 rounded border border-black/15 bg-white px-2 py-1.5 text-[13px] text-zinc-700 outline-none focus:border-[#1677ff] dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200" aria-label="快捷翻译">
        <option value="off">关闭</option>
        <option value="volc">火山翻译</option>
        <option value="baidu">百度翻译</option>
      </select>
    </SetRow>
  </section>
</template>
