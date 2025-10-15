<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, ref } from 'vue'
// 如果你的项目未配置自动导入，请确保 Element Plus 组件在此处被正确导入

// --- 模拟数据和逻辑 (顶部/中间部分) ---
const selectedCalendarDate = ref('2025-10-09')
const selectedActivityIndex = ref(null)
const timelineData = ref({
  '2025-10-09': [
    { start: 1, end: 3.5, label: '生产活动A' },
    { start: 7, end: 10, label: '生产活动B' },
    { start: 14.25, end: 16, label: '生产活动C' },
    { start: 20, end: 23.9, label: '生产活动D' },
  ],
  // ... 其他日期
})
const currentTimelineActivities = computed(() => timelineData.value[selectedCalendarDate.value] || [])
function getActivityStyle(activity) {
  const startPercentage = (activity.start / 24) * 100
  const durationPercentage = ((activity.end - activity.start) / 24) * 100
  return { left: `${startPercentage}%`, width: `${durationPercentage}%` }
}
function handleDateSelect(date) {
  if (selectedCalendarDate.value === date)
    return
  selectedCalendarDate.value = date
  selectedActivityIndex.value = null
  fetchChartData()
}
function handleActivitySelect(index) {
  selectedActivityIndex.value = index
}

const searchText = ref('')
const transactionCodes = ref(['TRNA01', 'TXNBO2', 'SVCO03', 'FICO04', 'FUND05', 'ASSEO6', 'EXTO07'])
const provinces = ref(['北京', '上海', '广东', '江苏', '浙江', '四川', '湖南'])
function handleCodeClick(code) { console.log(`选择交易码: ${code}`) }
function handleProvinceClick(province) { console.log(`选择省市: ${province}`) }

const systemList = ref([
  { id: 'SYS-A', name: '一级特护病床管理平台', code: '10.0.9x-A(P)' },
  { id: 'SYS-B', name: '人员用户管理平台/人员用户权限管理中心', code: 'A(CR)' },
  { id: 'SYS-C', name: '特护床位分配', code: 'A(RDP)-PSTF-G(H)' },
  { id: 'SYS-D', name: '特护床位分配列表', code: 'A(RDP)-PSTF-G-LIST(H)' },
  { id: 'SYS-E', name: '特护床位分配-床位视图', code: 'A(RDP)-PSTF-G-VIEW(H)' },
])
const filteredSystemList = computed(() => {
  if (!searchText.value)
    return systemList.value
  const searchLower = searchText.value.toLowerCase()
  return systemList.value.filter(system =>
    system.name.toLowerCase().includes(searchLower) || system.code.toLowerCase().includes(searchLower),
  )
})
const selectedSystemId = ref('SYS-A')
function handleMenuSelect(index) {
  selectedSystemId.value = index
  fetchChartData()
}

const calendarEvents = ref({ /* 模拟事件数据 */ })
const currentSystemEvents = computed(() => calendarEvents.value[selectedSystemId.value] || {})
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const calendarDates = computed(() => {
  // 简化日历模拟数据
  const baseDates = [
    { day: '01', date: '2025-10-01', isCurrentMonth: true },
    { day: '09', date: '2025-10-09', isCurrentMonth: true },
    { day: '15', date: '2025-10-15', isCurrentMonth: true },
  ]
  return baseDates.map((dateItem) => {
    const activityCount = currentSystemEvents.value[dateItem.date] || 0
    return { ...dateItem, activityCount, hasEvent: activityCount > 0 }
  })
})

const selectedChangeId = ref('C10001')
const changeSearchText = ref('')
const changeList = ref([
  { id: 'C10001', name: '核心系统升级-第一阶段' },
  { id: 'C10002', name: '人员用户管理模块热修复' },
  { id: 'C10003', name: '数据库集群扩容' },
])
const filteredChangeList = computed(() => {
  if (!changeSearchText.value)
    return changeList.value
  const searchLower = changeSearchText.value.toLowerCase()
  return changeList.value.filter(change => change.id.toLowerCase().includes(searchLower) || change.name.toLowerCase().includes(searchLower))
})
function handleChangeSelect(index) {
  selectedChangeId.value = index
  selectedTaskId.value = index === 'C10002' ? 'T20002' : 'T10002'
}
const topologyData = computed(() => {
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
const selectedTaskId = ref('T10002')
function handleTaskSelect(taskId) {
  selectedTaskId.value = taskId
}
const k8sDetailData = computed(() => {
  if (selectedTaskId.value === 'T10003') {
    return [{ component: 'user-service', namespace: 'prod-ns', cluster: 'GZ-K8S01', status: 'FAILED' }, { component: 'auth-gateway', namespace: 'prod-ns', cluster: 'GZ-K8S01', status: 'SUCCESS' }]
  }
  return [{ component: 'core-api', namespace: 'prod-ns', cluster: 'SH-K8S02', status: 'SUCCESS' }, { component: 'data-sync', namespace: 'dev-ns', cluster: 'SH-K8S02', status: 'SUCCESS' }]
})
function handleDetailClick(prop, value) { console.log(`点击了属性：${prop}，值：${value}`) }

// --- ECharts 分析区数据和逻辑 ---

// 时间选择器数据
const now = new Date()
const oneHourAgo = new Date(now.getTime() - 3600 * 1000)
const timeRange = ref([oneHourAgo, now])
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const baselineOffset = ref('T-7')

// ECharts DOM 引用
const chartVolumeRef = ref(null)
const chartRateRef = ref(null)
const chartLatencyRef = ref(null)
const chartK8sCpuRef = ref(null)
const chartK8sMemoryRef = ref(null)
const chartK8sNetworkRef = ref(null)
const chartK8sDiskRef = ref(null)

// ECharts 实例
let chartVolume = null
let chartRate = null
let chartLatency = null
let chartK8sCpu = null
let chartK8sMemory = null
let chartK8sNetwork = null
let chartK8sDisk = null

// 模拟数据生成函数
function generateMockData(isBaseline = false) {
  const data = []

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
    let instanceDetails = []

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
function initChart(domRef, title, yAxisName, unit = '') {
  if (!domRef.value)
    return null
  const chartInstance = echarts.init(domRef.value)

  const option = {
    title: { text: title, left: 'center', show: false },
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        let html = `${params[0].name}<br/>`
        params.forEach((param) => {
          const color = param.color
          const value = param.value
          const seriesName = param.seriesName
          if (value !== '-') { // 排除用于填充的占位符
            html += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>${seriesName}: ${value}${unit}<br/>`
          }
        })
        return html
      },
    },
    legend: {
      data: ['当前时段 (均值)', '基准时段 (均值)', '异常突变实例'],
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
      { name: '异常突变实例', type: 'line', smooth: true, data: [], lineStyle: { color: 'red', width: 2.5, shadowBlur: 5, shadowColor: 'rgba(255,0,0,0.5)' } },
    ],
  }

  chartInstance.setOption(option)
  return chartInstance
}

// 辅助函数：提取异常实例的指标数据
function getAnomalyInstanceData(data, dataKey, anomalyThreshold) {
  let maxMetric = -1
  let anomalyInstanceId = null

  // 1. 找出最异常的实例 ID (简化为找到在整个时间段内值超过阈值且最大的实例)
  data.forEach((d) => {
    d.instanceDetails.forEach((instance) => {
      if (instance[dataKey] > maxMetric && instance[dataKey] > anomalyThreshold) {
        maxMetric = instance[dataKey]
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
    return instance ? instance[dataKey] : '-'
  })

  return {
    name: `异常实例: ${anomalyInstanceId}`,
    data: anomalyData,
  }
}

// 核心：更新所有图表数据函数
function updateCharts(data, baselineData) {
  const times = data.map(d => d.time)

  // 交易指标和 K8s 聚合指标通用更新函数
  const updateChart = (chartInstance, dataKey, isK8sAnomalyChart = false, anomalyThreshold = 0) => {
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
      const anomaly = getAnomalyInstanceData(data, dataKey, anomalyThreshold)
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

  // 交易指标更新
  updateChart(chartVolume, 'volume')
  updateChart(chartRate, 'successRate')
  updateChart(chartLatency, 'latency')

  // K8s 指标更新 (CPU, 阈值 1.0 核)
  updateChart(chartK8sCpu, 'k8sCpu', true, 1.0)
  // K8s 指标更新 (内存, 阈值 85.0%)
  updateChart(chartK8sMemory, 'k8sMemory', true, 85.0)

  // K8s 指标更新 (网络/磁盘 - 只展示聚合均值)
  updateChart(chartK8sNetwork, 'k8sNetwork')
  updateChart(chartK8sDisk, 'k8sDisk')
}

// 按钮点击：获取数据并更新图表
function fetchChartData() {
  const currentData = generateMockData(false)
  const baselineData = generateMockData(true)
  updateCharts(currentData, baselineData)
  console.warn(`正在分析时间范围：(模拟数据)，基线为 ${baselineOffset.value}。K8s CPU/内存图表已启用异常实例突出显示。`)
}

// 挂载后初始化图表
onMounted(() => {
  nextTick(() => {
    // 交易指标初始化
    chartVolume = initChart(chartVolumeRef, '交易量', '交易量 (次)')
    chartRate = initChart(chartRateRef, '成功率', '成功率 (%)', '%')
    chartLatency = initChart(chartLatencyRef, '响应时间', '延时 (ms)', 'ms')

    // K8s 指标初始化
    chartK8sCpu = initChart(chartK8sCpuRef, 'K8s CPU 使用率', 'CPU (核)', '核')
    chartK8sMemory = initChart(chartK8sMemoryRef, 'K8s 内存使用率', '内存 (%)', '%')
    chartK8sNetwork = initChart(chartK8sNetworkRef, 'K8s 网络 I/O', '流量 (MB/s)', 'MB/s')
    chartK8sDisk = initChart(chartK8sDiskRef, 'K8s 磁盘 I/O', 'I/O (MB/s)', 'MB/s')

    // 首次加载数据
    fetchChartData()

    // 绑定窗口resize事件
    window.addEventListener('resize', () => {
      chartVolume?.resize()
      chartRate?.resize()
      chartLatency?.resize()
      chartK8sCpu?.resize()
      chartK8sMemory?.resize()
      chartK8sNetwork?.resize()
      chartK8sDisk?.resize()
    })
  })
})
</script>

<template>
  <div class="special-care-view-adjusted">
    <el-row :gutter="20" class="top-row">
      <el-col :span="12">
        <el-card class="system-list-card" shadow="never">
          <template #header>
            <div class="sidebar-search">
              <el-input
                v-model="searchText"
                placeholder="请输入系统名称进行筛选"
                clearable
              >
                <template #prefix>
                  <el-icon><i-ep-search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>

          <el-menu
            :default-active="selectedSystemId"
            class="el-menu-vertical-demo"
            :collapse="false"
            @select="handleMenuSelect"
          >
            <el-menu-item
              v-for="system in filteredSystemList"
              :key="system.id"
              :index="system.id"
              :title="system.name"
            >
              <el-icon><i-ep-star /></el-icon>
              <span>{{ system.name }}</span>
            </el-menu-item>

            <el-empty
              v-if="filteredSystemList.length === 0"
              description="无匹配系统"
              :image-size="50"
            />
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="calendar-card" shadow="never">
          <div class="calendar-header">
            <span>2025年 10月 (模拟)</span>
            <div class="header-right">
              <el-button link>
                上翻
              </el-button>
              <el-divider direction="vertical" />
              <el-button link>
                下翻
              </el-button>
              <el-divider direction="vertical" />
              <el-button link>
                今天
              </el-button>
            </div>
          </div>

          <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="day-header">
              {{ day }}
            </div>

            <div
              v-for="dateItem in calendarDates"
              :key="dateItem.date"
              class="date-cell"
              :class="{
                'current-month': dateItem.isCurrentMonth,
                'is-selected': dateItem.date === selectedCalendarDate,
                'has-event': dateItem.hasEvent,
              }"
              @click="handleDateSelect(dateItem.date)"
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

    <el-row :gutter="20" class="control-row">
      <el-col :span="2" class="title-col">
        交易码：
      </el-col>
      <el-col :span="22">
        <div class="button-group">
          <el-button
            v-for="code in transactionCodes"
            :key="code"
            plain
            size="small"
            @click="handleCodeClick(code)"
          >
            {{ code }}
          </el-button>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="control-row">
      <el-col :span="2" class="title-col">
        省市：
      </el-col>
      <el-col :span="22">
        <div class="button-group">
          <el-button
            v-for="province in provinces"
            :key="province"
            type="primary"
            plain
            size="small"
            @click="handleProvinceClick(province)"
          >
            {{ province }}
          </el-button>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="control-row timeline-row">
      <el-col :span="2" class="title-col">
        时间线：
      </el-col>
      <el-col :span="22">
        <div class="timeline-container">
          <div class="activity-bar-wrapper">
            <div
              v-for="(activity, index) in currentTimelineActivities"
              :key="index"
              class="activity-segment"
              :class="{ 'is-active': selectedActivityIndex === index }"
              :style="getActivityStyle(activity)"
              @click="handleActivitySelect(index)"
            >
              <span class="activity-info">{{ activity.label }}</span>
            </div>
          </div>
          <div class="hour-markers">
            <span v-for="h in 25" :key="h" class="hour-label">
              {{ h - 1 < 10 ? '0' : '' }}{{ h - 1 }}
            </span>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="bottom-content-area">
      <el-col :span="4">
        <el-card class="change-list-card" shadow="never">
          <template #header>
            <div class="sidebar-search">
              <el-input
                v-model="changeSearchText"
                placeholder="Cxxxxxx 模糊查询"
                clearable
              >
                <template #prefix>
                  <el-icon><i-ep-search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>
          <el-menu
            :default-active="selectedChangeId"
            class="el-menu-vertical-change"
            :collapse="false"
            @select="handleChangeSelect"
          >
            <el-menu-item
              v-for="change in filteredChangeList"
              :key="change.id"
              :index="change.id"
              :title="change.name"
            >
              <el-icon><i-ep-document /></el-icon>
              <span class="change-id">{{ change.id }}</span>
            </el-menu-item>
            <el-empty
              v-if="filteredChangeList.length === 0"
              description="无匹配变更"
              :image-size="50"
            />
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="topology-card" shadow="never">
          <template #header>
            <div class="card-header-title">
              变更拓扑图：{{ selectedChangeId }}
            </div>
          </template>
          <div class="topology-container">
            <div class="connector top-line" />
            <div class="connector bottom-line" />

            <div class="topo-step predecessor">
              <div class="step-title">
                前置变更
              </div>
              <div
                v-for="pred in topologyData.predecessors"
                :key="pred.id"
                class="topo-node topo-change"
              >
                {{ pred.id }}
              </div>
            </div>

            <div class="topo-step current">
              <div class="step-title">
                当前变更: {{ topologyData.currentChange.id }}
              </div>
              <div class="tasks-container">
                <div
                  v-for="task in topologyData.currentChange.tasks"
                  :key="task.id"
                  class="topo-node topo-task"
                  :class="[task.status.toLowerCase(), { 'is-selected': task.id === selectedTaskId }]"
                  @click="handleTaskSelect(task.id)"
                >
                  <span class="task-id">{{ task.id }}</span>
                  <span class="task-label">{{ task.label }}</span>
                </div>
              </div>
            </div>

            <div class="topo-step successor">
              <div class="step-title">
                后续变更
              </div>
              <div
                v-for="succ in topologyData.successors"
                :key="succ.id"
                class="topo-node topo-change"
              >
                {{ succ.id }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="card-header-title">
              任务单明细：{{ selectedTaskId }}
            </div>
          </template>
          <el-table
            :data="k8sDetailData"
            border
            style="width: 100%;"
            max-height="350"
            size="small"
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
    <el-row :gutter="20" class="control-row analysis-controls-row">
      <el-col :span="2" class="title-col">
        时间范围：
      </el-col>
      <el-col :span="10">
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="defaultTime"
          size="default"
        />
      </el-col>

      <el-col :span="2" class="title-col">
        基线选择：
      </el-col>
      <el-col :span="4">
        <el-radio-group v-model="baselineOffset" size="default">
          <el-radio-button label="T-1" />
          <el-radio-button label="T-3" />
          <el-radio-button label="T-7" />
        </el-radio-group>
      </el-col>
      <el-col :span="6">
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
.sidebar-search {
  padding-bottom: 5px;
}
.el-menu-vertical-demo {
  border-right: none;
  max-height: 400px;
  overflow-y: auto;
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
}
.date-cell {
  background-color: #fff;
  padding: 5px 0;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  transition: background-color 0.3s;
  height: 40px;
}
.date-cell.is-selected {
  background-color: #ecf5ff;
  border: 1px solid #409eff;
  margin: -1px;
}
.date-number {
  text-align: right;
  padding-right: 5px;
  font-weight: bold;
  color: #606266;
}
.date-cell.has-event {
  background-color: #f0f9eb;
}
.activity-count {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
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
  background-color: #409eff;
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
.topology-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 20px 0;
}
.connector {
  position: absolute;
  height: 2px;
  background-color: #dcdfe6;
  top: 50%;
  transform: translateY(-50%);
  width: 30%;
}
.top-line {
  left: 0;
  width: 50%;
}
.bottom-line {
  right: 0;
  width: 50%;
}
.topo-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 20%;
  position: relative;
  z-index: 2;
}
.topo-step.current {
  width: 60%;
}
.tasks-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.topo-node {
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: #303133;
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
  border-color: #409eff;
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

/* --- ECharts 分析区样式 --- */
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
</style>
