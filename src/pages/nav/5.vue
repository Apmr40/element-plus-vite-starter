<script lang="ts" setup>
import type { CalendarDateType, CalendarInstance, TabsPaneContext } from 'element-plus'
import { ref } from 'vue'
import MyCustomCard from '~/components/MyCustomCard.vue'

const activeName = ref('first')
function handleClick(tab: TabsPaneContext, event: Event) {
  console.warn(tab, event)
}
const calendar = ref<CalendarInstance>()
const initials = ['新一代核心业务系统-个人负债业务(开放)[BoEing-OPDS]', '新一代核心业务系统-基金[BoEing-OFD]', '新一代核心业务系统-储蓄国债[BoEing-OBD]', '新一代核心业务系统-债市宝[BoEing-OCB]', '新一代核心业务系统-信托[BoEing-OTF]']

const value1 = ref([])
const options = Array.from({ length: initials.length }).map((_, idx) => ({
  value: `Option${idx + 1}`,
  label: `${initials[idx % 10]}`,
}))
</script>

<template>
  <div style="background-color: whitesmoke;">
    <el-container>
      <el-header style="display: flex; align-items: center;margin-top: 10px;" height="40px">
        <el-col :span="16" style="text-align: left">
          <div style="font-size: 18px;">
            应用模块
            <el-select-v2
              v-model="value1" :options="options" placeholder="请选择应用模块" size="large"
              style="width: 500px"
            />
          </div>
        </el-col>
        <el-col :span="8" style="text-align: right">
          <div style="font-size: 16px">
            <el-button type="default" size="large" plain>
              巡检报告配置
            </el-button>
            <el-button type="primary" size="large" plain>
              导出巡检报告
            </el-button>
          </div>
        </el-col>
      </el-header>
      <el-main>
        <el-row :gutter="20" style="margin-bottom: 10px;">
          <el-col :span="16">
            <el-container style="background-color: white; height: 480px;">
              <el-header style="text-align: left; font-size: 16px;display: flex; align-items: center;" height="30px">
                风险指标
              </el-header>
              <el-main>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <MyCustomCard header="配置合规检查" risk-type="应用" to-be-tracked="0" tracked="5" />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard header="联机异常交易" risk-type="应用" to-be-tracked="2" tracked="8" />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard header="容量空间" risk-type="应用" to-be-tracked="5" tracked="5" />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard header="配置合规检查" risk-type="系统" to-be-tracked="0" tracked="7" />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard header="批量报错结点" risk-type="应用" to-be-tracked="5" tracked="7" />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard header="告警趋势" risk-type="应用" to-be-tracked="0" tracked="0" />
                  </el-col>
                </el-row>
              </el-main>
            </el-container>
          </el-col>
          <el-col :span="8">
            <el-container style="background-color: white; height: 480px;">
              <el-header style="text-align: left; font-size: 16px;display: flex; align-items: center;" height="30px">
                活动日历
              </el-header>
              <el-main>
                <el-calendar ref="calendar" style="--ep-calendar-cell-width: 50px;" />
              </el-main>
            </el-container>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 10px; margin-bottom: 10px;">
          <el-col :span="24">
            <el-container style="background-color: white; height: 480px;">
              <el-header style="text-align: left; font-size: 16px;display: flex; align-items: center;" height="30px">
                运行指标
              </el-header>
              <el-main>
                <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="handleClick">
                  <el-tab-pane label="联机交易" name="first" />
                  <el-tab-pane label="批量结点" name="second" />
                  <el-tab-pane label="容量空间" name="third" />
                </el-tabs>
              </el-main>
            </el-container>
          </el-col>
        </el-row>
      </el-main>
      <el-footer />
    </el-container>
  </div>
</template>

<style scoped>
.demo-border .text {
  width: 15%;
}

.demo-border .line {
  width: 70%;
}

.demo-border .line div {
  width: 100%;
  height: 0;
  border-top: 1px solid var(--el-border-color);
}

.demo-border .line .dashed {
  border-top: 2px dashed var(--el-border-color);
}
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}
</style>
