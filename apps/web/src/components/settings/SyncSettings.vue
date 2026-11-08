<script setup lang="ts">
import { computed, ref } from 'vue'
import { Cloud, LogOut, RefreshCw, UploadCloud, DownloadCloud } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'

const app = useAppStore()
const ui = useUiStore()
const sync = useSyncStore()
const s = computed(() => app.settings.sync)

const mode = ref<'password' | 'otp'>('password')
const email = ref('')
const password = ref('')
const code = ref('')
const otpSent = ref(false)
const busy = ref(false)
const showAdvanced = ref(!sync.config)
const cfg = ref({ url: s.value.supabaseUrl, key: s.value.supabaseAnonKey })

async function act(fn: () => Promise<unknown>, ok?: string) {
  busy.value = true
  try {
    await fn()
    if (ok) ui.toast(ok, 'success')
  } catch (e: any) {
    ui.toast(e?.message ?? String(e), 'error')
  } finally {
    busy.value = false
  }
}

const signIn = () => act(() => sync.signIn(email.value.trim(), password.value), '登录成功，开始同步')
const signUp = () =>
  act(async () => {
    const r = await sync.signUp(email.value.trim(), password.value)
    ui.toast(r.needConfirm ? '注册成功，请到邮箱点击确认链接后再登录' : '注册成功', 'success')
  })
const sendOtp = () => act(async () => (await sync.sendOtp(email.value.trim()), (otpSent.value = true)), '验证码已发送到邮箱')
const verify = () => act(() => sync.verifyOtp(email.value.trim(), code.value.trim()), '登录成功，开始同步')

function saveConfig() {
  s.value.supabaseUrl = cfg.value.url.trim()
  s.value.supabaseAnonKey = cfg.value.key.trim()
  ui.toast('同步服务配置已保存')
}

async function forcePush() {
  if (await ui.confirm('用本机数据覆盖云端？')) act(() => sync.push(), '已上传')
}
async function forcePull() {
  if (await ui.confirm('用云端数据覆盖本机？')) act(() => sync.pull(), '已从云端恢复')
}
const lastText = computed(() => (sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : '从未'))
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-xl bg-brand-500/8 p-4 text-sm leading-relaxed">
      <div class="mb-1 flex items-center gap-2 font-semibold"><Cloud :size="16" class="text-brand-500" />本地优先，云同步可选</div>
      所有数据默认只保存在本浏览器。登录后，书签、布局、壁纸、记事本与设置会通过 Supabase 在多设备、多浏览器间同步（以最后修改为准）。
    </div>

    <!-- 已登录 -->
    <div v-if="sync.status === 'idle' || sync.status === 'syncing' || (sync.status === 'error' && sync.email)" class="space-y-3">
      <div class="flex items-center justify-between rounded-xl border border-black/5 p-3 dark:border-white/5">
        <div>
          <div class="text-sm font-medium">{{ sync.email }}</div>
          <div class="text-xs text-zinc-500">
            上次同步：{{ lastText }}
            <span v-if="sync.error" class="text-red-500"> · {{ sync.error }}</span>
          </div>
        </div>
        <button class="gy-btn-ghost !py-1.5" @click="act(() => sync.signOut(), '已退出登录')"><LogOut :size="14" />退出</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="gy-btn-primary" :disabled="sync.busy" @click="act(() => sync.syncNow(), '同步完成')"><RefreshCw :size="15" :class="{ 'animate-spin': sync.busy }" />立即同步</button>
        <button class="gy-btn-ghost" :disabled="sync.busy" @click="forcePush"><UploadCloud :size="15" />本机覆盖云端</button>
        <button class="gy-btn-ghost" :disabled="sync.busy" @click="forcePull"><DownloadCloud :size="15" />云端覆盖本机</button>
      </div>
    </div>

    <!-- 未登录 -->
    <div v-else-if="sync.config" class="space-y-3">
      <div class="flex gap-1">
        <button class="rounded-lg px-3 py-1.5 text-sm" :class="mode === 'password' ? 'bg-black/5 font-medium dark:bg-white/10' : 'text-zinc-500'" @click="mode = 'password'">邮箱 + 密码</button>
        <button class="rounded-lg px-3 py-1.5 text-sm" :class="mode === 'otp' ? 'bg-black/5 font-medium dark:bg-white/10' : 'text-zinc-500'" @click="mode = 'otp'">邮箱验证码</button>
      </div>
      <input v-model="email" type="email" class="gy-input" placeholder="邮箱" autocomplete="email" />
      <template v-if="mode === 'password'">
        <input v-model="password" type="password" class="gy-input" placeholder="密码（至少 6 位）" autocomplete="current-password" @keydown.enter="signIn" />
        <div class="flex gap-2">
          <button class="gy-btn-primary flex-1" :disabled="busy || !email || !password" @click="signIn">登录</button>
          <button class="gy-btn-ghost flex-1" :disabled="busy || !email || password.length < 6" @click="signUp">注册</button>
        </div>
      </template>
      <template v-else>
        <div class="flex gap-2">
          <input v-model="code" class="gy-input" placeholder="6 位验证码" inputmode="numeric" :disabled="!otpSent" @keydown.enter="verify" />
          <button class="gy-btn-ghost shrink-0" :disabled="busy || !email" @click="sendOtp">{{ otpSent ? '重新发送' : '发送验证码' }}</button>
        </div>
        <button class="gy-btn-primary w-full" :disabled="busy || !otpSent || !code" @click="verify">登录</button>
      </template>
    </div>

    <div v-else class="rounded-xl border border-dashed border-black/15 p-4 text-sm text-zinc-500 dark:border-white/15">
      尚未配置同步服务。请在下方填写你自己的 Supabase 项目地址与 anon key（免费额度足够个人使用），或在构建时设置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY。
    </div>

    <div>
      <button class="text-xs text-zinc-500 hover:text-brand-500" @click="showAdvanced = !showAdvanced">{{ showAdvanced ? '收起' : '自定义同步服务（自建 Supabase）' }}</button>
      <div v-if="showAdvanced" class="mt-2 space-y-2">
        <input v-model="cfg.url" class="gy-input" placeholder="https://xxxx.supabase.co" />
        <input v-model="cfg.key" class="gy-input" placeholder="anon public key" />
        <div class="flex items-center gap-2">
          <button class="gy-btn-primary" @click="saveConfig">保存配置</button>
          <span class="text-xs text-zinc-400">首次使用请在 Supabase SQL Editor 中执行项目中的 supabase/schema.sql</span>
        </div>
      </div>
    </div>
  </section>
</template>
