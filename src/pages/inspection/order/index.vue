<script lang="ts" setup>
import type { GovernFilter } from '~/demo/api/config-inspect'
import type { GovernStatus, InspectGovern } from '~/demo/types/config-inspect'
import { ElMessage } from 'element-plus'
/**
 * 整改工单页 — govern 治理模型（2026-08-17 菜单合并）
 * 数据源：api/config-inspect.ts getGoverns/handleGovern（iop_mc_inspect_govern）
 * 前端呈现为"工单"（PRD M3 口径），数据模型落治理表
 */
import { onMounted, reactive, ref } from 'vue'
import {
  getGovernDetail,
  getGoverns,

  handleGovern,
} from '~/demo/api/config-inspect'

// ==================== 筛选 ====================
const filter = reactive<GovernFilter>({
  status: 'all',
  riskLevel: '',
  appName: '',
  strategyName: '',
})

// ==================== 列表 ====================
const loading = ref(false)
const tableData = ref<InspectGovern[]>([])
const total = ref(0)
const pagination = reactive({ currentPage: 1, pageSize: 20 })

async function loadList() {
  loading.value = true
  try {
    const res = await getGoverns(filter, pagination)
    tableData.value = res.data.list
    total.value = res.data.total
  }
  finally {
    loading.value = false
  }
}

function handleReset() {
  filter.status = 'all'
  filter.riskLevel = ''
  filter.appName = ''
  filter.strategyName = ''
  pagination.currentPage = 1
  loadList()
}

// ==================== 详情抽屉 ====================
const drawerVisible = ref(false)
const currentOrder = ref<InspectGovern | null>(null)

async function handleViewDetails(row: InspectGovern) {
  const res = await getGovernDetail(row.govern_id)
  currentOrder.value = res.data || null
  if (currentOrder.value)
    drawerVisible.value = true
}

// ==================== 状态展示 ====================
function getStatusType(status?: GovernStatus) {
  switch (status) {
    case 'pending-confirm':
    case 'pending-rectify':
    case 'pending-review':
      return 'warning'
    case 'closed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
}

function getStatusLabel(status?: GovernStatus) {
  switch (status) {
    case 'pending-confirm':
      return '待确认'
    case 'pending-rectify':
      return '待整改'
    case 'pending-review':
      return '整改待审核'
    case 'closed':
      return '已闭环'
    case 'rejected':
      return '已驳回'
    default:
      return status || '-'
  }
}

function getRiskLevelType(level?: string) {
  if (level === 'high')
    return 'danger'
  if (level === 'medium')
    return 'warning'
  return 'info'
}

function getRiskLevelLabel(level?: string) {
  if (level === 'high')
    return '🔴 高风险'
  if (level === 'medium')
    return '🟡 中风险'
  return '🟢 低风险'
}

function getRemainingTimeType(ms?: number) {
  if (ms == null || ms <= 0)
    return 'danger'
  if (ms <= 24 * 60 * 60 * 1000)
    return 'warning'
  return 'info'
}

function formatRemainingTime(ms?: number) {
  if (ms == null || ms <= 0)
    return '已超期'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 24)
    return `${hours}小时`
  return `${Math.floor(hours / 24)}天${hours % 24}小时`
}

function getProcessStep(status?: GovernStatus) {
  const stepMap: Record<string, number> = {
    'pending-confirm': 1,
    'pending-rectify': 2,
    'pending-review': 3,
    'closed': 4,
    'rejected': 3,
  }
  return stepMap[status || ''] || 0
}

// ==================== 操作弹窗 ====================
const falseAlarmDialogVisible = ref(false)
const transferDialogVisible = ref(false)
const rectifyDialogVisible = ref(false)
const form = reactive({
  falseAlarmReason: '',
  handler: '',
  transferNote: '',
  rectifyNote: '',
})

function handleConfirmFalseAlarm() {
  form.falseAlarmReason = ''
  falseAlarmDialogVisible.value = true
}

function handleConfirmAndTransfer() {
  form.handler = ''
  form.transferNote = ''
  transferDialogVisible.value = true
}

function handleSubmitRectify() {
  form.rectifyNote = ''
  rectifyDialogVisible.value = true
}

async function handleFalseAlarmSubmit() {
  if (!form.falseAlarmReason) {
    ElMessage.warning('请填写误报原因')
    return
  }
  await handleGovern(currentOrder.value!.govern_id, 'falseAlarm', { reason: form.falseAlarmReason })
  falseAlarmDialogVisible.value = false
  drawerVisible.value = false
  ElMessage.success('已按误报闭环处理')
  loadList()
}

async function handleTransferSubmit() {
  if (!form.handler) {
    ElMessage.warning('请选择二线管理员')
    return
  }
  await handleGovern(currentOrder.value!.govern_id, 'transfer', { handler: form.handler, note: form.transferNote })
  transferDialogVisible.value = false
  drawerVisible.value = false
  ElMessage.success('已转单二线整改')
  loadList()
}

async function handleRectifySubmit() {
  if (!form.rectifyNote) {
    ElMessage.warning('请填写整改说明')
    return
  }
  await handleGovern(currentOrder.value!.govern_id, 'rectify', { note: form.rectifyNote })
  rectifyDialogVisible.value = false
  drawerVisible.value = false
  ElMessage.success('整改已提交，等待审核')
  loadList()
}

async function handleReopen() {
  await handleGovern(currentOrder.value!.govern_id, 'reopen')
  drawerVisible.value = false
  ElMessage.success('工单已重新打开')
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="ci-page">
    <!-- 筛选区 -->
    <div class="ci-filter-bar">
      <div class="ci-filter-items">
        <el-radio-group v-model="filter.status" @change="pagination.currentPage = 1; loadList()">
          <el-radio-button value="all">
            全部
          </el-radio-button>
          <el-radio-button value="pending-confirm">
            待我确认
          </el-radio-button>
          <el-radio-button value="pending-rectify">
            待我整改
          </el-radio-button>
          <el-radio-button value="pending-review">
            整改待审核
          </el-radio-button>
          <el-radio-button value="closed">
            已闭环
          </el-radio-button>
          <el-radio-button value="rejected">
            已驳回
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="ci-filter-items mt-8px">
        <el-select v-model="filter.riskLevel" placeholder="风险等级" clearable class="filter-select" @change="pagination.currentPage = 1; loadList()">
          <el-option label="🔴 高风险" value="high" />
          <el-option label="🟡 中风险" value="medium" />
          <el-option label="🟢 低风险" value="low" />
        </el-select>
        <el-input v-model="filter.appName" placeholder="应用名称" clearable class="filter-input" />
        <el-input v-model="filter.strategyName" placeholder="策略名称" clearable class="filter-input" />
        <el-button type="primary" @click="pagination.currentPage = 1; loadList()">
          <i-ep-search class="mr-4px" />搜索
        </el-button>
        <el-button @click="handleReset">
          <i-ep-refresh class="mr-4px" />重置
        </el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="ci-card">
      <div class="table-toolbar">
        <span class="table-toolbar-title">整改工单</span>
      </div>
      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column label="工单ID" prop="govern_id" width="100" />
        <el-table-column label="应用" prop="app_name" min-width="160" show-overflow-tooltip />
        <el-table-column label="不合规项" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.check_name }}
            <span class="sub-text">（{{ row.obj_name }} @ {{ row.host_name }}）</span>
          </template>
        </el-table-column>
        <el-table-column label="策略" prop="strategy_name" min-width="160" show-overflow-tooltip />
        <el-table-column label="风险等级" width="110">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelType(row.risk_level)" size="small">
              {{ getRiskLevelLabel(row.risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="剩余时效" width="110">
          <template #default="{ row }">
            <el-tag :type="getRemainingTimeType(row.remaining_time_ms)" size="small">
              {{ formatRemainingTime(row.remaining_time_ms) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理人" prop="handler" width="90" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleViewDetails(row)">
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="ci-table-footer">
        <span class="ci-table-total">共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="pagination.currentPage"
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pagination.pageSize"
          small
          @current-change="loadList"
        />
      </div>
    </div>

    <!-- 工单详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="工单详情"
      :size="960"
      direction="rtl"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="currentOrder" class="drawer-content">
        <!-- 基本信息 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-title">
              工单基本信息
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单ID">
              {{ currentOrder.govern_id }}
            </el-descriptions-item>
            <el-descriptions-item label="异常起始日期">
              {{ currentOrder.start_date }}
            </el-descriptions-item>
            <el-descriptions-item label="应用名称">
              {{ currentOrder.app_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="策略名称">
              {{ currentOrder.strategy_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskLevelType(currentOrder.risk_level)" size="small">
                {{ getRiskLevelLabel(currentOrder.risk_level) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="剩余时效">
              {{ formatRemainingTime(currentOrder.remaining_time_ms) }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(currentOrder.status)" size="small">
                {{ getStatusLabel(currentOrder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="处理人">
              {{ currentOrder.handler || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 不合规详情（对齐 govern 联合主键：检查项+检查对象+机器名） -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">
              不合规详情
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="检查项">
              {{ currentOrder.check_name }}
            </el-descriptions-item>
            <el-descriptions-item label="检查对象">
              {{ currentOrder.obj_name }}
            </el-descriptions-item>
            <el-descriptions-item label="机器名">
              {{ currentOrder.host_name }}
            </el-descriptions-item>
            <el-descriptions-item label="IP">
              {{ currentOrder.ip }}
            </el-descriptions-item>
            <el-descriptions-item label="资源类型">
              {{ currentOrder.resource_type }}
            </el-descriptions-item>
            <el-descriptions-item label="模块">
              {{ currentOrder.category_name }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 处理流程 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">
              处理流程
            </div>
          </template>
          <el-steps :active="getProcessStep(currentOrder.status)" align-center>
            <el-step title="待确认" />
            <el-step title="待整改" />
            <el-step title="整改待审核" />
            <el-step title="已闭环" />
          </el-steps>
        </el-card>

        <!-- 处理记录 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">
              处理记录
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in currentOrder.history || []"
              :key="index"
              :timestamp="record.time"
              placement="top"
            >
              <el-card shadow="never">
                <p class="timeline-content">
                  {{ record.content }}
                </p>
                <p class="timeline-user">
                  {{ record.user }}
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 底部操作 -->
        <div class="drawer-actions">
          <el-button @click="drawerVisible = false">
            关闭
          </el-button>
          <template v-if="currentOrder.status === 'pending-confirm'">
            <el-button @click="handleConfirmFalseAlarm">
              误报闭环
            </el-button>
            <el-button type="primary" @click="handleConfirmAndTransfer">
              确认属实，转单二线
            </el-button>
          </template>
          <template v-if="currentOrder.status === 'pending-rectify'">
            <el-button type="primary" @click="handleSubmitRectify">
              提交整改
            </el-button>
          </template>
          <template v-if="currentOrder.status === 'closed' || currentOrder.status === 'rejected'">
            <el-button @click="handleReopen">
              重新打开
            </el-button>
          </template>
        </div>
      </div>
    </el-drawer>

    <!-- 误报闭环 -->
    <el-dialog v-model="falseAlarmDialogVisible" title="误报闭环" width="500px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="误报原因">
          <el-input v-model="form.falseAlarmReason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="falseAlarmDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleFalseAlarmSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 转单二线 -->
    <el-dialog v-model="transferDialogVisible" title="确认属实，转单二线" width="500px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="二线管理员">
          <el-select v-model="form.handler" placeholder="请选择">
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
          </el-select>
        </el-form-item>
        <el-form-item label="转单说明">
          <el-input v-model="form.transferNote" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleTransferSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 提交整改 -->
    <el-dialog v-model="rectifyDialogVisible" title="提交整改" width="600px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="整改说明">
          <el-input v-model="form.rectifyNote" type="textarea" :rows="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleRectifySubmit">
          提交整改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter-input {
  width: 160px;
}
.filter-select {
  width: 130px;
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
.sub-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.drawer-content {
  padding: 16px;
}
.card-title {
  font-weight: 500;
  font-size: 16px;
  color: #2f2e4b;
}
.timeline-content {
  margin: 0 0 4px;
  font-size: 14px;
}
.timeline-user {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
