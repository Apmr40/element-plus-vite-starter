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
    <!-- 层级导航 -->
    <el-steps :active="currentLevel - 1" simple style="margin-bottom: 24px">
      <el-step 
        v-for="level in levelConfig" 
        :key="level.level" 
        :title="level.name" 
        :status="getLevelStatus(level.level)"
      />
    </el-steps>

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

        <!-- 末级 Table -->
        <div v-if="level.level === currentLevel && level.level === levelConfig.length" class="table-selector">
          <el-table
            v-loading="level.loading"
            :data="level.data || []"
            border
            style="width: 100%"
            @selection-change="handleTableSelect"
            :row-key="valueField"
          >
            <el-table-column 
              type="selection" 
              width="55"
              :selectable="selectable"
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
            style="width: 100%;"
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
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

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
      pageSize: 20
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

const displayField = computed(() => props.config.displayField || 'name')
const valueField = computed(() => props.config.valueField || 'id')

const isLastLevel = computed(() => {
  return currentLevel.value === props.levelConfig.length
})

const canConfirm = computed(() => {
  // 末级必须有选中项
  if (isLastLevel.value) {
    return selectedItems.value.length > 0
  }
  // 非末级只要当前层级有值
  const current = props.levelConfig.find(l => l.level === currentLevel.value)
  return current && current.selectedValue != null && current.selectedValue !== ''
})

// Methods
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
  close()
  emit('close')
}

async function handleLevelChange(level) {
  // 当前层级选择后，加载下一级数据
  if (level.level < props.levelConfig.length) {
    const nextLevel = props.levelConfig[level.level] // 下一级索引是 level (1-based)
    if (nextLevel) {
      nextLevel.loading = true
      try {
        // 调用 API 查询下一级数据
        const queryParams = {
          [nextLevel.queryParam || 'parentId']: level.selectedValue
        }
        
        // 模拟 API 调用（实际应替换为真实 API）
        const result = await queryLevelData(nextLevel.apiUrl, nextLevel.method || 'GET', queryParams)
        
        nextLevel.data = result.data.list || []
        nextLevel.total = result.data.total || 0
        nextLevel.page = result.data.page || 1
        nextLevel.pageSize = result.data.pageSize || nextLevel.pageSize || 20
        
        // 重置后续所有层级
        for (let i = level.level + 1; i < props.levelConfig.length; i++) {
          const resetLevel = props.levelConfig[i]
          resetLevel.selectedValue = null
          resetLevel.data = []
          resetLevel.total = 0
          resetLevel.disabled = true
        }
        
        // 自动跳转到下一级
        currentLevel.value = level.level + 1
      } catch (error) {
        ElMessage.error('加载下级数据失败：' + (error.message || '未知错误'))
        nextLevel.disabled = true
      } finally {
        nextLevel.loading = false
      }
    }
  }
}

async function handlePageChange(page) {
  const level = props.levelConfig.find(l => l.level === currentLevel.value)
  if (level) {
    level.page = page
    level.loading = true
    try {
      const result = await queryLevelData(level.apiUrl, level.method || 'GET', {
        [level.queryParam || 'parentId']: level.selectedValue,
        page: page,
        pageSize: level.pageSize
      })
      level.data = result.data.list || []
      level.total = result.data.total || 0
      level.page = result.data.page || 1
    } catch (error) {
      ElMessage.error('分页查询失败：' + (error.message || '未知错误'))
    } finally {
      level.loading = false
    }
  }
}

function handleTableSelect(selection) {
  selectedItems.value = selection
}

function selectable(row) {
  return true // 所有行都可选，可根据业务逻辑定制
}

function getLevelStatus(level) {
  if (level < currentLevel.value) return 'finish'
  if (level === currentLevel.value) return 'process'
  return 'wait'
}

async function handleConfirm() {
  if (!canConfirm.value) {
    ElMessage.warning('请先完成当前层级的选择')
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
      ElMessage.error('数据提交失败：' + (error.message || '未知错误'))
    } finally {
      confirmLoading.value = false
    }
  } else {
    // 还有下一级，跳转
    currentLevel.value++
  }
}

function handlePrevLevel() {
  if (currentLevel.value > 1) {
    currentLevel.value--
    
    // 重置当前级及之后的层级
    for (let i = currentLevel.value - 1; i < props.levelConfig.length; i++) {
      const level = props.levelConfig[i]
      level.selectedValue = null
      level.data = []
      level.total = 0
      if (i > currentLevel.value - 1) {
        level.disabled = true
      }
    }
  }
}

// 模拟 API 查询（实际应替换为真实 API 调用）
async function queryLevelData(url, method = 'GET', params = {}) {
  // TODO: 替换为真实的 fetch 调用
  // 当有真实 API 时，启用此代码：
  // const queryString = new URLSearchParams(params).toString()
  // const fetchUrl = `${url}?${queryString}`
  // const res = await fetch(fetchUrl, { method })
  // if (!res.ok) throw new Error(`API error: ${res.statusText}`)
  // return await res.json()
  
  // 模拟数据（仅用于开发测试）
  // 注意：生产环境必须替换为真实 API 调用
  return {
    code: 200,
    message: 'success',
    data: {
      list: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  }
}

// 直接使用 props.levelConfig.length，无需额外 computed 包装

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
  // 可以在这里初始化一些全局配置
})
</script>

<style scoped>
.cascade-preview-container {
  margin-bottom: 24px;
}

.level-item {
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
</style>
