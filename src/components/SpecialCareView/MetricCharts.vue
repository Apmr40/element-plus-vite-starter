<script setup lang="ts">
import type { ECharts } from 'echarts' // 导入 ECharts 实例类型
import { defineEmits, defineProps, nextTick, onMounted, ref } from 'vue'

interface Props {
  timeRange: Date[]
  baselineOffset: string
  defaultTime: [Date, Date]
  // 明确函数签名
  initChart: (domElement: HTMLElement, chartName: string, yAxisName: string, unit?: string) => ECharts | null
  fetchChartData: () => void
  resizeCharts: () => void
}

const props = defineProps<Props>()

defineEmits(['update:timeRange', 'update:baselineOffset', 'fetchData'])

// ECharts DOM 引用，ref 泛型为 HTMLElement 或 null
const chartVolumeRef = ref<HTMLElement | null>(null)
const chartRateRef = ref<HTMLElement | null>(null)
const chartLatencyRef = ref<HTMLElement | null>(null)
const chartK8sCpuRef = ref<HTMLElement | null>(null)
const chartK8sMemoryRef = ref<HTMLElement | null>(null)
const chartK8sNetworkRef = ref<HTMLElement | null>(null)
const chartK8sDiskRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    const refs = [
      { ref: chartVolumeRef.value, name: 'chartVolume', yAxis: '交易量 (次)' },
      { ref: chartRateRef.value, name: 'chartRate', yAxis: '成功率 (%)', unit: '%' },
      { ref: chartLatencyRef.value, name: 'chartLatency', yAxis: '延时 (ms)', unit: 'ms' },
      { ref: chartK8sCpuRef.value, name: 'chartK8sCpu', yAxis: 'CPU (核)', unit: '核' },
      { ref: chartK8sMemoryRef.value, name: 'chartK8sMemory', yAxis: '内存 (%)', unit: '%' },
      { ref: chartK8sNetworkRef.value, name: 'chartK8sNetwork', yAxis: '流量 (MB/s)', unit: 'MB/s' },
      { ref: chartK8sDiskRef.value, name: 'chartK8sDisk', yAxis: 'I/O (MB/s)', unit: 'MB/s' },
    ]

    refs.forEach((config) => {
      if (config.ref) {
        props.initChart(config.ref, config.name, config.yAxis, config.unit)
      }
    })

    props.fetchChartData()
    window.addEventListener('resize', props.resizeCharts)
  })
})
</script>

<template>
  <div>
    <el-row :gutter="20" class="control-row analysis-controls-row">
      <el-col :span="2" class="title-col">
        时间范围：
      </el-col>
      <el-col :span="10">
        <el-date-picker
          :model-value="timeRange.map(date => date.toISOString())"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="[defaultTime[0], defaultTime[1]]"
          size="default"
          @update:model-value="(val: Date[]) => $emit('update:timeRange', val as Date[])"
        />
      </el-col>

      <el-col :span="2" class="title-col">
        基线选择：
      </el-col>
      <el-col :span="4">
        <el-radio-group
          :model-value="baselineOffset"
          size="default"
          @update:model-value="$emit('update:baselineOffset', $event as string)"
        >
          <el-radio-button label="T-1" />
          <el-radio-button label="T-3" />
          <el-radio-button label="T-7" />
        </el-radio-group>
      </el-col>
      <el-col :span="6">
        <el-button type="primary" plain @click="$emit('fetchData')">
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
