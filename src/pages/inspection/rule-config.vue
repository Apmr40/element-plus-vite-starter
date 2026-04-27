<!-- 规则配置页面（集成可视化规则编排引擎） -->
<template>
  <div class="rule-config-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/inspection' }">应用配置巡检</el-breadcrumb-item>
        <el-breadcrumb-item>规则配置</el-breadcrumb-item>
      </el-breadcrumb>
      <el-button type="primary" @click="handleAddRule">
        <el-icon><Plus /></el-icon>
        新增规则
      </el-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section">
      <el-space wrap>
        <el-select v-model="filter.techStack" placeholder="技术栈" clearable>
          <el-option label="Java" value="java" />
          <el-option label="Python" value="python" />
          <el-option label="Go" value="go" />
          <el-option label="Node.js" value="nodejs" />
        </el-select>
        <el-select v-model="filter.tags" multiple placeholder="规则标签" clearable>
          <el-option label="安全" value="security" />
          <el-option label="性能" value="performance" />
          <el-option label="规范" value="standard" />
        </el-select>
        <el-radio-group v-model="filter.status">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="enabled">启用</el-radio-button>
          <el-radio-button label="disabled">禁用</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="filter.keyword"
          placeholder="关键词"
          clearable
          style="width: 240px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </el-space>
      <div class="filter-actions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleExport">导出 Excel</el-button>
      </div>
    </div>

    <!-- 列表区 -->
    <div class="list-section">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        row-key="id"
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="规则 ID" prop="id" width="100" />
        <el-table-column label="规则名称" prop="name" />
        <el-table-column label="技术栈" prop="techStack" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getTechStackLabel(row.techStack) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" prop="tags" width="120">
          <template #default="{ row }">
            <el-space>
              <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain">
                {{ getTagLabel(tag) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'enabled'" type="success">
              <el-icon><Check /></el-icon> 启用
            </el-tag>
            <el-tag v-else type="info">
              <el-icon><Close /></el-icon> 禁用
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本" prop="version" width="80" />
        <el-table-column label="更新时间" prop="updatedAt" width="140" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button size="small" @click="handleCopy(row)">
                复制
              </el-button>
              <el-dropdown @command="(cmd) => handleMoreCommand(cmd, row)">
                <el-button size="small">
                  更多 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="row.status === 'enabled'"
                      command="disable"
                      dividers
                    >
                      <el-icon><Top /></el-icon>
                      禁用
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-else
                      command="enable"
                    >
                      <el-icon><Bottom /></el-icon>
                      启用
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      divided
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1200px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <rule-config-form-v2
        v-if="dialogVisible"
        :model-value="currentRule"
        @submit="handleFormSubmit"
        @cancel="dialogVisible = false"
        @mode-change="handleModeChange"
      />
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="`确定要删除规则「${currentRule?.name || ''}」吗？`"
        type="warning"
        :closable="false"
      />
      <div v-if="currentRule?.hasAssociation" class="alert-box warning">
        <el-alert
          title="该规则有关联的巡检任务或正在执行中，暂不允许删除"
          type="error"
          :closable="false"
        />
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button
          v-if="!currentRule?.hasAssociation"
          type="danger"
          @click="handleDeleteConfirm"
        >
          确定删除
        </el-button>
        <el-button v-else @click="deleteDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  ArrowDown,
  Check,
  Close,
  Delete,
  Top,
  Bottom,
} from '@element-plus/icons-vue'
import RuleConfigFormV2 from './components/RuleConfigFormV2.vue'

// 类型定义
interface RuleConfig {
  id: string
  name: string
  techStack: string | string[]
  tags: string[]
  status: 'enabled' | 'disabled'
  version: string
  description?: string
  config?: any
  hasAssociation?: boolean
  updatedAt?: string
}

// 状态
const loading = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const currentRule = ref<RuleConfig | null>(null)

// 筛选条件
const filter = reactive({
  techStack: '',
  tags: [] as string[],
  status: 'all',
  keyword: '',
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
})

// 表格数据
const tableData = ref<RuleConfig[]>([])

// 选项数据
const techStackOptions = ref([
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'nodejs', label: 'Node.js' },
])

const tagOptions = ref([
  { value: 'security', label: '安全' },
  { value: 'performance', label: '性能' },
  { value: 'standard', label: '规范' },
])

// 计算属性
const dialogTitle = computed(() => (currentRule.value ? '编辑规则' : '新增规则'))

// 方法
const handleAddRule = () => {
  currentRule.value = {
    id: '',
    name: '',
    techStack: '',
    tags: [],
    status: 'disabled',
    version: 'V1.0',
    description: '',
    config: null,
  }
  dialogVisible.value = true
}

const handleEdit = (row: RuleConfig) => {
  currentRule.value = { ...row }
  dialogVisible.value = true
  handleModeChange('simple') // 切换到简易模式
}

const handleCopy = (row: RuleConfig) => {
  const copiedRule = {
    ...row,
    id: `R${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    name: `${row.name}_副本`,
    version: 'V1.0',
    status: 'disabled',
  }
  tableData.value.push(copiedRule)
  ElMessage.success('规则复制成功')
}

const handleMoreCommand = (command: string, row: RuleConfig) => {
  currentRule.value = row
  if (!currentRule.value) return
  switch (command) {
    case 'enable':
      currentRule.value.status = 'enabled'
      updateRuleStatus(currentRule.value.id, 'enabled')
      break
    case 'disable':
      currentRule.value.status = 'disabled'
      updateRuleStatus(currentRule.value.id, 'disabled')
      break
    case 'delete':
      deleteDialogVisible.value = true
      break
  }
}

const handleDeleteConfirm = () => {
  if (!currentRule.value) return
  tableData.value = tableData.value.filter((r) => r.id !== currentRule.value?.id)
  deleteDialogVisible.value = false
  ElMessage.success('规则已删除')
}

const updateRuleStatus = (id: string, status: string) => {
  ElMessage.success(`规则状态已更新为 ${status === 'enabled' ? '启用' : '禁用'}`)
}

const getTechStackLabel = (techStack: string) => {
  const option = techStackOptions.value.find((o) => o.value === techStack)
  return option ? option.label : techStack
}

const getTagLabel = (tag: string) => {
  const option = tagOptions.value.find((o) => o.value === tag)
  return option ? option.label : tag
}

const handleSearch = () => {
  loading.value = true
  // 模拟查询
  setTimeout(() => {
    tableData.value = [
      {
        id: 'R001',
        name: 'SSL 配置检查',
        techStack: 'java',
        tags: ['security'],
        status: 'enabled',
        version: 'V2.1',
        updatedAt: '2026-04-20 18:30',
        hasAssociation: false,
      },
      {
        id: 'R002',
        name: '端口合规检查',
        techStack: 'python',
        tags: ['performance'],
        status: 'disabled',
        version: 'V1.0',
        updatedAt: '2026-04-19 10:15',
        hasAssociation: false,
      },
    ]
    pagination.total = 2
    loading.value = false
  }, 500)
}

const handleReset = () => {
  filter.techStack = ''
  filter.tags = []
  filter.status = 'all'
  filter.keyword = ''
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleFormSubmit = (data: RuleConfig) => {
  ElMessage.success('规则保存成功')
  dialogVisible.value = false
  handleSearch()
}

const handleModeChange = (mode: string) => {
  console.log('模式切换:', mode)
  // 可以在这里添加模式切换的额外逻辑
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
  handleSearch()
})
</script>

<style lang="scss" scoped>
.rule-config-page {
  padding: 16px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
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
}

.alert-box {
  margin-top: 16px;
}
</style>
