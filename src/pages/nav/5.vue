<script lang="ts" setup>
import type { CalendarInstance, ElDrawer, TabsPaneContext } from 'element-plus'
import { ref } from 'vue'
import MyCustomCard from '~/components/MyCustomCard.vue'
import trans from '~/components/trans.vue'

declare global {
  interface Window {
    open: (url?: string | URL, target?: string, features?: string) => Window | null
  }
}
const activeName = ref('trans')
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
// 父组件控制的抽屉状态
const parentDrawerVisible = ref(false)
const parentDrawerTitle = ref('')

// 处理 MyCustomCard 触发的 openDrawer 事件
function handleOpenDrawer(header: string) {
  parentDrawerTitle.value = `跟踪 ${header}`
  parentDrawerVisible.value = true
}
// 父组件控制的日历抽屉状态
const calendarDrawerVisible = ref(false)
const calendarDrawerTitle = ref('功能投产信息')
const releaseNotes = ref(`
  <h3>信息系统新功能投产</h3>
  <p>本次投产包含以下重要功能：</p>
  <ul>
    <li><strong>优化了用户界面：</strong> 提升用户体验。</li>
    <li><strong>新增报表导出功能：</strong> 支持多种格式导出。</li>
    <li><strong>修复了已知 Bug：</strong> 提高了系统稳定性。</li>
  </ul>
  <p>请点击下方按钮查看详细发布说明。</p>
`)
const releaseNotesLink = ref('https://example.com/release-notes') // 替换为实际链接
function openReleaseNotes() {
  if (releaseNotesLink.value) {
    window.open(releaseNotesLink.value, '_blank')
  }
  calendarDrawerVisible.value = false // 点击后关闭抽屉
}

// 处理日历单元格的样式
function handleCalendarCell(date: Date) {
  console.warn('handleCalendarCell 函数被调用了', date, Date) // 添加这一行
  const dayOfWeek = date.getDay() // 0 (Sunday) to 6 (Saturday)
  if (dayOfWeek === 4 || dayOfWeek === 6) { // Thursday is 4, Saturday is 6
    return {
      class: 'highlight-weekday',
    }
  }
  return {}
}

// 处理日历单元格的点击事件
function handleCalendarCellClick(date: Date) {
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 4 || dayOfWeek === 6) {
    calendarDrawerVisible.value = true
  }
}
</script>

<template>
  <div style="background-color: whitesmoke;">
    <el-container>
      <el-header class="header-style">
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
                    <MyCustomCard
                      header="配置合规检查"
                      risk-type="应用"
                      to-be-tracked="1"
                      tracked="5"
                      @open-drawer="handleOpenDrawer"
                    />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard
                      header="联机异常交易"
                      risk-type="应用"
                      to-be-tracked="2"
                      tracked="8"
                      @open-drawer="handleOpenDrawer"
                    />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard
                      header="容量空间"
                      risk-type="应用"
                      to-be-tracked="0"
                      tracked="5"
                      @open-drawer="handleOpenDrawer"
                    />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard
                      header="配置合规检查"
                      risk-type="系统"
                      to-be-tracked="1"
                      tracked="7"
                      @open-drawer="handleOpenDrawer"
                    />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard
                      header="批量报错结点"
                      risk-type="应用"
                      to-be-tracked="5"
                      tracked="7"
                      @open-drawer="handleOpenDrawer"
                    />
                  </el-col>
                  <el-col :span="8">
                    <MyCustomCard
                      header="告警趋势"
                      risk-type="应用"
                      to-be-tracked="0"
                      tracked="0"
                      @open-drawer="handleOpenDrawer"
                    />
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
                <el-calendar
                  ref="calendar"
                  :cell-class-name="handleCalendarCell"
                  style="--ep-calendar-cell-width: 50px;"
                  @click-cell="handleCalendarCellClick"
                />
              </el-main>
            </el-container>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 10px; margin-bottom: 10px;">
          <el-col :span="24">
            <el-container style="background-color: white; ">
              <el-header style="text-align: left; font-size: 16px;display: flex; align-items: center;" height="30px">
                运行指标
              </el-header>
              <el-main>
                <el-tabs v-model="activeName" class="demo-tabs" type="border-card" @tab-click="handleClick">
                  <el-tab-pane label="联机交易" name="trans">
                    <trans />
                  </el-tab-pane>
                  <el-tab-pane label="批量结点" name="batch" />
                  <el-tab-pane label="容量空间" name="volumn" />
                </el-tabs>
              </el-main>
            </el-container>
          </el-col>
        </el-row>
      </el-main>
      <el-footer />
    </el-container>
    <el-drawer
      v-model="parentDrawerVisible"
      :title="parentDrawerTitle"
      direction="rtl"
      size="80%"
    >
      <slot name="drawer-content-parent" />
      <template #footer>
        <div style="display: flex; justify-content: flex-end;">
          <el-button @click="parentDrawerVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="parentDrawerVisible = false">
            确认
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer
      v-model="calendarDrawerVisible"
      :title="calendarDrawerTitle"
      direction="rtl"
      size="30%"
    >
      <div style="margin-bottom: 20px;" v-html="releaseNotes" />
      <el-button type="primary" @click="openReleaseNotes">
        查看详细说明
      </el-button>
    </el-drawer>
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
.highlight-weekday {
  background-color: #e0f2f7 !important; /* 使用 !important 提高优先级 */
}
.header-style {
  display: flex;
  align-items: left;
  margin-top: 10px;
  height: 40px; /* 同样将高度移到 CSS */
}
</style>
