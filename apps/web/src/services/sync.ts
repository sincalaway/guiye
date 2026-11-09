/**
 * 云同步（可选）—— Supabase
 *
 * 策略：整份快照 + 最后写入胜出（Last-Write-Wins）
 * - 登录 / 启动时：比较本地与云端 updatedAt，较新的一方覆盖另一方
 * - 本地修改后 2 秒防抖推送
 * - 订阅 Realtime：其他设备推送后立即拉取
 * - 本地上传的壁纸（idb:）在推送前上传到 Storage，替换成公开地址
 */
import type { SupabaseClient, Session, RealtimeChannel } from '@supabase/supabase-js'
import { migrateData, type AppData } from '@guiye/shared'
import { getBlob, isIdbRef } from './storage'

const TABLE = 'guiye_snapshots'
const BUCKET = 'guiye-wallpapers'

export interface SyncConfig {
  url: string
  anonKey: string
}

/**
 * 把用户填写的地址规范成 Supabase 项目 API 地址。
 * 支持：完整地址、缺少 https:// 的地址、仅项目 ID（ref）、控制台地址（supabase.com/dashboard/project/<ref>）、
 * 误带的 /rest/v1 等路径。无法识别时返回 null。
 */
export function normalizeSupabaseUrl(input: string): string | null {
  let v = (input || '').trim().replace(/^['"]|['"]$/g, '')
  if (!v) return null
  const dash = v.match(/supabase\.com\/dashboard\/project\/([a-z0-9]{10,})/i)
  if (dash) return `https://${dash[1].toLowerCase()}.supabase.co`
  if (/^[a-z0-9]{15,30}$/i.test(v)) return `https://${v.toLowerCase()}.supabase.co`
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  try {
    const u = new URL(v)
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return null
    return u.origin
  } catch {
    return null
  }
}

export function resolveSyncConfig(custom: { supabaseUrl: string; supabaseAnonKey: string }): SyncConfig | null {
  const url = normalizeSupabaseUrl(custom.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '') || ''
  const anonKey = custom.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  return url && anonKey ? { url, anonKey } : null
}

let client: SupabaseClient | null = null
let clientKey = ''

/** 按需加载 supabase-js（未启用同步时不下载，保证首屏轻量） */
export async function getClient(cfg: SyncConfig): Promise<SupabaseClient> {
  const key = `${cfg.url}|${cfg.anonKey}`
  if (!client || clientKey !== key) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'guiye-auth', detectSessionInUrl: true },
    })
    clientKey = key
  }
  return client
}

export async function getSession(sb: SupabaseClient): Promise<Session | null> {
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function signInPassword(sb: SupabaseClient, email: string, password: string) {
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(sb: SupabaseClient, email: string, password: string) {
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error
  return { needConfirm: !data.session }
}

/** 邮箱验证码登录（适合扩展环境，无需回跳链接） */
export async function sendOtp(sb: SupabaseClient, email: string) {
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyOtp(sb: SupabaseClient, email: string, token: string) {
  const { error } = await sb.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

export async function signOut(sb: SupabaseClient) {
  await sb.auth.signOut()
}

export interface RemoteSnapshot {
  data: AppData
  updatedAt: number
  deviceId: string | null
}

export async function pullRemote(sb: SupabaseClient, userId: string): Promise<RemoteSnapshot | null> {
  const { data, error } = await sb.from(TABLE).select('data, updated_at, device_id').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { data: migrateData(data.data), updatedAt: Number(data.updated_at), deviceId: data.device_id }
}

/** 推送前把本地 Blob 壁纸上传到 Storage */
async function uploadLocalWallpapers(sb: SupabaseClient, userId: string, d: AppData): Promise<AppData> {
  const copy: AppData = JSON.parse(JSON.stringify(d))
  const ws = copy.settings.wallpaper
  const all = [ws.current, ...ws.custom]
  // 已上传过的 Blob 记录在本机，避免每次推送重复上传
  const memoKey = `guiye:uploaded:${userId}`
  const uploaded = new Map<string, string>(Object.entries(JSON.parse(localStorage.getItem(memoKey) || '{}')))
  for (const w of all) {
    if (!isIdbRef(w.value)) continue
    if (!uploaded.has(w.value)) {
      const blob = await getBlob(w.value)
      if (!blob) continue
      const ext = (blob.type.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '')
      const path = `${userId}/${w.value.slice(4)}.${ext}`
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type })
      if (error) {
        console.warn('[guiye] 壁纸上传失败，将仅保存在本机', error)
        continue
      }
      uploaded.set(w.value, sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
    }
    w.value = uploaded.get(w.value) ?? w.value
  }
  localStorage.setItem(memoKey, JSON.stringify(Object.fromEntries(uploaded)))
  return copy
}

export async function pushRemote(sb: SupabaseClient, userId: string, d: AppData): Promise<AppData> {
  const payload = await uploadLocalWallpapers(sb, userId, d)
  // 同步配置属于本机，不上传（包括自定义的 Supabase 地址）
  payload.settings.sync = { enabled: true, supabaseUrl: '', supabaseAnonKey: '' }
  const { error } = await sb.from(TABLE).upsert({ user_id: userId, data: payload, updated_at: d.updatedAt, device_id: d.deviceId })
  if (error) throw error
  return payload
}

export function subscribeRemote(sb: SupabaseClient, userId: string, onChange: (updatedAt: number, deviceId: string | null) => void): RealtimeChannel {
  return sb
    .channel(`guiye-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${userId}` }, (payload: any) => {
      const row = payload.new ?? {}
      onChange(Number(row.updated_at ?? 0), row.device_id ?? null)
    })
    .subscribe()
}
