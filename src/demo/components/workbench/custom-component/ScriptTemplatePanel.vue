<script setup lang="ts">
import type { ComponentParm } from '~/demo/types/workbench'
import { ElMessageBox } from 'element-plus'
import { SCRIPT_SUBTYPES } from '~/demo/types/workbench'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import CodeEditor from './CodeEditor.vue'
import ParmSection from './ParmSection.vue'

defineProps<{ readonly?: boolean }>()

const {
  customForm,
  currentScriptSubtype,
  extractedVars,
  addManualParm,
  removeParm,
} = useWorkbenchContext()

function handleRemoveParm(row: ComponentParm) {
  if (row.source === 'template') {
    ElMessageBox.confirm(
      '该参数来自模板提取，删除后模板内变量仍存在，执行时将缺少传参。确认删除？',
      '删除参数',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
      .then(() => removeParm(row.id))
      .catch(() => {})
  }
  else {
    removeParm(row.id)
  }
}
</script>

<template>
  <div class="execute-section">
    <div class="subtype-bar">
      <span class="st-label"><span class="req">*</span> 脚本类型</span>
      <div class="subtype-pills">
        <span
          v-for="st in SCRIPT_SUBTYPES"
          :key="st.value"
          class="subtype-pill"
          :class="{ active: customForm.scriptSubtype === st.value, disabled: readonly }"
          @click="!readonly && (customForm.scriptSubtype = st.value)"
        >{{ st.label }}</span>
      </div>
    </div>

    <CodeEditor
      v-model="customForm.scriptContent"
      :lang="currentScriptSubtype.lang"
      :lang-tag="currentScriptSubtype.lang"
      var-format="${param_name}"
      :disabled="readonly"
    >
      <template #footer>
        <div class="extract-bar">
          <span>自动提取变量：</span>
          <template v-if="extractedVars.length">
            <span v-for="v in extractedVars" :key="v" class="var-chip">{{ v }}<span class="src">🔗</span></span>
          </template>
          <span v-else class="var-none">无</span>
        </div>
      </template>
    </CodeEditor>

    <div class="success-rule">
      <div class="sr-head">
        <span class="sr-title">成功判定规则</span>
        <span class="sr-opt">选填，默认 exit_code==0</span>
      </div>
      <el-input
        v-model="customForm.scriptSuccessFlag"
        placeholder="如：output.contains('SUCCESS')，留空则默认 exit_code==0"
        :disabled="readonly"
      />
    </div>
  </div>

  <ParmSection
    :parms="customForm.parms"
    :extracted-vars="extractedVars"
    :disabled="readonly"
    @add="addManualParm"
    @remove="handleRemoveParm"
  />
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.subtype-bar {
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-md;

  .st-label {
    font-size: $font-size-base;
    color: $uops-text-primary;
    white-space: nowrap;
  }
}

.req {
  color: $uops-danger-color;
  margin-right: 2px;
}

.subtype-pills {
  display: flex;
  gap: $uops-spacing-sm;

  .subtype-pill {
    padding: 4px 14px;
    border: 1px solid $uops-border-color;
    border-radius: 14px;
    font-size: $font-size-label;
    color: $uops-text-secondary;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;

    &:hover {
      border-color: $uops-primary-color;
      color: $uops-primary-color;
    }

    &.active {
      background: $uops-primary-color;
      border-color: $uops-primary-color;
      color: #fff;
      font-weight: 600;
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
}

// 变量提取条
.extract-bar {
  display: flex;
  align-items: center;
  gap: $uops-spacing-sm;
  padding: $uops-spacing-sm $uops-spacing-md;
  background: $bg-card-large;
  border-top: 1px solid var(--el-border-color-light);
  font-size: $font-size-label;
  color: $uops-text-secondary;
  min-height: 34px;
  flex-wrap: wrap;

  .var-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fff;
    border: 1px solid rgba($uops-primary-color, 0.4);
    color: $uops-primary-color;
    border-radius: 10px;
    padding: 2px 10px;
    font-family: 'SFMono-Regular', Consolas, monospace;
    animation: chipIn 0.25s ease;

    .src {
      font-size: 10px;
      color: $uops-text-placeholder;
    }
  }

  .var-none {
    color: $uops-text-placeholder;
  }
}

@keyframes chipIn {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 成功判定规则
.success-rule {
  margin-top: $uops-spacing-lg;
  padding: $uops-spacing-md $uops-spacing-lg;
  background: $uops-bg-nested;
  border-radius: $uops-radius-sm;
  border-left: 3px solid $uops-success-color;

  .sr-head {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    margin-bottom: $uops-spacing-sm;
  }

  .sr-title {
    font-size: $font-size-base;
    font-weight: 700;
    color: $uops-text-primary;
  }

  .sr-opt {
    font-size: $font-size-label;
    color: $uops-text-placeholder;
  }

  :deep(.ep-textarea__inner),
  :deep(.ep-input__inner) {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 13px;
  }
}
</style>
