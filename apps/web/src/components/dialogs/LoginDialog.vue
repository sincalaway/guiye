<script setup lang="ts">
/** 登录弹窗（子幽样式）：邮箱 + 密码，忘记密码改用邮箱验证码，注册，底部 QQ 登录 */
import { computed, ref, watch } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { useSyncStore } from '@/stores/sync'

const app = useAppStore()
const ui = useUiStore()
const sync = useSyncStore()
type Mode = 'login' | 'register' | 'otp'
const mode = ref<Mode>('login')
const email = ref('')
const password = ref('')
const code = ref('')
const otpSent = ref(false)
const busy = ref(false)
const logo = `${import.meta.env.BASE_URL}logo.png`
const qqEnabled = computed(() => app.settings.sync.qqLogin ?? import.meta.env.VITE_QQ_LOGIN === '1')
const title = computed(() => ({ login: '登录您的账户', register: '注册账户', otp: '邮箱验证码登录' })[mode.value])

watch(
  () => ui.loginOpen,
  (v) => v && ((mode.value = 'login'), (otpSent.value = false), (code.value = '')),
)
// 登录成功后自动关闭
watch(
  () => sync.email,
  (v) => v && ui.loginOpen && ((ui.loginOpen = false), ui.toast('登录成功，开始同步', 'success')),
)
onKeyStroke('Escape', () => ui.loginOpen && (ui.loginOpen = false))

async function act(fn: () => Promise<unknown>) {
  busy.value = true
  try {
    await fn()
  } catch (e: any) {
    ui.toast(e?.message ?? String(e), 'error')
  } finally {
    busy.value = false
  }
}
const validPwd = computed(() => password.value.length >= 6 && password.value.length <= 18)
function submit() {
  const mail = email.value.trim()
  if (mode.value === 'login') act(() => sync.signIn(mail, password.value))
  else if (mode.value === 'register')
    act(async () => {
      const r = await sync.signUp(mail, password.value)
      if (r.needConfirm) {
        ui.toast('注册成功，请到邮箱点击确认链接后再登录', 'success')
        mode.value = 'login'
      }
    })
  else if (!otpSent.value) act(async () => (await sync.sendOtp(mail), (otpSent.value = true), ui.toast('验证码已发送到邮箱', 'success')))
  else act(() => sync.verifyOtp(mail, code.value.trim()))
}
function openConfig() {
  ui.loginOpen = false
  ui.openSettings('sync')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.loginOpen" class="fixed inset-0 z-[950] flex items-center justify-center bg-black/40 p-4" @mousedown.self="ui.loginOpen = false" @contextmenu.stop.prevent>
        <Transition name="pop" appear>
          <div class="relative w-full max-w-[380px] rounded-[14px] bg-white px-8 pt-8 pb-6 text-zinc-800 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100" role="dialog" :aria-label="title">
            <button class="absolute top-3 right-3 rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-600 dark:hover:bg-white/10" aria-label="关闭" @click="ui.loginOpen = false"><X :size="18" /></button>
            <div class="mb-6 flex items-center gap-3">
              <img :src="logo" alt="归页" class="h-9 w-9" />
              <h2 class="text-[19px] font-bold">{{ title }}</h2>
            </div>

            <template v-if="sync.config">
              <form class="space-y-4" @submit.prevent="submit">
                <div>
                  <label class="mb-1.5 block text-xs text-[#86909c]">邮箱账号</label>
                  <input v-model="email" type="email" required class="gy-login-input" placeholder="请输入邮箱" autocomplete="email" />
                </div>
                <div v-if="mode !== 'otp'">
                  <label class="mb-1.5 block text-xs text-[#86909c]">{{ mode === 'register' ? '设置密码' : '登录密码' }}</label>
                  <input v-model="password" type="password" required class="gy-login-input" placeholder="请输入6-18位密码" maxlength="18" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" />
                </div>
                <div v-else-if="otpSent">
                  <label class="mb-1.5 block text-xs text-[#86909c]">验证码</label>
                  <input v-model="code" class="gy-login-input" placeholder="请输入邮箱收到的 6 位验证码" inputmode="numeric" />
                </div>
                <div class="flex justify-end text-xs">
                  <button v-if="mode === 'login'" type="button" class="text-[#1677ff] hover:underline" @click="mode = 'otp'">忘记密码？</button>
                  <button v-else type="button" class="text-[#1677ff] hover:underline" @click="mode = 'login'">使用密码登录</button>
                </div>
                <button
                  type="submit"
                  class="h-10 w-full rounded-lg bg-[#1677ff] text-sm text-white transition hover:bg-[#4096ff] disabled:opacity-60"
                  :disabled="busy || !email || (mode !== 'otp' && !validPwd) || (mode === 'otp' && otpSent && !code)"
                >
                  {{ mode === 'register' ? '注册' : mode === 'otp' && !otpSent ? '发送验证码' : '登录' }}
                </button>
              </form>
              <div class="mt-5 border-t border-black/5 pt-4 text-center text-xs text-zinc-400 dark:border-white/10">
                <button v-if="mode !== 'register'" class="hover:text-[#1677ff]" @click="mode = 'register'">还没有账号？去注册</button>
                <button v-else class="hover:text-[#1677ff]" @click="mode = 'login'">已有账号？去登录</button>
              </div>
              <div v-if="qqEnabled" class="mt-4 flex justify-center">
                <button class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#f2f3f5] text-[#12b7f5] transition hover:bg-[#e8f6fd] dark:bg-zinc-800" title="QQ登录" :disabled="busy" @click="act(async () => sync.qqLogin())">
                  <svg viewBox="0 0 24 24" class="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M12.003 2c-3.06 0-5.37 2.4-5.37 5.62 0 .3.02.6.06.9-.9 1.12-2.2 3.05-2.2 4.74 0 .8.3 1.3.6 1.3.3 0 .8-.6 1.2-1.4.3 1.1.9 2.1 1.7 2.9-.9.3-1.9.9-1.9 1.6 0 .9 1.6 1.4 3.6 1.4 1.1 0 2.1-.2 2.8-.5.7.3 1.7.5 2.8.5 2 0 3.6-.5 3.6-1.4 0-.7-1-1.3-1.9-1.6.8-.8 1.4-1.8 1.7-2.9.4.8.9 1.4 1.2 1.4.3 0 .6-.5.6-1.3 0-1.7-1.3-3.62-2.2-4.74.04-.3.06-.6.06-.9C17.373 4.4 15.063 2 12.003 2z" /></svg>
                </button>
              </div>
            </template>
            <div v-else class="space-y-4 text-sm leading-relaxed text-zinc-500">
              <p>还没有配置同步服务。归页的账号与数据存放在你自己的 Supabase 项目中，配置一次即可登录。</p>
              <button class="h-10 w-full rounded-lg bg-[#1677ff] text-sm text-white hover:bg-[#4096ff]" @click="openConfig">去配置同步服务</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gy-login-input {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  background: #f5f5f7;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  border: 1px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}
.gy-login-input:focus { border-color: #1677ff; background: #fff; }
:global(.dark) .gy-login-input { background: rgb(255 255 255 / 0.06); color: inherit; }
</style>
