<script setup lang="ts">
/** 账号（子幽：登录提示 + 导出备份 / 重置标签 / 立即登录）。已登录时显示同步状态。 */
import { computed } from 'vue'
import { wrapExport } from '@guiye/shared'
import SetBanner from './parts/SetBanner.vue'
import SetRow from './parts/SetRow.vue'
import SetHeading from './parts/SetHeading.vue'
import SyncSettings from './SyncSettings.vue'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'
import { download } from '@/services/bookmarks'
import { gcBlobs } from '@/services/storage'

const app = useAppStore()
const ui = useUiStore()
const sync = useSyncStore()
const signedIn = computed(() => sync.status === 'idle' || sync.status === 'syncing' || (sync.status === 'error' && !!sync.email))

function exportBackup() {
  download(`guiye-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(wrapExport(app.data), null, 2))
}
async function resetTags() {
  if (!(await ui.confirm('重置为默认标签与布局？当前数据会先自动保存到「数据变动记录」。', '重置标签'))) return
  app.resetAll()
  await gcBlobs(app.data)
  ui.toast('已重置', 'success')
}
</script>

<template>
  <section>
    <template v-if="!signedIn">
      <SetBanner>登录即可享更多功能和数据同步<br />数据存于你自己的 Supabase，安全可控</SetBanner>
      <SetRow label="导出备份" chevron @click="exportBackup" />
      <SetRow label="重置标签" chevron @click="resetTags" />
      <SetRow label="立即登录" chevron @click="ui.loginOpen = true" />
    </template>
    <template v-else>
      <SyncSettings />
      <SetRow label="导出备份" chevron @click="exportBackup" />
      <SetRow label="重置标签" chevron @click="resetTags" />
    </template>

    <!-- 以下为归页额外功能（子幽无） -->
    <hr class="my-3 border-black/5 dark:border-white/5" />
    <SetHeading>导入与同步</SetHeading>
    <SetRow label="导入备份 / 浏览器书签" hint="JSON 备份、书签 HTML、导出为书签 HTML" chevron @click="ui.settingsTab = 'data'" />
    <SetRow v-if="!signedIn" label="同步服务配置" hint="自建 Supabase、QQ 登录开关" chevron @click="ui.settingsTab = 'sync'" />
  </section>
</template>
