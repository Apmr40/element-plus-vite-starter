<!-- 规则配置表单组件（Blockly 拖拽模式 + Python 脚本模式） -->
<template>
  <div class="rule-config-form">
    <!-- 步骤条 -->
    <el-steps :active="currentStep" finish-status="success" align-center>
      <el-step title="上传 CSV 示例" description="上传示例数据文件用于规则配置" />
      <el-step title="配置规则逻辑" description="通过拖拽或脚本配置检查逻辑" />
      <el-step title="测试验证" description="运行测试验证规则准确性" />
      <el-step title="保存规则" description="保存规则到系统" />
    </el-steps>

    <!-- 步骤 1: CSV 上传 -->
    <div v-if="currentStep === 1" class="step-section">
      <div class="upload-zone" :class="{ 'upload-zone-hover': isDragOver }">
        <el-icon class="upload-icon" :size="64"><Upload /></el-icon>
        <p class="upload-text">拖拽 CSV 到此处或点击上传</p>
        <p class="upload-hint">支持 .csv 文件，最大 10MB</p>
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          accept=".csv"
          @change="handleFileChange"
        />
        <el-button type="primary" @click="fileInput?.click()" :disabled="!!csvFile">
          点击上传
        </el-button>
      </div>

      <!-- 字段列表 -->
      <div v-if="csvFields.length > 0" class="fields-list">
        <el-divider content-position="left">
          CSV 字段列表 (共 {{ csvFields.length }} 个字段)
        </el-divider>
        <el-card>
          <el-tag
            v-for="field in csvFields"
            :key="field"
            size="large"
            style="margin-right: 8px; margin-bottom: 8px"
            closable
            @close="removeField(field)"
          >
            {{ field }}
          </el-tag>
        </el-card>
        <div class="fields-actions">
          <el-button type="primary" @click="handleNextStep" :disabled="csvFields.length === 0">
            下一步：配置规则逻辑
          </el-button>
        </div>
      </div>
    </div>

    <!-- 步骤 2: 规则逻辑配置 -->
    <div v-if="currentStep === 2" class="step-section">
      <div class="blockly-container">
        <!-- 左侧字段列表 -->
        <div class="field-list-panel">
          <div class="panel-header">
            <el-icon><List /></el-icon>
            CSV 字段列表
          </div>
          <el-card>
            <el-tag
              v-for="field in csvFields"
              :key="field"
              size="large"
              style="margin-bottom: 8px; cursor: pointer"
              @click="addFieldToCanvas(field)"
            >
              {{ field }}
            </el-tag>
          </el-card>
        </div>

        <!-- 右侧 Blockly 画布 -->
        <div class="blockly-canvas">
          <div class="canvas-header">规则逻辑画布</div>
          <div class="canvas-body" ref="blocklyContainer" />

          <!-- 逻辑块工具箱 -->
          <div class="toolbox">
            <div class="toolbox-title">逻辑块工具箱</div>
            <div class="toolbox-items">
              <div
                v-for="block in logicBlocks"
                :key="block.type"
                class="toolbox-item"
                draggable
                @dragstart="handleDragStart($event, block)"
              >
                <el-icon :size="16"><component :is="block.icon" /></el-icon>
                {{ block.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 逻辑配置完成度 -->
      <div class="completion-indicator">
        <el-progress
          :percentage="logicCompletion"
          :color="getColorByCompletion(logicCompletion)"
          :status="logicCompletion === 100 ? 'success' : undefined"
        />
        <div class="completion-text">
          {{ logicCompletion === 100 ? '完成度 100%' : '请至少配置 1 个条件' }}
        </div>
      </div>

      <div class="form-actions">
        <el-button @click="handlePrevStep">上一步</el-button>
        <el-button type="primary" @click="handleNextStep" :disabled="logicCompletion < 50">
          下一步：测试验证
        </el-button>
      </div>
    </div>

    <!-- 步骤 3: 测试 -->
    <div v-if="currentStep === 3" class="step-section">
      <div class="test-section">
        <div class="test-header">
          <el-icon><TestTube /></el-icon>
          规则测试
        </div>

        <el-alert
          v-if="!csvFile"
          title="请先上传 CSV 示例文件"
          type="error"
          :closable="false"
        />
        <el-alert
          v-else-if="logicBlocksCount === 0"
          title="请至少配置 1 个校验逻辑"
          type="error"
          :closable="false"
        />
        <div v-else class="test-content">
          <el-button
            type="primary"
            :loading="testLoading"
            @click="handleTest"
            :disabled="testLoading"
          >
            <el-icon><Running /></el-icon>
            测试
          </el-button>

          <div v-if="testResult" class="test-result">
            <el-alert
              :title="testResult.passed ? '✅ 测试通过' : '⚠️ 测试未通过'"
              :type="testResult.passed ? 'success' : 'warning'"
              :closable="false"
            />
            <div class="test-statistics">
              <el-space>
                <el-statistic title="总记录数" :value="testResult.total" />
                <el-statistic
                  title="✅ 合规数量"
                  :value="testResult.compliant"
                  :value-style="{ color: '#00C771' }"
                />
                <el-statistic
                  title="❌ 不合规数量"
                  :value="testResult.nonCompliant"
                  :value-style="{ color: '#F13039' }"
                />
                <el-statistic
                  title="合规率"
                  :value="testResult.complianceRate"
                  :precision="1"
                  suffix="%"
                />
              </el-space>
            </div>

            <el-divider />

            <div class="non-compliant-details">
              <div class="details-title">
                不合规明细（前 {{ Math.min(10, testResult.nonCompliant) }} 条）
              </div>
              <el-table :data="testResult.nonCompliantItems" border>
                <el-table-column prop="appId" label="应用编号" />
                <el-table-column prop="instanceId" label="实例 ID" />
                <el-table-column prop="reason" label="不合规原因" />
                <el-table-column prop="riskLevel" label="风险等级">
                  <template #default="{ row }">
                    <el-tag
                      :type="getRiskLevelType(row.riskLevel)"
                      size="small"
                    >
                      {{ getRiskLevelLabel(row.riskLevel) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <el-link v-if="testResult.nonCompliant > 10" type="info">
                共 {{ testResult.nonCompliant }} 条不合规记录
              </el-link>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <el-button @click="handlePrevStep">上一步</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          保存规则
        </el-button>
      </div>
    </div>

    <!-- 步骤 4: 保存完成 -->
    <div v-if="currentStep === 4" class="step-section">
      <el-result icon="success" title="规则保存成功">
        <template #subtitle>
          <p>规则已成功保存到系统</p>
          <p>规则 ID: {{ ruleId }}</p>
          <p>规则名称: {{ ruleName }}</p>
          <p>版本: {{ ruleVersion }}</p>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Upload, List, TestTube, Running } from '@element-plus/icons-vue'

// 属性
const props = defineProps<{
  techStacks?: Array<{ value: string; label: string }>
  tagOptions?: Array<{ value: string; label: string }>
  modelValue?: RuleConfig
}>()

//  emits
const emit = defineEmits<{
  (e: 'submit', data: RuleConfig): void
  (e: 'cancel'): void
}>()

// 状态
const currentStep = ref(1)
const csvFile = ref<File | null>(null)
const csvFields = ref<string[]>([])
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const testLoading = ref(false)
const submitLoading = ref(false)
const logicBlocksCount = ref(0)
const ruleId = ref('')
const ruleName = ref('')
const ruleVersion = ref('')

// 逻辑块定义
const logicBlocks = reactive([
  { type: 'equals', label: '等于', icon: 'Equals' },
  { type: 'notEquals', label: '不等于', icon: 'NotEquals' },
  { type: 'contains', label: '包含', icon: 'Contains' },
  { type: 'regex', label: '正则匹配', icon: 'Regex' },
  { type: 'range', label: '数值范围', icon: 'Range' },
  { type: 'and', label: '与 (AND)', icon: 'And' },
  { type: 'or', label: '或 (OR)', icon: 'Or' },
  { type: 'not', label: '非 (NOT)', icon: 'Not' },
])

// 测试结果
const testResult = ref<{
  passed: boolean
  total: number
  compliant: number
  nonCompliant: number
  complianceRate: number
  nonCompliantItems: Array<{ appId: string; instanceId: string; reason: string; riskLevel: 'high' | 'medium' | 'low' }>
} | null>(null)

// 计算属性
const logicCompletion = computed(() => {
  if (logicBlocksCount.value === 0) return 0
  if (logicBlocksCount.value === 1) return 50
  return 100
})

// 方法
const handleFileChange = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const processFile = (file: File) => {
  // 校验文件大小
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB，请压缩后上传')
    return
  }

  csvFile.value = file

  // 模拟解析 CSV
  setTimeout(() => {
    csvFields.value = ['应用模块编号', '实例 ID', '服务器 IP', '端口号', 'SSL配置']
    ElMessage.success('文件上传成功')
  }, 500)
}

const removeField = (field: string) => {
  csvFields.value = csvFields.value.filter((f) => f !== field)
}

const addFieldToCanvas = (field: string) => {
  // 添加字段到画布
  ElMessage.info(`字段 "${field}" 已添加到画布`)
  logicBlocksCount.value++
}

const handleDragStart = (event: DragEvent, block: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('blockType', block.type)
  }
}

const getColorByCompletion = (completion: number) => {
  if (completion === 100) return '#00C771'
  if (completion >= 50) return '#FFB100'
  return '#F13039'
}

const handleNextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const handlePrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleTest = () => {
  testLoading.value = true

  // 模拟测试执行
  setTimeout(() => {
    testResult.value = {
      passed: true,
      total: 1234,
      compliant: 1200,
      nonCompliant: 34,
      complianceRate: (1200 / 1234) * 100,
      nonCompliantItems: [
        {
          appId: 'APP001',
          instanceId: '192.168.1.1',
          reason: '未配置 SSL',
          riskLevel: 'high',
        },
        {
          appId: 'APP002',
          instanceId: '192.168.1.2',
          reason: '端口超出范围',
          riskLevel: 'medium',
        },
      ],
    }
    testLoading.value = false
    ElMessage.success('测试执行完成')
  }, 2000)
}

const getRiskLevelType = (level: string) => {
  switch (level) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

const getRiskLevelLabel = (level: string) => {
  switch (level) {
    case 'high':
      return '🔴 高风险'
    case 'medium':
      return '🟡 中风险'
    case 'low':
      return '🟢 低风险'
    default:
      return level
  }
}

const handleSubmit = () => {
  submitLoading.value = true

  // 模拟保存
  setTimeout(() => {
    ruleId.value = 'R' + Math.random().toString(36).substring(2, 8).toUpperCase()
    ruleName.value = props.modelValue?.name || '新建规则'
    ruleVersion.value = 'V1.0'

    currentStep.value++
    ElMessage.success('规则保存成功')

    setTimeout(() => {
      emit('submit', {
        id: ruleId.value,
        name: ruleName.value,
        version: ruleVersion.value,
        ...props.modelValue,
      } as RuleConfig)
    }, 1500)
  }, 1000)
}

// 生命周期
onMounted(() => {
  if (props.modelValue) {
    ruleName.value = props.modelValue.name || ''
  }
})

defineExpose({
  currentStep,
})
</script>

<style lang="scss" scoped>
.rule-config-form {
  padding: 16px;

  .step-section {
    padding-top: 24px;
  }

  .upload-zone {
    border: 2px dashed #d2dde5;
    border-radius: 8px;
    padding: 64px 32px;
    text-align: center;
    background: #f8f9fc;
    transition: all 0.3s;

    &.upload-zone-hover {
      border-color: #3290ff;
      background: #f0f7ff;
    }

    .upload-icon {
      color: #91969d;
      margin-bottom: 16px;
    }

    .upload-text {
      margin-bottom: 8px;
      font-size: 16px;
      color: #2f2e4b;
    }

    .upload-hint {
      margin-bottom: 16px;
      font-size: 14px;
      color: #91969d;
    }

    .file-input {
      display: none;
    }
  }

  .fields-list {
    margin-top: 24px;
  }

  .fields-actions {
    margin-top: 16px;
    text-align: center;
  }

  .blockly-container {
    display: flex;
    gap: 16px;
    height: 500px;

    .field-list-panel {
      flex: 0 0 200px;
      background: #f8f9fc;
      border-radius: 8px;
      padding: 12px;

      .panel-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 500;
        color: #2f2e4b;
      }
    }

    .blockly-canvas {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .canvas-header {
        font-weight: 500;
        color: #2f2e4b;
      }

      .canvas-body {
        flex: 1;
        background: #ffffff;
        border: 1px solid #d2dde5;
        border-radius: 8px;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#e8e9eb 1px, transparent 1px);
          background-size: 8px 8px;
          opacity: 0.5;
        }
      }

      .toolbox {
        background: #f8f9fc;
        border-radius: 8px;
        padding: 12px;

        .toolbox-title {
          font-weight: 500;
          margin-bottom: 8px;
          color: #2f2e4b;
        }

        .toolbox-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .toolbox-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: #ffffff;
            border: 1px solid #d2dde5;
            border-radius: 4px;
            cursor: grab;
            font-size: 14px;
            color: #2f2e4b;
            transition: all 0.2s;

            &:hover {
              border-color: #3290ff;
              box-shadow: 0 2px 8px rgba(50, 144, 255, 0.2);
            }

            &:active {
              cursor: grabbing;
            }
          }
        }
      }
    }
  }

  .completion-indicator {
    margin-top: 16px;
    padding: 12px;
    background: #f8f9fc;
    border-radius: 8px;

    .completion-text {
      margin-top: 8px;
      font-size: 14px;
      color: #2f2e4b;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
  }

  .test-section {
    .test-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      color: #2f2e4b;
    }

    .test-content {
      margin-top: 16px;

      .test-result {
        margin-top: 16px;
      }

      .test-statistics {
        margin: 16px 0;
        padding: 16px;
        background: #f8f9fc;
        border-radius: 8px;
      }

      .non-compliant-details {
        margin-top: 16px;

        .details-title {
          font-weight: 500;
          margin-bottom: 12px;
          color: #2f2e4b;
        }
      }
    }
  }
}

:deep(.el-step) {
  &.is-active .el-step__title {
    color: #3290ff;
  }

  &.is-success .el-step__title {
    color: #00c771;
  }
}
</style>
