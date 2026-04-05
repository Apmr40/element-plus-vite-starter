<template>
  <!-- 预览窗口 -->
  <el-dialog
    v-model="visible"
    title="资源配置预览"
    width="900px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <!-- 层级导航区 -->
    <div style="margin-bottom: 24px;">
      <!-- 层级 Steps -->
      <el-steps :active="getStepsActive()" simple>
        <el-step 
          v-for="level in levelConfig" 
          :key="level.level" 
          :title="level.name" 
          :status="getLevelStatus(level.level)"
        />
      </el-steps>

      <!-- 清空全部按钮（有选中数据时显示） -->
      <div v-if="hasSelectedData" style="text-align: right; margin-top: 8px;">
        <el-button type="info" size="small" @click="handleClearAll">
          <el-icon><Delete /></el-icon>
          清空全部
        </el-button>
      </div>
    </div>

    <!-- 动态级联选择区域 -->
    <div class="cascade-preview-container">
      <div v-for="level in levelConfig" :key="level.level" class="level-item">
        <div class="level-header">
          <span class="level-title">第{{ level.level }}级：{{ level.name }}</span>
          <el-tag 
            v-if="level.level === currentLevel" 
            size="small" 
            type="info" 
            effect="plain"
          >
            当前层级
          </el-tag>
          <el-tag 
            v-if="level.level < currentLevel" 
            size="small" 
            type="success" 
            effect="plain"
          >
            已完成
          </el-tag>
        </div>

        <!-- 清空按钮（选中后显示） -->
        <div v-if="level.selectedValue != null && level.selectedValue !== ''" class="clear-btn-wrapper">
          <el-button
            type="info"
            size="small"
            circle
            @click="() => handleLevelClear(level.level)"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 末级 Table -->
        <div v-if="level.level === currentLevel && level.level === levelConfig.length" class="table-selector">
          <el-table
            v-loading="level.loading"
            :data="level.data || []"
            border
            style="width: 100%"
            :ref="tableRef"
            @selection-change="handleTableSelect"
            :row-key="valueField"
          >
            <!-- 多选模式显示全选列 -->
            <el-table-column
              v-if="config.selectMode === 'multiple'"
              type="selection"
              width="55"
              :selectable="selectable"
            />
            
            <!-- 单选模式使用 radio 列 -->
            <el-table-column
              v-else
              type="index"
              width="55"
            />
            <el-table-column 
              v-for="col in level.columns" 
              :key="col.field"
              :prop="col.field"
              :label="col.header"
              :width="col.width"
            />
          </el-table>

          <div class="table-pagination" v-if="level.total > 0">
            <el-pagination
              v-model:current-page="level.page"
              :page-size="level.pageSize"
              :total="level.total"
              @current-change="handlePageChange"
              layout="prev, pager, next, total"
              small
            />
          </div>

          <el-empty v-if="level.data && level.data.length === 0 && !level.loading" description="暂无数据" />
        </div>

        <!-- 非末级 Combobox -->
        <div v-else-if="level.level <= currentLevel" class="combobox-selector">
          <el-select
            v-model="level.selectedValue"
            :placeholder="level.placeholder || '请选择...'"
            :disabled="level.disabled"
            :loading="level.loading"
            filterable
            clearable
            @change="handleLevelChange(level)"
            @clear="() => handleLevelClear(level.level)"
          >
            <el-option
              v-for="item in level.data || []"
              :key="item[valueField]"
              :label="item[displayField]"
              :value="item[valueField]"
            />
          </el-select>

          <el-empty v-if="!level.loading && (!level.data || level.data.length === 0)" description="暂无数据" />
        </div>

        <!-- 未开始的层级 -->
        <div v-else class="level-disabled">
          <el-select disabled placeholder="请先完成上一级选择" style="width: 100%;">
            <el-option disabled value="" label="请先完成上一级选择" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button v-if="currentLevel > 1" @click="handlePrevLevel" plain>
          ← 上一步
        </el-button>
        <el-space v-else :size="50">
          <span style="visibility: hidden">占位</span>
        </el-space>

        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="!canConfirm"
          :loading="confirmLoading"
        >
          {{ isLastLevel ? '确认选择' : '继续下一级 →' }}
        </el-button>
        <el-button @click="handleClose">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Close } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  levelConfig: {
    type: Array,
    default: () => []
  },
  // 全局配置
  config: {
    type: Object,
    default: () => ({
      displayField: 'name',
      valueField: 'id',
      pageSize: 20,
      selectMode: 'single'  // 'single' | 'multiple'
    })
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'close'])

// Data
const visible = ref(false)
const currentLevel = ref(1)
const confirmLoading = ref(false)
const selectedItems = ref([])
const tableRef = ref()

// 防抖和 AbortController 相关
let currentAbortController = null

const displayField = computed(() => props.config.displayField || 'name')
const valueField = computed(() => props.config.valueField || 'id')

const isLastLevel = computed(() => {
  return currentLevel.value === props.levelConfig.length
})

const canConfirm = computed(() => {
  // 末级必须有选中项
  if (isLastLevel.value) {
    if (props.config.selectMode === 'single') {
      return selectedItems.value.length === 1
    }
    return selectedItems.value.length > 0
  }
  // 非末级只要当前层级有值
  const current = props.levelConfig.find(l => l.level === currentLevel.value)
  return current && current.selectedValue != null && current.selectedValue !== ''
})

// 是否有选中数据（用于显示清空全部按钮）
const hasSelectedData = computed(() => {
  return props.levelConfig.some(l => l.selectedValue != null && l.selectedValue !== '')
})

// 方法
function open() {
  visible.value = true
  currentLevel.value = 1
  selectedItems.value = []
  
  // 初始化所有层级的数据状态
  props.levelConfig.forEach(level => {
    if (!level.loading) level.loading = false
    if (!level.data) level.data = []
    if (!level.page) level.page = 1
    if (!level.pageSize) level.pageSize = props.config.pageSize || 20
    if (!level.total) level.total = 0
  })
}

function close() {
  visible.value = false
}

function handleClose() {
  cancelPreviousRequest()
  close()
  emit('close')
}

// 统一的 Toast 封装
const showToast = (type, message, duration = null) => {
  const defaultDuration = {
    success: 2000,
    error: 4000,
    warning: 3000,
    info: 3000,
    loading: 0
  }
  
  const iconMap = {
    success: 'CircleCheck',
    error: 'CircleClose',
    warning: 'Warning',
    info: 'InfoFilled',
    loading: 'Loading'
  }
  
  const customClass = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
    loading: 'toast-loading'
  }
  
  return ElMessage({
    message,
    type,
    duration: duration ?? defaultDuration[type],
    icon: iconMap[type],
    customClass: customClass[type],
    showClose: type !== 'loading'
  })
}

// 便捷方法
const showSuccess = (message) => showToast('success', message)
const showError = (message) => showToast('error', message)
const showWarning = (message) => showToast('warning', message)
const showInfo = (message) => showToast('info', message)
const showLoading = (message) => showToast('loading', message)

// 取消前一请求
const cancelPreviousRequest = () => {
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
}

// 防抖的查询函数（300ms 延迟）
function createDebounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 获取 Steps 的 active 状态（Steps 从 0 开始计数）
const getStepsActive = () => {
  return currentLevel.value - 1
}

// 获取层级状态
const getLevelStatus = (level) => {
  if (level < currentLevel.value) return 'finish'
  if (level === currentLevel.value) return 'process'
  if (props.levelConfig.find(l => l.level === level)?.error) return 'error'
  return 'wait'
}

// 加载下一级数据（支持防抖和 AbortController）
const debouncedFetchLevel = createDebounce(async (level, parentId) => {
  await fetchLevelData(level, parentId)
}, 300)

// 加载 Table 数据（支持防抖和 AbortController）
const debouncedFetchTable = createDebounce(async (parentId) => {
  const level = props.levelConfig[currentLevel.value - 1]
  await fetchLevelData(currentLevel.value, parentId)
}, 300)

// 发起级联查询请求
const fetchLevelData = async (level, parentId, page = 1) => {
  const levelConfigItem = props.levelConfig[level - 1]
  if (!levelConfigItem) return

  // 1. 取消前一请求
  cancelPreviousRequest()
  
  // 2. 创建新的 AbortController
  currentAbortController = new AbortController()
  
  // 3. 设置加载状态
  levelConfigItem.loading = true
  if (!levelConfigItem.error) levelConfigItem.error = null
  
  try {
    // 4. 发起请求（传入 signal）
    const response = await fetch(levelConfigItem.apiUrl, {
      method: levelConfigItem.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: levelConfigItem.method === 'POST' 
        ? JSON.stringify({ 
            [levelConfigItem.queryParam || 'parentId']: parentId,
            page,
            pageSize: levelConfigItem.pageSize
          })
        : undefined,
      signal: currentAbortController.signal
    })
    
    // 5. 处理响应
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const result = await response.json()
    
    // 6. 更新数据
    levelConfigItem.data = result.data?.list || []
    levelConfigItem.total = result.data?.total || 0
    levelConfigItem.page = result.data?.page || 1
    levelConfigItem.pageSize = result.data?.pageSize || levelConfigItem.pageSize || 20
    
    // 7. 错误处理（配合 A-004 Toast 规范）
    const getErrorMessage = (error) => {
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        return '网络连接失败，请检查网络后重试'
      }
      if (error.message.includes('404')) {
        return '资源接口不存在，请检查配置'
      }
      if (error.message.includes('500')) {
        return '服务器异常，请稍后重试'
      }
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        return '请求超时，请重试'
      }
      return '请求失败，请重试'
    }
    
    // 8. 如果是最后一级，自动加载 Table 数据
    if (level === props.levelConfig.length && levelConfigItem.data.length > 0) {
      // Table 数据已包含在 levelConfigItem.data 中
    }
    
  } catch (error) {
    // 9. 错误处理
    if (error.name === 'AbortError') {
      // 请求被取消，不处理
      console.log('Request cancelled')
      return
    }
    
    // 其他错误，记录并显示
    levelConfigItem.error = error.message
    showError(getErrorMessage(error))
  } finally {
    // 10. 清理状态
    levelConfigItem.loading = false
    currentAbortController = null
  }
}

async function handleLevelChange(level) {
  // 当前层级选择后，加载下一级数据
  if (level.level < props.levelConfig.length) {
    const nextLevel = props.levelConfig[level.level] // 下一级索引是 level (1-based)
    if (nextLevel) {
      // 重置下级数据
      resetLevelsAfter(level.level)
      
      // 防抖加载下一级
      debouncedFetchLevel(nextLevel.level, level.selectedValue)
      
      // 如果下一级加载完成且有数据，自动跳转
      await nextTick()
      if (nextLevel.data && nextLevel.data.length > 0) {
        currentLevel.value = nextLevel.level
      }
    }
  } else {
    // 已是最后一级，加载 Table 数据
    debouncedFetchTable(level.selectedValue)
  }
}

// 重置指定层级之后的所有层级
const resetLevelsAfter = (level) => {
  for (let i = level; i < props.levelConfig.length; i++) {
    const resetLevel = props.levelConfig[i]
    resetLevel.selectedValue = null
    resetLevel.data = []
    resetLevel.total = 0
    resetLevel.error = null
    if (i > level - 1) {
      resetLevel.disabled = true
    }
  }
}

async function handlePageChange(page) {
  const level = props.levelConfig.find(l => l.level === currentLevel.value)
  if (level) {
    level.page = page
    level.loading = true
    try {
      const result = await fetchLevelData(currentLevel.value, level.selectedValue, page)
      level.data = result?.data?.list || []
      level.total = result?.data?.total || 0
      level.page = result?.data?.page || 1
    } catch (error) {
      showError('分页查询失败：' + (error.message || '未知错误'))
    } finally {
      level.loading = false
    }
  }
}

function handleTableSelect(selection) {
  // 单选模式下限制只能选一项
  if (props.config.selectMode === 'single' && selection.length > 1) {
    selectedItems.value = selection.slice(-1)
  } else {
    selectedItems.value = selection
  }
}

async function handleConfirm() {
  if (!canConfirm.value) {
    showWarning('请先完成当前层级的选择')
    return
  }

  if (isLastLevel.value) {
    // 最后一级，确认并返回数据
    confirmLoading.value = true
    try {
      // 构建完整的选中路径
      const selectedPath = props.levelConfig
        .filter(l => l.selectedValue != null && l.selectedValue !== '')
        .map(l => ({
          level: l.level,
          levelName: l.name,
          label: l.data?.find(item => item[valueField.value]?.toString() === l.selectedValue?.toString())?.[displayField.value] || l.selectedValue,
          value: l.selectedValue
        }))
      
      emit('confirm', {
        selectedPath,
        selectedItems: selectedItems.value,
        timestamp: Date.now()
      })
      
      close()
    } catch (error) {
      showError('数据提交失败：' + (error.message || '未知错误'))
    } finally {
      confirmLoading.value = false
    }
  } else {
    // 还有下一级，跳转
    currentLevel.value++
  }
}

// 清空当前级
const handleLevelClear = (level) => {
  const levelConfigItem = props.levelConfig[level - 1]
  
  // 1. 清空本级选中值
  levelConfigItem.selectedValue = null
  levelConfigItem.error = null
  
  // 2. 重置本级及之后的数据
  resetLevelsAfter(level)
  
  // 3. 清空 Table 选中
  selectedItems.value = []
  
  // 4. 更新当前层级（回退到上一级）
  currentLevel.value = Math.max(1, level - 1)
  
  // 5. 提示用户
  showInfo(`已清空第${level}级及之后的选择`)
}

// 清空全部
const handleClearAll = () => {
  // 1. 取消当前请求
  cancelPreviousRequest()
  
  // 2. 清空所有数据
  props.levelConfig.forEach(level => {
    level.selectedValue = null
    level.data = []
    level.total = 0
    level.error = null
    level.loading = false
  })
  
  // 3. 重置当前层级
  currentLevel.value = 1
  
  // 4. 清空 Table 选中
  selectedItems.value = []
  
  // 5. 重新加载第一级
  fetchLevelData(1, null)
  
  // 6. 提示用户
  showSuccess('已清空全部选择')
}

function handlePrevLevel() {
  if (currentLevel.value > 1) {
    currentLevel.value--
    
    // 重置当前级及之后的层级（使用 resetLevelsAfter）
    resetLevelsAfter(currentLevel.value)
  }
}

// 监听 selectMode 变化，更新 Table 的 selectable
const selectable = computed(() => {
  return (row) => {
    if (props.config.selectMode === 'single') {
      // 单选模式：如果已有选中项，则其他行不可选
      if (selectedItems.value.length > 0) {
        return row[valueField.value] === selectedItems.value[0][valueField.value]
      }
      return true
    }
    // 多选模式：所有行都可选
    return true
  }
})

// Watch
watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    emit('close')
  }
})

// Expose
defineExpose({
  open
})

// Lifecycle
onMounted(() => {
  // 初始化第一级数据
  if (visible.value) {
    fetchLevelData(1, null)
  }
})
</script>

<style scoped>
.cascade-preview-container {
  margin-bottom: 24px;
}

.level-item {
  position: relative;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.level-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.clear-btn-wrapper {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.table-selector {
  max-height: 400px;
  overflow-y: auto;
}

.table-pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.level-disabled {
  color: #999;
}

:deep(.el-step__title) {
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Toast 样式定制 */
:deep(.toast-success .el-message__content) { color: #67C23A; }
:deep(.toast-error .el-message__content) { color: #F56C6C; }
:deep(.toast-warning .el-message__content) { color: #E6A23C; }
:deep(.toast-info .el-message__content) { color: #409EFF; }
</style>
