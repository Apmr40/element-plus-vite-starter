// 应用配置巡检系统 - 路由配置 (TypeScript)

import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/inspection',
    component: () => import('./Layout.vue'),
    redirect: '/inspection/rule-config',
    children: [
      {
        path: 'rule-config',
        name: 'RuleConfig',
        component: () => import('./rule-config/Index.vue'),
        meta: { title: '规则配置', icon: 'Edit' },
      },
      {
        path: 'inspection-result',
        name: 'InspectionResult',
        component: () => import('./inspection-result/Index.vue'),
        meta: { title: '巡检结果', icon: 'TrendCharts' },
      },
      {
        path: 'rectification-order',
        name: 'RectificationOrder',
        component: () => import('./rectification-order/Index.vue'),
        meta: { title: '整改工单', icon: 'Files' },
      },
      {
        path: 'system-admin',
        name: 'SystemAdmin',
        component: () => import('./system-admin/Index.vue'),
        meta: { title: '系统管理', icon: 'Setting' },
      },
    ],
  },
]

// 创建路由器
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 页面标题设置
  if (to.meta.title) {
    document.title = `${to.meta.title} - 应用配置巡检系统`
  }
  next()
})

export default router
