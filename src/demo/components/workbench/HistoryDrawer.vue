<script setup lang="ts">
import {
  ArrowDown,
  CircleCheck,
  CircleClose,
  Clock,
  Download,
  Loading,
  MagicStick,
  Refresh,
  RefreshRight,
  WarningFilled,
} from '@element-plus/icons-vue'
import DiagnosticPanel from '~/demo/components/DiagnosticPanel.vue'
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
  getDetailStatusClass,
  getDetailStatusType,
  getDetailStatusText,
  handleViewResourceDetail,
  handleRetryFromHistory,
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

// 明细状态 → 图标组件映射（原 composable 返回字符串名，这里映射为实际组件以保证渲染）
function detailStatusIcon(status: string) {
  const map: Record<string, any> = {
    S: CircleCheck,
    F: CircleClose,
    P: Clock,
    R: Loading,
  }
  return map[status] || Clock
}
</script>

<template>
  <el-drawer
    v-model="showHistoryDrawer"
    title="执行历史"
    size="720px"
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

            <!-- 展开的明细 -->
            <div v-if="expandedHistoryIds.includes(record.id)" class="record-details">
              <div class="details-header">
                <span>资源明细</span>
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
                  <el-button size="small" type="primary" link @click="handleRetryFromHistory(record)">
                    <el-icon><RefreshRight /></el-icon>
                    重新执行
                  </el-button>
                </div>
              </div>
              <div class="details-list">
                <div
                  v-for="detail in record.details"
                  :key="detail.serviceSeqId"
                  class="detail-item"
                >
                  <div class="detail-main" @click="handleViewResourceDetail(detail)">
                    <el-icon class="detail-status-icon" :class="getDetailStatusClass(detail.execStatus)">
                      <component :is="detailStatusIcon(detail.execStatus)" />
                    </el-icon>
                    <div class="detail-info">
                      <span class="detail-pk">{{ detail.pkDisplay }}</span>
                      <span v-if="detail.pkValue !== detail.pkDisplay" class="detail-ip">{{ detail.pkValue }}</span>
                    </div>
                    <el-tag
                      :type="getDetailStatusType(detail.execStatus)"
                      size="small"
                      effect="light"
                    >
                      {{ getDetailStatusText(detail.execStatus) }}
                    </el-tag>
                  </div>
                  <div v-if="detail.errorMsg" class="detail-error">
                    {{ detail.errorMsg }}
                  </div>
                </div>
              </div>
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
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;
@use '~/pages/workbench/workbench.scss' as *;
</style>
