/**
 * 操作工作台 - 类型定义
 */

// 应用模块
export interface AppModule {
  id: string
  name: string
  code: string
}

// 参数配置字段
export interface ParamField {
  field: string
  label: string
  type: 'input' | 'select' | 'date' | 'textarea' | 'checkbox'
  required: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
  defaultValue?: any
}

// 操作组件
export interface OperationComponent {
  id: string
  name: string
  description: string
  category: string      // 一级分类：CCE、操作系统、数据库、中间件等
  subCategory: string   // 二级分类
  executeCount: number  // 执行次数
  isFavorite: boolean   // 是否收藏
  riskLevel?: string    // 风险等级
  tags?: string[]       // 标签
  paramConfig: ParamField[] // 参数配置
}

// 编排状态
export type OrchestrationStatus = 'normal' | 'warning' | 'disabled'

// 编排
export interface Orchestration {
  id: string
  name: string
  stepCount: number
  status: OrchestrationStatus
  lastExecuteTime: string
  paramConfig: ParamField[]
}

// 执行记录状态
export type ExecutionStatus = 'success' | 'failed' | 'running' | 'cancelled'

// 编排执行状态（对应截图中的状态）
export type OrchestrationExecutionStatus = 'success' | 'failed' | 'running' | 'pending' | 'terminated'

// 执行明细状态
export type ExecutionDetailStatus = 'S' | 'F' | 'P' | 'R'

// 执行明细
export interface ExecutionDetail {
  serviceSeqId: string
  pkValue: string
  pkDisplay: string
  execStatus: ExecutionDetailStatus
  paramsInfo?: Record<string, any>
  resourceInfo?: Record<string, any>
  errorMsg?: string
  startTime?: string
  endTime?: string
  duration?: number
}

// 编排作业明细
export interface OrchestrationJob {
  jobName: string // 作业名称
  channel: string // 发起渠道
  status: OrchestrationExecutionStatus // 执行状态
  startTime: string // 开始时间
  submitter: string // 提交人
  reviewer: string // 复核人
}

// 编排执行记录
export interface OrchestrationExecutionRecord {
  id: string
  orchestrationId: string
  name: string // 编排名称
  appSystem: string // 应用系统
  submitter: string // 提交人
  totalJobCount: number // 总作业数
  status: OrchestrationExecutionStatus // 执行状态
  executeTime: string // 执行时间
  jobs: OrchestrationJob[] // 作业明细
}

// 执行记录
export interface ExecutionRecord {
  id: string
  type: 'operation' | 'orchestration'
  name: string
  status: ExecutionStatus
  execStatus?: ExecutionDetailStatus  // S/F/P/R
  duration?: number     // 耗时（秒）
  operator: string
  executeTime: string
  endTime?: string
  totalCount: number
  successCount: number
  params?: Record<string, any>
  details: ExecutionDetail[]
}

// 参数模板
export interface ParamTemplate {
  id: string
  name: string
  componentId: string   // 关联的组件ID
  params: Record<string, any>
  createTime: string
}

// 操作工作台数据
export interface WorkbenchData {
  modules: AppModule[]
  operations: OperationComponent[]
  orchestrations: Orchestration[]
  executionHistory: ExecutionRecord[]
  paramTemplates: ParamTemplate[]
}

// 草稿类型定义
export interface CustomDraft {
  id: string
  name: string
  saveTime: string
  sourceOperationId?: string
  status: 'draft' | 'submitted' | 'published' | 'rejected'
  batchId?: string
}

// 发布批次类型定义
export interface PublishBatch {
  id: string
  name: string
  description: string
  draftIds: string[]
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  createTime: string
  submitTime?: string
}

// 场景类型定义
export interface Scenario {
  id: string
  name: string
  hasAlert: boolean
  isEditing: boolean
  hasStart: boolean
}

// 场景草稿类型定义
export interface ScenarioDraft {
  id: string
  name: string
  saveTime: string
  sourceScenarioId?: string
  status: 'draft' | 'submitted' | 'published' | 'rejected'
  batchId?: string
}
