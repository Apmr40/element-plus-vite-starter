/**
 * Mock 服务层
 * 模拟 API 调用，返回统一格式的 mock 数据
 */

import type {
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  Role,
  RuleConfig,
  RuleFilter,
  RuleFormData,
  TestResult,
  UploadedFile,
} from '~/demo/types/inspection'

import {
  mockRoles,
  mockRules,
  mockTestResults,
} from './data'

// 模拟延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================
// 规则配置服务
// ============================================
export const mockRuleService = {
  /** 获取规则列表 */
  async getList(
    filter: Partial<RuleFilter>,
    pagination: PaginationParams,
  ): Promise<ApiResponse<PaginationResponse<RuleConfig>>> {
    await delay()

    let filtered = [...mockRules]

    // 筛选
    if (filter.techStack) {
      filtered = filtered.filter(rule =>
        Array.isArray(rule.techStack)
          ? rule.techStack.includes(filter.techStack!)
          : rule.techStack === filter.techStack,
      )
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(rule =>
        filter.tags!.some(tag => rule.tags.includes(tag)),
      )
    }

    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(rule => rule.status === filter.status)
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase()
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(keyword)
        || rule.description?.toLowerCase().includes(keyword),
      )
    }

    // 分页
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    const list = filtered.slice(start, end)

    return {
      code: 200,
      message: 'success',
      data: {
        list,
        total: filtered.length,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize,
      },
    }
  },

  /** 创建规则 */
  async create(data: RuleFormData): Promise<ApiResponse<RuleConfig>> {
    await delay()

    const newRule: RuleConfig = {
      id: `rule-${Date.now()}`,
      name: data.name,
      techStack: data.techStack,
      tags: data.tags,
      status: 'disabled',
      version: 'V1.0',
      description: data.description,
      config: data.config,
      hasAssociation: false,
      updatedAt: new Date().toISOString(),
    }

    mockRules.push(newRule)

    return {
      code: 200,
      message: '创建成功',
      data: newRule,
    }
  },

  /** 更新规则 */
  async update(id: string, data: RuleFormData): Promise<ApiResponse<RuleConfig>> {
    await delay()

    const index = mockRules.findIndex(rule => rule.id === id)
    if (index === -1) {
      return { code: 404, message: '规则不存在', data: null as any }
    }

    const updated = {
      ...mockRules[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    mockRules[index] = updated

    return {
      code: 200,
      message: '更新成功',
      data: updated,
    }
  },

  /** 删除规则 */
  async delete(id: string): Promise<ApiResponse<void>> {
    await delay()

    const index = mockRules.findIndex(rule => rule.id === id)
    if (index === -1) {
      return { code: 404, message: '规则不存在', data: null as any }
    }

    if (mockRules[index].hasAssociation) {
      return { code: 400, message: '该规则有关联任务，无法删除', data: null as any }
    }

    mockRules.splice(index, 1)

    return {
      code: 200,
      message: '删除成功',
      data: undefined,
    }
  },

  /** 切换规则状态 */
  async toggleStatus(id: string, status: 'enabled' | 'disabled'): Promise<ApiResponse<RuleConfig>> {
    await delay()

    const index = mockRules.findIndex(rule => rule.id === id)
    if (index === -1) {
      return { code: 404, message: '规则不存在', data: null as any }
    }

    mockRules[index].status = status
    mockRules[index].updatedAt = new Date().toISOString()

    return {
      code: 200,
      message: '操作成功',
      data: mockRules[index],
    }
  },

  /** 复制规则 */
  async copy(id: string): Promise<ApiResponse<RuleConfig>> {
    await delay()

    const source = mockRules.find(rule => rule.id === id)
    if (!source) {
      return { code: 404, message: '规则不存在', data: null as any }
    }

    const copied: RuleConfig = {
      ...source,
      id: `rule-${Date.now()}`,
      name: `${source.name} (副本)`,
      status: 'disabled',
      hasAssociation: false,
      updatedAt: new Date().toISOString(),
    }

    mockRules.push(copied)

    return {
      code: 200,
      message: '复制成功',
      data: copied,
    }
  },

  /** 运行规则测试 */
  async runTest(
    config: any,
    files: UploadedFile[],
  ): Promise<ApiResponse<TestResult>> {
    await delay(1000)

    const result = mockTestResults[0]

    return {
      code: 200,
      message: '测试完成',
      data: result,
    }
  },
}

// ============================================
// 系统管理服务
// ============================================
export const mockSystemService = {
  /** 获取角色列表 */
  async getRoles(): Promise<ApiResponse<Role[]>> {
    await delay()

    return {
      code: 200,
      message: 'success',
      data: mockRoles,
    }
  },

  /** 创建角色 */
  async createRole(name: string, description: string): Promise<ApiResponse<Role>> {
    await delay()

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name,
      type: 'custom',
      description,
      permissions: {
        rulePermissions: [],
        inspectionPermissions: [],
        orderPermissions: [],
        systemPermissions: [],
      },
      dataPermissions: {
        techStackScope: [],
        appScope: [],
      },
      assignedUsers: [],
    }

    mockRoles.push(newRole)

    return {
      code: 200,
      message: '创建成功',
      data: newRole,
    }
  },

  /** 更新角色权限 */
  async updatePermissions(
    id: string,
    permissions: any,
  ): Promise<ApiResponse<void>> {
    await delay()

    const role = mockRoles.find(r => r.id === id)
    if (!role) {
      return { code: 404, message: '角色不存在', data: null as any }
    }

    role.permissions = permissions.permissions
    role.dataPermissions = permissions.dataPermissions
    role.assignedUsers = permissions.assignedUsers

    return {
      code: 200,
      message: '更新成功',
      data: undefined,
    }
  },

  /** 删除角色 */
  async deleteRole(id: string): Promise<ApiResponse<void>> {
    await delay()

    const index = mockRoles.findIndex(r => r.id === id)
    if (index === -1) {
      return { code: 404, message: '角色不存在', data: null as any }
    }

    if (mockRoles[index].type !== 'custom') {
      return { code: 400, message: '预置角色不可删除', data: null as any }
    }

    mockRoles.splice(index, 1)

    return {
      code: 200,
      message: '删除成功',
      data: undefined,
    }
  },
}
