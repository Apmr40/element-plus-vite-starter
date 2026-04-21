<!-- 应用配置巡检系统 - 整改工单页 -->
<template>
  <div class="rectification-order-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>整改工单</h2>
      <el-button type="primary" @click="handleCreateOrder">
        <el-icon><Plus /></el-icon>
        新增工单
      </el-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section">
      <el-space wrap>
        <el-radio-group v-model="filter.status">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="pending-confirm">待我确认</el-radio-button>
          <el-radio-button label="pending-rectify">待我整改</el-radio-button>
          <el-radio-button label="pending-review">整改待审核</el-radio-button>
          <el-radio-button label="closed">已闭环</el-radio-button>
          <el-radio-button label="rejected">已驳回</el-radio-button>
        </el-radio-group>
        <el-select v-model="filter.riskLevel" placeholder="风险等级" clearable>
          <el-option label="🔴 高风险" value="high" />
          <el-option label="🟡 中风险" value="medium" />
          <el-option label="🟢 低风险" value="low" />
        </el-select>
        <el-select v-model="filter.appName" placeholder="应用" clearable>
          <el-option label="APP-A" value="app-a" />
          <el-option label="APP-B" value="app-b" />
          <el-option label="APP-C" value="app-c" />
        </el-select>
        <el-date-picker
          v-model="filter.createdAt"
          type="daterange"
          range-separator="至"
          start-placeholder="创建时间"
          end-placeholder="创建时间"
          style="width: 240px"
        />
      </el-space>
      <div class="filter-actions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
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
        <el-table-column label="工单 ID" prop="id" width="100" />
        <el-table-column label="应用" prop="appName" />
        <el-table-column label="不合规项" prop="nonCompliantItem" />
        <el-table-column label="风险等级" prop="riskLevel" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getRiskLevelType(row.riskLevel)"
              size="large"
            >
              {{ getRiskLevelLabel(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="剩余时效" prop="remainingTime" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getRemainingTimeType(row.remainingTime)"
              size="large"
            >
              {{ formatRemainingTime(row.remainingTimeMs) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="large"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleViewDetails(row)">
              处理
            </el-button>
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

    <!-- 工单详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="工单详情"
      :size="960"
      direction="rtl"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="drawerLoading" class="drawer-content">
        <!-- 工单基本信息 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-title">工单基本信息</div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单 ID">
              {{ currentOrder?.id }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ currentOrder?.createdAt }}
            </el-descriptions-item>
            <el-descriptions-item label="应用名称">
              {{ currentOrder?.appName }}
            </el-descriptions-item>
            <el-descriptions-item label="技术栈">
              {{ getTechStackLabel(currentOrder?.techStack || '') }}
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskLevelType(currentOrder?.riskLevel || '')">
                {{ getRiskLevelLabel(currentOrder?.riskLevel || '') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="剩余时效">
              {{ formatRemainingTime(currentOrder?.remainingTimeMs || 0) }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(currentOrder?.status || '')">
                {{ getStatusLabel(currentOrder?.status || '') }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="处理人">
              {{ currentOrder?.handler || '-system' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 不合规详情 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">不合规详情</div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="规则名称">
              {{ currentOrder?.ruleName }}
            </el-descriptions-item>
            <el-descriptions-item label="检查项">
              {{ currentOrder?.checkItem }}
            </el-descriptions-item>
            <el-descriptions-item label="不合规原因">
              {{ currentOrder?.reason }}
            </el-descriptions-item>
            <el-descriptions-item label="实例 ID">
              {{ currentOrder?.instanceId }}
            </el-descriptions-item>
            <el-descriptions-item label="数据源">
              {{ currentOrder?.dataSource }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 处理流程 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">处理流程</div>
          </template>
          <el-steps :active="getProcessStep(currentOrder?.status || '')" align-center>
            <el-step title="待确认" />
            <el-step title="待整改" />
            <el-step title="整改待审核" />
            <el-step title="已闭环" />
          </el-steps>
        </el-card>

        <!-- 处理记录 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">处理记录</div>
          </template>
          <div class="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in currentOrder?.history || []"
                :key="index"
                :timestamp="record.time"
                placement="top"
              >
                <el-card>
                  <p class="timeline-content">{{ record.content }}</p>
                  <p class="timeline-user">{{ record.user }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>

        <!-- 底部操作 -->
        <div v-if="currentOrder" class="drawer-actions">
          <el-button @click="drawerVisible = false">关闭</el-button>

          <!-- 一线管理员操作 -->
          <template v-if="['pending-confirm'].includes(currentOrder.status)">
            <el-button @click="handleConfirmFalse Alarm">
              误报闭环
            </el-button>
            <el-button type="primary" @click="handleConfirmAndTransfer">
              确认属实，转单二线
            </el-button>
          </template>

          <!-- 二线管理员操作 -->
          <template v-if="['pending-rectify'].includes(currentOrder.status)">
            <el-button type="primary" @click="handleSubmitRectify">
              提交整改
            </el-button>
          </template>

          <!-- 查看操作 -->
          <template v-if="['closed', 'rejected'].includes(currentOrder.status)">
            <el-button @click="handleReopen">重新打开</el-button>
          </template>
        </div>
      </div>
    </el-drawer>

    <!-- 误报闭环 dialog -->
    <el-dialog
      v-model="falseAlarmDialogVisible"
      title="误报闭环"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="误报原因">
          <el-input v-model="form.falseAlarmReason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="falseAlarmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFalseAlarmSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 转单 dialog -->
    <el-dialog
      v-model="transferDialogVisible"
      title="确认属实，转单二线"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="二线管理员">
          <el-select v-model="form.handler" placeholder="请选择">
            <el-option label="李四" value="li-si" />
            <el-option label="王五" value="wang-wu" />
          </el-select>
        </el-form-item>
        <el-form-item label="转单说明">
          <el-input v-model="form.transferNote" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransferSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 提交整改 dialog -->
    <el-dialog
      v-model="rectifyDialogVisible"
      title="提交整改"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="整改说明">
          <el-input v-model="form.rectifyNote" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload
            v-model:file-list="form.attachments"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileChange"
            :limit="5"
          >
            <el-button size="small" type="primary">
              点击上传
            </el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRectifySubmit">
          提交整改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus,
  TrendCharts,
} from '@element-plus/icons-vue'

// 状态
const loading = ref(false)
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const falseAlarmDialogVisible = ref(false)
const transferDialogVisible = ref(false)
const rectifyDialogVisible = ref(false)
const currentOrder = ref<Order | null>(null)

// 表单数据
const form = reactive({
  falseAlarmReason: '',
  handler: '',
  transferNote: '',
  rectifyNote: '',
  attachments: [] as any[],
})

// 筛选条件
const filter = reactive({
  status: 'all',
  riskLevel: '',
  appName: '',
  createdAt: [] as Date[],
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
})

// 表格数据
const tableData = ref<Order[]>([])

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

const getRemainingTimeType = (time: number) => {
  if (time <= 0) return 'danger'
  if (time <= 24 * 60 * 60 * 1000) return 'warning' // 24 小时
  return 'info'
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending-confirm':
      return 'warning'
    case 'pending-rectify':
      return 'warning'
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

const getStatusLabel = (status: string) => {
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
      return status
  }
}

const getProcessStep = (status: string) => {
  const stepMap: Record<string, number> = {
    'pending-confirm': 1,
    'pending-rectify': 2,
    'pending-review': 3,
    'closed': 4,
    'rejected': 3,
  }
  return stepMap[status] || 0
}

// 方法
const handleSearch = () => {
  loading.value = true

  // 模拟查询
  setTimeout(() => {
    tableData.value = [
      {
        id: 'T001',
        appName: 'APP-A',
        nonCompliantItem: '端口检查',
        riskLevel: 'high',
        remainingTimeMs: 23 * 60 * 60 * 1000, // 23 小时
        status: 'pending-confirm',
        handler: '一线管理员 - 张三',
        ruleName: '端口检查',
        checkItem: 'SSL 证书配置',
        reason: '未配置 SSL 证书',
        instanceId: '192.168.1.1',
        dataSource: 'app-a-20260421.csv',
        createdAt: '2026-04-21 08:00',
        techStack: 'java',
        history: [
          { time: '2026-04-21 08:00', content: '系统自动创建工单', user: 'system' },
          { time: '2026-04-21 08:05', content: '派单给一线管理员 - 张三', user: 'system' },
        ],
      },
      {
        id: 'T002',
        appName: 'APP-B',
        nonCompliantItem: 'SSL 配置',
        riskLevel: 'medium',
        remainingTimeMs: 47 * 60 * 60 * 1000, // 47 小时
        status: 'pending-rectify',
        handler: '二线管理员 - 李四',
        ruleName: 'SSL 配置检查',
        checkItem: 'SSL 证书有效期',
        reason: 'SSL 证书即将过期',
        instanceId: '192.168.1.2',
        dataSource: 'app-b-20260421.csv',
        createdAt: '2026-04-21 09:00',
        techStack: 'python',
        history: [
          { time: '2026-04-21 09:00', content: '系统自动创建工单', user: 'system' },
          { time: '2026-04-21 09:05', content: '派单给二线管理员 - 李四', user: 'system' },
        ],
      },
    ]
    pagination.total = 2
    loading.value = false
  }, 500)
}

const handleViewDetails = (row: Order) => {
  currentOrder.value = { ...row }
  drawerVisible.value = true
}

const formatRemainingTime = (timeMs: number) => {
  if (timeMs <= 0) return '已超期'

  const hours = Math.floor(timeMs / (1000 * 60 * 60))
  const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h${minutes}m`
}

const handleCreateOrder = () => {
  ElMessage.info('新增工单功能开发中...')
}

const handleConfirmFalseAlarm = () => {
  falseAlarmDialogVisible.value = true
}

const handleConfirmAndTransfer = () => {
  transferDialogVisible.value = true
}

const handleSubmitRectify = () => {
  rectifyDialogVisible.value = true
}

const handleFalseAlarmSubmit = () => {
  ElMessage.success('工单已闭环（误报）')
  falseAlarmDialogVisible.value = false
  if (currentOrder.value) {
    currentOrder.value.status = 'closed'
  }
}

const handleTransferSubmit = () => {
  ElMessage.success('工单已转单给二线管理员')
  transferDialogVisible.value = false
  if (currentOrder.value) {
    currentOrder.value.status = 'pending-rectify'
    currentOrder.value.handler = '二线管理员 - ' + (form.handler === 'li-si' ? '李四' : '王五')
    currentOrder.value.history?.push({
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      content: `转单给二线管理员 - ${form.handler === 'li-si' ? '李四' : '王五'}`,
      user: 'system',
    })
  }
}

const handleRectifySubmit = () => {
  ElMessage.success('整改已提交，等待审核')
  rectifyDialogVisible.value = false
  if (currentOrder.value) {
    currentOrder.value.status = 'pending-review'
    currentOrder.value.history?.push({
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      content: `二线管理员提交整改：${form.rectifyNote}`,
      user: 'system',
    })
  }
}

const handleReopen = () => {
  if (currentOrder.value) {
    currentOrder.value.status = 'pending-rectify'
    ElMessage.success('工单已重新打开')
  }
}

const handleReset = () => {
  filter.status = 'all'
  filter.riskLevel = ''
  filter.appName = ''
  filter.createdAt = []
}

const handleFileChange = (file: any) => {
  ElMessage.info(`文件已选择: ${file.name}`)
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  handleSearch()
}

// 生命周期
onMounted(() => {
  // 默认显示待确认的工单
  filter.status = 'pending-confirm'
  handleSearch()
})
</script>

<style lang="scss" scoped>
.rectification-order-page {
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

    .timeline {
      .timeline-content {
        margin-bottom: 4px;
        color: #2f2e4b;
      }

      .timeline-user {
        font-size: 12px;
        color: #91969d;
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
