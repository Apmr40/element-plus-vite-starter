<script setup lang="ts">
import { defineProps } from 'vue'

defineProps({
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

function getRiskTypeStyle(riskType: string) {
  if (riskType === '应用') {
    return 'success'
  }
  else if (riskType === '系统') {
    return 'info'
  }
  else {
    return '' // 默认样式
  }
}

function getTrackedStyle(toBeTracked: string) {
  if (toBeTracked === '0') {
    return 'primary'
  }
  else {
    return 'danger' // 默认样式
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
        <el-link :type="getTrackedStyle(toBeTracked)" :disabled="toBeTracked === '0'">
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
