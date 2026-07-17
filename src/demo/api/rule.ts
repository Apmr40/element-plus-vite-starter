/**
 * 规则配置 API
 * 当前使用 mock 数据，后续可切换为真实 API
 */

import { mockRuleService } from '~/demo/mock/service'
import type {
  RuleConfig,
  RuleFilter,
  RuleFormData,
  PaginationParams,
  PaginationResponse,
  UploadedFile,
  TestResult,
  ApiResponse,
} from '~/demo/types/inspection'

/** 获取规则列表 */
export function getRuleList(
  filter: Partial<RuleFilter>,
  pagination: PaginationParams
): Promise<ApiResponse<PaginationResponse<RuleConfig>>> {
  return mockRuleService.getList(filter, pagination)
}

/** 创建规则 */
export function createRule(data: RuleFormData): Promise<ApiResponse<RuleConfig>> {
  return mockRuleService.create(data)
}

/** 更新规则 */
export function updateRule(id: string, data: RuleFormData): Promise<ApiResponse<RuleConfig>> {
  return mockRuleService.update(id, data)
}

/** 删除规则 */
export function deleteRule(id: string): Promise<ApiResponse<void>> {
  return mockRuleService.delete(id)
}

/** 切换规则状态 */
export function toggleRuleStatus(
  id: string,
  status: 'enabled' | 'disabled'
): Promise<ApiResponse<RuleConfig>> {
  return mockRuleService.toggleStatus(id, status)
}

/** 复制规则 */
export function copyRule(id: string): Promise<ApiResponse<RuleConfig>> {
  return mockRuleService.copy(id)
}

/** 运行规则测试 */
export function runRuleTest(
  config: any,
  files: UploadedFile[]
): Promise<ApiResponse<TestResult>> {
  return mockRuleService.runTest(config, files)
}
