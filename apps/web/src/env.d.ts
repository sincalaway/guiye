/// <reference types="vite/client" />

declare const __GUIYE_TARGET__: 'web' | 'extension'

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** 设为 1 时默认显示 QQ 登录 */
  readonly VITE_QQ_LOGIN?: string
  /** 热搜 API 默认地址（兼容 DailyHotApi），可被设置覆盖 */
  readonly VITE_HOT_API_BASE?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}

declare module 'lunar-javascript' {
  // 只声明用到的 API（6tail/lunar-javascript）
  export const Solar: { fromYmd(y: number, m: number, d: number): any; fromDate(d: Date): any }
  export const Lunar: any
}
