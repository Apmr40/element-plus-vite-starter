// 诊断服务 - Mock 实现
import type { DiagnosticContext, DiagnosticResult, DiagnosticProgress } from '~/demo/types/diagnostic'

// 模拟 LLM 响应延迟
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 诊断结果
const mockDiagnosticResults: Record<string, DiagnosticResult> = {
  'permission': {
    rootCause: {
      summary: '目标服务器 /var/log 目录权限配置异常，当前用户无删除权限',
      detail: '详细分析：\n1. 错误日志显示 "Permission denied"，表明权限不足\n2. 该资源近期无变更记录，排除配置变更导致\n3. 相似案例显示同类问题通常由权限配置引起\n4. 建议检查 /var/log 目录权限配置，确认当前用户是否有写权限',
      category: 'permission',
      confidence: 0.85
    },
    suggestions: [
      {
        priority: 'high',
        action: '检查并修复 /var/log 目录权限',
        command: 'chmod 755 /var/log/app && chown appuser:appgroup /var/log/app',
        risk: 'low',
        estimatedTime: '< 1分钟'
      },
      {
        priority: 'medium',
        action: '验证用户权限配置',
        command: 'id && groups',
        risk: 'low',
        estimatedTime: '< 1分钟'
      }
    ],
    relatedOperations: [
      {
        operationId: 'permission-check',
        operationName: '权限检查与修复',
        reason: '该操作可自动检查并修复常见权限问题'
      }
    ],
    similarCases: [
      {
        caseId: 'case-001',
        title: 'server-02 日志清理失败',
        solution: '修复目录权限后重试成功',
        resolvedAt: '2026-07-15 14:30:00',
        relevance: 0.92
      },
      {
        caseId: 'case-002',
        title: 'server-05 日志清理失败',
        solution: '清理磁盘空间后重试成功',
        resolvedAt: '2026-07-10 10:20:00',
        relevance: 0.85
      }
    ],
    meta: {
      model: 'llama3.1:8b',
      tokensUsed: 1250,
      duration: 8500
    }
  },
  'resource': {
    rootCause: {
      summary: '服务器磁盘空间不足，无法写入日志文件',
      detail: '详细分析：\n1. 错误信息显示 "No space left on device"，表明磁盘空间不足\n2. 检查发现 /var 分区使用率已达 95%\n3. 大量历史日志文件未清理，占用大量空间\n4. 建议清理历史日志并配置日志轮转策略',
      category: 'resource',
      confidence: 0.92
    },
    suggestions: [
      {
        priority: 'high',
        action: '清理历史日志文件',
        command: 'find /var/log -name "*.log" -mtime +7 -delete',
        risk: 'medium',
        estimatedTime: '1-2分钟'
      },
      {
        priority: 'high',
        action: '检查磁盘空间使用情况',
        command: 'df -h && du -sh /var/log/*',
        risk: 'low',
        estimatedTime: '< 1分钟'
      },
      {
        priority: 'medium',
        action: '配置日志轮转策略',
        command: '编辑 /etc/logrotate.d/app-config',
        risk: 'low',
        estimatedTime: '5分钟'
      }
    ],
    relatedOperations: [
      {
        operationId: 'disk-cleanup',
        operationName: '磁盘空间清理',
        reason: '该操作可自动清理历史日志和临时文件'
      }
    ],
    similarCases: [
      {
        caseId: 'case-003',
        title: 'server-08 磁盘空间告警',
        solution: '清理历史日志后恢复正常',
        resolvedAt: '2026-07-18 09:15:00',
        relevance: 0.95
      }
    ],
    meta: {
      model: 'llama3.1:8b',
      tokensUsed: 1380,
      duration: 9200
    }
  },
  'default': {
    rootCause: {
      summary: '操作执行失败，可能存在配置或环境问题',
      detail: '详细分析：\n1. 错误信息显示执行过程中出现异常\n2. 建议检查目标资源的配置和环境状态\n3. 可以参考相似案例的解决方案\n4. 如果问题持续，建议联系管理员进一步排查',
      category: 'unknown',
      confidence: 0.65
    },
    suggestions: [
      {
        priority: 'high',
        action: '检查目标资源状态',
        command: 'systemctl status app-service',
        risk: 'low',
        estimatedTime: '< 1分钟'
      },
      {
        priority: 'medium',
        action: '查看详细错误日志',
        command: 'tail -100 /var/log/app/error.log',
        risk: 'low',
        estimatedTime: '< 1分钟'
      }
    ],
    relatedOperations: [],
    similarCases: [],
    meta: {
      model: 'llama3.1:8b',
      tokensUsed: 980,
      duration: 6800
    }
  }
}

// 根据错误信息判断根因类型
function determineRootCauseType(errorMsg: string): string {
  const lowerError = errorMsg.toLowerCase()
  
  if (lowerError.includes('permission') || lowerError.includes('权限') || lowerError.includes('denied')) {
    return 'permission'
  }
  if (lowerError.includes('space') || lowerError.includes('磁盘') || lowerError.includes('no space')) {
    return 'resource'
  }
  if (lowerError.includes('network') || lowerError.includes('网络') || lowerError.includes('timeout')) {
    return 'network'
  }
  if (lowerError.includes('config') || lowerError.includes('配置')) {
    return 'config'
  }
  
  return 'default'
}

/**
 * 发起诊断
 */
export async function analyzeDiagnostic(
  context: DiagnosticContext,
  onProgress?: (progress: DiagnosticProgress) => void
): Promise<DiagnosticResult> {
  const startTime = Date.now()
  
  // 模拟诊断步骤
  const steps = [
    { progress: 20, step: '收集上下文信息...' },
    { progress: 40, step: '检索相似案例...' },
    { progress: 60, step: '分析错误日志...' },
    { progress: 80, step: '生成修复建议...' },
    { progress: 100, step: '完成诊断' }
  ]
  
  // 模拟进度更新
  for (const step of steps) {
    await simulateDelay(800)
    onProgress?.({
      status: 'analyzing',
      progress: step.progress,
      currentStep: step.step
    })
  }
  
  // 根据错误信息选择对应的 mock 结果
  const errorMsg = context.failure.errorMsg + ' ' + 
    context.failure.failedResources.map(r => r.errorMsg).join(' ')
  const resultType = determineRootCauseType(errorMsg)
  const result = { ...mockDiagnosticResults[resultType] }
  
  // 更新元数据
  result.meta.duration = Date.now() - startTime
  
  return result
}

/**
 * 构建诊断上下文
 */
export function buildDiagnosticContext(
  recordId: string,
  operationName: string,
  operationCategory: string,
  failedResources: Array<{ pk: string; pkDisplay: string; errorMsg: string }>
): DiagnosticContext {
  return {
    operation: {
      id: `op-${recordId}`,
      name: operationName,
      category: operationCategory
    },
    failure: {
      recordId,
      status: 'failed',
      errorMsg: failedResources[0]?.errorMsg || '未知错误',
      failedResources,
      executeTime: new Date().toISOString()
    },
    resourceInfo: {
      os: 'CentOS 7.9',
      env: 'production',
      datacenter: '上海机房',
      cluster: '应用集群A'
    },
    similarCases: []
  }
}
