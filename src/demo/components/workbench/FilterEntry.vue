<script setup lang="ts">
/**
 * 筛选入口 —— 「筛选」按钮 + 收起态 chips 内联（筛选条收纳方案）
 *
 * 三态交互：
 * - 无筛选 + 收起：仅图标按钮
 * - 有筛选 + 收起：按钮高亮（主色）+ 内联 chips（可逐个移除）+ 清除
 * - 展开：按钮激活态 + 下方面板（面板由页面用 v-if=filterExpanded 包 FilterBar）
 *
 * 纯渲染组件：状态全部来自 useWorkbenchContext()。
 * 按钮本身不渲染面板，保持单一职责（设计 §技术改动点 3/4）。
 */
import { Filter } from '@element-plus/icons-vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import FilterChips from './FilterChips.vue'

const {
  filterExpanded,
  hasActiveFilter,
  toggleFilterExpanded,
} = useWorkbenchContext()
</script>

<template>
  <div class="filter-entry">
    <div
      class="filter-toggle-btn"
      :class="{ active: hasActiveFilter, expanded: filterExpanded }"
      title="筛选"
      @click="toggleFilterExpanded"
    >
      <el-icon><Filter /></el-icon>
      <span>筛选</span>
    </div>
    <!-- 收起态：chips 内联在按钮旁（展开态下面板自身已展示条件，无需重复） -->
    <FilterChips v-if="!filterExpanded" />
  </div>
</template>

<style lang="scss" scoped>
@use '~/pages/workbench/workbench.scss' as *;
</style>
