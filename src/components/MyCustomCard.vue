<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
  header: {
    type: String,
    required: true,
  },
  riskType: {
    type: String,
    required: true,
  },
  toBeTracked: {
    type: String,
    default: '0',
  },
  tracked: {
    type: String,
    default: '0',
  },
})

const emit = defineEmits(['openDrawer']) // 定义触发的事件

function getRiskTypeStyle(riskType: string) {
  if (riskType === '应用') {
    return 'success'
  }
  else if (riskType === '系统') {
    return 'info'
  }
  else {
    return ''
  }
}

function getTrackedStyle(toBeTracked = '0') {
  if (toBeTracked === '0') {
    return 'primary'
  }
  else {
    return 'danger'
  }
}

function emitOpenDrawer() {
  if (props.toBeTracked !== '0') {
    emit('openDrawer', props.header) // 触发 openDrawer 事件，并传递 header
  }
}
</script>

<template>
  <el-card class="my-custom-card" :header="header">
    <template #header>
      <div class="card-header">
        <span>{{ header }}</span>
        <el-text class="mx-1" :type="getRiskTypeStyle(riskType)">
          {{ riskType }}
        </el-text>
      </div>
    </template>
    <div class="card-body">
      <slot />
      <div>
        <el-link
          :type="getTrackedStyle(toBeTracked)"
          :disabled="toBeTracked === '0'"
          修改点击事件 @click="emitOpenDrawer"
        >
          {{ toBeTracked }}待跟踪
        </el-link>
        /
        {{ tracked }}已跟踪
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.my-custom-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  padding: 14px;
}

.card-description {
  margin-top: 10px;
  color: #999;
  font-size: 20px;
}
.el-link {
  margin-right: 8px;
}
.el-link .el-icon--right.el-icon {
  vertical-align: text-bottom;
}
</style>
