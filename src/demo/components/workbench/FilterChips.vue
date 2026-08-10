<script setup lang="ts">
/**
 * 筛选条件 Chips —— 收起态内联展示激活的筛选条件（筛选条收纳方案）
 *
 * 纯渲染组件：状态全部来自 useWorkbenchContext()。
 * 每个 chip 可点 × 单独移除；末尾「清除」一键清空。
 * 分类 chip 移除即回到"全部"；标签 chip 逐个移除。
 */
import { Close } from '@element-plus/icons-vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  activeFilterChips,
  removeFilterChip,
  resetOperationFilters,
} = useWorkbenchContext()
</script>

<template>
  <div v-if="activeFilterChips.length > 0" class="filter-chips">
    <span
      v-for="chip in activeFilterChips"
      :key="`${chip.type}-${chip.value}`"
      class="filter-chip"
    >
      <span class="chip-prefix">{{ chip.type === 'category' ? '分类' : '标签' }}</span>
      <span class="chip-label">{{ chip.label }}</span>
      <el-icon class="chip-close" @click="removeFilterChip(chip)"><Close /></el-icon>
    </span>
    <span class="filter-chips-clear" @click="resetOperationFilters()">清除</span>
  </div>
</template>

<style lang="scss" scoped>
@use '~/pages/workbench/workbench.scss' as *;
</style>
