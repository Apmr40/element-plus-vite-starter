<script lang="ts" setup>
import type { CollapseModelValue } from 'element-plus'
import * as echarts from 'echarts'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import option from './trans/echart1'

const chartContainer1 = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (chartContainer1.value) {
    chartInstance = echarts.init(chartContainer1.value)
    chartInstance.setOption(option)
    window.addEventListener('resize', resizeChart)
  }
  else {
    console.error('图表容器元素未找到！')
  }
}
function resizeChart() {
  if (chartInstance) {
    console.warn('resizeChart')
    chartInstance.resize()
  }
}
// 在组件挂载完成后执行
onMounted(() => {
  nextTick(() => {
    initChart()
    console.warn('initChart')
    nextTick(() => {
      resizeChart()
      console.warn('resizeChart onMounted')
    })
  })
  getTop10Data()
  console.warn('onMounted')
})
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
// myChart.setOption(option)
const activeNames = ref(['0', '1', '2', '3', '4', '5', '6', '7'])
function handleChange(val: CollapseModelValue) {
  activeNames.value = Array.isArray(val) ? val.map(String) : [String(val)]
  // 当 '1' (联机整体) 这个 Collapse Item 展开时
  if (activeNames.value.includes('1')) {
    nextTick(() => {
      initChart() // 确保图表已初始化
      nextTick(() => {
        resizeChart() // 调整图表尺寸
        console.warn('resizeChart on Collapse open')
      })
    })
  }
  else if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
    console.warn('chart disposed on Collapse close')
  }
  console.warn(val)
}
interface DataItem {
  sixtysecondVolume: number
  sixtysecondVolumeTime: string
  responseTimePeak: number
  responseTimePeakTime: string
  successRatePeak: number
  successRatePeakTime: string
  isRegularTime: boolean
}

const rawData = ref<DataItem[]>([
  { sixtysecondVolume: 1500, sixtysecondVolumeTime: '10:35', responseTimePeak: 250, responseTimePeakTime: '10:35', successRatePeak: 0.98, successRatePeakTime: '14:20', isRegularTime: true },
  { sixtysecondVolume: 1200, sixtysecondVolumeTime: '11:10', responseTimePeak: 300, responseTimePeakTime: '11:10', successRatePeak: 0.95, successRatePeakTime: '15:00', isRegularTime: false },
  { sixtysecondVolume: 1800, sixtysecondVolumeTime: '09:45', responseTimePeak: 200, responseTimePeakTime: '09:45', successRatePeak: 0.99, successRatePeakTime: '16:30', isRegularTime: true },
  { sixtysecondVolume: 900, sixtysecondVolumeTime: '12:20', responseTimePeak: 350, responseTimePeakTime: '12:20', successRatePeak: 0.92, successRatePeakTime: '13:45', isRegularTime: false },
  { sixtysecondVolume: 2000, sixtysecondVolumeTime: '14:00', responseTimePeak: 180, responseTimePeakTime: '14:00', successRatePeak: 0.97, successRatePeakTime: '17:15', isRegularTime: true },
  { sixtysecondVolume: 1100, sixtysecondVolumeTime: '10:00', responseTimePeak: 280, responseTimePeakTime: '10:00', successRatePeak: 0.94, successRatePeakTime: '14:30', isRegularTime: false },
  { sixtysecondVolume: 1600, sixtysecondVolumeTime: '15:30', responseTimePeak: 220, responseTimePeakTime: '15:30', successRatePeak: 0.985, successRatePeakTime: '18:00', isRegularTime: true },
  { sixtysecondVolume: 1300, sixtysecondVolumeTime: '11:45', responseTimePeak: 320, responseTimePeakTime: '11:45', successRatePeak: 0.93, successRatePeakTime: '16:00', isRegularTime: false },
  { sixtysecondVolume: 1900, sixtysecondVolumeTime: '09:15', responseTimePeak: 190, responseTimePeakTime: '09:15', successRatePeak: 0.995, successRatePeakTime: '17:45', isRegularTime: true },
  { sixtysecondVolume: 1000, sixtysecondVolumeTime: '13:00', responseTimePeak: 330, responseTimePeakTime: '13:00', successRatePeak: 0.91, successRatePeakTime: '14:00', isRegularTime: false },
  { sixtysecondVolume: 1700, sixtysecondVolumeTime: '16:15', responseTimePeak: 210, responseTimePeakTime: '16:15', successRatePeak: 0.975, successRatePeakTime: '18:30', isRegularTime: true },
])

const top10Data = ref<DataItem[]>([])

function getTop10Data() {
  const sortedData = [...rawData.value].sort((a, b) => b.sixtysecondVolume - a.sixtysecondVolume)
  top10Data.value = sortedData.slice(0, 10)
}
</script>

<template>
  <div class="demo-collapse">
    <el-collapse v-model="activeNames" @change="handleChange">
      <el-collapse-item title="运行概述" name="0">
        <div style="width: 100%; text-align: left;">
          <h4 class="overview-subtitle">
            整体运行情况
          </h4>
          <ul class="no-bullets">
            <li>交易量： 总计完成联机交易 <strong>8,562</strong> 笔，较前一日 <strong>增长</strong> <strong>3.5%</strong>。</li>
            <li>响应时间： 平均响应时间为 <strong>125</strong> 毫秒，整体响应速度 正常。</li>
            <li>成功率： 整体交易成功率为 <strong>99.88%</strong>，保持在 良好 水平。</li>
          </ul>

          <h4 class="overview-subtitle">
            重点关注交易运行情况
          </h4>
          <ul class="no-bullets">
            <li><strong>“龙腾支付”</strong>： 交易量 <strong>3,210</strong> 笔，成功率 <strong>99.95%</strong>，平均响应时间 <strong>110</strong> 毫秒。运行情况 良好。</li>
            <li><strong>“云闪付快捷”</strong>： 交易量 <strong>2,875</strong> 笔，成功率 <strong>99.80%</strong>，平均响应时间 <strong>135</strong> 毫秒。运行情况 正常。</li>
          </ul>

          <h4 class="overview-subtitle">
            失败交易情况
          </h4>
          <p class="indented-paragraph">
            昨日共发生失败交易 <strong>10</strong> 笔，主要原因分析如下：
          </p>
          <ul class="with-bullets">
            <li><strong>“支付渠道异常”</strong>： 涉及交易 “龙腾支付”，共 <strong>6</strong> 笔，占比 <strong>60.00%</strong>。</li>
            <li><strong>“用户操作超时”</strong>： 涉及交易 “云闪付快捷”，共 <strong>4</strong> 笔，占比 <strong>40.00%</strong>。</li>
          </ul>

          <h4 class="overview-subtitle">
            告警情况
          </h4>
          <p class="indented-paragraph">
            昨日共收到告警信息 <strong>3</strong> 条，主要告警类型包括：
          </p>
          <ul class="with-bullets">
            <li><strong>“平均响应时间过高”</strong>： 发生 <strong>1</strong> 次，例如：部分接口平均响应时间超过 200ms。</li>
            <li><strong>“支付成功率下降”</strong>： 发生 <strong>2</strong> 次，例如：某渠道支付成功率短时下降至 98%。</li>
          </ul>

          <h4 class="overview-subtitle">
            总结
          </h4>
          <p class="indented-paragraph">
            总体而言，昨日应用系统联机交易运行情况 良好。各项关键指标均维持在稳定水平。
          </p>
        </div>
      </el-collapse-item>
      <el-collapse-item title="联机整体" name="1">
        <el-row style="display: flex; align-items: stretch;">
          <el-col :span="9">
            <div ref="chartContainer1" style="height: 100%;" />
          </el-col>
          <el-col :span="15">
            <el-table :data="top10Data" border style="width: 100%; height: 100%;">
              <el-table-column prop="sixtysecondVolume" label="60秒交易量峰值" sortable />
              <el-table-column prop="sixtysecondVolumeTime" label="60秒交易量峰值时间" />
              <el-table-column prop="isRegularTime" label="是否常规时间">
                <template #default="scope">
                  <el-tag :type="scope.row.isRegularTime ? 'success' : 'danger'">
                    {{ scope.row.isRegularTime ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="responseTimePeak" label="响应时间峰值（ms）" sortable />
              <el-table-column prop="responseTimePeakTime" label="响应时间峰值时间" />
              <el-table-column prop="isRegularTime" label="是否常规时间">
                <template #default="scope">
                  <el-tag :type="scope.row.isRegularTime ? 'success' : 'danger'">
                    {{ scope.row.isRegularTime ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="successRatePeak" label="成功率峰值" sortable>
                <template #default="scope">
                  {{ (scope.row.successRatePeak * 100).toFixed(2) }}%
                </template>
              </el-table-column>
              <el-table-column prop="successRatePeakTime" label="成功率峰值时间" />
              <el-table-column prop="isRegularTime" label="是否常规时间">
                <template #default="scope">
                  <el-tag :type="scope.row.isRegularTime ? 'success' : 'danger'">
                    {{ scope.row.isRegularTime ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </el-collapse-item>
      <el-collapse-item title="TOP渠道" name="2">
        <div>
          Operation feedback: enable the users to clearly perceive their
          operations by style updates and interactive effects;
        </div>
        <div>
          Visual feedback: reflect current state by updating or rearranging
          elements of the page.
        </div>
      </el-collapse-item>
      <el-collapse-item title="TOP省市" name="3">
        <div>
          Simplify the process: keep operating process simple and intuitive;
        </div>
        <div>
          Definite and clear: enunciate your intentions clearly so that the
          users can quickly understand and make decisions;
        </div>
        <div>
          Easy to identify: the interface should be straightforward, which helps
          the users to identify and frees them from memorizing and recalling.
        </div>
      </el-collapse-item>
      <el-collapse-item title="TOP交易码" name="4">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </el-collapse-item>
      <el-collapse-item title="核心交易码" name="5">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </el-collapse-item>
      <el-collapse-item title="问题交易码" name="6">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </el-collapse-item>
      <el-collapse-item title="联机告警趋势" name="7">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.overview-title {
  font-size: 1.5em;
  color: #333;
  margin-bottom: 1em;
}

.overview-subtitle {
  font-size: 1.2em;
  color: #666;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.indented-paragraph {
  text-indent: 2em;
}

.no-bullets {
  list-style-type: none;
  padding-left: 2em;
}

.with-bullets {
  list-style-type: disc;
  padding-left: 4em;
}
</style>
