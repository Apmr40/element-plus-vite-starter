<script setup lang="ts">
import type { Ref } from 'vue'
import * as G6 from '@antv/g6'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

// 如果你的项目未配置自动导入，请确保 Element Plus 组件在此处被正确导入

// --- 类型定义 ---
interface TimelineActivity {
  start: number
  end: number
  label: string
  changeId: string // 关联变更ID
}

interface SystemItem {
  id: string
  name: string
  code: string
}

interface CalendarDateItem {
  day: string
  date: string
  isCurrentMonth: boolean
  activityCount: number
  hasEvent: boolean
}

interface ChangeItem {
  id: string
  name: string
  type: 'program' | 'config' | 'data'
}

interface Task {
  id: string
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING'
  label: string
  name: string
  submitter: { name: string, contact: string }
  implementer: { name: string, contact: string }
}

interface ChangeEvent {
  id: string
  name: string
  systemId: string
  date: string
  startTime: number
  endTime: number
  type: 'program' | 'config' | 'data'
  tasks: Task[]
  summary: string
  submitter: { name: string, contact: string }
  implementer: { name: string, contact: string }
}

interface ChartDataItem {
  time: string
  volume: number
  successRate: string | number
  latency: number
  [key: string]: any // Allow other properties
}

// 定义 props
const props = withDefaults(defineProps<{
  data?: any
}>(), {
  data: () => ({ nodes: [], edges: [] }),
})

// --- 统一的变更数据源 ---
const allChanges: Ref<ChangeEvent[]> = ref([
  // 周二 (2025-10-07, 2025-10-14, 2025-10-21, 2025-10-28)
  { id: 'C10001', name: '核心系统升级-阶段1', systemId: 'SYS-A', date: '2025-10-07', startTime: 18, endTime: 20.5, type: 'program', tasks: [{ id: 'T1', status: 'SUCCESS', label: '部署', name: '核心V2.5部署任务', submitter: { name: '张三', contact: 'zhang.san@example.com' }, implementer: { name: '李四', contact: 'li.si@example.com' } }], summary: '对分布式核心系统进行V2.5版本升级，涉及交易、账务等多个模块。', submitter: { name: '张三', contact: 'zhang.san@example.com' }, implementer: { name: '李四', contact: 'li.si@example.com' } },
  { id: 'C10014', name: '核心系统参数调整', systemId: 'SYS-A', date: '2025-10-07', startTime: 18, endTime: 19, type: 'config', tasks: [{ id: 'T2', status: 'SUCCESS', label: '配置', name: '核心缓存参数调整', submitter: { name: '王五', contact: 'wang.wu@example.com' }, implementer: { name: '赵六', contact: 'zhao.liu@example.com' } }], summary: '调整核心系统缓存参数，提升性能。', submitter: { name: '王五', contact: 'wang.wu@example.com' }, implementer: { name: '赵六', contact: 'zhao.liu@example.com' } },
  { id: 'C10002', name: '支付网关配置更新', systemId: 'SYS-B', date: '2025-10-07', startTime: 21, endTime: 21.5, type: 'config', tasks: [{ id: 'T3', status: 'SUCCESS', label: '更新', name: '支付渠道配置更新', submitter: { name: '孙七', contact: 'sun.qi@example.com' }, implementer: { name: '周八', contact: 'zhou.ba@example.com' } }], summary: '新增第三方支付渠道配置。', submitter: { name: '孙七', contact: 'sun.qi@example.com' }, implementer: { name: '周八', contact: 'zhou.ba@example.com' } },
  { id: 'C10003', name: '信用卡积分规则调整', systemId: 'SYS-C', date: '2025-10-14', startTime: 19, endTime: 22, type: 'program', tasks: [{ id: 'T4', status: 'SUCCESS', label: '规则下发', name: '国庆活动积分规则', submitter: { name: '吴九', contact: 'wu.jiu@example.com' }, implementer: { name: '郑十', contact: 'zheng.shi@example.com' } }], summary: '国庆活动积分规则上线。', submitter: { name: '吴九', contact: 'wu.jiu@example.com' }, implementer: { name: '郑十', contact: 'zheng.shi@example.com' } },

  // 周四晚到周五晨 (2025-10-09 ~ 2025-10-10)
  { id: 'C10004', name: '信贷模型批量部署', systemId: 'SYS-D', date: '2025-10-09', startTime: 18, endTime: 23.5, type: 'program', tasks: [{ id: 'T5', status: 'SUCCESS', label: '模型A', name: '部署模型A', submitter: { name: '陈经理', contact: 'chen.manager@example.com' }, implementer: { name: '小林', contact: 'xiao.lin@example.com' } }, { id: 'T6', status: 'FAILED', label: '模型B', name: '部署模型B', submitter: { name: '陈经理', contact: 'chen.manager@example.com' }, implementer: { name: '小林', contact: 'xiao.lin@example.com' } }], summary: '部署最新的客户信用评级模型。', submitter: { name: '陈经理', contact: 'chen.manager@example.com' }, implementer: { name: '小林', contact: 'xiao.lin@example.com' } },
  { id: 'C10015', name: '信贷风控规则更新', systemId: 'SYS-D', date: '2025-10-09', startTime: 19, endTime: 21, type: 'config', tasks: [{ id: 'T7', status: 'SUCCESS', label: '规则更新', name: '更新反欺诈规则集', submitter: { name: '风控部', contact: 'risk.dept@example.com' }, implementer: { name: '小张', contact: 'xiao.zhang@example.com' } }], summary: '更新反欺诈规则集。', submitter: { name: '风控部', contact: 'risk.dept@example.com' }, implementer: { name: '小张', contact: 'xiao.zhang@example.com' } },
  { id: 'C10005', name: '数据仓库ETL优化', systemId: 'SYS-E', date: '2025-10-10', startTime: 1, endTime: 4, type: 'data', tasks: [{ id: 'T8', status: 'SUCCESS', label: 'ETL', name: '夜间ETL流程优化', submitter: { name: '数据平台组', contact: 'dp@example.com' }, implementer: { name: '数据平台组', contact: 'dp@example.com' } }], summary: '优化夜间ETL处理流程，缩短处理时间。', submitter: { name: '数据平台组', contact: 'dp@example.com' }, implementer: { name: '数据平台组', contact: 'dp@example.com' } },
  { id: 'C10006', name: '手机银行新功能发布', systemId: 'SYS-G', date: '2025-10-09', startTime: 22, endTime: 23, type: 'program', tasks: [{ id: 'T9', status: 'SUCCESS', label: '发布', name: '手机银行V5.2发布', submitter: { name: '产品部', contact: 'product@example.com' }, implementer: { name: '移动开发组', contact: 'mobile.dev@example.com' } }], summary: '手机银行V5.2版本发布，上线理财推荐功能。', submitter: { name: '产品部', contact: 'product@example.com' }, implementer: { name: '移动开发组', contact: 'mobile.dev@example.com' } },
  { id: 'C10007', name: '网上银行安全补丁', systemId: 'SYS-H', date: '2025-10-10', startTime: 2, endTime: 5.5, type: 'program', tasks: [{ id: 'T10', status: 'SUCCESS', label: '补丁', name: 'Log4j安全补丁修复', submitter: { name: '安全部', contact: 'security@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } }], summary: '修复Log4j安全漏洞。', submitter: { name: '安全部', contact: 'security@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } },

  // 周六晚到周日晨 (2025-10-11 ~ 2025-10-12)
  { id: 'C10008', name: '分布式核心数据库迁移', systemId: 'SYS-A', date: '2025-10-11', startTime: 20, endTime: 23.9, type: 'data', tasks: [{ id: 'T11', status: 'SUCCESS', label: '迁移', name: '核心DB迁移', submitter: { name: '架构组', contact: 'arch@example.com' }, implementer: { name: 'DBA团队', contact: 'dba@example.com' } }], summary: '核心数据库从Oracle迁移至TiDB，第一阶段。', submitter: { name: '架构组', contact: 'arch@example.com' }, implementer: { name: 'DBA团队', contact: 'dba@example.com' } },
  { id: 'C10009', name: '分布式核心数据库迁移', systemId: 'SYS-A', date: '2025-10-12', startTime: 0, endTime: 6, type: 'data', tasks: [{ id: 'T12', status: 'SUCCESS', label: '验证', name: '核心DB迁移验证', submitter: { name: '架构组', contact: 'arch@example.com' }, implementer: { name: 'DBA团队', contact: 'dba@example.com' } }], summary: '核心数据库从Oracle迁移至TiDB，第二阶段验证。', submitter: { name: '架构组', contact: 'arch@example.com' }, implementer: { name: 'DBA团队', contact: 'dba@example.com' } },
  { id: 'C10010', name: '风险预警平台升级', systemId: 'SYS-I', date: '2025-10-11', startTime: 18, endTime: 21, type: 'program', tasks: [{ id: 'T13', status: 'SUCCESS', label: '升级', name: '风险引擎V3.0升级', submitter: { name: '风控部', contact: 'risk.dept@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } }], summary: '升级风险引擎至V3.0。', submitter: { name: '风控部', contact: 'risk.dept@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } },

  // 其他数据
  { id: 'C10011', name: '柜面系统常规维护', systemId: 'SYS-F', date: '2025-10-15', startTime: 2, endTime: 4, type: 'program', tasks: [{ id: 'T14', status: 'SUCCESS', label: '维护', name: '柜面系统常规维护', submitter: { name: '运维部', contact: 'ops@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } }], summary: '常规系统补丁和维护。', submitter: { name: '运维部', contact: 'ops@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } },
  { id: 'C10012', name: 'CRM客户数据清洗', systemId: 'SYS-J', date: '2025-10-20', startTime: 1, endTime: 5, type: 'data', tasks: [{ id: 'T15', status: 'SUCCESS', label: '清洗', name: 'CRM客户数据清洗', submitter: { name: '数据治理', contact: 'data.gov@example.com' }, implementer: { name: '数据治理', contact: 'data.gov@example.com' } }], summary: '清洗重复及无效客户数据。', submitter: { name: '数据治理', contact: 'data.gov@example.com' }, implementer: { name: '数据治理', contact: 'data.gov@example.com' } },
  { id: 'C10013', name: '支付平台证书更换', systemId: 'SYS-B', date: '2025-10-22', startTime: 20, endTime: 21, type: 'config', tasks: [{ id: 'T16', status: 'SUCCESS', label: '更换', name: '支付平台SSL证书更换', submitter: { name: '安全部', contact: 'security@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } }], summary: '更换即将过期的SSL证书。', submitter: { name: '安全部', contact: 'security@example.com' }, implementer: { name: '运维部', contact: 'ops@example.com' } },
])

// --- 派生数据 ---

// 日历事件 (根据 allChanges 动态生成)
const calendarEvents = computed<Record<string, Record<string, number>>>(() => {
  const events: Record<string, Record<string, number>> = {}
  for (const change of allChanges.value) {
    if (!events[change.systemId]) {
      events[change.systemId] = {}
    }
    events[change.systemId][change.date] = (events[change.systemId][change.date] || 0) + 1
  }
  return events
})

// 时间轴数据 (根据 allChanges 动态生成)
const timelineData = computed<Record<string, TimelineActivity[]>>(() => {
  const activities: Record<string, TimelineActivity[]> = {}
  for (const change of allChanges.value) {
    if (!activities[change.date]) {
      activities[change.date] = []
    }
    activities[change.date].push({
      start: change.startTime,
      end: change.endTime,
      label: change.name,
      changeId: change.id,
    })
  }
  return activities
})
// --- 模拟数据和逻辑 (顶部/中间部分) ---
const selectedCalendarDate: Ref<string | null> = ref('2025-10-07')
const selectedActivityIndex: Ref<number | null> = ref(null) // 保持不变

interface TimelineSegment {
  start: number
  end: number
  status: 'success' | 'failed'
  changes: ChangeEvent[]
}

const timelineSegments = computed<TimelineSegment[]>(() => {
  const changesOnDate = allChanges.value.filter(c => c.date === selectedCalendarDate.value && c.systemId === selectedSystemId.value)
  if (!changesOnDate.length)
    return []

  // 按开始时间排序
  changesOnDate.sort((a, b) => a.startTime - b.startTime)

  const segments: TimelineSegment[] = []
  for (const change of changesOnDate) {
    const status = change.tasks.some(t => t.status === 'FAILED') ? 'failed' : 'success'
    segments.push({
      start: change.startTime,
      end: change.endTime,
      status,
      changes: [change],
    })
  }

  return segments
})
function getSegmentStyle(segment: TimelineSegment): { left: string, width: string } {
  const startPercentage = (segment.start / 24) * 100
  const durationPercentage = ((segment.end - segment.start) / 24) * 100
  return { left: `${startPercentage}%`, width: `${durationPercentage}%` }
}
function handleDateSelect(date: string) {
  if (selectedCalendarDate.value === date)
    return
  selectedCalendarDate.value = date
  selectedActivityIndex.value = null
  fetchChartData()
}
function handleSegmentSelect(segment: TimelineSegment) {
  // 选中一个时间段时，默认关联到该时间段的第一个变更
  const firstChange = segment.changes[0]
  if (firstChange) {
    selectedChangeId.value = firstChange.id
  }
}

const searchText = ref('')
const transactionCodes = ref(['PSDCO001', 'PSDCO002', 'PSDCO003', 'PSDCO004', 'PSDCO005', 'PSDCO006', 'PSDCO007', 'PSDCO008'])
const provinces = ref(['北京', '上海', '广东', '江苏', '浙江', '四川', '湖南'])
function handleCodeClick(code: string) {
  console.warn(`选择交易码: ${code}`)
}
function handleProvinceClick(province: string) {
  console.warn(`选择省市: ${province}`)
}

const systemList = ref([
  { id: 'SYS-A', name: '分布式核心', code: 'CORE-A(P)' },
  { id: 'SYS-B', name: '统一支付平台', code: 'PAY-G(H)' },
  { id: 'SYS-C', name: '信用卡核心', code: 'CREDIT-C(R)' },
  { id: 'SYS-D', name: '信贷管理系统', code: 'LOAN-M(P)' },
  { id: 'SYS-E', name: '数据仓库', code: 'DW-H(S)' },
  { id: 'SYS-F', name: '柜面交易系统', code: 'TELLER-F(P)' },
  { id: 'SYS-G', name: '手机银行', code: 'MBANK-A(C)' },
  { id: 'SYS-H', name: '网上银行', code: 'EBANK-W(C)' },
  { id: 'SYS-I', name: '风险预警平台', code: 'RISK-E(P)' },
  { id: 'SYS-J', name: '客户关系管理', code: 'CRM-S(P)' },
])

const filteredSystemList = computed<SystemItem[]>(() => {
  if (!searchText.value)
    return systemList.value
  const searchLower = searchText.value.toLowerCase()
  return systemList.value.filter((system: SystemItem) =>
    system.name.toLowerCase().includes(searchLower) || system.code.toLowerCase().includes(searchLower),
  )
})
const selectedSystemId = ref('SYS-A')
function handleMenuSelect(index: string) {
  selectedSystemId.value = index
  fetchChartData()
}

const currentSystemEvents = computed<Record<string, number>>(() => calendarEvents.value[selectedSystemId.value] || {})
const weekDays: string[] = ['日', '一', '二', '三', '四', '五', '六']
// 新增：模拟当前日历视图是 2025年10月
const calendarYear: Ref<number> = ref(2025)
const calendarMonth: Ref<number> = ref(10) // 10月

function prevMonth() {
  if (calendarMonth.value === 1) {
    calendarMonth.value = 12
    calendarYear.value--
  }
  else { calendarMonth.value-- }
}
function nextMonth() {
  if (calendarMonth.value === 12) {
    calendarMonth.value = 1
    calendarYear.value++
  }
  else { calendarMonth.value++ }
}
function goToToday() {
  calendarYear.value = 2025
  calendarMonth.value = 10
  handleDateSelect('2025-10-09')
}

/**
 * 获取指定系统在当前月份的总变更数量
 * @param systemId 系统ID
 */
function getSystemChangeCountInMonth(systemId: string): number {
  const systemEvents = calendarEvents.value[systemId]
  if (!systemEvents)
    return 0

  const year = calendarYear.value
  const month = calendarMonth.value
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

  return Object.entries(systemEvents)
    .filter(([date]) => date.startsWith(monthPrefix))
    .reduce((sum, [, count]) => sum + count, 0)
}

// ✅ 修正后的 calendarDates 计算属性
const calendarDates = computed<CalendarDateItem[]>(() => {
  const year = calendarYear.value
  const month = calendarMonth.value

  const firstDay = new Date(year, month - 1, 1)
  const firstDayOfWeek = firstDay.getDay() // 0 for Sunday, 1 for Monday, etc.

  const daysInMonth = new Date(year, month, 0).getDate()

  const dates: CalendarDateItem[] = []
  const startDate = new Date(firstDay)
  startDate.setDate(1 - firstDayOfWeek) // Start from the first day of the week grid

  // Generate 42 days for a 6x7 grid
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)

    const dateYear = currentDate.getFullYear()
    const dateMonth = currentDate.getMonth() + 1
    const dateDay = currentDate.getDate()

    const dateStr = `${dateYear}-${String(dateMonth).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`

    dates.push({
      day: String(dateDay),
      date: dateStr,
      isCurrentMonth: dateMonth === month,
      activityCount: currentSystemEvents.value[dateStr] || 0,
      hasEvent: currentSystemEvents.value[dateStr] > 0,
    })
  }

  // 检查最后一行是否完全是下个月的日期
  const lastRow = dates.slice(35)
  const lastRowIsAllNextMonth = lastRow.every(date => !date.isCurrentMonth)

  if (lastRowIsAllNextMonth) {
    return dates.slice(0, 35)
  }

  return dates
})

const selectedChangeId: Ref<string | null> = ref('C10001')
const changeSearchText: Ref<string> = ref('')

// 新增：根据ID获取完整的变更信息
const selectedChange = computed(() => {
  return allChanges.value.find(c => c.id === selectedChangeId.value)
})

// 变更列表 (根据 allChanges, selectedSystemId, selectedCalendarDate 动态生成)
const changeList = computed<ChangeItem[]>(() => {
  return allChanges.value
    .filter(c => c.systemId === selectedSystemId.value && c.date === selectedCalendarDate.value)
    .map(c => ({ id: c.id, name: c.name, type: c.type }))
})

const filteredChangeList = computed<ChangeItem[]>(() => {
  if (!changeSearchText.value)
    return changeList.value
  const searchLower = changeSearchText.value.toLowerCase()
  return changeList.value.filter((change: ChangeItem) => change.id.toLowerCase().includes(searchLower) || change.name.toLowerCase().includes(searchLower))
})
function handleChangeSelect(index: string) {
  selectedChangeId.value = index
}

interface G6Node {
  id: string
  label: string
  [key: string]: any // 添加索引签名以兼容 G6 NodeData 结构
}

interface G6Edge {
  source: string
  target: string
  style?: any
  [key: string]: any // 添加索引签名以兼容 G6 EdgeData 结构
}

interface G6Data {
  nodes: G6Node[]
  edges: G6Edge[]
}

function transformTopologyData(topologyData: any): G6Data {
  console.warn('=== 转换拓扑数据 ===')
  console.warn('输入数据:', topologyData)

  if (!topologyData || !topologyData.predecessors || !topologyData.successors) {
    console.warn('⚠️ 数据结构不完整，返回空图数据')
    return { nodes: [], edges: [] }
  }

  const nodes: G6Node[] = []
  const edges: G6Edge[] = []
  const nodeIds = new Set<string>()

  // 添加节点的辅助函数
  const addNode = (id: string, label: string, clazz: string = 'change-node') => {
    if (!nodeIds.has(id)) {
      nodes.push({
        id,
        label: `${label}\n(${id})`, // 显示标签和ID
        clazz,
      })
      nodeIds.add(id)
      console.warn(`➕ 添加节点: ${id} - ${label}`)
    }
  }

  // 处理前续变更节点
  topologyData.predecessors.forEach((predecessor: any) => {
    addNode(predecessor.id, predecessor.name, 'predecessor-node')
  })

  // 处理当前变更节点（虚框容器）
  if (topologyData.currentChange) {
    addNode(
      `container-${topologyData.currentChange.id}`,
      `变更单: ${topologyData.currentChange.id}`,
      'current-change-container',
    )

    // 处理当前变更的任务节点
    const allTasks = topologyData.currentChange.tasks?.flat() || []
    allTasks.forEach((task: any) => {
      addNode(task.id, task.label, `task-node status-${task.status.toLowerCase()}`)
    })
  }

  // 处理后续变更节点
  topologyData.successors.forEach((successor: any) => {
    addNode(successor.id, successor.name, 'successor-node')
  })

  // 添加边连接
  // 前续变更 -> 当前变更容器
  topologyData.predecessors.forEach((predecessor: any) => {
    edges.push({
      source: predecessor.id,
      target: `container-${topologyData.currentChange.id}`,
      clazz: 'pre-to-current',
    })
  })

  // 当前变更容器 -> 任务节点（仅用于布局，实际不显示）
  const allTasks = topologyData.currentChange.tasks?.flat() || []
  allTasks.forEach((task: any) => {
    edges.push({
      source: `container-${topologyData.currentChange.id}`,
      target: task.id,
      clazz: 'container-to-task',
    })
  })

  // 任务节点 -> 后续变更
  topologyData.successors.forEach((successor: any) => {
    // 这里需要根据实际业务逻辑确定哪个任务连接到哪个后续变更
    // 暂时连接所有任务到所有后续变更
    allTasks.forEach((task: any) => {
      edges.push({
        source: task.id,
        target: successor.id,
        clazz: 'task-to-successor',
      })
    })
  })

  console.warn('最终图表数据:', { nodes, edges })
  return { nodes, edges }
}

const topologyData = computed(() => {
  if (!selectedChangeId.value) {
    return {
      predecessors: [],
      currentChange: { id: '', tasks: [] },
      successors: [],
    }
  }

  // 为特定变更ID定义不同的拓扑数据
  switch (selectedChangeId.value) {
    case 'C10002':
      return {
        predecessors: [
          {
            id: 'C99999',
            name: '网络策略调整',
            linksTo: ['T20001'],
          },
          {
            id: 'C99997',
            name: '防火墙规则下发',
            linksTo: ['T20001'],
          },
        ],
        currentChange: {
          id: 'C10002',
          tasks: [
            [
              {
                id: 'T20001',
                status: 'SUCCESS',
                label: '配置更新',
                name: '支付渠道配置更新',
                submitter: { name: '孙七', contact: 'sun.qi@example.com' },
                implementer: { name: '周八', contact: 'zhou.ba@example.com' },
              },
            ],
            [
              {
                id: 'T20002',
                status: 'RUNNING',
                label: '核心部署',
                name: '核心服务部署',
                submitter: { name: '孙七', contact: 'sun.qi@example.com' },
                implementer: { name: '运维小队A', contact: 'ops-a@example.com' },
              },
              {
                id: 'T20004',
                status: 'RUNNING',
                label: '网关部署',
                name: 'API网关部署',
                submitter: { name: '孙七', contact: 'sun.qi@example.com' },
                implementer: { name: '运维小队A', contact: 'ops-a@example.com' },
              },
            ],
            [
              {
                id: 'T20003',
                status: 'PENDING',
                label: '验证回归',
                name: '业务验证回归',
                submitter: { name: '孙七', contact: 'sun.qi@example.com' },
                implementer: { name: '测试组', contact: 'qa@example.com' },
              },
            ],
          ],
        },
        successors: [
          {
            id: 'C10007',
            name: '监控告警屏蔽',
            linksTo: ['T20003'],
          },
          {
            id: 'C10011',
            name: '日志规则调整',
            linksTo: ['T20003'],
          },
        ],
      }

    // 添加新的变更拓扑数据示例
    case 'C10001':
      return {
        predecessors: [
          {
            id: 'C00001',
            name: '需求评审',
            linksTo: ['T1001'],
          },
        ],
        currentChange: {
          id: 'C10001',
          tasks: [
            [
              {
                id: 'T1001',
                status: 'SUCCESS',
                label: '设计',
                name: '系统架构设计',
                submitter: { name: '架构师', contact: 'architect@example.com' },
                implementer: { name: '架构师', contact: 'architect@example.com' },
              },
            ],
            [
              {
                id: 'T1002',
                status: 'RUNNING',
                label: '开发',
                name: '核心模块开发',
                submitter: { name: '开发经理', contact: 'dev.manager@example.com' },
                implementer: { name: '开发团队', contact: 'dev.team@example.com' },
              },
            ],
          ],
        },
        successors: [
          {
            id: 'C20001',
            name: '测试准备',
            linksTo: ['T1002'],
          },
        ],
      }

    // 默认拓扑数据
    default:
      return {
        predecessors: [
          {
            id: 'C99998',
            name: '前置审批',
            linksTo: ['T10001'],
          },
          {
            id: 'C99996',
            name: '资源申请',
            linksTo: ['T10001'],
          },
        ],
        currentChange: {
          id: selectedChangeId.value,
          tasks: [
            [
              {
                id: 'T10001',
                status: 'SUCCESS',
                label: 'DB变更',
                name: '数据库结构变更',
                submitter: { name: 'DBA团队', contact: 'dba@example.com' },
                implementer: { name: 'DBA-小王', contact: 'dba.wang@example.com' },
              },
            ],
            [
              {
                id: 'T10002',
                status: 'SUCCESS',
                label: '服务A发布',
                name: '用户服务发布',
                submitter: { name: '应用组', contact: 'app@example.com' },
                implementer: { name: '应用-小李', contact: 'app.li@example.com' },
              },
              {
                id: 'T10003',
                status: 'FAILED',
                label: '服务B发布',
                name: '订单服务发布',
                submitter: { name: '应用组', contact: 'app@example.com' },
                implementer: { name: '应用-小张', contact: 'app.zhang@example.com' },
              },
            ],
            [
              {
                id: 'T10004',
                status: 'PENDING',
                label: '服务C发布',
                name: '库存服务发布',
                submitter: { name: '应用组', contact: 'app@example.com' },
                implementer: { name: '应用-小刘', contact: 'app.liu@example.com' },
              },
              {
                id: 'T10005',
                status: 'PENDING',
                label: '服务D发布',
                name: '物流服务发布',
                submitter: { name: '应用组', contact: 'app@example.com' },
                implementer: { name: '应用-小刘', contact: 'app.liu@example.com' },
              },
            ],
          ],
        },
        successors: [
          {
            id: 'C10007',
            name: '安全检查',
            linksTo: ['T10004', 'T10005'],
          },
          {
            id: 'C10010',
            name: '容量压测',
            linksTo: ['T10005'],
          },
        ],
      }
  }
})

const selectedTaskId = computed(() => {
  const currentChange = topologyData.value.currentChange
  const allTasks = currentChange.tasks?.flat() || []
  return allTasks.find(t => t.status === 'RUNNING' || t.status === 'FAILED')?.id || allTasks[0]?.id || ''
})

const selectedTaskDetail = computed(() => {
  const currentTasks = topologyData.value.currentChange.tasks?.flat() || []
  return currentTasks.find(t => t.id === selectedTaskId.value)
})

const topologyLinks = computed(() => {
  const links: any[] = []
  if (!topologyData.value)
    return links

  const getElementCenter = (element: HTMLElement | null) => {
    if (!element)
      return { x: 0, y: 0 }
    const rect = element.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  const container = document.querySelector('.topology-container')
  if (!container)
    return links
  const containerRect = container.getBoundingClientRect()

  const processLinks = (changes: any[], isPredecessor: boolean) => {
    changes.forEach((change) => {
      if (change.linksTo) {
        const fromEl = document.getElementById(`topo-node-${change.id}`)
        const fromPos = getElementCenter(fromEl)

        change.linksTo.forEach((taskId: string) => {
          const toEl = document.getElementById(`topo-node-${taskId}`)
          const toPos = getElementCenter(toEl)
          const startX = (isPredecessor ? fromPos.x : toPos.x) - containerRect.left
          const startY = (isPredecessor ? fromPos.y : toPos.y) - containerRect.top
          const endX = (isPredecessor ? toPos.x : fromPos.x) - containerRect.left
          const endY = (isPredecessor ? toPos.y : fromPos.y) - containerRect.top
          links.push({ id: `${change.id}-${taskId}`, d: `M${startX},${startY} C${(startX + endX) / 2},${startY} ${(startX + endX) / 2},${endY} ${endX},${endY}` })
        })
      }
    })
  }

  processLinks(topologyData.value.predecessors, true)
  processLinks(topologyData.value.successors, false)

  return links
})

function getChangeTypeInfo(type: 'program' | 'config' | 'data'): { text: string, tagType: 'primary' | 'success' | 'warning' } {
  switch (type) {
    case 'program':
      return { text: '程序', tagType: 'primary' }
    case 'config':
      return { text: '配置', tagType: 'success' }
    case 'data':
      return { text: '数据', tagType: 'warning' }
    default:
      return { text: '未知', tagType: 'info' }
  }
}

function handleTaskSelect(taskId: string) {
  selectedTaskId.value = taskId
}
const k8sDetailData = computed(() => {
  if (selectedTaskId.value === 'T10003') {
    return [{ component: 'user-service', namespace: 'prod-ns', cluster: 'GZ-K8S01', status: 'FAILED' }, { component: 'auth-gateway', namespace: 'prod-ns', cluster: 'GZ-K8S01', status: 'SUCCESS' }]
  }
  return [{ component: 'core-api', namespace: 'prod-ns', cluster: 'SH-K8S02', status: 'SUCCESS' }, { component: 'data-sync', namespace: 'dev-ns', cluster: 'SH-K8S02', status: 'SUCCESS' }]
})
function handleDetailClick(prop: string, value: string) {
  console.warn(`点击了属性：${prop}，值：${value}`)
}

// --- ECharts 分析区数据和逻辑 ---

// 时间选择器数据
const now = new Date()
const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
const timeRange: Ref<[Date, Date]> = ref([oneHourAgo, now])
const defaultTime: [Date, Date] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const baselineOffset: Ref<string> = ref('T-7')

// ECharts DOM 引用
const chartVolumeRef: Ref<HTMLElement | null> = ref(null)
const chartRateRef: Ref<HTMLElement | null> = ref(null)
const chartLatencyRef: Ref<HTMLElement | null> = ref(null)
const chartK8sCpuRef: Ref<HTMLElement | null> = ref(null)
const chartK8sMemoryRef: Ref<HTMLElement | null> = ref(null)
const chartK8sNetworkRef: Ref<HTMLElement | null> = ref(null)
const chartK8sDiskRef: Ref<HTMLElement | null> = ref(null)

// 将 refs 统一管理，方便按名称查找
const chartRefs: Record<string, Ref<HTMLElement | null>> = {
  chartVolume: chartVolumeRef,
  chartRate: chartRateRef,
  chartLatency: chartLatencyRef,
  chartK8sCpu: chartK8sCpuRef,
  chartK8sMemory: chartK8sMemoryRef,
  chartK8sNetwork: chartK8sNetworkRef,
  chartK8sDisk: chartK8sDiskRef,
}

// ECharts 实例
const chartVolume: echarts.ECharts | null = null
const chartRate: echarts.ECharts | null = null
const chartLatency: echarts.ECharts | null = null
const chartK8sCpu: echarts.ECharts | null = null
const chartK8sMemory: echarts.ECharts | null = null
const chartK8sNetwork: echarts.ECharts | null = null
const chartK8sDisk: echarts.ECharts | null = null

// 将实例统一管理
const chartInstances: Record<string, echarts.ECharts | null> = {
  chartVolume,
  chartRate,
  chartLatency,
  chartK8sCpu,
  chartK8sMemory,
  chartK8sNetwork,
  chartK8sDisk,
}

// 模拟数据生成函数
function generateMockData(isBaseline = false): ChartDataItem[] {
  const data: ChartDataItem[] = []

  // --- 交易数据基准 ---
  const volumeBase = isBaseline ? 800 : 1200
  const rateBase = isBaseline ? 99.8 : 99.9
  const latencyBase = isBaseline ? 150 : 100

  // --- K8s 指标基准 ---
  const cpuBase = isBaseline ? 0.6 : 0.4
  const memoryBase = isBaseline ? 75 : 65
  const networkBase = isBaseline ? 50 : 80
  const diskBase = isBaseline ? 40 : 30

  // 假设当前时段有 10 个实例在运行
  const numInstances = 10

  for (let i = 0; i < 60; i++) {
    const timestamp = new Date(timeRange.value[0].getTime() + i * 60 * 1000)

    let totalCpu = 0
    let totalMemory = 0
    const instanceDetails = []

    // 循环生成每个实例的数据 (仅用于当前时段的异常模拟)
    for (let j = 1; j <= numInstances; j++) {
      let cpu = Number.parseFloat((cpuBase + (Math.random() * 0.3 - 0.15)).toFixed(2))
      let memory = Number.parseFloat((memoryBase + (Math.random() * 10 - 5)).toFixed(1))

      // 【关键模拟】: 在当前时段的第 30-40 分钟，实例 3 发生突变
      if (!isBaseline && j === 3 && i >= 30 && i <= 40) {
        cpu = 1.5 + Math.random() * 1.0 // CPU 突升到 1.5 - 2.5 核
        memory = 95 + Math.random() * 3 // 内存突升到 95%
      }

      totalCpu += cpu
      totalMemory += memory
      instanceDetails.push({
        id: `pod-${j}`,
        cpu,
        memory,
      })
    }

    data.push({
      time: timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),

      // 交易指标
      volume: Math.floor(volumeBase + (Math.random() * volumeBase * 0.4 - volumeBase * 0.2)),
      successRate: (rateBase + Math.random() * 0.2 - 0.1).toFixed(2),
      latency: Math.floor(latencyBase + Math.random() * 60 - 30),

      // K8s 聚合指标 (平均值)
      k8sCpu: (totalCpu / numInstances).toFixed(2),
      k8sMemory: (totalMemory / numInstances).toFixed(1),
      k8sNetwork: (networkBase + (Math.random() * 40 - 20)).toFixed(1),
      k8sDisk: (diskBase + (Math.random() * 20 - 10)).toFixed(1),

      // 保存实例详情，用于筛选异常
      instanceDetails,
    })
  }
  return data
}

// ECharts 初始化函数 (支持 3 条线)
function initChart(domRef: Ref<HTMLElement | null>, title: string, yAxisName: string, unit = ''): echarts.ECharts | null {
  if (!domRef.value)
    return null
  const chartInstance = echarts.init(domRef.value)

  const option = {
    title: { text: title, left: 'center', show: false },
    tooltip: {
      trigger: 'axis',
      formatter(params: any[]): string {
        let html = `${params[0].name}<br/>`
        params.forEach((param: { color: string, value: string | number, seriesName: string }) => {
          const { color, value, seriesName } = param
          if (value !== '-' && seriesName !== '' && seriesName !== 'N/A') { // 排除用于填充的占位符
            html += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>${seriesName}: ${value}${unit}<br/>`
          }
        })
        return html
      },
    },
    legend: {
      data: ['当前时段 (均值)', '基准时段 (均值)', ''], // 初始时第三项为空
      bottom: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: [] },
    yAxis: { type: 'value', name: yAxisName },
    series: [
      // 系列 0: 当前均值 (主线)
      { name: '当前时段 (均值)', type: 'line', smooth: true, data: [], lineStyle: { width: 3 } },
      // 系列 1: 基准均值 (背景线)
      { name: '基准时段 (均值)', type: 'line', smooth: true, data: [], lineStyle: { type: 'dashed', color: '#ccc' } },
      // 系列 2: 异常实例 (突出显示)
      { name: 'N/A', type: 'line', smooth: true, data: [], lineStyle: { color: 'red', width: 2.5, shadowBlur: 5, shadowColor: 'rgba(255,0,0,0.5)' } },
    ],
  }

  chartInstance.setOption(option)
  return chartInstance
}

// 辅助函数：提取异常实例的指标数据
function getAnomalyInstanceData(data: ChartDataItem[], dataKey: 'k8sCpu' | 'k8sMemory', anomalyThreshold: number): { name: string, data: (string | number)[] } {
  let maxMetric = -1
  let anomalyInstanceId: string | null = null

  // 1. 找出最异常的实例 ID (简化为找到在整个时间段内值超过阈值且最大的实例)
  data.forEach((d) => {
    d.instanceDetails.forEach((instance) => {
      const metricKey = dataKey === 'k8sCpu' ? 'cpu' : 'memory'
      if (instance[metricKey] > maxMetric && instance[metricKey] > anomalyThreshold) {
        maxMetric = instance[metricKey]
        anomalyInstanceId = instance.id
      }
    })
  })

  if (!anomalyInstanceId) {
    // 如果没有找到明显异常的实例
    return {
      name: '无明显异常',
      data: data.map(() => '-'), // 返回占位符，图表不会绘制
    }
  }

  // 2. 提取该实例在所有时间点的数据
  const anomalyData = data.map((d) => {
    const instance = d.instanceDetails.find(inst => inst.id === anomalyInstanceId)
    // 如果该实例未报告数据，则用 '-' (echarts 会忽略 '-')
    const metricKey = dataKey === 'k8sCpu' ? 'cpu' : 'memory'
    return instance ? instance[metricKey] : '-'
  })

  return {
    name: `异常实例: ${anomalyInstanceId}`,
    data: anomalyData,
  }
}

// 核心：更新所有图表数据函数
function updateChartsData(data: ChartDataItem[], baselineData: ChartDataItem[]) {
  const times = data.map(d => d.time)

  // 定义图表配置
  const chartConfigs = [
    { name: 'chartVolume', dataKey: 'volume', yAxis: '交易量 (次)', unit: '次' },
    { name: 'chartRate', dataKey: 'successRate', yAxis: '成功率 (%)', unit: '%' },
    { name: 'chartLatency', dataKey: 'latency', yAxis: '延时 (ms)', unit: 'ms' },
    { name: 'chartK8sCpu', dataKey: 'k8sCpu', yAxis: 'CPU (核)', unit: '核', isK8sAnomaly: true, threshold: 1.0 },
    { name: 'chartK8sMemory', dataKey: 'k8sMemory', yAxis: '内存 (%)', unit: '%', isK8sAnomaly: true, threshold: 85.0 },
    { name: 'chartK8sNetwork', dataKey: 'k8sNetwork', yAxis: '流量 (MB/s)', unit: 'MB/s' },
    { name: 'chartK8sDisk', dataKey: 'k8sDisk', yAxis: 'I/O (MB/s)', unit: 'MB/s' },
  ]

  // 交易指标和 K8s 聚合指标通用更新函数
  const updateChart = (chartName: string, dataKey: keyof ChartDataItem, yAxisName: string, unit: string, isK8sAnomalyChart = false, anomalyThreshold = 0, times: string[]) => {
    let chartInstance = chartInstances[chartName]
    // 如果实例不存在，尝试初始化
    if (!chartInstance) {
      const domRef = chartRefs[chartName]
      if (domRef.value) {
        chartInstance = initChart(domRef, chartName, yAxisName, unit)
        chartInstances[chartName] = chartInstance
      }
    }
    // 如果仍然不存在（例如DOM不可见），则直接返回
    if (!chartInstance)
      return

    const option = chartInstance.getOption()

    option.xAxis[0].data = times

    // 系列 0: 当前均值
    option.series[0].name = '当前时段 (均值)'
    option.series[0].data = data.map(d => d[dataKey])

    // 系列 1: 基线均值
    option.series[1].name = '基准时段 (均值)'
    option.series[1].data = baselineData.map(d => d[dataKey])

    // 系列 2: 异常实例逻辑
    if (isK8sAnomalyChart) {
      const anomaly = getAnomalyInstanceData(data, dataKey as 'k8sCpu' | 'k8sMemory', anomalyThreshold)
      option.series[2].name = anomaly.name
      option.series[2].data = anomaly.data
    }
    else {
      // 交易指标和不突出异常的 K8s 指标，隐藏第三条线
      option.series[2].name = 'N/A'
      option.series[2].data = data.map(() => '-')
    }

    chartInstance.setOption(option, true)
  }

  chartConfigs.forEach((config) => {
    updateChart(config.name, config.dataKey as keyof ChartDataItem, config.yAxis, config.unit || '', config.isK8sAnomaly, config.threshold, times)
  })
}

// 按钮点击：获取数据并更新图表
function fetchChartData() {
  const currentData = generateMockData(false)
  const baselineData = generateMockData(true)
  updateChartsData(currentData, baselineData)
  // console.warn(`正在分析时间范围：(模拟数据)，基线为 ${baselineOffset.value}。K8s CPU/内存图表已启用异常实例突出显示。`)
}

// --- 新增：诊断指标数据和抽屉状态 ---
const diagnostics = ref({
  mockVerification: {
    title: '自动化验证',
    value: '8 / 10',
    status: 'success',
    detail: [],
  },
  suppressedAlarm: {
    title: '告警详情',
    value: '3 个',
    status: 'warning',
    detail: [],
  },
  anomalyLog: {
    title: '日志详情',
    value: '2 类',
    status: 'warning',
    detail: [], // 不再使用原来的detail结构
  },
  anomalyTransaction: {
    title: '交易信息',
    value: '4 笔',
    status: 'danger',
    detail: [], // 不再使用原来的detail结构
  },
})

// 抽屉状态
const drawerVisible: Ref<boolean> = ref(false)
const currentDetail: Ref<any[] | null> = ref(null)
const currentDetailTitle: Ref<string> = ref('')

/**
 * 点击诊断卡片时显示详情抽屉
 * @param key 诊断项的键名
 */
function showDetail(key: keyof typeof diagnostics.value) {
  currentDetailTitle.value = diagnostics.value[key].title
  currentDetail.value = diagnostics.value[key].detail
  drawerVisible.value = true
}

// --- 新增：健康检查流程状态 ---
const isChecking: Ref<boolean> = ref(false) // 是否正在检查
const checkProgress: Ref<number> = ref(0) // 进度条百分比
const healthCheckResult = ref({
  status: 'info', // overall status: success, warning, danger, info
  message: '',
  summary: [
    { name: '交易系统', status: 'success', time: '5.2s' },
    { name: '数据同步', status: 'success', time: '1.8s' },
    { name: 'K8s集群', status: 'warning', time: '3.1s', detail: '部分Pod CPU使用率偏高，建议关注' },
  ],
})
const checkResultDrawerVisible: Ref<boolean> = ref(false) // 结果抽屉

/**
 * 统一发起健康检查和数据更新 (修改为流程控制)
 */
function runHealthCheck() {
  if (isChecking.value)
    return // 检查中，禁止再次点击

  isChecking.value = true
  checkProgress.value = 0

  // 模拟进度条增长
  const interval = setInterval(() => {
    if (checkProgress.value < 90) {
      checkProgress.value += Math.random() * 10
      if (checkProgress.value > 90)
        checkProgress.value = 90
    }
  }, 300)

  // 模拟检查耗时 (5秒后完成)
  setTimeout(() => {
    clearInterval(interval)
    checkProgress.value = 100
    isChecking.value = false

    // 1. 触发诊断数据和图表更新 (原有的逻辑)
    updateDiagnosticsAndCharts()

    // 2. 模拟设置检查结果
    const isSuccess = Math.random() > 0.2 // 80% 概率成功
    healthCheckResult.value.status = isSuccess ? 'success' : 'danger'
    healthCheckResult.value.message = isSuccess ? '正常' : '异常'
  }, 5000)
}

function updateDiagnosticsAndCharts() {
  // 1. 模拟更新诊断数据 (来自之前的逻辑)
  diagnostics.value.mockVerification.value = `${Math.floor(Math.random() * 900) + 100} / 1000`
  diagnostics.value.anomalyLog.value = `${Math.floor(Math.random() * 50)} 条`
  diagnostics.value.anomalyTransaction.value = `${Math.floor(Math.random() * 30)} 笔`

  // 2. 刷新 ECharts 图表数据
  // fetchChartData() // 假设这个函数已经被定义
}

/**
 * 打开健康检查结果抽屉
 */
function showHealthCheckResult() {
  checkResultDrawerVisible.value = true
}

// 辅助函数：获取状态对应的图标
function getStatusIcon(status: string): string {
  if (status === 'success')
    return 'i-ep-circle-check-filled'
  if (status === 'warning')
    return 'i-ep-warning-filled'
  if (status === 'danger')
    return 'i-ep-circle-close-filled'
  return 'i-ep-info-filled'
}

// 辅助函数，将 status 映射到 Element Plus 的 Tag 类型
function getTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'success')
    return 'success'
  if (status === 'warning')
    return 'warning'
  if (status === 'danger')
    return 'danger'
  return 'info'
}

// 辅助函数：获取状态对应的颜色
function getStatusColor(status: string): string {
  if (status === 'success')
    return '#67c23a'
  if (status === 'warning')
    return '#e6a23c'
  if (status === 'danger')
    return '#f56c6c'
  return '#409eff' // info/初始状态使用 Element Plus 主色
}

// 确保在 handleDateSelect 或 handleMenuSelect 中调用 runHealthCheck 以刷新数据（可选）
// function handleDateSelect(date) {
//   // ... 省略旧代码
//   runHealthCheck() // 示例：在选择日期后刷新
// }
// function handleMenuSelect(index) {
//   // ... 省略旧代码
//   runHealthCheck() // 示例：在选择系统后刷新
// }

// 定义每个筛选器的数据结构和状态
const dimensionFilters: Ref<any[]> = ref([
  {
    label: '省市',
    key: 'province',
    options: [
      { label: '上海', value: 'SH' },
      { label: '北京', value: 'BJ', disabled: true },
      { label: '广州', value: 'GZ' },
    ],
    selected: ['SH'], // 已选中
    type: 'select',
    multiple: true,
  },
  {
    label: '交易码',
    key: 'tradeCode',
    options: [
      { label: 'CODE-001', value: 'C001' },
      { label: 'CODE-002', value: 'C002', disabled: true },
      { label: 'CODE-003', value: 'C003' },
    ],
    selected: ['C001'],
    type: 'select',
    multiple: true,
  },
  {
    label: '渠道',
    key: 'channel',
    options: [
      { label: 'APP', value: 'APP', disabled: true },
      { label: 'WEB', value: 'WEB' },
      { label: 'API', value: 'API' },
    ],
    selected: ['WEB'],
    type: 'select',
    multiple: false, // 单选
  },
  {
    label: '集群',
    key: 'cluster',
    options: [
      { label: 'CL-A', value: 'CLA' },
      { label: 'CL-B', value: 'CLB' },
      { label: 'CL-C', value: 'CLC' },
    ],
    selected: [],
    type: 'select',
    multiple: true,
  },
  {
    label: '微服务',
    key: 'microservice',
    options: [
      { label: 'User-Svc', value: 'USER', disabled: true },
      { label: 'Order-Svc', value: 'ORDER' },
    ],
    selected: ['ORDER'],
    type: 'select',
    multiple: true,
  },
  {
    label: '部署单元',
    key: 'deployUnit',
    options: [
      { label: 'Unit-01', value: 'U01' },
      { label: 'Unit-02', value: 'U02' },
      { label: 'Unit-03', value: 'U03', disabled: true },
    ],
    selected: ['U01'],
    type: 'select',
    multiple: true,
  },
])

/**
 * 筛选器值变更处理函数
 * @param key 筛选器的唯一键
 * @param value 新的选中值
 */
function handleFilterChange(key: string, value: string | string[]) {
  const filterItem = dimensionFilters.value.find(f => f.key === key)
  if (filterItem) {
    // 强制更新 selected 状态
    filterItem.selected = Array.isArray(value) ? value : [value]
    console.warn(
      `筛选器 [${filterItem.label}] 更新为:`,
      value,
    )
    // 可以在这里调用数据查询函数
    // fetchChartData()
  }
}
const graphContainer: Ref<HTMLElement | null> = ref(null)
let graph: G6.Graph | null = null
// const graph = new G6.Graph({
//   container: 'graph',
// })

onMounted(() => {
  console.warn('组件已挂载')
  nextTick(() => {
    console.warn('nextTick 执行')
    // 延迟初始化以确保 DOM 渲染完成
    setTimeout(() => {
      console.warn('延迟初始化拓扑图')
      initGraph()
      if (selectedCalendarDate.value) {
        fetchChartData()
      }
    }, 100)
    // 统一处理 resize
    const resizeAllCharts = () => {
      Object.values(chartInstances).forEach((chart) => {
        if (chart) {
          chart.resize()
        }
      })
    }

    // 绑定窗口resize事件
    window.addEventListener('resize', resizeAllCharts)

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  if (graph) {
    graph.destroy()
    graph = null
  }
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  if (graph && graphContainer.value) {
    graph.setSize(graphContainer.value.offsetWidth || 500, graphContainer.value.offsetHeight || 300)
  }
}

// 监听 selectedChangeId 变化，更新图表
watch(selectedChangeId, (newVal, oldVal) => {
  console.warn('selectedChangeId 变化:', { from: oldVal, to: newVal })
  nextTick(() => {
    updateGraph()
  })
})

// 监听容器变化
watch(graphContainer, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initGraph()
    })
  }
})

// 监听 topologyData 变化，更新图表
watch(topologyData, (newData, oldData) => {
  console.warn('topologyData 变化:')
  console.warn('旧数据:', oldData)
  console.warn('新数据:', newData)
  if (graph && newData && graphContainer.value) {
    const graphData = transformTopologyData(newData)
    graph.setData(graphData)
    graph.render()
  }
}, { deep: true })

// 初始化图表函数

function initGraph() {
  console.warn('=== 初始化拓扑图 ===')

  // 检查容器元素
  console.warn('graphContainer 元素:', graphContainer.value)
  if (!graphContainer.value) {
    console.error('❌ graphContainer 未找到')
    return
  }

  // 检查容器尺寸
  const width = graphContainer.value.offsetWidth || 600
  const height = graphContainer.value.offsetHeight || 400
  console.warn('容器尺寸:', { width, height })

  if (width === 0 || height === 0) {
    console.warn('⚠️ 容器尺寸为0')
    return
  }

  // 检查 G6 是否加载
  console.warn('G6 库状态:', G6)

  // 如果图表已存在，先销毁
  if (graph) {
    console.warn('销毁已存在的图表')
    graph.destroy()
  }

  try {
    graph = new G6.Graph({
      container: graphContainer.value,
      width,
      height,
      // 自动缩放适配容器
      autoResize: true,
      layout: {
        type: 'dagre',
        rankdir: 'LR', // 从左到右布局
        align: 'UL', // 对齐到左上角
        nodesep: 25, // 节点水平间距
        ranksep: 60, // 层级垂直间距
      },
      // 使用 node 配置项替代 defaultNode
      node: {
        type: 'rect',
        // 1. 节点形状本身的样式
        style: {
          width: 120,
          height: 40,
          radius: 4,
          stroke: '#5B8FF9',
          fill: '#C6E5FF',
          labelText: d => d.id,
        },
      },
      // 使用 edge 配置项替代 defaultEdge
      edge: {
        style: {
          stroke: '#e2e2e2',
          endArrow: true,
        },
      },
      behaviors: [
      ],
    })
    console.warn('✅ G6 图表初始化成功')

    // 初始渲染数据
    updateGraph()
  }
  catch (error) {
    console.error('❌ G6 图表初始化失败:', error)
  }
}

// 更新图表的辅助函数
function updateGraph() {
  console.warn('=== 更新拓扑图 ===')

  if (!graph) {
    console.warn('⚠️ 图表实例未初始化')
    return
  }

  if (!topologyData.value) {
    console.warn('⚠️ topologyData 为空')
    return
  }

  console.warn('原始拓扑数据:', topologyData.value)

  try {
    const graphData = transformTopologyData(topologyData.value)
    console.warn('转换后的图表数据:', graphData)

    // 检查数据格式
    if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
      console.error('❌ 图表数据 nodes 格式错误')
      return
    }

    if (!graphData.edges || !Array.isArray(graphData.edges)) {
      console.error('❌ 图表数据 edges 格式错误')
      return
    }

    graph.setData(graphData)
    graph.render()
    console.warn('✅ 图表渲染完成')
  }
  catch (error) {
    console.error('❌ 图表数据更新失败:', error)
  }
}
// 自动化验证详情数据
const mockVerificationDetails = ref([
  {
    id: 1,
    strategyName: '服务可用性检查',
    resource: 'prod-cluster/deployment/user-service',
    status: 'SUCCESS',
    detail: '服务响应正常，HTTP状态码200',
  },
  {
    id: 2,
    strategyName: '数据库连接检查',
    resource: 'prod-cluster/statefulset/mysql-master',
    status: 'FAILED',
    detail: '连接超时，无法建立数据库连接',
  },
  {
    id: 3,
    strategyName: 'API接口测试',
    resource: 'test-cluster/deployment/api-gateway',
    status: 'RUNNING',
    detail: '正在执行接口测试用例...',
  },
  {
    id: 4,
    strategyName: '内存使用率检查',
    resource: 'prod-cluster/node/worker-01',
    status: 'SUCCESS',
    detail: '内存使用率65%，在正常范围内',
  },
  {
    id: 5,
    strategyName: '磁盘空间检查',
    resource: 'prod-cluster/pv/storage-pv',
    status: 'WARNING',
    detail: '磁盘使用率85%，接近阈值',
  },
])

// 验证状态类型映射
function getVerificationStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'SUCCESS':
      return 'success'
    case 'FAILED':
      return 'danger'
    case 'WARNING':
      return 'warning'
    case 'RUNNING':
      return 'info'
    default:
      return 'info'
  }
}

// 验证状态文本映射
function getVerificationStatusText(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return '成功'
    case 'FAILED':
      return '失败'
    case 'WARNING':
      return '警告'
    case 'RUNNING':
      return '进行中'
    default:
      return '未知'
  }
}

// 查看验证详情
function showVerificationDetail(row: any) {
  ElMessage.info(`详情: ${row.detail}`)
}

// 告警详情数据
const alarmDetails = ref({
  mainAlarms: [
    {
      id: 1,
      time: '2025-10-09 10:30:15',
      content: '核心服务CPU使用率超过90%',
      detail: 'user-service在prod-cluster集群中CPU使用率达到92.5%，超过阈值90%',
    },
    {
      id: 2,
      time: '2025-10-09 11:15:22',
      content: '数据库连接数达到上限',
      detail: 'mysql-master数据库连接数达到1000，接近上限1000',
    },
  ],
  infoAlarms: [
    {
      id: 3,
      time: '2025-10-09 09:45:30',
      content: '内存使用率接近阈值',
      detail: 'cache-service内存使用率78%，接近阈值80%',
    },
    {
      id: 4,
      time: '2025-10-09 12:20:10',
      content: '磁盘IO等待时间增加',
      detail: 'storage-node-01磁盘IO等待时间从5ms增加到12ms',
    },
  ],
  suppressedAlarms: [
    {
      id: 5,
      time: '2025-10-09 08:30:45',
      content: '网络延迟轻微波动',
      detail: 'api-gateway到user-service网络延迟从20ms增加到35ms，但仍在可接受范围内',
    },
  ],
})

// 查看告警详情
function showAlarmDetail(detail: string) {
  ElMessage.info(`告警详情: ${detail}`)
}
// 日志详情数据
const logDetails = ref({
  keywords: [
    {
      id: 1,
      keyword: 'NullPointerException',
      topic: 'core-service',
      count: 25,
      detail: '在用户服务模块中检测到空指针异常，主要发生在用户信息查询接口',
    },
    {
      id: 2,
      keyword: 'ConnectionTimeout',
      topic: 'database',
      count: 18,
      detail: '数据库连接超时，可能由于连接池配置不足导致',
    },
    {
      id: 3,
      keyword: 'OutOfMemoryError',
      topic: 'payment-service',
      count: 5,
      detail: '支付服务内存溢出错误，建议检查内存分配和垃圾回收',
    },
  ],
  errorCodes: [
    {
      id: 1,
      tradeCode: 'PSDCO001',
      errorCode: 'E5001',
      trend: '+15%',
      detail: '交易码PSDCO001错误码E5001出现频率增加15%，需要关注',
    },
    {
      id: 2,
      tradeCode: 'PSDCO003',
      errorCode: 'E4002',
      trend: '-8%',
      detail: '交易码PSDCO003错误码E4002出现频率减少8%，问题已缓解',
    },
    {
      id: 3,
      tradeCode: 'PSDCO005',
      errorCode: 'E3005',
      trend: '+22%',
      detail: '交易码PSDCO005错误码E3005出现频率激增22%，需要紧急处理',
    },
  ],
})

// 查看日志详情
function showLogDetail(detail: string) {
  ElMessage.info(`日志详情: ${detail}`)
}
// 交易详情数据
const transactionDetails = ref([
  {
    id: 1,
    tradeCode: 'PSDCO001',
    time: '2025-10-09 10:15:30',
    count: 5,
    detail: '交易码PSDCO001在10:15:30发生5笔未知状态交易，可能由于网络超时导致',
  },
  {
    id: 2,
    tradeCode: 'PSDCO003',
    time: '2025-10-09 11:30:45',
    count: 3,
    detail: '交易码PSDCO003在11:30:45发生3笔未知状态交易，需要检查支付网关状态',
  },
  {
    id: 3,
    tradeCode: 'PSDCO005',
    time: '2025-10-09 14:22:18',
    count: 7,
    detail: '交易码PSDCO005在14:22:18发生7笔未知状态交易，建议检查数据库连接',
  },
  {
    id: 4,
    tradeCode: 'PSDCO002',
    time: '2025-10-09 16:45:12',
    count: 2,
    detail: '交易码PSDCO002在16:45:12发生2笔未知状态交易，可能由于服务重启导致',
  },
])

// 查看交易详情
function showTransactionDetail(detail: string) {
  ElMessage.info(`交易详情: ${detail}`)
}
</script>

<template>
  <div class="special-care-view-adjusted">
    <el-row :gutter="20" class="top-row">
      <el-col :span="12">
        <el-card class="system-list-card" shadow="never">
          <template #header>
            <div class="sidebar-search">
              <el-input v-model="searchText" placeholder="系统名称" clearable>
                <template #prefix>
                  <el-icon><i-ep-search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>

          <el-menu
            :default-active="selectedSystemId" class="el-menu-vertical-demo" :collapse="false"
            @select="handleMenuSelect"
          >
            <el-menu-item v-for="system in filteredSystemList" :key="system.id" :index="system.id" :title="system.name">
              <div class="menu-item-content">
                <div class="menu-item-left">
                  <span class="system-name">{{ system.name }}</span>
                </div>
                <el-badge :value="getSystemChangeCountInMonth(system.id)" :max="99" class="menu-item-badge" />
              </div>
            </el-menu-item>

            <el-empty v-if="filteredSystemList.length === 0" description="无匹配系统" :image-size="50" />
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="calendar-card" shadow="never">
          <div class="calendar-header">
            <div class="calendar-header-left">
              <el-button-group>
                <el-button type="primary" @click="goToToday">
                  今天
                </el-button>
              </el-button-group>
            </div>
            <div class="calendar-header-center">
              <span>{{ calendarYear }}年 {{ calendarMonth }}月</span>
            </div>
            <div class="header-right">
              <el-button-group>
                <el-button @click="prevMonth">
                  上个月
                </el-button>
                <el-button @click="nextMonth">
                  下个月
                </el-button>
              </el-button-group>
            </div>
          </div>

          <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="day-header">
              {{ day }}
            </div>

            <div
              v-for="dateItem in calendarDates" :key="dateItem.date" class="date-cell" :class="{
                'not-current-month': !dateItem.isCurrentMonth,
                'is-selected': dateItem.date === selectedCalendarDate,
                'has-event': dateItem.hasEvent,
              }" @click="handleDateSelect(dateItem.date)"
            >
              <div class="date-number">
                {{ dateItem.day }}
              </div>
              <div v-if="dateItem.activityCount > 0" class="activity-count">
                {{ dateItem.activityCount }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row v-if="selectedCalendarDate" :gutter="20" class="control-row timeline-row">
      <el-col :span="4" class="title-col">
        时间线
      </el-col>
      <el-col :span="20">
        <div class="timeline-container">
          <div class="activity-bar-wrapper">
            <el-tooltip
              v-for="(segment, index) in timelineSegments" :key="index"
              :content="segment.changes.map(c => c.name).join(', ')" placement="top"
            >
              <div
                class="activity-segment" :class="`status-${segment.status}`" :style="getSegmentStyle(segment)"
                @click="handleSegmentSelect(segment)"
              />
            </el-tooltip>
          </div>
          <div class="hour-markers">
            <span v-for="h in 25" :key="h" class="hour-label">
              {{ h - 1 < 10 ? '0' : '' }}{{ h - 1 }} </span>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row v-if="selectedCalendarDate" :gutter="20" class="control-row health-check-row">
      <el-col :span="4" class="title-col">
        关注信息
      </el-col>
      <el-col :span="4">
        <el-card
          class="diag-card health-check-card" :class="`status-${healthCheckResult.status}`"
          @click="isChecking ? null : runHealthCheck()"
        >
          <div class="diag-title">
            系统健康检查
          </div>
          <div v-if="!isChecking && checkProgress < 100" class="diag-value">
            <el-tag type="info" size="large">
              <span>开始检查</span>
            </el-tag>
          </div>
          <div v-else-if="isChecking" class="check-progress-container">
            <el-progress
              :percentage="checkProgress" :stroke-width="10" :show-text="false"
              :color="getStatusColor('warning')"
            />
            <div class="checking-text">
              正在检查中...
            </div>
          </div>
          <div v-else class="diag-value" @click.stop="showHealthCheckResult">
            <el-tag :type="getTagType(healthCheckResult.status)" size="large">
              <span>{{ healthCheckResult.message }}</span>
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col v-for="(item, key) in diagnostics" :key="key" :span="4">
        <el-card shadow="hover" class="diag-card" :class="`status-${item.status}`" @click="showDetail(key)">
          <div class="diag-title">
            {{ item.title }}
          </div>
          <div class="diag-value">
            <el-tag :type="getTagType(item.status)" size="large">
              {{ item.value }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row v-if="selectedCalendarDate" :gutter="20" class="control-row">
      <el-col :span="4" class="title-col">
        交易码推荐
      </el-col>
      <el-col :span="20">
        <div class="button-group">
          <el-button v-for="code in transactionCodes" :key="code" plain size="small" @click="handleCodeClick(code)">
            {{ code }}
          </el-button>
        </div>
      </el-col>
    </el-row>
    <el-row v-if="selectedCalendarDate" :gutter="20" class="control-row">
      <el-col :span="4" class="title-col">
        省市推荐
      </el-col>
      <el-col :span="20">
        <div class="button-group">
          <el-button
            v-for="province in provinces" :key="province" type="primary" plain size="small"
            @click="handleProvinceClick(province)"
          >
            {{ province }}
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-row v-if="selectedChangeId" :gutter="20" class="bottom-content-area">
      <el-col :span="4">
        <el-card class="change-list-card" shadow="never">
          <template #header>
            <div class="sidebar-search">
              <el-input v-model="changeSearchText" placeholder="变更单号" clearable>
                <template #prefix>
                  <el-icon><i-ep-search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>
          <el-menu
            :default-active="selectedChangeId" class="el-menu-vertical-change" :collapse="false"
            @select="handleChangeSelect"
          >
            <el-menu-item v-for="change in filteredChangeList" :key="change.id" :index="change.id" :title="change.name">
              <div class="change-menu-item-content">
                <span class="change-id">{{ change.id }}</span>
                <el-tag
                  :type="getChangeTypeInfo(change.type).tagType" size="small" effect="light"
                  style="margin-left: auto;"
                >
                  {{ getChangeTypeInfo(change.type).text }}
                </el-tag>
              </div>
            </el-menu-item>
            <el-empty v-if="filteredChangeList.length === 0" description="无匹配变更" :image-size="50" />
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="topology-card" shadow="never">
          <template #header>
            <el-descriptions
              :column="2" :title="`变更单：${selectedChangeId}`" border size="small"
              class="change-summary-descriptions"
            >
              <el-descriptions-item label="变更摘要" :span="2">
                <el-tooltip :content="selectedChange?.summary" placement="top">
                  <span>{{ selectedChange?.name }}</span>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="提交人">
                <el-tooltip :content="`联系方式: ${selectedChange?.submitter.contact}`" placement="top">
                  <span>{{ selectedChange?.submitter.name }}</span>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="实施人">
                <el-tooltip :content="`联系方式: ${selectedChange?.implementer.contact}`" placement="top">
                  <span>{{ selectedChange?.implementer.name }}</span>
                </el-tooltip>
              </el-descriptions-item>
            </el-descriptions>
          </template>
          <div id="graph" ref="graphContainer" style="width: 100%; height: 300px;" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="detail-card" shadow="never">
          <template #header>
            <el-descriptions
              :column="2" :title="`任务单：${selectedTaskId}`" border size="small"
              class="change-summary-descriptions"
            >
              <el-descriptions-item label="任务名称" :span="2">
                {{ selectedTaskDetail?.name }}
              </el-descriptions-item>
              <el-descriptions-item label="提交人">
                <el-tooltip :content="`联系方式: ${selectedTaskDetail?.submitter.contact}`" placement="top">
                  <span>{{ selectedTaskDetail?.submitter.name }}</span>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="实施人">
                <el-tooltip :content="`联系方式: ${selectedTaskDetail?.implementer.contact}`" placement="top">
                  <span>{{ selectedTaskDetail?.implementer.name }}</span>
                </el-tooltip>
              </el-descriptions-item>
            </el-descriptions>
          </template>
          <el-table
            :data="k8sDetailData" border style="width: 100%;" max-height="350" size="small"
            class="k8s-detail-table"
          >
            <el-table-column prop="component" label="组件">
              <template #default="{ row }">
                <el-button link @click="handleDetailClick('component', row.component)">
                  {{ row.component }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="namespace" label="命名空间" width="100">
              <template #default="{ row }">
                <el-button link @click="handleDetailClick('namespace', row.namespace)">
                  {{ row.namespace }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="cluster" label="集群" width="100">
              <template #default="{ row }">
                <el-button link @click="handleDetailClick('cluster', row.cluster)">
                  {{ row.cluster }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <template v-if="selectedCalendarDate">
    <div class="special-care-view-adjusted">
      <el-row :gutter="20" class="filter-controls-row">
        <el-col :span="24">
          <el-card shadow="never" class="filter-card">
            <div class="card-header-title">
              监控维度筛选
            </div>
            <el-row :gutter="20">
              <el-col v-for="filter in dimensionFilters" :key="filter.key" :span="4" class="filter-item-col">
                <div class="filter-label">
                  {{ filter.label }}:
                </div>
                <el-select
                  v-model="filter.selected" :multiple="filter.multiple" :placeholder="`请选择${filter.label}`"
                  size="default" style="width: 100%;" @change="(val) => handleFilterChange(filter.key, val)"
                >
                  <el-option
                    v-for="item in filter.options" :key="item.value" :label="item.label" :value="item.value"
                    :disabled="item.disabled"
                  />
                </el-select>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="control-row analysis-controls-row">
        <el-col :span="2" class="title-col">
          时间范围：
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="timeRange" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间"
            :default-time="defaultTime" size="default"
          />
        </el-col>

        <el-col :span="2" class="title-col">
          对比基线：
        </el-col>
        <el-col :span="8">
          <el-radio-group v-model="baselineOffset" size="default">
            <el-radio-button label="T-1" />
            <el-radio-button label="T-3" />
            <el-radio-button label="T-7" />
          </el-radio-group>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" plain @click="fetchChartData">
            查询分析
          </el-button>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-area-row">
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              交易量 (Transactions)
            </div>
            <div ref="chartVolumeRef" class="echarts-container" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              成功率 (Success Rate)
            </div>
            <div ref="chartRateRef" class="echarts-container" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              响应时间 (Latency - P95)
            </div>
            <div ref="chartLatencyRef" class="echarts-container" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-area-row k8s-chart-row">
        <el-col :span="6">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              K8s CPU (聚合与异常)
            </div>
            <div ref="chartK8sCpuRef" class="echarts-container" />
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              K8s 内存 (聚合与异常)
            </div>
            <div ref="chartK8sMemoryRef" class="echarts-container" />
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              K8s 网络 I/O (聚合)
            </div>
            <div ref="chartK8sNetworkRef" class="echarts-container" />
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="never" class="chart-card">
            <div class="card-header-title">
              K8s 磁盘 I/O (聚合)
            </div>
            <div ref="chartK8sDiskRef" class="echarts-container" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </template>

  <el-empty v-if="!selectedCalendarDate" description="请先从日历中选择一个日期以查看相关活动和指标" style="margin-top: 50px;">
    <el-icon :size="48">
      <i-ep-calendar />
    </el-icon>
  </el-empty>

  <el-drawer v-model="drawerVisible" :title="currentDetailTitle" direction="rtl" size="80%">
    <!-- 自动化验证专用表格 -->
    <div v-if="currentDetailTitle === '自动化验证'">
      <el-table :data="mockVerificationDetails" border>
        <el-table-column prop="strategyName" label="验证策略名称" />
        <el-table-column prop="resource" label="所在资源" />
        <el-table-column prop="status" label="验证状态">
          <template #default="{ row }">
            <el-tag :type="getVerificationStatusType(row.status)">
              {{ getVerificationStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="详情">
          <template #default="{ row }">
            <el-button size="small" @click="showVerificationDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 告警详情专用表格 -->
    <div v-else-if="currentDetailTitle === '告警详情'">
      <!-- 主要告警 -->
      <el-card class="alarm-card" shadow="never">
        <template #header>
          <div class="alarm-header">
            <span>主要告警 ({{ alarmDetails.mainAlarms.length }})</span>
          </div>
        </template>
        <el-table :data="alarmDetails.mainAlarms" border>
          <el-table-column prop="time" label="发生时间" width="180" />
          <el-table-column prop="content" label="告警内容" />
          <el-table-column label="详细信息" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showAlarmDetail(row.detail)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 提示告警 -->
      <el-card class="alarm-card" shadow="never" style="margin-top: 20px;">
        <template #header>
          <div class="alarm-header">
            <span>提示告警 ({{ alarmDetails.infoAlarms.length }})</span>
          </div>
        </template>
        <el-table :data="alarmDetails.infoAlarms" border>
          <el-table-column prop="time" label="发生时间" width="180" />
          <el-table-column prop="content" label="告警内容" />
          <el-table-column label="详细信息" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showAlarmDetail(row.detail)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 被屏蔽告警 -->
      <el-card class="alarm-card" shadow="never" style="margin-top: 20px;">
        <template #header>
          <div class="alarm-header">
            <span>被屏蔽告警 ({{ alarmDetails.suppressedAlarms.length }})</span>
          </div>
        </template>
        <el-table :data="alarmDetails.suppressedAlarms" border>
          <el-table-column prop="time" label="发生时间" width="180" />
          <el-table-column prop="content" label="告警内容" />
          <el-table-column label="详细信息" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showAlarmDetail(row.detail)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 日志详情专用表格 -->
    <div v-else-if="currentDetailTitle === '日志详情'">
      <!-- 异常日志关键字 -->
      <el-card class="log-card" shadow="never">
        <template #header>
          <div class="log-header">
            <span>异常日志关键字 ({{ logDetails.keywords.length }})</span>
          </div>
        </template>
        <el-table :data="logDetails.keywords" border>
          <el-table-column prop="keyword" label="关键字" />
          <el-table-column prop="topic" label="Topic" />
          <el-table-column prop="count" label="数量" />
          <el-table-column label="详细信息" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showLogDetail(row.detail)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 异常返回码 -->
      <el-card class="log-card" shadow="never" style="margin-top: 20px;">
        <template #header>
          <div class="log-header">
            <span>异常返回码 ({{ logDetails.errorCodes.length }})</span>
          </div>
        </template>
        <el-table :data="logDetails.errorCodes" border>
          <el-table-column prop="tradeCode" label="交易码" />
          <el-table-column prop="errorCode" label="错误码" />
          <el-table-column prop="trend" label="变动趋势百分比" />
          <el-table-column label="详细信息" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showLogDetail(row.detail)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 交易详情专用表格 -->
    <div v-else-if="currentDetailTitle === '交易信息'">
      <el-card class="transaction-card" shadow="never">
        <template #header>
          <div class="transaction-header">
            <span>未知状态交易 ({{ transactionDetails.length }})</span>
          </div>
        </template>
        <el-table :data="transactionDetails" border>
          <el-table-column prop="tradeCode" label="交易码" />
          <el-table-column prop="time" label="发生时间" />
          <el-table-column prop="count" label="笔数" />
          <el-table-column label="详细信息" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showTransactionDetail(row.detail)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-table v-if="currentDetail && currentDetail.length > 0" :data="currentDetail" border>
      <template v-for="(value, key) in currentDetail[0]" :key="key">
        <el-table-column :prop="key.toString()" :label="key.toString().toUpperCase()" sortable />
      </template>
    </el-table>
    <el-empty v-else description="无明细数据" />
  </el-drawer>

  <el-drawer v-model="checkResultDrawerVisible" title="系统健康检查结果明细" direction="rtl" size="80%">
    <el-alert
      :title="healthCheckResult.message" :type="healthCheckResult.status" show-icon :closable="false"
      style="margin-bottom: 20px;"
    />
    <el-table :data="healthCheckResult.summary" border>
      <el-table-column prop="name" label="模块名称" width="120" />
      <el-table-column label="检查状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getTagType(row.status)">
            {{ row.status === 'success' ? '正常' : row.status === 'warning' ? '警告' : row.status === 'danger' ? '异常' : '信息'
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="time" label="检查耗时" width="100" />
      <el-table-column prop="detail" label="详细信息" />
    </el-table>
  </el-drawer>
</template>

<style scoped>
/* --- 布局容器和基础样式 --- */
.special-care-view-adjusted {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.top-row {
  margin-bottom: 20px;
}

.control-row {
  margin-bottom: 10px;
  align-items: center;
}

.title-col {
  font-weight: bold;
  color: #606266;
  line-height: 32px;
  padding-right: 0 !important;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-group .el-button {
  padding: 8px 15px;
  height: 32px;
}

/* --- 顶部列表/日历样式 --- */
.system-list-card {
  border: none;
  height: 100%;
}

.calendar-card {
  border: none;
  height: 100%;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
}

.calendar-header-center {
  font-weight: bold;
  font-size: 16px;
}

.calendar-header-left,
.calendar-header-right {
  display: flex;
  align-items: center;
}

.sidebar-search {
  padding-bottom: 5px;
}

.el-menu-vertical-demo {
  border-right: none;
  max-height: 400px;
  overflow-y: auto;
}

.menu-item-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}

.menu-item-left {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow: hidden;
}

/* --- 新增：自定义菜单项角标样式 --- */
.menu-item-badge :deep(.el-badge__content) {
  font-size: 10px;
  font-weight: bold;
  color: #409eff;
  background-color: #d9ecff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border: 1px solid #a0cfff;
  padding: 0;
  right: 0;
  /* 确保位置正确 */
}

.system-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 5px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  text-align: center;
  border: 1px solid #ebeef5;
  background-color: #ebeef5;
}

.day-header {
  background-color: #f5f7fa;
  padding: 8px 0;
  font-weight: bold;
  font-size: 12px;
  color: #909399;
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #fff;
  padding: 5px;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  transition: background-color 0.3s;
  min-height: 50px;
}

.date-cell.not-current-month .date-number {
  color: #c0c4cc;
}

.date-number {
  text-align: right;
  padding-right: 5px;
  font-weight: bold;
  color: #606266;
}

.date-cell.is-selected {
  background-color: #ecf5ff;
  border: 1px solid #409eff;
  margin: -1px;
  /* 避免选中时边框导致布局错位 */
}

.date-cell.has-event {
  background-color: #fdf6ec;
}

.activity-count {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  font-weight: bold;
  color: #409eff;
  background-color: #d9ecff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border: 1px solid #a0cfff;
}

/* --- 时间线样式 --- */
.timeline-row {
  margin-bottom: 20px;
}

.timeline-container {
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px 5px;
  position: relative;
}

.activity-bar-wrapper {
  position: relative;
  height: 25px;
  background-color: #f2f6fc;
  border-radius: 3px;
  margin-bottom: 5px;
}

.activity-segment {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: #b3d8ff;
  cursor: pointer;
  border-radius: 3px;
}

.activity-segment.is-active {
  background-color: #e6a23c;
  border: 2px solid #3a8ee6;
  z-index: 10;
}

.hour-markers {
  display: grid;
  grid-template-columns: repeat(25, 1fr);
  font-size: 10px;
  height: 20px;
  position: relative;
  border-top: 1px solid #e4e7ed;
  padding-top: 5px;
}

.hour-label {
  position: relative;
  text-align: left;
  height: 10px;
  font-size: 10px;
  color: #909399;
}

.hour-label:before {
  content: '';
  position: absolute;
  left: 0;
  top: -5px;
  width: 1px;
  height: 5px;
  background-color: #e4e7ed;
}

/* --- 变更/拓扑/明细区域样式 --- */
.bottom-content-area {
  margin-top: 20px;
  margin-bottom: 20px;
}

.change-list-card,
.topology-card,
.detail-card {
  height: 100%;
  min-height: 450px;
  border: none;
}

.el-menu-vertical-change {
  border-right: none;
  max-height: 380px;
  overflow-y: auto;
}

.card-header-title {
  font-weight: bold;
  font-size: 16px;
}

.change-summary-descriptions {
  :deep(.el-descriptions__title) {
    font-size: 16px;
  }
}

.change-menu-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.change-menu-item-left {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow: hidden;
  gap: 5px;
}

.change-id {
  margin-left: 5px;
  flex-grow: 1;
}

.topology-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 20px 0;
}

.topo-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 20%;
  position: relative;
  z-index: 3;
}

.tasks-flow-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.tasks-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

.flow-arrow {
  font-size: 24px;
  color: #909399;
  font-weight: bold;
  display: flex;
  align-items: center;
  margin: 0 10px;
}

.topo-node {
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  border: 1px solid #dcdfe6;
  background-color: #f4f4f5;
  white-space: nowrap;
}

.topo-task {
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.topo-task.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.5);
}

.topo-task.success {
  background-color: #e1f3d8;
  border-color: #67c23a;
}

.topo-task.failed {
  background-color: #fde2e2;
  border-color: #f56c6c;
}

.topo-task.running {
  background-color: #fdf6ec;
  border-color: #e6a23c;
}

/* --- 5. ECharts 分析区 --- */
.analysis-controls-row {
  margin-top: 20px;
  margin-bottom: 10px;
}

.chart-area-row {
  margin-bottom: 20px;
}

.chart-card {
  border: none;
  height: 400px;
}

.echarts-container {
  width: 100%;
  height: 340px;
}

/* --- 新增：健康检查和诊断板块样式 --- */
.health-check-row {
  margin-bottom: 20px;
}

/* 调整关注信息行的高度 */
.health-check-row .title-col {
  line-height: 120px;
  /* 与卡片高度保持一致 */
}

.diag-card {
  height: 120px;
  cursor: pointer;
  border-left: 6px solid #e4e7ed;
  /* 默认边框 */
  transition: all 0.3s;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 15px 10px;
  /* 增加内边距 */
}

.diag-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.diag-card.status-success {
  border-left-color: #67c23a;
}

.diag-card.status-warning {
  border-left-color: #e6a23c;
}

.diag-card.status-danger {
  border-left-color: #f56c6c;
}

.diag-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  /* 增加标题底部间距 */
}

.diag-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
  /* 增加数值底部间距 */
}

.diag-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #dcdfe6;
}

/* --- 健康检查按钮样式改进 --- */
.check-initial {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.health-check-tag {
  margin-bottom: 10px;
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
  font-size: 14px;
  padding: 10px 16px;
}

.health-check-tag:hover {
  transform: scale(1.05);
}

.check-message {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.check-progress-container {
  padding: 0 15px;
}

.checking-text {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.check-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  cursor: pointer;
}

.check-completed .health-check-tag {
  margin-bottom: 8px;
}

.result-message {
  font-size: 12px;
  margin: 8px 0;
  color: #606266;
}

.result-message.status-success {
  color: #67c23a;
}

.result-message.status-danger {
  color: #f56c6c;
}

.result-message.status-info {
  color: #409eff;
}

.view-detail-btn {
  margin-top: 8px;
}

/* --- 新增：筛选面板样式 --- */
.filter-controls-row {
  margin-bottom: 20px;
}

.filter-card {
  border: none;
  padding-bottom: 5px;
  /* 调整内部填充 */
}

.filter-item-col {
  /* 确保筛选器能均匀分布在每行，并且有足够的空间 */
  margin-bottom: 10px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
  font-weight: bold;
}

/* 调整卡片头部标题样式 */
.card-header-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
  /* 确保标题和筛选器之间有间距 */
}

.alarm-card {
  border: 1px solid #ebeef5;
}

.alarm-header {
  font-weight: bold;
  color: #606266;
}

/* 添加日志卡片样式 */
.log-card {
  border: 1px solid #ebeef5;
}

.log-header {
  font-weight: bold;
  color: #606266;
}

/* 添加交易卡片样式 */
.transaction-card {
  border: 1px solid #ebeef5;
}

.transaction-header {
  font-weight: bold;
  color: #606266;
}
</style>
