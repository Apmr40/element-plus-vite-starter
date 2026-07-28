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
          <div class="diamond-icon"></div>
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
                <div class="subcat-name">{{ subcat }}</div>
                <div class="subcat-count">{{ getOperationCount(subcat) }} 个操作</div>
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
          </div>

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
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
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
        </div>
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
                <el-tag size="small" type="info">{{ operation.category }}</el-tag>
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
                <el-icon class="info-icon"><InfoFilled /></el-icon>
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
            >正式操作</div>
            <div 
              class="custom-tab-item" 
              :class="{ active: customActiveTab === 'draft' }"
              @click="customActiveTab = 'draft'"
            >我的草稿</div>
          </div>
          <div class="custom-tab-actions">
            <div class="custom-tab-btn" @click="handleAddCustomOp">
              <el-icon><Plus /></el-icon>
              <span>新增操作</span>
            </div>
            <div class="custom-tab-btn" @click="handleFilterCustom">
              <el-icon><Filter /></el-icon>
              <span>筛选</span>
            </div>
          </div>
        </div>
        
        <!-- 正式操作列表 -->
        <div v-if="customActiveTab === 'formal'" class="operation-cards-grid">
          <div
            v-for="operation in customOperations"
            :key="operation.id"
            class="operation-card custom-card"
            @click="handleOperationClick(operation)"
          >
            <div class="card-content">
              <div class="card-title-row">
                <!-- 正在编辑标记 -->
                <div v-if="hasEditingDraft(operation.id)" class="editing-badge">
                  <el-icon><Edit /></el-icon>
                  <span>正在编辑</span>
                </div>
                <span class="card-title">{{ operation.name }}</span>
                <el-dropdown trigger="click" @command="(cmd) => handleCustomCommand(cmd, operation)">
                  <el-icon class="more-icon" @click.stop><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ action: 'edit' }">编辑</el-dropdown-item>
                      <el-dropdown-item v-if="hasEditingDraft(operation.id)" :command="{ action: 'viewDraft' }">查看草稿</el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'delete' }">删除</el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'copy' }">复制</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="card-tags">
                <el-tag size="small" type="warning">定制</el-tag>
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
                <span class="update-time">更新: {{ operation.updateTime || '2024-01-15' }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="customOperations.length === 0" description="暂无定制操作" />
        </div>
        
        <!-- 草稿列表 -->
        <div v-else>
          <!-- 批量操作栏 -->
          <div v-if="selectedDraftIds.length > 0" class="batch-action-bar">
            <div class="batch-info">
              <el-checkbox 
                :model-value="isAllSelected" 
                @change="toggleSelectAll"
                label="全选"
              />
              <span class="selected-count">已选择 {{ selectedDraftIds.length }} 项</span>
            </div>
            <div class="batch-actions">
              <el-button type="primary" @click="handleBatchPublish">批量发布</el-button>
              <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
              <el-button @click="clearSelection">取消选择</el-button>
            </div>
          </div>

          <div class="operation-cards-grid">
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
                    <el-icon class="more-icon" @click.stop><MoreFilled /></el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'publish' }">发布</el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'recall' }">追回</el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'edit' }">编辑</el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'delete' }">删除</el-dropdown-item>
                        <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'viewBatch' }">查看发布状态</el-dropdown-item>
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
        </div>
      </template>
    </div>

    <!-- 操作编排区域 -->
    <div class="emergency-section">
      <div class="section-header">
        <div class="section-title">
          <div class="diamond-icon"></div>
          <span>操作编排</span>
        </div>
      </div>
      <div class="custom-tab-bar">
        <div class="custom-tabs">
          <div 
            class="custom-tab-item" 
            :class="{ active: activeScenarioTab === 'formal' }"
            @click="activeScenarioTab = 'formal'"
          >正式编排</div>
          <div 
            class="custom-tab-item" 
            :class="{ active: activeScenarioTab === 'draft' }"
            @click="activeScenarioTab = 'draft'"
          >我的草稿</div>
        </div>
        <div class="custom-tab-actions">
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
      <div v-if="activeScenarioTab === 'formal'" class="scenario-cards-grid">
        <div
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          class="scenario-card"
          @click="handleScenarioClick(scenario)"
        >
          <!-- 卡片头部 -->
          <div class="scenario-card-header">
            <div class="scenario-card-badges">
              <el-tag v-if="hasScenarioEditingDraft(scenario.id)" type="warning" size="small">正在编辑</el-tag>
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleScenarioCommand(cmd, scenario)">
              <el-icon class="more-icon"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ id: scenario.id, action: 'edit' }">编辑</el-dropdown-item>
                  <el-dropdown-item v-if="hasScenarioEditingDraft(scenario.id)" :command="{ id: scenario.id, action: 'viewDraft' }">查看草稿</el-dropdown-item>
                  <el-dropdown-item :command="{ id: scenario.id, action: 'delete' }">删除</el-dropdown-item>
                  <el-dropdown-item :command="{ id: scenario.id, action: 'copy' }">复制</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 流程图缩略图区域 -->
          <div class="scenario-flowchart">
            <div class="flowchart-nodes">
              <div class="flow-node start-node">开始</div>
              <div class="flow-connector"></div>
              <div class="flow-node process-node">执行脚本</div>
              <div class="flow-connector"></div>
              <div class="flow-node end-node">结束</div>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="scenario-card-footer">
            <div class="scenario-tags">
              <el-tag size="small" type="success">仅生产</el-tag>
              <el-tag size="small" type="warning">应急</el-tag>
              <el-tag size="small">运维请求</el-tag>
            </div>
            <div class="scenario-title">{{ scenario.name }}</div>
            <div class="scenario-bottom-tags">
              <el-tag size="small" type="info">隔离</el-tag>
            </div>
          </div>
        </div>
        <el-empty v-if="filteredScenarios.length === 0" description="暂无编排" />
      </div>

      <!-- 草稿视图 -->
      <div v-else>
        <!-- 批量操作栏 -->
        <div v-if="selectedScenarioDraftIds.length > 0" class="batch-action-bar">
          <div class="batch-info">
            <el-checkbox 
              :model-value="isAllScenarioDraftsSelected" 
              @change="toggleSelectAllScenarioDrafts"
              label="全选"
            />
            <span class="selected-count">已选择 {{ selectedScenarioDraftIds.length }} 项</span>
          </div>
          <div class="batch-actions">
            <el-button type="primary" @click="handleBatchScenarioPublish">批量发布</el-button>
            <el-button type="danger" @click="handleBatchScenarioDelete">批量删除</el-button>
            <el-button @click="clearScenarioSelection">取消选择</el-button>
          </div>
        </div>

        <div class="scenario-cards-grid">
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
                <el-icon class="more-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'publish' }">发布</el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'recall' }">追回</el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'edit' }">编辑</el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'draft'" :command="{ action: 'delete' }">删除</el-dropdown-item>
                    <el-dropdown-item v-if="draft.status === 'submitted'" :command="{ action: 'viewBatch' }">查看发布状态</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 流程图缩略图区域 -->
            <div class="scenario-flowchart">
              <div class="flowchart-nodes">
                <div class="flow-node start-node">开始</div>
                <div class="flow-connector"></div>
                <div class="flow-node process-node">执行脚本</div>
                <div class="flow-connector"></div>
                <div class="flow-node end-node">结束</div>
              </div>
            </div>

            <!-- 卡片底部 -->
            <div class="scenario-card-footer">
              <div class="scenario-title">{{ draft.name }}</div>
              <div class="scenario-bottom-tags">
                <span class="update-time">保存于: {{ draft.saveTime }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="scenarioDrafts.length === 0" description="暂无草稿" />
        </div>
      </div>
    </div>

    <!-- 两步式执行弹窗 -->
    <ExecutionDialog />

    <!-- 执行历史抽屉 + AI 诊断 -->
    <HistoryDrawer />

    <!-- 批量发布弹窗（组件草稿 + 编排草稿） -->
    <PublishDialogs />
  </div>
</template>

<script setup lang="ts">
import {
  SetUp,
  Star,
  Clock,
  InfoFilled,
  MoreFilled,
  ArrowLeft,
  Edit,
  Plus,
  Filter
} from '@element-plus/icons-vue'
import { useWorkbench } from './composables/useWorkbench'
import RecentExecutionsBar from '~/demo/components/workbench/RecentExecutionsBar.vue'
import ExecutionDialog from '~/demo/components/workbench/ExecutionDialog.vue'
import HistoryDrawer from '~/demo/components/workbench/HistoryDrawer.vue'
import PublishDialogs from '~/demo/components/workbench/PublishDialogs.vue'

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
  handleFilterCustom,
  handleDraftCommand,
  getDraftStatusType,
  getDraftStatusText,
  toggleSelectAll,
  handleBatchPublish,
  handleBatchDelete,
  clearSelection,
  // ===== 操作编排 =====
  activeScenarioTab,
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
  clearScenarioSelection
} = useWorkbench()
</script>

<style lang="scss" scoped>
// 样式统一收口于 workbench.scss（组件提取后由页面与各子组件共同 @use）。
// 保留 @use 以注入 $uops-* / $font-size-* 等变量供本文件可能残留的样式使用。
@use '@/styles/uops-theme.scss' as *;
@use './workbench.scss' as *;
</style>
