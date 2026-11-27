<script setup lang="ts">
import { computed } from 'vue'
import Toggle from '@/components/common/Toggle.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const s = computed(() => app.settings)
</script>

<template>
  <section class="space-y-6">
    <div>
      <h3 class="mb-1 text-sm font-semibold">时间日期</h3>
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
