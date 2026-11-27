/**
 * 数据变动记录：本机保留最近 30 份数据快照，可一键恢复。
 * - 普通编辑：距上一份超过 10 分钟才记录，避免频繁写入
 * - 整体替换（导入、云端覆盖、恢复默认）：替换前强制记录
 * 只保存在本机 IndexedDB，不参与同步。
 */
import { createStore, get, set } from 'idb-keyval'
import type { AppData } from '@guiye/shared'

export interface Snapshot {
  id: string
  time: number
  reason: string
  categories: number
  sites: number
  widgets: number
  data: AppData
}

const store = createStore('guiye-history', 'snapshots')
const KEY = 'list'
const MAX = 30
const MIN_GAP = 10 * 60_000

function count(d: AppData) {
  let sites = 0
  let widgets = 0
  for (const c of d.categories)
    for (const it of c.items) {
      if (it.type === 'site') sites++
      else if (it.type === 'widget') widgets++
      else sites += it.children.length
    }
  return { categories: d.categories.length, sites, widgets }
}

export async function listSnapshots(): Promise<Snapshot[]> {
  return ((await get(KEY, store)) as Snapshot[] | undefined) ?? []
}

export async function recordSnapshot(d: AppData, reason: string, force = false) {
  const list = await listSnapshots()
  if (!force && list[0] && Date.now() - list[0].time < MIN_GAP) return
  const plain = JSON.parse(JSON.stringify(d)) as AppData
  const snap: Snapshot = { id: `${Date.now()}`, time: Date.now(), reason, ...count(plain), data: plain }
  await set(KEY, [snap, ...list].slice(0, MAX), store)
}

export async function removeSnapshot(id: string) {
  await set(KEY, (await listSnapshots()).filter((s) => s.id !== id), store)
}
