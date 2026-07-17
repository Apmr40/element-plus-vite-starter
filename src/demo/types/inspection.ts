/**
 * 应用配置巡检系统 - 统一类型定义
 * 按 UI 设计标准定义，与各页面实际使用字段一致
 */

// ==================== 通用类型 ====================

/** 分页参数 */
export interface PaginationParams {
  currentPage: number
  pageSize: number
}

/** 分页响应 */
export interface PaginationResponse<T> {
  list: T[]
  total: number
  currentPage: number
  pageSize: number
}

/** API 通用响应 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// ==================== 规则配置 ====================

/** 规则配置 */
export interface RuleConfig {
  id: string
  name: string
  techStack: string | string[]
  tags: string[]
  status: 'enabled' | 'disabled'
  version: string
  description?: string
  config?: RuleConfigData
  hasAssociation?: boolean
  updatedAt?: string
}

/** 规则配置数据 */
export interface RuleConfigData {
  type: 'simple' | 'advanced'
  fields: string[]
  logic?: string // Blockly 生成的 JSON 或简易模式的表达式
}

/** 规则筛选条件 */
export interface RuleFilter {
  techStack: string
  tags: string[]
  status: 'all' | 'enabled' | 'disabled'
  keyword: string
}

/** 规则表单（新增/编辑） */
export interface RuleFormData {
  id?: string
  name: string
  techStack: string[]
  tags: string[]
  description?: string
  config?: RuleConfigData
}

/** 逻辑块（Blockly 积木） */
export interface LogicBlock {
  id: string
  type: string
  field?: string
  operator?: 'equals' | 'notEquals' | 'contains' | 'regex' | 'range' | 'and' | 'or' | 'not'
  value?: string | number | (string | number)[]
  childBlocks?: LogicBlock[]
}

// ==================== CSV 上传 ====================

/** 上传的 CSV 文件 */
export interface UploadedFile {
  id: string
  originalName: string
  fileName: string
  size: number
  columns: string[]
  rows: number
  alias: string
  expanded: boolean
  status: 'uploading' | 'success' | 'error'
}

/** 测试结果 */
export interface TestResult {
  passed: number
  total: number
  details: TestResultDetail[]
}

/** 测试结果详情 */
export interface TestResultDetail {
  ruleName: string
  status: 'pass' | 'fail'
  message: string
}

// ==================== 巡检结果 ====================

/** 巡检结果 */
export interface InspectionResult {
  id: string
  appName: string
  techStack: string
  inspectedAt: string
  compliant: number
  nonCompliant: number
  status: 'compliant' | 'non-compliant'
  complianceRate: number
  dataSource: string
  ruleVersion: string
  checks: InspectionCheck[]
  nonCompliantItems: NonCompliantItem[]
  deadlineRemaining?: string
}

/** 巡检检查项 */
export interface InspectionCheck {
  ruleName: string
  ruleVersion: string
  status: 'passed' | 'failed'
  reason?: string
  dataSource?: string
  currentValue?: string | number
  requireValue?: string
}

/** 不合规项 */
export interface NonCompliantItem {
  instanceId: string
  ruleName: string
  ruleVersion?: string
  reason: string
  riskLevel: 'high' | 'medium' | 'low'
  dataSource?: string
  currentValue?: string | number
  requireValue?: string
  deadlineRemaining?: string
}

/** 巡检结果筛选条件 */
export interface InspectionFilter {
  appName: string
  techStack: string
  status: 'all' | 'compliant' | 'non-compliant'
  timeRange: Date[]
}

/** 历史对比数据 */
export interface HistoryCompareData {
  ruleName: string
  results: HistoryCell[][]
}

/** 历史对比单元格 */
export interface HistoryCell {
  icon: string
  diff?: boolean
  showDiff?: string
}

// ==================== 整改工单 ====================

/** 整改工单 */
export interface Order {
  id: string
  appName: string
  nonCompliantItem: string
  riskLevel: 'high' | 'medium' | 'low'
  remainingTimeMs: number
  status: OrderStatus
  handler: string
  ruleName: string
  checkItem: string
  reason: string
  instanceId: string
  dataSource: string
  createdAt: string
  techStack: string
  history: OrderHistory[]
}

/** 工单状态 */
export type OrderStatus =
  | 'pending-confirm'      // 待确认
  | 'pending-rectify'      // 待整改
  | 'pending-review'       // 整改待审核
  | 'closed'               // 已闭环
  | 'rejected'             // 已驳回

/** 工单处理记录 */
export interface OrderHistory {
  time: string
  content: string
  user: string
}

/** 工单筛选条件 */
export interface OrderFilter {
  status: 'all' | OrderStatus
  riskLevel: string
  appName: string
  createdAt: Date[]
}

/** 误报闭环表单 */
export interface FalseAlarmForm {
  falseAlarmReason: string
}

/** 转单表单 */
export interface TransferForm {
  handler: string
  transferNote: string
}

/** 整改表单 */
export interface RectifyForm {
  rectifyNote: string
  attachments: any[]
}

// ==================== 系统管理 ====================

/** 角色 */
export interface Role {
  id: string
  name: string
  type: RoleType
  description: string
  permissions: RolePermissions
  dataPermissions: DataPermissions
  assignedUsers: AssignedUser[]
}

/** 角色类型 */
export type RoleType =
  | 'superadmin'
  | 'tech-admin'
  | 'one-line-admin'
  | 'two-line-admin'
  | 'custom'

/** 角色权限 */
export interface RolePermissions {
  rulePermissions: string[]
  inspectionPermissions: string[]
  orderPermissions: string[]
  systemPermissions: string[]
}

/** 数据权限 */
export interface DataPermissions {
  techStackScope: string[]
  appScope: string[]
}

/** 已分配用户 */
export interface AssignedUser {
  id: string
  name: string
}

/** 权限表单 */
export interface PermissionFormData {
  rulePermissions: string[]
  inspectionPermissions: string[]
  orderPermissions: string[]
  systemPermissions: string[]
  techStackScope: string[]
  appScope: string[]
  assignedUsers: AssignedUser[]
}

/** 新增角色表单 */
export interface NewRoleForm {
  name: string
  description: string
}

// ==================== 功能开关 ====================

/** 功能开关统计 */
export interface FeatureStats {
  enabledUsers: number
  usageCount: number
  successRate: number
}

/** 用户白名单 */
export interface UserWhitelist {
  id: string
  name: string
  email: string
  department: string
  role: string
}

/** 部门白名单 */
export interface DepartmentWhitelist {
  id: string
  name: string
  enabled: boolean
}

/** 角色白名单 */
export interface RoleWhitelist {
  id: string
  name: string
  enabled: boolean
}

// ==================== 选项数据 ====================

/** 技术栈选项 */
export interface TechStackOption {
  value: string
  label: string
}

/** 标签选项 */
export interface TagOption {
  value: string
  label: string
}

/** 应用选项 */
export interface AppOption {
  value: string
  label: string
}
