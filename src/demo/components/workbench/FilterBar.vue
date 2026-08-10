<script setup lang="ts">
/**
 * 筛选条 —— 三个 tab 共享的统一筛选 UI（设计文档 §4.1）
 *
 * 纯渲染组件：状态全部来自 useWorkbenchContext()。
 * 维度可用性由 visibleTags 控制（按 tab 裁剪，设计 §4.2）：
 * - 公共组件：仅操作分类
 * - 我的收藏 / 应用定制：操作分类 + 自定义标签
 *
 * 操作分类枚举全量恒定（Q2 决策），不随结果集收缩。
 */
import type { OperationCategory } from '~/demo/types/workbench'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

defineProps<{
  /** 是否展示自定义标签筛选（公共组件 tab 为 false） */
  showCustomTags: boolean
}>()

const {
  operationCategoryFilter,
  customTagFilter,
  categoryOptions,
  customTagOptions,
  resetOperationFilters,
} = useWorkbenchContext()

function selectCategory(value: OperationCategory | '') {
  operationCategoryFilter.value = value
}

function hasActiveFilter(): boolean {
  return operationCategoryFilter.value !== '' || customTagFilter.value.length > 0
}
</script>

<template>
  <div class="filter-bar">
    <span class="filter-label">筛选：</span>

    <!-- 操作分类：tag 单选（与收藏区一级分类筛选同交互） -->
    <div class="filter-group">
      <span class="filter-group-label">操作分类</span>
      <span
        class="filter-tag"
        :class="{ active: operationCategoryFilter === '' }"
        @click="selectCategory('')"
      >全部</span>
      <span
        v-for="opt in categoryOptions"
        :key="opt.value"
        class="filter-tag"
        :class="{ active: operationCategoryFilter === opt.value }"
        @click="selectCategory(opt.value)"
      >{{ opt.label }}</span>
    </div>

    <!-- 自定义标签：多选下拉（仅应用定制/收藏 tab） -->
    <div v-if="showCustomTags" class="filter-group">
      <span class="filter-group-label">自定义标签</span>
      <el-select
        v-model="customTagFilter"
        multiple
        clearable
        allow-create
        default-first-option
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="2"
        placeholder="选择或新建标签"
        class="tag-filter-select"
        popper-class="tag-filter-popper"
      >
        <el-option
          v-for="tag in customTagOptions"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
    </div>

    <span
      v-if="hasActiveFilter()"
      class="filter-clear"
      @click="resetOperationFilters()"
    >清除筛选</span>
  </div>
</template>

<style lang="scss" scoped>
@use '~/pages/workbench/workbench.scss' as *;
</style>
