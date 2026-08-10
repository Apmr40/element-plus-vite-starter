<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  showPublishDialog,
  selectedDraftIds,
  getDraftNameById,
  publishForm,
  submitPublish,
  showScenarioPublishDialog,
  selectedScenarioDraftIds,
  getScenarioDraftNameById,
  scenarioPublishForm,
  submitScenarioPublish,
} = useWorkbenchContext()
</script>

<template>
  <!-- 批量发布弹窗（操作组件草稿） -->
  <el-dialog
    v-model="showPublishDialog"
    title="批量发布确认"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="publish-dialog-content">
      <div class="publish-info">
        <h4>本次发布包含以下草稿：</h4>
        <div class="draft-list">
          <div v-for="id in selectedDraftIds" :key="id" class="draft-item">
            <el-icon><Document /></el-icon>
            <span>{{ getDraftNameById(id) }}</span>
          </div>
        </div>
      </div>

      <el-form :model="publishForm" label-width="100px" class="publish-form">
        <el-form-item label="批次名称">
          <el-input
            v-model="publishForm.name"
            placeholder="请输入批次名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="发布说明">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入发布说明"
          />
        </el-form-item>
      </el-form>

      <div class="workflow-info">
        <h4>审核流程：</h4>
        <div class="workflow-steps">
          <div class="step-item">
            <div class="step-icon">
              1
            </div>
            <span>一线主管</span>
          </div>
          <div class="step-arrow">
            →
          </div>
          <div class="step-item">
            <div class="step-icon">
              2
            </div>
            <span>二线主管</span>
          </div>
          <div class="step-arrow">
            →
          </div>
          <div class="step-item">
            <div class="step-icon">
              3
            </div>
            <span>运维经理</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="showPublishDialog = false">
        取消
      </el-button>
      <el-button type="primary" @click="submitPublish">
        提交审核
      </el-button>
    </template>
  </el-dialog>

  <!-- 编排批量发布弹窗 -->
  <el-dialog
    v-model="showScenarioPublishDialog"
    title="编排批量发布确认"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="publish-dialog-content">
      <div class="publish-info">
        <h4>本次发布包含以下编排草稿：</h4>
        <div class="draft-list">
          <div v-for="id in selectedScenarioDraftIds" :key="id" class="draft-item">
            <el-icon><Document /></el-icon>
            <span>{{ getScenarioDraftNameById(id) }}</span>
          </div>
        </div>
      </div>

      <el-form :model="scenarioPublishForm" label-width="100px" class="publish-form">
        <el-form-item label="批次名称">
          <el-input
            v-model="scenarioPublishForm.name"
            placeholder="请输入批次名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="发布说明">
          <el-input
            v-model="scenarioPublishForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入发布说明"
          />
        </el-form-item>
      </el-form>

      <div class="workflow-info">
        <h4>审核流程：</h4>
        <div class="workflow-steps">
          <div class="step-item">
            <div class="step-icon">
              1
            </div>
            <span>一线主管</span>
          </div>
          <div class="step-arrow">
            →
          </div>
          <div class="step-item">
            <div class="step-icon">
              2
            </div>
            <span>二线主管</span>
          </div>
          <div class="step-arrow">
            →
          </div>
          <div class="step-item">
            <div class="step-icon">
              3
            </div>
            <span>运维经理</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="showScenarioPublishDialog = false">
        取消
      </el-button>
      <el-button type="primary" @click="submitScenarioPublish">
        提交审核
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;
@use '~/pages/workbench/workbench.scss' as *;
</style>
