import { parseBookmarksHtml, type ParsedFolder } from '@guiye/shared'
import { IS_EXTENSION } from '@/platform'

export async function parseBookmarkFile(file: File): Promise<ParsedFolder[]> {
  return parseBookmarksHtml(await file.text())
}

export const canReadBrowserBookmarks = () => IS_EXTENSION && typeof chrome !== 'undefined' && !!chrome.bookmarks

/** 扩展环境：直接读取浏览器书签树（需要 bookmarks 权限） */
export async function readBrowserBookmarks(): Promise<ParsedFolder[]> {
  const tree = await chrome.bookmarks.getTree()
  const out: ParsedFolder[] = []
  const walk = (node: chrome.bookmarks.BookmarkTreeNode, path: string[]) => {
    if (!node.children) return
    const name = node.title || '书签'
    const here = node.id === '0' ? [] : [...path, name]
    const bookmarks = node.children
      .filter((c) => c.url && /^https?:/i.test(c.url))
      .map((c) => ({ title: c.title || c.url!, url: c.url!, addDate: c.dateAdded }))
    if (bookmarks.length) out.push({ name, path: here, bookmarks })
    node.children.filter((c) => c.children).forEach((c) => walk(c, here))
  }
  tree.forEach((n) => walk(n, []))
  return out
}

export function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
