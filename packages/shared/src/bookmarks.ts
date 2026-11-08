/**
 * 解析浏览器导出的书签 HTML（Netscape Bookmark File Format）。
 * Chrome / Edge / Firefox / Safari 导出的格式都是这一种。
 * 不依赖 DOM，Node 与浏览器环境均可运行。
 */

export interface ParsedBookmark {
  title: string
  url: string
  icon?: string
  addDate?: number
}

export interface ParsedFolder {
  name: string
  /** 文件夹路径，如 ["书签栏", "开发"] */
  path: string[]
  bookmarks: ParsedBookmark[]
}

const decodeEntities = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')

const attr = (tag: string, name: string): string | undefined => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i')) ?? tag.match(new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, 'i'))
  return m ? decodeEntities(m[1]!) : undefined
}

/**
 * 返回按文件夹分组的书签（扁平化，每个文件夹一组，组内只含直接子书签）。
 * 根目录下的散落书签放在 name 为 rootName 的组里。
 */
export function parseBookmarksHtml(html: string, rootName = '导入的书签'): ParsedFolder[] {
  const folders: ParsedFolder[] = []
  const stack: ParsedFolder[] = []
  const root: ParsedFolder = { name: rootName, path: [], bookmarks: [] }
  let pendingFolder: string | null = null

  const token = /<(\/?)(dl|h3|a)\b([^>]*)>([^<]*)/gi
  let m: RegExpExecArray | null
  while ((m = token.exec(html))) {
    const closing = m[1] === '/'
    const tag = m[2]!.toLowerCase()
    const attrs = m[3] ?? ''
    const text = decodeEntities((m[4] ?? '').trim())

    if (tag === 'h3' && !closing) {
      pendingFolder = text || '未命名文件夹'
    } else if (tag === 'dl' && !closing) {
      if (pendingFolder !== null) {
        const parent = stack[stack.length - 1]
        const folder: ParsedFolder = { name: pendingFolder, path: [...(parent ? parent.path : []), pendingFolder], bookmarks: [] }
        folders.push(folder)
        stack.push(folder)
        pendingFolder = null
      } else if (stack.length === 0) {
        stack.push(root)
      } else {
        stack.push(stack[stack.length - 1]!) // 不带标题的 DL，视为同一层
      }
    } else if (tag === 'dl' && closing) {
      stack.pop()
    } else if (tag === 'a' && !closing) {
      const href = attr(attrs, 'href')
      if (!href || !/^(https?|ftp|file):/i.test(href)) continue
      const target = stack[stack.length - 1] ?? root
      const addDate = Number(attr(attrs, 'add_date'))
      target.bookmarks.push({
        title: text || href,
        url: href,
        icon: attr(attrs, 'icon'),
        addDate: Number.isFinite(addDate) && addDate > 0 ? addDate * 1000 : undefined,
      })
    }
  }

  const result = root.bookmarks.length ? [root, ...folders] : folders
  return result.filter((f) => f.bookmarks.length > 0)
}

/** 生成可被浏览器导入的书签 HTML（导出） */
export function toBookmarksHtml(groups: { name: string; bookmarks: { title: string; url: string }[] }[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const now = Math.floor(Date.now() / 1000)
  const body = groups
    .map(
      (g) =>
        `    <DT><H3 ADD_DATE="${now}">${esc(g.name)}</H3>\n    <DL><p>\n${g.bookmarks
          .map((b) => `        <DT><A HREF="${esc(b.url)}" ADD_DATE="${now}">${esc(b.title)}</A>`)
          .join('\n')}\n    </DL><p>`,
    )
    .join('\n')
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>归页书签</H1>
<DL><p>
${body}
</DL><p>
`
}
