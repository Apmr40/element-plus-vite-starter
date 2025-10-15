<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

interface SystemItem { id: string, name: string, code: string }
interface CalendarDateItem { day: string, date: string, isCurrentMonth: boolean, hasEvent?: boolean, activityCount?: number }

interface Props {
  selectedSystemId: string
  searchText: string
  filteredSystemList: SystemItem[]
  selectedCalendarDate: string
  weekDays: string[]
  calendarDates: CalendarDateItem[]
}

const _props = defineProps<Props>()

const _emit = defineEmits<{
  (e: 'systemSelect', id: string): void
  (e: 'dateSelect', date: string): void
  (e: 'update:searchText', value: string): void
}>()
</script>

<template>
  <el-row :gutter="20" class="top-row">
    <el-col :span="12">
      <el-card class="system-list-card" shadow="never">
        <template #header>
          <div class="sidebar-search">
            <el-input
              :model-value="searchText"
              placeholder="请输入系统名称进行筛选"
              clearable
              @update:model-value="$emit('update:searchText', $event)"
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
          @select="$emit('systemSelect', $event as string)"
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
            @click="$emit('dateSelect', dateItem.date)"
          >
            <div class="date-number">
              {{ dateItem.day }}
            </div>
            <div v-if="dateItem.activityCount && dateItem.activityCount > 0" class="activity-count">
              {{ dateItem.activityCount }}
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>
