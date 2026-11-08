/// <reference types="vite/client" />

declare const __GUIYE_TARGET__: 'web' | 'extension'

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** 热搜 API 默认地址（兼容 DailyHotApi），可被设置覆盖 */
  readonly VITE_HOT_API_BASE?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}
