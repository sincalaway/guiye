import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { fetchHotDirect, HOT_SOURCE_IDS } from '../../packages/shared/src/hot'
import type { HotSource } from '../../packages/shared/src/types'

/** 开发环境内置热搜代理：/api/hot/:source，免去本地调试时的跨域问题 */
function hotDevProxy(): Plugin {
  return {
    name: 'guiye-hot-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/hot', async (req, res) => {
        const source = (req.url ?? '').replace(/^\/+/, '').split(/[?/]/)[0] as HotSource
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (!HOT_SOURCE_IDS.includes(source)) {
          res.statusCode = 404
          return res.end(JSON.stringify({ code: 404, message: 'unknown source' }))
        }
        try {
          const data = await fetchHotDirect(source)
          res.end(JSON.stringify({ code: 200, data }))
        } catch (e: any) {
          res.statusCode = 502
          res.end(JSON.stringify({ code: 502, message: String(e?.message ?? e) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const isExt = mode === 'extension'
  return {
    base: isExt ? './' : '/',
    plugins: [vue(), tailwindcss(), hotDevProxy()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    define: { __GUIYE_TARGET__: JSON.stringify(isExt ? 'extension' : 'web') },
    publicDir: isExt ? fileURLToPath(new URL('../extension/public', import.meta.url)) : 'public',
    build: {
      outDir: isExt ? fileURLToPath(new URL('../extension/dist', import.meta.url)) : 'dist',
      emptyOutDir: true,
      // 扩展环境禁止远程/内联脚本，Vite 默认产物即满足 MV3 CSP
      modulePreload: isExt ? { polyfill: false } : undefined,
      chunkSizeWarningLimit: 900,
    },
    server: { port: 5173 },
  }
})
