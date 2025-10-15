<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

interface TimelineActivity {
  start: number
  end: number
  label: string
}

interface Props {
  transactionCodes: string[]
  provinces: string[]
  currentTimelineActivities: TimelineActivity[]
  selectedActivityIndex: number | null
}

defineProps<Props>()

defineEmits<{
  (e: 'codeClick', code: string): void
  (e: 'provinceClick', province: string): void
  (e: 'activitySelect', index: number): void
}>()

function getActivityStyle(activity: TimelineActivity): { left: string, width: string } {
  const startPercentage = (activity.start / 24) * 100
  const durationPercentage = ((activity.end - activity.start) / 24) * 100
  return {
    left: `${startPercentage}%`,
    width: `${durationPercentage}%`,
  }
}
</script>

<template>
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
          @click="$emit('codeClick', code)"
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
          @click="$emit('provinceClick', province)"
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
            @click="$emit('activitySelect', index)"
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
</template>
