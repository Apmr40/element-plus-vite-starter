// 应用配置巡检系统 - 标准入口文件 (TypeScript)
import type { UserModule } from './types'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 导入全局样式
import '~/styles/index.scss'
import '~/styles/style.css'
import '@/styles/uops-theme.scss'
import './styles/inspection-system.scss'

import 'uno.css'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/overlay.scss'

// 使用 ViteSSG + auto-routes
import { ViteSSG } from 'vite-ssg'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
  },
  (ctx) => {
    // install all modules under `modules/`
    Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
      .forEach(i => i.install?.(ctx))
  },
)
