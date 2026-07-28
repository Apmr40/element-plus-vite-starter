<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/config-inspect/strategy', label: '巡检策略' },
  { path: '/config-inspect/plan', label: '巡检计划' },
  { path: '/config-inspect/result', label: '巡检结果' },
]
</script>

<template>
  <div class="ci-layout">
    <div class="ci-header">
      <div class="ci-header-left">
        <span class="ci-logo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="ci-title">配置巡检</span>
      </div>
      <nav class="ci-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="ci-nav-item"
          :class="{ active: route.path.startsWith(item.path) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="ci-header-right">
        <span class="ci-env-tag">UOPS 一体化生产运维平台</span>
      </div>
    </div>
    <div class="ci-body">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.ci-layout {
  min-height: 100vh;
  background: linear-gradient(160deg, #eef4fb 0%, #f5f8fc 40%, #f0f4f9 100%);
}
.ci-header {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 1px 6px rgba(74, 144, 226, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.ci-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 48px;
}
.ci-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3290ff, #0069e6);
  color: #fff;
}
.ci-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.ci-nav {
  display: flex;
  gap: 4px;
  flex: 1;
}
.ci-nav-item {
  position: relative;
  padding: 6px 20px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s;
}
.ci-nav-item:hover {
  color: var(--el-color-primary);
  background: rgba(50, 144, 255, 0.06);
}
.ci-nav-item.active {
  color: var(--el-color-primary);
  font-weight: 600;
  background: rgba(50, 144, 255, 0.08);
}
.ci-nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -9px;
  left: 20px;
  right: 20px;
  height: 2px;
  border-radius: 1px;
  background: var(--el-color-primary);
}
.ci-header-right {
  margin-left: auto;
}
.ci-env-tag {
  font-size: 12px;
  color: var(--uops-text-color-special, #7c9cb4);
  padding: 3px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--uops-bg-card-small, #f3f6f9);
}
.ci-body {
  padding: 16px 24px 24px;
}
</style>
