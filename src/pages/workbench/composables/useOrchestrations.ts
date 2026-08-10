import type {
  PublishBatch,
  Scenario,
  ScenarioDraft,
} from '~/demo/types/workbench'
import { ElMessage, ElMessageBox } from 'element-plus'
/**
 * 操作工作台 - 操作编排域 composable
 *
 * 职责：应急场景（正式编排/我的草稿）、编排草稿管理与批量发布。
 *
 * 场景和草稿初始数据来自 mock 层（~/demo/mock/workbench-extra）。
 */
import { computed, ref } from 'vue'
import { mockScenarioDrafts, mockScenarios } from '~/demo/mock/workbench-extra'
import { createPersistedViewMode, createStatusMapper } from './utils'

export function useOrchestrations() {
  // ============ 应急场景（来自 mock 层）============
  const scenarios = ref<Scenario[]>([...mockScenarios])
  const activeScenarioTab = ref<string>('formal')
  const scenarioSearch = ref<string>('')

  // ============ 视图形态：卡片 / 表单（按分区持久化，设计文档 §3）============
  const orchestrationViewMode = createPersistedViewMode('workbench_view_orchestration')

  // ============ 编排草稿（来自 mock 层）============
  const scenarioDrafts = ref<ScenarioDraft[]>([...mockScenarioDrafts])

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
    description: '',
  })
  const scenarioPublishBatches = ref<PublishBatch[]>([])

  // ============ 计算属性 ============
  const filteredScenarios = computed(() => {
    let filtered = scenarios.value

    if (scenarioSearch.value) {
      filtered = filtered.filter(scenario =>
        scenario.name.toLowerCase().includes(scenarioSearch.value.toLowerCase())
        || scenario.id.includes(scenarioSearch.value),
      )
    }

    return filtered
  })

  // ============ 事件处理方法 ============
  const handleAddScenario = () => {
    ElMessage.info('新增编排功能开发中')
  }

  const handleQuickModify = () => {
    ElMessage.info('快速修改标签功能开发中')
  }

  const handleFilterScenario = () => {
    ElMessage.info('筛选功能开发中')
  }

  const handleScenarioClick = (scenario: Scenario) => {
    ElMessage.info(`点击场景: ${scenario.name}`)
  }

  const handleScenarioCommand = (command: { id: string, action: string }, scenario?: Scenario) => {
    if (command.action === 'edit' && scenario) {
      const newDraft: ScenarioDraft = {
        id: `sd_${Date.now()}`,
        name: `${scenario.name}（编辑中）`,
        saveTime: new Date().toLocaleString(),
        sourceScenarioId: scenario.id,
        status: 'draft',
      }
      scenarioDrafts.value.push(newDraft)
      ElMessage.success('已创建草稿，可在"我的草稿"中查看')
    }
    else if (command.action === 'viewDraft' && scenario) {
      const draft = getScenarioEditingDraft(scenario.id)
      if (draft) {
        activeScenarioTab.value = 'draft'
        ElMessage.info('已切换到草稿视图')
      }
    }
    else {
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
            type: 'info',
          },
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
            type: 'warning',
          },
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
            type: 'warning',
          },
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

  // ============ 编排批量操作 ============
  const toggleSelectAllScenarioDrafts = (value: boolean | string | number) => {
    const draftDrafts = scenarioDrafts.value.filter(d => d.status === 'draft')
    if (value) {
      selectedScenarioDraftIds.value = draftDrafts.map(d => d.id)
    }
    else {
      selectedScenarioDraftIds.value = []
    }
  }

  const clearScenarioSelection = () => {
    selectedScenarioDraftIds.value = []
  }

  const handleBatchScenarioPublish = () => {
    if (selectedScenarioDraftIds.value.length === 0) {
      ElMessage.warning('请先选择要发布的编排草稿')
      return
    }

    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    scenarioPublishForm.value.name = `编排批量发布-${dateStr}`
    scenarioPublishForm.value.description = ''

    showScenarioPublishDialog.value = true
  }

  const handleBatchScenarioDelete = () => {
    if (selectedScenarioDraftIds.value.length === 0) {
      ElMessage.warning('请先选择要删除的编排草稿')
      return
    }

    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedScenarioDraftIds.value.length} 个编排草稿吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    ).then(() => {
      scenarioDrafts.value = scenarioDrafts.value.filter(d => !selectedScenarioDraftIds.value.includes(d.id))
      selectedScenarioDraftIds.value = []
      ElMessage.success('批量删除成功')
    }).catch(() => {
      ElMessage.info('已取消删除')
    })
  }

  const submitScenarioPublish = () => {
    if (!scenarioPublishForm.value.name.trim()) {
      ElMessage.warning('请输入批次名称')
      return
    }

    const batch: PublishBatch = {
      id: `sbatch_${Date.now()}`,
      name: scenarioPublishForm.value.name,
      description: scenarioPublishForm.value.description,
      draftIds: [...selectedScenarioDraftIds.value],
      status: 'reviewing',
      createTime: new Date().toLocaleString(),
      submitTime: new Date().toLocaleString(),
    }

    scenarioPublishBatches.value.push(batch)

    scenarioDrafts.value = scenarioDrafts.value.map((d) => {
      if (selectedScenarioDraftIds.value.includes(d.id)) {
        return {
          ...d,
          status: 'submitted' as const,
          batchId: batch.id,
        }
      }
      return d
    })

    selectedScenarioDraftIds.value = []
    showScenarioPublishDialog.value = false
    ElMessage.success('提交审核成功')
  }

  // ============ 模板辅助函数 ============
  const hasScenarioEditingDraft = (scenarioId: string): boolean => {
    return scenarioDrafts.value.some(draft => draft.sourceScenarioId === scenarioId)
  }

  function getScenarioEditingDraft(scenarioId: string): ScenarioDraft | undefined {
    return scenarioDrafts.value.find(draft => draft.sourceScenarioId === scenarioId)
  }

  const getScenarioDraftStatusType = createStatusMapper(
    { draft: 'info', submitted: 'warning', published: 'success', rejected: 'danger' },
    'info',
  )
  const getScenarioDraftStatusText = createStatusMapper(
    { draft: '草稿', submitted: '审核中', published: '已发布', rejected: '已驳回' },
    '未知',
  )

  const getScenarioDraftNameById = (id: string): string => {
    const draft = scenarioDrafts.value.find(d => d.id === id)
    return draft?.name || '未知编排草稿'
  }

  return {
    // 状态
    scenarios,
    activeScenarioTab,
    scenarioSearch,
    orchestrationViewMode,
    scenarioDrafts,
    selectedScenarioDraftIds,
    isAllScenarioDraftsSelected,
    showScenarioPublishDialog,
    scenarioPublishForm,
    scenarioPublishBatches,
    // 计算属性
    filteredScenarios,
    // 事件处理
    handleAddScenario,
    handleQuickModify,
    handleFilterScenario,
    handleScenarioClick,
    handleScenarioCommand,
    handleScenarioDraftCommand,
    // 批量操作
    toggleSelectAllScenarioDrafts,
    clearScenarioSelection,
    handleBatchScenarioPublish,
    handleBatchScenarioDelete,
    submitScenarioPublish,
    // 辅助函数
    hasScenarioEditingDraft,
    getScenarioEditingDraft,
    getScenarioDraftStatusType,
    getScenarioDraftStatusText,
    getScenarioDraftNameById,
  }
}
