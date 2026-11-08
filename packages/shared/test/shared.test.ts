import { describe, expect, it } from 'vitest'
import { parseBookmarksHtml, toBookmarksHtml, migrateData, createDefaultData, normalizeUrl, isProbablyUrl, buildSearchUrl, HOT_SOURCES, formatDate } from '../src'

const SAMPLE = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
        <DT><A HREF="https://github.com/" ADD_DATE="1700000001" ICON="data:image/png;base64,AAA">GitHub</A>
        <DT><H3>开发 &amp; 工具</H3>
        <DL><p>
            <DT><A HREF="https://vuejs.org/">Vue.js</A>
            <DT><A HREF="javascript:alert(1)">bad</A>
        </DL><p>
    </DL><p>
    <DT><A HREF="https://example.com/?a=1&amp;b=2">Loose &quot;one&quot;</A>
</DL><p>`

describe('bookmarks', () => {
  it('parses nested folders', () => {
    const r = parseBookmarksHtml(SAMPLE)
    const names = r.map((f) => f.name)
    expect(names).toEqual(['导入的书签', '书签栏', '开发 & 工具'])
    expect(r[0]!.bookmarks[0]).toMatchObject({ title: 'Loose "one"', url: 'https://example.com/?a=1&b=2' })
    expect(r[1]!.bookmarks[0]).toMatchObject({ title: 'GitHub', icon: 'data:image/png;base64,AAA' })
    expect(r[2]!.path).toEqual(['书签栏', '开发 & 工具'])
    expect(r[2]!.bookmarks).toHaveLength(1)
  })
  it('round-trips export', () => {
    const html = toBookmarksHtml([{ name: 'A<B', bookmarks: [{ title: 'x', url: 'https://x.com' }] }])
    const r = parseBookmarksHtml(html)
    expect(r[0]!.name).toBe('A<B')
    expect(r[0]!.bookmarks[0]!.url).toBe('https://x.com')
  })
})

describe('migrate', () => {
  it('fills missing settings', () => {
    const d = createDefaultData()
    const partial: any = { categories: d.categories, settings: { theme: 'dark' } }
    const m = migrateData(partial)
    expect(m.settings.theme).toBe('dark')
    expect(m.settings.search.engines.length).toBeGreaterThan(3)
    expect(m.activeCategoryId).toBe(d.categories[0]!.id)
  })
  it('unwraps export file', () => {
    const d = createDefaultData()
    expect(migrateData({ app: 'guiye', data: d }).categories.length).toBe(d.categories.length)
  })
  it('rejects garbage', () => {
    expect(() => migrateData({ foo: 1 })).toThrow()
  })
})

describe('utils', () => {
  it('urls', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com')
    expect(isProbablyUrl('github.com/vuejs')).toBe(true)
    expect(isProbablyUrl('hello world')).toBe(false)
    expect(buildSearchUrl('https://s?q=%s', 'a b')).toBe('https://s?q=a%20b')
    expect(formatDate(new Date(2026, 0, 5, 9, 3), 'YYYY-MM-DD HH:mm')).toBe('2026-01-05 09:03')
  })
  it('normalizes baidu hot', () => {
    const r = HOT_SOURCES.baidu.normalize({ data: { cards: [{ content: [{ content: [{ word: 'A', hotScore: '1' }] }] }] } })
    expect(r[0]!.title).toBe('A')
  })
})
