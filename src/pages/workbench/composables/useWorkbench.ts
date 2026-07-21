import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type {
  AppModule,
  OperationComponent,
  ExecutionRecord,
  ExecutionDetail,
  ParamField,
  CustomDraft,
  PublishBatch,
  Scenario,
  ScenarioDraft,
  OrchestrationExecutionRecord,
  OrchestrationJob
} from '~/demo/types/workbench'
import {
  getModules,
  getOperations,
  getExecutionHistory,
  executeOperation,
  toggleFavorite,
  saveParamTemplate
} from '~/demo/api/workbench'

// 状态映射工厂函数
const createStatusMapper = <T extends string>(
  map: Record<string, T>,
  defaultValue: T
) => (status: string): T => map[status] || defaultValue

export function useWorkbench() {
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

  // ============ 草稿数据 ============
  const customDrafts = ref<CustomDraft[]>([
    { id: 'd1', name: '定制应用健康检查（编辑中）', saveTime: '2024-01-15 10:30', sourceOperationId: 'op0901-1', status: 'draft' },
    { id: 'd2', name: '应用部署脚本', saveTime: '2024-01-14 16:20', status: 'draft' },
    { id: 'd3', name: '日志导出优化', saveTime: '2024-01-13 09:15', status: 'draft' }
  ])

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

  // ============ 应急场景 ============
  const scenarios = ref<Scenario[]>([
    { id: '1', name: '场景1', hasAlert: true, isEditing: false, hasStart: false },
    { id: '2', name: '场景2', hasAlert: false, isEditing: false, hasStart: false },
    { id: '3', name: '场景3', hasAlert: false, isEditing: false, hasStart: true },
    { id: '4', name: '场景4', hasAlert: false, isEditing: true, hasStart: true },
    { id: '5', name: '场景5', hasAlert: false, isEditing: false, hasStart: true }
  ])
  const activeScenarioTab = ref<string>('formal')
  const scenarioSearch = ref<string>('')

  // ============ 编排草稿 ============
  const scenarioDrafts = ref<ScenarioDraft[]>([
    { id: 'sd1', name: '场景1（编辑中）', saveTime: '2024-01-15 11:30', sourceScenarioId: '1', status: 'draft' },
    { id: 'sd2', name: '应急恢复流程', saveTime: '2024-01-14 17:20', status: 'draft' },
    { id: 'sd3', name: '故障切换优化', saveTime: '2024-01-13 10:15', status: 'draft' }
  ])

  // ============ 编排批量选择 ============
  const selectedScenarioDraftIds = ref<string[]>([])
  const isAllScenarioDraftsSelected = computed(() => {
    const draftDrafts = scenarioDrafts.value.filter(d => d.status === 'draft')
    return draftDrafts.length > 0 && draftDrafts.every(d => selectedScenarioDraftIds.value.includes(d.id))
  })

  // ============ 编排发布弹窗 ============
  const showScenarioPublishDialog = ref(false)
  const scenarioPublishForm = ref({
    name: '',
    description: ''
  })
  const scenarioPublishBatches = ref<PublishBatch[]>([])

  // ============ 执行历史 ============
  const executionHistory = ref<ExecutionRecord[]>([])
  const showExecutionHistory = ref<boolean>(false)
  const historyFilter = ref({
    status: '',
    type: '',
    keyword: ''
  })

  // ============ 编排执行历史 ============
  const orchestrationHistory = ref<OrchestrationExecutionRecord[]>([])

  // ============ 执行历史抽屉 ============
  const showHistoryDrawer = ref<boolean>(false)
  const historyDrawerList = ref<ExecutionRecord[]>([])
  const historyDrawerFilter = ref({
    timeRange: 'today',
    status: '',
    keyword: ''
  })
  const expandedHistoryIds = ref<string[]>([])
  const expandedDetailIds = ref<string[]>([])

  // ============ 编排执行历史抽屉 ============
  const showOrchestrationHistoryDrawer = ref<boolean>(false)
  const orchestrationHistoryDrawerList = ref<OrchestrationExecutionRecord[]>([])
  const orchestrationHistoryDrawerFilter = ref({
    timeRange: 'today',
    status: '',
    keyword: ''
  })
  const expandedOrchestrationHistoryIds = ref<string[]>([])

  // ============ 执行历史抽屉 Tab 切换 ============
  const historyDrawerActiveTab = ref<'component' | 'orchestration'>('component')

  // ============ 顶部状态栏 ============
  const recentExecutions = ref<ExecutionRecord[]>([])
  const recentOrchestrationExecutions = ref<OrchestrationExecutionRecord[]>([])

  // ============ 参数弹窗 ============
  const showParamDialog = ref<boolean>(false)
  const paramDialogTitle = ref<string>('')
  const currentParamConfig = ref<ParamField[]>([])
  const currentExecuteId = ref<string>('')
  const currentOperation = ref<OperationComponent | null>(null)
  const paramForm = ref<Record<string, any>>({})
  const paramFormRules = ref<FormRules>({})
  const paramFormRef = ref<FormInstance>()
  const executing = ref<boolean>(false)
  const templateName = ref<string>('')
  
  // ============ 两步式执行弹窗 ============
  const executionStep = ref<1 | 2>(1) // 1: 参数配置, 2: 执行结果
  const currentExecution = ref<{
    operateId: string
    serviceName: string
    serviceCnName: string
    implementTime: string
    execStatus: 'S' | 'F' | 'P' | 'R'
    totalCount: number
    successCount: number
    startTime: string
    endTime?: string
    details: Array<{
      serviceSeqId: string
      pkValue: string
      pkDisplay: string
      execStatus: 'S' | 'F' | 'P' | 'R'
      startTime?: string
      endTime?: string
      errorMsg?: string
    }>
  } | null>(null)
  const executionPolling = ref<NodeJS.Timeout | null>(null)

  // ============ 资源选择 ============
  const resourceForm = ref({
    datacenter: '',
    cluster: '',
    namespace: '',
    deployment: ''
  })
  const resourceSearchKeyword = ref<string>('')

  // ============ 级联选项数据 ============
  const datacenterOptions = ref([
    { value: 'bj-test', label: '测试环境北京' },
    { value: 'sh-test', label: '测试环境上海' },
    { value: 'bj-prod', label: '生产环境北京' }
  ])
  const clusterOptions = ref([
    { value: 'hqxt-ccedt-pfmt-a-arm', label: 'hqxt-ccedt-pfmt-a-arm' },
    { value: 'hqxt-ccedt-pfmt-b-arm', label: 'hqxt-ccedt-pfmt-b-arm' }
  ])
  const namespaceOptions = ref([
    { value: 'apida', label: 'apida' },
    { value: 'apida-test', label: 'apida-test' },
    { value: 'default', label: 'default' }
  ])
  const deploymentOptions = ref([
    { value: 'apism-batch-dev', label: 'apism-batch-dev' },
    { value: 'apism-api-dev', label: 'apism-api-dev' },
    { value: 'apism-web-dev', label: 'apism-web-dev' }
  ])

  // ============ 资源列表（POD）============
  const resourceList = ref([
    { name: 'apism-batch-dev-684f65df5c-zrph8', ip: '172.16.197.247', status: 'Running' },
    { name: 'apism-batch-dev-684f65df5c-xk9p2', ip: '172.16.197.248', status: 'Running' },
    { name: 'apism-batch-dev-684f65df5c-m3n7q', ip: '172.16.197.249', status: 'Pending' }
  ])

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

  const filteredScenarios = computed(() => {
    let filtered = scenarios.value
    
    if (scenarioSearch.value) {
      filtered = filtered.filter(scenario =>
        scenario.name.toLowerCase().includes(scenarioSearch.value.toLowerCase()) ||
        scenario.id.includes(scenarioSearch.value)
      )
    }
    
    return filtered
  })

  const filteredHistory = computed(() => {
    let filtered = executionHistory.value
    
    if (historyFilter.value.status) {
      filtered = filtered.filter(record => record.status === historyFilter.value.status)
    }
    
    if (historyFilter.value.type) {
      filtered = filtered.filter(record => record.type === historyFilter.value.type)
    }
    
    if (historyFilter.value.keyword) {
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(historyFilter.value.keyword.toLowerCase())
      )
    }
    
    return filtered
  })

  const filteredResources = computed(() => {
    if (!resourceSearchKeyword.value) return resourceList.value
    const keyword = resourceSearchKeyword.value.toLowerCase()
    return resourceList.value.filter(r => 
      r.name.toLowerCase().includes(keyword) || 
      r.ip.includes(keyword)
    )
  })

  // ============ 辅助方法 ============
  const hasEditingDraft = (operationId: string): boolean => {
    return customDrafts.value.some(draft => draft.sourceOperationId === operationId)
  }

  const getEditingDraft = (operationId: string): CustomDraft | undefined => {
    return customDrafts.value.find(draft => draft.sourceOperationId === operationId)
  }

  const hasScenarioEditingDraft = (scenarioId: string): boolean => {
    return scenarioDrafts.value.some(draft => draft.sourceScenarioId === scenarioId)
  }

  const getScenarioEditingDraft = (scenarioId: string): ScenarioDraft | undefined => {
    return scenarioDrafts.value.find(draft => draft.sourceScenarioId === scenarioId)
  }

  const getScenarioDraftStatusType = createStatusMapper(
    { draft: 'info', submitted: 'warning', published: 'success', rejected: 'danger' }, 'info'
  )
  const getScenarioDraftStatusText = createStatusMapper(
    { draft: '草稿', submitted: '审核中', published: '已发布', rejected: '已驳回' }, '未知'
  )

  // ============ 事件处理方法 ============
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

  const toggleSelectAll = (value: boolean) => {
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

  const handleDatacenterChange = (value: string) => {
    resourceForm.value.cluster = ''
    resourceForm.value.namespace = ''
    resourceForm.value.deployment = ''
  }

  const handleClusterChange = (value: string) => {
    resourceForm.value.namespace = ''
    resourceForm.value.deployment = ''
  }

  const handleNamespaceChange = (value: string) => {
    resourceForm.value.deployment = ''
  }

  const handleDeploymentChange = (value: string) => {
    // Deployment changed
  }

  // ============ 模板辅助函数 ============
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

  const getScenarioDraftNameById = (id: string): string => {
    const draft = scenarioDrafts.value.find(d => d.id === id)
    return draft?.name || '未知编排草稿'
  }

  const handleSubcategoryClick = (subcat: string) => {
    selectedSubcategory.value = subcat
  }

  const handleOperationClick = (operation: OperationComponent) => {
    currentExecuteId.value = operation.id
    currentOperation.value = operation
    paramDialogTitle.value = `执行操作 - ${operation.name}`
    currentParamConfig.value = operation.paramConfig
    initParamForm(operation.paramConfig)
    resourceForm.value = { datacenter: '', cluster: '', namespace: '', deployment: '' }
    resourceSearchKeyword.value = ''
    executionStep.value = 1 // 重置到第一步
    currentExecution.value = null // 清空执行结果
    showParamDialog.value = true
  }

  // 提交执行
  const handleSubmitExecution = async () => {
    if (!currentOperation.value) return
    
    executing.value = true
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 生成执行记录
      const operateId = `OP${Date.now()}`
      const now = new Date()
      const startTime = now.toISOString()
      
      // 模拟资源执行明细
      const selectedResources = resourceList.value.slice(0, 2) // 假设选择前两个
      const details = selectedResources.map((res, index) => ({
        serviceSeqId: `${operateId}_${index}`,
        pkValue: res.name,
        pkDisplay: res.name,
        execStatus: 'P' as const,
        startTime: startTime
      }))
      
      currentExecution.value = {
        operateId,
        serviceName: currentOperation.value.id,
        serviceCnName: currentOperation.value.name,
        implementTime: now.toLocaleString(),
        execStatus: 'P',
        totalCount: details.length,
        successCount: 0,
        startTime,
        details
      }
      
      // 添加到执行历史和最近执行
      const historyRecord: ExecutionRecord = {
        id: operateId,
        type: 'operation',
        name: currentOperation.value.name,
        status: 'running',
        execStatus: 'P',
        operator: '当前用户',
        executeTime: now.toISOString(),
        totalCount: details.length,
        successCount: 0,
        details: details.map(d => ({ ...d }))
      }
      executionHistory.value.unshift(historyRecord)
      recentExecutions.value.unshift(historyRecord)
      // 保持最近执行最多5条
      if (recentExecutions.value.length > 5) {
        recentExecutions.value = recentExecutions.value.slice(0, 5)
      }
      
      // 切换到第二步
      executionStep.value = 2
      
      // 开始轮询执行状态
      startExecutionPolling()
      
      ElMessage.success('执行已提交')
    } catch (error) {
      ElMessage.error('提交执行失败')
    } finally {
      executing.value = false
    }
  }

  // 开始轮询执行状态
  const startExecutionPolling = () => {
    // 清除之前的轮询
    if (executionPolling.value) {
      clearInterval(executionPolling.value)
    }
    
    // 每 2 秒轮询一次
    executionPolling.value = setInterval(() => {
      if (!currentExecution.value) return
      
      // 模拟执行进度
      const details = currentExecution.value.details
      let allCompleted = true
      
      details.forEach((detail, index) => {
        if (detail.execStatus === 'P') {
          // 随机完成一些任务
          if (Math.random() > 0.5) {
            // 第一个资源强制失败（用于测试重试功能），其余随机
            if (index === 0) {
              detail.execStatus = 'F'
              detail.endTime = new Date().toISOString()
              detail.errorMsg = '执行失败: 连接超时'
            } else {
              detail.execStatus = Math.random() > 0.2 ? 'S' : 'F'
              detail.endTime = new Date().toISOString()
              if (detail.execStatus === 'F') {
                detail.errorMsg = '执行失败: 连接超时'
              }
            }
          } else {
            allCompleted = false
          }
        }
      })
      
      // 更新统计
      currentExecution.value.successCount = details.filter(d => d.execStatus === 'S').length
      const failedCount = details.filter(d => d.execStatus === 'F').length
      
      if (allCompleted) {
        // 所有任务完成
        currentExecution.value.execStatus = failedCount === 0 ? 'S' : (failedCount === details.length ? 'F' : 'P')
        currentExecution.value.endTime = new Date().toISOString()
        
        // 同步更新历史记录
        const historyRecord = executionHistory.value.find(h => h.id === currentExecution.value!.operateId)
        if (historyRecord) {
          historyRecord.execStatus = currentExecution.value.execStatus
          historyRecord.successCount = currentExecution.value.successCount
          historyRecord.endTime = currentExecution.value.endTime
          historyRecord.status = failedCount === 0 ? 'success' : (failedCount === details.length ? 'failed' : 'running')
          historyRecord.details = details.map(d => ({ ...d }))
        }
        
        // 同步更新最近执行
        const recentRecord = recentExecutions.value.find(r => r.id === currentExecution.value!.operateId)
        if (recentRecord) {
          recentRecord.execStatus = currentExecution.value.execStatus
          recentRecord.successCount = currentExecution.value.successCount
          recentRecord.endTime = currentExecution.value.endTime
          recentRecord.status = failedCount === 0 ? 'success' : (failedCount === details.length ? 'failed' : 'running')
        }
        
        // 停止轮询
        if (executionPolling.value) {
          clearInterval(executionPolling.value)
          executionPolling.value = null
        }
      }
    }, 2000)
  }

  // 停止轮询
  const stopExecutionPolling = () => {
    if (executionPolling.value) {
      clearInterval(executionPolling.value)
      executionPolling.value = null
    }
  }

  // 重新执行
  const handleRetryExecution = () => {
    executionStep.value = 1
    currentExecution.value = null
    stopExecutionPolling()
  }

  // 关闭弹窗
  const handleCloseExecutionDialog = () => {
    showParamDialog.value = false
    executionStep.value = 1
    currentExecution.value = null
    stopExecutionPolling()
  }

  // 打开执行历史抽屉
  const handleOpenHistoryDrawer = () => {
    showHistoryDrawer.value = true
    // 如果列表为空，从 executionHistory 加载；否则保留已有数据（包括模拟数据）
    if (historyDrawerList.value.length === 0) {
      historyDrawerList.value = [...executionHistory.value]
    }
  }

  // 关闭执行历史抽屉
  const handleCloseHistoryDrawer = () => {
    showHistoryDrawer.value = false
  }

  // 切换历史记录展开状态
  const toggleHistoryExpand = (recordId: string) => {
    const index = expandedHistoryIds.value.indexOf(recordId)
    if (index > -1) {
      expandedHistoryIds.value.splice(index, 1)
    } else {
      expandedHistoryIds.value.push(recordId)
    }
  }

  // 切换明细展开状态
  const toggleDetailExpand = (detailId: string) => {
    const index = expandedDetailIds.value.indexOf(detailId)
    if (index > -1) {
      expandedDetailIds.value.splice(index, 1)
    } else {
      expandedDetailIds.value.push(detailId)
    }
  }

  // 从弹窗跳转到历史抽屉
  const handleViewHistory = () => {
    showParamDialog.value = false
    handleOpenHistoryDrawer()
  }

  // 刷新历史记录
  const handleRefreshHistory = () => {
    historyDrawerList.value = [...executionHistory.value]
    ElMessage.success('已刷新')
  }

  // 重新执行（从历史抽屉）
  const handleRetryFromHistory = (record: ExecutionRecord) => {
    ElMessage.info(`重新执行: ${record.name}`)
    // TODO: 实现重新执行逻辑
  }

  // 查看资源详情
  const handleViewResourceDetail = (detail: ExecutionDetail) => {
    ElMessage.info(`查看资源详情: ${detail.pkDisplay}`)
  }

  // 计算属性：过滤后的历史抽屉列表
  const filteredHistoryDrawerList = computed(() => {
    let filtered = [...historyDrawerList.value]
    
    // 时间范围过滤
    if (historyDrawerFilter.value.timeRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (historyDrawerFilter.value.timeRange === 'today') {
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= today
        })
      } else if (historyDrawerFilter.value.timeRange === '7days') {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= sevenDaysAgo
        })
      } else if (historyDrawerFilter.value.timeRange === '30days') {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= thirtyDaysAgo
        })
      }
    }
    
    // 状态过滤
    if (historyDrawerFilter.value.status) {
      filtered = filtered.filter(record => record.status === historyDrawerFilter.value.status)
    }
    
    // 关键词过滤
    if (historyDrawerFilter.value.keyword) {
      const keyword = historyDrawerFilter.value.keyword.toLowerCase()
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(keyword)
      )
    }
    
    return filtered
  })

  // 辅助函数：获取历史记录状态类型
  const getHistoryStatusType = (status: string) => {
    const map: Record<string, string> = {
      success: 'success',
      failed: 'danger',
      running: 'warning',
      cancelled: 'info'
    }
    return map[status] || 'info'
  }

  // 辅助函数：获取历史记录状态文本
  const getHistoryStatusText = (record: ExecutionRecord) => {
    if (record.status === 'running') {
      return `执行中 (${record.successCount}/${record.totalCount})`
    } else if (record.status === 'success') {
      return `全部成功 (${record.successCount}/${record.totalCount})`
    } else if (record.status === 'failed') {
      const failedCount = record.totalCount - record.successCount
      return `失败 (${failedCount}/${record.totalCount})`
    }
    return '未知'
  }

  // 辅助函数：格式化历史记录时间
  const formatHistoryTime = (time: string) => {
    const date = new Date(time)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const timeStr = date.toTimeString().slice(0, 8)
    
    if (recordDate.getTime() === today.getTime()) {
      return `今天 ${timeStr}`
    } else if (recordDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return `昨天 ${timeStr}`
    } else {
      return `${date.toLocaleDateString()} ${timeStr}`
    }
  }

  // 辅助函数：获取第一条错误信息
  const getFirstError = (record: ExecutionRecord): string => {
    const failedDetail = record.details.find(d => d.execStatus === 'F')
    return failedDetail?.errorMsg || '未知错误'
  }

  // 辅助函数：获取明细状态样式类
  const getDetailStatusClass = (status: ExecutionDetailStatus): string => {
    const map: Record<ExecutionDetailStatus, string> = {
      S: 'status-success',
      F: 'status-failed',
      P: 'status-pending',
      R: 'status-running'
    }
    return map[status] || 'status-pending'
  }

  // 辅助函数：获取明细状态图标
  const getDetailStatusIcon = (status: ExecutionDetailStatus): string => {
    const map: Record<ExecutionDetailStatus, string> = {
      S: 'CircleCheck',
      F: 'CircleClose',
      P: 'Clock',
      R: 'Loading'
    }
    return map[status] || 'Clock'
  }

  // ============ 编排执行历史管理 ============
  
  // 打开编排执行历史抽屉
  const handleOpenOrchestrationHistoryDrawer = () => {
    historyDrawerActiveTab.value = 'orchestration'
    showHistoryDrawer.value = true
    if (orchestrationHistoryDrawerList.value.length === 0) {
      orchestrationHistoryDrawerList.value = [...orchestrationHistory.value]
    }
  }

  // 关闭编排执行历史抽屉
  const handleCloseOrchestrationHistoryDrawer = () => {
    showHistoryDrawer.value = false
  }

  // 切换编排历史记录展开状态
  const toggleOrchestrationHistoryExpand = (recordId: string) => {
    const index = expandedOrchestrationHistoryIds.value.indexOf(recordId)
    if (index > -1) {
      expandedOrchestrationHistoryIds.value.splice(index, 1)
    } else {
      expandedOrchestrationHistoryIds.value.push(recordId)
    }
  }

  // 编排重新执行
  const handleOrchestrationRetry = (record: OrchestrationExecutionRecord) => {
    ElMessage.info(`重新执行编排: ${record.name}`)
    // TODO: 实现重新执行逻辑
  }

  // 查看编排作业详情
  const handleOrchestrationViewDetail = (job: OrchestrationJob) => {
    ElMessage.info(`查看作业详情: ${job.jobName}`)
  }

  // 计算属性：过滤后的编排历史抽屉列表
  const filteredOrchestrationHistoryDrawerList = computed(() => {
    let filtered = [...orchestrationHistoryDrawerList.value]
    
    // 时间范围过滤
    if (orchestrationHistoryDrawerFilter.value.timeRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (orchestrationHistoryDrawerFilter.value.timeRange === 'today') {
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= today
        })
      } else if (orchestrationHistoryDrawerFilter.value.timeRange === '7days') {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= sevenDaysAgo
        })
      } else if (orchestrationHistoryDrawerFilter.value.timeRange === '30days') {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= thirtyDaysAgo
        })
      }
    }
    
    // 状态过滤
    if (orchestrationHistoryDrawerFilter.value.status) {
      filtered = filtered.filter(record => record.status === orchestrationHistoryDrawerFilter.value.status)
    }
    
    // 关键词过滤
    if (orchestrationHistoryDrawerFilter.value.keyword) {
      const keyword = orchestrationHistoryDrawerFilter.value.keyword.toLowerCase()
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(keyword)
      )
    }
    
    return filtered
  })

  // 辅助函数：获取编排历史记录状态类型
  const getOrchestrationStatusType = (status: OrchestrationExecutionStatus) => {
    const map: Record<OrchestrationExecutionStatus, string> = {
      success: 'success',
      failed: 'danger',
      running: 'warning',
      pending: 'info',
      terminated: 'info'
    }
    return map[status] || 'info'
  }

  // 辅助函数：获取编排历史记录状态文本
  const getOrchestrationStatusText = (record: OrchestrationExecutionRecord) => {
    const statusMap: Record<OrchestrationExecutionStatus, string> = {
      success: '成功',
      failed: '失败',
      running: '执行中',
      pending: '初始化',
      terminated: '执行终止'
    }
    return statusMap[record.status] || '未知'
  }

  // 辅助函数：格式化编排历史时间
  const formatOrchestrationHistoryTime = (timeStr: string): string => {
    const time = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return time.toLocaleDateString('zh-CN')
  }

  // 辅助函数：获取编排第一条错误信息
  const getOrchestrationFirstError = (record: OrchestrationExecutionRecord): string => {
    const failedJob = record.jobs.find(j => j.status === 'failed')
    return failedJob ? `作业 ${failedJob.jobName} 执行失败` : '未知错误'
  }

  // 导出编排历史记录
  const handleExportOrchestrationHistory = () => {
    const data = filteredOrchestrationHistoryDrawerList.value
    const csv = [
      ['编排名称', '应用系统', '提交人', '总作业数', '状态', '执行时间'].join(','),
      ...data.map(record => [
        record.name,
        record.appSystem,
        record.submitter,
        record.totalJobCount,
        getOrchestrationStatusText(record),
        record.executeTime
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `编排执行历史_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    ElMessage.success('导出成功')
  }

  // 批量重试编排失败记录
  const handleBatchRetryOrchestrationFailed = () => {
    const failedRecords = filteredOrchestrationHistoryDrawerList.value.filter(r => r.status === 'failed')
    if (failedRecords.length === 0) {
      ElMessage.warning('没有失败的记录可以重试')
      return
    }
    
    ElMessageBox.confirm(
      `确定要重试 ${failedRecords.length} 条失败记录吗？`,
      '批量重试',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(() => {
      ElMessage.success(`已开始重试 ${failedRecords.length} 条记录`)
      // TODO: 实现批量重试逻辑
    }).catch(() => {
      // 用户取消
    })
  }

  // 最近执行状态栏辅助函数
  const getRecentStatusIcon = (status: string) => {
    const map: Record<string, string> = {
      success: 'CircleCheckFilled',
      failed: 'CircleCloseFilled',
      running: 'Loading'
    }
    return map[status] || 'Clock'
  }

  const getRecentStatusType = (status: string) => {
    const map: Record<string, string> = {
      success: 'success',
      failed: 'danger',
      running: 'warning'
    }
    return map[status] || 'info'
  }

  const getRecentStatusText = (execution: any) => {
    if (execution.status === 'running') {
      return `执行中 (${execution.successCount}/${execution.totalCount})`
    } else if (execution.status === 'success') {
      return `全部成功 (${execution.successCount}/${execution.totalCount})`
    } else if (execution.status === 'failed') {
      const failedCount = execution.totalCount - execution.successCount
      return `失败 (${failedCount}/${execution.totalCount})`
    }
    return '未知'
  }

  const handleRecentExecutionClick = (execution: any) => {
    // 将执行记录添加到历史抽屉并打开
    const exists = historyDrawerList.value.find(h => h.id === execution.id)
    if (!exists) {
      historyDrawerList.value.unshift({
        id: execution.id,
        name: execution.name,
        executeTime: execution.executeTime,
        status: execution.status,
        totalCount: execution.totalCount,
        successCount: execution.successCount,
        duration: execution.duration,
        details: execution.details
      })
    }
    handleOpenHistoryDrawer()
  }

  const dismissRecentExecution = (id: string) => {
    recentExecutions.value = recentExecutions.value.filter(e => e.id !== id)
  }

  const dismissRecentOrchestrationExecution = (id: string) => {
    recentOrchestrationExecutions.value = recentOrchestrationExecutions.value.filter(e => e.id !== id)
  }

  // 导出执行历史
  const handleExportHistory = () => {
    const data = filteredHistoryDrawerList.value.map(record => ({
      '操作名称': record.name,
      '执行时间': record.executeTime,
      '状态': record.status === 'success' ? '成功' : record.status === 'failed' ? '失败' : '执行中',
      '资源总数': record.totalCount,
      '成功数': record.successCount,
      '耗时(秒)': record.duration?.toFixed(1) || '-'
    }))

    // 转换为CSV
    const headers = Object.keys(data[0] || {})
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n')

    // 下载
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `执行历史_${new Date().toLocaleDateString()}.csv`
    link.click()
    
    ElMessage.success('导出成功')
  }

  // 批量重新执行失败项
  const handleBatchRetryFailed = () => {
    const failedRecords = filteredHistoryDrawerList.value.filter(r => r.status === 'failed')
    if (failedRecords.length === 0) {
      ElMessage.warning('没有失败的执行记录')
      return
    }

    ElMessageBox.confirm(
      `确定要重新执行 ${failedRecords.length} 个失败的记录吗？`,
      '批量重新执行',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      failedRecords.forEach(record => {
        // 模拟重新执行
        record.status = 'running'
        record.successCount = 0
        
        // 模拟执行过程
        setTimeout(() => {
          record.status = 'success'
          record.successCount = record.totalCount
          ElMessage.success(`${record.name} 重新执行成功`)
        }, 2000)
      })
      
      ElMessage.success('已提交批量重新执行')
    }).catch(() => {})
  }

  const handleScenarioClick = (scenario: Scenario) => {
    ElMessage.info(`点击场景: ${scenario.name}`)
  }

  const handleScenarioCommand = (command: { id: string; action: string }, scenario?: Scenario) => {
    if (command.action === 'edit' && scenario) {
      const newDraft: ScenarioDraft = {
        id: `sd_${Date.now()}`,
        name: scenario.name + '（编辑中）',
        saveTime: new Date().toLocaleString(),
        sourceScenarioId: scenario.id,
        status: 'draft'
      }
      scenarioDrafts.value.push(newDraft)
      ElMessage.success('已创建草稿，可在"我的草稿"中查看')
    } else if (command.action === 'viewDraft' && scenario) {
      const draft = getScenarioEditingDraft(scenario.id)
      if (draft) {
        activeScenarioTab.value = 'draft'
        ElMessage.info('已切换到草稿视图')
      }
    } else {
      ElMessage.info(`场景操作: ${command.action}`)
    }
  }

  const handleScenarioDraftCommand = (command: { action: string }, draft: ScenarioDraft) => {
    switch (command.action) {
      case 'publish':
        ElMessageBox.confirm(
          `确定要发布草稿"${draft.name}"吗？`,
          '确认发布',
          {
            confirmButtonText: '发布',
            cancelButtonText: '取消',
            type: 'info'
          }
        ).then(() => {
          scenarioDrafts.value = scenarioDrafts.value.filter(d => d.id !== draft.id)
          ElMessage.success('发布成功')
        }).catch(() => {
          ElMessage.info('已取消发布')
        })
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
          const draftIndex = scenarioDrafts.value.findIndex(d => d.id === draft.id)
          if (draftIndex !== -1) {
            scenarioDrafts.value[draftIndex] = { ...draft, status: 'draft', batchId: undefined }
            ElMessage.success('追回成功')
          }
        }).catch(() => {
          ElMessage.info('已取消追回')
        })
        break
      case 'edit':
        ElMessage.info(`编辑草稿: ${draft.name}`)
        break
      case 'delete':
        ElMessageBox.confirm(
          `确定要删除草稿"${draft.name}"吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          scenarioDrafts.value = scenarioDrafts.value.filter(d => d.id !== draft.id)
          ElMessage.success('删除成功')
        }).catch(() => {
          ElMessage.info('已取消删除')
        })
        break
      case 'viewBatch':
        ElMessage.info(`查看发布状态: ${draft.name}`)
        break
    }
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

  const handleToggleFavorite = async (operation: OperationComponent) => {
    const newStatus = await toggleFavorite(operation.id)
    operations.value = operations.value.map(op => 
      op.id === operation.id ? { ...op, isFavorite: newStatus } : op
    )
    ElMessage.success(newStatus ? '已收藏' : '已取消收藏')
  }

  const initParamForm = (config: ParamField[]) => {
    paramForm.value = {}
    paramFormRules.value = {}
    
    config.forEach(field => {
      if (field.type === 'checkbox') {
        paramForm.value[field.field] = field.defaultValue || []
      } else {
        paramForm.value[field.field] = field.defaultValue || ''
      }
      
      if (field.required) {
        paramFormRules.value[field.field] = {
          required: true,
          message: `请输入${field.label}`,
          trigger: field.type === 'select' || field.type === 'checkbox' ? 'change' : 'blur'
        }
      }
    })
  }

  // ============ 执行结果辅助函数 ============
  const getExecutionResultStatusType = createStatusMapper(
    { S: 'success', F: 'danger', P: 'warning', R: 'info' }, 'info'
  )
  const getExecutionResultStatusText = createStatusMapper(
    { S: '全部成功', F: '全部失败', P: '部分成功', R: '执行中' }, '未知'
  )
  const getDetailStatusType = getExecutionResultStatusType
  const getDetailStatusText = createStatusMapper(
    { S: '成功', F: '失败', P: '执行中', R: '等待中' }, '未知'
  )

  const calcExecutionDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const duration = Math.floor((end - start) / 1000)
    if (duration < 60) {
      return `${duration}秒`
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}分${duration % 60}秒`
    } else {
      return `${Math.floor(duration / 3600)}时${Math.floor((duration % 3600) / 60)}分`
    }
  }

  const handleViewDetail = (row: any) => {
    ElMessage.info(`查看详情: ${row.pkDisplay}`)
  }

  const handleRetrySingleResource = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定要重试资源 "${row.pkDisplay}" 吗？`,
        '重试确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      row.execStatus = 'P'
      row.startTime = new Date().toISOString()
      row.endTime = null
      row.errorMsg = null
      
      ElMessage.info(`开始重试资源: ${row.pkDisplay}`)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const isSuccess = Math.random() > 0.2
      
      if (isSuccess) {
        row.execStatus = 'S'
        row.endTime = new Date().toISOString()
        ElMessage.success(`资源 ${row.pkDisplay} 重试成功`)
      } else {
        row.execStatus = 'F'
        row.endTime = new Date().toISOString()
        row.errorMsg = '重试失败: 连接超时'
        ElMessage.error(`资源 ${row.pkDisplay} 重试失败`)
      }
      
      if (currentExecution.value) {
        currentExecution.value.successCount = currentExecution.value.details.filter(d => d.execStatus === 'S').length
        const failedCount = currentExecution.value.details.filter(d => d.execStatus === 'F').length
        
        if (failedCount === 0) {
          currentExecution.value.execStatus = 'S'
        } else if (currentExecution.value.successCount === 0) {
          currentExecution.value.execStatus = 'F'
        } else {
          currentExecution.value.execStatus = 'P'
        }
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('重试操作失败')
      }
    }
  }

  const handleBackToParamConfig = () => {
    executionStep.value = 1
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
    // 两步式执行弹窗
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
    
    // 计算属性
    categories,
    subcategories,
    filteredOperations,
    favoriteCategories,
    favoriteOperations,
    customOperations,
    filteredScenarios,
    filteredHistory,
    filteredResources,
    
    // 辅助方法
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
    initParamForm,
    
    // 事件处理
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
  }
}
