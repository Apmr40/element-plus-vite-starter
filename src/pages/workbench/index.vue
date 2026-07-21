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
    <div v-if="recentExecutions.length > 0 || recentOrchestrationExecutions.length > 0" class="recent-executions-bar">
      <div class="recent-executions-content">
        <span class="recent-label">最近执行：</span>
        <div class="recent-list">
          <!-- 操作组件执行记录 -->
          <div
            v-for="execution in recentExecutions"
            :key="`component-${execution.id}`"
            class="recent-item"
            :class="`status-${execution.status}`"
            @click="handleRecentExecutionClick(execution)"
          >
            <el-icon class="status-icon" :class="`status-${execution.status}`">
              <component :is="getRecentStatusIcon(execution.status)" />
            </el-icon>
            <span class="recent-name">{{ execution.name }}</span>
            <el-tag :type="getRecentStatusType(execution.status)" size="small" effect="light">
              {{ getRecentStatusText(execution) }}
            </el-tag>
            <span class="source-tag component-tag">组件</span>
            <el-icon class="close-icon" @click.stop="dismissRecentExecution(execution.id)">
              <Close />
            </el-icon>
          </div>
          <!-- 编排执行记录 -->
          <div
            v-for="execution in recentOrchestrationExecutions"
            :key="`orchestration-${execution.id}`"
            class="recent-item"
            :class="`status-${execution.status}`"
            @click="handleOpenOrchestrationHistoryDrawer"
          >
            <el-icon class="status-icon" :class="`status-${execution.status}`">
              <component :is="getRecentStatusIcon(execution.status)" />
            </el-icon>
            <span class="recent-name">{{ execution.name }}</span>
            <el-tag :type="getOrchestrationStatusType(execution.status)" size="small" effect="light">
              {{ getOrchestrationStatusText(execution) }}
            </el-tag>
            <span class="source-tag orchestration-tag">编排</span>
            <el-icon class="close-icon" @click.stop="dismissRecentOrchestrationExecution(execution.id)">
              <Close />
            </el-icon>
          </div>
        </div>
      </div>
    </div>

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
    <el-dialog
      v-model="showParamDialog"
      :title="`执行操作 - ${currentOperation?.name || ''}`"
      width="900px"
      :close-on-click-modal="false"
      class="execute-dialog"
      @close="handleCloseExecutionDialog"
    >
      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <div class="step-item" :class="{ active: executionStep === 1, completed: executionStep === 2 }">
          <div class="step-circle">
            <el-icon v-if="executionStep === 2"><Check /></el-icon>
            <span v-else>1</span>
          </div>
          <span class="step-label">参数配置</span>
        </div>
        <div class="step-line" :class="{ active: executionStep === 2 }"></div>
        <div class="step-item" :class="{ active: executionStep === 2 }">
          <div class="step-circle">
            <span>2</span>
          </div>
          <span class="step-label">执行结果</span>
        </div>
      </div>

      <!-- 步骤1: 参数配置 -->
      <div v-if="executionStep === 1" class="step-content">
        <!-- 区域1: 操作介绍 -->
        <div class="execute-section">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">操作介绍</span>
          </div>
          <div class="operation-intro">
            <div class="intro-row">
              <span class="intro-label">操作名称：</span>
              <span class="intro-value">{{ currentOperation?.name }}</span>
            </div>
            <div class="intro-row">
              <span class="intro-label">操作描述：</span>
              <span class="intro-value">{{ currentOperation?.description }}</span>
            </div>
            <div class="intro-row">
              <span class="intro-label">风险等级：</span>
              <el-tag :type="currentOperation?.riskLevel === 'high' ? 'danger' : currentOperation?.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
                {{ currentOperation?.riskLevel === 'high' ? '高风险' : currentOperation?.riskLevel === 'medium' ? '中风险' : '低风险' }}
              </el-tag>
            </div>
            <div class="intro-row">
              <span class="intro-label">标签：</span>
              <el-tag v-for="tag in currentOperation?.tags" :key="tag" size="small" class="intro-tag">{{ tag }}</el-tag>
            </div>
          </div>
        </div>

        <!-- 区域2: 参数填写 -->
        <div class="execute-section">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">参数填写</span>
          </div>
          <el-form
            ref="paramFormRef"
            :model="paramForm"
            :rules="paramFormRules"
            label-width="100px"
            class="param-form"
          >
            <el-row :gutter="20">
              <el-col :span="12" v-for="field in currentParamConfig" :key="field.field">
                <el-form-item :label="field.label" :prop="field.field">
                  <el-input
                    v-if="field.type === 'input'"
                    v-model="paramForm[field.field]"
                    :placeholder="field.placeholder"
                  />
                  <el-input
                    v-else-if="field.type === 'textarea'"
                    v-model="paramForm[field.field]"
                    type="textarea"
                    :rows="3"
                    :placeholder="field.placeholder"
                  />
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="paramForm[field.field]"
                    :placeholder="field.placeholder || '请选择'"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 区域3: 资源选择 -->
        <div class="execute-section">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">资源选择</span>
          </div>
          <div class="resource-selection">
            <div class="cascade-selectors">
              <div class="selector-row">
                <div class="selector-item">
                  <span class="selector-label required">Datacenter:</span>
                  <el-select v-model="resourceForm.datacenter" placeholder="请选择" @change="handleDatacenterChange">
                    <el-option v-for="item in datacenterOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
                <div class="selector-item">
                  <span class="selector-label required">Cluster:</span>
                  <el-select v-model="resourceForm.cluster" placeholder="请选择" @change="handleClusterChange">
                    <el-option v-for="item in clusterOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
                <div class="selector-item">
                  <span class="selector-label required">Namespace:</span>
                  <el-select v-model="resourceForm.namespace" placeholder="请选择" @change="handleNamespaceChange">
                    <el-option v-for="item in namespaceOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
              </div>
              <div class="selector-row">
                <div class="selector-item">
                  <span class="selector-label required">Deployment:</span>
                  <el-select v-model="resourceForm.deployment" placeholder="请选择" @change="handleDeploymentChange">
                    <el-option v-for="item in deploymentOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>
              </div>
            </div>
            <div class="resource-search">
              <el-input
                v-model="resourceSearchKeyword"
                placeholder="请输入资源筛选关键字"
                suffix-icon="Search"
                clearable
                style="width: 280px"
              />
            </div>
            <el-table
              :data="filteredResources"
              border
              style="width: 100%; margin-top: 12px"
              max-height="200"
            >
              <el-table-column type="selection" width="45" />
              <el-table-column prop="name" label="POD名称" sortable />
              <el-table-column prop="ip" label="IP" sortable />
              <el-table-column prop="status" label="状态" sortable>
                <template #default="{ row }">
                  <el-tag :type="row.status === 'Running' ? 'success' : 'danger'" size="small">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <!-- 步骤2: 执行结果 -->
      <div v-if="executionStep === 2 && currentExecution" class="step-content">
        <!-- 执行概要 -->
        <div class="execute-section">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">执行概要</span>
          </div>
          <div class="execution-summary">
            <div class="summary-row">
              <span class="summary-label">操作名称：</span>
              <span class="summary-value">{{ currentExecution.serviceCnName }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">执行时间：</span>
              <span class="summary-value">{{ currentExecution.implementTime }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">执行状态：</span>
              <el-tag :type="getExecutionResultStatusType(currentExecution.execStatus)" size="small">
                {{ getExecutionResultStatusText(currentExecution.execStatus) }}
                ({{ currentExecution.successCount }}/{{ currentExecution.totalCount }})
              </el-tag>
            </div>
            <div class="summary-row" v-if="currentExecution.endTime">
              <span class="summary-label">总耗时：</span>
              <span class="summary-value">{{ calcExecutionDuration(currentExecution.startTime, currentExecution.endTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="execute-section">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">执行进度</span>
          </div>
          <div class="execution-progress">
            <el-progress
              :percentage="Math.round((currentExecution.successCount / currentExecution.totalCount) * 100)"
              :status="currentExecution.execStatus === 'S' ? 'success' : currentExecution.execStatus === 'F' ? 'exception' : undefined"
              :stroke-width="16"
            />
          </div>
        </div>

        <!-- 资源明细 -->
        <div class="execute-section">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">资源明细</span>
          </div>
          <el-table :data="currentExecution.details" border style="width: 100%">
            <el-table-column prop="pkDisplay" label="资源标识" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getDetailStatusType(row.execStatus)" size="small">
                  <el-icon v-if="row.execStatus === 'P'" class="is-loading"><Loading /></el-icon>
                  <el-icon v-else-if="row.execStatus === 'S'"><CircleCheck /></el-icon>
                  <el-icon v-else-if="row.execStatus === 'F'"><CircleClose /></el-icon>
                  <span>{{ getDetailStatusText(row.execStatus) }}</span>
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="耗时" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.startTime && row.endTime">
                  {{ calcExecutionDuration(row.startTime, row.endTime) }}
                </span>
                <span v-else-if="row.execStatus === 'P'" class="running-text">执行中...</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
                <el-button 
                  v-if="row.execStatus === 'F'" 
                  type="warning" 
                  link 
                  size="small" 
                  @click="handleRetrySingleResource(row)"
                >
                  重试
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 错误信息 -->
        <div class="execute-section" v-if="currentExecution.details.some(d => d.execStatus === 'F' && d.errorMsg)">
          <div class="section-title-bar">
            <div class="title-indicator"></div>
            <span class="title-text">错误信息</span>
          </div>
          <div class="error-info">
            <div v-for="detail in currentExecution.details.filter(d => d.execStatus === 'F' && d.errorMsg)" :key="detail.serviceSeqId" class="error-item">
              <el-icon class="error-icon"><CircleClose /></el-icon>
              <span class="error-resource">{{ detail.pkDisplay }}：</span>
              <span class="error-msg">{{ detail.errorMsg }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <template v-if="executionStep === 1">
            <el-button @click="handleCloseExecutionDialog">取消</el-button>
            <el-button type="primary" @click="handleSubmitExecution" :loading="executing">
              提交执行
            </el-button>
          </template>
          <template v-else>
            <el-button @click="handleBackToParamConfig">返回</el-button>
            <el-button @click="handleRetryExecution">重新执行</el-button>
            <el-button @click="handleViewHistory">查看历史</el-button>
            <el-button @click="handleCloseExecutionDialog">关闭</el-button>
          </template>
        </div>
      </template>
    </el-dialog>

    <!-- 执行历史抽屉 -->
    <el-drawer
      v-model="showHistoryDrawer"
      title="执行历史"
      size="720px"
      direction="rtl"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">执行历史</span>
          <div class="drawer-actions">
            <el-button size="small" @click="historyDrawerActiveTab === 'component' ? handleBatchRetryFailed() : handleBatchRetryOrchestrationFailed()">
              <el-icon><Refresh /></el-icon>
              批量重试失败
            </el-button>
            <el-button size="small" @click="historyDrawerActiveTab === 'component' ? handleExportHistory() : handleExportOrchestrationHistory()">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button size="small" @click="handleRefreshHistory">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="history-drawer-content">
        <!-- Tab 切换 -->
        <div class="history-tabs">
          <div 
            class="history-tab" 
            :class="{ active: historyDrawerActiveTab === 'component' }"
            @click="historyDrawerActiveTab = 'component'"
          >
            操作组件
          </div>
          <div 
            class="history-tab" 
            :class="{ active: historyDrawerActiveTab === 'orchestration' }"
            @click="historyDrawerActiveTab = 'orchestration'"
          >
            操作编排
          </div>
        </div>

        <!-- 操作组件历史记录 -->
        <div v-if="historyDrawerActiveTab === 'component'" class="history-content">
          <!-- 筛选区域 -->
          <div class="history-filters">
            <el-select v-model="historyDrawerFilter.timeRange" placeholder="时间范围" size="small">
              <el-option label="今日" value="today" />
              <el-option label="近7天" value="7days" />
              <el-option label="近30天" value="30days" />
              <el-option label="全部" value="all" />
            </el-select>
            <el-select v-model="historyDrawerFilter.status" placeholder="全部状态" clearable size="small">
              <el-option label="执行中" value="running" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
            </el-select>
            <el-input
              v-model="historyDrawerFilter.keyword"
              placeholder="搜索操作名称..."
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>

          <!-- 历史记录列表 -->
          <div class="history-list">
            <div
              v-for="record in filteredHistoryDrawerList"
              :key="record.id"
              class="history-record-card"
            >
              <!-- 记录头部 -->
              <div class="record-header" @click="toggleHistoryExpand(record.id)">
                <div class="record-main">
                  <div class="record-title">
                    <span class="record-name">{{ record.name }}</span>
                    <el-tag 
                      :type="getHistoryStatusType(record.status)" 
                      size="small"
                      effect="light"
                    >
                      {{ getHistoryStatusText(record) }}
                    </el-tag>
                  </div>
                  <div class="record-meta">
                    <span class="meta-time">{{ formatHistoryTime(record.executeTime) }}</span>
                    <span class="meta-resources">{{ record.totalCount }}个资源</span>
                    <span v-if="record.duration" class="meta-duration">
                      耗时: {{ record.duration.toFixed(1) }}s
                    </span>
                  </div>
                </div>
                <el-icon class="expand-icon" :class="{ expanded: expandedHistoryIds.includes(record.id) }">
                  <ArrowDown />
                </el-icon>
              </div>

              <!-- 进度条（执行中时显示） -->
              <div v-if="record.status === 'running'" class="record-progress">
                <el-progress 
                  :percentage="Math.round((record.successCount / record.totalCount) * 100)" 
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">
                  {{ record.successCount }}/{{ record.totalCount }}
                </span>
              </div>

              <!-- 错误信息（失败时显示） -->
              <div v-if="record.status === 'failed' && getFirstError(record)" class="record-error">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ getFirstError(record) }}</span>
              </div>

              <!-- 展开的明细 -->
              <div v-if="expandedHistoryIds.includes(record.id)" class="record-details">
                <div class="details-header">
                  <span>资源明细</span>
                  <el-button size="small" type="primary" link @click="handleRetryFromHistory(record)">
                    <el-icon><RefreshRight /></el-icon>
                    重新执行
                  </el-button>
                </div>
                <div class="details-list">
                  <div
                    v-for="detail in record.details"
                    :key="detail.serviceSeqId"
                    class="detail-item"
                  >
                    <div class="detail-main" @click="handleViewResourceDetail(detail)">
                      <el-icon class="detail-status-icon" :class="getDetailStatusClass(detail.execStatus)">
                        <component :is="getDetailStatusIcon(detail.execStatus)" />
                      </el-icon>
                      <div class="detail-info">
                        <span class="detail-pk">{{ detail.pkDisplay }}</span>
                        <span v-if="detail.pkValue !== detail.pkDisplay" class="detail-ip">{{ detail.pkValue }}</span>
                      </div>
                      <el-tag 
                        :type="getDetailStatusType(detail.execStatus)" 
                        size="small"
                        effect="light"
                      >
                        {{ getDetailStatusText(detail.execStatus) }}
                      </el-tag>
                    </div>
                    <div v-if="detail.errorMsg" class="detail-error">
                      {{ detail.errorMsg }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <el-empty v-if="filteredHistoryDrawerList.length === 0" description="暂无执行记录" />
          </div>
        </div>

        <!-- 操作编排历史记录 -->
        <div v-if="historyDrawerActiveTab === 'orchestration'" class="history-content">
          <!-- 筛选区域 -->
          <div class="history-filters">
            <el-select v-model="orchestrationHistoryDrawerFilter.timeRange" placeholder="时间范围" size="small">
              <el-option label="今日" value="today" />
              <el-option label="近7天" value="7days" />
              <el-option label="近30天" value="30days" />
              <el-option label="全部" value="all" />
            </el-select>
            <el-select v-model="orchestrationHistoryDrawerFilter.status" placeholder="全部状态" clearable size="small">
              <el-option label="执行中" value="running" />
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="初始化" value="pending" />
              <el-option label="执行终止" value="terminated" />
            </el-select>
            <el-input
              v-model="orchestrationHistoryDrawerFilter.keyword"
              placeholder="搜索编排名称..."
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>

          <!-- 历史记录列表 -->
          <div class="history-list">
            <div
              v-for="record in filteredOrchestrationHistoryDrawerList"
              :key="record.id"
              class="history-record-card"
            >
              <!-- 记录头部 -->
              <div class="record-header" @click="toggleOrchestrationHistoryExpand(record.id)">
                <div class="record-main">
                  <div class="record-title">
                    <span class="record-name">{{ record.name }}</span>
                    <el-tag 
                      :type="getOrchestrationStatusType(record.status)" 
                      size="small"
                      effect="light"
                    >
                      {{ getOrchestrationStatusText(record) }}
                    </el-tag>
                  </div>
                  <div class="record-meta">
                    <span class="meta-time">{{ formatOrchestrationHistoryTime(record.executeTime) }}</span>
                    <span class="meta-resources">{{ record.totalJobCount }}个作业</span>
                    <span class="meta-submitter">提交人: {{ record.submitter }}</span>
                  </div>
                </div>
                <el-icon class="expand-icon" :class="{ expanded: expandedOrchestrationHistoryIds.includes(record.id) }">
                  <ArrowDown />
                </el-icon>
              </div>

              <!-- 错误信息（失败时显示） -->
              <div v-if="record.status === 'failed' && getOrchestrationFirstError(record)" class="record-error">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ getOrchestrationFirstError(record) }}</span>
              </div>

              <!-- 展开的明细 -->
              <div v-if="expandedOrchestrationHistoryIds.includes(record.id)" class="record-details">
                <div class="details-header">
                  <span>作业明细</span>
                  <el-button size="small" type="primary" link @click="handleOrchestrationRetry(record)">
                    <el-icon><RefreshRight /></el-icon>
                    重新执行
                  </el-button>
                </div>
                <div class="details-list">
                  <div
                    v-for="(job, index) in record.jobs"
                    :key="index"
                    class="detail-item orchestration-detail"
                  >
                    <div class="detail-main" @click="handleOrchestrationViewDetail(job)">
                      <div class="detail-info">
                        <span class="detail-pk">{{ job.jobName }}</span>
                        <span class="detail-channel">渠道: {{ job.channel }}</span>
                      </div>
                      <el-tag 
                        :type="getOrchestrationStatusType(job.status)" 
                        size="small"
                        effect="light"
                      >
                        {{ job.status === 'success' ? '成功' : job.status === 'failed' ? '失败' : job.status === 'running' ? '执行中' : job.status === 'pending' ? '初始化' : '执行终止' }}
                      </el-tag>
                    </div>
                    <div class="detail-meta-row">
                      <span class="detail-time">开始: {{ job.startTime }}</span>
                      <span class="detail-submitter">提交人: {{ job.submitter }}</span>
                      <span v-if="job.reviewer" class="detail-reviewer">复核人: {{ job.reviewer }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <el-empty v-if="filteredOrchestrationHistoryDrawerList.length === 0" description="暂无执行记录" />
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 批量发布弹窗 -->
    <el-dialog 
      v-model="showPublishDialog" 
      title="批量发布确认" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="publish-dialog-content">
        <div class="publish-info">
          <h4>本次发布包含以下草稿：</h4>
          <div class="draft-list">
            <div v-for="id in selectedDraftIds" :key="id" class="draft-item">
              <el-icon><Document /></el-icon>
              <span>{{ getDraftNameById(id) }}</span>
            </div>
          </div>
        </div>
        
        <el-form :model="publishForm" label-width="100px" class="publish-form">
          <el-form-item label="批次名称">
            <el-input 
              v-model="publishForm.name" 
              placeholder="请输入批次名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="发布说明">
            <el-input 
              v-model="publishForm.description" 
              type="textarea"
              :rows="3"
              placeholder="请输入发布说明"
            />
          </el-form-item>
        </el-form>

        <div class="workflow-info">
          <h4>审核流程：</h4>
          <div class="workflow-steps">
            <div class="step-item">
              <div class="step-icon">1</div>
              <span>一线主管</span>
            </div>
            <div class="step-arrow">→</div>
            <div class="step-item">
              <div class="step-icon">2</div>
              <span>二线主管</span>
            </div>
            <div class="step-arrow">→</div>
            <div class="step-item">
              <div class="step-icon">3</div>
              <span>运维经理</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPublish">提交审核</el-button>
      </template>
    </el-dialog>

    <!-- 编排批量发布弹窗 -->
    <el-dialog 
      v-model="showScenarioPublishDialog" 
      title="编排批量发布确认" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="publish-dialog-content">
        <div class="publish-info">
          <h4>本次发布包含以下编排草稿：</h4>
          <div class="draft-list">
            <div v-for="id in selectedScenarioDraftIds" :key="id" class="draft-item">
              <el-icon><Document /></el-icon>
              <span>{{ getScenarioDraftNameById(id) }}</span>
            </div>
          </div>
        </div>
        
        <el-form :model="scenarioPublishForm" label-width="100px" class="publish-form">
          <el-form-item label="批次名称">
            <el-input 
              v-model="scenarioPublishForm.name" 
              placeholder="请输入批次名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="发布说明">
            <el-input 
              v-model="scenarioPublishForm.description" 
              type="textarea"
              :rows="3"
              placeholder="请输入发布说明"
            />
          </el-form-item>
        </el-form>

        <div class="workflow-info">
          <h4>审核流程：</h4>
          <div class="workflow-steps">
            <div class="step-item">
              <div class="step-icon">1</div>
              <span>一线主管</span>
            </div>
            <div class="step-arrow">→</div>
            <div class="step-item">
              <div class="step-icon">2</div>
              <span>二线主管</span>
            </div>
            <div class="step-arrow">→</div>
            <div class="step-item">
              <div class="step-icon">3</div>
              <span>运维经理</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showScenarioPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="submitScenarioPublish">提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import {
  SetUp,
  Star,
  Search,
  Clock,
  TrendCharts,
  InfoFilled,
  WarningFilled,
  MoreFilled,
  ArrowDown,
  ArrowLeft,
  Link,
  Edit,
  Delete,
  Document,
  Plus,
  Filter,
  Check,
  Loading,
  CircleCheck,
  CircleClose,
  Refresh,
  CircleCheckFilled,
  CircleCloseFilled,
  Close,
  Download
} from '@element-plus/icons-vue'
import { useWorkbench } from './composables/useWorkbench'
import {
  getModules,
  getOperations,
  getExecutionHistory,
  executeOperation,
  toggleFavorite,
  saveParamTemplate
} from '~/demo/api/workbench'

// 使用 composable
const {
  modules,
  selectedModuleId,
  operations,
  activeCategory,
  selectedSubcategory,
  operationSearch,
  activeSource,
  favoriteFilter,
  customFilter,
  customActiveTab,
  customDrafts,
  selectedDraftIds,
  isAllSelected,
  showPublishDialog,
  publishForm,
  publishBatches,
  publicCategories,
  customApps,
  scenarios,
  activeScenarioTab,
  scenarioSearch,
  scenarioDrafts,
  selectedScenarioDraftIds,
  isAllScenarioDraftsSelected,
  showScenarioPublishDialog,
  scenarioPublishForm,
  scenarioPublishBatches,
  executionHistory,
  showExecutionHistory,
  historyFilter,
  showParamDialog,
  paramDialogTitle,
  currentParamConfig,
  currentExecuteId,
  currentOperation,
  paramForm,
  paramFormRules,
  paramFormRef,
  executing,
  templateName,
  executionStep,
  currentExecution,
  handleSubmitExecution,
  handleRetryExecution,
  handleCloseExecutionDialog,
  resourceForm,
  resourceSearchKeyword,
  datacenterOptions,
  clusterOptions,
  namespaceOptions,
  deploymentOptions,
  resourceList,
  categories,
  subcategories,
  filteredOperations,
  favoriteCategories,
  favoriteOperations,
  customOperations,
  filteredScenarios,
  filteredHistory,
  filteredResources,
  hasEditingDraft,
  getEditingDraft,
  hasScenarioEditingDraft,
  getScenarioEditingDraft,
  getScenarioDraftStatusType,
  getScenarioDraftStatusText,
  getTagType,
  getExecutionStatusType,
  getExecutionStatusText,
  getDraftStatusType,
  getDraftStatusText,
  getOperationCount,
  getDraftNameById,
  getScenarioDraftNameById,
  handleSourceChange,
  handleAddCustomOp,
  handleQuickModifyCustom,
  handleFilterCustom,
  handleEditCustomOp,
  handleViewDraft,
  handleCopyCustomOp,
  handleCustomCommand,
  handleDeleteCustomOp,
  handlePublishDraft,
  handleDeleteDraft,
  toggleSelectAll,
  clearSelection,
  handleBatchPublish,
  handleBatchDelete,
  submitPublish,
  handleDatacenterChange,
  handleClusterChange,
  handleNamespaceChange,
  handleDeploymentChange,
  handleSubcategoryClick,
  handleOperationClick,
  handleScenarioClick,
  handleScenarioCommand,
  handleScenarioDraftCommand,
  handleDraftCommand,
  handleToggleFavorite,
  // 执行结果辅助函数
  getExecutionResultStatusType,
  getExecutionResultStatusText,
  getDetailStatusType,
  getDetailStatusText,
  calcExecutionDuration,
  handleViewDetail,
  handleRetrySingleResource,
  handleBackToParamConfig,
  // 执行历史抽屉
  showHistoryDrawer,
  historyDrawerList,
  historyDrawerFilter,
  expandedHistoryIds,
  expandedDetailIds,
  recentExecutions,
  filteredHistoryDrawerList,
  handleOpenHistoryDrawer,
  handleCloseHistoryDrawer,
  toggleHistoryExpand,
  toggleDetailExpand,
  handleViewHistory,
  handleRefreshHistory,
  handleRetryFromHistory,
  handleViewResourceDetail,
  getHistoryStatusType,
  getHistoryStatusText,
  formatHistoryTime,
  getFirstError,
  getDetailStatusClass,
  getDetailStatusIcon,
  // 最近执行状态栏
  getRecentStatusIcon,
  getRecentStatusType,
  getRecentStatusText,
  handleRecentExecutionClick,
  dismissRecentExecution,
  dismissRecentOrchestrationExecution,
  // 导出和批量操作
  handleExportHistory,
  handleBatchRetryFailed,
  // 编排执行历史
  orchestrationHistory,
  showOrchestrationHistoryDrawer,
  orchestrationHistoryDrawerList,
  orchestrationHistoryDrawerFilter,
  expandedOrchestrationHistoryIds,
  historyDrawerActiveTab,
  recentOrchestrationExecutions,
  filteredOrchestrationHistoryDrawerList,
  handleOpenOrchestrationHistoryDrawer,
  handleCloseOrchestrationHistoryDrawer,
  toggleOrchestrationHistoryExpand,
  handleOrchestrationRetry,
  handleOrchestrationViewDetail,
  getOrchestrationStatusType,
  getOrchestrationStatusText,
  formatOrchestrationHistoryTime,
  getOrchestrationFirstError,
  handleExportOrchestrationHistory,
  handleBatchRetryOrchestrationFailed
} = useWorkbench()

// 生命周期
onMounted(async () => {
  // 加载模块列表
  modules.value = await getModules()
  if (modules.value.length > 0) {
    selectedModuleId.value = modules.value[0].id
  }
  
  // 加载操作列表
  operations.value = await getOperations(selectedModuleId.value)
  
  // 加载执行历史
  executionHistory.value = await getExecutionHistory()
  
  // 添加模拟数据用于展示
  const now = new Date()
  const mockRecentExecutions = [
    {
      id: 'mock-1',
      operateId: 'mock-1',
      name: '集群状态检查',
      status: 'running' as const,
      executeTime: now.toISOString(),
      totalCount: 5,
      successCount: 3,
      duration: 0,
      details: []
    },
    {
      id: 'mock-2',
      operateId: 'mock-2',
      name: '服务重启',
      status: 'success' as const,
      executeTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      totalCount: 3,
      successCount: 3,
      duration: 12.5,
      details: []
    },
    {
      id: 'mock-3',
      operateId: 'mock-3',
      name: '日志清理',
      status: 'failed' as const,
      executeTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      totalCount: 4,
      successCount: 2,
      duration: 8.3,
      details: []
    },
    {
      id: 'mock-4',
      operateId: 'mock-4',
      name: '配置更新',
      status: 'success' as const,
      executeTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      totalCount: 2,
      successCount: 2,
      duration: 5.2,
      details: []
    },
    {
      id: 'mock-5',
      operateId: 'mock-5',
      name: '节点扩容',
      status: 'running' as const,
      executeTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      totalCount: 6,
      successCount: 4,
      duration: 0,
      details: []
    }
  ]
  
  // 设置最近执行（状态栏显示）
  recentExecutions.value = mockRecentExecutions
  
  // 添加编排执行历史模拟数据
  const mockOrchestrationHistory = [
    {
      id: 'orch-1',
      orchestrationId: 'orch-1',
      name: '日常巡检编排',
      appSystem: '一体化生产运维平台',
      submitter: 'heshihui',
      totalJobCount: 3,
      status: 'success' as const,
      executeTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      jobs: [
        { jobName: '作业链1', channel: '操作中心', status: 'success' as const, startTime: '2026/07/21 14:30:00', submitter: 'heshihui', reviewer: 'corgi' },
        { jobName: '作业链2', channel: '操作中心', status: 'success' as const, startTime: '2026/07/21 14:31:00', submitter: 'heshihui', reviewer: 'corgi' },
        { jobName: '作业链3', channel: '操作中心', status: 'success' as const, startTime: '2026/07/21 14:32:00', submitter: 'heshihui', reviewer: 'corgi' }
      ]
    },
    {
      id: 'orch-2',
      orchestrationId: 'orch-2',
      name: '应急恢复流程',
      appSystem: '一体化生产运维平台',
      submitter: 'libinyfzx',
      totalJobCount: 2,
      status: 'failed' as const,
      executeTime: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      jobs: [
        { jobName: '作业链1', channel: '操作中心', status: 'success' as const, startTime: '2026/07/21 14:15:00', submitter: 'libinyfzx', reviewer: 'ADP' },
        { jobName: '作业链2', channel: '操作中心', status: 'failed' as const, startTime: '2026/07/21 14:16:00', submitter: 'libinyfzx', reviewer: 'ADP' }
      ]
    },
    {
      id: 'orch-3',
      orchestrationId: 'orch-3',
      name: '故障切换测试',
      appSystem: '一体化生产运维平台',
      submitter: 'tangjinyu',
      totalJobCount: 4,
      status: 'running' as const,
      executeTime: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
      jobs: [
        { jobName: '作业链1', channel: '操作中心', status: 'success' as const, startTime: '2026/07/21 14:00:00', submitter: 'tangjinyu', reviewer: '' },
        { jobName: '作业链2', channel: '操作中心', status: 'success' as const, startTime: '2026/07/21 14:01:00', submitter: 'tangjinyu', reviewer: '' },
        { jobName: '作业链3', channel: '操作中心', status: 'running' as const, startTime: '2026/07/21 14:02:00', submitter: 'tangjinyu', reviewer: '' },
        { jobName: '作业链4', channel: '操作中心', status: 'pending' as const, startTime: '', submitter: 'tangjinyu', reviewer: '' }
      ]
    }
  ]
  
  // 设置编排执行历史
  orchestrationHistoryDrawerList.value = mockOrchestrationHistory
  recentOrchestrationExecutions.value = mockOrchestrationHistory.slice(0, 2)
  
  // 添加更多模拟数据到执行历史抽屉
  const mockHistoryData = [
    {
      id: 'mock-1',
      name: '集群状态检查',
      executeTime: now.toISOString(),
      status: 'running' as const,
      totalCount: 5,
      successCount: 3,
      duration: 0,
      details: [
        { serviceSeqId: '1', pkDisplay: 'node-01', execStatus: 'S' as const, duration: 2 },
        { serviceSeqId: '2', pkDisplay: 'node-02', execStatus: 'S' as const, duration: 3 },
        { serviceSeqId: '3', pkDisplay: 'node-03', execStatus: 'P' as const },
        { serviceSeqId: '4', pkDisplay: 'node-04', execStatus: 'R' as const },
        { serviceSeqId: '5', pkDisplay: 'node-05', execStatus: 'R' as const }
      ]
    },
    {
      id: 'mock-2',
      name: '服务重启',
      executeTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      status: 'success' as const,
      totalCount: 3,
      successCount: 3,
      duration: 12.5,
      details: [
        { serviceSeqId: '1', pkDisplay: 'service-a', execStatus: 'S' as const, duration: 4 },
        { serviceSeqId: '2', pkDisplay: 'service-b', execStatus: 'S' as const, duration: 5 },
        { serviceSeqId: '3', pkDisplay: 'service-c', execStatus: 'S' as const, duration: 3.5 }
      ]
    },
    {
      id: 'mock-3',
      name: '日志清理',
      executeTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      status: 'failed' as const,
      totalCount: 4,
      successCount: 2,
      duration: 8.3,
      details: [
        { serviceSeqId: '1', pkDisplay: 'server-01', execStatus: 'S' as const, duration: 2 },
        { serviceSeqId: '2', pkDisplay: 'server-02', execStatus: 'S' as const, duration: 2.5 },
        { serviceSeqId: '3', pkDisplay: 'server-03', execStatus: 'F' as const, duration: 1.8, errorMsg: '磁盘空间不足' },
        { serviceSeqId: '4', pkDisplay: 'server-04', execStatus: 'F' as const, duration: 2, errorMsg: '权限不足' }
      ]
    },
    {
      id: 'mock-4',
      name: '配置更新',
      executeTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      status: 'success' as const,
      totalCount: 2,
      successCount: 2,
      duration: 5.2,
      details: [
        { serviceSeqId: '1', pkDisplay: 'config-01', execStatus: 'S' as const, duration: 2.6 },
        { serviceSeqId: '2', pkDisplay: 'config-02', execStatus: 'S' as const, duration: 2.6 }
      ]
    }
  ]
  
  // 合并模拟数据到执行历史
  historyDrawerList.value = [...mockHistoryData, ...executionHistory.value]
})
</script>

<style lang="scss" scoped>
// 使用全局规范变量，不再重复定义
@use '@/styles/uops-theme.scss' as *;
@use './workbench.scss' as *;

.workbench-container {
  padding: $uops-spacing-xl;
  min-height: calc(100vh - 60px);
  background: $uops-bg-nested;
  display: flex;
  flex-direction: column;
  gap: $uops-spacing-xl;
}

// 顶部栏
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: $uops-spacing-lg $uops-spacing-xl;
  border-radius: $uops-radius-md;
  box-shadow: $uops-shadow-sm;

  &-left {
    display: flex;
    align-items: center;
    gap: $uops-spacing-lg;
  }

  &-label {
    font-size: 14px;
    color: $uops-text-primary;
    font-weight: 500;
  }

  &-right {
    display: flex;
    gap: $uops-spacing-md;
  }
}

// 区域通用样式
.operation-section,
.emergency-section {
  background: white;
  border-radius: $uops-radius-md;
  padding: $uops-spacing-xl;
  box-shadow: $uops-shadow-sm;
  display: flex;
  flex-direction: column;
}

// 内容区域统一高度
.subcategory-view,
.operation-view,
.scenario-cards-grid {
  flex: 1;
  min-height: 200px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $uops-spacing-lg;
}

.section-title {
  display: flex;
  align-items: center;
  gap: $uops-spacing-sm;
  font-size: 16px;
  font-weight: 600;
  color: $uops-text-primary;

  .diamond-icon {
    width: 20px;
    height: 20px;
    background: $uops-primary-color;
    transform: rotate(45deg);
    border-radius: 3px;
  }
}

// 三大分区Tab样式
.source-tabs {
  display: flex;
  gap: $uops-spacing-md;
  margin-left: $uops-spacing-xl;
  
  .source-tab {
    display: flex;
    align-items: center;
    gap: $uops-spacing-xs;
    padding: $uops-spacing-sm $uops-spacing-lg;
    border-radius: $uops-radius-sm;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: $uops-text-secondary;
    background: $uops-bg-color;
    
    &:hover {
      background: $uops-primary-color-light;
      color: $uops-primary-color;
    }
    
    &.active {
      background: $uops-primary-color;
      color: white;
      
      .el-icon {
        color: white;
      }
    }
    
    .el-icon {
      font-size: 16px;
    }
  }
}

.section-actions {
  display: flex;
  gap: $uops-spacing-md;
  align-items: center;
}

// 操作选择区域
.operation-tabs {
  margin-bottom: $uops-spacing-lg;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }

  :deep(.el-tabs__item) {
    font-size: 14px;
    height: 40px;
    line-height: 40px;

    &.is-active {
      color: $uops-primary-color;
      font-weight: 500;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: $uops-primary-color;
    height: 2px;
  }
}

// 应用定制Tab栏（与操作编排Tab风格一致，按钮靠右）
.custom-tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $uops-border-color;
  margin-bottom: $uops-spacing-lg;
  
  .custom-tabs {
    display: flex;
    gap: $uops-spacing-xl;
    
    .custom-tab-item {
      position: relative;
      padding: $uops-spacing-md 0;
      font-size: 14px;
      color: $uops-text-secondary;
      cursor: pointer;
      transition: color 0.2s;
      
      &:hover {
        color: $uops-primary-color;
      }
      
      &.active {
        color: $uops-primary-color;
        font-weight: 500;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: $uops-primary-color;
        }
      }
    }
  }
  
  .custom-tab-actions {
    display: flex;
    gap: $uops-spacing-md;
    align-items: center;
    
    .custom-tab-btn {
      display: flex;
      align-items: center;
      gap: $uops-spacing-xs;
      padding: $uops-spacing-xs $uops-spacing-md;
      font-size: $font-size-base;
      color: $uops-text-secondary;
      cursor: pointer;
      border-radius: $uops-radius-sm;
      transition: all 0.2s;
      
      &:hover {
        color: $uops-primary-color;
        background: $uops-primary-color-light;
      }
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
}

// 二级目录视图
.subcategory-view {
  padding: $uops-spacing-xs 0;
  margin-bottom: $uops-spacing-md;
}

.subcategory-cards {
  display: flex;
  flex-wrap: wrap;
  gap: $uops-spacing-sm;
}

.subcategory-card {
  display: flex;
  align-items: center;
  gap: $uops-spacing-sm;
  padding: $uops-spacing-sm $uops-spacing-md;
  background: white;
  border: 1px solid $uops-border-color;
  border-radius: $uops-radius-sm;
  cursor: pointer;
  transition: all 0.2s;
  height: 32px;
  
  &:hover {
    border-color: $uops-primary-color;
    box-shadow: $uops-shadow-sm;
  }
  
  .subcat-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($uops-primary-color, 0.1);
    border-radius: $uops-radius-sm;
    color: $uops-primary-color;
    font-size: $font-size-label;
    flex-shrink: 0;
  }
  
  .subcat-info {
    display: flex;
    align-items: center;
    gap: $uops-spacing-xs;
    
    .subcat-name {
      font-size: $font-size-base;
      font-weight: 500;
      color: $uops-text-primary;
    }
    
    .subcat-count {
      font-size: $font-size-label;
      color: $uops-text-secondary;
    }
  }
}

// 操作列表视图
.operation-view {
  .breadcrumb-bar {
    display: flex;
    align-items: center;
    gap: $uops-spacing-xs;
    margin-bottom: $uops-spacing-md;
    padding: $uops-spacing-xs 0;
    font-size: 14px;
    
    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: $uops-primary-color;
      cursor: pointer;
      transition: color 0.2s;
      
      &:hover {
        color: var(--el-color-primary-light-3);
      }
    }
    
    .breadcrumb-sep {
      color: $uops-text-secondary;
    }
    
    .breadcrumb-current {
      color: $uops-text-primary;
      font-weight: 500;
    }
  }
}

.operation-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $uops-spacing-lg;
}

.operation-card {
  background: white;
  border: 1px solid $uops-border-color;
  border-radius: $uops-radius-sm;
  padding: $uops-spacing-lg;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  min-height: 80px;

  &:hover {
    border-color: $uops-primary-color;
    box-shadow: $uops-shadow-sm;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    background: rgba($uops-primary-color, 0.1);
    border-radius: $uops-radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $uops-primary-color;
    font-size: 18px;
    flex-shrink: 0;
  }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $uops-spacing-xs;
  }

  .card-title {
    font-size: 14px;
    font-weight: 500;
    color: $uops-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .favorite-icon {
    font-size: 16px;
    color: $uops-text-placeholder;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: $uops-warning-color;
    }

    &.active {
      color: $uops-warning-color;
    }
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $uops-spacing-xs;
    margin-bottom: $uops-spacing-xs;

    .el-tag {
      font-size: $font-size-label;
      padding: 0 6px;
      height: 20px;
      line-height: 20px;
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .execute-count {
      font-size: $font-size-label;
      color: $uops-text-secondary;
    }

    .info-icon {
      font-size: 14px;
      color: $uops-text-placeholder;
      cursor: pointer;

      &:hover {
        color: $uops-primary-color;
      }
    }
  }
  
  // 应用定制卡片特殊样式
  &.custom-card {
    position: relative;
    
    // 正在编辑标记
    .editing-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: $uops-warning-color;
      color: white;
      border-radius: 4px;
      font-size: $font-size-label;
      margin-right: 8px;
      flex-shrink: 0;
      
      .el-icon {
        font-size: $font-size-label;
      }
    }
    
    .update-time {
      font-size: $font-size-label;
      color: $uops-text-secondary;
    }
  }
  
  // 草稿卡片样式
  &.draft-card {
    .update-time {
      font-size: $font-size-label;
      color: $uops-text-secondary;
    }
  }
}

// 收藏筛选器
.favorite-filter,
.custom-filter {
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-lg;
  padding: $uops-spacing-md;
  background: $uops-bg-color;
  border-radius: $uops-radius-sm;
  
  .filter-label {
    font-size: 14px;
    color: $uops-text-primary;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $uops-spacing-sm;
    
    .filter-tag {
      padding: $uops-spacing-xs $uops-spacing-md;
      font-size: $font-size-base;
      color: $uops-text-secondary;
      background: white;
      border: 1px solid $uops-border-color;
      border-radius: $uops-radius-sm;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: $uops-primary-color;
        color: $uops-primary-color;
      }
      
      &.active {
        background: $uops-primary-color;
        color: white;
        border-color: $uops-primary-color;
      }
    }
  }
}

// 应急场景区域
.scenario-tabs {
  display: flex;
  gap: $uops-spacing-sm;
  margin-bottom: $uops-spacing-lg;
}

.scenario-tab {
  padding: $uops-spacing-sm $uops-spacing-lg;
  background: $uops-bg-color;
  border-radius: $uops-radius-sm;
  font-size: 14px;
  color: $uops-text-regular;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba($uops-primary-color, 0.1);
  }

  &.active {
    background: $uops-primary-color;
    color: white;
  }
}

.scenario-actions {
  display: flex;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-lg;
  align-items: center;
}

.scenario-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $uops-spacing-lg;
}

.scenario-card {
  background: white;
  border: 1px solid $uops-border-color;
  border-radius: $uops-radius-sm;
  padding: $uops-spacing-lg;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  min-height: 80px;

  &:hover {
    border-color: $uops-primary-color;
    box-shadow: $uops-shadow-sm;
  }

  .scenario-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $uops-spacing-md;

    .scenario-card-badges {
      display: flex;
      align-items: center;
      gap: $uops-spacing-xs;

      .alert-icon {
        font-size: 16px;
      }
    }

    .more-icon {
      font-size: 16px;
      color: $uops-text-secondary;
      cursor: pointer;

      &:hover {
        color: $uops-primary-color;
      }
    }
  }

  .scenario-flowchart {
    border: 1px dashed $uops-border-color;
    border-radius: $uops-radius-sm;
    padding: $uops-spacing-md;
    margin-bottom: $uops-spacing-md;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-list-nested;

    .flowchart-nodes {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $uops-spacing-xs;

      .flow-node {
        padding: $uops-spacing-xs $uops-spacing-md;
        border-radius: $uops-radius-sm;
        font-size: $font-size-label;
        text-align: center;
        min-width: 80px;

        &.start-node,
        &.end-node {
          background: rgba($uops-danger-color, 0.1);
          color: $uops-danger-color;
          border-radius: 12px;
        }

        &.process-node {
          background: rgba($uops-primary-color, 0.1);
          color: $uops-primary-color;
        }
      }

      .flow-connector {
        width: 1px;
        height: 16px;
        background: $uops-border-color;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid $uops-border-color;
        }
      }
    }
  }

  .scenario-card-footer {
    .scenario-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $uops-spacing-xs;
      margin-bottom: $uops-spacing-sm;

      .el-tag {
        font-size: $font-size-label;
        padding: 0 6px;
        height: 18px;
        line-height: 18px;
      }
    }

    .scenario-title {
      font-size: $font-size-base;
      font-weight: 500;
      color: $uops-text-primary;
      margin-bottom: $uops-spacing-sm;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
    }

    .scenario-bottom-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $uops-spacing-xs;

      .el-tag {
        font-size: $font-size-label;
        padding: 0 6px;
        height: 18px;
        line-height: 18px;
      }

      .update-time {
        font-size: $font-size-label;
        color: $uops-text-secondary;
      }
    }
  }

  // 草稿卡片样式
  &.draft-card {
    position: relative;
    padding-left: 40px;

    &.selected {
      border-color: $uops-primary-color;
      background: var(--uops-bg-card-large);
    }

    .card-checkbox {
      position: absolute;
      top: $uops-spacing-lg;
      left: $uops-spacing-md;
      z-index: 1;
    }
  }
}

// 参数弹窗
.template-save {
  display: flex;
  gap: $uops-spacing-md;
  align-items: center;
}

// 执行弹窗样式
.execute-dialog {
  .el-dialog__body {
    padding: $uops-spacing-lg $uops-spacing-xl;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .el-dialog__footer {
    padding: $uops-spacing-md $uops-spacing-xl;
    border-top: 1px solid $uops-border-color;
    background: white;
    position: sticky;
    bottom: 0;
  }
}

// 步骤指示器
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $uops-spacing-xl;
  padding: $uops-spacing-lg 0;
  border-bottom: 1px solid $uops-border-color;

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $uops-spacing-sm;

    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: $uops-bg-color;
      border: 2px solid $uops-border-color;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: $uops-text-secondary;
      transition: all 0.3s;
    }

    .step-label {
      font-size: 14px;
      color: $uops-text-secondary;
      transition: all 0.3s;
    }

    &.active {
      .step-circle {
        background: $uops-primary-color;
        border-color: $uops-primary-color;
        color: white;
      }

      .step-label {
        color: $uops-primary-color;
        font-weight: 600;
      }
    }

    &.completed {
      .step-circle {
        background: $uops-success-color;
        border-color: $uops-success-color;
        color: white;
      }

      .step-label {
        color: $uops-success-color;
      }
    }
  }

  .step-line {
    flex: 1;
    max-width: 120px;
    height: 2px;
    background: $uops-border-color;
    margin: 0 $uops-spacing-md;
    transition: all 0.3s;

    &.active {
      background: $uops-success-color;
    }
  }
}

// 步骤内容区域
.step-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 执行概要
.execution-summary {
  background: $uops-bg-color;
  border-radius: $uops-radius-sm;
  padding: $uops-spacing-md;

  .summary-row {
    display: flex;
    align-items: center;
    margin-bottom: $uops-spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    .summary-label {
      font-size: $font-size-label;
      color: $uops-text-secondary;
      min-width: 100px;
    }

    .summary-value {
      font-size: $font-size-label;
      color: $uops-text-primary;
    }
  }
}

// 执行进度
.execution-progress {
  padding: $uops-spacing-md 0;
}

// 资源明细表格
.running-text {
  color: $uops-primary-color;
  font-size: 12px;
}

// 错误信息
.error-info {
  background: rgba($uops-danger-color, 0.05);
  border-radius: $uops-radius-sm;
  padding: $uops-spacing-md;

  .error-item {
    display: flex;
    align-items: flex-start;
    gap: $uops-spacing-sm;
    margin-bottom: $uops-spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    .error-icon {
      color: $uops-danger-color;
      margin-top: 2px;
    }

    .error-resource {
      font-size: $font-size-label;
      color: $uops-text-primary;
      font-weight: 500;
    }

    .error-msg {
      font-size: $font-size-label;
      color: $uops-danger-color;
    }
  }
}

// 弹窗底部按钮
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $uops-spacing-md;
}

.execute-section {
  margin-bottom: $uops-spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title-bar {
  display: flex;
  align-items: center;
  margin-bottom: $uops-spacing-md;

  .title-indicator {
    width: 4px;
    height: 16px;
    background: $uops-primary-color;
    border-radius: 2px;
    margin-right: $uops-spacing-sm;
  }

  .title-text {
    font-size: 14px;
    font-weight: 600;
    color: $uops-text-primary;
  }
}

// 操作介绍
.operation-intro {
  background: $uops-bg-color;
  border-radius: $uops-radius-sm;
  padding: $uops-spacing-md;

  .intro-row {
    display: flex;
    align-items: center;
    margin-bottom: $uops-spacing-sm;

    &:last-child {
      margin-bottom: 0;
    }

    .intro-label {
      font-size: $font-size-label;
      color: $uops-text-secondary;
      min-width: 80px;
    }

    .intro-value {
      font-size: $font-size-label;
      color: $uops-text-primary;
    }

    .intro-tag {
      margin-right: $uops-spacing-xs;
    }
  }
}

// 关联流程
.related-flows {
  display: flex;
  gap: $uops-spacing-md;

  .flow-item {
    display: flex;
    align-items: center;
    gap: $uops-spacing-xs;
    padding: $uops-spacing-sm $uops-spacing-md;
    background: $uops-bg-color;
    border-radius: $uops-radius-sm;
    font-size: 12px;
    color: $uops-text-primary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $uops-primary-color-light;
      color: $uops-primary-color;
    }

    .el-icon {
      color: $uops-primary-color;
    }
  }
}

// 参数表单
.param-form {
  .el-form-item {
    margin-bottom: $uops-spacing-md;
  }
}

// 资源选择
.resource-selection {
  .cascade-selectors {
    margin-bottom: $uops-spacing-md;

    .selector-row {
      display: flex;
      gap: $uops-spacing-md;
      margin-bottom: $uops-spacing-sm;

      &:last-child {
        margin-bottom: 0;
      }

      .selector-item {
        display: flex;
        align-items: center;
        gap: $uops-spacing-sm;
        flex: 1;

        .selector-label {
          font-size: $font-size-label;
          color: $uops-text-primary;
          min-width: 90px;

          &.required::before {
            content: '*';
            color: $uops-error-color;
            margin-right: 2px;
          }
        }

        .el-select {
          flex: 1;
        }
      }
    }
  }

  .resource-search {
    display: flex;
    justify-content: flex-end;
  }
}

// 执行记录
.execution-history-content {
  padding: $uops-spacing-lg;
}

.history-filters {
  display: flex;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-lg;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $uops-spacing-md;
}

.history-item {
  background: $uops-bg-color;
  border-radius: $uops-radius-md;
  padding: $uops-spacing-lg;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $uops-spacing-sm;

    .history-id {
      font-size: $font-size-label;
      color: $uops-text-placeholder;
      font-family: monospace;
    }
  }

  .history-name {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    margin-bottom: $uops-spacing-sm;
    font-size: 14px;
    color: $uops-text-primary;
    font-weight: 500;
  }

  .history-info {
    display: flex;
    gap: $uops-spacing-lg;
    font-size: 12px;
    color: $uops-text-secondary;
  }
}

// 批量操作相关样式
.batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $uops-spacing-md $uops-spacing-lg;
  background: $uops-bg-color;
  border-radius: $uops-radius-sm;
  margin-bottom: $uops-spacing-lg;
  
  .batch-info {
    display: flex;
    align-items: center;
    gap: $uops-spacing-lg;
    
    .selected-count {
      font-size: 14px;
      color: $uops-text-regular;
    }
  }
  
  .batch-actions {
    display: flex;
    gap: $uops-spacing-sm;
  }
}

.draft-card {
  position: relative;
  padding-left: 40px; // 为勾选框预留空间
  
  .card-checkbox {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    z-index: 10;
  }
  
  &.selected {
    border-color: $uops-primary-color;
    background: rgba($uops-primary-color, 0.02);
  }
  
  .card-content {
    width: 100%;
  }
}

// 批量发布弹窗样式
.publish-dialog-content {
  .publish-info {
    margin-bottom: $uops-spacing-lg;
    
    h4 {
      font-size: 14px;
      color: $uops-text-primary;
      margin-bottom: $uops-spacing-md;
      font-weight: 500;
    }
    
    .draft-list {
      background: $uops-bg-color;
      border-radius: $uops-radius-sm;
      padding: $uops-spacing-md;
      max-height: 200px;
      overflow-y: auto;
      
      .draft-item {
        display: flex;
        align-items: center;
        gap: $uops-spacing-sm;
        padding: $uops-spacing-xs 0;
        font-size: $font-size-base;
        color: $uops-text-regular;
        
        .el-icon {
          color: $uops-text-secondary;
        }
      }
    }
  }
  
  .publish-form {
    margin-bottom: $uops-spacing-lg;
  }
  
  .workflow-info {
    h4 {
      font-size: 14px;
      color: $uops-text-primary;
      margin-bottom: $uops-spacing-md;
      font-weight: 500;
    }
    
    .workflow-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $uops-spacing-md;
      padding: $uops-spacing-lg;
      background: $uops-bg-color;
      border-radius: $uops-radius-sm;
      
      .step-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $uops-spacing-xs;
        
        .step-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: $uops-primary-color;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
        }
        
        span {
          font-size: $font-size-label;
          color: $uops-text-regular;
        }
      }
      
      .step-arrow {
        font-size: 20px;
        color: $uops-text-secondary;
      }
    }
  }
}
</style>
