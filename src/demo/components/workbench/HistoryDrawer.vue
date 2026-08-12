<script setup lang="ts">
import type { ExecutionDetail, ExecutionRecord, ExecutionTicket } from '~/demo/types/workbench'
import {
  ArrowDown,
  Download,
  MagicStick,
  Refresh,
  RefreshRight,
  WarningFilled,
} from '@element-plus/icons-vue'
import DiagnosticPanel from '~/demo/components/DiagnosticPanel.vue'
import ResourceDetailDialog from '~/demo/components/workbench/ResourceDetailDialog.vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  showHistoryDrawer,
  historyDrawerActiveTab,
  historyDrawerFilter,
  orchestrationHistoryDrawerFilter,
  filteredHistoryDrawerList,
  filteredOrchestrationHistoryDrawerList,
  expandedHistoryIds,
  expandedOrchestrationHistoryIds,
  handleBatchRetryFailed,
  handleBatchRetryOrchestrationFailed,
  handleExportHistory,
  handleExportOrchestrationHistory,
  handleRefreshHistory,
  toggleHistoryExpand,
  toggleOrchestrationHistoryExpand,
  getHistoryStatusType,
  getHistoryStatusText,
  formatHistoryTime,
  getFirstError,
  getDetailStatusType,
  getDetailStatusText,
  handleViewResourceDetail,
  handleRetryDetail,
  openDiagnosticForDetail,
  getOrchestrationStatusType,
  getOrchestrationStatusText,
  formatOrchestrationHistoryTime,
  getOrchestrationFirstError,
  handleOrchestrationRetry,
  handleOrchestrationViewDetail,
  openDiagnostic,
  showDiagnosticPanel,
  diagnosticRecordId,
  diagnosticOperationName,
  diagnosticOperationCategory,
  diagnosticFailedResources,
} = useWorkbenchContext()

/** 流程单标签文案（变更单/事件单，§5 Popover） */
function ticketLabel(ticket: ExecutionTicket): string {
  return ticket.type === 'change' ? '变更单' : '事件单'
}

/** 耗时格式化（无值返回 '-'） */
function formatDuration(duration?: number): string {
  return duration != null ? `${duration.toFixed(1)}s` : '-'
}
</script>

<template>
  <el-drawer
    v-model="showHistoryDrawer"
    title="执行历史"
    size="900px"
    direction="rtl"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="drawer-header">
        <span class="drawer-title">执行历史</span>
        <div class="drawer-actions">
          <el-button size="small" @click="historyDrawerActiveTab === 'component' ? handleBatchRetryFailed() : handleBatchRetryOrchestrationFailed()">
            <el-icon><Refresh /></el-icon>
            批量重试失败
          </el-button>
          <el-button size="small" @click="historyDrawerActiveTab === 'component' ? handleExportHistory() : handleExportOrchestrationHistory()">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button size="small" @click="handleRefreshHistory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </template>

    <div class="history-drawer-content">
      <!-- Tab 切换 -->
      <div class="history-tabs">
        <div
          class="history-tab"
          :class="{ active: historyDrawerActiveTab === 'component' }"
          @click="historyDrawerActiveTab = 'component'"
        >
          操作组件
        </div>
        <div
          class="history-tab"
          :class="{ active: historyDrawerActiveTab === 'orchestration' }"
          @click="historyDrawerActiveTab = 'orchestration'"
        >
          操作编排
        </div>
      </div>

      <!-- 操作组件历史记录 -->
      <div v-if="historyDrawerActiveTab === 'component'" class="history-content">
        <!-- 筛选区域 -->
        <div class="history-filters">
          <el-select v-model="historyDrawerFilter.timeRange" placeholder="时间范围" size="small">
            <el-option label="今日" value="today" />
            <el-option label="近7天" value="7days" />
            <el-option label="近30天" value="30days" />
            <el-option label="全部" value="all" />
          </el-select>
          <el-select v-model="historyDrawerFilter.status" placeholder="全部状态" clearable size="small">
            <el-option label="执行中" value="running" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-input
            v-model="historyDrawerFilter.keyword"
            placeholder="搜索操作名称..."
            prefix-icon="Search"
            clearable
            size="small"
          />
        </div>

        <!-- 历史记录列表 -->
        <div class="history-list">
          <div
            v-for="record in filteredHistoryDrawerList"
            :key="record.id"
            class="history-record-card"
          >
            <!-- 记录头部 -->
            <div class="record-header" @click="toggleHistoryExpand(record.id)">
              <div class="record-main">
                <div class="record-title">
                  <span class="record-name">{{ record.name }}</span>
                  <el-tag
                    :type="getHistoryStatusType(record.status)"
                    size="small"
                    effect="light"
                  >
                    {{ getHistoryStatusText(record) }}
                  </el-tag>
                </div>
                <div class="record-meta">
                  <span class="meta-time">{{ formatHistoryTime(record.executeTime) }}</span>
                  <span class="meta-resources">{{ record.totalCount }}个资源</span>
                  <span v-if="record.duration" class="meta-duration">
                    耗时: {{ record.duration.toFixed(1) }}s
                  </span>
                </div>
              </div>
              <el-icon class="expand-icon" :class="{ expanded: expandedHistoryIds.includes(record.id) }">
                <ArrowDown />
              </el-icon>
            </div>

            <!-- 进度条（执行中时显示） -->
            <div v-if="record.status === 'running'" class="record-progress">
              <el-progress
                :percentage="Math.round((record.successCount / record.totalCount) * 100)"
                :stroke-width="6"
                :show-text="false"
              />
              <span class="progress-text">
                {{ record.successCount }}/{{ record.totalCount }}
              </span>
            </div>

            <!-- 错误信息（失败时显示） -->
            <div v-if="record.status === 'failed' && getFirstError(record)" class="record-error">
              <el-icon><WarningFilled /></el-icon>
              <span>{{ getFirstError(record) }}</span>
            </div>

            <!-- 展开的明细（《执行记录信息扩展-交互设计》§3/§4） -->
            <div v-if="expandedHistoryIds.includes(record.id)" class="record-details">
              <!-- 执行信息条：提交人恒显；复核人/流程单缺失整项隐藏（Q1/Q2） -->
              <div class="exec-info-bar">
                <span class="exec-info-item">
                  <span class="exec-info-label">提交人</span>
                  <span class="exec-info-value">{{ record.operator }}</span>
                </span>
                <span v-if="record.reviewer" class="exec-info-item">
                  <span class="exec-info-label">复核人</span>
                  <span class="exec-info-value">{{ record.reviewer }}</span>
                </span>
                <el-popover
                  v-for="ticket in record.tickets ?? []"
                  :key="ticket.no"
                  trigger="click"
                  :width="300"
                  placement="bottom"
                >
                  <template #reference>
                    <span class="exec-ticket-link">{{ ticketLabel(ticket) }} {{ ticket.no }}</span>
                  </template>
                  <div class="ticket-popover">
                    <div class="ticket-popover-title">
                      {{ ticketLabel(ticket) }} {{ ticket.no }}
                    </div>
                    <div class="ticket-popover-desc">
                      {{ ticket.title }}
                    </div>
                    <div v-if="ticket.summary" class="ticket-popover-summary">
                      {{ ticket.summary }}
                    </div>
                    <div v-if="ticket.submitter || ticket.createTime" class="ticket-popover-meta">
                      <span v-if="ticket.submitter">提单人: {{ ticket.submitter }}</span>
                      <span v-if="ticket.createTime">· {{ ticket.createTime }}</span>
                    </div>
                  </div>
                </el-popover>
              </div>

              <!-- 资源明细表格（§4.1/§4.2） -->
              <el-table :data="record.details" size="small" class="detail-table" :row-key="(row: ExecutionDetail) => row.serviceSeqId">
                <el-table-column label="资源" width="200">
                  <template #default="{ row }">
                    <div class="detail-resource">
                      <span class="detail-resource-name">{{ row.pkDisplay }}</span>
                      <span v-if="row.pkValue !== row.pkDisplay" class="detail-resource-sub">{{ row.pkValue }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getDetailStatusType(row.execStatus)" size="small" effect="light">
                      {{ getDetailStatusText(row.execStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="开始时间" width="110">
                  <template #default="{ row }">
                    {{ row.startTime || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="耗时" width="70">
                  <template #default="{ row }">
                    {{ formatDuration(row.duration) }}
                  </template>
                </el-table-column>
                <el-table-column label="报错" min-width="100">
                  <template #default="{ row }">
                    <span v-if="row.errorMsg" class="detail-error-text" :title="row.errorMsg">{{ row.errorMsg }}</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160">
                  <template #default="{ row }">
                    <div class="detail-actions">
                      <el-button size="small" type="primary" link @click="handleViewResourceDetail(row)">
                        查看详细信息
                      </el-button>
                      <template v-if="row.execStatus === 'F'">
                        <el-button size="small" type="primary" link @click="handleRetryDetail(row)">
                          重试
                        </el-button>
                        <el-button size="small" type="primary" link @click="openDiagnosticForDetail(record as ExecutionRecord, row)">
                          AI 诊断
                        </el-button>
                      </template>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <el-empty v-if="filteredHistoryDrawerList.length === 0" description="暂无执行记录" />
        </div>
      </div>

      <!-- 操作编排历史记录 -->
      <div v-if="historyDrawerActiveTab === 'orchestration'" class="history-content">
        <!-- 筛选区域 -->
        <div class="history-filters">
          <el-select v-model="orchestrationHistoryDrawerFilter.timeRange" placeholder="时间范围" size="small">
            <el-option label="今日" value="today" />
            <el-option label="近7天" value="7days" />
            <el-option label="近30天" value="30days" />
            <el-option label="全部" value="all" />
          </el-select>
          <el-select v-model="orchestrationHistoryDrawerFilter.status" placeholder="全部状态" clearable size="small">
            <el-option label="执行中" value="running" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="初始化" value="pending" />
            <el-option label="执行终止" value="terminated" />
          </el-select>
          <el-input
            v-model="orchestrationHistoryDrawerFilter.keyword"
            placeholder="搜索编排名称..."
            prefix-icon="Search"
            clearable
            size="small"
          />
        </div>

        <!-- 历史记录列表 -->
        <div class="history-list">
          <div
            v-for="record in filteredOrchestrationHistoryDrawerList"
            :key="record.id"
            class="history-record-card"
          >
            <!-- 记录头部 -->
            <div class="record-header" @click="toggleOrchestrationHistoryExpand(record.id)">
              <div class="record-main">
                <div class="record-title">
                  <span class="record-name">{{ record.name }}</span>
                  <el-tag
                    :type="getOrchestrationStatusType(record.status)"
                    size="small"
                    effect="light"
                  >
                    {{ getOrchestrationStatusText(record) }}
                  </el-tag>
                </div>
                <div class="record-meta">
                  <span class="meta-time">{{ formatOrchestrationHistoryTime(record.executeTime) }}</span>
                  <span class="meta-resources">{{ record.totalJobCount }}个作业</span>
                  <span class="meta-submitter">提交人: {{ record.submitter }}</span>
                </div>
              </div>
              <el-icon class="expand-icon" :class="{ expanded: expandedOrchestrationHistoryIds.includes(record.id) }">
                <ArrowDown />
              </el-icon>
            </div>

            <!-- 错误信息（失败时显示） -->
            <div v-if="record.status === 'failed' && getOrchestrationFirstError(record)" class="record-error">
              <el-icon><WarningFilled /></el-icon>
              <span>{{ getOrchestrationFirstError(record) }}</span>
            </div>

            <!-- 展开的明细 -->
            <div v-if="expandedOrchestrationHistoryIds.includes(record.id)" class="record-details">
              <div class="details-header">
                <span>作业明细</span>
                <div class="details-actions">
                  <el-button
                    size="small"
                    type="primary"
                    link
                    :disabled="record.status !== 'failed'"
                    @click="openDiagnostic(record)"
                  >
                    <el-icon><MagicStick /></el-icon>
                    AI 诊断
                  </el-button>
                  <el-button size="small" type="primary" link @click="handleOrchestrationRetry(record)">
                    <el-icon><RefreshRight /></el-icon>
                    重新执行
                  </el-button>
                </div>
              </div>
              <div class="details-list">
                <div
                  v-for="(job, index) in record.jobs"
                  :key="index"
                  class="detail-item orchestration-detail"
                >
                  <div class="detail-main" @click="handleOrchestrationViewDetail(job)">
                    <div class="detail-info">
                      <span class="detail-pk">{{ job.jobName }}</span>
                      <span class="detail-channel">渠道: {{ job.channel }}</span>
                    </div>
                    <el-tag
                      :type="getOrchestrationStatusType(job.status)"
                      size="small"
                      effect="light"
                    >
                      {{ job.status === 'success' ? '成功' : job.status === 'failed' ? '失败' : job.status === 'running' ? '执行中' : job.status === 'pending' ? '初始化' : '执行终止' }}
                    </el-tag>
                  </div>
                  <div class="detail-meta-row">
                    <span class="detail-time">开始: {{ job.startTime }}</span>
                    <span class="detail-submitter">提交人: {{ job.submitter }}</span>
                    <span v-if="job.reviewer" class="detail-reviewer">复核人: {{ job.reviewer }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-if="filteredOrchestrationHistoryDrawerList.length === 0" description="暂无执行记录" />
        </div>
      </div>
    </div>
  </el-drawer>

  <!-- AI 智能诊断面板 -->
  <DiagnosticPanel
    v-model="showDiagnosticPanel"
    :record-id="diagnosticRecordId"
    :operation-name="diagnosticOperationName"
    :operation-category="diagnosticOperationCategory"
    :failed-resources="diagnosticFailedResources"
    @go-to-operation="() => {}"
    @feedback="(type: string) => console.log('诊断反馈:', type)"
    @retry="() => {}"
  />

  <!-- 资源详情弹窗（《执行记录信息扩展-交互设计》§6） -->
  <ResourceDetailDialog />
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;
@use '~/pages/workbench/workbench.scss' as *;
</style>
