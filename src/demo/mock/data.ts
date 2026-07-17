/**
 * 统一 Mock 数据服务
 * 基于数据库表结构设计，提供完整的测试数据
 */

import type {
  RuleConfig,
  InspectionResult,
  InspectionCheck,
  NonCompliantItem,
  Order,
  OrderHistory,
  Role,
  User,
  UploadedFile,
  TestResult,
} from '~/demo/types/inspection'

// ============================================
// 规则配置数据
// ============================================
export const mockRules: RuleConfig[] = [
  {
    id: 'rule-001',
    name: '基础合规检查规则',
    techStack: ['java', 'python', 'nodejs'],
    tags: ['security', 'performance', 'standard'],
    status: 'enabled',
    version: 'V2.1',
    description: '基础合规检查规则，用于监控服务器基本配置',
    config: {
      type: 'advanced',
      fields: ['server_list.server_id', 'server_list.ip_address', 'server_list.port'],
      logic: JSON.stringify({ type: 'and', conditions: [] }),
    },
    hasAssociation: true,
    updatedAt: '2026-04-20 10:30:00',
  },
  {
    id: 'rule-002',
    name: 'SSL证书检查规则',
    techStack: ['java'],
    tags: ['security'],
    status: 'enabled',
    version: 'V1.5',
    description: '检查SSL证书有效期和配置',
    config: {
      type: 'simple',
      fields: ['ssl_config.certificate', 'ssl_config.expiry'],
      logic: 'certificate.expiry > 30',
    },
    hasAssociation: false,
    updatedAt: '2026-04-19 14:20:00',
  },
  {
    id: 'rule-003',
    name: '端口合规检查',
    techStack: ['java', 'python'],
    tags: ['standard'],
    status: 'disabled',
    version: 'V1.0',
    description: '检查端口配置是否符合规范',
    config: {
      type: 'simple',
      fields: ['port_config.port'],
      logic: 'port >= 8000 && port <= 9000',
    },
    hasAssociation: false,
    updatedAt: '2026-04-18 09:15:00',
  },
  {
    id: 'rule-004',
    name: '内存使用率监控',
    techStack: ['java', 'python', 'go'],
    tags: ['performance'],
    status: 'enabled',
    version: 'V1.2',
    description: '监控服务器内存使用率，超过阈值告警',
    config: {
      type: 'advanced',
      fields: ['server_metrics.memory_usage'],
      logic: JSON.stringify({ type: 'threshold', value: 80 }),
    },
    hasAssociation: true,
    updatedAt: '2026-04-17 16:45:00',
  },
]

// ============================================
// 巡检结果数据
// ============================================
export const mockInspectionResults: InspectionResult[] = [
  {
    id: 'I001',
    appName: 'APP-A',
    techStack: 'java',
    inspectedAt: '2026-04-21 06:00',
    compliant: 120,
    nonCompliant: 3,
    status: 'non-compliant',
    complianceRate: 97.6,
    dataSource: 'app-a-20260421.csv',
    ruleVersion: 'V2.1',
    deadlineRemaining: '3天',
    checks: [
      {
        ruleName: 'SSL 检查',
        ruleVersion: 'V2.1',
        status: 'passed',
        dataSource: 'ssl-config.yaml',
        currentValue: 'valid',
        requireValue: 'valid',
      },
      {
        ruleName: '端口检查',
        ruleVersion: 'V1.0',
        status: 'failed',
        reason: '未配置 SSL',
        dataSource: 'port-config.yaml',
        currentValue: '8080',
        requireValue: '8443',
      },
      {
        ruleName: '内存检查',
        ruleVersion: 'V1.2',
        status: 'passed',
        dataSource: 'metrics.yaml',
        currentValue: '65%',
        requireValue: '<80%',
      },
    ],
    nonCompliantItems: [
      {
        instanceId: '192.168.1.1',
        ruleName: '端口检查',
        ruleVersion: 'V1.0',
        reason: '未配置 SSL',
        riskLevel: 'high',
        dataSource: 'port-config.yaml',
        currentValue: '8080',
        requireValue: '8443',
        deadlineRemaining: '3天',
      },
      {
        instanceId: '192.168.1.2',
        ruleName: '端口检查',
        ruleVersion: 'V1.0',
        reason: '端口超出范围',
        riskLevel: 'medium',
        dataSource: 'port-config.yaml',
        currentValue: '9500',
        requireValue: '8000-9000',
        deadlineRemaining: '5天',
      },
      {
        instanceId: '192.168.1.3',
        ruleName: '内存检查',
        ruleVersion: 'V1.2',
        reason: '内存使用率过高',
        riskLevel: 'low',
        dataSource: 'metrics.yaml',
        currentValue: '85%',
        requireValue: '<80%',
        deadlineRemaining: '7天',
      },
    ],
  },
  {
    id: 'I002',
    appName: 'APP-B',
    techStack: 'python',
    inspectedAt: '2026-04-21 06:00',
    compliant: 123,
    nonCompliant: 0,
    status: 'compliant',
    complianceRate: 100,
    dataSource: 'app-b-20260421.csv',
    ruleVersion: 'V1.2',
    checks: [
      {
        ruleName: '全量检查',
        ruleVersion: 'V1.2',
        status: 'passed',
        dataSource: 'full-check.yaml',
        currentValue: 'all-pass',
        requireValue: 'all-pass',
      },
    ],
    nonCompliantItems: [],
  },
  {
    id: 'I003',
    appName: 'APP-C',
    techStack: 'go',
    inspectedAt: '2026-04-20 06:00',
    compliant: 95,
    nonCompliant: 5,
    status: 'non-compliant',
    complianceRate: 95.0,
    dataSource: 'app-c-20260420.csv',
    ruleVersion: 'V1.5',
    deadlineRemaining: '2天',
    checks: [
      {
        ruleName: 'SSL证书检查',
        ruleVersion: 'V1.5',
        status: 'failed',
        reason: '证书即将过期',
        dataSource: 'ssl-cert.yaml',
        currentValue: '15天',
        requireValue: '>30天',
      },
    ],
    nonCompliantItems: [
      {
        instanceId: '10.0.0.1',
        ruleName: 'SSL证书检查',
        ruleVersion: 'V1.5',
        reason: '证书即将过期',
        riskLevel: 'high',
        dataSource: 'ssl-cert.yaml',
        currentValue: '15天',
        requireValue: '>30天',
        deadlineRemaining: '2天',
      },
    ],
  },
]

// ============================================
// 整改工单数据
// ============================================
export const mockOrders: Order[] = [
  {
    id: 'T001',
    appName: 'APP-A',
    nonCompliantItem: '端口检查',
    riskLevel: 'high',
    remainingTimeMs: 23 * 60 * 60 * 1000, // 23小时
    status: 'pending-confirm',
    handler: '一线管理员 - 张三',
    ruleName: '端口检查',
    checkItem: 'SSL 证书配置',
    reason: '未配置 SSL 证书',
    instanceId: '192.168.1.1',
    dataSource: 'app-a-20260421.csv',
    createdAt: '2026-04-21 08:00',
    techStack: 'java',
    history: [
      { time: '2026-04-21 08:00', content: '系统自动创建工单', user: 'system' },
      { time: '2026-04-21 08:05', content: '派单给一线管理员 - 张三', user: 'system' },
    ],
  },
  {
    id: 'T002',
    appName: 'APP-B',
    nonCompliantItem: 'SSL 配置',
    riskLevel: 'medium',
    remainingTimeMs: 47 * 60 * 60 * 1000, // 47小时
    status: 'pending-rectify',
    handler: '二线管理员 - 李四',
    ruleName: 'SSL 配置检查',
    checkItem: 'SSL 证书有效期',
    reason: 'SSL 证书即将过期',
    instanceId: '192.168.1.2',
    dataSource: 'app-b-20260421.csv',
    createdAt: '2026-04-20 10:00',
    techStack: 'python',
    history: [
      { time: '2026-04-20 10:00', content: '系统自动创建工单', user: 'system' },
      { time: '2026-04-20 10:30', content: '一线管理员确认属实，转单二线', user: '张三' },
    ],
  },
  {
    id: 'T003',
    appName: 'APP-C',
    nonCompliantItem: '内存使用率',
    riskLevel: 'low',
    remainingTimeMs: 72 * 60 * 60 * 1000, // 72小时
    status: 'closed',
    handler: '二线管理员 - 王五',
    ruleName: '内存检查',
    checkItem: '内存使用率',
    reason: '内存使用率超过阈值',
    instanceId: '10.0.0.1',
    dataSource: 'app-c-20260420.csv',
    createdAt: '2026-04-19 14:00',
    techStack: 'go',
    history: [
      { time: '2026-04-19 14:00', content: '系统自动创建工单', user: 'system' },
      { time: '2026-04-19 15:00', content: '一线确认，转单二线', user: '张三' },
      { time: '2026-04-20 16:00', content: '二线提交整改完成', user: '王五' },
      { time: '2026-04-20 17:00', content: '审核通过，工单闭环', user: '系统' },
    ],
  },
]

// ============================================
// 角色数据
// ============================================
export const mockRoles: Role[] = [
  {
    id: 'superadmin',
    name: '平台超管',
    type: 'superadmin',
    description: '全权限，可配置角色、权限、存储路径',
    permissions: {
      rulePermissions: ['view', 'create', 'edit', 'delete'],
      inspectionPermissions: ['view', 'export'],
      orderPermissions: ['view', 'handle', 'create'],
      systemPermissions: ['role', 'config', 'audit'],
    },
    dataPermissions: {
      techStackScope: ['all'],
      appScope: ['all'],
    },
    assignedUsers: [{ id: 'u1', name: '系统管理员' }],
  },
  {
    id: 'tech-admin',
    name: '技术栈管理员',
    type: 'tech-admin',
    description: '操作自己技术栈的规则，查看巡检结果',
    permissions: {
      rulePermissions: ['view', 'edit'],
      inspectionPermissions: ['view'],
      orderPermissions: ['view'],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: ['java', 'python'],
      appScope: [],
    },
    assignedUsers: [
      { id: 'u2', name: 'Java 管理员' },
      { id: 'u3', name: 'Python 管理员' },
    ],
  },
  {
    id: 'one-line-admin',
    name: '一线管理员',
    type: 'one-line-admin',
    description: '查看负责应用结果，确认/转单',
    permissions: {
      rulePermissions: ['view'],
      inspectionPermissions: ['view'],
      orderPermissions: ['view', 'handle'],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: [],
      appScope: ['app-a', 'app-b'],
    },
    assignedUsers: [
      { id: 'u4', name: '一线管理员-张三' },
      { id: 'u5', name: '一线管理员-李四' },
    ],
  },
  {
    id: 'two-line-admin',
    name: '二线管理员',
    type: 'two-line-admin',
    description: '查看负责应用结果，提交整改',
    permissions: {
      rulePermissions: ['view'],
      inspectionPermissions: ['view'],
      orderPermissions: ['view', 'handle'],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: [],
      appScope: ['app-a', 'app-b', 'app-c'],
    },
    assignedUsers: [{ id: 'u6', name: '二线管理员-王五' }],
  },
]

// ============================================
// 用户数据
// ============================================
export const mockUsers: User[] = [
  { id: 'u1', name: '系统管理员', email: 'admin@example.com', department: '技术部' },
  { id: 'u2', name: 'Java 管理员', email: 'java@example.com', department: '技术部' },
  { id: 'u3', name: 'Python 管理员', email: 'python@example.com', department: '技术部' },
  { id: 'u4', name: '一线管理员-张三', email: 'zhangsan@example.com', department: '运维部' },
  { id: 'u5', name: '一线管理员-李四', email: 'lisi@example.com', department: '运维部' },
  { id: 'u6', name: '二线管理员-王五', email: 'wangwu@example.com', department: '运维部' },
]

// ============================================
// CSV 文件上传数据
// ============================================
export const mockUploadedFiles: UploadedFile[] = [
  {
    id: 'file-001',
    originalName: 'server_list.csv',
    fileName: 'server_list_20260421.csv',
    size: 2456789,
    columns: ['server_id', 'server_name', 'ip_address', 'os_type', 'status', 'port', 'environment'],
    rows: 1200,
    alias: 'server_list',
    expanded: false,
    status: 'success',
  },
  {
    id: 'file-002',
    originalName: 'rule_config.csv',
    fileName: 'rule_config_20260421.csv',
    size: 856432,
    columns: ['rule_id', 'rule_name', 'rule_type', 'severity', 'enabled', 'created_at'],
    rows: 350,
    alias: 'rule_config',
    expanded: false,
    status: 'success',
  },
]

// ============================================
// 测试结果数据
// ============================================
export const mockTestResults: TestResult[] = [
  {
    passed: 7,
    total: 10,
    details: [
      { ruleName: 'SSL证书有效期检查', status: 'pass', message: '规则匹配成功，23个服务器符合条件' },
      { ruleName: '端口合规检查', status: 'pass', message: '规则匹配成功，512个端口符合规范' },
      { ruleName: '磁盘空间使用率检查', status: 'pass', message: '规则匹配成功，98%的磁盘使用率低于阈值' },
      { ruleName: '内存使用率检查', status: 'fail', message: '规则匹配失败，发现5个服务器内存使用率超过80%' },
      { ruleName: 'CPU使用率检查', status: 'pass', message: '规则匹配成功，CPU使用率均在合理范围内' },
      { ruleName: '网络连接数检查', status: 'pass', message: '规则匹配成功，网络连接数正常' },
      { ruleName: '日志文件大小检查', status: 'fail', message: '规则匹配失败，发现3个服务器日志文件过大' },
      { ruleName: '用户登录检查', status: 'pass', message: '规则匹配成功，用户登录行为正常' },
      { ruleName: '服务状态检查', status: 'pass', message: '规则匹配成功，所有核心服务运行正常' },
      { ruleName: '备份状态检查', status: 'pass', message: '规则匹配成功，备份任务全部完成' },
    ],
  },
]
