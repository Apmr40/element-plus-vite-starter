// hooks/useChartLogic.ts

import type { Ref } from 'vue'
import * as echarts from 'echarts'
import { ref } from 'vue'

// --- 接口定义 (仅用于本 Hook 涉及的数据结构) ---

interface InstanceDetail {
  id: string
  cpu: number
  memory: number
}

interface ChartDataItem {
  time: string
  volume: number
  successRate: string
  latency: number
  k8sCpu: string
  k8sMemory: string
  k8sNetwork: string
  k8sDisk: string
  instanceDetails: InstanceDetail[]
}

type ChartInstance = echarts.ECharts | null
interface ChartInstancesMap { [key: string]: ChartInstance }
type K8sMetricKey = 'k8sCpu' | 'k8sMemory'

// --- 状态和配置 ---
const timeRange: Ref<Date[]> = ref([new Date(new Date().getTime() - 3600 * 1000), new Date()])
const baselineOffset: Ref<string> = ref('T-7')
const defaultTime: Date[] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]
const chartInstances: ChartInstancesMap = {}

// --- 核心工具函数 ---

// 模拟数据生成函数
function generateMockData(isBaseline: boolean = false): ChartDataItem[] {
  const data: ChartDataItem[] = []

  // 交易指标基准
  const volumeBase: number = isBaseline ? 800 : 1200
  const rateBase: number = isBaseline ? 99.8 : 99.9
  const latencyBase: number = isBaseline ? 150 : 100

  // K8s 指标基准
  const cpuBase: number = isBaseline ? 0.6 : 0.4
  const memoryBase: number = isBaseline ? 75 : 65
  const networkBase: number = isBaseline ? 50 : 80
  const diskBase: number = isBaseline ? 40 : 30
  const numInstances: number = 10

  const [startTime] = timeRange.value

  for (let i = 0; i < 60; i++) {
    const timestamp = new Date(startTime.getTime() + i * 60 * 1000)

    let totalCpu: number = 0
    let totalMemory: number = 0
    const instanceDetails: InstanceDetail[] = []

    for (let j = 1; j <= numInstances; j++) {
      let cpu: number = Number.parseFloat((cpuBase + (Math.random() * 0.3 - 0.15)).toFixed(2))
      let memory: number = Number.parseFloat((memoryBase + (Math.random() * 10 - 5)).toFixed(1))

      // 模拟：在当前时段的第 30-40 分钟，实例 3 发生突变
      if (!isBaseline && j === 3 && i >= 30 && i <= 40) {
        cpu = 1.5 + Math.random() * 1.0
        memory = 95 + Math.random() * 3
      }

      totalCpu += cpu
      totalMemory += memory
      instanceDetails.push({ id: `pod-${j}`, cpu, memory })
    }

    data.push({
      time: timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      volume: Math.floor(volumeBase + (Math.random() * volumeBase * 0.4 - volumeBase * 0.2)),
      successRate: (rateBase + Math.random() * 0.2 - 0.1).toFixed(2),
      latency: Math.floor(latencyBase + Math.random() * 60 - 30),
      k8sCpu: (totalCpu / numInstances).toFixed(2),
      k8sMemory: (totalMemory / numInstances).toFixed(1),
      k8sNetwork: (networkBase + (Math.random() * 40 - 20)).toFixed(1),
      k8sDisk: (diskBase + (Math.random() * 20 - 10)).toFixed(1),
      instanceDetails,
    })
  }
  return data
}

// 提取异常实例的指标数据
function getAnomalyInstanceData(data: ChartDataItem[], dataKey: K8sMetricKey, anomalyThreshold: number): { name: string, data: (string | number)[] } {
  let maxMetric: number = -1
  let anomalyInstanceId: string | null = null

  // 动态获取实例详情中的 key (cpu 或 memory)
  const instanceDetailKey = dataKey.replace('k8s', '').toLowerCase() as 'cpu' | 'memory'

  data.forEach((d: ChartDataItem) => {
    d.instanceDetails.forEach((instance: InstanceDetail) => {
      const metricValue = instance[instanceDetailKey]
      if (metricValue > maxMetric && metricValue > anomalyThreshold) {
        maxMetric = metricValue
        anomalyInstanceId = instance.id
      }
    })
  })

  if (!anomalyInstanceId) {
    return { name: '无明显异常', data: data.map(() => '-') }
  }

  const anomalyData = data.map((d: ChartDataItem) => {
    const instance = d.instanceDetails.find((inst: InstanceDetail) => inst.id === anomalyInstanceId)
    return instance ? instance[instanceDetailKey] : '-'
  })

  return { name: `异常实例: ${anomalyInstanceId}`, data: anomalyData }
}

// --- Hook 主函数 ---

export function useChartLogic() {
  // 1. 初始化图表并返回实例
  const initChart = (domElement: HTMLElement, chartName: string, yAxisName: string, unit: string = ''): ChartInstance => {
    if (!domElement)
      return null
    const chartInstance = echarts.init(domElement)
    chartInstances[chartName] = chartInstance

    const option: echarts.EChartsOption = {
      title: { text: chartName, left: 'center', show: false },
      tooltip: {
        trigger: 'axis',
        formatter(params) {
          let html = `${(params as any)[0].name}<br/>`;
          (params as any[]).forEach((param) => {
            const color = param.color
            const value = param.value
            const seriesName = param.seriesName
            if (value !== '-') {
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
        { name: '当前时段 (均值)', type: 'line', smooth: true, data: [], lineStyle: { width: 3 } },
        { name: '基准时段 (均值)', type: 'line', smooth: true, data: [], lineStyle: { type: 'dashed', color: '#ccc' } },
        { name: '异常突变实例', type: 'line', smooth: true, data: [], lineStyle: { color: 'red', width: 2.5, shadowBlur: 5, shadowColor: 'rgba(255,0,0,0.5)' } },
      ],
    }

    chartInstance.setOption(option)
    return chartInstance
  }

  // 2. 更新图表数据
  const updateCharts = (currentData: ChartDataItem[], baselineData: ChartDataItem[]) => {
    if (Object.keys(chartInstances).length === 0)
      return

    const times = currentData.map(d => d.time)

    // 使用 keyof ChartDataItem 明确 dataKey 的类型范围
    const chartConfigs = [
      { name: 'chartVolume', dataKey: 'volume', isK8sAnomaly: false },
      { name: 'chartRate', dataKey: 'successRate', isK8sAnomaly: false },
      { name: 'chartLatency', dataKey: 'latency', isK8sAnomaly: false },
      { name: 'chartK8sCpu', dataKey: 'k8sCpu', isK8sAnomaly: true, threshold: 1.0 },
      { name: 'chartK8sMemory', dataKey: 'k8sMemory', isK8sAnomaly: true, threshold: 85.0 },
      { name: 'chartK8sNetwork', dataKey: 'k8sNetwork', isK8sAnomaly: false },
      { name: 'chartK8sDisk', dataKey: 'k8sDisk', isK8sAnomaly: false },
    ] as { name: string, dataKey: keyof ChartDataItem, isK8sAnomaly: boolean, threshold?: number }[]

    chartConfigs.forEach((config) => {
      const chartInstance = chartInstances[config.name]
      if (!chartInstance)
        return

      const option = chartInstance.getOption() as echarts.EChartsOption;
      (option.xAxis as any)[0].data = times;

      // 系列 0: 当前均值
      (option.series as any)[0].name = config.isK8sAnomaly ? '当前时段 (均值)' : '当前时段';
      (option.series as any)[0].data = currentData.map(d => d[config.dataKey]);

      // 系列 1: 基线均值
      (option.series as any)[1].name = config.isK8sAnomaly ? '基准时段 (均值)' : '基准时段';
      (option.series as any)[1].data = baselineData.map(d => d[config.dataKey])

      // 系列 2: 异常实例逻辑
      if (config.isK8sAnomaly) {
        const dataKey = config.dataKey as K8sMetricKey
        const anomaly = getAnomalyInstanceData(currentData, dataKey, config.threshold!);
        (option.series as any)[2].name = anomaly.name;
        (option.series as any)[2].data = anomaly.data
      }
      else {
        (option.series as any)[2].name = 'N/A';
        (option.series as any)[2].data = currentData.map(() => '-')
      }

      chartInstance.setOption(option, true)
    })
  }

  // 3. 触发数据获取和图表更新
  const fetchChartData = () => {
    const currentData: ChartDataItem[] = generateMockData(false)
    const baselineData: ChartDataItem[] = generateMockData(true)
    updateCharts(currentData, baselineData)
    console.warn(`[ChartLogic] 开始分析时间范围：${timeRange.value.map(d => d.toLocaleString('zh-CN'))}，基线为 ${baselineOffset.value}`)
  }

  // 4. 窗口 resize 事件
  const resizeCharts = () => {
    Object.values(chartInstances).forEach((chart: ChartInstance) => chart?.resize())
  }

  return {
    // 状态
    timeRange,
    baselineOffset,
    defaultTime,
    // 方法
    initChart,
    fetchChartData,
    resizeCharts,
    chartInstances,
  }
}
