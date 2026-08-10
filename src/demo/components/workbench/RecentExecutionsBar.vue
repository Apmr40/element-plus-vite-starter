<script setup lang="ts">
import { CircleCheckFilled, CircleCloseFilled, Clock, Close, Loading } from '@element-plus/icons-vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  recentExecutions,
  recentOrchestrationExecutions,
  getRecentStatusType,
  getRecentStatusText,
  getOrchestrationStatusType,
  getOrchestrationStatusText,
  handleRecentExecutionClick,
  handleOpenOrchestrationHistoryDrawer,
  dismissRecentExecution,
  dismissRecentOrchestrationExecution,
} = useWorkbenchContext()

// 状态 → 图标组件映射（原 composable 返回字符串名，这里映射为实际组件以保证渲染）
function recentStatusIcon(status: string) {
  const map: Record<string, any> = {
    success: CircleCheckFilled,
    failed: CircleCloseFilled,
    running: Loading,
  }
  return map[status] || Clock
}
</script>

<template>
  <div
    v-if="recentExecutions.length > 0 || recentOrchestrationExecutions.length > 0"
    class="recent-executions-bar"
  >
    <div class="recent-executions-content">
      <span class="recent-label">最近执行：</span>
      <div class="recent-list">
        <!-- 操作组件执行记录 -->
        <div
          v-for="execution in recentExecutions"
          :key="`component-${execution.id}`"
          class="recent-item"
          :class="`status-${execution.status}`"
          @click="handleRecentExecutionClick(execution)"
        >
          <el-icon class="status-icon" :class="`status-${execution.status}`">
            <component :is="recentStatusIcon(execution.status)" />
          </el-icon>
          <span class="recent-name">{{ execution.name }}</span>
          <el-tag :type="getRecentStatusType(execution.status)" size="small" effect="light">
            {{ getRecentStatusText(execution) }}
          </el-tag>
          <span class="source-tag component-tag">组件</span>
          <el-icon class="close-icon" @click.stop="dismissRecentExecution(execution.id)">
            <Close />
          </el-icon>
        </div>
        <!-- 编排执行记录 -->
        <div
          v-for="execution in recentOrchestrationExecutions"
          :key="`orchestration-${execution.id}`"
          class="recent-item"
          :class="`status-${execution.status}`"
          @click="handleOpenOrchestrationHistoryDrawer"
        >
          <el-icon class="status-icon" :class="`status-${execution.status}`">
            <component :is="recentStatusIcon(execution.status)" />
          </el-icon>
          <span class="recent-name">{{ execution.name }}</span>
          <el-tag :type="getOrchestrationStatusType(execution.status)" size="small" effect="light">
            {{ getOrchestrationStatusText(execution) }}
          </el-tag>
          <span class="source-tag orchestration-tag">编排</span>
          <el-icon class="close-icon" @click.stop="dismissRecentOrchestrationExecution(execution.id)">
            <Close />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;
@use '~/pages/workbench/workbench.scss' as *;
</style>
