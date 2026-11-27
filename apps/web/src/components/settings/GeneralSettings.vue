<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { wrapExport } from '@guiye/shared'
import DataSettings from './DataSettings.vue'
import SearchSettings from './SearchSettings.vue'
import WidgetSettings from './WidgetSettings.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'
import { download } from '@/services/bookmarks'

const app = useAppStore()
const ui = useUiStore()
const sync = useSyncStore()
const signedIn = computed(() => !!sync.email)

function exportBackup() {
  download(`guiye-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(wrapExport(app.data), null, 2))
}
async function resetTags() {
  if (await ui.confirm('重置为默认标签与布局？当前数据会先自动保存到「数据变动记录」。')) {
    app.resetAll()
    ui.toast('已重置', 'success')
  }
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <div v-if="!signedIn" class="mb-2 rounded-lg bg-[#eaf2ff] px-4 py-3 text-center text-[13px] leading-relaxed text-[#1677ff] dark:bg-sky-500/10 dark:text-sky-300">
        登录即可享更多功能和数据同步<br />数据仅存于你自己的 Supabase，安全可控
      </div>
      <button class="gy-row" @click="exportBackup">导出备份<ChevronRight :size="16" /></button>
      <button class="gy-row" @click="resetTags">重置标签<ChevronRight :size="16" /></button>
      <button v-if="!signedIn" class="gy-row" @click="ui.loginOpen = true">立即登录<ChevronRight :size="16" /></button>
    </div>
    <hr class="border-black/5 dark:border-white/5" />
    <SearchSettings />
    <hr class="border-black/5 dark:border-white/5" />
    <WidgetSettings />
    <hr class="border-black/5 dark:border-white/5" />
    <DataSettings />
  </section>
</template>

<style scoped>
.gy-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  font-size: 13px;
  color: inherit;
  border-radius: 8px;
  padding: 0 4px;
}
button.gy-row:hover { background: rgb(0 0 0 / 0.04); }
:global(.dark) button.gy-row:hover { background: rgb(255 255 255 / 0.05); }
button.gy-row :deep(svg) { color: rgb(161 161 170); }
</style>
