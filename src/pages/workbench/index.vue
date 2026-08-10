<script setup lang="ts">
import {
  ArrowLeft,
  Clock,
  Edit,
  Filter,
  InfoFilled,
  MoreFilled,
  Plus,
  SetUp,
  Star,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import BaselineConflictDialog from '~/demo/components/workbench/custom-component/BaselineConflictDialog.vue'
import CustomDraftsTable from '~/demo/components/workbench/custom-component/CustomDraftsTable.vue'
import CustomOpsTable from '~/demo/components/workbench/custom-component/CustomOpsTable.vue'
import TagEditPopover from '~/demo/components/workbench/custom-component/TagEditPopover.vue'
import VersionDiffDialog from '~/demo/components/workbench/custom-component/VersionDiffDialog.vue'
import VersionHistoryDrawer from '~/demo/components/workbench/custom-component/VersionHistoryDrawer.vue'
import CustomComponentDialog from '~/demo/components/workbench/CustomComponentDialog.vue'
import ExecutionDialog from '~/demo/components/workbench/ExecutionDialog.vue'
import FilterBar from '~/demo/components/workbench/FilterBar.vue'
import FilterEntry from '~/demo/components/workbench/FilterEntry.vue'
import HistoryDrawer from '~/demo/components/workbench/HistoryDrawer.vue'
import ScenarioDraftsTable from '~/demo/components/workbench/orchestration/ScenarioDraftsTable.vue'
import ScenarioTable from '~/demo/components/workbench/orchestration/ScenarioTable.vue'
import PublishDialogs from '~/demo/components/workbench/PublishDialogs.vue'
import RecentExecutionsBar from '~/demo/components/workbench/RecentExecutionsBar.vue'
import ViewSwitcher from '~/demo/components/workbench/ViewSwitcher.vue'
import { validateTagName } from '~/demo/types/workbench'
import { useWorkbench } from './composables/useWorkbench'

// 组合入口：组合三个领域 composable + provide 上下文 + onMounted 数据加载
const {
  // ===== 应用模块 =====
  modules,
  selectedModuleId,
  handleModuleChange,
  handleOpenHistoryDrawer,
  // ===== 操作组件 =====
  activeSource,
  operationSearch,
  activeCategory,
  publicCategories,
  selectedSubcategory,
  subcategories,
  filteredOperations,
  favoriteFilter,
  favoriteCategories,
  favoriteOperations,
  customActiveTab,
  customViewMode,
  customOperations,
  customDrafts,
  selectedDraftIds,
  isAllSelected,
  handleSourceChange,
  handleTabClick,
  handleSubcategoryClick,
  handleBackToSubcategories,
  handleOperationClick,
  handleToggleFavorite,
  getTagType,
  getOperationCount,
  hasEditingDraft,
  handleCustomCommand,
  handleAddCustomOp,
  handleQuickModifyCustom,
  updateCustomTags,
  batchAppendTags,
  filterExpanded,
  hasActiveFilter,
  tagBatchMode,
  selectedOpIdsForTag,
  exitTagBatchMode,
  customTagOptions,
  handleDraftCommand,
  getDraftStatusType,
  getDraftStatusText,
  toggleSelectAll,
  handleBatchPublish,
  handleBatchDelete,
  clearSelection,
  // ===== 操作编排 =====
  activeScenarioTab,
  orchestrationViewMode,
  filteredScenarios,
  hasScenarioEditingDraft,
  handleScenarioClick,
  handleScenarioCommand,
  handleAddScenario,
  handleQuickModify,
  handleFilterScenario,
  scenarioDrafts,
  selectedScenarioDraftIds,
  isAllScenarioDraftsSelected,
  getScenarioDraftStatusType,
  getScenarioDraftStatusText,
  handleScenarioDraftCommand,
  toggleSelectAllScenarioDrafts,
  handleBatchScenarioPublish,
  handleBatchScenarioDelete,
  clearScenarioSelection,
} = useWorkbench()

// ============ 批量加标签模式：页面本地状态（composable 只收敛数据写操作）============
const batchTagSelection = ref<string[]>([])

// 空态文案：区分"真无数据"与"筛选过滤为空"（设计 §7.2）
const customEmptyText = computed(() =>
  hasActiveFilter.value ? '无匹配数据，试试清除筛选' : '暂无定制操作',
)

/** 切换单个操作在批量模式下的勾选态 */
function toggleOpForTag(operationId: string, value?: boolean) {
  const idx = selectedOpIdsForTag.value.indexOf(operationId)
  const checked = value !== undefined ? value : idx === -1
  if (checked && idx === -1) {
    selectedOpIdsForTag.value.push(operationId)
  }
  else if (!checked && idx >= 0) {
    selectedOpIdsForTag.value.splice(idx, 1)
  }
}

/** 应用批量标签（校验标签数量上限，设计 §8） */
function applyBatchTags() {
  if (selectedOpIdsForTag.value.length === 0) {
    ElMessage.warning('请先勾选要添加标签的操作')
    return
  }
  // 校验行内新建的标签名（allow-create 会产生任意字符串）
  for (const tag of batchTagSelection.value) {
    const result = validateTagName(tag)
    if (!result.valid) {
      ElMessage.warning(`标签"${tag}"无效：${result.message}`)
      return
    }
  }
  batchAppendTags(selectedOpIdsForTag.value, batchTagSelection.value)
  batchTagSelection.value = []
}

// ============ 编辑标签 popover：每个定制卡片一个实例，按 id 收集 ============
const tagPopoverRefs = ref<Record<string, { open: () => void }>>({})
function setTagPopoverRef(id: string) {
  return (el: unknown) => {
    if (el)
      tagPopoverRefs.value[id] = el as { open: () => void }
  }
}
/** 下拉菜单「编辑标签」→ 打开对应卡片的 popover（设计 §5.1） */
function openTagEditor(id: string) {
  tagPopoverRefs.value[id]?.open()
}

/** 定制操作命令分发：editTags 为页面级行为（打开 popover），其余走 composable */
function onCustomCommand(cmd: { action: string }, operation: { id: string }) {
  if (cmd.action === 'editTags') {
    openTagEditor(operation.id)
    return
  }
  handleCustomCommand(cmd, operation as Parameters<typeof handleCustomCommand>[1])
}
</script>

<template>
  <div class="workbench-container">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="top-bar-label">应用系统</span>
        <el-select
          v-model="selectedModuleId"
          placeholder="请选择应用系统"
          style="width: 320px"
          @change="handleModuleChange"
        >
          <el-option
            v-for="module in modules"
            :key="module.id"
            :label="module.name"
            :value="module.id"
          />
        </el-select>
      </div>
      <div class="top-bar-right">
        <el-button @click="handleOpenHistoryDrawer">
          <el-icon><Clock /></el-icon>
          <span>执行历史</span>
        </el-button>
      </div>
    </div>

    <!-- 最近执行状态栏 -->
    <RecentExecutionsBar />

    <!-- 操作选择区域 -->
    <div class="operation-section">
      <div class="section-header">
        <div class="section-title">
          <div class="diamond-icon" />
          <span>操作组件</span>
        </div>
        <!-- 三大分区Tab -->
        <div class="source-tabs">
          <div
            class="source-tab"
            :class="{ active: activeSource === 'favorite' }"
            @click="handleSourceChange('favorite')"
          >
            <el-icon><Star /></el-icon>
            <span>我的收藏</span>
          </div>
          <div
            class="source-tab"
            :class="{ active: activeSource === 'public' }"
            @click="handleSourceChange('public')"
          >
            <el-icon><SetUp /></el-icon>
            <span>公共组件</span>
          </div>
          <div
            class="source-tab"
            :class="{ active: activeSource === 'custom' }"
            @click="handleSourceChange('custom')"
          >
            <el-icon><Edit /></el-icon>
            <span>应用定制</span>
          </div>
        </div>
        <div class="section-actions">
          <el-input
            v-model="operationSearch"
            :placeholder="activeSource === 'custom' ? '请输入操作名称或ID' : '请输入操作名称'"
            prefix-icon="Search"
            clearable
            style="width: 220px"
          />
        </div>
      </div>

      <!-- 公共组件：显示分类Tab -->
      <template v-if="activeSource === 'public'">
        <el-tabs v-model="activeCategory" class="operation-tabs" @tab-click="handleTabClick">
          <el-tab-pane
            v-for="category in publicCategories"
            :key="category"
            :label="category"
            :name="category"
          />
        </el-tabs>

        <!-- 视图1：二级目录列表 -->
        <div v-if="!selectedSubcategory && subcategories.length > 0" class="subcategory-view">
          <div class="subcategory-cards">
            <div
              v-for="subcat in subcategories"
              :key="subcat"
              class="subcategory-card"
              @click="handleSubcategoryClick(subcat)"
            >
              <div class="subcat-icon">
                <el-icon><SetUp /></el-icon>
              </div>
              <div class="subcat-info">
                <div class="subcat-name">
                  {{ subcat }}
                </div>
                <div class="subcat-count">
                  {{ getOperationCount(subcat) }} 个操作
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视图2：操作列表（紧凑面包屑） -->
        <div v-else-if="selectedSubcategory" class="operation-view">
          <div class="breadcrumb-bar">
            <span class="breadcrumb-link" @click="handleBackToSubcategories">
              <el-icon><ArrowLeft /></el-icon>
              {{ activeCategory }}
            </span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">{{ selectedSubcategory }}</span>
            <!-- 筛选入口：面包屑行右侧（筛选条收纳方案） -->
            <FilterEntry />
          </div>

          <!-- 筛选面板：展开才渲染（公共组件仅操作分类，无自定义标签，设计 §4.2） -->
          <FilterBar v-if="filterExpanded" :show-custom-tags="false" />

          <div class="operation-cards-grid">
            <div
              v-for="operation in filteredOperations"
              :key="operation.id"
              class="operation-card"
              @click="handleOperationClick(operation)"
            >
              <div class="card-content">
                <div class="card-title-row">
                  <span class="card-title">{{ operation.name }}</span>
                  <el-icon
                    class="favorite-icon"
                    :class="{ active: operation.isFavorite }"
                    @click.stop="handleToggleFavorite(operation)"
                  >
                    <Star />
                  </el-icon>
                </div>
                <div class="card-tags">
                  <el-tag
                    v-for="(tag, index) in operation.tags"
                    :key="index"
                    size="small"
                    :type="getTagType(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="card-footer">
                  <span class="execute-count">执行次数: {{ operation.executeCount }}</span>
                  <el-icon class="info-icon">
                    <InfoFilled />
                  </el-icon>
                </div>
              </div>
            </div>
            <el-empty v-if="filteredOperations.length === 0" description="该分类下暂无操作" />
          </div>
        </div>
      </template>

      <!-- 我的收藏：显示收藏的操作 -->
      <template v-else-if="activeSource === 'favorite'">
        <div class="favorite-filter">
          <span class="filter-label">筛选：</span>
          <div class="filter-tags">
            <span
              class="filter-tag"
              :class="{ active: favoriteFilter === '' }"
              @click="favoriteFilter = ''"
            >全部</span>
            <span
              v-for="cat in favoriteCategories"
              :key="cat"
              class="filter-tag"
              :class="{ active: favoriteFilter === cat }"
              @click="favoriteFilter = cat"
            >{{ cat }}</span>
          </div>
          <!-- 筛选入口：一级分类筛选行右侧（筛选条收纳方案） -->
          <FilterEntry />
        </div>

        <!-- 第二行筛选面板：展开才渲染（收藏混合公共/定制，两维度均可用，设计 §4.3） -->
        <FilterBar v-if="filterExpanded" :show-custom-tags="true" />

        <div class="operation-cards-grid">
          <div
            v-for="operation in favoriteOperations"
            :key="operation.id"
            class="operation-card"
            @click="handleOperationClick(operation)"
          >
            <div class="card-content">
              <div class="card-title-row">
                <span class="card-title">{{ operation.name }}</span>
                <el-icon
                  class="favorite-icon active"
                  @click.stop="handleToggleFavorite(operation)"
                >
                  <Star />
                </el-icon>
              </div>
              <div class="card-tags">
                <el-tag size="small" type="info">
                  {{ operation.category }}
                </el-tag>
                <el-tag
                  v-for="(tag, index) in operation.tags"
                  :key="index"
                  size="small"
                  :type="getTagType(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="card-footer">
                <span class="execute-count">执行次数: {{ operation.executeCount }}</span>
                <el-icon class="info-icon">
                  <InfoFilled />
                </el-icon>
              </div>
            </div>
          </div>
          <el-empty v-if="favoriteOperations.length === 0" description="暂无收藏的操作" />
        </div>
      </template>

      <!-- 应用定制：显示应用系统分类 -->
      <template v-else-if="activeSource === 'custom'">
        <!-- Tab切换（与操作编排一致） -->
        <div class="custom-tab-bar">
          <div class="custom-tabs">
            <div
              class="custom-tab-item"
              :class="{ active: customActiveTab === 'formal' }"
              @click="customActiveTab = 'formal'"
            >
              正式操作
            </div>
            <div
              class="custom-tab-item"
              :class="{ active: customActiveTab === 'draft' }"
              @click="customActiveTab = 'draft'"
            >
              我的草稿
            </div>
          </div>
          <div class="custom-tab-actions">
            <ViewSwitcher v-model="customViewMode" />
            <!-- 筛选入口：视图切换器右侧、新增操作左侧（筛选条收纳方案） -->
            <FilterEntry v-if="customActiveTab === 'formal'" />
            <div class="custom-tab-btn" @click="handleAddCustomOp">
              <el-icon><Plus /></el-icon>
              <span>新增操作</span>
            </div>
            <div
              class="custom-tab-btn"
              :class="{ active: tagBatchMode }"
              @click="handleQuickModifyCustom"
            >
              <el-icon><Edit /></el-icon>
              <span>{{ tagBatchMode ? '退出批量模式' : '快速修改标签' }}</span>
            </div>
          </div>
        </div>

        <!-- 筛选面板：仅正式操作 tab + 展开时渲染（草稿 tab 无这两个维度，设计 §4.2） -->
        <FilterBar v-if="customActiveTab === 'formal' && filterExpanded" :show-custom-tags="true" />

        <!-- 批量加标签栏（快速修改标签模式，设计 §5.2） -->
        <div v-if="tagBatchMode && customActiveTab === 'formal'" class="tag-batch-bar">
          <div class="tag-batch-info">
            <span class="selected-count">已选择 {{ selectedOpIdsForTag.length }} 项</span>
            <span>批量添加标签</span>
          </div>
          <div class="tag-batch-actions">
            <el-select
              v-model="batchTagSelection"
              multiple
              clearable
              allow-create
              default-first-option
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
              placeholder="选择或新建标签"
              style="width: 260px"
              size="small"
            >
              <el-option
                v-for="tag in customTagOptions"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
            <el-button size="small" type="primary" @click="applyBatchTags">
              应用
            </el-button>
            <el-button size="small" @click="exitTagBatchMode">
              取消
            </el-button>
          </div>
        </div>

        <!-- 正式操作列表 -->
        <div v-if="customActiveTab === 'formal' && customViewMode === 'card'" class="operation-cards-grid">
          <div
            v-for="operation in customOperations"
            :key="operation.id"
            class="operation-card custom-card"
            :class="{ selected: tagBatchMode && selectedOpIdsForTag.includes(operation.id) }"
            @click="tagBatchMode ? toggleOpForTag(operation.id) : handleOperationClick(operation)"
          >
            <div class="card-content">
              <div class="card-title-row">
                <!-- 批量模式勾选框 -->
                <el-checkbox
                  v-if="tagBatchMode"
                  :model-value="selectedOpIdsForTag.includes(operation.id)"
                  class="tag-batch-checkbox"
                  @click.stop
                  @change="(val: boolean | string | number) => toggleOpForTag(operation.id, !!val)"
                />
                <!-- 版本徽章 -->
                <el-tag v-if="operation.versionNo" size="small" type="info" effect="plain" class="version-badge">
                  V{{ operation.versionNo }}
                </el-tag>
                <span class="card-title">{{ operation.name }}</span>
                <!-- 正在编辑：标题区文字链，点击 → viewDraft（卡片重构方案 §4） -->
                <span
                  v-if="hasEditingDraft(operation.id)"
                  class="editing-link"
                  title="点击查看草稿"
                  @click.stop="handleCustomCommand({ action: 'viewDraft' }, operation)"
                >
                  <el-icon><Edit /></el-icon>
                  <span>正在编辑</span>
                </span>
                <el-dropdown trigger="click" @command="(cmd) => onCustomCommand(cmd, operation)">
                  <el-icon class="more-icon" @click.stop>
                    <MoreFilled />
                  </el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ action: 'edit' }">
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item v-if="hasEditingDraft(operation.id)" :command="{ action: 'viewDraft' }">
                        查看草稿
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'versionHistory' }">
                        版本历史
                      </el-dropdown-item>
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
              <!-- 标签区：权限提示(实色) + 自定义标签(描边)；点击打开编辑标签 popover。「定制」徽标已移除（分区上下文已表达） -->
              <TagEditPopover
                :ref="setTagPopoverRef(operation.id)"
                :operation="operation"
                @confirm="updateCustomTags"
              >
                <div class="card-tags" @click.stop>
                  <!-- 权限提示：实色 tag -->
                  <el-tag
                    v-for="(tag, index) in operation.tags"
                    :key="`perm-${index}`"
                    size="small"
                    :type="getTagType(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                  <!-- 自定义标签：描边 plain tag（视觉与权限提示区分，设计 §6） -->
                  <el-tag
                    v-for="(tag, index) in (operation.customTags || [])"
                    :key="`custom-${index}`"
                    size="small"
                    effect="plain"
                    class="custom-tag-plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </TagEditPopover>
              <div class="card-footer">
                <span class="execute-count">执行次数: {{ operation.executeCount }}</span>
                <span class="update-time">更新: {{ operation.updateTime || '2024-01-15' }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="customOperations.length === 0" :description="customEmptyText" />
        </div>

        <!-- 正式操作表格视图 -->
        <CustomOpsTable v-else-if="customActiveTab === 'formal' && customViewMode === 'table'" />

        <!-- 草稿列表 -->
        <div v-else>
          <!-- 批量操作栏 -->
          <div v-if="selectedDraftIds.length > 0" class="batch-action-bar">
            <div class="batch-info">
              <el-checkbox
                :model-value="isAllSelected"
                label="全选"
                @change="toggleSelectAll"
              />
              <span class="selected-count">已选择 {{ selectedDraftIds.length }} 项</span>
            </div>
            <div class="batch-actions">
              <el-button type="primary" @click="handleBatchPublish">
                批量发布
              </el-button>
              <el-button type="danger" @click="handleBatchDelete">
                批量删除
              </el-button>
              <el-button @click="clearSelection">
                取消选择
              </el-button>
            </div>
          </div>

          <div v-if="customViewMode === 'card'" class="operation-cards-grid">
            <div
              v-for="draft in customDrafts"
              :key="draft.id"
              class="operation-card draft-card"
              :class="{ selected: selectedDraftIds.includes(draft.id) }"
            >
              <!-- 勾选框（仅草稿状态可勾选） -->
              <div v-if="draft.status === 'draft'" class="card-checkbox" @click.stop>
                <el-checkbox
                  v-model="selectedDraftIds"
                  :value="draft.id"
                  label=""
                />
              </div>

              <div class="card-content">
                <div class="card-title-row">
                  <span class="card-title">{{ draft.name }}</span>
                  <el-dropdown trigger="click" @command="(cmd) => handleDraftCommand(cmd, draft)">
                    <el-icon class="more-icon" @click.stop>
                      <MoreFilled />
                    </el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'publish' }">
                          发布
                        </el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'recall' }">
                          追回
                        </el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'draft' || draft.status === 'rejected'" :command="{ action: 'edit' }">
                          编辑
                        </el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'draft' || draft.status === 'rejected'" :command="{ action: 'delete' }">
                          删除
                        </el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'viewBatch' }">
                          查看发布状态
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="card-tags">
                  <el-tag size="small" :type="getDraftStatusType(draft.status)">
                    {{ getDraftStatusText(draft.status) }}
                  </el-tag>
                </div>
                <div class="card-footer">
                  <span class="update-time">保存于: {{ draft.saveTime }}</span>
                </div>
              </div>
            </div>
            <el-empty v-if="customDrafts.length === 0" description="暂无草稿" />
          </div>

          <!-- 草稿表格视图 -->
          <CustomDraftsTable v-else />
        </div>
      </template>
    </div>

    <!-- 操作编排区域 -->
    <div class="emergency-section">
      <div class="section-header">
        <div class="section-title">
          <div class="diamond-icon" />
          <span>操作编排</span>
        </div>
      </div>
      <div class="custom-tab-bar">
        <div class="custom-tabs">
          <div
            class="custom-tab-item"
            :class="{ active: activeScenarioTab === 'formal' }"
            @click="activeScenarioTab = 'formal'"
          >
            正式编排
          </div>
          <div
            class="custom-tab-item"
            :class="{ active: activeScenarioTab === 'draft' }"
            @click="activeScenarioTab = 'draft'"
          >
            我的草稿
          </div>
        </div>
        <div class="custom-tab-actions">
          <ViewSwitcher v-model="orchestrationViewMode" />
          <div class="custom-tab-btn" @click="handleAddScenario">
            <el-icon><Plus /></el-icon>
            <span>新增编排</span>
          </div>
          <div class="custom-tab-btn" @click="handleQuickModify">
            <el-icon><Edit /></el-icon>
            <span>快速修改标签</span>
          </div>
          <div class="custom-tab-btn" @click="handleFilterScenario">
            <el-icon><Filter /></el-icon>
            <span>筛选</span>
          </div>
        </div>
      </div>

      <!-- 正式编排视图 -->
      <div v-if="activeScenarioTab === 'formal' && orchestrationViewMode === 'card'" class="scenario-cards-grid">
        <div
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          class="scenario-card"
          @click="handleScenarioClick(scenario)"
        >
          <!-- 卡片头部 -->
          <div class="scenario-card-header">
            <div class="scenario-card-badges">
              <el-tag v-if="hasScenarioEditingDraft(scenario.id)" type="warning" size="small">
                正在编辑
              </el-tag>
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleScenarioCommand(cmd, scenario)">
              <el-icon class="more-icon">
                <MoreFilled />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ id: scenario.id, action: 'edit' }">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item v-if="hasScenarioEditingDraft(scenario.id)" :command="{ id: scenario.id, action: 'viewDraft' }">
                    查看草稿
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ id: scenario.id, action: 'delete' }">
                    删除
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ id: scenario.id, action: 'copy' }">
                    复制
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 流程图缩略图区域 -->
          <div class="scenario-flowchart">
            <div class="flowchart-nodes">
              <div class="flow-node start-node">
                开始
              </div>
              <div class="flow-connector" />
              <div class="flow-node process-node">
                执行脚本
              </div>
              <div class="flow-connector" />
              <div class="flow-node end-node">
                结束
              </div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="scenario-card-footer">
            <div class="scenario-tags">
              <el-tag size="small" type="success">
                仅生产
              </el-tag>
              <el-tag size="small" type="warning">
                应急
              </el-tag>
              <el-tag size="small">
                运维请求
              </el-tag>
            </div>
            <div class="scenario-title">
              {{ scenario.name }}
            </div>
            <div class="scenario-bottom-tags">
              <el-tag size="small" type="info">
                隔离
              </el-tag>
            </div>
          </div>
        </div>
        <el-empty v-if="filteredScenarios.length === 0" description="暂无编排" />
      </div>

      <!-- 正式编排表格视图 -->
      <ScenarioTable v-else-if="activeScenarioTab === 'formal' && orchestrationViewMode === 'table'" />

      <!-- 草稿视图 -->
      <div v-else>
        <!-- 批量操作栏 -->
        <div v-if="selectedScenarioDraftIds.length > 0" class="batch-action-bar">
          <div class="batch-info">
            <el-checkbox
              :model-value="isAllScenarioDraftsSelected"
              label="全选"
              @change="toggleSelectAllScenarioDrafts"
            />
            <span class="selected-count">已选择 {{ selectedScenarioDraftIds.length }} 项</span>
          </div>
          <div class="batch-actions">
            <el-button type="primary" @click="handleBatchScenarioPublish">
              批量发布
            </el-button>
            <el-button type="danger" @click="handleBatchScenarioDelete">
              批量删除
            </el-button>
            <el-button @click="clearScenarioSelection">
              取消选择
            </el-button>
          </div>
        </div>

        <div v-if="orchestrationViewMode === 'card'" class="scenario-cards-grid">
          <div
            v-for="draft in scenarioDrafts"
            :key="draft.id"
            class="scenario-card draft-card"
            :class="{ selected: selectedScenarioDraftIds.includes(draft.id) }"
          >
            <!-- 勾选框（仅草稿状态可勾选） -->
            <div v-if="draft.status === 'draft'" class="card-checkbox" @click.stop>
              <el-checkbox
                v-model="selectedScenarioDraftIds"
                :value="draft.id"
                label=""
              />
            </div>

            <!-- 卡片头部 -->
            <div class="scenario-card-header">
              <div class="scenario-card-badges">
                <el-tag :type="getScenarioDraftStatusType(draft.status)" size="small">
                  {{ getScenarioDraftStatusText(draft.status) }}
                </el-tag>
              </div>
              <el-dropdown trigger="click" @command="(cmd) => handleScenarioDraftCommand(cmd, draft)">
                <el-icon class="more-icon">
                  <MoreFilled />
                </el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'publish' }">
                      发布
                    </el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'recall' }">
                      追回
                    </el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'edit' }">
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'delete' }">
                      删除
                    </el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'viewBatch' }">
                      查看发布状态
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 流程图缩略图区域 -->
            <div class="scenario-flowchart">
              <div class="flowchart-nodes">
                <div class="flow-node start-node">
                  开始
                </div>
                <div class="flow-connector" />
                <div class="flow-node process-node">
                  执行脚本
                </div>
                <div class="flow-connector" />
                <div class="flow-node end-node">
                  结束
                </div>
              </div>
            </div>

            <!-- 卡片底部 -->
            <div class="scenario-card-footer">
              <div class="scenario-title">
                {{ draft.name }}
              </div>
              <div class="scenario-bottom-tags">
                <span class="update-time">保存于: {{ draft.saveTime }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="scenarioDrafts.length === 0" description="暂无草稿" />
        </div>

        <!-- 编排草稿表格视图 -->
        <ScenarioDraftsTable v-else />
      </div>
    </div>

    <!-- 两步式执行弹窗 -->
    <ExecutionDialog />

    <!-- 执行历史抽屉 + AI 诊断 -->
    <HistoryDrawer />

    <!-- 批量发布弹窗（组件草稿 + 编排草稿） -->
    <PublishDialogs />

    <!-- 应用定制组件入库弹窗（新增操作：定制模式 / 实例固化模式） -->
    <CustomComponentDialog />

    <!-- 版本历史抽屉 -->
    <VersionHistoryDrawer />

    <!-- 版本对比弹窗 -->
    <VersionDiffDialog />

    <!-- 基线冲突确认弹窗 -->
    <BaselineConflictDialog />
  </div>
</template>

<style lang="scss" scoped>
// 样式统一收口于 workbench.scss（组件提取后由页面与各子组件共同 @use）。
// 保留 @use 以注入 $uops-* / $font-size-* 等变量供本文件可能残留的样式使用。
@use '@/styles/uops-theme.scss' as *;
@use './workbench.scss' as *;
</style>
