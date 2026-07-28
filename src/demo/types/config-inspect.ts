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
