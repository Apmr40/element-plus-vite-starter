<!-- 应用配置巡检系统 - 巡检结果页 -->
<template>
  <div class="inspection-result-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>巡检结果</h2>
      <el-button type="primary" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出 Excel
      </el-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section">
      <el-space wrap>
        <el-select v-model="filter.appName" placeholder="应用名称" clearable>
          <el-option label="APP-A" value="app-a" />
          <el-option label="APP-B" value="app-b" />
          <el-option label="APP-C" value="app-c" />
        </el-select>
        <el-select v-model="filter.techStack" placeholder="技术栈" clearable>
          <el-option label="Java" value="java" />
          <el-option label="Python" value="python" />
          <el-option label="Go" value="go" />
        </el-select>
        <el-radio-group v-model="filter.status">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="compliant">全部通过</el-radio-button>
          <el-radio-button label="non-compliant">存在不合规</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="filter.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          default-time="['00:00:00', '23:59:59']"
          style="width: 240px"
        />
      </el-space>
      <div class="filter-actions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleOpenStatView">📊 统计视图</el-button>
      </div>
    </div>

    <!-- 列表区 -->
    <div class="list-section">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="巡检 ID" prop="id" width="100" />
        <el-table-column label="应用名称" prop="appName" />
        <el-table-column label="技术栈" prop="techStack" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getTechStackLabel(row.techStack) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="巡检时间" prop="inspectedAt" width="160" />
        <el-table-column label="✅ 合规" prop="compliant" width="100" />
        <el-table-column label="❌ 不合规" prop="nonCompliant" width="100" />
        <el-table-column label="状态" prop="status" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'compliant'" type="success">
              <el-icon><Check /></el-icon> 全部通过
            </el-tag>
            <el-tag v-else type="warning">
              <el-icon><Warning /></el-icon> 存在不合规
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleViewDetails(row)">
                详情
              </el-button>
              <el-button size="small" @click="handleExportRow(row)">
                导出
              </el-button>
              <el-button
                size="small"
                v-permission="['admin']"
                @click="handleBatchCreateOrder(row)"
              >
                批量创建工单
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="巡检详情"
      :size="960"
      direction="rtl"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="drawerLoading" class="drawer-content">
        <!-- 基本信息 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-title">基本信息</div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="巡检 ID">
              {{ currentInspection?.id }}
            </el-descriptions-item>
            <el-descriptions-item label="应用名称">
              {{ currentInspection?.appName }}
            </el-descriptions-item>
            <el-descriptions-item label="技术栈">
              {{ getTechStackLabel(currentInspection?.techStack || '') }}
            </el-descriptions-item>
            <el-descriptions-item label="巡检时间">
              {{ currentInspection?.inspectedAt }}
            </el-descriptions-item>
            <el-descriptions-item label="数据源" :span="2">
              {{ currentInspection?.dataSource }}
            </el-descriptions-item>
            <el-descriptions-item label="规则版本" :span="2">
              {{ currentInspection?.ruleVersion }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 统计概览 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">统计概览</div>
          </template>
          <el-space class="statistics">
            <el-statistic
              title="✅ 合规数量"
              :value="currentInspection?.compliant"
              :value-style="{ color: '#00C771' }"
            >
              <template #prefix>
                <el-icon><Check /></el-icon>
              </template>
            </el-statistic>
            <el-statistic
              title="❌ 不合规数量"
              :value="currentInspection?.nonCompliant"
              :value-style="{ color: '#F13039' }"
            >
              <template #prefix>
                <el-icon><Warning /></el-icon>
              </template>
            </el-statistic>
            <el-statistic
              title="合规率"
              :value="currentInspection?.complianceRate"
              :precision="1"
              suffix="%"
            >
              <template #prefix>
                <el-icon><TrendCharts /></el-icon>
              </template>
            </el-statistic>
          </el-space>
        </el-card>

        <!-- 检查项明细 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">检查项明细</div>
          </template>
          <el-table :data="currentInspection?.checks || []" border>
            <el-table-column label="规则名称" prop="ruleName" />
            <el-table-column label="规则版本" prop="ruleVersion" width="100" />
            <el-table-column label="检查结果" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'passed'" type="success">
                  <el-icon><Check /></el-icon> 通过
                </el-tag>
                <el-tag v-else type="danger">
                  <el-icon><Close /></el-icon> 不通过
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="不合规原因" prop="reason" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" @click="handleCheckDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 不合规项高亮展示 -->
        <el-card
          v-if="currentInspection?.nonCompliant > 0"
          class="section-card"
          shadow="never"
          style="margin-top: 16px"
          :class="currentInspection?.nonCompliant ? 'warning-card' : ''"
        >
          <template #header>
            <div class="card-title">
              <el-icon v-if="currentInspection?.nonCompliant"><Warning /></el-icon>
              不合规明细
            </div>
          </template>
          <el-table
            :data="currentInspection?.nonCompliantItems || []"
            border
            size="small"
          >
            <el-table-column label="实例 ID" prop="instanceId" width="150" />
            <el-table-column label="规则" prop="ruleName" />
            <el-table-column label="不合规原因" prop="reason" />
            <el-table-column label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="getRiskLevelType(row.riskLevel)"
                  size="small"
                >
                  {{ getRiskLevelLabel(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="handleCreateOrder(row)">
                  创建整改工单
                </el-button>
                <el-button size="small" @click="handleViewDetails(currentInspection!)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 底部操作 -->
        <div class="drawer-actions">
          <el-button @click="drawerVisible = false">返回列表</el-button>
          <el-button @click="handleExportdrawer">
            导出明细
          </el-button>
          <el-button
            v-if="currentInspection?.nonCompliant > 0"
            type="primary"
            @click="handleBatchCreateOrders"
          >
            批量创建工单
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 统计视图弹窗 -->
    <el-dialog
      v-model="statViewVisible"
      title="统计视图"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div class="stat-view-content">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-title">巡检次数</div>
              <div class="stat-value">128</div>
              <div class="stat-trend">
                <el-icon :size="16" color="#00C771"><TrendCharts /></el-icon>
                <span>↑ 12% (较上周)</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-title">合规率</div>
              <div class="stat-value">96.5%</div>
              <div class="stat-trend">
                <el-icon :size="16" color="#00C771"><TrendCharts /></el-icon>
                <span>↑ 2.3% (较上周)</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-title">不合规项</div>
              <div class="stat-value">432</div>
              <div class="stat-trend">
                <el-icon :size="16" color="#F13039"><TrendCharts /></el-icon>
                <span>↓ 8% (较上周)</span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="16" style="margin-top: 16px">
          <el-col :span="12">
            <el-card class="stat-card">
              <div class="stat-title">技术栈分布</div>
              <el-chart :data="techStackData" type="pie" height="250px" />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-card">
              <div class="stat-title">风险等级分布</div>
              <el-chart :data="riskLevelData" type="bar" height="250px" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-button @click="statViewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Download,
  Check,
  Warning,
  TrendCharts,
} from '@element-plus/icons-vue'

// 状态
const loading = ref(false)
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const statViewVisible = ref(false)
const currentInspection = ref<InspectionResult | null>(null)

// 筛选条件
const filter = reactive({
  appName: '',
  techStack: '',
  status: 'all',
  timeRange: [] as Date[],
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
})

// 表格数据
const tableData = ref<InspectionResult[]>([])

// 统计视图数据
const techStackData = ref([
  { name: 'Java', value: 45 },
  { name: 'Python', value: 30 },
  { name: 'Go', value: 15 },
  { name: 'Node.js', value: 10 },
])

const riskLevelData = ref([
  { name: '高风险', value: 12 },
  { name: '中风险', value: 24 },
  { name: '低风险', value: 36 },
])

// 计算属性
const getTechStackLabel = (techStack: string) => {
  const map: Record<string, string> = {
    java: 'Java',
    python: 'Python',
    go: 'Go',
    nodejs: 'Node.js',
  }
  return map[techStack] || techStack
}

const getRiskLevelType = (level: string) => {
  switch (level) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

const getRiskLevelLabel = (level: string) => {
  switch (level) {
    case 'high':
      return '🔴 高风险'
    case 'medium':
      return '🟡 中风险'
    case 'low':
      return '🟢 低风险'
    default:
      return level
  }
}

// 方法
const handleSearch = () => {
  loading.value = true

  // 模拟查询
  setTimeout(() => {
    tableData.value = [
      {
        id: 'I001',
        appName: 'APP-A',
        techStack: 'java',
        inspectedAt: '2026-04-21 06:00',
        compliant: 120,
        nonCompliant: 3,
        status: 'non-compliant',
        complianceRate: 97.6,
        dataSource: 'app-a-20260421.csv',
        ruleVersion: 'V2.1',
        checks: [
          { ruleName: 'SSL 检查', ruleVersion: 'V2.1', status: 'passed', reason: '-' },
          { ruleName: '端口检查', ruleVersion: 'V1.0', status: 'failed', reason: '未配置 SSL' },
        ],
        nonCompliantItems: [
          {
            instanceId: '192.168.1.1',
            ruleName: '端口检查',
            reason: '未配置 SSL',
            riskLevel: 'high',
          },
          {
            instanceId: '192.168.1.2',
            ruleName: '端口检查',
            reason: '端口超出范围',
            riskLevel: 'medium',
          },
        ],
      },
      {
        id: 'I002',
        appName: 'APP-B',
        techStack: 'python',
        inspectedAt: '2026-04-21 06:00',
        compliant: 123,
        nonCompliant: 0,
        status: 'compliant',
        complianceRate: 100,
        dataSource: 'app-b-20260421.csv',
        ruleVersion: 'V1.2',
        checks: [{ ruleName: '全量检查', ruleVersion: 'V1.2', status: 'passed', reason: '-' }],
        nonCompliantItems: [],
      },
    ]
    pagination.total = 2
    loading.value = false
  }, 500)
}

const handleViewDetails = (row: InspectionResult) => {
  currentInspection.value = { ...row }
  drawerVisible.value = true
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleExportRow = (row: InspectionResult) => {
  ElMessage.success(`已导出 ${row.appName} 的巡检结果`)
}

const handleExportdrawer = () => {
  ElMessage.success('明细已导出')
}

const handleBatchCreateOrder = (row: InspectionResult) => {
  ElMessage.success(`批量创建 ${row.appName} 的整改工单`)
}

const handleBatchCreateOrders = () => {
  if (currentInspection.value?.nonCompliant) {
    ElMessage.success('已批量创建整改工单')
  }
}

const handleOpenStatView = () => {
  statViewVisible.value = true
}

const handleReset = () => {
  filter.appName = ''
  filter.techStack = ''
  filter.status = 'all'
  filter.timeRange = []
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  handleSearch()
}

const handleCheckDetail = (row: any) => {
  ElMessage.info(`查看 ${row.ruleName} 详情`)
}

const handleCreateOrder = (row: any) => {
  ElMessage.success(`已创建整改工单: ${row.instanceId}`)
}

// 生命周期
onMounted(() => {
  handleSearch()
})
</script>

<style lang="scss" scoped>
.inspection-result-page {
  padding: 16px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: #25303c;
    }
  }

  .filter-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fc;
    border-radius: 8px;

    :deep(.el-space) {
      flex-wrap: wrap;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
    }
  }

  .list-section {
    margin-bottom: 16px;
  }

  .pagination-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .drawer-content {
    padding: 16px;
  }

  .section-card {
    .card-title {
      font-weight: 500;
      font-size: 16px;
      color: #2f2e4b;
    }

    .statistics {
      display: flex;
      gap: 24px;
    }
  }

  .warning-card {
    border-left: 4px solid #ffb100;
  }

  .stat-view-content {
    .stat-card {
      .stat-title {
        font-size: 14px;
        color: #91969d;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 500;
        color: #2f2e4b;
        margin-bottom: 8px;
      }

      .stat-trend {
        font-size: 14px;
        color: #00c771;

        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }

  .drawer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #e8e9eb;
  }
}
</style>
