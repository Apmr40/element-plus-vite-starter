<script setup lang="ts">
import type { ComponentMode } from '~/demo/types/workbench'
import { Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import { computeChangeSummary, formToSnapshot } from '~/pages/workbench/composables/version-utils'
import ApiTemplatePanel from './custom-component/ApiTemplatePanel.vue'
import InstanceFixPanel from './custom-component/InstanceFixPanel.vue'
import ScriptTemplatePanel from './custom-component/ScriptTemplatePanel.vue'
import StepBasicInfo from './custom-component/StepBasicInfo.vue'
import StepPreview from './custom-component/StepPreview.vue'

const ctx = useWorkbenchContext()
const {
  showComponentDialog,
  componentMode,
  componentStep,
  customForm,
  customDrafts,
  componentScene,
  isEditScene,
  dialogTitle,
  isDraftReadonly,
  editOperationName,
  baseVersionNo,
  baseSnapshot,
  switchComponentMode,
  nextComponentStep,
  prevComponentStep,
  gotoComponentStep,
  handleComponentDialogClose,
  saveComponentDraft,
  submitComponent,
  openVersionHistory,
  submitEditPublish,
  editOperationId,
} = ctx

function handleModeChange(mode: string | number | boolean | undefined) {
  const m = mode as ComponentMode
  if (m === componentMode.value)
    return
  ElMessageBox.confirm('切换模式将清空已填内容，是否继续？', '切换模式', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => switchComponentMode(m))
    .catch(() => {})
}

function handleSaveDraft() {
  saveComponentDraft(customDrafts)
}

function handleSubmit() {
  // 编辑场景 → 走冲突检测发布流程
  if (isEditScene.value) {
    const args = submitComponent()
    if (!args)
      return
    const currentSnapshot = formToSnapshot(customForm)
    const changeSummary = baseSnapshot.value
      ? computeChangeSummary(baseSnapshot.value, currentSnapshot)
      : ['编辑发布']
    submitEditPublish(
      args.operationId,
      args.baseVersionNo,
      currentSnapshot,
      changeSummary,
      (ver) => {
        ElMessage.success(`已提交发布，审批通过后将生成 V${ver.versionNo}`)
      },
    )
    return
  }

  // 新建场景 → 原有确认流程
  ElMessageBox.confirm(
    '确认将该组件提交入库？入库后 confstatus 将置为 1（启用），组件将出现在「正式操作」列表。',
    '提交入库',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => submitComponent())
    .catch(() => {})
}

function handleOpenVersionHistory() {
  if (editOperationId.value) {
    openVersionHistory(editOperationId.value, editOperationName.value)
  }
}
</script>

<template>
  <el-dialog
    v-model="showComponentDialog"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    append-to-body
    class="component-dialog"
    @close="handleComponentDialogClose"
  >
    <!-- 编辑场景横幅：来源操作 + 基线版本 + 历史版本入口 -->
    <div v-if="isEditScene" class="edit-banner">
      <div class="edit-banner-info">
        <el-icon class="edit-banner-icon">
          <i-ep-edit />
        </el-icon>
        <span>正在编辑：<b>{{ editOperationName }}</b></span>
        <el-tag size="small" type="warning" effect="plain">
          基线 V{{ baseVersionNo }}
        </el-tag>
      </div>
      <el-button link type="primary" size="small" @click="handleOpenVersionHistory">
        <el-icon><i-ep-clock /></el-icon>
        历史版本
      </el-button>
    </div>

    <!-- 入库模式切换（仅新建场景显示） -->
    <div v-if="componentScene === 'create'" class="mode-bar">
      <span class="mode-label">入库模式</span>
      <el-radio-group :model-value="componentMode" @change="handleModeChange">
        <el-radio value="custom">
          定制模式
          <el-tag size="small" type="info" class="mode-tag">
            手工录入
          </el-tag>
        </el-radio>
        <el-radio value="instance">
          实例固化模式
          <el-tag size="small" type="info" class="mode-tag">
            继承公共组件
          </el-tag>
        </el-radio>
      </el-radio-group>
    </div>

    <!-- 步骤指示器（复用 ExecutionDialog 的 step-indicator 结构） -->
    <div class="step-indicator">
      <div
        class="step-item"
        :class="{ active: componentStep === 1, completed: componentStep > 1 }"
        @click="gotoComponentStep(1)"
      >
        <div class="step-circle">
          <el-icon v-if="componentStep > 1">
            <Check />
          </el-icon>
          <span v-else>1</span>
        </div>
        <span class="step-label">基本信息</span>
      </div>
      <div class="step-line" :class="{ active: componentStep > 1 }" />
      <div
        class="step-item"
        :class="{ active: componentStep === 2, completed: componentStep > 2 }"
        @click="gotoComponentStep(2)"
      >
        <div class="step-circle">
          <el-icon v-if="componentStep > 2">
            <Check />
          </el-icon>
          <span v-else>2</span>
        </div>
        <span class="step-label">参数配置</span>
      </div>
      <div class="step-line" :class="{ active: componentStep > 2 }" />
      <div class="step-item" :class="{ active: componentStep === 3 }">
        <div class="step-circle">
          <span>3</span>
        </div>
        <span class="step-label">确认预览</span>
      </div>
    </div>

    <!-- Step1 基本信息 -->
    <div v-if="componentStep === 1" class="step-content">
      <StepBasicInfo :readonly="isDraftReadonly" />
    </div>

    <!-- Step2 参数配置（按模式 + 模板大类分流） -->
    <div v-else-if="componentStep === 2" class="step-content">
      <ScriptTemplatePanel v-if="componentMode === 'custom' && customForm.tplCategory === 'script'" :readonly="isDraftReadonly" />
      <ApiTemplatePanel v-else-if="componentMode === 'custom' && customForm.tplCategory === 'api'" :readonly="isDraftReadonly" />
      <InstanceFixPanel v-else :readonly="isDraftReadonly" />
    </div>

    <!-- Step3 确认预览 -->
    <div v-else class="step-content">
      <StepPreview :readonly="isDraftReadonly" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="componentStep > 1" @click="prevComponentStep">
          上一步
        </el-button>
        <!-- 查看草稿：仅关闭 -->
        <template v-if="isDraftReadonly">
          <el-button @click="showComponentDialog = false">
            关闭
          </el-button>
        </template>
        <!-- 编辑/新建：保存草稿 + 下一步/提交 -->
        <template v-else>
          <el-button @click="handleSaveDraft">
            保存草稿
          </el-button>
          <el-button v-if="componentStep < 3" type="primary" @click="nextComponentStep">
            下一步
          </el-button>
          <el-button v-else type="primary" @click="handleSubmit">
            {{ isEditScene ? '提交发布' : '提交入库' }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;
@use '~/pages/workbench/workbench.scss' as *;

// 编辑场景横幅
.edit-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $uops-spacing-sm $uops-spacing-md;
  margin-bottom: $uops-spacing-lg;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: $uops-radius-sm;

  .edit-banner-info {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    font-size: $font-size-base;
    color: $uops-text-primary;
  }

  .edit-banner-icon {
    color: $uops-warning-color;
  }
}

// 入库模式切换条
.mode-bar {
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  padding: $uops-spacing-sm $uops-spacing-md;
  margin-bottom: $uops-spacing-lg;
  background: $uops-bg-color;
  border-radius: $uops-radius-sm;

  .mode-label {
    font-size: $font-size-base;
    font-weight: 600;
    color: $uops-text-primary;
    white-space: nowrap;
  }

  .mode-tag {
    margin-left: $uops-spacing-xs;
    vertical-align: middle;
  }
}
</style>
