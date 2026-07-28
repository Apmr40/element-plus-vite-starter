/**
 * Demo 模块 - 应用配置巡检系统
 * 
 * 这个目录包含所有 demo 功能的代码，与主项目解耦
 * 包含：巡检系统、变更特护、API 配置等功能
 */

// 导出 demo 组件
export { default as InspectionLayout } from './components/layouts/InspectionLayout.vue'
export { default as InspectNav } from './components/layouts/InspectNav.vue' // deprecated: 已融入全局BaseSide导航
export { default as MyCustomCard } from './components/MyCustomCard.vue'
export { default as Trans } from './components/trans.vue'
export { default as ApiCascadeGenerator } from './components/api-cascade-generator.vue'
export { default as CascadePreviewModal } from './components/CascadePreviewModal.vue'

// 导出 API
export * from './api/inspection'
export * from './api/order'
export * from './api/rule'
export * from './api/system'

// 导出类型
export * from './types/inspection'

// 导出 mock 数据（开发环境）
export * from './mock/data'
export * from './mock/service'
export * from './mock/config-inspect'
