/**
 * 配置巡检 - 类型定义
 * 基于 GaussDB 实际表结构 (iop_mc_inspect_*)
 */

// ==================== 类型定义 ====================

/** iop_mc_inspect_strategy */
export interface InspectStrategy {
  strategy_id: string
  strategy_name: string
  top_type: string // 01基础 02应用
  sub_type: string // 分类表id
  tags: string // 01安全基线 02安全漏洞 03运行优化
  category_id: string
  category_name: string
  test_ip: string
  dept_id: string
  dept_name: string
  strategy_type: string // 01公共 02部门定制
  inspect_scope: string
  status: string // published/draft
  creator: string
  create_time: string
  modifier: string
  modify_time: string
  exec_type: string // 0代理端 1服务端
}

/** iop_mc_inspect_component */
export interface InspectComponent {
  strategy_id: string
  component_id: string
  component_version: string
  component_code: string
  component_name: string
  status: string
  exec_type: string
  param_json: string
}

/** iop_mc_inspect_item */
export interface InspectItem {
  component_id: string
  check_name: string
  component_version: string
  obj_name: string
  std_value: string
  baseline_no: string
  cross_center: string // AC/AE/N
  risk_level: string // 01低 02中 03高
  govern_deadline: string
  govern_component_id: string
  govern_component_name: string
  govern_component_version: string
  govern_desc: string
  status: string
}

/** iop_mc_inspect_plan */
export interface InspectPlan {
  plan_id: string
  strategy_id: string
  dept_id: string
  plan_name: string
  crontab: string
  trial_times: string
  cur_trial_times: string
  trial_ips: string
  status: string // 0试运行 1正式运行 2已取消
  enable_flag: string // 01启动 02暂停 03禁用
  jobtimer_id: string
  category_code: string
  category_name: string
  dept_name: string
  creator: string
  create_time: string
  modifier: string
  modify_time: string
  batch_size: string
  wait_time: string
}

/** iop_mc_inspect_result */
export interface InspectResult {
  detail_id: string // 明细 id（对齐 iop_mc_inspect_exec_detail，统一模型事实源主键）
  strategy_id: string
  dept_id: string
  component_id: string
  check_name: string
  host_name: string
  component_version: string
  job_id: string
  strategy_name: string
  tags: string
  dept_name: string
  category_code: string
  category_name: string
  baseline_no: string
  resource_type: string
  top_type: string
  sub_type: string
  obj_name: string
  std_value: string
  current_value: string
  result_status: string // 正常/异常/警告
  inspect_date: string
  inspect_time: string
  cross_center: string
  risk_level: string
  trial_flag: string // 0试运行 1正式
  is_exception: string // res2: 0/null否 1是
  exception_remark: string
  exception_applicant: string
  exception_apply_time: string
  admin_name: string
  admin_id: string
  admin_group: string
  // 截图中的额外展示字段
  app_id: string
  app_name: string
  ip: string
}

/** iop_mc_inspect_exec_detail (历史结果) */
export interface InspectExecDetail {
  detail_id: string
  plan_id: string
  jobtimer_id: string
  job_id: string
  component_id: string
  component_version: string
  trial_flag: string
  check_name: string
  ip: string
  host_name: string
  resource_type: string
  obj_name: string
  std_value: string
  current_value: string
  baseline_no: string
  result_status: string
  inspect_date: string
  inspect_time: string
}

/** iop_mc_inspect_exec_miss (缺失结果) */
export interface InspectExecMiss {
  miss_id: string
  plan_id: string
  strategy_id: string
  component_id: string
  check_name: string
  obj_name: string
  ip: string
  host_name: string
  resource_type: string
  inspect_date: string
  inspect_time: string
}

// ==================== 策略分类树 ====================

export interface CategoryNode {
  id: string
  label: string
  children?: CategoryNode[]
}

// ==================== 机器资源 ====================

export interface MachineInfo {
  host_name: string
  ip: string
  resource_type: string
  app_id: string
  app_name: string
  admin_name: string
  admin_group: string
}

// ==================== 统一模型扩展（2026-08-17 菜单合并，对齐 schema.sql） ====================

/** iop_mc_inspect_execution（执行批次：一次计划执行 = 1 条） */
export interface InspectExecution {
  job_id: string // 单次作业 id（主键）
  jobtimer_id: string // 定时作业 id
  plan_id: string
  strategy_id: string
  component_id: string
  component_version: string
  trial_flag: string // 0 试运行 1 正式
  dept_id: string
  dept_name: string
  inspect_date: string
  inspect_time: string
  strategy_name: string
  top_type: string
  sub_type: string
  tags: string
  exec_status: string // 0 未执行 1 已执行 2 不需轮询
  category_code: string
  category_name: string
}

/** 汇总视图行（demo 按应用聚合，字段语义对齐 iop_mc_inspect_summary） */
export interface InspectAppSummary {
  app_id: string
  app_name: string
  tech_stack: string
  strategy_name: string
  dept_name: string
  inspect_date: string
  latest_inspect_time: string
  tar_num: number // 应执行目标数
  actual_target_num: number // 实际执行目标数
  check_num: number // 检查条目数
  abnormal_num: number // 异常项数
  warning_num: number
  exception_num: number // 已申请例外数
  compliance_rate: number // 合规率（派生）
}

/** 治理单状态（demo 工单流程：待确认→待整改→整改待审核→已闭环/已驳回） */
export type GovernStatus = 'pending-confirm' | 'pending-rectify' | 'pending-review' | 'closed' | 'rejected'

/** 治理单处理记录（demo 时间线） */
export interface GovernHistoryItem {
  time: string
  content: string
  user: string
}

/**
 * iop_mc_inspect_govern（治理表，前端呈现为"整改工单"）
 * 联合主键：check_name + obj_name + host_name
 */
export interface InspectGovern {
  govern_id: string // demo 补充的展示 id
  check_name: string
  obj_name: string
  host_name: string
  ip: string
  remain_time: string // 剩余整改时间
  start_date: string // 异常起始日期
  dept_id: string
  category_code: string
  category_name: string
  resource_type: string
  // demo 扩展字段（前端工单展示用，真实表通过 check_name+host_name 关联明细）
  strategy_name?: string
  risk_level?: string
  handler?: string
  detail_ids?: string[] // 关联的明细 detail_id（demo 用于钻取）
  app_name?: string // 从机器资源派生
  status?: GovernStatus // demo 工单流程状态
  remaining_time_ms?: number
  history?: GovernHistoryItem[]
}

/** 例外审批状态（iop_mc_inspect_exception.status，demo 预留不做 UI） */
export type ExceptionStatus = '0' | '1' | '2' | '3' // 0 例外审批中 1 审批通过 2 取消审批中 3 取消审批通过

/** iop_mc_inspect_exception（例外审批表，双轨设计） */
export interface InspectException {
  exception_id: string
  check_name: string
  obj_name: string
  host_name: string
  applicant: string // 例外申请人中文名
  appl_user_id: string
  appl_time: string
  check_type: string // 健康检查类型
  remark: string
  excep_end_date: string // 例外截止日期
  work_order_id: string // 流程工单 id
  status: ExceptionStatus
  // demo 例外申请即生效：status 直接置 '1'（审批通过），接真 API 时启用审批流
}
