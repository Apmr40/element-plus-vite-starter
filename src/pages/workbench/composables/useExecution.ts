import type { FormInstance, FormRules } from 'element-plus'
import type {
  ExecutionDetail,
  ExecutionDetailStatus,
  ExecutionRecord,
  OperationComponent,
  OrchestrationExecutionRecord,
  OrchestrationExecutionStatus,
  OrchestrationJob,
  ParamField,
} from '~/demo/types/workbench'
import { ElMessage, ElMessageBox } from 'element-plus'
/**
 * 操作工作台 - 执行域 composable
 *
 * 职责：两步式执行弹窗（参数配置→执行结果轮询）、执行历史抽屉（组件/编排双Tab）、
 * 最近执行状态栏、资源选择。
 *
 * 执行历史初始数据来自 mock 层（~/demo/mock/workbench-extra）。
 */
import { computed, ref } from 'vue'
import { getExecutionHistory } from '~/demo/api/workbench'
import {
  createMockHistoryData,
  createMockOrchestrationHistory,
  createMockRecentExecutions,
} from '~/demo/mock/workbench-extra'
import { createStatusMapper } from './utils'

export function useExecution() {
  // ============ 执行历史 ============
  const executionHistory = ref<ExecutionRecord[]>([])
  const showExecutionHistory = ref<boolean>(false)
  const historyFilter = ref({
    status: '',
    type: '',
    keyword: '',
  })

  // ============ 编排执行历史 ============
  const orchestrationHistory = ref<OrchestrationExecutionRecord[]>([])

  // ============ 执行历史抽屉 ============
  const showHistoryDrawer = ref<boolean>(false)
  const historyDrawerList = ref<ExecutionRecord[]>([])
  const historyDrawerFilter = ref({
    timeRange: 'today',
    status: '',
    keyword: '',
  })
  const expandedHistoryIds = ref<string[]>([])
  const expandedDetailIds = ref<string[]>([])

  // ============ 编排执行历史抽屉 ============
  const showOrchestrationHistoryDrawer = ref<boolean>(false)
  const orchestrationHistoryDrawerList = ref<OrchestrationExecutionRecord[]>([])
  const orchestrationHistoryDrawerFilter = ref({
    timeRange: 'today',
    status: '',
    keyword: '',
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
  const executionStep = ref<1 | 2>(1)
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
  const executionPolling = ref<ReturnType<typeof setInterval> | null>(null)

  // ============ 资源选择 ============
  const resourceForm = ref({
    datacenter: '',
    cluster: '',
    namespace: '',
    deployment: '',
  })
  const resourceSearchKeyword = ref<string>('')

  // ============ 级联选项数据 ============
  const datacenterOptions = ref([
    { value: 'bj-test', label: '测试环境北京' },
    { value: 'sh-test', label: '测试环境上海' },
    { value: 'bj-prod', label: '生产环境北京' },
  ])
  const clusterOptions = ref([
    { value: 'hqxt-ccedt-pfmt-a-arm', label: 'hqxt-ccedt-pfmt-a-arm' },
    { value: 'hqxt-ccedt-pfmt-b-arm', label: 'hqxt-ccedt-pfmt-b-arm' },
  ])
  const namespaceOptions = ref([
    { value: 'apida', label: 'apida' },
    { value: 'apida-test', label: 'apida-test' },
    { value: 'default', label: 'default' },
  ])
  const deploymentOptions = ref([
    { value: 'apism-batch-dev', label: 'apism-batch-dev' },
    { value: 'apism-api-dev', label: 'apism-api-dev' },
    { value: 'apism-web-dev', label: 'apism-web-dev' },
  ])

  // ============ 资源列表（POD）============
  const resourceList = ref([
    { name: 'apism-batch-dev-684f65df5c-zrph8', ip: '172.16.197.247', status: 'Running' },
    { name: 'apism-batch-dev-684f65df5c-xk9p2', ip: '172.16.197.248', status: 'Running' },
    { name: 'apism-batch-dev-684f65df5c-m3n7q', ip: '172.16.197.249', status: 'Pending' },
  ])

  // ============ 计算属性 ============
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
        record.name.toLowerCase().includes(historyFilter.value.keyword.toLowerCase()),
      )
    }

    return filtered
  })

  const filteredResources = computed(() => {
    if (!resourceSearchKeyword.value)
      return resourceList.value
    const keyword = resourceSearchKeyword.value.toLowerCase()
    return resourceList.value.filter(r =>
      r.name.toLowerCase().includes(keyword)
      || r.ip.includes(keyword),
    )
  })

  // 过滤后的历史抽屉列表
  const filteredHistoryDrawerList = computed(() => {
    let filtered = [...historyDrawerList.value]

    if (historyDrawerFilter.value.timeRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      if (historyDrawerFilter.value.timeRange === 'today') {
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= today
        })
      }
      else if (historyDrawerFilter.value.timeRange === '7days') {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= sevenDaysAgo
        })
      }
      else if (historyDrawerFilter.value.timeRange === '30days') {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= thirtyDaysAgo
        })
      }
    }

    if (historyDrawerFilter.value.status) {
      filtered = filtered.filter(record => record.status === historyDrawerFilter.value.status)
    }

    if (historyDrawerFilter.value.keyword) {
      const keyword = historyDrawerFilter.value.keyword.toLowerCase()
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(keyword),
      )
    }

    return filtered
  })

  // 过滤后的编排历史抽屉列表
  const filteredOrchestrationHistoryDrawerList = computed(() => {
    let filtered = [...orchestrationHistoryDrawerList.value]

    if (orchestrationHistoryDrawerFilter.value.timeRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      if (orchestrationHistoryDrawerFilter.value.timeRange === 'today') {
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= today
        })
      }
      else if (orchestrationHistoryDrawerFilter.value.timeRange === '7days') {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= sevenDaysAgo
        })
      }
      else if (orchestrationHistoryDrawerFilter.value.timeRange === '30days') {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter((record) => {
          const recordDate = new Date(record.executeTime)
          return recordDate >= thirtyDaysAgo
        })
      }
    }

    if (orchestrationHistoryDrawerFilter.value.status) {
      filtered = filtered.filter(record => record.status === orchestrationHistoryDrawerFilter.value.status)
    }

    if (orchestrationHistoryDrawerFilter.value.keyword) {
      const keyword = orchestrationHistoryDrawerFilter.value.keyword.toLowerCase()
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(keyword),
      )
    }

    return filtered
  })

  // ============ 数据加载 ============
  const loadExecutionData = async () => {
    // 加载 API 执行历史
    executionHistory.value = await getExecutionHistory()

    // 加载 mock 数据
    recentExecutions.value = createMockRecentExecutions()

    const mockOrchHistory = createMockOrchestrationHistory()
    orchestrationHistoryDrawerList.value = mockOrchHistory
    recentOrchestrationExecutions.value = mockOrchHistory.slice(0, 2)

    const mockHistory = createMockHistoryData()
    historyDrawerList.value = [...mockHistory, ...executionHistory.value]
  }

  // ============ 资源选择 ============
  const handleDatacenterChange = (_value: string) => {
    resourceForm.value.cluster = ''
    resourceForm.value.namespace = ''
    resourceForm.value.deployment = ''
  }

  const handleClusterChange = (_value: string) => {
    resourceForm.value.namespace = ''
    resourceForm.value.deployment = ''
  }

  const handleNamespaceChange = (_value: string) => {
    resourceForm.value.deployment = ''
  }

  const handleDeploymentChange = (_value: string) => {
    // Deployment changed
  }

  // ============ 参数表单 ============
  const initParamForm = (config: ParamField[]) => {
    paramForm.value = {}
    paramFormRules.value = {}

    config.forEach((field) => {
      if (field.type === 'checkbox') {
        paramForm.value[field.field] = field.defaultValue || []
      }
      else {
        paramForm.value[field.field] = field.defaultValue || ''
      }

      if (field.required) {
        paramFormRules.value[field.field] = {
          required: true,
          message: `请输入${field.label}`,
          trigger: field.type === 'select' || field.type === 'checkbox' ? 'change' : 'blur',
        }
      }
    })
  }

  // ============ 操作点击 → 打开执行弹窗 ============
  const handleOperationClick = (operation: OperationComponent) => {
    currentExecuteId.value = operation.id
    currentOperation.value = operation
    paramDialogTitle.value = `执行操作 - ${operation.name}`
    currentParamConfig.value = operation.paramConfig
    initParamForm(operation.paramConfig)
    resourceForm.value = { datacenter: '', cluster: '', namespace: '', deployment: '' }
    resourceSearchKeyword.value = ''
    executionStep.value = 1
    currentExecution.value = null
    showParamDialog.value = true
  }

  // ============ 提交执行 ============
  const handleSubmitExecution = async () => {
    if (!currentOperation.value)
      return

    executing.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const operateId = `OP${Date.now()}`
      const now = new Date()
      const startTime = now.toISOString()

      const selectedResources = resourceList.value.slice(0, 2)
      const details = selectedResources.map((res, index) => ({
        serviceSeqId: `${operateId}_${index}`,
        pkValue: res.name,
        pkDisplay: res.name,
        execStatus: 'P' as const,
        startTime,
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
        details,
      }

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
        details: details.map(d => ({ ...d })),
      }
      executionHistory.value.unshift(historyRecord)
      recentExecutions.value.unshift(historyRecord)
      if (recentExecutions.value.length > 5) {
        recentExecutions.value = recentExecutions.value.slice(0, 5)
      }

      executionStep.value = 2
      startExecutionPolling()

      ElMessage.success('执行已提交')
    }
    catch {
      ElMessage.error('提交执行失败')
    }
    finally {
      executing.value = false
    }
  }

  // ============ 轮询 ============
  function startExecutionPolling() {
    if (executionPolling.value) {
      clearInterval(executionPolling.value)
    }

    executionPolling.value = setInterval(() => {
      if (!currentExecution.value)
        return

      const details = currentExecution.value.details
      let allCompleted = true

      details.forEach((detail, index) => {
        if (detail.execStatus === 'P') {
          if (Math.random() > 0.5) {
            if (index === 0) {
              detail.execStatus = 'F'
              detail.endTime = new Date().toISOString()
              detail.errorMsg = '执行失败: 连接超时'
            }
            else {
              detail.execStatus = Math.random() > 0.2 ? 'S' : 'F'
              detail.endTime = new Date().toISOString()
              if (detail.execStatus === 'F') {
                detail.errorMsg = '执行失败: 连接超时'
              }
            }
          }
          else {
            allCompleted = false
          }
        }
      })

      currentExecution.value.successCount = details.filter(d => d.execStatus === 'S').length
      const failedCount = details.filter(d => d.execStatus === 'F').length

      if (allCompleted) {
        currentExecution.value.execStatus = failedCount === 0 ? 'S' : (failedCount === details.length ? 'F' : 'P')
        currentExecution.value.endTime = new Date().toISOString()

        const historyRecord = executionHistory.value.find(h => h.id === currentExecution.value!.operateId)
        if (historyRecord) {
          historyRecord.execStatus = currentExecution.value.execStatus
          historyRecord.successCount = currentExecution.value.successCount
          historyRecord.endTime = currentExecution.value.endTime
          historyRecord.status = failedCount === 0 ? 'success' : (failedCount === details.length ? 'failed' : 'running')
          historyRecord.details = details.map(d => ({ ...d }))
        }

        const recentRecord = recentExecutions.value.find(r => r.id === currentExecution.value!.operateId)
        if (recentRecord) {
          recentRecord.execStatus = currentExecution.value.execStatus
          recentRecord.successCount = currentExecution.value.successCount
          recentRecord.endTime = currentExecution.value.endTime
          recentRecord.status = failedCount === 0 ? 'success' : (failedCount === details.length ? 'failed' : 'running')
        }

        if (executionPolling.value) {
          clearInterval(executionPolling.value)
          executionPolling.value = null
        }
      }
    }, 2000)
  }

  const stopExecutionPolling = () => {
    if (executionPolling.value) {
      clearInterval(executionPolling.value)
      executionPolling.value = null
    }
  }

  const handleRetryExecution = () => {
    executionStep.value = 1
    currentExecution.value = null
    stopExecutionPolling()
  }

  const handleCloseExecutionDialog = () => {
    showParamDialog.value = false
    executionStep.value = 1
    currentExecution.value = null
    stopExecutionPolling()
  }

  const handleBackToParamConfig = () => {
    executionStep.value = 1
  }

  // ============ 执行历史抽屉 ============
  const handleOpenHistoryDrawer = () => {
    showHistoryDrawer.value = true
    if (historyDrawerList.value.length === 0) {
      historyDrawerList.value = [...executionHistory.value]
    }
  }

  const handleCloseHistoryDrawer = () => {
    showHistoryDrawer.value = false
  }

  const toggleHistoryExpand = (recordId: string) => {
    const index = expandedHistoryIds.value.indexOf(recordId)
    if (index > -1) {
      expandedHistoryIds.value.splice(index, 1)
    }
    else {
      expandedHistoryIds.value.push(recordId)
    }
  }

  const toggleDetailExpand = (detailId: string) => {
    const index = expandedDetailIds.value.indexOf(detailId)
    if (index > -1) {
      expandedDetailIds.value.splice(index, 1)
    }
    else {
      expandedDetailIds.value.push(detailId)
    }
  }

  const handleViewHistory = () => {
    showParamDialog.value = false
    handleOpenHistoryDrawer()
  }

  const handleRefreshHistory = () => {
    historyDrawerList.value = [...executionHistory.value]
    ElMessage.success('已刷新')
  }

  const handleRetryFromHistory = (record: ExecutionRecord) => {
    ElMessage.info(`重新执行: ${record.name}`)
  }

  // ============ 资源详情弹窗（《执行记录信息扩展-交互设计》§6，状态收敛）============
  const resourceDetailVisible = ref(false)
  const resourceDetail = ref<ExecutionDetail | null>(null)

  const handleViewResourceDetail = (detail: ExecutionDetail) => {
    resourceDetail.value = detail
    resourceDetailVisible.value = true
  }

  /** 单资源重试（demo 占位：toast 确认，无参数可改不打开执行弹窗） */
  const handleRetryDetail = (detail: ExecutionDetail) => {
    ElMessage.success(`已提交重试: ${detail.pkDisplay}`)
  }

  // ============ 编排执行历史抽屉 ============
  const handleOpenOrchestrationHistoryDrawer = () => {
    historyDrawerActiveTab.value = 'orchestration'
    showHistoryDrawer.value = true
    if (orchestrationHistoryDrawerList.value.length === 0) {
      orchestrationHistoryDrawerList.value = [...orchestrationHistory.value]
    }
  }

  const handleCloseOrchestrationHistoryDrawer = () => {
    showHistoryDrawer.value = false
  }

  const toggleOrchestrationHistoryExpand = (recordId: string) => {
    const index = expandedOrchestrationHistoryIds.value.indexOf(recordId)
    if (index > -1) {
      expandedOrchestrationHistoryIds.value.splice(index, 1)
    }
    else {
      expandedOrchestrationHistoryIds.value.push(recordId)
    }
  }

  const handleOrchestrationRetry = (record: OrchestrationExecutionRecord) => {
    ElMessage.info(`重新执行编排: ${record.name}`)
  }

  const handleOrchestrationViewDetail = (job: OrchestrationJob) => {
    ElMessage.info(`查看作业详情: ${job.jobName}`)
  }

  // ============ 最近执行状态栏 ============
  const handleRecentExecutionClick = (execution: any) => {
    const exists = historyDrawerList.value.find(h => h.id === execution.id)
    if (!exists) {
      historyDrawerList.value.unshift({
        id: execution.id,
        type: 'operation',
        name: execution.name,
        status: execution.status,
        operator: execution.operator || '当前用户',
        executeTime: execution.executeTime,
        totalCount: execution.totalCount,
        successCount: execution.successCount,
        duration: execution.duration,
        details: execution.details || [],
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

  // ============ 导出和批量操作 ============
  const handleExportHistory = () => {
    const data = filteredHistoryDrawerList.value.map(record => ({
      '操作名称': record.name,
      '执行时间': record.executeTime,
      '状态': record.status === 'success' ? '成功' : record.status === 'failed' ? '失败' : '执行中',
      '资源总数': record.totalCount,
      '成功数': record.successCount,
      '耗时(秒)': record.duration?.toFixed(1) || '-',
    }))

    const headers = Object.keys(data[0] || {})
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row as any)[h]}"`).join(',')),
    ].join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `执行历史_${new Date().toLocaleDateString()}.csv`
    link.click()

    ElMessage.success('导出成功')
  }

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
        type: 'warning',
      },
    ).then(() => {
      failedRecords.forEach((record) => {
        record.status = 'running'
        record.successCount = 0

        setTimeout(() => {
          record.status = 'success'
          record.successCount = record.totalCount
          ElMessage.success(`${record.name} 重新执行成功`)
        }, 2000)
      })

      ElMessage.success('已提交批量重新执行')
    }).catch(() => {})
  }

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
        record.executeTime,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `编排执行历史_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    ElMessage.success('导出成功')
  }

  const handleBatchRetryOrchestrationFailed = () => {
    const failedRecords = filteredOrchestrationHistoryDrawerList.value.filter(r => r.status === 'failed')
    if (failedRecords.length === 0) {
      ElMessage.warning('没有失败的记录可以重试')
      return
    }

    ElMessageBox.confirm(
      `确定要重试 ${failedRecords.length} 条失败记录吗？`,
      '批量重试',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    ).then(() => {
      ElMessage.success(`已开始重试 ${failedRecords.length} 条记录`)
    }).catch(() => {})
  }

  // ============ 执行结果辅助函数 ============
  const getExecutionResultStatusType = createStatusMapper(
    { S: 'success', F: 'danger', P: 'warning', R: 'info' },
    'info',
  )
  const getExecutionResultStatusText = createStatusMapper(
    { S: '全部成功', F: '全部失败', P: '部分成功', R: '执行中' },
    '未知',
  )
  const getDetailStatusType = getExecutionResultStatusType
  const getDetailStatusText = createStatusMapper(
    { S: '成功', F: '失败', P: '执行中', R: '等待中' },
    '未知',
  )

  const calcExecutionDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const duration = Math.floor((end - start) / 1000)
    if (duration < 60) {
      return `${duration}秒`
    }
    else if (duration < 3600) {
      return `${Math.floor(duration / 60)}分${duration % 60}秒`
    }
    else {
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
          type: 'warning',
        },
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
      }
      else {
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
        }
        else if (currentExecution.value.successCount === 0) {
          currentExecution.value.execStatus = 'F'
        }
        else {
          currentExecution.value.execStatus = 'P'
        }
      }
    }
    catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('重试操作失败')
      }
    }
  }

  // ============ 历史抽屉辅助函数 ============
  const getHistoryStatusType = (status: string) => {
    const map: Record<string, string> = {
      success: 'success',
      failed: 'danger',
      running: 'warning',
      cancelled: 'info',
    }
    return map[status] || 'info'
  }

  const getHistoryStatusText = (record: ExecutionRecord) => {
    if (record.status === 'running') {
      return `执行中 (${record.successCount}/${record.totalCount})`
    }
    else if (record.status === 'success') {
      return `全部成功 (${record.successCount}/${record.totalCount})`
    }
    else if (record.status === 'failed') {
      const failedCount = record.totalCount - record.successCount
      return `失败 (${failedCount}/${record.totalCount})`
    }
    return '未知'
  }

  const formatHistoryTime = (time: string) => {
    const date = new Date(time)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const timeStr = date.toTimeString().slice(0, 8)

    if (recordDate.getTime() === today.getTime()) {
      return `今天 ${timeStr}`
    }
    else if (recordDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return `昨天 ${timeStr}`
    }
    else {
      return `${date.toLocaleDateString()} ${timeStr}`
    }
  }

  const getFirstError = (record: ExecutionRecord): string => {
    const failedDetail = record.details.find(d => d.execStatus === 'F')
    return failedDetail?.errorMsg || '未知错误'
  }

  const getDetailStatusClass = (status: ExecutionDetailStatus): string => {
    const map: Record<ExecutionDetailStatus, string> = {
      S: 'status-success',
      F: 'status-failed',
      P: 'status-pending',
      R: 'status-running',
    }
    return map[status] || 'status-pending'
  }

  const getDetailStatusIcon = (status: ExecutionDetailStatus): string => {
    const map: Record<ExecutionDetailStatus, string> = {
      S: 'CircleCheck',
      F: 'CircleClose',
      P: 'Clock',
      R: 'Loading',
    }
    return map[status] || 'Clock'
  }

  // ============ 编排历史辅助函数 ============
  const getOrchestrationStatusType = (status: OrchestrationExecutionStatus) => {
    const map: Record<OrchestrationExecutionStatus, string> = {
      success: 'success',
      failed: 'danger',
      running: 'warning',
      pending: 'info',
      terminated: 'info',
    }
    return map[status] || 'info'
  }

  function getOrchestrationStatusText(record: OrchestrationExecutionRecord) {
    const statusMap: Record<OrchestrationExecutionStatus, string> = {
      success: '成功',
      failed: '失败',
      running: '执行中',
      pending: '初始化',
      terminated: '执行终止',
    }
    return statusMap[record.status] || '未知'
  }

  const formatOrchestrationHistoryTime = (timeStr: string): string => {
    const time = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1)
      return '刚刚'
    if (minutes < 60)
      return `${minutes}分钟前`
    if (hours < 24)
      return `${hours}小时前`
    if (days < 7)
      return `${days}天前`
    return time.toLocaleDateString('zh-CN')
  }

  const getOrchestrationFirstError = (record: OrchestrationExecutionRecord): string => {
    const failedJob = record.jobs.find(j => j.status === 'failed')
    return failedJob ? `作业 ${failedJob.jobName} 执行失败` : '未知错误'
  }

  // ============ 最近执行状态栏辅助函数 ============
  const getRecentStatusIcon = (status: string) => {
    const map: Record<string, string> = {
      success: 'CircleCheckFilled',
      failed: 'CircleCloseFilled',
      running: 'Loading',
    }
    return map[status] || 'Clock'
  }

  const getRecentStatusType = (status: string) => {
    const map: Record<string, string> = {
      success: 'success',
      failed: 'danger',
      running: 'warning',
    }
    return map[status] || 'info'
  }

  const getRecentStatusText = (execution: any) => {
    if (execution.status === 'running') {
      return `执行中 (${execution.successCount}/${execution.totalCount})`
    }
    else if (execution.status === 'success') {
      return `全部成功 (${execution.successCount}/${execution.totalCount})`
    }
    else if (execution.status === 'failed') {
      const failedCount = execution.totalCount - execution.successCount
      return `失败 (${failedCount}/${execution.totalCount})`
    }
    return '未知'
  }

  // ============ AI 诊断 ============
  const showDiagnosticPanel = ref(false)
  const diagnosticRecordId = ref('')
  const diagnosticOperationName = ref('')
  const diagnosticOperationCategory = ref('')
  const diagnosticFailedResources = ref<Array<{
    pk: string
    pkDisplay: string
    errorMsg: string
  }>>([])

  const openDiagnostic = (record: any) => {
    diagnosticRecordId.value = record.id
    diagnosticOperationName.value = record.name || '未知操作'

    const parts = (record.name || '').split('::')
    diagnosticOperationCategory.value = parts[0]?.trim() || record.module || '未知'

    const failed = (record.details || []).filter((d: any) => d.execStatus === 'F' || d.execStatus === 'failed')
    diagnosticFailedResources.value = failed.map((d: any) => ({
      pk: d.pkValue || d.pk || d.pkDisplay || '',
      pkDisplay: d.pkDisplay || d.pkValue || '',
      errorMsg: d.errorMsg || '执行失败',
    }))

    showDiagnosticPanel.value = true
  }

  /**
   * 单资源 AI 诊断（Q5）：与 openDiagnostic(record) 独立——
   * 后者接收整条记录并内部过滤全部失败资源，行级入口仅传该资源。
   */
  const openDiagnosticForDetail = (record: ExecutionRecord, detail: ExecutionDetail) => {
    diagnosticRecordId.value = record.id
    diagnosticOperationName.value = record.name || '未知操作'

    const parts = (record.name || '').split('::')
    diagnosticOperationCategory.value = parts[0]?.trim() || '未知'

    diagnosticFailedResources.value = [{
      pk: detail.pkValue || detail.pkDisplay || '',
      pkDisplay: detail.pkDisplay || detail.pkValue || '',
      errorMsg: detail.errorMsg || '执行失败',
    }]

    showDiagnosticPanel.value = true
  }

  return {
    // 状态
    executionHistory,
    showExecutionHistory,
    historyFilter,
    orchestrationHistory,
    showHistoryDrawer,
    historyDrawerList,
    historyDrawerFilter,
    expandedHistoryIds,
    expandedDetailIds,
    showOrchestrationHistoryDrawer,
    orchestrationHistoryDrawerList,
    orchestrationHistoryDrawerFilter,
    expandedOrchestrationHistoryIds,
    historyDrawerActiveTab,
    recentExecutions,
    recentOrchestrationExecutions,
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
    resourceForm,
    resourceSearchKeyword,
    datacenterOptions,
    clusterOptions,
    namespaceOptions,
    deploymentOptions,
    resourceList,
    // 计算属性
    filteredHistory,
    filteredResources,
    filteredHistoryDrawerList,
    filteredOrchestrationHistoryDrawerList,
    // 数据加载
    loadExecutionData,
    // 资源选择
    handleDatacenterChange,
    handleClusterChange,
    handleNamespaceChange,
    handleDeploymentChange,
    // 执行弹窗
    initParamForm,
    handleOperationClick,
    handleSubmitExecution,
    handleRetryExecution,
    handleCloseExecutionDialog,
    handleBackToParamConfig,
    // 执行历史抽屉
    handleOpenHistoryDrawer,
    handleCloseHistoryDrawer,
    toggleHistoryExpand,
    toggleDetailExpand,
    handleViewHistory,
    handleRefreshHistory,
    handleRetryFromHistory,
    handleViewResourceDetail,
    resourceDetailVisible,
    resourceDetail,
    handleRetryDetail,
    openDiagnosticForDetail,
    // 编排执行历史抽屉
    handleOpenOrchestrationHistoryDrawer,
    handleCloseOrchestrationHistoryDrawer,
    toggleOrchestrationHistoryExpand,
    handleOrchestrationRetry,
    handleOrchestrationViewDetail,
    // 最近执行状态栏
    handleRecentExecutionClick,
    dismissRecentExecution,
    dismissRecentOrchestrationExecution,
    // 导出和批量操作
    handleExportHistory,
    handleBatchRetryFailed,
    handleExportOrchestrationHistory,
    handleBatchRetryOrchestrationFailed,
    // 执行结果辅助函数
    getExecutionResultStatusType,
    getExecutionResultStatusText,
    getDetailStatusType,
    getDetailStatusText,
    calcExecutionDuration,
    handleViewDetail,
    handleRetrySingleResource,
    // 历史抽屉辅助函数
    getHistoryStatusType,
    getHistoryStatusText,
    formatHistoryTime,
    getFirstError,
    getDetailStatusClass,
    getDetailStatusIcon,
    // 编排历史辅助函数
    getOrchestrationStatusType,
    getOrchestrationStatusText,
    formatOrchestrationHistoryTime,
    getOrchestrationFirstError,
    // 最近执行状态栏辅助函数
    getRecentStatusIcon,
    getRecentStatusType,
    getRecentStatusText,
    // AI 诊断
    showDiagnosticPanel,
    diagnosticRecordId,
    diagnosticOperationName,
    diagnosticOperationCategory,
    diagnosticFailedResources,
    openDiagnostic,
  }
}
