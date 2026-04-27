<!-- 模式切换组件 -->
<template>
  <div class="mode-switch">
    <div class="switch-container">
      <div 
        class="mode-tab"
        :class="{ 'mode-tab-active': currentMode === 'simple' }"
        @click="switchMode('simple')"
      >
        简易模式
      </div>
      <div 
        class="mode-tab"
        :class="{ 'mode-tab-active': currentMode === 'advanced' }"
        @click="switchMode('advanced')"
      >
        高级模式
      </div>
    </div>

    <!-- 切换确认弹窗 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="确认切换"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="切换模式将同步当前配置，是否继续？"
        type="warning"
        :closable="false"
      />
      <div v-if="syncError" class="error-message">
        <el-alert
          title="数据同步失败，请检查配置后重试"
          type="error"
          :closable="false"
        />
      </div>
      <template #footer>
        <el-button @click="cancelSwitch">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSwitch"
          :loading="syncLoading"
        >
          确定切换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// 状态
const currentMode = ref<'simple' | 'advanced'>('simple')
const confirmDialogVisible = ref(false)
const pendingMode = ref<'simple' | 'advanced' | null>(null)
const syncLoading = ref(false)
const syncError = ref(false)

// Methods
const switchMode = (mode: 'simple' | 'advanced') => {
  if (mode === currentMode.value) return
  
  if (mode === 'advanced') {
    // 从简易模式切换到高级模式
    pendingMode.value = mode
    confirmDialogVisible.value = true
    syncError.value = false
  } else {
    // 从高级模式切换到简易模式
    pendingMode.value = mode
    confirmDialogVisible.value = true
    syncError.value = false
  }
}

const confirmSwitch = async () => {
  if (!pendingMode.value) return
  
  syncLoading.value = true
  syncError.value = false
  
  try {
    // 执行模式切换逻辑
    await syncData(currentMode.value, pendingMode.value)
    
    currentMode.value = pendingMode.value
    ElMessage.success(`已切换到 ${currentMode.value === 'simple' ? '简易模式' : '高级模式'}`)
    emit('mode-change', currentMode.value)
  } catch (error) {
    syncError.value = true
    ElMessage.error('数据同步失败')
  } finally {
    syncLoading.value = false
  }
}

const cancelSwitch = () => {
  confirmDialogVisible.value = false
  pendingMode.value = null
}

const syncData = async (fromMode: string, toMode: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 模拟数据同步 (实际应该转换规则格式)
    setTimeout(() => {
      if (Math.random() > 0.1) {
        resolve()
      } else {
        reject(new Error('Sync failed'))
      }
    }, 500) // <100ms in real implementation
  })
}

// Watch
watch(currentMode, (newMode) => {
  emit('mode-change', newMode)
})

// Emits
const emit = defineEmits<{
  'mode-change': [mode: 'simple' | 'advanced']
}>()

// Computed
const computed = {}
</script>

<style lang="scss" scoped>
.mode-switch {
  .switch-container {
    display: inline-flex;
    border: 1px solid #d2dde5;
    border-radius: 4px;
    overflow: hidden;
    
    .mode-tab {
      padding: 8px 24px;
      font-size: 14px;
      color: #3b5369;
      cursor: pointer;
      transition: all 0.3s;
      border-right: 1px solid #d2dde5;
      
      &:last-child {
        border-right: none;
      }
      
      &.mode-tab-active {
        background: #ffffff;
        color: #3290ff;
        font-weight: 600;
      }
      
      &:hover {
        background: #f0f7ff;
        color: #3290ff;
      }
    }
  }
}
</style>
