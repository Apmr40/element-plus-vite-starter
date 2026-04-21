<!-- 应用配置巡检系统 - 入口文件 -->
<script lang="ts" setup>
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/inspection-system-router'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './styles/inspection-system.scss'

// 创建应用实例
const app = createApp(App)

// 注册图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(router)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('全局错误:', err, info)
}
</script>
