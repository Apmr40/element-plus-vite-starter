<script setup lang="ts">
/**
 * 操作编排 · 我的草稿 —— 表单（表格）视图
 *
 * 与卡片视图同源（scenarioDrafts）；勾选与 selectedScenarioDraftIds 双向同步，
 * 跨视图切换保留勾选（设计文档 §6）。
 * 行内动作按状态联动，与卡片菜单命令一一对应（设计文档 §4.5）。
 */
import type { ScenarioDraft } from '~/demo/types/workbench'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

interface TableInstance {
  clearSelection: () => void
  toggleRowSelection: (row: ScenarioDraft, selected?: boolean) => void
}

const {
  scenarioDrafts,
  selectedScenarioDraftIds,
  getScenarioDraftStatusType,
  getScenarioDraftStatusText,
  handleScenarioDraftCommand,
} = useWorkbenchContext()

// 默认排序：保存时间降序（设计文档 §4.4）
const tableData = computed(() =>
  [...scenarioDrafts.value].sort((a, b) => b.saveTime.localeCompare(a.saveTime)),
)

// ============ 勾选双向同步（仅 draft 状态可勾选）============
const tableRef = useTemplateRef<TableInstance>('table')
const currentSelected = ref<Set<string>>(new Set())
let syncing = false

function selectable(row: ScenarioDraft): boolean {
  return row.status === 'draft'
}

function onSelectionChange(rows: ScenarioDraft[]) {
  currentSelected.value = new Set(rows.map(r => r.id))
  if (!syncing)
    selectedScenarioDraftIds.value = rows.map(r => r.id)
}

function applySelection(ids: string[]) {
  const table = tableRef.value
  if (!table)
    return
  syncing = true
  table.clearSelection()
  tableData.value.forEach((row) => {
    if (ids.includes(row.id))
      table.toggleRowSelection(row, true)
  })
  syncing = false
}

// 外部变化（卡片视图勾选 / 批量栏全选 / 清空）→ 同步到表格
watch(selectedScenarioDraftIds, (ids) => {
  const target = new Set(ids)
  if (target.size === currentSelected.value.size
    && [...target].every(id => currentSelected.value.has(id))) {
    return
  }
  applySelection(ids)
}, { flush: 'post' })

onMounted(() => applySelection(selectedScenarioDraftIds.value))

// 状态 × 行内动作矩阵（与卡片 dropdown 命令一致，设计文档 §4.5）
const statusActions: Record<string, { action: string, label: string }[]> = {
  draft: [
    { action: 'edit', label: '编辑' },
    { action: 'publish', label: '发布' },
    { action: 'delete', label: '删除' },
  ],
  submitted: [
    { action: 'recall', label: '撤回' },
    { action: 'viewBatch', label: '查看发布状态' },
  ],
  rejected: [
    { action: 'edit', label: '编辑' },
    { action: 'delete', label: '删除' },
  ],
}
</script>

<template>
  <div class="view-table-wrap">
    <el-table
      ref="table"
      :data="tableData"
      row-key="id"
      class="view-table"
      :empty-text="scenarioDrafts.length === 0 ? '暂无草稿' : '无匹配数据，试试清空筛选'"
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="45" :selectable="selectable" />
      <el-table-column label="草稿名称" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="cell-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源编排ID" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.sourceScenarioId" class="cell-id">{{ row.sourceScenarioId }}</span>
          <span v-else class="cell-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.sourceScenarioId ? 'info' : 'primary'">
            {{ row.sourceScenarioId ? '编辑' : '新建' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="getScenarioDraftStatusType(row.status)">
            {{ getScenarioDraftStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="saveTime" label="保存时间" width="160" sortable />
      <el-table-column label="更新人" width="100">
        <template #default="{ row }">
          {{ row.updater || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <div v-if="statusActions[row.status]" class="row-actions" @click.stop>
            <span
              v-for="act in statusActions[row.status]"
              :key="act.action"
              class="action-link"
              @click="handleScenarioDraftCommand({ action: act.action }, row)"
            >
              {{ act.label }}
            </span>
          </div>
          <span v-else class="cell-muted">-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
@use '~/pages/workbench/workbench.scss' as *;
</style>
