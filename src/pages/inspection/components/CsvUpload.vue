<!-- 多CSV上传组件 -->
<template>
  <div class="csv-upload">
    <!-- 上传区域 -->
    <div 
      class="upload-zone" 
      :class="{ 'upload-zone-hover': isDragOver }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <el-icon class="upload-icon" :size="64"><Upload /></el-icon>
      <p class="upload-text">拖拽 CSV 到此处或点击上传</p>
      <p class="upload-hint">支持 .csv 文件，单个最大 10MB，最多 5 个文件</p>
      <input
        ref="fileInput"
        type="file"
        class="file-input"
        accept=".csv"
        multiple
        @change="handleFileSelect"
      />
      <el-button 
        type="primary" 
        @click="fileInput?.click()" 
        :disabled="uploadedFiles.length >= 5"
        style="margin-top: 16px"
      >
        点击上传
      </el-button>
    </div>

    <!-- 上传成功提示 -->
    <el-alert
      v-if="hasSuccess"
      type="success"
      :title="`成功上传 ${uploadedFiles.length} 个文件`"
      :closable="false"
      style="margin-bottom: 16px"
    />

    <!-- 文件列表 -->
    <div v-if="uploadedFiles.length > 0" class="file-list">
      <el-divider content-position="left">
        已上传文件 ({{ uploadedFiles.length }}/5)
      </el-divider>

      <div v-for="(file, index) in uploadedFiles" :key="file.id" class="file-item">
        <div class="file-info">
          <el-icon class="file-icon" :size="24"><Document /></el-icon>
          <div class="file-details">
            <div class="file-name">{{ file.originalName }}</div>
            <div class="file-meta">
              {{ formatFileSize(file.size) }} · {{ file.columns.length }} 列
              · {{ file.rows }} 行
            </div>
          </div>
        </div>

        <div class="file-actions">
          <!-- 别名编辑 -->
          <el-input
            v-model="file.alias"
            placeholder="别名"
            size="small"
            style="width: 120px; margin-right: 8px"
            @focus="handleAliasFocus(index)"
            @blur="handleAliasBlur(index)"
          />

          <!-- 更多操作 -->
          <el-dropdown @command="(cmd) => handleFileCommand(index, cmd)">
            <el-button size="small">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="editAlias">重命名别名</el-dropdown-item>
                <el-dropdown-item command="viewFields">查看字段</el-dropdown-item>
                <el-dropdown-item command="remove" divided>移除文件</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 移除按钮 -->
          <el-button
            type="danger"
            size="small"
            @click="removeFile(index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <!-- 字段展示 -->
        <div v-if="file.expanded" class="file-fields">
          <el-tag
            v-for="field in file.fields"
            :key="field"
            size="small"
            style="margin-right: 8px; margin-bottom: 4px"
            closable
            @close="removeFieldFromFile(index, field)"
          >
            {{ field }}
          </el-tag>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="file-actions-bar">
        <el-button type="primary" @click="handleNextStep" :disabled="uploadedFiles.length === 0">
          下一步：配置规则逻辑
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { 
  Upload, 
  Document, 
  MoreFilled, 
  Delete 
} from '@element-plus/icons-vue'

interface UploadedFile {
  id: string
  originalName: string
  fileName: string
  size: number
  columns: string[]
  rows: number
  alias: string
  expanded: boolean
  status: 'uploading' | 'success' | 'error'
}

// 状态
const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const uploadedFiles = ref<UploadedFile[]>([])

// 计算属性
const hasSuccess = computed(() => 
  uploadedFiles.value.some(f => f.status === 'success')
)

// 方法
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const generateId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = e.dataTransfer?.files
  if (!files) return

  await processFiles(files)
}

const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files) return

  await processFiles(files)
  input.value = ''
}

const processFiles = async (files: FileList): Promise<void> => {
  const newFiles: UploadedFile[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // 检查文件扩展名
    if (!file.name.endsWith('.csv')) {
      ElMessage.warning(`文件 ${file.name} 不是 CSV 格式`)
      continue
    }

    // 检查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.warning(`文件 ${file.name} 超过 10MB 限制`)
      continue
    }

    // 检查文件数量限制
    if (uploadedFiles.value.length + newFiles.length >= 5) {
      ElMessage.warning('最多只能上传 5 个文件')
      break
    }

    // 模拟解析 CSV (实际应该读取文件内容)
    const alias = file.name.replace('.csv', '')
    const fields = ['field_1', 'field_2', 'field_3'] // 模拟字段
    
    newFiles.push({
      id: generateId(),
      originalName: file.name,
      fileName: file.name,
      size: file.size,
      columns: fields,
      rows: 100, // 模拟行数
      alias: alias,
      expanded: false,
      status: 'success',
    })
  }

  if (newFiles.length > 0) {
    uploadedFiles.value.push(...newFiles)
    ElMessage.success(`成功上传 ${newFiles.length} 个文件`)
    await nextTick()
    emit('file-upload', uploadedFiles.value)
  }
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
  emit('file-upload', uploadedFiles.value)
}

const handleFileCommand = (index: number, command: string) => {
  const file = uploadedFiles.value[index]
  
  switch (command) {
    case 'editAlias':
      file.expanded = true
      break
    case 'viewFields':
      file.expanded = !file.expanded
      break
    case 'remove':
      removeFile(index)
      break
  }
}

const removeFieldFromFile = (fileIndex: number, field: string) => {
  const file = uploadedFiles.value[fileIndex]
  file.columns = file.columns.filter(f => f !== field)
}

const handleAliasFocus = (index: number) => {
  const input = document.querySelectorAll('.file-input')[index] as HTMLInputElement
  if (input) {
    input.select()
  }
}

const handleAliasBlur = (index: number) => {
  const file = uploadedFiles.value[index]
  // 校验别名 (字母、数字、下划线，最长20字符)
  const aliasRegex = /^[a-zA-Z0-9_]{1,20}$/
  if (!aliasRegex.test(file.alias)) {
    ElMessage.error('别名格式不正确')
    file.alias = file.originalName.replace('.csv', '')
  }
}

const handleNextStep = () => {
  if (uploadedFiles.value.length === 0) {
    ElMessage.warning('请先上传 CSV 文件')
    return
  }
  emit('next-step')
}

// Emits
const emit = defineEmits<{
  'file-upload': [files: UploadedFile[]]
  'next-step': []
}>()

// Computed
const computed = {
  hasSuccess: computed(() => 
    uploadedFiles.value.some(f => f.status === 'success')
  )
}
</script>

<style lang="scss" scoped>
.csv-upload {
  .upload-zone {
    border: 2px dashed #d2dde5;
    border-radius: 16px;
    background: #fafbfc;
    padding: 48px;
    text-align: center;
    transition: all 0.3s;
    cursor: pointer;
    
    &:hover,
    &.upload-zone-hover {
      border-color: #3290ff;
      background: #f0f7ff;
    }
    
    .upload-icon {
      color: #91969d;
      margin-bottom: 16px;
    }
    
    .upload-text {
      color: #2f2e4b;
      font-size: 14px;
      margin: 8px 0;
    }
    
    .upload-hint {
      color: #91969d;
      font-size: 12px;
    }
  }

  .file-list {
    .file-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid #e8e9eb;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #ffffff;
      
      &:hover {
        border-color: #3290ff;
      }
      
      .file-info {
        display: flex;
        align-items: center;
        flex: 1;
        margin-right: 16px;
        
        .file-icon {
          color: #3290ff;
          margin-right: 12px;
        }
        
        .file-details {
          .file-name {
            font-weight: 600;
            color: #25303c;
            font-size: 14px;
          }
          
          .file-meta {
            color: #91969d;
            font-size: 12px;
            margin-top: 4px;
          }
        }
      }
      
      .file-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .file-fields {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        background: #f8f9fc;
        border-radius: 4px;
      }
    }
  }

  .file-actions-bar {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
