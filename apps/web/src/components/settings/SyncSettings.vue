<script setup lang="ts">
import { computed, ref } from 'vue'
import { Cloud, LogOut, RefreshCw, UploadCloud, DownloadCloud } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'
import { normalizeSupabaseUrl } from '@/services/sync'

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
const qqEnabled = computed({
  get: () => s.value.qqLogin ?? import.meta.env.VITE_QQ_LOGIN === '1',
  set: (v: boolean) => (s.value.qqLogin = v),
})
const qqLogin = () => act(async () => sync.qqLogin())

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
  const rawUrl = cfg.value.url.trim()
  const key = cfg.value.key.trim()
  if (!rawUrl && !key) {
    s.value.supabaseUrl = ''
    s.value.supabaseAnonKey = ''
    ui.toast('已清除自定义同步服务')
    return
  }
  const url = normalizeSupabaseUrl(rawUrl)
  if (!url) return ui.toast('项目地址无效：请填写 Supabase 后台 Project Settings → API 中的 Project URL，形如 https://xxxx.supabase.co', 'error')
  if (key.split('.').length !== 3 && !key.startsWith('sb_publishable_'))
    return ui.toast('anon key 格式不对：请复制 Project Settings → API 中的 anon public key（以 eyJ 开头）或 publishable key', 'error')
  cfg.value.url = url
  s.value.supabaseUrl = url
  s.value.supabaseAnonKey = key
  ui.toast('同步服务配置已保存', 'success')
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
          <div class="flex items-center gap-2 text-sm font-medium">
            <img v-if="sync.avatarUrl" :src="sync.avatarUrl" alt="" class="h-6 w-6 rounded-full" referrerpolicy="no-referrer" />
            {{ sync.provider === 'qq' ? sync.nickname : sync.email }}
            <span v-if="sync.provider === 'qq'" class="rounded bg-sky-500/15 px-1.5 text-xs font-normal text-sky-600 dark:text-sky-300">QQ</span>
          </div>
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
      <template v-if="qqEnabled">
        <button class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#12B7F5] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-105 disabled:opacity-60" :disabled="busy" @click="qqLogin">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12.003 2c-3.06 0-5.37 2.4-5.37 5.62 0 .3.02.6.06.9-.9 1.12-2.2 3.05-2.2 4.74 0 .8.3 1.3.6 1.3.3 0 .8-.6 1.2-1.4.3 1.1.9 2.1 1.7 2.9-.9.3-1.9.9-1.9 1.6 0 .9 1.6 1.4 3.6 1.4 1.1 0 2.1-.2 2.8-.5.7.3 1.7.5 2.8.5 2 0 3.6-.5 3.6-1.4 0-.7-1-1.3-1.9-1.6.8-.8 1.4-1.8 1.7-2.9.4.8.9 1.4 1.2 1.4.3 0 .6-.5.6-1.3 0-1.7-1.3-3.62-2.2-4.74.04-.3.06-.6.06-.9C17.373 4.4 15.063 2 12.003 2z"/></svg>
          QQ 登录
        </button>
        <div class="flex items-center gap-3 text-xs text-zinc-400"><span class="h-px flex-1 bg-black/10 dark:bg-white/10" />或使用邮箱<span class="h-px flex-1 bg-black/10 dark:bg-white/10" /></div>
      </template>
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
        <label class="flex items-center gap-2 pt-1 text-sm">
          <input v-model="qqEnabled" type="checkbox" class="accent-brand-500" />
          显示 QQ 登录
          <span class="text-xs text-zinc-400">（需先部署 supabase/functions/qq-auth，见 README）</span>
        </label>
      </div>
    </div>
  </section>
</template>
