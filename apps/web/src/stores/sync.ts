import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { useAppStore } from './app'
import * as svc from '@/services/sync'

export type SyncStatus = 'unconfigured' | 'signed-out' | 'idle' | 'syncing' | 'error'

export const useSyncStore = defineStore('sync', () => {
  const app = useAppStore()
  const userId = ref<string | null>(null)
  const email = ref<string>('')
  const busy = ref(false)
  const error = ref('')
  // 同步时间只属于本机，不放进 AppData，避免修改它又触发一次同步
  const lastSyncedAt = useLocalStorage('guiye:last-synced', 0)
  const config = computed(() => svc.resolveSyncConfig(app.settings.sync))
  let sb: SupabaseClient | null = null
  let channel: RealtimeChannel | null = null
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  let unsubscribeLocal: (() => void) | null = null

  const status = computed<SyncStatus>(() => {
    if (!config.value) return 'unconfigured'
    if (!userId.value) return 'signed-out'
    if (busy.value) return 'syncing'
    if (error.value) return 'error'
    return 'idle'
  })

  async function init() {
    if (!config.value) return
    try {
      sb = await svc.getClient(config.value)
      sb.auth.onAuthStateChange((_e, session) => {
        const uid = session?.user.id ?? null
        email.value = session?.user.email ?? ''
        if (uid !== userId.value) {
          userId.value = uid
          if (uid) startSync()
          else stopSync()
        }
      })
      const session = await svc.getSession(sb)
      if (session) {
        userId.value = session.user.id
        email.value = session.user.email ?? ''
        await startSync()
      }
    } catch (e: any) {
      error.value = e?.message ?? String(e)
    }
  }

  // 配置变化后重新初始化
  watch(
    () => [app.settings.sync.supabaseUrl, app.settings.sync.supabaseAnonKey],
    () => {
      stopSync()
      userId.value = null
      init()
    },
  )

  async function client(): Promise<SupabaseClient> {
    if (!config.value) throw new Error('尚未配置 Supabase')
    sb = await svc.getClient(config.value)
    return sb
  }

  async function startSync() {
    if (!app.settings.sync.enabled) app.settings.sync.enabled = true
    await syncNow()
    unsubscribeLocal?.()
    unsubscribeLocal = app.onLocalChange(() => {
      clearTimeout(pushTimer)
      pushTimer = setTimeout(() => push().catch(() => {}), 2000)
    })
    try {
      channel?.unsubscribe()
      channel = svc.subscribeRemote(await client(), userId.value!, (updatedAt, deviceId) => {
        if (deviceId !== app.data.deviceId && updatedAt > app.data.updatedAt) pull().catch(() => {})
      })
    } catch {
      /* Realtime 未开启时忽略 */
    }
  }

  function stopSync() {
    unsubscribeLocal?.()
    unsubscribeLocal = null
    channel?.unsubscribe()
    channel = null
    clearTimeout(pushTimer)
  }

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    busy.value = true
    error.value = ''
    try {
      const r = await fn()
      lastSyncedAt.value = Date.now()
      return r
    } catch (e: any) {
      error.value = e?.message ?? String(e)
      throw e
    } finally {
      busy.value = false
    }
  }

  /** 双向：较新的一方胜出 */
  async function syncNow() {
    if (!userId.value) return
    await run(async () => {
      const remote = await svc.pullRemote(await client(), userId.value!)
      if (!remote || app.data.updatedAt > remote.updatedAt) await svc.pushRemote(await client(), userId.value!, app.data)
      else if (remote.updatedAt > app.data.updatedAt) app.replaceData({ ...remote.data, updatedAt: remote.updatedAt }, true)
    })
  }

  async function push() {
    if (!userId.value) return
    await run(async () => svc.pushRemote(await client(), userId.value!, app.data))
  }

  async function pull() {
    if (!userId.value) return
    await run(async () => {
      const remote = await svc.pullRemote(await client(), userId.value!)
      if (remote) app.replaceData({ ...remote.data, updatedAt: remote.updatedAt }, true)
    })
  }

  async function signIn(mail: string, password: string) {
    await svc.signInPassword(await client(), mail, password)
  }
  async function signUp(mail: string, password: string) {
    return svc.signUp(await client(), mail, password)
  }
  async function sendOtp(mail: string) {
    await svc.sendOtp(await client(), mail)
  }
  async function verifyOtp(mail: string, code: string) {
    await svc.verifyOtp(await client(), mail, code)
  }
  async function signOut() {
    stopSync()
    await svc.signOut(await client())
    userId.value = null
    email.value = ''
    app.settings.sync.enabled = false
  }

  return { status, email, error, busy, lastSyncedAt, config, init, syncNow, push, pull, signIn, signUp, sendOtp, verifyOtp, signOut }
})
