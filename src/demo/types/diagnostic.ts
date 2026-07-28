// 诊断相关类型定义

// 根因分类
export type DiagnosticCategory =
  | 'permission'       // 权限问题
  | 'resource'         // 资源不足
  | 'network'          // 网络问题
  | 'config'           // 配置错误
  | 'dependency'       // 依赖服务异常
  | 'script_error'     // 脚本逻辑错误
  | 'timeout'          // 超时
  | 'environment'      // 环境问题
  | 'unknown'          // 未知

// 诊断上下文（输入）
export interface DiagnosticContext {
  // 操作信息
  operation: {
    id: string
    name: string
    category: string
    script?: string
    params?: Record<string, any>
  }

  // 失败信息
  failure: {
    recordId: string
    status: 'failed'
    errorMsg: string
    failedResources: Array<{
      pk: string
      pkDisplay: string
      errorMsg: string
      duration?: number
    }>
    executeTime: string
    duration?: number
  }

  // 资源信息
  resourceInfo?: {
    os: string
    env: string
    datacenter: string
    cluster: string
    lastDeployTime?: string
    recentChanges?: string[]
  }

  // 历史相似案例
  similarCases: Array<{
    id: string
    operationName: string
    errorMsg: string
    rootCause?: string
    solution?: string
    executeTime: string
    similarity: number
  }>
}

// 诊断结果（输出）
export interface DiagnosticResult {
  rootCause: {
    summary: string
    detail: string
    category: DiagnosticCategory
    confidence: number
  }

  suggestions: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    command?: string
    risk: 'high' | 'medium' | 'low'
    estimatedTime?: string
  }>

  relatedOperations: Array<{
    operationId: string
    operationName: string
    reason: string
    suggestedParams?: Record<string, any>
  }>

  similarCases: Array<{
    caseId: string
    title: string
    solution: string
    resolvedAt: string
    relevance: number
  }>

  meta: {
    model: string
    tokensUsed: number
    duration: number
  }
}

// 诊断状态
export type DiagnosticStatus = 'idle' | 'analyzing' | 'completed' | 'failed'

// 诊断进度
export interface DiagnosticProgress {
  status: DiagnosticStatus
  progress: number
  currentStep: string
  partialResult?: DiagnosticResult
}
