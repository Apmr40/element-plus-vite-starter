/**
 * 操作工作台 - composable 组合入口
 *
 * 将三个领域 composable 组合为统一上下文：
 * - useOperations    操作组件域（模块/组件/草稿/发布）
 * - useOrchestrations 操作编排域（场景/编排草稿/发布）
 * - useExecution     执行域（执行弹窗/历史抽屉/最近执行栏）
 *
 * 通过 provide/inject 向提取出的子组件共享上下文，避免 props 逐层传递。
 */
import { onMounted, provide, inject } from 'vue'
import type { InjectionKey } from 'vue'
import { useOperations } from './useOperations'
import { useOrchestrations } from './useOrchestrations'
import { useExecution } from './useExecution'

type OperationsContext = ReturnType<typeof useOperations>
type OrchestrationsContext = ReturnType<typeof useOrchestrations>
type ExecutionContext = ReturnType<typeof useExecution>

/** 工作台统一上下文类型 */
export type WorkbenchContext = OperationsContext & OrchestrationsContext & ExecutionContext

const WORKBENCH_KEY = Symbol('workbench') as InjectionKey<WorkbenchContext>

/**
 * 工作台主 composable（在页面根组件 setup 中调用）
 * 组合三个领域 + 注入上下文 + 初始化数据加载
 */
export function useWorkbench(): WorkbenchContext {
  const operations = useOperations()
  const orchestrations = useOrchestrations()
  const execution = useExecution()

  const context: WorkbenchContext = {
    ...operations,
    ...orchestrations,
    ...execution
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
