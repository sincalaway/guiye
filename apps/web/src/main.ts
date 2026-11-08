import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { useAppStore } from './stores/app'

async function bootstrap() {
  const app = createApp(App)
  app.use(createPinia())
  // 先载入本地数据再挂载，避免首屏闪烁
  await useAppStore().init()
  app.mount('#app')
}

bootstrap()
