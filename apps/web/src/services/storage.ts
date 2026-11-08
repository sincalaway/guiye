/**
 * 本地持久化（本地优先）
 * - AppData 整体存 IndexedDB（idb-keyval），并镜像一份到 localStorage 便于秒开
 * - 本地上传的图片/视频以 Blob 存 IndexedDB，AppData 中用 `idb:<key>` 引用
 */
import { createStore, get, set, del, keys } from 'idb-keyval'
import type { AppData } from '@guiye/shared'
import { uid } from '@guiye/shared'

const dataStore = createStore('guiye', 'data')
const blobStore = createStore('guiye-blobs', 'blobs')

const DATA_KEY = 'app-data'
const LS_KEY = 'guiye:data'
const DEVICE_KEY = 'guiye:device'

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = uid('d_')
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export async function loadData(): Promise<unknown | null> {
  try {
    const v = await get(DATA_KEY, dataStore)
    if (v) return v
  } catch (e) {
    console.warn('[guiye] IndexedDB 不可用，回退 localStorage', e)
  }
  const raw = localStorage.getItem(LS_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function saveData(data: AppData): Promise<void> {
  const plain = JSON.parse(JSON.stringify(data)) as AppData
  try {
    await set(DATA_KEY, plain, dataStore)
  } catch (e) {
    console.warn('[guiye] 写入 IndexedDB 失败', e)
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(plain))
  } catch {
    /* 超出配额时忽略，IndexedDB 为主 */
  }
}

// ---------- Blob ----------
const urlCache = new Map<string, string>()

export const isIdbRef = (v?: string) => !!v && v.startsWith('idb:')

export async function putBlob(blob: Blob): Promise<string> {
  const key = uid('b_')
  await set(key, blob, blobStore)
  return `idb:${key}`
}

export async function getBlob(ref: string): Promise<Blob | undefined> {
  return get(ref.slice(4), blobStore)
}

/** 将 idb: 引用解析为可用于 <img>/<video> 的 objectURL；其他地址原样返回 */
export async function resolveMediaUrl(ref: string): Promise<string> {
  if (!isIdbRef(ref)) return ref
  const cached = urlCache.get(ref)
  if (cached) return cached
  const blob = await getBlob(ref)
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  urlCache.set(ref, url)
  return url
}

export async function deleteBlob(ref: string) {
  if (!isIdbRef(ref)) return
  await del(ref.slice(4), blobStore)
  const u = urlCache.get(ref)
  if (u) URL.revokeObjectURL(u)
  urlCache.delete(ref)
}

/** 清理不再被引用的 Blob */
export async function gcBlobs(data: AppData) {
  const json = JSON.stringify(data)
  for (const k of await keys(blobStore)) {
    if (!json.includes(`idb:${String(k)}`)) await del(k, blobStore)
  }
}

// ---------- 多标签页同步（同一浏览器内） ----------
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('guiye') : null

export function broadcastChange(updatedAt: number) {
  channel?.postMessage({ type: 'data-changed', updatedAt })
}

export function onBroadcastChange(cb: (updatedAt: number) => void) {
  if (!channel) return
  channel.addEventListener('message', (e) => {
    if (e.data?.type === 'data-changed') cb(e.data.updatedAt)
  })
}

// ---------- 小缓存（天气/热搜等） ----------
export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(`guiye:cache:${key}`)
    if (!raw) return null
    const { t, v } = JSON.parse(raw)
    return Date.now() - t < maxAgeMs ? (v as T) : null
  } catch {
    return null
  }
}

export function cacheSet(key: string, v: unknown) {
  try {
    localStorage.setItem(`guiye:cache:${key}`, JSON.stringify({ t: Date.now(), v }))
  } catch {
    /* ignore */
  }
}
