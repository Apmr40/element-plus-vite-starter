import type { InjectionKey } from 'vue'
import { ElMessage } from 'element-plus'
/**
 * 操作工作台 - composable 组合入口
 *
 * 将五个领域 composable 组合为统一上下文：
 * - useOperations      操作组件域（模块/组件/草稿/发布）
 * - useOrchestrations  操作编排域（场景/编排草稿/发布）
 * - useExecution       执行域（执行弹窗/历史抽屉/最近执行栏）
 * - useCustomComponent 应用定制组件入库（新建/编辑/草稿弹窗）
 * - useVersionHistory  版本历史（抽屉/对比/基线冲突）
 *
 * 通过 provide/inject 向提取出的子组件共享上下文，避免 props 逐层传递。
 */
import { inject, onMounted, provide } from 'vue'
import { getOperationVersions } from '~/demo/api/workbench'
import { useCustomComponent } from './useCustomComponent'
import { useExecution } from './useExecution'
import { useOperations } from './useOperations'
import { useOrchestrations } from './useOrchestrations'
import { useVersionHistory } from './useVersionHistory'

type OperationsContext = ReturnType<typeof useOperations>
type OrchestrationsContext = ReturnType<typeof useOrchestrations>
type ExecutionContext = ReturnType<typeof useExecution>
type CustomComponentContext = ReturnType<typeof useCustomComponent>
type VersionHistoryContext = ReturnType<typeof useVersionHistory>

/** 工作台统一上下文类型 */
export type WorkbenchContext = OperationsContext & OrchestrationsContext & ExecutionContext & CustomComponentContext & VersionHistoryContext

const WORKBENCH_KEY = Symbol('workbench') as InjectionKey<WorkbenchContext>

/**
 * 工作台主 composable（在页面根组件 setup 中调用）
 * 组合五个领域 + 注入上下文 + 初始化数据加载
 */
export function useWorkbench(): WorkbenchContext {
  const operations = useOperations()
  const orchestrations = useOrchestrations()
  const execution = useExecution()
  const customComponent = useCustomComponent()
  const versionHistory = useVersionHistory()

  // ============ 委托注入 ============
  // 注意：必须覆盖 delegates 容器上的实现，而非返回对象上的属性——
  // handleCustomCommand / handleDraftCommand 内部通过闭包引用 delegates，
  // 覆盖返回对象属性无法影响闭包内的调用。

  // 新增操作按钮 → 打开定制组件入库弹窗（新建场景）
  operations.handleAddCustomOp = customComponent.openComponentDialog

  // 编辑已发布操作 → 加载最新版本快照 → 打开编辑弹窗
  operations.delegates.editCustomOp = async (operation) => {
    const versions = await getOperationVersions(operation.id)
    const latest = versions[0]
    if (!latest) {
      ElMessage.warning('该操作暂无版本记录，无法编辑')
      return
    }
    customComponent.openEditPublished(
      { id: operation.id, name: operation.name, versionNo: operation.versionNo },
      latest.snapshot,
    )
  }

  // 查看草稿 → 打开只读预览弹窗
  operations.delegates.viewDraft = (operation) => {
    const draft = operations.getEditingDraft(operation.id)
    if (draft) {
      customComponent.openDraftScene(draft, 'viewDraft')
    }
    else {
      ElMessage.info('该操作暂无编辑中的草稿')
    }
  }

  // 编辑草稿 → 打开可编辑弹窗
  operations.delegates.editDraft = (draft) => {
    customComponent.openDraftScene(draft, 'editDraft')
  }

  // 查看版本历史 → 打开版本抽屉
  operations.delegates.versionHistory = (operation) => {
    versionHistory.openVersionHistory(operation.id, operation.name)
  }

  const context: WorkbenchContext = {
    ...operations,
    ...orchestrations,
    ...execution,
    ...customComponent,
    ...versionHistory,
  }

  // 向子组件注入上下文
  provide(WORKBENCH_KEY, context)

  // 初始化数据加载
  onMounted(async () => {
    await operations.loadModules()
    await operations.loadOperations()
    await execution.loadExecutionData()
  })

  return context
}

/**
 * 工作台上下文（在提取出的子组件中调用）
 * 必须在调用了 useWorkbench() 的组件树内使用
 */
export function useWorkbenchContext(): WorkbenchContext {
  const context = inject(WORKBENCH_KEY)
  if (!context) {
    throw new Error('useWorkbenchContext 必须在调用了 useWorkbench() 的组件树内使用')
  }
  return context
}
