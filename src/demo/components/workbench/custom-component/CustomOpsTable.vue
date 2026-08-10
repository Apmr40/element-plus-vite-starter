<script setup lang="ts">
/**
 * 应用定制 · 正式操作 —— 表单（表格）视图
 *
 * 与卡片视图同源（customOperations），行为一致性约束见
 * docs/archive/卡片与表单双视图-交互设计.md 第 5 节。
 * 纯渲染组件：数据与命令全部来自 useWorkbenchContext()。
 */
import type { OperationComponent } from '~/demo/types/workbench'
import { MoreFilled } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import TagEditPopover from './TagEditPopover.vue'

const {
  customOperations,
  hasEditingDraft,
  getTagType,
  handleOperationClick,
  handleCustomCommand,
  updateCustomTags,
  tagBatchMode,
  selectedOpIdsForTag,
  hasActiveFilter,
} = useWorkbenchContext()

// 空态文案：区分"真无数据"与"筛选过滤为空"（设计 §7.2）
const emptyText = computed(() =>
  hasActiveFilter.value ? '无匹配数据，试试清除筛选' : '暂无定制操作',
)

// 列以 OperationComponent 实际字段为准（模板大类/操作分类未落到列表实体，v2 补）
const riskTypeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}
const riskTextMap: Record<string, string> = { low: '低', medium: '中', high: '高' }

// 更新时间缺省回退（与卡片渲染一致）
function updateTimeVal(op: OperationComponent): string {
  return op.updateTime || '2024-01-15'
}

// 默认排序：更新时间降序（设计文档 §4.1）
const tableData = computed(() =>
  [...customOperations.value].sort((a, b) => updateTimeVal(b).localeCompare(updateTimeVal(a))),
)

function sortByVersion(a: OperationComponent, b: OperationComponent): number {
  return (a.versionNo || 0) - (b.versionNo || 0)
}
function sortByUpdateTime(a: OperationComponent, b: OperationComponent): number {
  return updateTimeVal(a).localeCompare(updateTimeVal(b))
}

function maxThree(list: string[] | undefined): string[] {
  return (list || []).slice(0, 3)
}

/** 批量模式行点击 = 切换勾选（与卡片一致） */
function onRowClick(row: OperationComponent) {
  if (tagBatchMode.value) {
    const idx = selectedOpIdsForTag.value.indexOf(row.id)
    if (idx >= 0)
      selectedOpIdsForTag.value.splice(idx, 1)
    else
      selectedOpIdsForTag.value.push(row.id)
  }
  else {
    handleOperationClick(row)
  }
}

function toggleBatchCheck(row: OperationComponent) {
  const idx = selectedOpIdsForTag.value.indexOf(row.id)
  if (idx >= 0)
    selectedOpIdsForTag.value.splice(idx, 1)
  else
    selectedOpIdsForTag.value.push(row.id)
}

// 每行一个 TagEditPopover 实例，按 id 收集（下拉「编辑标签」程序化打开，与卡片一致）
const tagPopoverRefs = ref<Record<string, { open: () => void }>>({})
function setPopoverRef(id: string) {
  return (el: unknown) => {
    if (el)
      tagPopoverRefs.value[id] = el as { open: () => void }
  }
}
function onRowCommand(cmd: { action: string }, row: OperationComponent) {
  if (cmd.action === 'editTags') {
    tagPopoverRefs.value[row.id]?.open()
    return
  }
  handleCustomCommand(cmd, row)
}
</script>

<template>
  <div class="view-table-wrap">
    <el-table
      :data="tableData"
      row-key="id"
      class="view-table"
      :empty-text="emptyText"
      @row-click="onRowClick"
    >
      <!-- 批量模式勾选列 -->
      <el-table-column v-if="tagBatchMode" width="45">
        <template #default="{ row }">
          <el-checkbox
            :model-value="selectedOpIdsForTag.includes(row.id)"
            @click.stop
            @change="() => toggleBatchCheck(row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作名称" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="cell-name">{{ row.name }}</span>
          <el-tag size="small" type="warning">
            定制
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="组件ID" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="cell-id">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="200">
        <template #default="{ row }">
          <TagEditPopover
            :ref="setPopoverRef(row.id)"
            :operation="row"
            @confirm="updateCustomTags"
          >
            <div class="cell-tags" @click.stop>
              <!-- 权限提示：实色 tag -->
              <el-tag
                v-for="(tag, i) in maxThree(row.tags)"
                :key="`p-${i}`"
                size="small"
                :type="getTagType(tag)"
              >
                {{ tag }}
              </el-tag>
              <!-- 自定义标签：描边 plain tag -->
              <el-tag
                v-for="(tag, i) in maxThree(row.customTags)"
                :key="`c-${i}`"
                size="small"
                effect="plain"
                class="custom-tag-plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </TagEditPopover>
        </template>
      </el-table-column>
      <el-table-column label="风险等级" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.riskLevel" size="small" :type="riskTypeMap[row.riskLevel] || 'info'">
            {{ riskTextMap[row.riskLevel] || row.riskLevel }}
          </el-tag>
          <span v-else class="cell-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="当前版本" width="90" sortable :sort-method="sortByVersion">
        <template #default="{ row }">
          <span
            v-if="row.versionNo"
            class="version-link"
            @click.stop="handleCustomCommand({ action: 'versionHistory' }, row)"
          >
            V{{ row.versionNo }}
          </span>
          <span v-else class="cell-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="编辑状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="hasEditingDraft(row.id)" size="small" type="warning">
            正在编辑
          </el-tag>
          <span v-else class="cell-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="executeCount" label="执行次数" width="90" sortable />
      <el-table-column label="更新人" width="100">
        <template #default="{ row }">
          {{ row.updater || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="150" sortable :sort-method="sortByUpdateTime">
        <template #default="{ row }">
          {{ updateTimeVal(row) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="190" fixed="right">
        <template #default="{ row }">
          <div class="row-actions" @click.stop>
            <span class="action-link" @click="handleCustomCommand({ action: 'edit' }, row)">编辑</span>
            <span class="action-link" @click="handleCustomCommand({ action: 'versionHistory' }, row)">版本历史</span>
            <el-dropdown trigger="click" @command="(cmd: { action: string }) => onRowCommand(cmd, row)">
              <el-icon class="more-icon">
                <MoreFilled />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'editTags' }">
                    编辑标签
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete' }">
                    删除
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'copy' }">
                    复制
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
@use '~/pages/workbench/workbench.scss' as *;

.cell-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  cursor: pointer;
}
</style>
