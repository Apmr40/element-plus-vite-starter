/**
 * Mock 服务层
 * 模拟 API 调用，返回统一格式的 mock 数据
 */

import type {
  RuleConfig,
  RuleFilter,
  RuleFormData,
  InspectionResult,
  InspectionFilter,
  Order,
  OrderFilter,
  Role,
  PaginationParams,
  PaginationResponse,
  ApiResponse,
  TestResult,
  UploadedFile,
} from '~/demo/types/inspection'

import {
  mockRules,
  mockInspectionResults,
  mockOrders,
  mockRoles,
  mockUploadedFiles,
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
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<RuleConfig>>> {
    await delay()

    let filtered = [...mockRules]

    // 筛选
    if (filter.techStack) {
      filtered = filtered.filter(rule =>
        Array.isArray(rule.techStack)
          ? rule.techStack.includes(filter.techStack!)
          : rule.techStack === filter.techStack
      )
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(rule =>
        filter.tags!.some(tag => rule.tags.includes(tag))
      )
    }

    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(rule => rule.status === filter.status)
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase()
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(keyword) ||
        rule.description?.toLowerCase().includes(keyword)
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
    files: UploadedFile[]
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
// 巡检结果服务
// ============================================
export const mockInspectionService = {
  /** 获取巡检结果列表 */
  async getList(
    filter: Partial<InspectionFilter>,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<InspectionResult>>> {
    await delay()

    let filtered = [...mockInspectionResults]

    // 筛选
    if (filter.appName) {
      filtered = filtered.filter(item => item.appName === filter.appName)
    }

    if (filter.techStack) {
      filtered = filtered.filter(item => item.techStack === filter.techStack)
    }

    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(item => item.status === filter.status)
    }

    if (filter.timeRange && filter.timeRange.length === 2) {
      const [start, end] = filter.timeRange
      filtered = filtered.filter(item => {
        const date = new Date(item.inspectedAt)
        return date >= start && date <= end
      })
    }

    // 分页
    const startIdx = (pagination.currentPage - 1) * pagination.pageSize
    const endIdx = startIdx + pagination.pageSize
    const list = filtered.slice(startIdx, endIdx)

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

  /** 获取巡检结果详情 */
  async getDetail(id: string): Promise<ApiResponse<InspectionResult>> {
    await delay()

    const result = mockInspectionResults.find(item => item.id === id)
    if (!result) {
      return { code: 404, message: '巡检结果不存在', data: null as any }
    }

    return {
      code: 200,
      message: 'success',
      data: result,
    }
  },

  /** 导出巡检结果 */
  async export(ids: string[]): Promise<ApiResponse<Blob>> {
    await delay(500)

    // 模拟导出
    const blob = new Blob(['mock export data'], { type: 'text/csv' })

    return {
      code: 200,
      message: '导出成功',
      data: blob,
    }
  },

  /** 批量创建工单 */
  async batchCreateOrders(
    inspectionId: string,
    nonCompliantItemIds: string[]
  ): Promise<ApiResponse<Order[]>> {
    await delay()

    const inspection = mockInspectionResults.find(item => item.id === inspectionId)
    if (!inspection) {
      return { code: 404, message: '巡检结果不存在', data: null as any }
    }

    const newOrders: Order[] = nonCompliantItemIds.map((itemId, index) => {
      const nonCompliant = inspection.nonCompliantItems[index]
      return {
        id: `T${Date.now()}-${index}`,
        appName: inspection.appName,
        nonCompliantItem: nonCompliant?.ruleName || '未知项',
        riskLevel: nonCompliant?.riskLevel || 'medium',
        remainingTimeMs: 24 * 60 * 60 * 1000, // 24小时
        status: 'pending-confirm',
        handler: '一线管理员 - 张三',
        ruleName: nonCompliant?.ruleName || '',
        checkItem: nonCompliant?.ruleName || '',
        reason: nonCompliant?.reason || '',
        instanceId: nonCompliant?.instanceId || '',
        dataSource: inspection.dataSource,
        createdAt: new Date().toISOString(),
        techStack: inspection.techStack,
        history: [
          { time: new Date().toISOString(), content: '系统自动创建工单', user: 'system' },
        ],
      }
    })

    mockOrders.push(...newOrders)

    return {
      code: 200,
      message: '创建成功',
      data: newOrders,
    }
  },
}

// ============================================
// 整改工单服务
// ============================================
export const mockOrderService = {
  /** 获取工单列表 */
  async getList(
    filter: Partial<OrderFilter>,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<Order>>> {
    await delay()

    let filtered = [...mockOrders]

    // 筛选
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(order => order.status === filter.status)
    }

    if (filter.riskLevel) {
      filtered = filtered.filter(order => order.riskLevel === filter.riskLevel)
    }

    if (filter.appName) {
      filtered = filtered.filter(order => order.appName === filter.appName)
    }

    if (filter.createdAt && filter.createdAt.length === 2) {
      const [start, end] = filter.createdAt
      filtered = filtered.filter(order => {
        const date = new Date(order.createdAt)
        return date >= start && date <= end
      })
    }

    // 分页
    const startIdx = (pagination.currentPage - 1) * pagination.pageSize
    const endIdx = startIdx + pagination.pageSize
    const list = filtered.slice(startIdx, endIdx)

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

  /** 获取工单详情 */
  async getDetail(id: string): Promise<ApiResponse<Order>> {
    await delay()

    const order = mockOrders.find(item => item.id === id)
    if (!order) {
      return { code: 404, message: '工单不存在', data: null as any }
    }

    return {
      code: 200,
      message: 'success',
      data: order,
    }
  },

  /** 误报闭环 */
  async closeAsFalseAlarm(
    id: string,
    reason: string
  ): Promise<ApiResponse<void>> {
    await delay()

    const order = mockOrders.find(item => item.id === id)
    if (!order) {
      return { code: 404, message: '工单不存在', data: null as any }
    }

    order.status = 'closed'
    order.history.push({
      time: new Date().toISOString(),
      content: `误报闭环：${reason}`,
      user: '一线管理员',
    })

    return {
      code: 200,
      message: '操作成功',
      data: undefined,
    }
  },

  /** 转单 */
  async transfer(
    id: string,
    handler: string,
    note: string
  ): Promise<ApiResponse<void>> {
    await delay()

    const order = mockOrders.find(item => item.id === id)
    if (!order) {
      return { code: 404, message: '工单不存在', data: null as any }
    }

    order.status = 'pending-rectify'
    order.handler = handler
    order.history.push({
      time: new Date().toISOString(),
      content: `转单给${handler}：${note}`,
      user: '一线管理员',
    })

    return {
      code: 200,
      message: '转单成功',
      data: undefined,
    }
  },

  /** 提交整改 */
  async submitRectification(
    id: string,
    note: string,
    attachments: any[]
  ): Promise<ApiResponse<void>> {
    await delay()

    const order = mockOrders.find(item => item.id === id)
    if (!order) {
      return { code: 404, message: '工单不存在', data: null as any }
    }

    order.status = 'pending-review'
    order.history.push({
      time: new Date().toISOString(),
      content: `提交整改：${note}`,
      user: order.handler,
    })

    return {
      code: 200,
      message: '提交成功',
      data: undefined,
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
    permissions: any
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
