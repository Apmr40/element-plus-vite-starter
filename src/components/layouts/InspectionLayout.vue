<!-- 应用配置巡检系统 - 布局组件 -->
<template>
  <div class="inspection-system-layout">
    <!-- 主内容区 -->
    <div class="layout-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
// 此布局组件继承自 BaseSide（在 App.vue 中使用）
// 仅作为巡检系统的额外容器，不包含导航
</script>

<style lang="scss" scoped>
.inspection-system-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fc;

  .layout-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: #f8f9fc;
  }
}
</style>
