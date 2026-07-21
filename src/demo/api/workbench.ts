/**
 * 操作工作台 - API 接口
 */
import { mockWorkbenchData } from '../mock/workbench'
import type {
  AppModule,
  OperationComponent,
  Orchestration,
  ExecutionRecord,
  ParamTemplate
} from '../types/workbench'

// 模拟延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 获取应用模块列表
 */
export async function getModules(): Promise<AppModule[]> {
  await delay()
  return mockWorkbenchData.modules
}

/**
 * 获取操作组件列表
 */
export async function getOperations(moduleId?: string): Promise<OperationComponent[]> {
  await delay()
  return mockWorkbenchData.operations
}

/**
 * 获取编排列表
 */
export async function getOrchestrations(moduleId?: string): Promise<Orchestration[]> {
  await delay()
  return mockWorkbenchData.orchestrations
}

/**
 * 获取执行历史
 */
export async function getExecutionHistory(): Promise<ExecutionRecord[]> {
  await delay()
  return mockWorkbenchData.executionHistory
}

/**
 * 获取参数模板
 */
export async function getParamTemplates(componentId?: string): Promise<ParamTemplate[]> {
  await delay()
  if (componentId) {
    return mockWorkbenchData.paramTemplates.filter(t => t.componentId === componentId)
  }
  return mockWorkbenchData.paramTemplates
}

/**
 * 保存参数模板
 */
export async function saveParamTemplate(
  componentId: string,
  name: string,
  params: Record<string, any>
): Promise<ParamTemplate> {
  await delay()
  const newTemplate: ParamTemplate = {
    id: `tpl${Date.now()}`,
    name,
    componentId,
    params,
    createTime: new Date().toLocaleString('zh-CN')
  }
  mockWorkbenchData.paramTemplates.push(newTemplate)
  return newTemplate
}

/**
 * 执行操作
 */
export async function executeOperation(
  operationId: string,
  params: Record<string, any>
): Promise<ExecutionRecord> {
  await delay(500)
  const operation = mockWorkbenchData.operations.find(o => o.id === operationId)
  if (!operation) {
    throw new Error('操作不存在')
  }

  // 更新执行次数
  operation.executeCount++

  const record: ExecutionRecord = {
    id: `EXE${Date.now()}`,
    type: 'operation',
    name: operation.name,
    status: 'running',
    operator: '当前用户',
    executeTime: new Date().toLocaleString('zh-CN'),
    params
  }

  // 添加到历史记录
  mockWorkbenchData.executionHistory.unshift(record)

  // 模拟执行完成
  setTimeout(() => {
    record.status = 'success'
    record.duration = Math.random() * 5 + 1
  }, 2000)

  return record
}

/**
 * 执行编排
 */
export async function executeOrchestration(
  orchestrationId: string,
  params: Record<string, any>
): Promise<ExecutionRecord> {
  await delay(500)
  const orchestration = mockWorkbenchData.orchestrations.find(o => o.id === orchestrationId)
  if (!orchestration) {
    throw new Error('编排不存在')
  }

  const record: ExecutionRecord = {
    id: `EXE${Date.now()}`,
    type: 'orchestration',
    name: orchestration.name,
    status: 'running',
    operator: '当前用户',
    executeTime: new Date().toLocaleString('zh-CN'),
    params
  }

  mockWorkbenchData.executionHistory.unshift(record)

  // 模拟执行完成
  setTimeout(() => {
    record.status = Math.random() > 0.2 ? 'success' : 'failed'
    record.duration = Math.random() * 20 + 5
  }, 3000)

  return record
}

/**
 * 切换收藏状态
 */
export async function toggleFavorite(operationId: string): Promise<boolean> {
  await delay(200)
  const operation = mockWorkbenchData.operations.find(o => o.id === operationId)
  if (!operation) {
    throw new Error('操作不存在')
  }

  operation.isFavorite = !operation.isFavorite

  return operation.isFavorite
}
