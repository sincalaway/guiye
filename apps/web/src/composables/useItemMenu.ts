import { parseSize, type FolderItem, type GridItem, type ItemSize, type SiteItem, type WidgetItem } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore, type MenuEntry } from '@/stores/ui'
import { useOpenSite } from './useSite'
import { widgetDef } from '@/widgets/registry'

const SITE_SIZES: { size: ItemSize; label: string }[] = [
  { size: '1x1', label: '图标 1×1' },
  { size: '2x1', label: '横向卡片 2×1' },
  { size: '2x2', label: '大卡片 2×2' },
]

/** 生成网格项的右键菜单 */
export function useItemMenu() {
  const app = useAppStore()
  const ui = useUiStore()
  const open = useOpenSite()

  const moveTo = (ids: string[], exclude?: string): MenuEntry => ({
    label: '移动到',
    children: app.categories.filter((c) => c.id !== exclude).map((c) => ({ label: c.name, action: () => (app.moveItems(ids, c.id), ui.toast(`已移动到「${c.name}」`)) })),
  })

  const remove = (item: GridItem): MenuEntry => ({
    label: '删除',
    danger: true,
    action: async () => {
      const name = item.type === 'widget' ? (widgetDef(item.widget)?.name ?? '组件') : item.title
      if (item.type === 'site' || (await ui.confirm(`删除「${name}」？`))) {
        app.removeItems([item.id])
        ui.toast(`已删除「${name}」`)
      }
    },
  })

  function siteMenu(item: SiteItem, inFolder = false): MenuEntry[] {
    const catId = app.locate(item.id)?.category.id
    const entries: MenuEntry[] = [
      { label: '新标签页打开', action: () => open(item, 'newTab') },
      { label: '当前页打开', action: () => open(item, 'self') },
      { label: '内嵌窗口打开', action: () => open(item, 'webapp') },
      { label: '-' },
      { label: '编辑', action: () => ui.editSite(item) },
      { label: '复制链接', action: () => navigator.clipboard.writeText(item.url).then(() => ui.toast('链接已复制', 'success')) },
    ]
    if (inFolder) {
      entries.push({ label: '移出文件夹', action: () => app.moveOutOfFolder(item.id) })
    } else {
      entries.push(
        { label: '尺寸', children: SITE_SIZES.map((s) => ({ label: (item.size === s.size ? '✓ ' : '') + s.label, action: () => app.updateItem(item.id, { size: s.size }) })) },
        moveTo([item.id], catId),
        { label: '放入新文件夹', action: () => app.createFolder([item.id]) },
        { label: '批量编辑', action: () => (ui.setEditMode(true), ui.toggleSelect(item.id)) },
      )
    }
    entries.push({ label: '-' }, remove(item))
    return entries
  }

  function widgetMenu(item: WidgetItem): MenuEntry[] {
    const def = widgetDef(item.widget)
    const catId = app.locate(item.id)?.category.id
    return [
      {
        label: '尺寸',
        children: (def?.sizes ?? ['2x2']).map((s) => {
          const { cols, rows } = parseSize(s)
          return { label: `${item.size === s ? '✓ ' : ''}${cols}×${rows}`, action: () => app.updateItem(item.id, { size: s }) }
        }),
      },
      moveTo([item.id], catId),
      { label: '批量编辑', action: () => (ui.setEditMode(true), ui.toggleSelect(item.id)) },
      { label: '-' },
      remove(item),
    ]
  }

  function folderMenu(item: FolderItem): MenuEntry[] {
    const catId = app.locate(item.id)?.category.id
    return [
      { label: '打开', action: () => (ui.openFolderId = item.id) },
      { label: '全部在新标签页打开', action: () => item.children.forEach((c) => open(c, 'newTab')) },
      moveTo([item.id], catId),
      {
        label: '解散文件夹',
        action: () => [...item.children].reverse().forEach((c) => app.moveOutOfFolder(c.id)),
      },
      { label: '-' },
      remove(item),
    ]
  }

  return (e: MouseEvent, item: GridItem, inFolder = false) => {
    const entries = item.type === 'site' ? siteMenu(item, inFolder) : item.type === 'widget' ? widgetMenu(item) : folderMenu(item)
    ui.openMenu(e, entries)
  }
}
