/** 带超时的 fetch JSON */
export async function fetchJson<T = any>(url: string, init: RequestInit & { timeout?: number } = {}): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), init.timeout ?? 8000)
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

let jsonpSeq = 0
/** JSONP（仅 Web 版使用；扩展环境 CSP 禁止远程脚本，改用 fetch + host_permissions） */
export function jsonp<T = any>(url: string, cbParam = 'cb', timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `__guiye_jsonp_${Date.now()}_${jsonpSeq++}`
    const script = document.createElement('script')
    const cleanup = () => {
      delete (window as any)[name]
      script.remove()
      clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('jsonp timeout'))
    }, timeout)
    ;(window as any)[name] = (data: T) => {
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      cleanup()
      reject(new Error('jsonp error'))
    }
    script.src = `${url}${url.includes('?') ? '&' : '?'}${cbParam}=${name}`
    document.head.appendChild(script)
  })
}
