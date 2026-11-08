import { faviconUrl, normalizeUrl, type OpenMode, type SiteItem } from '@guiye/shared'
import { useAppStore } from '@/stores/app'
import { useUiStore } from '@/stores/ui'
import { EXTENSION_BASE, IS_EXTENSION } from '@/platform'

/** 解析网站图标的图片地址（文字/iconify 图标返回空） */
export function useIconUrl() {
  const app = useAppStore()
  return (item: Pick<SiteItem, 'icon' | 'url'>): string => {
    const icon = item.icon
    if (icon.kind === 'url') return icon.value
    if (icon.kind === 'favicon') {
      const p = app.settings.faviconProvider
      return faviconUrl(item.url, p === 'browser' && !IS_EXTENSION ? 'iconhorse' : p, EXTENSION_BASE)
    }
    return ''
  }
}

/** 按打开方式打开网站 */
export function useOpenSite() {
  const app = useAppStore()
  const ui = useUiStore()
  const iconUrl = useIconUrl()
  return (item: SiteItem, mode?: OpenMode) => {
    const m = mode ?? item.openMode ?? app.settings.defaultOpenMode
    const url = normalizeUrl(item.url)
    if (m === 'webapp') ui.openWebApp({ title: item.title, url, iconUrl: iconUrl(item) })
    else if (m === 'self') location.href = url
    else window.open(url, '_blank', 'noopener')
  }
}
