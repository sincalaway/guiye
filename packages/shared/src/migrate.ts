import type { AppData, Settings } from './types'
import { SCHEMA_VERSION } from './types'
import { createDefaultData, createDefaultSettings } from './defaults/data'

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)

/** 深合并：以默认值为骨架，填入已有值（数组整体替换） */
function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : (patch as T))
  const out: Record<string, any> = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isObj(out[k]) && isObj(v) ? deepMerge(out[k], v) : v
  }
  return out as T
}

/**
 * 校验并迁移任意来源（本地旧版本、导入的 JSON、云端快照）的数据，
 * 保证返回一个结构完整的 AppData。无法识别时抛错。
 */
export function migrateData(raw: unknown, deviceId?: string): AppData {
  if (!isObj(raw)) throw new Error('数据格式不正确')
  // 支持导出文件外层包装 { app: 'guiye', data: {...} }
  const src = isObj(raw.data) && raw.app === 'guiye' ? raw.data : raw
  if (!Array.isArray(src.categories)) throw new Error('缺少 categories 字段，不是归页的备份文件')

  const base = createDefaultData(deviceId ?? src.deviceId)
  const settings = deepMerge<Settings>(createDefaultSettings(), src.settings)
  const data: AppData = {
    ...base,
    ...src,
    schemaVersion: SCHEMA_VERSION,
    deviceId: deviceId ?? src.deviceId ?? base.deviceId,
    settings,
    notes: Array.isArray(src.notes) ? src.notes : [],
    searchHistory: Array.isArray(src.searchHistory) ? src.searchHistory : [],
    categories: src.categories.map((c: any) => ({
      id: String(c.id),
      name: String(c.name ?? '未命名'),
      icon: String(c.icon ?? 'folder'),
      items: Array.isArray(c.items) ? c.items.filter((i: any) => isObj(i) && i.id && i.type) : [],
    })),
  }
  if (!data.categories.length) data.categories = base.categories
  if (!data.categories.some((c) => c.id === data.activeCategoryId)) data.activeCategoryId = data.categories[0]!.id
  if (!data.settings.search.engines.some((e) => e.id === data.settings.search.engineId)) {
    data.settings.search.engineId = data.settings.search.engines[0]?.id ?? 'bing'
  }
  return data
}

/** 导出文件的外层包装 */
export function wrapExport(data: AppData) {
  return { app: 'guiye', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data }
}
