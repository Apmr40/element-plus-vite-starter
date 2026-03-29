import type { EChartsOption } from 'echarts'

function generatePastDates(days: number = 7): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = days; i >= 1; i--) {
    const pastDate = new Date(today)
    pastDate.setDate(today.getDate() - i)

    const month = String(pastDate.getMonth() + 1).padStart(2, '0') // Month is 0-indexed
    const day = String(pastDate.getDate()).padStart(2, '0')

    const formattedDate = `${month}-${day}` // 建议包含年份
    dates.push(formattedDate)
  }

  return dates
}

interface SeriesData {
  transactionVolume: number[]
  responseTime: number[]
  successRate: number[]
  indicators: string[] // 过去7天的日期
}

const chartData: SeriesData = {
  transactionVolume: [120, 150, 200, 180, 250, 220, 280], // 示例数据
  responseTime: [50, 60, 45, 55, 70, 65, 80], // 示例数据 (单位可以为毫秒)
  successRate: [95, 98, 92, 96, 99, 94, 97], // 示例数据 (0-1 之间)
  indicators: generatePastDates(), // 过去7天的日期，默认生成 7 天
}

const option: EChartsOption = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      crossStyle: {
        color: '#999',
      },
    },
  },
  toolbox: {
    feature: {
      saveAsImage: {},
    },
  },
  grid: {
    left: '3%',
    right: '10%', // 增加右边距，例如从 '4%' 增加到 '10%'
    bottom: '3%',
    containLabel: true,
  },
  legend: {
    data: ['交易量', '响应时间', '成功率'],
  },
  xAxis: [
    {
      type: 'category',
      data: chartData.indicators,
      axisPointer: {
        type: 'shadow',
      },
    },
  ],
  yAxis: [
    {
      type: 'value',
      name: '交易量',
      min: 0,
      position: 'left',
      // max: Math.max(...chartData.transactionVolume) + 50, // 动态计算 max 值
      interval: 50,
      axisLine: {
        show: true,
      },
      axisLabel: {
        formatter: '{value}',
        show: true,
      },
    },
    {
      type: 'value',
      name: '响应时间',
      min: 0,
      position: 'right',
      // max: Math.max(...chartData.responseTime) + 20, // 动态计算 max 值
      interval: 20,
      axisLabel: {
        formatter: '{value} ms',
        show: true,
        // rotate: 30,
      },
      axisLine: {
        show: true,
      },
    },
    {
      type: 'value',
      name: '成功率',
      min: 0,
      position: 'right',
      offset: 50, // 添加这个 offset 属性
      interval: 20,
      axisLabel: {
        formatter: '{value} %',
        show: true,
        // rotate: 30,
      },
      axisLine: {
        show: true,
      },
    },
  ],
  series: [
    {
      name: '交易量',
      type: 'bar',
      data: chartData.transactionVolume,
      markPoint: {
        data: [
          { type: 'max', name: 'Max' },
          { type: 'min', name: 'Min' },
        ],
      },
    },
    {
      name: '响应时间',
      type: 'line',
      yAxisIndex: 1, // 使用第二个 y 轴
      data: chartData.responseTime,
      markPoint: {
        data: [
          { type: 'max', name: 'Max' },
          { type: 'min', name: 'Min' },
        ],
      },
    },
    {
      name: '成功率',
      type: 'line',
      yAxisIndex: 2, // 使用第三个 y 轴
      data: chartData.successRate,
      markPoint: {
        data: [
          { type: 'max', name: 'Max' },
          { type: 'min', name: 'Min' },
        ],
      },
    },
  ],
}

export default option
