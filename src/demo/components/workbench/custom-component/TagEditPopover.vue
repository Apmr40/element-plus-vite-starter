<script setup lang="ts">
/**
 * 编辑标签 Popover —— 单个操作的自定义标签管理（设计文档 §5.1）
 *
 * 交互：当前应用系统全部标签的 checkbox 列表（已选中勾选）
 * + 底部「+ 新标签」行内输入（allow-create 等价于 FilterBar 的行内创建）。
 * 确认 → 整体覆盖该操作的 customTags。权限提示不出现（概念隔离，§2）。
 *
 * 纯渲染组件：通过 props 接收操作，emit 提交。
 */
import type { OperationComponent } from '~/demo/types/workbench'
import { computed, ref, watch } from 'vue'
import { MAX_CUSTOM_TAGS, validateTagName } from '~/demo/types/workbench'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const props = defineProps<{
  operation: OperationComponent
}>()

const emit = defineEmits<{
  (e: 'confirm', operationId: string, tags: string[]): void
}>()

const { customTagOptions } = useWorkbenchContext()

const visible = ref(false)
const checked = ref<string[]>([])
const newTagInput = ref('')
const newTagError = ref('')

// 打开时从操作当前 customTags 初始化勾选态
watch(visible, (open) => {
  if (open) {
    checked.value = [...(props.operation.customTags || [])]
    newTagInput.value = ''
    newTagError.value = ''
  }
})

// 已达上限时禁止继续勾选
const isAtLimit = computed(() => checked.value.length >= MAX_CUSTOM_TAGS)

function toggleTag(tag: string) {
  const idx = checked.value.indexOf(tag)
  if (idx >= 0) {
    checked.value.splice(idx, 1)
    return
  }
  if (isAtLimit.value)
    return
  checked.value.push(tag)
}

/** 行内新建标签（去重，设计 §8） */
function addNewTag() {
  const result = validateTagName(newTagInput.value)
  if (!result.valid) {
    newTagError.value = result.message
    return
  }
  const name = newTagInput.value.trim()
  newTagError.value = ''
  if (!checked.value.includes(name)) {
    if (isAtLimit.value) {
      newTagError.value = `最多选择 ${MAX_CUSTOM_TAGS} 个标签`
      return
    }
    checked.value.push(name)
  }
  newTagInput.value = ''
}

function confirm() {
  emit('confirm', props.operation.id, [...checked.value])
  visible.value = false
}

/** 供外部（如卡片更多菜单「编辑标签」项）程序化打开 */
function open() {
  visible.value = true
}

defineExpose({ open })
</script>

<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="280"
    trigger="click"
    popper-class="tag-edit-popper"
  >
    <template #reference>
      <slot />
    </template>

    <div class="tag-edit-panel">
      <div class="tag-edit-title">
        编辑标签
        <span class="tag-edit-count">{{ checked.length }}/{{ MAX_CUSTOM_TAGS }}</span>
      </div>

      <!-- 现有标签 checkbox 列表 -->
      <div class="tag-edit-list">
        <label
          v-for="tag in customTagOptions"
          :key="tag"
          class="tag-edit-item"
          :class="{
            checked: checked.includes(tag),
            disabled: !checked.includes(tag) && isAtLimit,
          }"
          @click="toggleTag(tag)"
        >
          <el-icon v-if="checked.includes(tag)"><Select /></el-icon>
          <span>{{ tag }}</span>
        </label>
        <div v-if="customTagOptions.length === 0 && checked.length === 0" class="tag-edit-empty">
          暂无标签，可下方新建
        </div>
      </div>

      <!-- 行内新建 -->
      <div class="tag-edit-new">
        <el-input
          v-model="newTagInput"
          size="small"
          :maxlength="12"
          placeholder="+ 新标签（回车创建）"
          @keyup.enter="addNewTag"
          @input="newTagError = ''"
        />
        <div v-if="newTagError" class="tag-edit-error">
          {{ newTagError }}
        </div>
      </div>

      <div class="tag-edit-footer">
        <el-button size="small" @click="visible = false">
          取消
        </el-button>
        <el-button size="small" type="primary" @click="confirm">
          确认
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<style lang="scss" scoped>
@use '~/pages/workbench/workbench.scss' as *;
</style>
