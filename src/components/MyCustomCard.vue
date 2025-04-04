<script setup lang="ts">
import { defineProps } from 'vue'

defineProps({
  header: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <el-card class="my-custom-card" :header="header">
    <template #header>
      <div class="card-header">
        <span>{{ header }}</span>
        <el-button class="button" text>
          操作
        </el-button>
      </div>
    </template>
    <div class="card-body">
      <slot /> <div v-if="description" class="card-description">
        {{ description }}
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
  font-size: 12px;
}
</style>
