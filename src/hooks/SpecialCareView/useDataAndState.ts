// hooks/useDataAndState.ts

import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

// --- 接口定义 (仅用于本 Hook 涉及的数据结构) ---

interface SystemItem {
  id: string
  name: string
  code: string
}

interface ChangeItem {
  id: string
  name: string
}

interface TopologyTask {
  id: string
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING'
  label: string
}

interface TopologyData {
  predecessors: ChangeItem[]
  currentChange: {
    id: string
    tasks: TopologyTask[]
  }
  successors: ChangeItem[]
}

interface TimelineActivity {
  start: number
  end: number
  label: string
}

interface CalendarDateItem {
  day: string
  date: string
  isCurrentMonth: boolean
  hasEvent?: boolean
  activityCount?: number
}

interface K8sDetailItem {
  component: string
  namespace: string
  cluster: string
  status: string
}

export function useDataAndState() {
  // --- 顶部/日历状态与逻辑 ---
  const selectedCalendarDate: Ref<string> = ref('2025-10-09')
  const selectedActivityIndex: Ref<number | null> = ref(null)
  const searchText: Ref<string> = ref('')
  const selectedSystemId: Ref<string> = ref('SYS-A')

  const systemList: Ref<SystemItem[]> = ref([
    { id: 'SYS-A', name: '一级特护病床管理平台', code: '10.0.9x-A(P)' },
    { id: 'SYS-B', name: '人员用户管理平台/人员用户权限管理中心', code: 'A(CR)' },
    { id: 'SYS-C', name: '特护床位分配', code: 'A(RDP)-PSTF-G(H)' },
    { id: 'SYS-D', name: '特护床位分配列表', code: 'A(RDP)-PSTF-G-LIST(H)' },
    { id: 'SYS-E', name: '特护床位分配-床位视图', code: 'A(RDP)-PSTF-G-VIEW(H)' },
  ])
  const calendarEvents: Ref<Record<string, number>> = ref({})
  const weekDays: string[] = ['日', '一', '二', '三', '四', '五', '六']

  const filteredSystemList: ComputedRef<SystemItem[]> = computed(() => {
    if (!searchText.value)
      return systemList.value
    const searchLower = searchText.value.toLowerCase()
    return systemList.value.filter((system: SystemItem) =>
      system.name.toLowerCase().includes(searchLower) || system.code.toLowerCase().includes(searchLower),
    )
  })

  const calendarDates: ComputedRef<CalendarDateItem[]> = computed(() => {
    const baseDates: CalendarDateItem[] = [
      { day: '01', date: '2025-10-01', isCurrentMonth: true },
      { day: '09', date: '2025-10-09', isCurrentMonth: true },
      { day: '15', date: '2025-10-15', isCurrentMonth: true },
    ]
    return baseDates.map((dateItem) => {
      const activityCount = calendarEvents.value[dateItem.date] || 0
      return { ...dateItem, activityCount, hasEvent: activityCount > 0 }
    })
  })

  // --- 交易码/省市/时间线状态与逻辑 ---
  const transactionCodes: Ref<string[]> = ref(['TRNA01', 'TXNBO2', 'SVCO03', 'FICO04', 'FUND05', 'ASSEO6', 'EXTO07'])
  const provinces: Ref<string[]> = ref(['北京', '上海', '广东', '江苏', '浙江', '四川', '湖南'])
  const timelineData: Ref<Record<string, TimelineActivity[]>> = ref({
    '2025-10-09': [
      { start: 1, end: 3.5, label: '生产活动A' },
      { start: 7, end: 10, label: '生产活动B' },
      { start: 14.25, end: 16, label: '生产活动C' },
      { start: 20, end: 23.9, label: '生产活动D' },
    ],
  })
  const currentTimelineActivities: ComputedRef<TimelineActivity[]> = computed(() => timelineData.value[selectedCalendarDate.value] || [])

  // --- 变更/拓扑/明细状态与逻辑 ---
  const selectedChangeId: Ref<string> = ref('C10001')
  const changeSearchText: Ref<string> = ref('')
  const selectedTaskId: Ref<string> = ref('T10002')
  const changeList: Ref<ChangeItem[]> = ref([
    { id: 'C10001', name: '核心系统升级-第一阶段' },
    { id: 'C10002', name: '人员用户管理模块热修复' },
    { id: 'C10003', name: '数据库集群扩容' },
  ])

  const filteredChangeList: ComputedRef<ChangeItem[]> = computed(() => {
    if (!changeSearchText.value)
      return changeList.value
    const searchLower = changeSearchText.value.toLowerCase()
    return changeList.value.filter((change: ChangeItem) =>
      change.id.toLowerCase().includes(searchLower) || change.name.toLowerCase().includes(searchLower),
    )
  })

  const topologyData: ComputedRef<TopologyData> = computed(() => {
    if (selectedChangeId.value === 'C10002') {
      return {
        predecessors: [{ id: 'C99999', name: '前置变更1' }],
        currentChange: { id: 'C10002', tasks: [{ id: 'T20001', status: 'SUCCESS', label: '配置更新' }, { id: 'T20002', status: 'RUNNING', label: '核心部署' }, { id: 'T20003', status: 'PENDING', label: '验证回归' }] },
        successors: [{ id: 'C10007', name: '后续变更1' }],
      }
    }
    return {
      predecessors: [{ id: 'C99998', name: '前置审批' }],
      currentChange: { id: selectedChangeId.value, tasks: [{ id: 'T10001', status: 'SUCCESS', label: 'DB变更' }, { id: 'T10002', status: 'SUCCESS', label: '服务A发布' }, { id: 'T10003', status: 'FAILED', label: '服务B发布' }] },
      successors: [{ id: 'C10007', name: '安全检查' }],
    }
  })

  const k8sDetailData: ComputedRef<K8sDetailItem[]> = computed(() => {
    if (selectedTaskId.value === 'T10003') {
      return [{ component: 'user-service', namespace: 'prod-ns', cluster: 'GZ-K8S01', status: 'FAILED' }, { component: 'auth-gateway', namespace: 'prod-ns', cluster: 'GZ-K8S01', status: 'SUCCESS' }]
    }
    return [{ component: 'core-api', namespace: 'prod-ns', cluster: 'SH-K8S02', status: 'SUCCESS' }, { component: 'data-sync', namespace: 'dev-ns', cluster: 'SH-K8S02', status: 'SUCCESS' }]
  })

  return {
    // 状态
    selectedSystemId,
    selectedCalendarDate,
    selectedActivityIndex,
    searchText,
    selectedChangeId,
    changeSearchText,
    selectedTaskId,
    // 计算属性
    filteredSystemList,
    weekDays,
    calendarDates,
    transactionCodes,
    provinces,
    currentTimelineActivities,
    filteredChangeList,
    topologyData,
    k8sDetailData,
  }
}
