/**
 * 操作工作台 - 类型定义
 */

// 应用模块
export interface AppModule {
  id: string
  name: string
  code: string
}

// 参数配置字段
export interface ParamField {
  field: string
  label: string
  type: 'input' | 'select' | 'date' | 'textarea' | 'checkbox'
  required: boolean
  options?: { label: string, value: string }[]
  placeholder?: string
  defaultValue?: any
}

// 操作组件
export interface OperationComponent {
  id: string
  name: string
  description: string
  category: string // 一级分类：CCE、操作系统、数据库、中间件等
  subCategory: string // 二级分类
  executeCount: number // 执行次数
  isFavorite: boolean // 是否收藏
  riskLevel?: string // 风险等级（由 operationCategory 经 RISK_MAP 推导）
  tags?: string[] // 权限提示（执行范围约束，风险等级推导+可人工覆盖，用户不可自定义；见《操作组件筛选与自定义标签-交互设计》§2）
  paramConfig: ParamField[] // 参数配置
  versionNo?: number // 当前线上版本号（应用定制组件）
  updater?: string // 最近更新人（表单视图展示）
  updateTime?: string // 最近更新时间（表单视图展示）
  operationCategory?: OperationCategory // 操作分类（查询/验证/启停/配置变更/部署发布/清理回收，公共组件与定制共用枚举）
  customTags?: string[] // 自定义标签（应用系统范围内公用；公共组件恒为空）
}

// 编排状态
export type OrchestrationStatus = 'normal' | 'warning' | 'disabled'

// 编排
export interface Orchestration {
  id: string
  name: string
  stepCount: number
  status: OrchestrationStatus
  lastExecuteTime: string
  paramConfig: ParamField[]
}

// 执行记录状态
export type ExecutionStatus = 'success' | 'failed' | 'running' | 'cancelled'

// 编排执行状态（对应截图中的状态）
export type OrchestrationExecutionStatus = 'success' | 'failed' | 'running' | 'pending' | 'terminated'

// 执行明细状态
export type ExecutionDetailStatus = 'S' | 'F' | 'P' | 'R'

// 执行明细
export interface ExecutionDetail {
  serviceSeqId: string
  pkValue: string
  pkDisplay: string
  execStatus: ExecutionDetailStatus
  paramsInfo?: Record<string, any>
  resourceInfo?: Record<string, any>
  errorMsg?: string
  startTime?: string
  endTime?: string
  duration?: number
}

// 编排作业明细
export interface OrchestrationJob {
  jobName: string // 作业名称
  channel: string // 发起渠道
  status: OrchestrationExecutionStatus // 执行状态
  startTime: string // 开始时间
  submitter: string // 提交人
  reviewer: string // 复核人
}

// 编排执行记录
export interface OrchestrationExecutionRecord {
  id: string
  orchestrationId: string
  name: string // 编排名称
  appSystem: string // 应用系统
  submitter: string // 提交人
  totalJobCount: number // 总作业数
  status: OrchestrationExecutionStatus // 执行状态
  executeTime: string // 执行时间
  jobs: OrchestrationJob[] // 作业明细
}

// 执行记录
export interface ExecutionRecord {
  id: string
  type: 'operation' | 'orchestration'
  name: string
  status: ExecutionStatus
  execStatus?: ExecutionDetailStatus // S/F/P/R
  duration?: number // 耗时（秒）
  operator: string
  executeTime: string
  endTime?: string
  totalCount: number
  successCount: number
  params?: Record<string, any>
  details: ExecutionDetail[]
}

// 参数模板
export interface ParamTemplate {
  id: string
  name: string
  componentId: string // 关联的组件ID
  params: Record<string, any>
  createTime: string
}

// 操作工作台数据
export interface WorkbenchData {
  modules: AppModule[]
  operations: OperationComponent[]
  orchestrations: Orchestration[]
  executionHistory: ExecutionRecord[]
  paramTemplates: ParamTemplate[]
}

// 草稿类型定义
export interface CustomDraft {
  id: string
  name: string
  saveTime: string
  sourceOperationId?: string
  status: 'draft' | 'submitted' | 'published' | 'rejected'
  batchId?: string
  /** 编辑草稿时的表单快照（用于回填弹窗） */
  snapshot?: CustomComponentForm
  /** 草稿基线版本号（编辑正式操作时记录，用于冲突检测） */
  baseVersionNo?: number
  /** 最近更新人（表单视图展示） */
  updater?: string
}

// 发布批次类型定义
export interface PublishBatch {
  id: string
  name: string
  description: string
  draftIds: string[]
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  createTime: string
  submitTime?: string
}

// 场景类型定义
export interface Scenario {
  id: string
  name: string
  hasAlert: boolean
  isEditing: boolean
  hasStart: boolean
  /** 最近更新人（表单视图展示） */
  updater?: string
  /** 最近更新时间（表单视图展示） */
  updateTime?: string
}

// 场景草稿类型定义
export interface ScenarioDraft {
  id: string
  name: string
  saveTime: string
  sourceScenarioId?: string
  status: 'draft' | 'submitted' | 'published' | 'rejected'
  batchId?: string
  /** 最近更新人（表单视图展示） */
  updater?: string
}

// ============ 应用定制组件入库 ============

/** 模板大类：脚本类 / API类 */
export type TemplateCategory = 'script' | 'api'

/** 入库模式：定制 / 实例固化 */
export type ComponentMode = 'custom' | 'instance'

/** 操作分类（与定制模式共用） */
export type OperationCategory = 'query' | 'verify' | 'startstop' | 'config' | 'deploy' | 'cleanup'

/** 风险等级编码 */
export type RiskLevelCode = '01' | '02' | '03'

export interface RiskInfo {
  code: RiskLevelCode
  level: string
  tagType: 'success' | 'warning' | 'danger'
}

/** 操作分类 → 风险等级 推算规则 */
export const RISK_MAP: Record<OperationCategory, RiskInfo> = {
  query: { code: '01', level: '低风险', tagType: 'success' },
  verify: { code: '02', level: '中风险', tagType: 'warning' },
  startstop: { code: '03', level: '高风险', tagType: 'danger' },
  config: { code: '03', level: '高风险', tagType: 'danger' },
  deploy: { code: '03', level: '高风险', tagType: 'danger' },
  cleanup: { code: '02', level: '中风险', tagType: 'warning' },
}

export const CATEGORY_NAMES: Record<OperationCategory, string> = {
  query: '查询',
  verify: '验证',
  startstop: '启停',
  config: '配置变更',
  deploy: '部署发布',
  cleanup: '清理回收',
}

/** 脚本子类型（templateType 编号） */
export interface ScriptSubtype {
  value: string
  label: string
  lang: string // 语法高亮语言标识
  scripttype: string // scriptlibrary.scripttype 写入值
}

export const SCRIPT_SUBTYPES: ScriptSubtype[] = [
  { value: '1', label: 'Shell', lang: 'shell', scripttype: '1' },
  { value: '2', label: 'Python2', lang: 'python', scripttype: '2' },
  { value: '6', label: 'Python3', lang: 'python', scripttype: '6' },
  { value: '5', label: 'SQL', lang: 'sql', scripttype: '5' },
  { value: 'g', label: 'Groovy', lang: 'groovy', scripttype: 'a' },
]

/** API 报文格式 */
export type ApiBodyFormat = 'json' | 'form'

/** 参数控件类型（对应 app_parm_info.ctrltype） */
export type ParmCtrlType = '0' | '1' | '2' | '3' | '4'

export const CTRL_TYPE_NAMES: Record<ParmCtrlType, string> = {
  0: '输入框',
  1: '单选框',
  2: '多选框',
  3: '时间下拉',
  4: '计数器',
}

/** 参数来源：模板提取 / 手动添加 / 继承来源 */
export type ParmSource = 'template' | 'manual' | 'inherit'

/** 参数定义（对应 app_parm_info / serv_ins_parm） */
export interface ComponentParm {
  id: string
  name: string // 参数名(英文)
  cnName: string // 中文名
  ctrlType: ParmCtrlType
  presetValue: string // 预设值/选项
  validateRule: string // 校验规则
  encrypted: boolean // 是否加密
  source: ParmSource
}

/** KV 行（Headers / form-urlencoded 键值对） */
export interface KVRow {
  id: string
  key: string
  value: string
}

/** 公共组件来源（实例固化模式用） */
export interface PublicComponentSource {
  id: string // servicename
  name: string
  templateType: string
  templateId: string
  /** true=执行脚本类公共组件：分类可选+需成功判定规则；false=其他公共操作：分类继承+无需判定规则 */
  isScript: boolean
  category: OperationCategory
  params: Omit<ComponentParm, 'id' | 'source' | 'encrypted' | 'validateRule'>[]
}

/** 定制模式表单（Step1+Step2） */
export interface CustomComponentForm {
  servicename: string
  servicecnname: string
  category: OperationCategory | ''
  timeout: number
  description: string
  tplCategory: TemplateCategory | ''
  // 脚本类
  scriptSubtype: string
  scriptContent: string
  scriptSuccessFlag: string
  // API类
  apiSubtype: 'http' | 'tcp'
  apiProtocol: 'https' | 'http'
  apiMethod: string
  apiUrl: string
  apiHeaders: KVRow[]
  apiBodyFormat: ApiBodyFormat
  apiBodyJson: string
  apiFormRows: KVRow[]
  tcpHost: string
  tcpPort: string
  tcpContent: string
  apiSuccessFlag: string
  // 参数
  parms: ComponentParm[]
}

/** 实例固化模式表单 */
export interface InstanceForm {
  sourceId: string
  instanceName: string
  category: OperationCategory | '' // 仅脚本类来源需要选择
  successRule: string // 仅脚本类来源需要填写
  description: string
  fixValues: Record<string, string> // 参数固化值 parmName → value
}

// ============ 编辑操作与版本历史 ============

/**
 * 组件弹窗场景：
 * - create          新建（默认）
 * - editPublished   编辑正式操作（生成草稿副本，servicename/tplCategory 锁定）
 * - editDraft       编辑已有草稿
 * - viewDraft       查看草稿（只读模式）
 */
export type ComponentScene = 'create' | 'editPublished' | 'editDraft' | 'viewDraft'

/** 变更类型：create=初始创建 / update=编辑发布 */
export type VersionChangeType = 'create' | 'update'

/**
 * 版本快照 —— 发布时对表单关键字段的完整序列化副本
 * 对应 DB 表 iop_mc_app_serv_version.snapshot（JSON 存储）
 */
export interface OperationSnapshot {
  nameEn: string
  nameCn: string
  category: string // 分类中文名（查询/启停/…）
  risk: string // 风险等级中文名（低/中/高）
  tplType: string // 模板大类展示名（脚本 · Shell / API · HTTP …）
  timeout: string // 超时时间展示值（如 "60 秒"）
  successFlag: string // 成功判定规则
  description: string
  script: string // 脚本内容（脚本类）或 API 配置摘要（API类）
}

/** 操作版本记录（对应 iop_mc_app_serv_version） */
export interface OperationVersion {
  id: string
  operationId: string
  versionNo: number
  publishTime: string
  publisher: string
  changeType: VersionChangeType
  changeSummary: string[]
  snapshot: OperationSnapshot
}

/** 字段级 diff 行 */
export interface DiffRow {
  key: string
  label: string
  isCode: boolean
  oldVal: string
  newVal: string
  changed: boolean
}

/** 脚本行级 diff（LCS 对齐） */
export interface CodeDiffLine {
  no: number
  text: string
  diff: boolean
}

// ============ 自定义标签约束（筛选与标签管理共用）============

/** 单个操作最多可绑定的自定义标签数 */
export const MAX_CUSTOM_TAGS = 5

/** 标签名最大字符数 */
export const TAG_MAX_LENGTH = 12

/** 标签名校验：trim 后非空且不超长（设计文档 §8 边界） */
export function validateTagName(raw: string): { valid: boolean, message: string } {
  const name = raw.trim()
  if (!name)
    return { valid: false, message: '标签名不能为空' }
  if (name.length > TAG_MAX_LENGTH)
    return { valid: false, message: `标签名不超过 ${TAG_MAX_LENGTH} 个字符` }
  return { valid: true, message: '' }
}
