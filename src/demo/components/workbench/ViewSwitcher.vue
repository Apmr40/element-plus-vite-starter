<script setup lang="ts">
/**
 * 视图切换器 —— 卡片 ⇄ 表单（表格）
 *
 * 图标分段按钮，置于各分区 tab 操作栏（设计文档 §3）。
 * 粒度按分区记忆（workbench_view_custom / workbench_view_orchestration），
 * 同一分区内正式/草稿 tab 共享视图。
 */
import { Grid, Menu } from '@element-plus/icons-vue'

defineProps<{ modelValue: 'card' | 'table' }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: 'card' | 'table'): void }>()
</script>

<template>
  <div class="view-switcher">
    <div
      class="view-switcher-item"
      :class="{ active: modelValue === 'card' }"
      title="卡片视图"
      @click="emit('update:modelValue', 'card')"
    >
      <el-icon><Grid /></el-icon>
    </div>
    <div
      class="view-switcher-item"
      :class="{ active: modelValue === 'table' }"
      title="表单视图"
      @click="emit('update:modelValue', 'table')"
    >
      <el-icon><Menu /></el-icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.view-switcher {
  display: flex;
  align-items: center;
  border: 1px solid $uops-border-color;
  border-radius: $uops-radius-sm;
  overflow: hidden;

  .view-switcher-item {
    display: flex;
    align-items: center;
    padding: $uops-spacing-xs $uops-spacing-sm;
    color: $uops-text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: $uops-primary-color;
    }

    &.active {
      color: $uops-primary-color;
      background: $uops-primary-color-light;
    }

    & + .view-switcher-item {
      border-left: 1px solid $uops-border-color;
    }

    .ep-icon {
      font-size: 14px;
    }
  }
}
</style>
