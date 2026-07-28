<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DEPT_OPTIONS,
  missResults,
  plans,
  RESOURCE_TYPE_OPTIONS,
  results,
  RISK_LEVEL_MAP,
  strategies,
  TAGS_MAP,
  getHistoryDetails,
  type InspectResult,
} from '~/demo/mock/config-inspect'

// ==================== 查询条件 ====================
const queryForm = ref({
  strategyName: '',
  dateRange: [] as string[],
  tags: '',
  appName: '',
  appId: '',
  hostName: '',
  ip: '',
  resourceType: '',
  checkName: '',
  objName: '',
  resultStatus: '',
  adminName: '',
  adminId: '',
  baselineNo: '',
  exceptionRemark: '',
  exceptionApplicant: '',
  adminGroup: '',
  isException: '',
  exceptionDateRange: [] as string[],
  deptName: '',
})

function handleReset() {
  queryForm.value = {
    strategyName: '', dateRange: [], tags: '', appName: '', appId: '', hostName: '',
    ip: '', resourceType: '', checkName: '', objName: '', resultStatus: '', adminName: '',
    adminId: '', baselineNo: '', exceptionRemark: '', exceptionApplicant: '', adminGroup: '',
    isException: '', exceptionDateRange: [], deptName: '',
  }
}

// ==================== 表格数据 ====================
const loading = ref(false)

function handleSearch() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const filteredData = computed(() => {
  return results.filter((r) => {
    const q = queryForm.value
    if (q.strategyName && r.strategy_name !== q.strategyName)
      return false
    if (q.tags && r.tags !== q.tags)
      return false
    if (q.deptName && r.dept_name !== q.deptName)
      return false
    if (q.appName && r.app_name !== q.appName)
      return false
    if (q.appId && r.app_id !== q.appId)
      return false
    if (q.hostName && !q.hostName.split(',').some(h => r.host_name.toLowerCase().includes(h.trim().toLowerCase())))
      return false
    if (q.ip && !r.ip.includes(q.ip))
      return false
    if (q.resourceType && r.resource_type !== q.resourceType)
      return false
    if (q.checkName && r.check_name !== q.checkName)
      return false
    if (q.objName && !r.obj_name.includes(q.objName))
      return false
    if (q.resultStatus && r.result_status !== q.resultStatus)
      return false
    if (q.adminName && !r.admin_name.includes(q.adminName))
      return false
    if (q.adminId && !r.admin_id.includes(q.adminId))
      return false
    if (q.baselineNo && !r.baseline_no.includes(q.baselineNo))
      return false
    if (q.exceptionRemark && !r.exception_remark.includes(q.exceptionRemark))
      return false
    if (q.exceptionApplicant && !r.exception_applicant.includes(q.exceptionApplicant))
      return false
    if (q.adminGroup && r.admin_group !== q.adminGroup)
      return false
    if (q.isException === '1' && r.is_exception !== '1')
      return false
    if (q.isException === '0' && r.is_exception === '1')
      return false
    if (q.dateRange.length === 2 && (r.inspect_date < q.dateRange[0] || r.inspect_date > q.dateRange[1]))
      return false
    if (q.exceptionDateRange.length === 2 && (!r.exception_apply_time || r.exception_apply_time.slice(0, 10) < q.exceptionDateRange[0] || r.exception_apply_time.slice(0, 10) > q.exceptionDateRange[1]))
      return false
    return true
  })
})

// ==================== 分页 ====================
const currentPage = ref(1)
const pageSize = 20
const tableData = computed(() => {
  return filteredData.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize)
})
watch(filteredData, () => {
  currentPage.value = 1
})

// 去重选项
const strategyNameOptions = [...new Set(results.map(r => r.strategy_name))]
const checkNameOptions = [...new Set(results.map(r => r.check_name))]
const appNameOptions = [...new Set(results.map(r => r.app_name))]
const appIdOptions = [...new Set(results.map(r => r.app_id))]
const adminGroupOptions = [...new Set(results.map(r => r.admin_group))]

// ==================== 统计 ====================
const stats = computed(() => {
  const total = filteredData.value.length
  const abnormal = filteredData.value.filter(r => r.result_status === '异常').length
  const warning = filteredData.value.filter(r => r.result_status === '警告').length
  const exception = filteredData.value.filter(r => r.is_exception === '1').length
  return { total, abnormal, warning, exception, normal: total - abnormal - warning }
})

// ==================== 选中 & 例外 ====================
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

function submitException() {
  if (!exceptionForm.value.remark) {
    ElMessage.warning('请填写例外备注')
    return
  }
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  selectedRows.value.forEach((row) => {
    if (row.result_status !== '正常' && row.is_exception !== '1') {
      row.is_exception = '1'
      row.exception_remark = exceptionForm.value.remark
      row.exception_applicant = exceptionForm.value.applicant
      row.exception_apply_time = timeStr
    }
  })
  exceptionDialogVisible.value = false
  ElMessage.success('例外申请已提交（demo模拟）')
  exceptionForm.value.remark = ''
}

// ==================== 缺失结果 ====================
const missDialogVisible = ref(false)

// ==================== 导出 ====================
function handleExport() {
  ElMessage.success(`已导出 ${filteredData.value.length} 条结果（demo模拟）`)
}

// ==================== 历史结果弹窗 ====================
const historyVisible = ref(false)
const historyRow = ref<InspectResult | null>(null)
const historyData = computed(() => {
  if (!historyRow.value)
    return []
  return getHistoryDetails(historyRow.value.host_name, historyRow.value.check_name)
})
const historyPage = ref(1)
const historyPageSize = 10
const historyTableData = computed(() => {
  return historyData.value.slice((historyPage.value - 1) * historyPageSize, historyPage.value * historyPageSize)
})

function handleRowClick(row: InspectResult) {
  historyRow.value = row
  historyPage.value = 1
  historyVisible.value = true
}

function handleExportHistory() {
  ElMessage.success(`已导出 ${historyData.value.length} 条历史结果（demo模拟）`)
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
</script>

<template>
  <div class="ci-page">
    <!-- 查询条件区 -->
    <div class="ci-card query-card">
      <div class="query-grid">
        <div class="query-item">
          <span class="query-label">策略名称</span>
          <el-select v-model="queryForm.strategyName" placeholder="全部" clearable filterable class="query-control">
            <el-option v-for="s in strategyNameOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="query-item">
          <span class="query-label">检查时间</span>
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="query-control!"
          />
        </div>
        <div class="query-item">
          <span class="query-label">标签</span>
          <el-select v-model="queryForm.tags" placeholder="全部" clearable class="query-control">
            <el-option v-for="(label, key) in TAGS_MAP" :key="key" :label="label" :value="key" />
          </el-select>
        </div>

        <div class="query-item">
          <span class="query-label">应用名称</span>
          <el-select v-model="queryForm.appName" placeholder="全部" clearable filterable class="query-control">
            <el-option v-for="a in appNameOptions" :key="a" :label="a" :value="a" />
          </el-select>
        </div>
        <div class="query-item">
          <span class="query-label">应用编号</span>
          <el-select v-model="queryForm.appId" placeholder="全部" clearable filterable class="query-control">
            <el-option v-for="a in appIdOptions" :key="a" :label="a" :value="a" />
          </el-select>
        </div>
        <div class="query-item">
          <span class="query-label">机器名</span>
          <el-input v-model="queryForm.hostName" placeholder="支持英文逗号分隔多个" clearable class="query-control" />
        </div>

        <div class="query-item">
          <span class="query-label">IP</span>
          <el-input v-model="queryForm.ip" placeholder="请输入IP" clearable class="query-control" />
        </div>
        <div class="query-item">
          <span class="query-label">资源类型</span>
          <el-select v-model="queryForm.resourceType" placeholder="全部" clearable class="query-control">
            <el-option v-for="t in RESOURCE_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="query-item">
          <span class="query-label">检查项</span>
          <el-select v-model="queryForm.checkName" placeholder="全部" clearable filterable class="query-control">
            <el-option v-for="c in checkNameOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </div>

        <div class="query-item">
          <span class="query-label">检查结论</span>
          <el-select v-model="queryForm.resultStatus" placeholder="全部" clearable class="query-control">
            <el-option label="正常" value="正常" />
            <el-option label="异常" value="异常" />
            <el-option label="警告" value="警告" />
          </el-select>
        </div>
        <div class="query-item">
          <span class="query-label">管理员中文名</span>
          <el-input v-model="queryForm.adminName" placeholder="请输入" clearable class="query-control" />
        </div>
        <div class="query-item">
          <span class="query-label">基线检查编号</span>
          <el-input v-model="queryForm.baselineNo" placeholder="请输入" clearable class="query-control" />
        </div>

        <div class="query-item">
          <span class="query-label">是否例外</span>
          <el-select v-model="queryForm.isException" placeholder="全部" clearable class="query-control">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </div>
        <div class="query-item">
          <span class="query-label">例外申请人</span>
          <el-input v-model="queryForm.exceptionApplicant" placeholder="请输入" clearable class="query-control" />
        </div>
        <div class="query-item">
          <span class="query-label">组别</span>
          <el-select v-model="queryForm.adminGroup" placeholder="全部" clearable filterable class="query-control">
            <el-option v-for="g in adminGroupOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </div>

        <div class="query-item">
          <span class="query-label">部门</span>
          <el-select v-model="queryForm.deptName" placeholder="全部" clearable class="query-control">
            <el-option v-for="d in DEPT_OPTIONS" :key="d" :label="d" :value="d" />
          </el-select>
        </div>
        <div class="query-item query-item-btns">
          <el-button type="primary" @click="handleReset">
            <i-ep-refresh-left class="mr-4px" />重置
          </el-button>
          <el-button type="primary" @click="handleSearch">
            <i-ep-search class="mr-4px" />查询
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计条 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">总记录</span>
      </div>
      <div class="stat-item stat-normal">
        <span class="stat-num">{{ stats.normal }}</span>
        <span class="stat-label">正常</span>
      </div>
      <div class="stat-item stat-abnormal">
        <span class="stat-num">{{ stats.abnormal }}</span>
        <span class="stat-label">异常</span>
      </div>
      <div class="stat-item stat-warning">
        <span class="stat-num">{{ stats.warning }}</span>
        <span class="stat-label">警告</span>
      </div>
      <div class="stat-item stat-exception">
        <span class="stat-num">{{ stats.exception }}</span>
        <span class="stat-label">已申请例外</span>
      </div>
    </div>

    <!-- 结果表格 -->
    <div class="ci-card">
      <div class="table-toolbar">
        <span class="table-toolbar-title">查询结果</span>
        <div class="table-toolbar-actions">
          <el-dropdown trigger="click" @command="handleApplyException">
            <el-button type="primary">
              申请例外<i-ep-arrow-down class="ml-4px" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="apply">对选中记录申请例外</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" @click="missDialogVisible = true">
            <i-ep-search class="mr-4px" />缺失结果查询
          </el-button>
          <el-button type="success" @click="handleExport">
            <i-ep-download class="mr-4px" />结果导出
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        highlight-current-row
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="42" />
        <el-table-column prop="strategy_name" label="策略名称" min-width="190" show-overflow-tooltip />
        <el-table-column prop="tags" label="标签" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.tags === '01' ? 'danger' : row.tags === '02' ? 'warning' : 'success'" effect="light">
              {{ TAGS_MAP[row.tags] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspect_date" label="检查日期" width="110" />
        <el-table-column prop="inspect_time" label="检查时间" width="90" />
        <el-table-column prop="app_id" label="应用编号" width="140" show-overflow-tooltip />
        <el-table-column prop="app_name" label="应用名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="dept_name" label="巡检计划部门" width="110" />
        <el-table-column prop="host_name" label="机器名" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false">{{ row.host_name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="resource_type" label="资源类型" width="90" />
        <el-table-column prop="check_name" label="检查项" min-width="240" show-overflow-tooltip />
        <el-table-column prop="obj_name" label="检查对象" width="140" show-overflow-tooltip />
        <el-table-column prop="std_value" label="标准值" min-width="180" show-overflow-tooltip />
        <el-table-column prop="current_value" label="当前值" min-width="180" show-overflow-tooltip>
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
              <el-tag size="small" type="info" effect="plain">是</el-tag>
            </el-tooltip>
            <span v-else class="text-[var(--el-text-color-disabled)]">否</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="ci-table-footer">
        <span class="ci-table-total">共 {{ filteredData.length }} 条</span>
        <el-pagination v-model:current-page="currentPage" layout="total, prev, pager, next" :total="filteredData.length" :page-size="pageSize" small />
      </div>
    </div>

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
        <el-table-column prop="component_version" label="组件版本" width="80" align="center" />
        <el-table-column prop="check_name" label="检查项" min-width="240" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="host_name" label="机器名" width="170" show-overflow-tooltip />
        <el-table-column prop="resource_type" label="资源类型" width="80" />
        <el-table-column prop="obj_name" label="检查对象" width="130" show-overflow-tooltip />
        <el-table-column prop="std_value" label="标准值" min-width="170" show-overflow-tooltip />
        <el-table-column prop="current_value" label="当前值" min-width="170" show-overflow-tooltip>
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
        <el-button type="success" @click="handleExportHistory">
          <i-ep-download class="mr-4px" />导出历史结果
        </el-button>
        <el-button @click="historyVisible = false">取消</el-button>
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
        <el-button @click="exceptionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitException">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 缺失结果弹窗 -->
    <el-dialog v-model="missDialogVisible" title="缺失结果查询" width="900px" destroy-on-close>
      <div class="miss-hint">
        <i-ep-warning-filled class="mr-4px" />
        以下机器在资源范围内，但最近一次巡检（2026-07-24 19:10:28）未返回结果，可能原因：执行失败 / 超时 / Agent离线
      </div>
      <el-table :data="missResults" stripe size="small">
        <el-table-column prop="host_name" label="机器名" width="180" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="resource_type" label="资源类型" width="90" />
        <el-table-column prop="check_name" label="缺失检查项" min-width="280" show-overflow-tooltip />
        <el-table-column prop="obj_name" label="检查对象" width="140" />
        <el-table-column prop="inspect_date" label="巡检日期" width="110" />
        <el-table-column prop="inspect_time" label="巡检时间" width="90" />
      </el-table>
      <template #footer>
        <el-button @click="missDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.query-card {
  padding: 16px;
  margin-bottom: 12px;
}
.query-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 24px;
}
.query-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.query-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  min-width: 84px;
  text-align: right;
}
.query-control {
  flex: 1;
}
.query-item-btns {
  justify-content: flex-end;
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
  transition: transform 0.2s, box-shadow 0.2s;
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
.stat-normal .stat-num { color: var(--el-color-success); }
.stat-abnormal .stat-num { color: var(--el-color-danger); }
.stat-warning .stat-num { color: var(--el-color-warning); }
.stat-exception .stat-num { color: var(--uops-text-color-special); }
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
.table-toolbar-actions {
  display: flex;
  gap: 8px;
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
