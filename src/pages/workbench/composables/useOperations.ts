/**
 * 操作工作台 - 操作组件域 composable
 *
 * 职责：应用模块选择、操作组件列表（公共组件/我的收藏/应用定制三大分区）、
 * 定制草稿管理与批量发布。
 *
 * 草稿初始数据来自 mock 层（~/demo/mock/workbench-extra）。
 */
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  AppModule,
  OperationComponent,
  CustomDraft,
  PublishBatch
} from '~/demo/types/workbench'
import { getModules, getOperations, toggleFavorite } from '~/demo/api/workbench'
import { mockCustomDrafts } from '~/demo/mock/workbench-extra'
import { createStatusMapper } from './utils'

export function useOperations() {
  // ============ 应用模块 ============
  const modules = ref<AppModule[]>([])
  const selectedModuleId = ref<string>('')

  // ============ 操作组件 ============
  const operations = ref<OperationComponent[]>([])
  const activeCategory = ref<string>('CCE')
  const selectedSubcategory = ref<string>('')
  const operationSearch = ref<string>('')

  // ============ 三大分区 ============
  const activeSource = ref<'favorite' | 'public' | 'custom'>('public')
  const favoriteFilter = ref<string>('')
  const customFilter = ref<string>('')
  const customActiveTab = ref<string>('formal')

  // ============ 草稿数据（来自 mock 层）============
  const customDrafts = ref<CustomDraft[]>([...mockCustomDrafts])

  // ============ 批量选择 ============
  const selectedDraftIds = ref<string[]>([])
  const isAllSelected = computed(() => {
    const draftDrafts = customDrafts.value.filter(d => d.status === 'draft')
    return draftDrafts.length > 0 && draftDrafts.every(d => selectedDraftIds.value.includes(d.id))
  })

  // ============ 发布弹窗 ============
  const showPublishDialog = ref(false)
  const publishForm = ref({
    name: '',
    description: ''
  })
  const publishBatches = ref<PublishBatch[]>([])

  // ============ 公共组件分类 ============
  const publicCategories = ['操作系统', '数据库', '中间件', '负载均衡', '应用平台', 'CCE', '大数据平台', '人行演练专用']

  // ============ 应用定制的应用列表 ============
  const customApps = ['UOps', 'ACCM', 'ICC', 'TaihangFlow', 'BPM', 'Portal']

  // ============ 计算属性 ============
  const categories = computed(() => {
    return ['我的收藏', '操作系统', '数据库', '中间件', '负载均衡', '应用平台', 'CCE', '大数据平台', '应用定制', '人行演练专用']
  })

  const subcategories = computed(() => {
    const filtered = activeCategory.value === '我的收藏'
      ? operations.value.filter(op => op.isFavorite)
      : operations.value.filter(op => op.category === activeCategory.value)

    const subCats = new Set(filtered.map(op => op.subCategory))
    return Array.from(subCats).filter(Boolean)
  })

  const filteredOperations = computed(() => {
    let filtered = activeCategory.value === '我的收藏'
      ? operations.value.filter(op => op.isFavorite)
      : operations.value.filter(op => op.category === activeCategory.value)

    if (selectedSubcategory.value) {
      filtered = filtered.filter(op => op.subCategory === selectedSubcategory.value)
    }

    if (operationSearch.value) {
      filtered = filtered.filter(op =>
        op.name.toLowerCase().includes(operationSearch.value.toLowerCase())
      )
    }

    return filtered
  })

  const favoriteCategories = computed(() => {
    const favoriteOps = operations.value.filter(op => op.isFavorite)
    const cats = new Set(favoriteOps.map(op => op.category))
    return Array.from(cats).filter(Boolean)
  })

  const favoriteOperations = computed(() => {
    let filtered = operations.value.filter(op => op.isFavorite)

    if (favoriteFilter.value) {
      filtered = filtered.filter(op => op.category === favoriteFilter.value)
    }

    if (operationSearch.value) {
      filtered = filtered.filter(op =>
        op.name.toLowerCase().includes(operationSearch.value.toLowerCase())
      )
    }

    return filtered
  })

  const customOperations = computed(() => {
    let filtered = operations.value.filter(op => op.category === '应用定制')

    if (customFilter.value) {
      filtered = filtered.filter(op => op.subCategory === customFilter.value)
    }

    if (operationSearch.value) {
      filtered = filtered.filter(op =>
        op.name.toLowerCase().includes(operationSearch.value.toLowerCase())
      )
    }

    return filtered
  })

  // ============ 数据加载 ============
  const loadModules = async () => {
    modules.value = await getModules()
    if (modules.value.length > 0) {
      selectedModuleId.value = modules.value[0].id
    }
  }

  const loadOperations = async () => {
    operations.value = await getOperations(selectedModuleId.value)
  }

  // ============ 事件处理方法 ============
  const handleModuleChange = async (moduleId: string) => {
    selectedModuleId.value = moduleId
    await loadOperations()
  }

  const handleTabClick = () => {
    // 切换一级分类时重置二级分类和搜索
    selectedSubcategory.value = ''
    operationSearch.value = ''
  }

  const handleBackToSubcategories = () => {
    selectedSubcategory.value = ''
  }

  const handleSourceChange = (source: 'favorite' | 'public' | 'custom') => {
    activeSource.value = source
    operationSearch.value = ''
    favoriteFilter.value = ''
    customFilter.value = ''
    selectedSubcategory.value = ''
  }

  const handleAddCustomOp = () => {
    ElMessage.info('新增定制操作功能开发中')
  }

  const handleQuickModifyCustom = () => {
    ElMessage.info('快速修改标签功能开发中')
  }

  const handleFilterCustom = () => {
    ElMessage.info('筛选功能开发中')
  }

  const handleEditCustomOp = (operation: OperationComponent) => {
    const newDraft: CustomDraft = {
      id: `draft_${Date.now()}`,
      name: operation.name,
      saveTime: new Date().toLocaleString(),
      sourceOperationId: operation.id,
      status: 'draft'
    }
    customDrafts.value.push(newDraft)
    ElMessage.success(`已创建草稿，可在"我的草稿"中查看`)
  }

  const handleViewDraft = (operation: OperationComponent) => {
    const draft = getEditingDraft(operation.id)
    if (draft) {
      customActiveTab.value = 'draft'
      ElMessage.info(`已切换到草稿视图`)
    }
  }

  const handleCopyCustomOp = (operation: OperationComponent) => {
    ElMessage.info(`复制操作: ${operation.name}`)
  }

  const handleCustomCommand = (command: { action: string }, operation: OperationComponent) => {
    switch (command.action) {
      case 'edit':
        handleEditCustomOp(operation)
        break
      case 'delete':
        handleDeleteCustomOp(operation)
        break
      case 'copy':
        handleCopyCustomOp(operation)
        break
      case 'viewDraft':
        handleViewDraft(operation)
        break
    }
  }

  const handleDeleteCustomOp = (operation: OperationComponent) => {
    ElMessageBox.confirm(
      `确定要删除操作"${operation.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      ElMessage.success('删除成功')
    }).catch(() => {
      ElMessage.info('已取消删除')
    })
  }

  const handlePublishDraft = (draft: CustomDraft) => {
    ElMessageBox.confirm(
      `确定要发布草稿"${draft.name}"吗？`,
      '确认发布',
      {
        confirmButtonText: '发布',
        cancelButtonText: '取消',
        type: 'info'
      }
    ).then(() => {
      customDrafts.value = customDrafts.value.filter(d => d.id !== draft.id)
      ElMessage.success('发布成功')
    }).catch(() => {
      ElMessage.info('已取消发布')
    })
  }

  const handleDeleteDraft = (draft: CustomDraft) => {
    ElMessageBox.confirm(
      `确定要删除草稿"${draft.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      customDrafts.value = customDrafts.value.filter(d => d.id !== draft.id)
      ElMessage.success('删除成功')
    }).catch(() => {
      ElMessage.info('已取消删除')
    })
  }

  const toggleSelectAll = (value: boolean | string | number) => {
    const draftDrafts = customDrafts.value.filter(d => d.status === 'draft')
    if (value) {
      selectedDraftIds.value = draftDrafts.map(d => d.id)
    } else {
      selectedDraftIds.value = []
    }
  }

  const clearSelection = () => {
    selectedDraftIds.value = []
  }

  const handleBatchPublish = () => {
    if (selectedDraftIds.value.length === 0) {
      ElMessage.warning('请先选择要发布的草稿')
      return
    }

    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    publishForm.value.name = `批量发布-${dateStr}`
    publishForm.value.description = ''

    showPublishDialog.value = true
  }

  const handleBatchDelete = () => {
    if (selectedDraftIds.value.length === 0) {
      ElMessage.warning('请先选择要删除的草稿')
      return
    }

    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedDraftIds.value.length} 个草稿吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      customDrafts.value = customDrafts.value.filter(d => !selectedDraftIds.value.includes(d.id))
      selectedDraftIds.value = []
      ElMessage.success('批量删除成功')
    }).catch(() => {
      ElMessage.info('已取消删除')
    })
  }

  const submitPublish = () => {
    if (!publishForm.value.name.trim()) {
      ElMessage.warning('请输入批次名称')
      return
    }

    const batch: PublishBatch = {
      id: `batch_${Date.now()}`,
      name: publishForm.value.name,
      description: publishForm.value.description,
      draftIds: [...selectedDraftIds.value],
      status: 'reviewing',
      createTime: new Date().toLocaleString(),
      submitTime: new Date().toLocaleString()
    }

    publishBatches.value.push(batch)

    customDrafts.value = customDrafts.value.map(d => {
      if (selectedDraftIds.value.includes(d.id)) {
        return {
          ...d,
          status: 'submitted' as const,
          batchId: batch.id
        }
      }
      return d
    })

    selectedDraftIds.value = []
    showPublishDialog.value = false
    ElMessage.success('提交审核成功')
  }

  const handleSubcategoryClick = (subcat: string) => {
    selectedSubcategory.value = subcat
  }

  const handleToggleFavorite = async (operation: OperationComponent) => {
    const newStatus = await toggleFavorite(operation.id)
    operations.value = operations.value.map(op =>
      op.id === operation.id ? { ...op, isFavorite: newStatus } : op
    )
    ElMessage.success(newStatus ? '已收藏' : '已取消收藏')
  }

  const handleDraftCommand = (command: { action: string }, draft: CustomDraft) => {
    switch (command.action) {
      case 'publish':
        handlePublishDraft(draft)
        break
      case 'recall':
        ElMessageBox.confirm(
          `确定要追回草稿"${draft.name}"吗？追回后将回到草稿状态。`,
          '确认追回',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          ElMessage.success('追回成功')
        }).catch(() => {
          ElMessage.info('已取消追回')
        })
        break
      case 'edit':
        ElMessage.info(`编辑草稿: ${draft.name}`)
        break
      case 'delete':
        handleDeleteDraft(draft)
        break
    }
  }

  // ============ 模板辅助函数 ============
  const hasEditingDraft = (operationId: string): boolean => {
    return customDrafts.value.some(draft => draft.sourceOperationId === operationId)
  }

  const getEditingDraft = (operationId: string): CustomDraft | undefined => {
    return customDrafts.value.find(draft => draft.sourceOperationId === operationId)
  }

  const getTagType = (tag: string) => {
    if (tag.includes('仅生产')) return 'success'
    if (tag.includes('应急')) return 'warning'
    if (tag.includes('运维请求')) return 'primary'
    if (tag.includes('生产办公')) return 'success'
    if (tag.includes('一二线')) return 'danger'
    return 'info'
  }

  const getExecutionStatusType = createStatusMapper(
    { success: 'success', failed: 'danger', running: 'warning', cancelled: 'info' }, 'info'
  )
  const getExecutionStatusText = createStatusMapper(
    { success: '成功', failed: '失败', running: '执行中', cancelled: '已取消' }, '未知'
  )
  const getDraftStatusType = createStatusMapper(
    { draft: 'info', submitted: 'warning', published: 'success', rejected: 'danger' }, 'info'
  )
  const getDraftStatusText = createStatusMapper(
    { draft: '草稿', submitted: '审核中', published: '已发布', rejected: '已驳回' }, '草稿'
  )

  const getOperationCount = (subcat: string): number => {
    return operations.value.filter(op =>
      op.category === activeCategory.value &&
      op.subCategory === subcat
    ).length
  }

  const getDraftNameById = (id: string): string => {
    const draft = customDrafts.value.find(d => d.id === id)
    return draft?.name || '未知草稿'
  }

  return {
    // 状态
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
    // 计算属性
    categories,
    subcategories,
    filteredOperations,
    favoriteCategories,
    favoriteOperations,
    customOperations,
    // 数据加载
    loadModules,
    loadOperations,
    // 事件处理
    handleModuleChange,
    handleTabClick,
    handleBackToSubcategories,
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
    handleSubcategoryClick,
    handleToggleFavorite,
    handleDraftCommand,
    // 辅助函数
    hasEditingDraft,
    getEditingDraft,
    getTagType,
    getExecutionStatusType,
    getExecutionStatusText,
    getDraftStatusType,
    getDraftStatusText,
    getOperationCount,
    getDraftNameById
  }
}
