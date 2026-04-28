<!-- 规则配置表单组件 v2（集成可视化规则编排引擎的四步流程） -->
<template>
  <div class="rule-config-form-v2">
    <!-- 步骤条 -->
    <el-steps :active="currentStep" finish-status="success" align-center>
      <el-step title="上传 CSV 示例" description="上传示例数据文件用于规则配置" />
      <el-step title="配置规则逻辑" description="通过拖拽或脚本配置检查逻辑" />
      <el-step title="测试验证" description="运行测试验证规则准确性" />
      <el-step title="保存规则" description="保存规则到系统" />
    </el-steps>

    <!-- 步骤 1: CSV 上传 -->
    <div v-if="currentStep === 1" class="step-section">
      <CsvUpload
        v-if="currentMode === 'advanced'"
        ref="csvUploadRef"
        @file-upload="handleFileUpload"
        @next-step="handleNextStep"
      />
      <div v-else class="step-content">
        <el-alert
          title="简易模式：使用原有表单配置方式"
          type="info"
          :closable="false"
        />
        <div class="legacy-form">
          <p>原始表单配置区域（简易模式）</p>
        </div>
        <el-button type="primary" @click="handleNextStep" style="margin-top: 16px">
          下一步：配置规则逻辑
        </el-button>
      </div>
    </div>

    <!-- 步骤 2: 规则逻辑配置 -->
    <div v-if="currentStep === 2" class="step-section">
      <div class="mode-switch-container">
        <ModeSwitch
          v-model:currentMode="currentMode"
          @mode-change="handleModeChange"
        />
        <el-text v-if="currentMode === 'advanced'" type="info" size="small" style="margin-left: 16px">
          高级模式：支持复杂规则配置
        </el-text>
      </div>

      <div v-if="currentMode === 'advanced'" class="visual-config">
        <div class="visual-layout">
          <div class="field-toolbox">
            <BrickLibrary
              :csvFields="uploadedFields"
              @fields-added="handleFieldsAdded"
            />
          </div>

          <div class="visual-canvas">
            <BlocklyIntegration ref="blocklyRef" />
          </div>

          <div v-if="selectedBlock" class="properties-panel">
            <div class="panel-header">
              <span>积木参数</span>
              <el-icon @click="selectedBlock = null"><Close /></el-icon>
            </div>
            <el-form label-position="top" label-width="80px">
              <el-form-item label="字段名称">
                <el-input v-model="selectedBlock.params.field" />
              </el-form-item>
              <el-form-item label="操作符">
                <el-select v-model="selectedBlock.params.operator" placeholder="请选择">
                  <el-option label="等于" value="=" />
                  <el-option label="不等于" value="!=" />
                  <el-option label="包含" value="contains" />
                  <el-option label="正则匹配" value="regex" />
                </el-select>
              </el-form-item>
              <el-form-item label="比较值">
                <el-input v-model="selectedBlock.params.value" />
              </el-form-item>
            </el-form>
          </div>
        </div>
        <div class="visual-actions">
          <el-button @click="handleSwitchToSimple">切换到简易模式</el-button>
        </div>
      </div>

      <div v-if="currentMode === 'simple'" class="form-config">
        <el-form
          ref="simpleFormRef"
          :model="simpleForm"
          label-position="top"
          label-width="120px"
        >
          <el-form-item label="字段名称">
            <el-select v-model="simpleForm.field" placeholder="请选择字段">
              <el-option
                v-for="field in uploadedFields"
                :key="field"
                :label="field"
                :value="field"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="操作符">
            <el-select v-model="simpleForm.operator" placeholder="请选择操作符">
              <el-option label="等于" value="=" />
              <el-option label="不等于" value="!=" />
              <el-option label="包含" value="contains" />
              <el-option label="正则匹配" value="regex" />
            </el-select>
          </el-form-item>
          <el-form-item label="比较值">
            <el-input v-model="simpleForm.value" placeholder="输入比较值" />
          </el-form-item>
          <el-form-item label="规则描述">
            <el-input
              v-model="simpleForm.description"
              type="textarea"
              :rows="3"
              placeholder="描述此规则的用途"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="step-actions">
        <el-button @click="currentStep = 1">上一步</el-button>
        <el-button type="primary" @click="handleNextStep">下一步：测试验证</el-button>
      </div>
    </div>

    <!-- 步骤 3: 测试验证 -->
    <div v-if="currentStep === 3" class="step-section">
      <div class="test-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>测试数据</span>
            </div>
          </template>
          <div class="test-data">
            <el-alert
              :title="`已上传 ${uploadedFiles.length} 个文件，共 ${totalFields} 个字段`"
              type="info"
              :closable="false"
            />
          </div>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>
            <div class="card-header">
              <span>测试运行</span>
            </div>
          </template>
          <div class="test-run">
            <el-button type="primary" @click="handleTestRun" :loading="testing">运行测试</el-button>
            <el-button @click="handleExportCSV" style="margin-left: 8px">导出测试结果</el-button>
          </div>

          <div v-if="testResult" class="test-result" style="margin-top: 16px">
            <el-alert
              :title="`测试结果：通过 ${testResult.passed} / ${testResult.total} 条规则`"
              :type="testResult.passed === testResult.total ? 'success' : 'warning'"
              :closable="false"
            />
            <el-table :data="testResult.details" style="margin-top: 16px" size="small">
              <el-table-column prop="ruleName" label="规则名称" width="150" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'pass' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'pass' ? '通过' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="详情" />
            </el-table>
          </div>
          
          <div v-if="!testResult" class="mock-section">
            <el-alert title="模拟数据已准备就绪" type="success" :closable="false" />
            <div class="mock-buttons">
              <el-button type="primary" @click="runMockTest">模拟运行测试</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="step-actions">
        <el-button @click="currentStep = 2">上一步</el-button>
        <el-button type="primary" @click="handleNextStep">下一步：保存规则</el-button>
      </div>
    </div>

    <!-- 步骤 4: 保存规则 -->
    <div v-if="currentStep === 4" class="step-section">
      <div class="save-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>保存规则</span>
            </div>
          </template>

          <el-form ref="saveFormRef" :model="saveForm" label-position="top" label-width="120px">
            <el-form-item label="规则名称" required>
              <el-input
                v-model="saveForm.name"
                placeholder="请输入规则名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="技术栈">
              <el-select v-model="saveForm.techStack" placeholder="请选择技术栈" multiple>
                <el-option v-for="stack in techStacks" :key="stack.value" :label="stack.label" :value="stack.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="规则标签">
              <el-select v-model="saveForm.tags" placeholder="请选择标签" multiple>
                <el-option v-for="tag in tagOptions" :key="tag.value" :label="tag.label" :value="tag.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="规则描述">
              <el-input v-model="saveForm.description" type="textarea" :rows="4" placeholder="描述此规则的用途" />
            </el-form-item>
            <el-form-item label="模式">
              <el-tag :type="currentMode === 'advanced' ? 'primary' : 'info'" size="large">
                {{ currentMode === 'advanced' ? '高级模式（可视化）' : '简易模式（表单）' }}
              </el-tag>
            </el-form-item>
          </el-form>

          <div class="save-actions">
            <el-button @click="currentStep = 3">上一步</el-button>
            <el-button type="primary" @click="handleSaveRule" :loading="saving" style="margin-left: 8px">
              保存规则
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import CsvUpload from './CsvUpload.vue'
import ModeSwitch from './ModeSwitch.vue'
import BrickLibrary from './BrickLibrary.vue'
import BlocklyIntegration from './BlocklyIntegration.vue'

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

interface TestResult {
  passed: number
  total: number
  details: Array<{ ruleName: string; status: 'pass' | 'fail'; message: string }>
}

const currentStep = ref(1)
const currentMode = ref<'simple' | 'advanced'>('simple')
const csvUploadRef = ref<InstanceType<typeof CsvUpload> | null>(null)
const blocklyRef = ref<InstanceType<typeof BlocklyIntegration> | null>(null)
const testing = ref(false)
const saving = ref(false)
const selectedBlock = ref<any>(null)
const uploadedFiles = ref<UploadedFile[]>([])
const testResult = ref<TestResult | null>(null)

const simpleForm = reactive({
  field: '',
  operator: '',
  value: '',
  description: '',
})

const saveForm = reactive({
  name: '基础合规检查规则',
  techStack: ['java', 'python', 'nodejs'],
  tags: ['security', 'performance', 'standard'],
  description: '基础合规检查规则，用于监控服务器基本配置',
})

const props = defineProps<{
  modelValue?: any
}>()

const techStacks = computed(() => [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'nodejs', label: 'Node.js' },
])

const tagOptions = computed(() => [
  { value: 'security', label: '安全' },
  { value: 'performance', label: '性能' },
  { value: 'standard', label: '规范' },
])

const uploadedFields = computed(() => {
  const fields = new Set<string>()
  uploadedFiles.value.forEach(file => {
    file.columns.forEach(field => {
      fields.add(`${file.alias}.${field}`)
    })
  })
  return Array.from(fields)
})

const totalFields = computed(() => uploadedFiles.value.reduce((sum, file) => sum + file.columns.length, 0))

const handleFileUpload = (files: UploadedFile[]) => {
  uploadedFiles.value = files
  ElMessage.success(`成功上传 ${files.length} 个文件`)
}

const handleFieldsAdded = (fields: string[]) => {
  console.log('字段已添加:', fields)
}

const handleModeChange = (mode: string) => {
  currentMode.value = mode as 'simple' | 'advanced'
  ElMessage.info(`已切换到 ${mode === 'simple' ? '简易模式' : '高级模式'}`)
  if (mode === 'simple') {
    simpleForm.field = ''
    simpleForm.operator = ''
    simpleForm.value = ''
  }
}

const handleSwitchToSimple = () => {
  currentMode.value = 'simple'
  ElMessage.success('已切换到简易模式')
}

const handleNextStep = () => {
  if (currentStep.value < 4) {
    if (currentStep.value === 1 && uploadedFiles.value.length === 0) {
      ElMessage.warning('请先上传 CSV 文件')
      return
    }
    if (currentStep.value === 2) {
      if (currentMode.value === 'simple' && !simpleForm.field) {
        ElMessage.warning('请选择字段')
        return
      }
    }
    currentStep.value++
  }
}

const runMockTest = () => {
  testing.value = true
  setTimeout(() => {
    testResult.value = {
      passed: 7,
      total: 10,
      details: [
        { ruleName: 'SSL证书有效期检查', status: 'pass', message: '规则匹配成功，23个服务器符合条件' },
        { ruleName: '端口合规检查', status: 'pass', message: '规则匹配成功，512个端口符合规范' },
        { ruleName: '磁盘空间使用率检查', status: 'pass', message: '规则匹配成功，98%的磁盘使用率低于阈值' },
        { ruleName: '内存使用率检查', status: 'fail', message: '规则匹配失败，发现5个服务器内存使用率超过80%' },
        { ruleName: 'CPU使用率检查', status: 'pass', message: '规则匹配成功，CPU使用率均在合理范围内' },
        { ruleName: '网络连接数检查', status: 'pass', message: '规则匹配成功，网络连接数正常' },
        { ruleName: '日志文件大小检查', status: 'fail', message: '规则匹配失败，发现3个服务器日志文件过大' },
        { ruleName: '用户登录检查', status: 'pass', message: '规则匹配成功，用户登录行为正常' },
        { ruleName: '服务状态检查', status: 'pass', message: '规则匹配成功，所有核心服务运行正常' },
        { ruleName: '备份状态检查', status: 'pass', message: '规则匹配成功，备份任务全部完成' },
      ],
    }
    testing.value = false
    ElMessage.success('测试运行完成')
  }, 1500)
}

const handleTestRun = () => {
  runMockTest()
}

const handleExportCSV = () => {
  ElMessage.success('测试结果导出中...')
}

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
  (e: 'mode-change', mode: string): void
}>()

const handleSaveRule = () => {
  if (!saveForm.name.trim()) {
    ElMessage.warning('请输入规则名称')
    return
  }
  
  saving.value = true
  setTimeout(() => {
    saving.value = false
    ElMessage.success('规则保存成功')
    emit('submit', {
      ...saveForm,
      mode: currentMode.value,
      config: {
        type: currentMode.value,
        fields: uploadedFields.value,
      },
    })
  }, 1000)
}

onMounted(() => {
  if (props.modelValue) {
    saveForm.name = props.modelValue.name || ''
    saveForm.techStack = props.modelValue.techStack || []
    saveForm.tags = props.modelValue.tags || []
  }
})
</script>

<style lang="scss" scoped>
.rule-config-form-v2 {
  .step-section {
    padding: 24px 0;
  }

  .step-content {
    padding: 24px;
  }

  .legacy-form {
    padding: 24px;
    background: #fafbfc;
    border-radius: 8px;
    border: 1px dashed #d2dde5;
  }

  .mode-switch-container {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .visual-config {
    .visual-layout {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;

      .field-toolbox {
        width: 240px;
        flex-shrink: 0;
      }

      .visual-canvas {
        flex: 1;
        min-width: 400px;
      }

      .properties-panel {
        width: 280px;
        flex-shrink: 0;
      }
    }

    .visual-actions {
      text-align: center;
    }
  }

  .form-config {
    padding: 24px;
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e8e9eb;
  }

  .test-section {}

  .card-header {
    font-weight: 600;
  }

  .test-run {
    .el-button {
      margin-right: 8px;
    }
  }

  .test-result {}

  .mock-section {
    .mock-buttons {
      margin-top: 16px;
    }
  }

  .save-section {}

  .save-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e8e9eb;
  }
}
</style>
