<script lang="ts" setup>
import type { ResultFilter, SummaryFilter, SummaryStats } from '~/demo/api/config-inspect'
import type { InspectAppSummary, InspectResult } from '~/demo/types/config-inspect'
import { ElMessage } from 'element-plus'
/**
 * 检查结果页 — 双视图（2026-08-17 菜单合并）
 * 汇总视图（应用级，来自 appSummaries）+ 明细视图（检查项级，唯一事实源）
 * 数据统一走 api/config-inspect.ts，数字天然一致，支持汇总→明细钻取
 */
import { computed, onMounted, reactive, ref } from 'vue'
import {
  applyException,
  exportResults,
  getAppSummaries,
  getHistoryResult,
  getMissResults,
  getResults,
  getSummaryStats,

} from '~/demo/api/config-inspect'
import {
  TAGS_MAP,
} from '~/demo/mock/config-inspect'

// ==================== 视图切换 ====================
const activeView = ref<'summary' | 'detail'>('summary')

// ==================== 统计卡片 ====================
const stats = ref<SummaryStats>({
  executionCount: 0,
  complianceRate: 100,
  abnormalNum: 0,
  warningNum: 0,
  exceptionNum: 0,
  totalCheckNum: 0,
})

async function loadStats() {
  const res = await getSummaryStats()
  stats.value = res.data
}

// ==================== 汇总视图 ====================
const summaryFilter = reactive<SummaryFilter>({
  appName: '',
  strategyName: '',
  status: 'all',
})
const summaryLoading = ref(false)
const summaryList = ref<InspectAppSummary[]>([])
const summaryTotal = ref(0)
const summaryPagination = reactive({ currentPage: 1, pageSize: 20 })

async function loadSummaries() {
  summaryLoading.value = true
  try {
    const res = await getAppSummaries(summaryFilter, summaryPagination)
    summaryList.value = res.data.list
    summaryTotal.value = res.data.total
  }
  finally {
    summaryLoading.value = false
  }
}

// ==================== 明细视图 ====================
const detailFilter = reactive<ResultFilter>({
  appName: '',
  strategyName: '',
  checkName: '',
  resultStatus: '',
  tags: '',
  isException: '',
  hostName: '',
  ip: '',
  resourceType: '',
  deptName: '',
})
const detailLoading = ref(false)
const detailList = ref<InspectResult[]>([])
const detailTotal = ref(0)
const detailPagination = reactive({ currentPage: 1, pageSize: 20 })

async function handleDetailSearch() {
  detailLoading.value = true
  try {
    const res = await getResults(detailFilter, detailPagination)
    detailList.value = res.data.list
    detailTotal.value = res.data.total
  }
  finally {
    detailLoading.value = false
  }
}

function handleDetailReset() {
  Object.assign(detailFilter, {
    appName: '',
    strategyName: '',
    checkName: '',
    resultStatus: '',
    tags: '',
    isException: '',
    hostName: '',
    ip: '',
    resourceType: '',
    deptName: '',
  })
  detailPagination.currentPage = 1
  handleDetailSearch()
}

/** 钻取：切到明细视图并带入筛选条件（统计卡片/汇总行触发） */
function switchToDetail(preset?: Partial<ResultFilter>) {
  // 先重置全部明细筛选，避免上一次钻取残留条件叠加导致查不到数据
  Object.assign(detailFilter, {
    appName: '', strategyName: '', checkName: '', resultStatus: '', tags: '',
    isException: '', hostName: '', ip: '', resourceType: '', deptName: '',
  })
  Object.assign(detailFilter, preset || {})
  activeView.value = 'detail'
  detailPagination.currentPage = 1
  handleDetailSearch()
}

// ==================== 例外申请 ====================
const selectedRows = ref<InspectResult[]>([])
function handleSelectionChange(rows: InspectResult[]) {
  selectedRows.value = rows
}

const exceptionDialogVisible = ref(false)
const exceptionForm = ref({ remark: '', applicant: '贺诗辉' })

function handleApplyException() {
  const abnormal = selectedRows.value.filter(r => r.result_status !== '正常' && r.is_exception !== '1')
  if (abnormal.length === 0) {
    ElMessage.warning('请选择异常且未申请例外的记录')
    return
  }
  exceptionDialogVisible.value = true
}

async function submitException() {
  if (!exceptionForm.value.remark) {
    ElMessage.warning('请填写例外备注')
    return
  }
  const ids = selectedRows.value
    .filter(r => r.result_status !== '正常' && r.is_exception !== '1')
    .map(r => r.detail_id)
  const res = await applyException(ids, exceptionForm.value.remark, exceptionForm.value.applicant)
  exceptionDialogVisible.value = false
  ElMessage.success(`已为 ${res.data} 条记录提交例外申请`)
  exceptionForm.value.remark = ''
  handleDetailSearch()
  loadStats()
}

// ==================== 缺失结果 ====================
const missDialogVisible = ref(false)
const missList = ref<any[]>([])
async function openMissDialog() {
  const res = await getMissResults()
  missList.value = res.data
  missDialogVisible.value = true
}

// ==================== 导出 ====================
async function handleExport() {
  const count = activeView.value === 'summary' ? summaryTotal.value : detailTotal.value
  await exportResults(count)
  ElMessage.success(`已导出 ${count} 条结果（demo模拟）`)
}

// ==================== 历史结果弹窗 ====================
const historyVisible = ref(false)
const historyRow = ref<InspectResult | null>(null)
const historyData = ref<any[]>([])
const historyPage = ref(1)
const historyPageSize = 10

const historyTableData = computed(() =>
  historyData.value.slice((historyPage.value - 1) * historyPageSize, historyPage.value * historyPageSize),
)

async function handleRowClick(row: InspectResult) {
  historyRow.value = row
  historyPage.value = 1
  const res = await getHistoryResult(row.host_name, row.check_name)
  historyData.value = res.data
  historyVisible.value = true
}

// ==================== 展示辅助 ====================
function resultTagType(status: string) {
  if (status === '正常')
    return 'success'
  if (status === '异常')
    return 'danger'
  return 'warning'
}

function currentCellStyle(row: { result_status: string }) {
  return row.result_status === '异常' ? { color: 'var(--el-color-danger)', fontWeight: '600' } : {}
}

function complianceRateType(rate: number) {
  if (rate >= 95)
    return 'success'
  if (rate >= 80)
    return 'warning'
  return 'danger'
}

onMounted(() => {
  loadStats()
  loadSummaries()
  handleDetailSearch()
})
</script>

<template>
  <div class="ci-page">
    <!-- 视图切换 -->
    <div class="view-switch-bar">
      <el-radio-group v-model="activeView" size="default">
        <el-radio-button value="summary">
          汇总视图
        </el-radio-button>
        <el-radio-button value="detail">
          明细视图
        </el-radio-button>
      </el-radio-group>
      <span class="view-switch-hint">
        {{ activeView === 'summary' ? '按应用聚合，点击"查看明细"钻取到检查项级数据' : '检查项级明细（唯一事实源），点击行查看历史结果' }}
      </span>
    </div>

    <!-- 统计卡片区 -->
    <div class="stats-bar">
      <div class="stat-item" @click="switchToDetail()">
        <span class="stat-num">{{ stats.executionCount }}</span>
        <span class="stat-label">巡检次数</span>
      </div>
      <div class="stat-item" :class="stats.complianceRate >= 95 ? 'stat-normal' : 'stat-abnormal'">
        <span class="stat-num">{{ stats.complianceRate }}%</span>
        <span class="stat-label">合规率</span>
      </div>
      <div class="stat-item stat-abnormal" @click="switchToDetail({ resultStatus: '异常' })">
        <span class="stat-num">{{ stats.abnormalNum }}</span>
        <span class="stat-label">异常项</span>
      </div>
      <div class="stat-item stat-warning" @click="switchToDetail({ resultStatus: '警告' })">
        <span class="stat-num">{{ stats.warningNum }}</span>
        <span class="stat-label">警告项</span>
      </div>
      <div class="stat-item stat-exception" @click="switchToDetail({ isException: '1' })">
        <span class="stat-num">{{ stats.exceptionNum }}</span>
        <span class="stat-label">已申请例外</span>
      </div>
    </div>

    <!-- ==================== 汇总视图 ==================== -->
    <template v-if="activeView === 'summary'">
      <!-- 筛选区（常用 3 项） -->
      <div class="ci-filter-bar">
        <div class="ci-filter-items">
          <el-input v-model="summaryFilter.appName" placeholder="应用名称" clearable class="filter-input" />
          <el-input v-model="summaryFilter.strategyName" placeholder="策略名称" clearable class="filter-input" />
          <el-select v-model="summaryFilter.status" class="filter-select">
            <el-option label="全部状态" value="all" />
            <el-option label="全部通过" value="compliant" />
            <el-option label="存在不合规" value="non-compliant" />
          </el-select>
          <el-button type="primary" @click="loadSummaries">
            <i-ep-search class="mr-4px" />搜索
          </el-button>
        </div>
        <div class="ci-filter-actions">
          <el-button type="success" @click="handleExport">
            <i-ep-download class="mr-4px" />结果导出
          </el-button>
        </div>
      </div>

      <!-- 汇总表（应用级） -->
      <div class="ci-card">
        <div class="table-toolbar">
          <span class="table-toolbar-title">应用巡检汇总</span>
        </div>
        <el-table v-loading="summaryLoading" :data="summaryList" stripe>
          <el-table-column prop="app_name" label="应用名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="tech_stack" label="技术栈" width="100" />
          <el-table-column prop="strategy_name" label="策略名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="dept_name" label="计划部门" width="100" />
          <el-table-column label="检查项数" width="90" align="center">
            <template #default="{ row }">
              {{ row.check_num }}
            </template>
          </el-table-column>
          <el-table-column label="异常" width="70" align="center">
            <template #default="{ row }">
              <span :class="row.abnormal_num > 0 ? 'num-danger' : ''">{{ row.abnormal_num }}</span>
            </template>
          </el-table-column>
          <el-table-column label="警告" width="70" align="center">
            <template #default="{ row }">
              <span :class="row.warning_num > 0 ? 'num-warning' : ''">{{ row.warning_num }}</span>
            </template>
          </el-table-column>
          <el-table-column label="例外" width="70" align="center">
            <template #default="{ row }">
              {{ row.exception_num }}
            </template>
          </el-table-column>
          <el-table-column label="合规率" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="complianceRateType(row.compliance_rate)" effect="light">
                {{ row.compliance_rate }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latest_inspect_time" label="最近巡检时间" width="160" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="switchToDetail({ appName: row.app_name })">
                查看明细
              </el-button>
              <el-button link type="primary" size="small" @click="switchToDetail({ appName: row.app_name, resultStatus: '异常' })">
                查看异常
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="ci-table-footer">
          <span class="ci-table-total">共 {{ summaryTotal }} 条</span>
          <el-pagination
            v-model:current-page="summaryPagination.currentPage"
            layout="prev, pager, next"
            :total="summaryTotal"
            :page-size="summaryPagination.pageSize"
            small
            @current-change="loadSummaries"
          />
        </div>
      </div>
    </template>

    <!-- ==================== 明细视图 ==================== -->
    <template v-else>
      <!-- 筛选区（常用 6 项） -->
      <div class="ci-filter-bar">
        <div class="ci-filter-items">
          <el-input v-model="detailFilter.appName" placeholder="应用名称" clearable class="filter-input" />
          <el-input v-model="detailFilter.strategyName" placeholder="策略名称" clearable class="filter-input" />
          <el-input v-model="detailFilter.checkName" placeholder="检查项" clearable class="filter-input" />
          <el-select v-model="detailFilter.resultStatus" placeholder="检查结论" clearable class="filter-select">
            <el-option label="正常" value="正常" />
            <el-option label="异常" value="异常" />
            <el-option label="警告" value="警告" />
          </el-select>
          <el-select v-model="detailFilter.tags" placeholder="标签" clearable class="filter-select">
            <el-option v-for="(label, key) in TAGS_MAP" :key="key" :label="label" :value="key" />
          </el-select>
          <el-select v-model="detailFilter.isException" placeholder="是否例外" clearable class="filter-select">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
          <el-button type="primary" @click="handleDetailSearch">
            <i-ep-search class="mr-4px" />搜索
          </el-button>
          <el-button @click="handleDetailReset">
            <i-ep-refresh class="mr-4px" />重置
          </el-button>
        </div>
        <div class="ci-filter-actions">
          <el-button type="primary" @click="handleApplyException">
            <i-ep-edit class="mr-4px" />申请例外
          </el-button>
          <el-button type="primary" @click="openMissDialog">
            <i-ep-search class="mr-4px" />缺失结果查询
          </el-button>
          <el-button type="success" @click="handleExport">
            <i-ep-download class="mr-4px" />结果导出
          </el-button>
        </div>
      </div>

      <!-- 明细表（检查项级，唯一事实源） -->
      <div class="ci-card">
        <div class="table-toolbar">
          <span class="table-toolbar-title">检查项明细</span>
        </div>
        <el-table
          v-loading="detailLoading"
          :data="detailList"
          stripe
          highlight-current-row
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
        >
          <el-table-column type="selection" width="42" />
          <el-table-column prop="strategy_name" label="策略名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="tags" label="标签" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.tags === '01' ? 'danger' : row.tags === '02' ? 'warning' : 'success'" effect="light">
                {{ TAGS_MAP[row.tags] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="app_name" label="应用名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="host_name" label="机器名" width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="primary" :underline="false">
                {{ row.host_name }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" width="120" />
          <el-table-column prop="check_name" label="检查项" min-width="220" show-overflow-tooltip />
          <el-table-column prop="obj_name" label="检查对象" width="130" show-overflow-tooltip />
          <el-table-column prop="std_value" label="标准值" min-width="160" show-overflow-tooltip />
          <el-table-column prop="current_value" label="当前值" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span :style="currentCellStyle(row)">{{ row.current_value }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="result_status" label="检查结论" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-tag size="small" :type="resultTagType(row.result_status) as any" effect="light">
                {{ row.result_status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="例外" width="70" align="center" fixed="right">
            <template #default="{ row }">
              <el-tooltip v-if="row.is_exception === '1'" :content="`${row.exception_remark}（${row.exception_applicant} ${row.exception_apply_time}）`" placement="top">
                <el-tag size="small" type="info" effect="plain">
                  是
                </el-tag>
              </el-tooltip>
              <span v-else class="text-[var(--el-text-color-disabled)]">否</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="ci-table-footer">
          <span class="ci-table-total">共 {{ detailTotal }} 条</span>
          <el-pagination
            v-model:current-page="detailPagination.currentPage"
            layout="total, prev, pager, next"
            :total="detailTotal"
            :page-size="detailPagination.pageSize"
            small
            @current-change="handleDetailSearch"
          />
        </div>
      </div>
    </template>

    <!-- 历史检查结果弹窗 -->
    <el-dialog v-model="historyVisible" title="历史检查结果" width="1100px" top="5vh" destroy-on-close>
      <template #header>
        <div class="history-header">
          <span class="history-title">历史检查结果</span>
          <span class="history-sub">
            {{ historyRow?.host_name }} · {{ historyRow?.check_name }}
          </span>
        </div>
      </template>
      <el-table :data="historyTableData" stripe size="small">
        <el-table-column prop="inspect_date" label="检查日期" width="110" />
        <el-table-column prop="inspect_time" label="检查时间" width="90" />
        <el-table-column prop="component_id" label="巡检组件ID" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="uuid-text">{{ row.component_id }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="check_name" label="检查项" min-width="220" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="120" />
        <el-table-column prop="host_name" label="机器名" width="160" show-overflow-tooltip />
        <el-table-column prop="obj_name" label="检查对象" width="120" show-overflow-tooltip />
        <el-table-column prop="std_value" label="标准值" min-width="150" show-overflow-tooltip />
        <el-table-column prop="current_value" label="当前值" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span :style="row.result_status === '异常' ? { color: 'var(--el-color-danger)', fontWeight: '600' } : {}">
              {{ row.current_value }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="result_status" label="结论" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="resultTagType(row.result_status) as any" effect="light">
              {{ row.result_status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="ci-table-footer">
        <span class="ci-table-total">共 {{ historyData.length }} 条</span>
        <el-pagination v-model:current-page="historyPage" layout="prev, pager, next" :total="historyData.length" :page-size="historyPageSize" small />
      </div>
      <template #footer>
        <el-button @click="historyVisible = false">
          取消
        </el-button>
      </template>
    </el-dialog>

    <!-- 申请例外弹窗 -->
    <el-dialog v-model="exceptionDialogVisible" title="申请例外" width="520px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="选中记录">
          <span>{{ selectedRows.filter(r => r.result_status !== '正常' && r.is_exception !== '1').length }} 条异常记录</span>
        </el-form-item>
        <el-form-item label="例外备注" required>
          <el-input v-model="exceptionForm.remark" type="textarea" :rows="3" placeholder="请填写例外原因说明" />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="exceptionForm.applicant" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exceptionDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="submitException">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <!-- 缺失结果弹窗 -->
    <el-dialog v-model="missDialogVisible" title="缺失结果查询" width="900px" destroy-on-close>
      <div class="miss-hint">
        <i-ep-warning-filled class="mr-4px" />
        以下机器在资源范围内，但最近一次巡检未返回结果，可能原因：执行失败 / 超时 / Agent离线
      </div>
      <el-table :data="missList" stripe size="small">
        <el-table-column prop="host_name" label="机器名" width="180" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="resource_type" label="资源类型" width="90" />
        <el-table-column prop="check_name" label="缺失检查项" min-width="280" show-overflow-tooltip />
        <el-table-column prop="obj_name" label="检查对象" width="140" />
        <el-table-column prop="inspect_date" label="巡检日期" width="110" />
        <el-table-column prop="inspect_time" label="巡检时间" width="90" />
      </el-table>
      <template #footer>
        <el-button @click="missDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.view-switch-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.view-switch-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.filter-input {
  width: 160px;
}
.filter-select {
  width: 130px;
}
.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--uops-radius-card-sm);
  padding: 8px 18px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--ci-shadow-card);
}
.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.stat-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.stat-normal .stat-num {
  color: var(--el-color-success);
}
.stat-abnormal .stat-num {
  color: var(--el-color-danger);
}
.stat-warning .stat-num {
  color: var(--el-color-warning);
}
.stat-exception .stat-num {
  color: var(--uops-text-color-special);
}
.num-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}
.num-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.table-toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.history-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.history-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.history-sub {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.uuid-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--uops-bg-list-nested);
  padding: 2px 6px;
  border-radius: var(--el-border-radius-small);
}
.miss-hint {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: var(--el-border-radius-base);
  padding: 8px 12px;
  margin-bottom: 12px;
}
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
