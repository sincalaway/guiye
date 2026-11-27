<script setup lang="ts">
/** 时间日期（子幽：预览 + 显示时间 / 日期字体颜色 / 内容展示 6 项） */
import { computed } from 'vue'
import ClockHeader from '@/components/layout/ClockHeader.vue'
import SetSwitch from './parts/SetSwitch.vue'
import SetColor from './parts/SetColor.vue'
import SetHeading from './parts/SetHeading.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const c = computed(() => app.settings.clock)
const h24 = computed({ get: () => !c.value.hour12, set: (v: boolean) => (c.value.hour12 = !v) })
</script>

<template>
  <section>
    <div class="mb-2 rounded-xl bg-zinc-800 px-4 py-6"><ClockHeader preview /></div>
    <SetSwitch v-model="c.show" label="显示时间" />
    <SetColor v-model="c.color" label="日期字体颜色" fallback="#ffffff" />
    <hr class="my-2 border-black/5 dark:border-white/5" />
    <SetHeading>内容展示</SetHeading>
    <SetSwitch v-model="c.showDate" label="年月" />
    <SetSwitch v-model="c.showSeconds" label="秒" />
    <SetSwitch v-model="h24" label="24小时制" />
    <SetSwitch v-model="c.showWeek" label="周" />
    <SetSwitch v-model="c.showLunar" label="农历" />
    <SetSwitch v-model="c.showGanzhi" label="干支" />
  </section>
</template>
