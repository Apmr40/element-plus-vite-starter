<!-- 运维专属积木库组件 -->
<template>
  <div class="brick-library">
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索积木/字段"
        clearable
        size="small"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 积木分类 Tab -->
    <el-tabs
      v-model="activeTab"
      type="border-card"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        v-for="category in categories"
        :key="category.id"
        :label="category.name"
        :name="category.id"
      >
        <!-- 积木列表 -->
        <div class="brick-grid">
          <div
            v-for="brick in filteredBricks"
            :key="brick.type"
            class="brick-item"
            draggable
            @dragstart="handleDragStart($event, brick)"
          >
            <div class="brick-icon">
              <el-icon :size="24" :color="category.color">
                <component :is="brick.icon" />
              </el-icon>
            </div>
            <div class="brick-label">{{ brick.label }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 字段工具箱 -->
    <div v-if="csvFields.length > 0" class="field-toolbox">
      <div class="toolbox-header">
        <el-icon><List /></el-icon>
        <span>CSV 字段 ({{ csvFields.length }})</span>
      </div>
      <div class="field-list">
        <el-tag
          v-for="field in csvFields"
          :key="field"
          size="small"
          class="field-item"
          draggable
          @dragstart="handleFieldDragStart($event, field)"
        >
          {{ field }}
        </el-tag>
      </div>
    </div>

    <!-- 系统函数 -->
    <div class="system-functions">
      <div class="toolbox-header">
        <el-icon><Timer /></el-icon>
        <span>系统函数</span>
      </div>
      <div class="function-list">
        <div
          v-for="func in systemFunctions"
          :key="func.name"
          class="function-item"
          draggable
          @dragstart="handleFunctionDragStart($event, func)"
        >
          <el-icon :size="16"><Function /></el-icon>
          <span>{{ func.name }}</span>
          <span class="func-args">{{ func.args }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Search,
  List,
  Timer,
  Function as FunctionIcon,
  If,
  And,
  Or,
  Not,
  Text,
  FindReplace,
  Timer as TimerIcon,
  Plus,
} from '@element-plus/icons-vue'

// 积木分类
interface Category {
  id: string
  name: string
  color: string
}

// 积木定义
interface Brick {
  type: string
  label: string
  icon: string
}

// 系统函数定义
interface SystemFunction {
  name: string
  args: string
}

// 状态
const searchKeyword = ref('')
const activeTab = ref('logic')

const categories: Category[] = [
  { id: 'logic', name: '逻辑', color: '#3290ff' },
  { id: 'string', name: '字符串', color: '#00c771' },
  { id: 'loop', name: '循环', color: '#ffb100' },
  { id: 'query', name: '查询', color: '#9e85ff' },
  { id: 'action', name: '操作', color: '#f13039' },
]

// 积木数据
const logicBricks: Brick[] = [
  { type: 'if', label: 'IF 判断', icon: 'If' },
  { type: 'and', label: '与', icon: 'And' },
  { type: 'or', label: '或', icon: 'Or' },
  { type: 'not', label: '非', icon: 'Not' },
  { type: 'equal', label: '等于', icon: 'FindReplace' },
  { type: 'notEqual', label: '不等于', icon: 'FindReplace' },
  { type: 'contains', label: '包含', icon: 'FindReplace' },
  { type: 'regex', label: '正则匹配', icon: 'FindReplace' },
]

const stringBricks: Brick[] = [
  { type: 'split', label: '字符串拆分', icon: 'Text' },
  { type: 'substring', label: '裁剪', icon: 'Text' },
  { type: 'replace', label: '替换', icon: 'FindReplace' },
  { type: 'toUpperCase', label: '转大写', icon: 'Text' },
  { type: 'toLowerCase', label: '转小写', icon: 'Text' },
  { type: 'formatDate', label: '时间格式化', icon: 'Timer' },
]

const loopBricks: Brick[] = [
  { type: 'forEach', label: '逐行遍历', icon: 'Timer' },
  { type: 'forIndex', label: '索引遍历', icon: 'Timer' },
  { type: 'while', label: 'WHILE 循环', icon: 'Timer' },
]

const queryBricks: Brick[] = [
  { type: 'lookup', label: '跨 CSV 匹配', icon: 'FindReplace' },
  { type: 'dictionary', label: '字典查询', icon: 'FindReplace' },
  { type: 'join', label: '字段映射', icon: 'Plus' },
]

const actionBricks: Brick[] = [
  { type: 'alert', label: '标记异常', icon: 'If' },
  { type: 'output', label: '输出字段', icon: 'Text' },
  { type: 'stop', label: '终止执行', icon: 'Not' },
]

// 系统函数
const systemFunctions: SystemFunction[] = [
  { name: 'NOW()', args: '()' },
  { name: 'CONCAT()', args: '(str1, str2)' },
  { name: 'LEN()', args: '(str)' },
  { name: 'DATE_ADD()', args: '(date, days)' },
  { name: 'KEY()', args: '()' },
  { name: 'INDEX()', args: '()' },
]

// 输入的字段
const csvFields = ref<string[]>([])

// 计算属性
const filteredBricks = computed(() => {
  const bricksByCategory: Record<string, Brick[]> = {
    logic: logicBricks,
    string: stringBricks,
    loop: loopBricks,
    query: queryBricks,
    action: actionBricks,
  }
  
  const bricks = bricksByCategory[activeTab.value] || []
  
  if (!searchKeyword.value) return bricks
  
  return bricks.filter(brick =>
    brick.label.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    brick.type.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// Methods
const handleTabClick = (tab: { paneName: string }) => {
  activeTab.value = tab.paneName
}

const handleDragStart = (e: DragEvent, brick: Brick) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('brickType', brick.type)
    e.dataTransfer.setData('brickLabel', brick.label)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

const handleFieldDragStart = (e: DragEvent, field: string) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('field', field)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

const handleFunctionDragStart = (e: DragEvent, func: SystemFunction) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('function', func.name)
    e.dataTransfer.setData('functionArgs', func.args)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

const addFields = (fields: string[]) => {
  fields.forEach(field => {
    if (!csvFields.value.includes(field)) {
      csvFields.value.push(field)
    }
  })
  emit('fields-added', csvFields.value)
}

// Emit
const emit = defineEmits<{
  'fields-added': [fields: string[]]
}>()

// Expose
defineExpose({
  addFields,
})
</script>

<style lang="scss" scoped>
.brick-library {
  .search-box {
    margin-bottom: 12px;
  }

  :deep(.el-tabs) {
    .el-tabs__header {
      margin-bottom: 0;
    }
    
    .el-tabs__content {
      height: calc(100% - 48px);
      overflow-y: auto;
    }
  }

  .brick-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
    
    .brick-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #e8e9eb;
      border-radius: 8px;
      cursor: grab;
      transition: all 0.3s;
      
      &:hover {
        border-color: #3290ff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .brick-icon {
        margin-right: 8px;
      }
      
      .brick-label {
        font-size: 12px;
        color: #2f2e4b;
        font-weight: 500;
      }
    }
  }

  .field-toolbox,
  .system-functions {
    margin-top: 16px;
    
    .toolbox-header {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #25303c;
      margin-bottom: 8px;
      
      .el-icon {
        margin-right: 8px;
        font-size: 16px;
      }
    }
  }

  .field-list {
    .field-item {
      margin-right: 8px;
      margin-bottom: 8px;
      cursor: grab;
      transition: all 0.3s;
      
      &:hover {
        color: #3290ff;
        border-color: #3290ff;
      }
    }
  }

  .function-list {
    .function-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      margin-bottom: 4px;
      background: #f8f9fc;
      border-radius: 4px;
      cursor: grab;
      transition: all 0.3s;
      
      &:hover {
        background: #f0f7ff;
      }
      
      .el-icon {
        margin-right: 8px;
        color: #9e85ff;
      }
      
      span {
        font-size: 12px;
        color: #2f2e4b;
      }
      
      .func-args {
        margin-left: auto;
        color: #91969d;
      }
    }
  }
}
</style>
