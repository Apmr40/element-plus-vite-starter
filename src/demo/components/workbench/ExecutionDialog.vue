<script setup lang="ts">
import { Check, CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  showParamDialog,
  currentOperation,
  executionStep,
  currentParamConfig,
  paramForm,
  paramFormRules,
  paramFormRef,
  resourceForm,
  resourceSearchKeyword,
  datacenterOptions,
  clusterOptions,
  namespaceOptions,
  deploymentOptions,
  filteredResources,
  currentExecution,
  executing,
  handleDatacenterChange,
  handleClusterChange,
  handleNamespaceChange,
  handleDeploymentChange,
  handleSubmitExecution,
  handleRetryExecution,
  handleCloseExecutionDialog,
  handleBackToParamConfig,
  handleViewHistory,
  getExecutionResultStatusType,
  getExecutionResultStatusText,
  getDetailStatusType,
  getDetailStatusText,
  calcExecutionDuration,
  handleViewDetail,
  handleRetrySingleResource,
} = useWorkbenchContext()
</script>

<template>
  <el-dialog
    v-model="showParamDialog"
    :title="`执行操作 - ${currentOperation?.name || ''}`"
    width="900px"
    :close-on-click-modal="false"
    class="execute-dialog"
    @close="handleCloseExecutionDialog"
  >
    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <div class="step-item" :class="{ active: executionStep === 1, completed: executionStep === 2 }">
        <div class="step-circle">
          <el-icon v-if="executionStep === 2">
            <Check />
          </el-icon>
          <span v-else>1</span>
        </div>
        <span class="step-label">参数配置</span>
      </div>
      <div class="step-line" :class="{ active: executionStep === 2 }" />
      <div class="step-item" :class="{ active: executionStep === 2 }">
        <div class="step-circle">
          <span>2</span>
        </div>
        <span class="step-label">执行结果</span>
      </div>
    </div>

    <!-- 步骤1: 参数配置 -->
    <div v-if="executionStep === 1" class="step-content">
      <!-- 区域1: 操作介绍 -->
      <div class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">操作介绍</span>
        </div>
        <div class="operation-intro">
          <div class="intro-row">
            <span class="intro-label">操作名称：</span>
            <span class="intro-value">{{ currentOperation?.name }}</span>
          </div>
          <div class="intro-row">
            <span class="intro-label">操作描述：</span>
            <span class="intro-value">{{ currentOperation?.description }}</span>
          </div>
          <div class="intro-row">
            <span class="intro-label">风险等级：</span>
            <el-tag :type="currentOperation?.riskLevel === 'high' ? 'danger' : currentOperation?.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
              {{ currentOperation?.riskLevel === 'high' ? '高风险' : currentOperation?.riskLevel === 'medium' ? '中风险' : '低风险' }}
            </el-tag>
          </div>
          <div class="intro-row">
            <span class="intro-label">标签：</span>
            <el-tag v-for="tag in currentOperation?.tags" :key="tag" size="small" class="intro-tag">
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 区域2: 参数填写 -->
      <div class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">参数填写</span>
        </div>
        <el-form
          ref="paramFormRef"
          :model="paramForm"
          :rules="paramFormRules"
          label-width="100px"
          class="param-form"
        >
          <el-row :gutter="20">
            <el-col v-for="field in currentParamConfig" :key="field.field" :span="12">
              <el-form-item :label="field.label" :prop="field.field">
                <el-input
                  v-if="field.type === 'input'"
                  v-model="paramForm[field.field]"
                  :placeholder="field.placeholder"
                />
                <el-input
                  v-else-if="field.type === 'textarea'"
                  v-model="paramForm[field.field]"
                  type="textarea"
                  :rows="3"
                  :placeholder="field.placeholder"
                />
                <el-select
                  v-else-if="field.type === 'select'"
                  v-model="paramForm[field.field]"
                  :placeholder="field.placeholder || '请选择'"
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in field.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 区域3: 资源选择 -->
      <div class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">资源选择</span>
        </div>
        <div class="resource-selection">
          <div class="cascade-selectors">
            <div class="selector-row">
              <div class="selector-item">
                <span class="selector-label required">Datacenter:</span>
                <el-select v-model="resourceForm.datacenter" placeholder="请选择" @change="handleDatacenterChange">
                  <el-option v-for="item in datacenterOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
              <div class="selector-item">
                <span class="selector-label required">Cluster:</span>
                <el-select v-model="resourceForm.cluster" placeholder="请选择" @change="handleClusterChange">
                  <el-option v-for="item in clusterOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
              <div class="selector-item">
                <span class="selector-label required">Namespace:</span>
                <el-select v-model="resourceForm.namespace" placeholder="请选择" @change="handleNamespaceChange">
                  <el-option v-for="item in namespaceOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
            </div>
            <div class="selector-row">
              <div class="selector-item">
                <span class="selector-label required">Deployment:</span>
                <el-select v-model="resourceForm.deployment" placeholder="请选择" @change="handleDeploymentChange">
                  <el-option v-for="item in deploymentOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </div>
            </div>
          </div>
          <div class="resource-search">
            <el-input
              v-model="resourceSearchKeyword"
              placeholder="请输入资源筛选关键字"
              suffix-icon="Search"
              clearable
              style="width: 280px"
            />
          </div>
          <el-table
            :data="filteredResources"
            border
            style="width: 100%; margin-top: 12px"
            max-height="200"
          >
            <el-table-column type="selection" width="45" />
            <el-table-column prop="name" label="POD名称" sortable />
            <el-table-column prop="ip" label="IP" sortable />
            <el-table-column prop="status" label="状态" sortable>
              <template #default="{ row }">
                <el-tag :type="row.status === 'Running' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 步骤2: 执行结果 -->
    <div v-if="executionStep === 2 && currentExecution" class="step-content">
      <!-- 执行概要 -->
      <div class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">执行概要</span>
        </div>
        <div class="execution-summary">
          <div class="summary-row">
            <span class="summary-label">操作名称：</span>
            <span class="summary-value">{{ currentExecution.serviceCnName }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">执行时间：</span>
            <span class="summary-value">{{ currentExecution.implementTime }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">执行状态：</span>
            <el-tag :type="getExecutionResultStatusType(currentExecution.execStatus)" size="small">
              {{ getExecutionResultStatusText(currentExecution.execStatus) }}
              ({{ currentExecution.successCount }}/{{ currentExecution.totalCount }})
            </el-tag>
          </div>
          <div v-if="currentExecution.endTime" class="summary-row">
            <span class="summary-label">总耗时：</span>
            <span class="summary-value">{{ calcExecutionDuration(currentExecution.startTime, currentExecution.endTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">执行进度</span>
        </div>
        <div class="execution-progress">
          <el-progress
            :percentage="Math.round((currentExecution.successCount / currentExecution.totalCount) * 100)"
            :status="currentExecution.execStatus === 'S' ? 'success' : currentExecution.execStatus === 'F' ? 'exception' : undefined"
            :stroke-width="16"
          />
        </div>
      </div>

      <!-- 资源明细 -->
      <div class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">资源明细</span>
        </div>
        <el-table :data="currentExecution.details" border style="width: 100%">
          <el-table-column prop="pkDisplay" label="资源标识" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getDetailStatusType(row.execStatus)" size="small">
                <el-icon v-if="row.execStatus === 'P'" class="is-loading">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="row.execStatus === 'S'">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else-if="row.execStatus === 'F'">
                  <CircleClose />
                </el-icon>
                <span>{{ getDetailStatusText(row.execStatus) }}</span>
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="耗时" width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.startTime && row.endTime">
                {{ calcExecutionDuration(row.startTime, row.endTime) }}
              </span>
              <span v-else-if="row.execStatus === 'P'" class="running-text">执行中...</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                详情
              </el-button>
              <el-button
                v-if="row.execStatus === 'F'"
                type="warning"
                link
                size="small"
                @click="handleRetrySingleResource(row)"
              >
                重试
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 错误信息 -->
      <div v-if="currentExecution.details.some(d => d.execStatus === 'F' && d.errorMsg)" class="execute-section">
        <div class="section-title-bar">
          <div class="title-indicator" />
          <span class="title-text">错误信息</span>
        </div>
        <div class="error-info">
          <div v-for="detail in currentExecution.details.filter(d => d.execStatus === 'F' && d.errorMsg)" :key="detail.serviceSeqId" class="error-item">
            <el-icon class="error-icon">
              <CircleClose />
            </el-icon>
            <span class="error-resource">{{ detail.pkDisplay }}：</span>
            <span class="error-msg">{{ detail.errorMsg }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <template v-if="executionStep === 1">
          <el-button @click="handleCloseExecutionDialog">
            取消
          </el-button>
          <el-button type="primary" :loading="executing" @click="handleSubmitExecution">
            提交执行
          </el-button>
        </template>
        <template v-else>
          <el-button @click="handleBackToParamConfig">
            返回
          </el-button>
          <el-button @click="handleRetryExecution">
            重新执行
          </el-button>
          <el-button @click="handleViewHistory">
            查看历史
          </el-button>
          <el-button @click="handleCloseExecutionDialog">
            关闭
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;
@use '~/pages/workbench/workbench.scss' as *;
</style>
