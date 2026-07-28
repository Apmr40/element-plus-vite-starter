<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DEPT_OPTIONS,
  ENABLE_FLAG_MAP,
  plans,
  PLAN_STATUS_MAP,
  strategies,
  type InspectPlan,
} from '~/demo/mock/config-inspect'
import PlanDetail from '~/demo/components/config-inspect/PlanDetail.vue'

// ==================== 筛选 ====================
const filterForm = ref({
  planName: '',
  status: '',
  deptName: '',
  modifier: '',
})

function handleReset() {
  filterForm.value = { planName: '', status: '', deptName: '', modifier: '' }
}

// ==================== 表格 ====================
const loading = ref(false)
const selectedRows = ref<InspectPlan[]>([])
function handleSelectionChange(rows: InspectPlan[]) {
  selectedRows.value = rows
}

function handleSearch() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const filteredData = computed(() => {
  return plans.filter((p) => {
    if (filterForm.value.planName && !p.plan_name.includes(filterForm.value.planName))
      return false
    if (filterForm.value.status && p.status !== filterForm.value.status)
      return false
    if (filterForm.value.deptName && !p.dept_name.includes(filterForm.value.deptName))
      return false
    if (filterForm.value.modifier && !p.modifier.includes(filterForm.value.modifier))
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

function getStrategyName(strategyId: string) {
  return strategies.find(s => s.strategy_id === strategyId)?.strategy_name || strategyId
}

function isPublicStrategy(strategyId: string) {
  return strategies.find(s => s.strategy_id === strategyId)?.strategy_type === '01'
}

// ==================== 详情弹窗 ====================
const detailVisible = ref(false)
const detailMode = ref<'view' | 'edit' | 'add'>('view')
const currentPlan = ref<InspectPlan | null>(null)

function handleView(row: InspectPlan) {
  currentPlan.value = row
  detailMode.value = 'view'
  detailVisible.value = true
}

function handleEdit(row: InspectPlan) {
  currentPlan.value = row
  detailMode.value = 'edit'
  detailVisible.value = true
}

function handleAdd() {
  currentPlan.value = null
  detailMode.value = 'add'
  detailVisible.value = true
}

function handleDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的计划')
    return
  }
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedRows.value.length} 条计划？删除后关联的定时任务将被取消。`,
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    ElMessage.success(`已删除 ${selectedRows.value.length} 条计划（demo模拟）`)
  }).catch(() => {})
}

function handleSaved() {
  detailVisible.value = false
  ElMessage.success('保存成功（demo模拟）')
}

// ==================== 暂停/恢复 ====================
function handleTogglePause(row: InspectPlan) {
  const isPaused = row.enable_flag === '02'
  ElMessageBox.confirm(
    isPaused ? `确认恢复计划「${row.plan_name}」？` : `确认暂停计划「${row.plan_name}」？暂停后定时任务将停止调度。`,
    isPaused ? '恢复确认' : '暂停确认',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    row.enable_flag = isPaused ? '01' : '02'
    ElMessage.success(isPaused ? '已恢复调度' : '已暂停调度')
  }).catch(() => {})
}

// ==================== 状态展示 ====================
function statusInfo(row: InspectPlan) {
  if (row.status === '0')
    return { label: `试运行(${row.cur_trial_times}/${row.trial_times})`, type: 'primary' as const, clickable: true }
  if (row.status === '1')
    return { label: '常态化', type: 'success' as const, clickable: false }
  return { label: '已取消', type: 'info' as const, clickable: false }
}

function enableInfo(flag: string) {
  if (flag === '01')
    return { label: '运行中', type: 'success' as const }
  if (flag === '02')
    return { label: '已暂停', type: 'warning' as const }
  return { label: '已禁用', type: 'danger' as const }
}

// Cron 可读描述
function cronDesc(cron: string) {
  const parts = cron.split(' ')
  if (parts.length >= 6)
    return `每天 ${parts[2].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  return cron
}
</script>

<template>
  <div class="ci-page">
    <!-- 筛选栏 -->
    <div class="ci-filter-bar">
      <div class="ci-filter-items">
        <el-input v-model="filterForm.planName" placeholder="巡检计划名称" clearable class="filter-input" />
        <el-select v-model="filterForm.status" placeholder="状态" clearable class="filter-select">
          <el-option label="试运行" value="0" />
          <el-option label="常态化" value="1" />
          <el-option label="已取消" value="2" />
        </el-select>
        <el-select v-model="filterForm.deptName" placeholder="部门名称" clearable filterable class="filter-select">
          <el-option v-for="d in DEPT_OPTIONS" :key="d" :label="d" :value="d" />
        </el-select>
        <el-input v-model="filterForm.modifier" placeholder="修改人" clearable class="filter-input" />
        <el-button type="primary" @click="handleSearch">
          <i-ep-search class="mr-4px" />搜索
        </el-button>
        <el-button @click="handleReset">
          <i-ep-refresh class="mr-4px" />重置
        </el-button>
      </div>
      <div class="ci-filter-actions">
        <el-button type="primary" @click="handleAdd">
          <i-ep-plus class="mr-4px" />新增
        </el-button>
        <el-button :disabled="selectedRows.length !== 1" @click="handleEdit(selectedRows[0])">
          <i-ep-edit class="mr-4px" />编辑
        </el-button>
        <el-button type="danger" plain :disabled="selectedRows.length === 0" @click="handleDelete">
          <i-ep-delete class="mr-4px" />删除
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="ci-card">
      <el-table v-loading="loading" :data="tableData" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="42" />
        <el-table-column prop="plan_name" label="计划名称" min-width="260">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleView(row)">
              {{ row.plan_name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="关联策略" min-width="220">
          <template #default="{ row }">
            <span>{{ getStrategyName(row.strategy_id) }}</span>
            <el-tag v-if="isPublicStrategy(row.strategy_id)" size="small" class="ml-6px" effect="plain" type="primary">
              公共
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="巡检周期" width="160">
          <template #default="{ row }">
            <el-tooltip :content="row.crontab" placement="top">
              <span class="cron-text">{{ cronDesc(row.crontab) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="dept_name" label="部门" width="90" />
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-button
              v-if="statusInfo(row).clickable"
              link
              type="primary"
              size="small"
              @click="handleView(row)"
            >
              {{ statusInfo(row).label }}
            </el-button>
            <el-tag v-else size="small" :type="statusInfo(row).type" effect="light">
              {{ statusInfo(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调度" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="enableInfo(row.enable_flag).type" effect="light">
              {{ enableInfo(row.enable_flag).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="modifier" label="修改人" width="90" />
        <el-table-column prop="modify_time" label="修改时间" width="175" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button
              link
              :type="row.enable_flag === '02' ? 'success' : 'warning'"
              size="small"
              :disabled="row.status === '2'"
              @click="handleTogglePause(row)"
            >
              {{ row.enable_flag === '02' ? '恢复' : '暂停' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="ci-table-footer">
        <span class="ci-table-total">共 {{ filteredData.length }} 条</span>
        <el-pagination v-model:current-page="currentPage" layout="prev, pager, next" :total="filteredData.length" :page-size="pageSize" small />
      </div>
    </div>

    <!-- 计划详情弹窗 -->
    <PlanDetail
      v-model:visible="detailVisible"
      :mode="detailMode"
      :plan="currentPlan"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.filter-input {
  width: 160px;
}
.filter-select {
  width: 130px;
}
.cron-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: help;
  border-bottom: 1px dashed var(--el-border-color);
}
</style>
