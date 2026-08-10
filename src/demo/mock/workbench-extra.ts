/**
 * 操作工作台 - 补充 mock 数据
 *
 * 统一管理原先散落在 composable（useWorkbench.ts）和页面（index.vue onMounted）中的
 * 硬编码数据：定制草稿、应急场景、编排草稿、最近执行、编排执行历史、执行历史明细。
 *
 * - 静态数据（草稿/场景）：直接导出常量
 * - 含时间数据（执行记录）：导出工厂函数，调用时基于当前时间生成相对时间
 */
import type {
  CustomDraft,
  ExecutionRecord,
  OrchestrationExecutionRecord,
  PublicComponentSource,
  Scenario,
  ScenarioDraft,
} from '../types/workbench'
import { mockDraftSnapshotV3 } from './workbench-version'

// ============ 应用定制 - 我的草稿 ============
export const mockCustomDrafts: CustomDraft[] = [
  {
    id: 'd1',
    name: '定制应用健康检查（编辑中）',
    saveTime: '2024-01-15 10:30',
    sourceOperationId: 'op0901-1',
    status: 'draft',
    baseVersionNo: 3,
    snapshot: mockDraftSnapshotV3,
    updater: '贺诗辉',
  },
  { id: 'd2', name: '应用部署脚本', saveTime: '2024-01-14 16:20', status: 'draft', updater: '李明' },
  { id: 'd3', name: '日志导出优化', saveTime: '2024-01-13 09:15', status: 'draft', updater: '王芳' },
]

// ============ 实例固化 - 来源公共组件 ============
/**
 * isScript=true  → 执行脚本类公共组件：操作分类可选（复用定制模式列表）+ 风险反显 + 需成功判定规则
 * isScript=false → 其他公共操作（通用命令/API等）：操作分类继承来源 + 无需成功判定规则
 */
export const mockPublicSources: PublicComponentSource[] = [
  {
    id: 'SRV20260101000001',
    name: 'Redis主从切换（Shell脚本）',
    templateType: '1',
    templateId: 'TPL20260001',
    isScript: true,
    category: 'startstop',
    params: [
      { name: 'master_node', cnName: '主节点', ctrlType: '0', presetValue: '' },
      { name: 'slave_node', cnName: '从节点', ctrlType: '0', presetValue: '' },
      { name: 'confirm', cnName: '确认切换', ctrlType: '1', presetValue: 'yes,no' },
    ],
  },
  {
    id: 'SRV20260101000002',
    name: '集群状态检查（Shell脚本）',
    templateType: '1',
    templateId: 'TPL20260002',
    isScript: true,
    category: 'query',
    params: [
      { name: 'cluster_id', cnName: '集群ID', ctrlType: '0', presetValue: '' },
      { name: 'env', cnName: '环境', ctrlType: '1', presetValue: 'prod,staging,dev' },
    ],
  },
  {
    id: 'SRV20260101000003',
    name: '服务重启（Agent通用命令）',
    templateType: '0',
    templateId: '-',
    isScript: false,
    category: 'startstop',
    params: [
      { name: 'service_name', cnName: '服务名', ctrlType: '0', presetValue: '' },
    ],
  },
  {
    id: 'SRV20260101000004',
    name: '数据库备份（API调用）',
    templateType: '3',
    templateId: 'TPL20260004',
    isScript: false,
    category: 'verify',
    params: [
      { name: 'db_name', cnName: '数据库名', ctrlType: '0', presetValue: '' },
      { name: 'backup_type', cnName: '备份类型', ctrlType: '1', presetValue: 'full,incremental' },
    ],
  },
]

// ============ 操作编排 - 正式场景 ============
export const mockScenarios: Scenario[] = [
  { id: '1', name: '场景1', hasAlert: true, isEditing: false, hasStart: false, updater: '贺诗辉', updateTime: '2024-01-15 11:30' },
  { id: '2', name: '场景2', hasAlert: false, isEditing: false, hasStart: false, updater: '李明', updateTime: '2024-01-14 09:45' },
  { id: '3', name: '场景3', hasAlert: false, isEditing: false, hasStart: true, updater: '王芳', updateTime: '2024-01-13 16:20' },
  { id: '4', name: '场景4', hasAlert: false, isEditing: true, hasStart: true, updater: '贺诗辉', updateTime: '2024-01-12 14:00' },
  { id: '5', name: '场景5', hasAlert: false, isEditing: false, hasStart: true, updater: '赵强', updateTime: '2024-01-11 10:30' },
]

// ============ 操作编排 - 我的草稿 ============
export const mockScenarioDrafts: ScenarioDraft[] = [
  { id: 'sd1', name: '场景1（编辑中）', saveTime: '2024-01-15 11:30', sourceScenarioId: '1', status: 'draft', updater: '贺诗辉' },
  { id: 'sd2', name: '应急恢复流程', saveTime: '2024-01-14 17:20', status: 'draft', updater: '李明' },
  { id: 'sd3', name: '故障切换优化', saveTime: '2024-01-13 10:15', status: 'draft', updater: '王芳' },
]

/**
 * 最近执行状态栏 - 操作组件执行记录（5条）
 * 时间基于当前时刻生成（running/success/failed 混合）
 */
export function createMockRecentExecutions(): ExecutionRecord[] {
  const now = new Date()
  return [
    {
      id: 'mock-1',
      type: 'operation',
      name: '集群状态检查',
      status: 'running',
      operator: '当前用户',
      executeTime: now.toISOString(),
      totalCount: 5,
      successCount: 3,
      duration: 0,
      details: [],
    },
    {
      id: 'mock-2',
      type: 'operation',
      name: '服务重启',
      status: 'success',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      totalCount: 3,
      successCount: 3,
      duration: 12.5,
      details: [],
    },
    {
      id: 'mock-3',
      type: 'operation',
      name: '日志清理',
      status: 'failed',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      totalCount: 4,
      successCount: 2,
      duration: 8.3,
      details: [],
    },
    {
      id: 'mock-4',
      type: 'operation',
      name: '配置更新',
      status: 'success',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      totalCount: 2,
      successCount: 2,
      duration: 5.2,
      details: [],
    },
    {
      id: 'mock-5',
      type: 'operation',
      name: '节点扩容',
      status: 'running',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      totalCount: 6,
      successCount: 4,
      duration: 0,
      details: [],
    },
  ]
}

/**
 * 编排执行历史（3条）+ 最近执行状态栏编排记录
 * 含作业明细（jobs），时间基于当前时刻生成
 */
export function createMockOrchestrationHistory(): OrchestrationExecutionRecord[] {
  const now = new Date()
  return [
    {
      id: 'orch-1',
      orchestrationId: 'orch-1',
      name: '日常巡检编排',
      appSystem: '一体化生产运维平台',
      submitter: 'heshihui',
      totalJobCount: 3,
      status: 'success',
      executeTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      jobs: [
        { jobName: '作业链1', channel: '操作中心', status: 'success', startTime: '2026/07/21 14:30:00', submitter: 'heshihui', reviewer: 'corgi' },
        { jobName: '作业链2', channel: '操作中心', status: 'success', startTime: '2026/07/21 14:31:00', submitter: 'heshihui', reviewer: 'corgi' },
        { jobName: '作业链3', channel: '操作中心', status: 'success', startTime: '2026/07/21 14:32:00', submitter: 'heshihui', reviewer: 'corgi' },
      ],
    },
    {
      id: 'orch-2',
      orchestrationId: 'orch-2',
      name: '应急恢复流程',
      appSystem: '一体化生产运维平台',
      submitter: 'libinyfzx',
      totalJobCount: 2,
      status: 'failed',
      executeTime: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      jobs: [
        { jobName: '作业链1', channel: '操作中心', status: 'success', startTime: '2026/07/21 14:15:00', submitter: 'libinyfzx', reviewer: 'ADP' },
        { jobName: '作业链2', channel: '操作中心', status: 'failed', startTime: '2026/07/21 14:16:00', submitter: 'libinyfzx', reviewer: 'ADP' },
      ],
    },
    {
      id: 'orch-3',
      orchestrationId: 'orch-3',
      name: '故障切换测试',
      appSystem: '一体化生产运维平台',
      submitter: 'tangjinyu',
      totalJobCount: 4,
      status: 'running',
      executeTime: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
      jobs: [
        { jobName: '作业链1', channel: '操作中心', status: 'success', startTime: '2026/07/21 14:00:00', submitter: 'tangjinyu', reviewer: '' },
        { jobName: '作业链2', channel: '操作中心', status: 'success', startTime: '2026/07/21 14:01:00', submitter: 'tangjinyu', reviewer: '' },
        { jobName: '作业链3', channel: '操作中心', status: 'running', startTime: '2026/07/21 14:02:00', submitter: 'tangjinyu', reviewer: '' },
        { jobName: '作业链4', channel: '操作中心', status: 'pending', startTime: '', submitter: 'tangjinyu', reviewer: '' },
      ],
    },
  ]
}

/**
 * 执行历史抽屉 - 操作组件历史记录（4条，含资源明细）
 * 与最近执行状态栏共享 mock-1 ~ mock-4 的 id（同一次执行在两处展示）
 */
export function createMockHistoryData(): ExecutionRecord[] {
  const now = new Date()
  return [
    {
      id: 'mock-1',
      type: 'operation',
      name: '集群状态检查',
      status: 'running',
      operator: '当前用户',
      executeTime: now.toISOString(),
      totalCount: 5,
      successCount: 3,
      duration: 0,
      details: [
        { serviceSeqId: '1', pkValue: 'node-01', pkDisplay: 'node-01', execStatus: 'S', duration: 2 },
        { serviceSeqId: '2', pkValue: 'node-02', pkDisplay: 'node-02', execStatus: 'S', duration: 3 },
        { serviceSeqId: '3', pkValue: 'node-03', pkDisplay: 'node-03', execStatus: 'P' },
        { serviceSeqId: '4', pkValue: 'node-04', pkDisplay: 'node-04', execStatus: 'R' },
        { serviceSeqId: '5', pkValue: 'node-05', pkDisplay: 'node-05', execStatus: 'R' },
      ],
    },
    {
      id: 'mock-2',
      type: 'operation',
      name: '服务重启',
      status: 'success',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      totalCount: 3,
      successCount: 3,
      duration: 12.5,
      details: [
        { serviceSeqId: '1', pkValue: 'service-a', pkDisplay: 'service-a', execStatus: 'S', duration: 4 },
        { serviceSeqId: '2', pkValue: 'service-b', pkDisplay: 'service-b', execStatus: 'S', duration: 5 },
        { serviceSeqId: '3', pkValue: 'service-c', pkDisplay: 'service-c', execStatus: 'S', duration: 3.5 },
      ],
    },
    {
      id: 'mock-3',
      type: 'operation',
      name: '日志清理',
      status: 'failed',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      totalCount: 4,
      successCount: 2,
      duration: 8.3,
      details: [
        { serviceSeqId: '1', pkValue: 'server-01', pkDisplay: 'server-01', execStatus: 'S', duration: 2 },
        { serviceSeqId: '2', pkValue: 'server-02', pkDisplay: 'server-02', execStatus: 'S', duration: 2.5 },
        { serviceSeqId: '3', pkValue: 'server-03', pkDisplay: 'server-03', execStatus: 'F', duration: 1.8, errorMsg: '磁盘空间不足' },
        { serviceSeqId: '4', pkValue: 'server-04', pkDisplay: 'server-04', execStatus: 'F', duration: 2, errorMsg: '权限不足' },
      ],
    },
    {
      id: 'mock-4',
      type: 'operation',
      name: '配置更新',
      status: 'success',
      operator: '当前用户',
      executeTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      totalCount: 2,
      successCount: 2,
      duration: 5.2,
      details: [
        { serviceSeqId: '1', pkValue: 'config-01', pkDisplay: 'config-01', execStatus: 'S', duration: 2.6 },
        { serviceSeqId: '2', pkValue: 'config-02', pkDisplay: 'config-02', execStatus: 'S', duration: 2.6 },
      ],
    },
  ]
}
