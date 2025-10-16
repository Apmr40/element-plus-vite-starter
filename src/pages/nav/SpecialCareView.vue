<script setup lang="ts">
import { onUnmounted } from 'vue'

import ActivityTimeline from '../../components/SpecialCareView/ActivityTimeline.vue'
import ChangeTopology from '../../components/SpecialCareView/ChangeTopology.vue'

import MetricCharts from '../../components/SpecialCareView/MetricCharts.vue'
// 导入子组件
import TopControls from '../../components/SpecialCareView/TopControls.vue'
import { useChartLogic } from '../../hooks/SpecialCareView/useChartLogic'
// 导入 Hooks
import { useDataAndState } from '../../hooks/SpecialCareView/useDataAndState'

// --- 状态和逻辑初始化 ---
const {
  selectedSystemId,
  selectedCalendarDate,
  selectedActivityIndex,
  searchText,
  filteredSystemList,
  weekDays,
  calendarDates,
  transactionCodes,
  provinces,
  currentTimelineActivities,
  selectedChangeId,
  changeSearchText,
  selectedTaskId,
  filteredChangeList,
  topologyData,
  k8sDetailData,
} = useDataAndState()

const {
  timeRange,
  baselineOffset,
  defaultTime,
  initChart,
  fetchChartData,
  resizeCharts,
  chartInstances,
} = useChartLogic()

// --- 事件处理方法 (同步状态和触发数据更新) ---

function handleSystemSelect(index: string) {
  selectedSystemId.value = index
  fetchChartData()
}

function handleDateSelect(date: string) {
  if (selectedCalendarDate.value === date)
    return
  selectedCalendarDate.value = date
  selectedActivityIndex.value = null
  fetchChartData()
}

function handleActivitySelect(index: number) {
  selectedActivityIndex.value = index
}

function handleCodeClick(code: string) {
  console.warn(`选择交易码: ${code}`)
}
function handleProvinceClick(province: string) {
  console.warn(`选择省市: ${province}`)
}

function handleChangeSelect(index: string) {
  selectedChangeId.value = index
  selectedTaskId.value = index === 'C10002' ? 'T20002' : 'T10002'
}

function handleTaskSelect(taskId: string) {
  selectedTaskId.value = taskId
}

function handleDetailClick(prop: string, value: string) {
  console.warn(`点击了属性：${prop}，值：${value}`)
}

// --- 清理逻辑 ---
onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  Object.values(chartInstances).forEach(chart => chart?.dispose())
})

// 样式部分保持不变，确保所有子组件都能正确渲染
</script>

<template>
  <div class="special-care-view-adjusted">
    <TopControls
      v-model:search-text="searchText"
      :selected-system-id="selectedSystemId"
      :filtered-system-list="filteredSystemList"
      :selected-calendar-date="selectedCalendarDate"
      :week-days="weekDays"
      :calendar-dates="calendarDates"
      @system-select="handleSystemSelect"
      @date-select="handleDateSelect"
    />

    <ActivityTimeline
      :transaction-codes="transactionCodes"
      :provinces="provinces"
      :current-timeline-activities="currentTimelineActivities"
      :selected-activity-index="selectedActivityIndex"
      @code-click="handleCodeClick"
      @province-click="handleProvinceClick"
      @activity-select="handleActivitySelect"
    />

    <ChangeTopology
      v-model:change-search-text="changeSearchText"
      :selected-change-id="selectedChangeId"
      :selected-task-id="selectedTaskId"
      :filtered-change-list="filteredChangeList"
      :topology-data="topologyData"
      :k8s-detail-data="k8sDetailData"
      @change-select="handleChangeSelect"
      @task-select="handleTaskSelect"
      @detail-click="handleDetailClick"
    />

    <MetricCharts
      v-model:time-range="timeRange"
      v-model:baseline-offset="baselineOffset"
      :default-time="defaultTime as [Date, Date]"
      :init-chart="initChart"
      :fetch-chart-data="fetchChartData"
      :resize-charts="resizeCharts"
      @fetch-data="fetchChartData"
    />
  </div>
</template>

<style scoped>
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
