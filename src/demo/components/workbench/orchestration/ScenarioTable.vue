<script setup lang="ts">
/**
 * 操作编排 · 正式编排 —— 表单（表格）视图
 *
 * 与卡片视图同源（filteredScenarios）。流程图缩略图为卡片专属表达，
 * 表格用「节点数」推导值替代（与卡片流程图一致：开始+执行脚本+结束=3，
 * 决策 Q3）。标签与卡片同源（当前为演示硬编码）。
 */
import { MoreFilled } from '@element-plus/icons-vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  filteredScenarios,
  hasScenarioEditingDraft,
  handleScenarioClick,
  handleScenarioCommand,
} = useWorkbenchContext()

// 节点数推导：与卡片流程图一致（Q3 决策）
const FLOW_NODE_COUNT = 3
// 演示数据节点数恒定，排序提供稳定实现避免报错
function sortByNodeCount(): number {
  return 0
}

// 场景标签：与卡片硬编码同源（演示数据，含底部「隔离」标签）
const SCENARIO_TAGS = [
  { label: '仅生产', type: 'success' as const },
  { label: '应急', type: 'warning' as const },
  { label: '运维请求', type: undefined },
  { label: '隔离', type: 'info' as const },
]
</script>

<template>
  <div class="view-table-wrap">
    <el-table
      :data="filteredScenarios"
      row-key="id"
      class="view-table"
      empty-text="暂无编排"
      @row-click="handleScenarioClick"
    >
      <el-table-column label="编排名称" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="cell-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="编排ID" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="cell-id">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="场景标签" min-width="200">
        <template #default>
          <el-tag
            v-for="tag in SCENARIO_TAGS"
            :key="tag.label"
            size="small"
            :type="tag.type"
          >
            {{ tag.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="节点数" width="80" sortable :sort-method="sortByNodeCount">
        <template #default>
          {{ FLOW_NODE_COUNT }}
        </template>
      </el-table-column>
      <el-table-column label="编辑状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="hasScenarioEditingDraft(row.id)" size="small" type="warning">
            正在编辑
          </el-tag>
          <span v-else class="cell-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="更新人" width="100">
        <template #default="{ row }">
          {{ row.updater || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="150" sortable>
        <template #default="{ row }">
          {{ row.updateTime || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <div class="row-actions" @click.stop>
            <span class="action-link" @click="handleScenarioCommand({ id: row.id, action: 'edit' }, row)">编辑</span>
            <el-dropdown trigger="click" @command="(cmd: { id: string, action: string }) => handleScenarioCommand(cmd, row)">
              <el-icon class="more-icon">
                <MoreFilled />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="hasScenarioEditingDraft(row.id)" :command="{ id: row.id, action: 'viewDraft' }">
                    查看草稿
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ id: row.id, action: 'delete' }">
                    删除
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ id: row.id, action: 'copy' }">
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
</style>
