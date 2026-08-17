import type {
  GovernStatus,
  InspectAppSummary,
  InspectException,
  InspectGovern,
  InspectResult,
} from '~/demo/types/config-inspect'
/**
 * 配置巡检 - 统一 API 层（2026-08-17 菜单合并）
 * 数据源：mock/config-inspect.ts 统一模型（results 为唯一事实源，其余派生）
 * 对齐文档：docs/config-inspect/巡检合并-统一数据模型对齐.md
 */
import {
  appSummaries,
  exceptions,
  getHistoryDetails,
  governs,
  missResults,
  results,
} from '~/demo/mock/config-inspect'

// ==================== 通用类型（api 层内部使用，不导出避免与 types/inspection 撞名） ====================

interface PaginationParams {
  currentPage: number
  pageSize: number
}

interface PaginationResponse<T> {
  list: T[]
  total: number
  currentPage: number
  pageSize: number
}

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

function ok<T>(data: T): Promise<ApiResponse<T>> {
  return Promise.resolve({ code: 0, message: 'success', data })
}

function paginate<T>(list: T[], p: PaginationParams): PaginationResponse<T> {
  return {
    list: list.slice((p.currentPage - 1) * p.pageSize, p.currentPage * p.pageSize),
    total: list.length,
    currentPage: p.currentPage,
    pageSize: p.pageSize,
  }
}

function delay<T>(data: T): Promise<ApiResponse<T>> {
  return new Promise(resolve => setTimeout(() => resolve(ok(data)), 200))
}

// ==================== 汇总视图（按应用聚合） ====================

export interface SummaryFilter {
  appName: string
  strategyName: string
  status: 'all' | 'compliant' | 'non-compliant'
}

/** 汇总视图列表（字段语义对齐 iop_mc_inspect_summary） */
export function getAppSummaries(
  filter: Partial<SummaryFilter>,
  pagination: PaginationParams,
): Promise<ApiResponse<PaginationResponse<InspectAppSummary>>> {
  const filtered = appSummaries.filter((s) => {
    if (filter.appName && !s.app_name.includes(filter.appName))
      return false
    if (filter.strategyName && !s.strategy_name.includes(filter.strategyName))
      return false
    if (filter.status === 'compliant' && s.abnormal_num + s.warning_num > 0)
      return false
    if (filter.status === 'non-compliant' && s.abnormal_num + s.warning_num === 0)
      return false
    return true
  })
  return delay(paginate(filtered, pagination))
}

/** 汇总视图统计卡片数据（从同一事实源计算，与列表天然一致） */
export interface SummaryStats {
  executionCount: number // 巡检次数（执行批次数）
  complianceRate: number // 整体合规率
  abnormalNum: number // 异常项数
  warningNum: number
  exceptionNum: number // 已申请例外数
  totalCheckNum: number
}

export function getSummaryStats(): Promise<ApiResponse<SummaryStats>> {
  const totalCheckNum = appSummaries.reduce((acc, s) => acc + s.check_num, 0)
  const abnormalNum = appSummaries.reduce((acc, s) => acc + s.abnormal_num, 0)
  const warningNum = appSummaries.reduce((acc, s) => acc + s.warning_num, 0)
  const exceptionNum = appSummaries.reduce((acc, s) => acc + s.exception_num, 0)
  return delay({
    executionCount: new Set(results.map(r => r.job_id)).size,
    complianceRate: totalCheckNum === 0
      ? 100
      : Math.round(((totalCheckNum - abnormalNum - warningNum) / totalCheckNum) * 1000) / 10,
    abnormalNum,
    warningNum,
    exceptionNum,
    totalCheckNum,
  })
}

// ==================== 明细视图（检查项级事实源） ====================

export interface ResultFilter {
  appName: string
  strategyName: string
  checkName: string
  resultStatus: string
  tags: string
  isException: string
  hostName: string
  ip: string
  resourceType: string
  deptName: string
  detailIds?: string[] // 钻取/工单关联用
}

/** 明细视图列表（唯一事实源 iop_mc_inspect_exec_detail） */
export function getResults(
  filter: Partial<ResultFilter>,
  pagination: PaginationParams,
): Promise<ApiResponse<PaginationResponse<InspectResult>>> {
  const filtered = results.filter((r) => {
    if (filter.detailIds && !filter.detailIds.includes(r.detail_id))
      return false
    if (filter.appName && !r.app_name.includes(filter.appName))
      return false
    if (filter.strategyName && !r.strategy_name.includes(filter.strategyName))
      return false
    if (filter.checkName && !r.check_name.includes(filter.checkName))
      return false
    if (filter.resultStatus && r.result_status !== filter.resultStatus)
      return false
    if (filter.tags && r.tags !== filter.tags)
      return false
    if (filter.isException === '1' && r.is_exception !== '1')
      return false
    if (filter.isException === '0' && r.is_exception === '1')
      return false
    if (filter.hostName && !filter.hostName.split(',').some(h => r.host_name.toLowerCase().includes(h.trim().toLowerCase())))
      return false
    if (filter.ip && !r.ip.includes(filter.ip))
      return false
    if (filter.resourceType && r.resource_type !== filter.resourceType)
      return false
    if (filter.deptName && r.dept_name !== filter.deptName)
      return false
    return true
  })
  return delay(paginate(filtered, pagination))
}

/** 历史检查结果（明细表历史数据） */
export function getHistoryResult(hostName: string, checkName: string) {
  return ok(getHistoryDetails(hostName, checkName))
}

/** 缺失巡检结果 */
export function getMissResults() {
  return ok(missResults)
}

// ==================== 治理单（整改工单） ====================

export interface GovernFilter {
  status: 'all' | GovernStatus
  riskLevel: string
  strategyName: string
  appName: string
}

/** 治理单列表（iop_mc_inspect_govern，前端呈现为整改工单） */
export function getGoverns(
  filter: Partial<GovernFilter>,
  pagination: PaginationParams,
): Promise<ApiResponse<PaginationResponse<InspectGovern>>> {
  const filtered = governs.filter((g) => {
    if (filter.status && filter.status !== 'all' && g.status !== filter.status)
      return false
    if (filter.riskLevel && g.risk_level !== filter.riskLevel)
      return false
    if (filter.strategyName && !g.strategy_name?.includes(filter.strategyName))
      return false
    if (filter.appName && !g.app_name?.includes(filter.appName))
      return false
    return true
  })
  return delay(paginate(filtered, pagination))
}

/** 从明细批量创建治理单（demo：toast 模拟，真实为写 govern 表） */
export function createGovernsFromDetails(detailIds: string[]): Promise<ApiResponse<number>> {
  const abnormalCount = results.filter(r => detailIds.includes(r.detail_id) && r.result_status === '异常').length
  return delay(abnormalCount)
}

/** 治理单详情 */
export function getGovernDetail(governId: string): Promise<ApiResponse<InspectGovern | undefined>> {
  return ok(governs.find(g => g.govern_id === governId))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function nowStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 治理单处理（误报闭环/提交整改/转单/重新打开，demo 内存态更新） */
export function handleGovern(
  governId: string,
  action: 'falseAlarm' | 'rectify' | 'transfer' | 'reopen',
  payload?: { reason?: string, handler?: string, note?: string },
): Promise<ApiResponse<void>> {
  const g = governs.find(x => x.govern_id === governId)
  if (!g)
    return Promise.resolve({ code: 1, message: '治理单不存在', data: undefined })
  const time = nowStr()
  if (action === 'falseAlarm') {
    g.status = 'closed'
    g.history?.push({ time, content: `一线确认为误报，闭环处理。原因：${payload?.reason || '-'}`, user: '当前用户' })
  }
  else if (action === 'transfer') {
    g.status = 'pending-rectify'
    g.handler = payload?.handler
    g.history?.push({ time, content: `确认属实，转单二线（${payload?.handler}）。说明：${payload?.note || '-'}`, user: '当前用户' })
  }
  else if (action === 'rectify') {
    g.status = 'pending-review'
    g.history?.push({ time, content: `提交整改。说明：${payload?.note || '-'}`, user: '当前用户' })
  }
  else if (action === 'reopen') {
    g.status = 'pending-confirm'
    g.history?.push({ time, content: '工单重新打开，回到待确认状态', user: '当前用户' })
  }
  return Promise.resolve({ code: 0, message: 'success', data: undefined })
}

// ==================== 例外（双轨：明细内嵌 + exception 列表） ====================

/** 例外审批记录列表（iop_mc_inspect_exception，demo 申请即生效） */
export function getExceptions(): Promise<ApiResponse<InspectException[]>> {
  return ok(exceptions)
}

/** 申请例外（demo：更新明细 is_exception 标记，真实为写 exception 表 + 审批流） */
export function applyException(detailIds: string[], remark: string, applicant: string): Promise<ApiResponse<number>> {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  let count = 0
  for (const r of results) {
    if (detailIds.includes(r.detail_id) && r.result_status !== '正常' && r.is_exception !== '1') {
      r.is_exception = '1'
      r.exception_remark = remark
      r.exception_applicant = applicant
      r.exception_apply_time = timeStr
      exceptions.push({
        exception_id: `EXC${String(exceptions.length + 1).padStart(4, '0')}`,
        check_name: r.check_name,
        obj_name: r.obj_name,
        host_name: r.host_name,
        applicant,
        appl_user_id: r.admin_id,
        appl_time: timeStr,
        check_type: r.top_type,
        remark,
        excep_end_date: '2026-12-31',
        work_order_id: `WO-2026-${String(exceptions.length + 1).padStart(4, '0')}`,
        status: '1', // demo：申请即生效（审批通过）
      })
      count++
    }
  }
  // 同步更新汇总（重新计算该应用的 exception_num）
  for (const s of appSummaries) {
    s.exception_num = results.filter(r => r.app_id === s.app_id && r.is_exception === '1').length
  }
  return delay(count)
}

/** 导出（demo：返回条数，真实为文件流） */
export function exportResults(count: number): Promise<ApiResponse<number>> {
  return delay(count)
}
