/**
 * 归页 QQ 登录 —— Supabase Edge Function（Deno）
 *
 * Supabase 没有内置 QQ 登录，这里用 QQ 互联 OAuth2 换到 openid，
 * 再用 service_role 为该 openid 建一个 Supabase 用户并签发一次性登录令牌（magic link 的 token_hash），
 * 前端拿令牌调用 auth.verifyOtp 换成正常会话。之后同步、RLS 与邮箱用户完全一致。
 *
 * 流程：
 *   1. 前端跳转  GET /functions/v1/qq-auth?redirect=<当前页面>&nonce=<随机串>
 *   2. 本函数 302 到 QQ 授权页（state 带 HMAC 签名，防篡改、10 分钟过期）
 *   3. QQ 回调  GET /functions/v1/qq-auth?code=...&state=...
 *   4. 本函数换 token → openid → 昵称头像 → 建/找用户 → 生成 token_hash
 *   5. 302 回 redirect#qq_token_hash=...&qq_type=...&qq_nonce=...
 *
 * 部署：
 *   supabase functions deploy qq-auth --no-verify-jwt
 *   supabase secrets set QQ_APP_ID=xxx QQ_APP_KEY=xxx QQ_ALLOWED_REDIRECTS="https://你的域名/,chrome-extension://扩展ID/"
 * QQ 互联后台的「网站回调域」填：https://<项目ref>.supabase.co/functions/v1/qq-auth
 */
import { createClient } from 'npm:@supabase/supabase-js@2'

const env = (k: string, d = '') => Deno.env.get(k) ?? d
const APP_ID = env('QQ_APP_ID')
const APP_KEY = env('QQ_APP_KEY')
const SUPABASE_URL = env('SUPABASE_URL')
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const CALLBACK = env('QQ_REDIRECT_URI', `${SUPABASE_URL}/functions/v1/qq-auth`)
const EMAIL_DOMAIN = env('QQ_EMAIL_DOMAIN', 'qq.guiye.local')
/** 允许回跳的页面前缀（逗号分隔）。只有这些地址能收到登录令牌，防止令牌被带到别的网站 */
const ALLOWED = env('QQ_ALLOWED_REDIRECTS')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const enc = new TextEncoder()
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const fromB64url = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'))

async function hmac(data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(APP_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

async function signState(payload: Record<string, unknown>) {
  const body = b64url(enc.encode(JSON.stringify(payload)))
  return `${body}.${await hmac(body)}`
}

async function readState(state: string): Promise<{ r: string; n: string; e: number } | null> {
  const [body, sig] = state.split('.')
  if (!body || !sig || sig !== (await hmac(body))) return null
  try {
    const p = JSON.parse(decodeURIComponent(escape(fromB64url(body))))
    return p.e > Date.now() ? p : null
  } catch {
    return null
  }
}

function isAllowed(redirect: string) {
  return ALLOWED.some((prefix) => redirect.startsWith(prefix))
}

function backTo(redirect: string, params: Record<string, string>) {
  const u = redirect.split('#')[0]
  const hash = new URLSearchParams(params).toString()
  return new Response(null, { status: 302, headers: { Location: `${u}#${hash}`, 'Cache-Control': 'no-store' } })
}

function text(msg: string, status = 400) {
  return new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

async function qqJson(url: string) {
  const res = await fetch(url)
  const raw = await res.text()
  // QQ 的部分接口出错时返回 callback( {...} ); 形式
  const m = raw.match(/\{[\s\S]*\}/)
  const json = m ? JSON.parse(m[0]) : {}
  if (json.error || (json.ret !== undefined && json.ret !== 0)) {
    throw new Error(`QQ 接口错误：${json.error_description || json.msg || json.error || json.ret}`)
  }
  return json
}

Deno.serve(async (req) => {
  if (!APP_ID || !APP_KEY || !SERVICE_KEY) return text('QQ 登录未配置：请设置 QQ_APP_ID、QQ_APP_KEY', 500)
  if (!ALLOWED.length) return text('QQ 登录未配置：请设置 QQ_ALLOWED_REDIRECTS（允许回跳的页面地址）', 500)
  const url = new URL(req.url)
  const q = url.searchParams

  // 1) 发起登录
  if (!q.has('code') && !q.has('state')) {
    const redirect = q.get('redirect') || ''
    const nonce = q.get('nonce') || ''
    if (!isAllowed(redirect)) return text(`回跳地址不在白名单中：${redirect}\n请把它加入 QQ_ALLOWED_REDIRECTS`, 400)
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(nonce)) return text('nonce 无效', 400)
    const state = await signState({ r: redirect, n: nonce, e: Date.now() + 10 * 60_000 })
    const auth = new URL('https://graph.qq.com/oauth2.0/authorize')
    const params = new URLSearchParams({ response_type: 'code', client_id: APP_ID, redirect_uri: CALLBACK, state })
    if (q.get('display') === 'mobile') params.set('display', 'mobile')
    auth.search = params.toString()
    return new Response(null, { status: 302, headers: { Location: auth.toString(), 'Cache-Control': 'no-store' } })
  }

  // 2) QQ 回调
  const st = await readState(q.get('state') || '')
  if (!st || !isAllowed(st.r)) return text('登录状态无效或已过期，请重新登录', 400)
  const code = q.get('code')
  if (!code) return backTo(st.r, { qq_error: q.get('msg') || '已取消 QQ 授权', qq_nonce: st.n })

  try {
    const tokenUrl = new URL('https://graph.qq.com/oauth2.0/token')
    tokenUrl.search = new URLSearchParams({ grant_type: 'authorization_code', client_id: APP_ID, client_secret: APP_KEY, code, redirect_uri: CALLBACK, fmt: 'json' }).toString()
    const { access_token } = await qqJson(tokenUrl.toString())
    const me = await qqJson(`https://graph.qq.com/oauth2.0/me?access_token=${encodeURIComponent(access_token)}&fmt=json`)
    const openid: string = me.openid
    if (!openid) throw new Error('未获取到 openid')

    let nickname = 'QQ 用户'
    let avatar = ''
    try {
      const info = await qqJson(
        `https://graph.qq.com/user/get_user_info?access_token=${encodeURIComponent(access_token)}&oauth_consumer_key=${APP_ID}&openid=${openid}`,
      )
      nickname = info.nickname || nickname
      avatar = String(info.figureurl_qq_2 || info.figureurl_qq_1 || info.figureurl_2 || '').replace(/^http:/, 'https:')
    } catch {
      /* 昵称头像拿不到不影响登录 */
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const email = `qq_${openid.toLowerCase()}@${EMAIL_DOMAIN}`
    const meta = { provider: 'qq', qq_openid: openid, name: nickname, avatar_url: avatar }

    // 首次登录建用户；已存在时忽略报错
    const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: meta })
    if (created.error && !/already|exists|registered/i.test(created.error.message)) throw created.error

    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (link.error) throw link.error
    // 每次登录刷新昵称与头像
    if (!created.data?.user && link.data.user) await admin.auth.admin.updateUserById(link.data.user.id, { user_metadata: meta })

    return backTo(st.r, {
      qq_token_hash: link.data.properties.hashed_token,
      qq_type: link.data.properties.verification_type || 'magiclink',
      qq_nonce: st.n,
    })
  } catch (e) {
    return backTo(st.r, { qq_error: (e as Error).message || String(e), qq_nonce: st.n })
  }
})
