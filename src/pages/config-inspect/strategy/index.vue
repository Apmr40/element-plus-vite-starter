<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  categoryTree,
  strategies,
  STRATEGY_TYPE_MAP,
  TAGS_MAP,
  TOP_TYPE_MAP,
  type InspectStrategy,
} from '~/demo/mock/config-inspect'
import StrategyDetail from '~/demo/components/config-inspect/StrategyDetail.vue'

// ==================== 树导航 ====================
const selectedCategory = ref('')
const treeFilterText = ref('')
const treeRef = ref()

function filterNode(value: string, data: Record<string, any>) {
  if (!value)
    return true
  return String(data.label ?? '').includes(value)
}

watch(treeFilterText, (val) => {
  treeRef.value?.filter(val)
})

function handleNodeClick(data: { id: string, label: string }) {
  selectedCategory.value = data.id
}

// ==================== 筛选 ====================
const filterForm = ref({
  strategyName: '',
  tags: '',
  status: '',
  modifier: '',
})

function handleReset() {
  filterForm.value = { strategyName: '', tags: '', status: '', modifier: '' }
}

// ==================== 表格 ====================
const loading = ref(false)
const selectedRows = ref<InspectStrategy[]>([])
function handleSelectionChange(rows: InspectStrategy[]) {
  selectedRows.value = rows
}

function handleSearch() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const filteredData = computed(() => {
  return strategies.filter((s) => {
    if (selectedCategory.value && s.category_id !== selectedCategory.value && s.sub_type !== selectedCategory.value)
      return false
    if (filterForm.value.strategyName && !s.strategy_name.includes(filterForm.value.strategyName))
      return false
    if (filterForm.value.tags && s.tags !== filterForm.value.tags)
      return false
    if (filterForm.value.status && s.status !== filterForm.value.status)
      return false
    if (filterForm.value.modifier && !s.modifier.includes(filterForm.value.modifier))
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

// ==================== 详情弹窗 ====================
const detailVisible = ref(false)
const detailMode = ref<'view' | 'edit' | 'add'>('view')
const currentStrategy = ref<InspectStrategy | null>(null)

function handleView(row: InspectStrategy) {
  currentStrategy.value = row
  detailMode.value = 'view'
  detailVisible.value = true
}

function handleEdit(row: InspectStrategy) {
  currentStrategy.value = row
  detailMode.value = 'edit'
  detailVisible.value = true
}

function handleAdd() {
  currentStrategy.value = null
  detailMode.value = 'add'
  detailVisible.value = true
}

function handleDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的策略')
    return
  }
  const hasPlan = selectedRows.value.some(s => s.status === 'published')
  ElMessageBox.confirm(
    hasPlan
      ? `选中的 ${selectedRows.value.length} 条策略中存在已发布策略，删除后关联计划将被禁用，确认删除？`
      : `确认删除选中的 ${selectedRows.value.length} 条策略？`,
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    ElMessage.success(`已删除 ${selectedRows.value.length} 条策略（demo模拟）`)
  }).catch(() => {})
}

function handleSaved() {
  detailVisible.value = false
  ElMessage.success('保存成功（demo模拟）')
}

// ==================== 状态展示 ====================
function statusTag(status: string) {
  return status === 'published'
    ? { label: '已发布', type: 'success' as const }
    : { label: '草稿', type: 'info' as const }
}
</script>

<template>
  <div class="ci-page">
    <div class="strategy-layout">
      <!-- 左侧：分类树 -->
      <div class="strategy-tree-panel">
        <div class="tree-panel-header">
          <span class="tree-panel-title">策略分类</span>
        </div>
        <el-input
          v-model="treeFilterText"
          placeholder="搜索分类"
          size="small"
          clearable
          class="tree-search"
        >
          <template #prefix>
            <i-ep-search />
          </template>
        </el-input>
        <el-tree
          ref="treeRef"
          :data="categoryTree"
          node-key="id"
          :props="{ children: 'children', label: 'label' }"
          :filter-node-method="filterNode"
          :default-expanded-keys="['base', 'sys', 'os']"
          highlight-current
          @node-click="handleNodeClick"
        />
        <div v-if="selectedCategory" class="tree-clear">
          <el-button link type="primary" size="small" @click="selectedCategory = ''">
            <i-ep-close class="mr-4px" />清除分类筛选
          </el-button>
        </div>
      </div>

      <!-- 右侧：列表区 -->
      <div class="strategy-main">
        <!-- 筛选栏 -->
        <div class="ci-filter-bar">
          <div class="ci-filter-items">
            <el-input v-model="filterForm.strategyName" placeholder="策略名称" clearable class="filter-input" />
            <el-select v-model="filterForm.tags" placeholder="标签" clearable class="filter-select">
              <el-option v-for="(label, key) in TAGS_MAP" :key="key" :label="label" :value="key" />
            </el-select>
            <el-select v-model="filterForm.status" placeholder="状态" clearable class="filter-select">
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
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
          <el-table
            v-loading="loading"
            :data="tableData"
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="42" />
            <el-table-column prop="strategy_name" label="策略名称" min-width="220">
              <template #default="{ row }">
                <el-link type="primary" :underline="false" @click="handleView(row)">
                  {{ row.strategy_name }}
                </el-link>
                <el-tag v-if="row.strategy_type === '01'" size="small" class="ml-6px" effect="plain" type="primary">
                  公共
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tags" label="标签" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.tags === '01' ? 'danger' : row.tags === '02' ? 'warning' : 'success'" effect="light">
                  {{ TAGS_MAP[row.tags] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category_name" label="分类" width="110" />
            <el-table-column prop="top_type" label="类型" width="70">
              <template #default="{ row }">
                {{ TOP_TYPE_MAP[row.top_type] }}
              </template>
            </el-table-column>
            <el-table-column prop="exec_type" label="执行方式" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.exec_type === '0' ? '' : 'warning'" effect="plain">
                  {{ row.exec_type === '0' ? '代理端' : '服务端' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTag(row.status).type" effect="light">
                  {{ statusTag(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="modifier" label="修改人" width="90" />
            <el-table-column prop="modify_time" label="修改时间" width="175" />
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="ci-table-footer">
            <span class="ci-table-total">共 {{ filteredData.length }} 条</span>
            <el-pagination
              v-model:current-page="currentPage"
              layout="prev, pager, next"
              :total="filteredData.length"
              :page-size="pageSize"
              small
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 策略详情弹窗 -->
    <StrategyDetail
      v-model:visible="detailVisible"
      :mode="detailMode"
      :strategy="currentStrategy"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.strategy-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.strategy-tree-panel {
  width: 220px;
  min-width: 220px;
  background: var(--el-fill-color-blank);
  border-radius: var(--uops-radius-card-sm);
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--ci-shadow-card);
  padding: 12px;
  position: sticky;
  top: 68px;
}
.tree-panel-header {
  margin-bottom: 10px;
}
.tree-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.tree-search {
  margin-bottom: 8px;
}
.tree-clear {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-light);
}
.strategy-main {
  flex: 1;
  min-width: 0;
}
.filter-input {
  width: 150px;
}
.filter-select {
  width: 120px;
}
</style>
