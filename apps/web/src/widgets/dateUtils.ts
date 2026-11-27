/** 日期工具：按本地日期（零点）计算天数差 */
export const DAY = 86_400_000

export function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || '')
  return m ? new Date(+m[1]!, +m[2]! - 1, +m[3]!) : null
}

export function today0(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / DAY)
}

/** 下一个周年日（今天算今天） */
export function nextAnniversary(origin: Date, now = today0()) {
  let d = new Date(now.getFullYear(), origin.getMonth(), origin.getDate())
  if (d < now) d = new Date(now.getFullYear() + 1, origin.getMonth(), origin.getDate())
  return d
}

const WEEK = '日一二三四五六'
export const fmtDate = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${WEEK[d.getDay()]}`

/** 一年中的第几天、ISO 第几周 */
export function dayOfYear(d: Date) {
  return daysBetween(new Date(d.getFullYear(), 0, 1), today0(d)) + 1
}
export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - y0.getTime()) / DAY + 1) / 7)
}
