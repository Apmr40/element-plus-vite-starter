<template>
  <el-drawer
    v-model="visible"
    title="AI 诊断"
    size="560px"
    direction="rtl"
    :close-on-click-modal="false"
    class="diagnostic-panel"
  >
    <template #header>
      <div class="panel-header">
        <div class="header-left">
          <el-icon class="header-icon"><MagicStick /></el-icon>
          <span class="header-title">AI 智能诊断</span>
        </div>
        <el-button text circle @click="handleClose">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </template>

    <div class="panel-content">
      <!-- 分析中状态 -->
      <div v-if="status === 'analyzing'" class="analyzing-state">
        <div class="progress-card">
          <div class="progress-header">
            <span class="progress-title">分析中...</span>
            <span class="progress-percent">{{ progress }}%</span>
          </div>
          <el-progress
            :percentage="progress"
            :stroke-width="8"
            :show-text="false"
            class="progress-bar"
          />
          <div class="progress-step-text">{{ currentStep }}</div>
        </div>

        <div class="steps-card">
          <div class="steps-title">诊断步骤</div>
          <div class="steps-list">
            <div
              v-for="(step, index) in diagnosticSteps"
              :key="index"
              class="step-item"
              :class="{
                'is-finish': step.status === 'finish',
                'is-process': step.status === 'process',
                'is-wait': step.status === 'wait'
              }"
            >
              <el-icon v-if="step.status === 'finish'" class="step-icon"><Check /></el-icon>
              <el-icon v-else-if="step.status === 'process'" class="step-icon"><Loading /></el-icon>
              <el-icon v-else class="step-icon"><MoreFilled /></el-icon>
              <span class="step-text">{{ step.label }}</span>
            </div>
          </div>
        </div>

        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="tip-alert"
        >
          <template #title>
            诊断过程通常需要 10-30 秒，您可以继续操作其他页面
          </template>
        </el-alert>
      </div>

      <!-- 诊断完成状态 -->
      <div v-else-if="status === 'completed' && result" class="completed-state">
        <!-- 根因分析卡片 -->
        <div class="result-card root-cause-card">
          <div class="card-header">
            <div class="card-title-row">
              <el-icon class="card-icon"><Document /></el-icon>
              <el-tag :type="getCategoryTagType(result.rootCause.category)" effect="plain">
                {{ getCategoryLabel(result.rootCause.category) }}
              </el-tag>
              <el-tag
                :type="getConfidenceTagType(result.rootCause.confidence)"
                effect="dark"
                class="confidence-tag"
              >
                置信度 {{ Math.round(result.rootCause.confidence * 100) }}%
              </el-tag>
            </div>
          </div>
          <div class="card-body">
            <div class="root-cause-summary">{{ result.rootCause.summary }}</div>
            <div v-if="showRootCauseDetail" class="root-cause-detail">
              <div class="detail-content">{{ result.rootCause.detail }}</div>
            </div>
            <el-button
              text
              type="primary"
              @click="showRootCauseDetail = !showRootCauseDetail"
              class="expand-btn"
            >
              {{ showRootCauseDetail ? '收起详情' : '展开详情' }}
              <el-icon>
                <ArrowUp v-if="showRootCauseDetail" />
                <ArrowDown v-else />
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- 修复建议卡片 -->
        <div class="result-card suggestions-card">
          <div class="card-header">
            <div class="card-title-row">
              <el-icon class="card-icon"><SetUp /></el-icon>
              <span class="card-title">修复建议</span>
            </div>
          </div>
          <div class="card-body">
            <div
              v-for="(suggestion, index) in result.suggestions"
              :key="index"
              class="suggestion-item"
            >
              <div class="suggestion-header">
                <el-tag
                  :type="getPriorityTagType(suggestion.priority)"
                  size="small"
                  effect="dark"
                >
                  {{ getPriorityLabel(suggestion.priority) }}
                </el-tag>
                <span class="suggestion-action">{{ suggestion.action }}</span>
              </div>
              <div v-if="suggestion.command" class="command-block">
                <code class="command-text">{{ suggestion.command }}</code>
                <el-button
                  text
                  size="small"
                  @click="copyCommand(suggestion.command)"
                  class="copy-btn"
                >
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
              </div>
              <div class="suggestion-meta">
                <el-tag size="small" type="info">
                  风险: {{ getRiskLabel(suggestion.risk) }}
                </el-tag>
                <el-tag v-if="suggestion.estimatedTime" size="small" type="info">
                  预估耗时: {{ suggestion.estimatedTime }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 相似案例卡片 -->
        <div v-if="result.similarCases && result.similarCases.length > 0" class="result-card cases-card">
          <div class="card-header">
            <div class="card-title-row">
              <el-icon class="card-icon"><Connection /></el-icon>
              <span class="card-title">相似案例</span>
            </div>
          </div>
          <div class="card-body">
            <div
              v-for="(caseItem, index) in result.similarCases"
              :key="index"
              class="case-item"
            >
              <div class="case-header">
                <el-icon class="case-icon"><Paperclip /></el-icon>
                <span class="case-title">{{ caseItem.title }}</span>
                <el-tag
                  :type="getRelevanceTagType(caseItem.relevance)"
                  size="small"
                >
                  相似度 {{ Math.round(caseItem.relevance * 100) }}%
                </el-tag>
              </div>
              <div v-if="expandedCases.includes(index)" class="case-detail">
                <div class="case-solution">
                  <span class="label">解决方案：</span>
                  {{ caseItem.solution }}
                </div>
                <div class="case-time">
                  <span class="label">解决时间：</span>
                  {{ caseItem.resolvedAt }}
                </div>
              </div>
              <el-button
                text
                type="primary"
                size="small"
                @click="toggleCaseExpand(index)"
              >
                {{ expandedCases.includes(index) ? '收起' : '查看详情' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 推荐操作卡片 -->
        <div v-if="result.relatedOperations && result.relatedOperations.length > 0" class="result-card operations-card">
          <div class="card-header">
            <div class="card-title-row">
              <el-icon class="card-icon"><Tools /></el-icon>
              <span class="card-title">推荐操作</span>
            </div>
          </div>
          <div class="card-body">
            <div
              v-for="(operation, index) in result.relatedOperations"
              :key="index"
              class="operation-item"
            >
              <div class="operation-info">
                <div class="operation-name">{{ operation.operationName }}</div>
                <div class="operation-reason">{{ operation.reason }}</div>
              </div>
              <el-button type="primary" size="small" @click="handleGoToOperation(operation)">
                去执行
                <el-icon><Right /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 反馈区域 -->
        <div class="feedback-section">
          <div class="feedback-buttons">
            <el-button
              :type="feedback === 'helpful' ? 'success' : 'default'"
              :plain="feedback !== 'helpful'"
              @click="handleFeedback('helpful')"
            >
              <el-icon><SuccessFilled /></el-icon>
              有帮助
            </el-button>
            <el-button
              :type="feedback === 'not_helpful' ? 'danger' : 'default'"
              :plain="feedback !== 'not_helpful'"
              @click="handleFeedback('not_helpful')"
            >
              <el-icon><CircleCloseFilled /></el-icon>
              没帮助
            </el-button>
            <el-button @click="copyResult">
              <el-icon><CopyDocument /></el-icon>
              复制结果
            </el-button>
          </div>
        </div>
      </div>

      <!-- 诊断失败状态 -->
      <div v-else-if="status === 'failed'" class="failed-state">
        <el-result icon="warning" title="诊断失败" :sub-title="errorMessage">
          <template #extra>
            <el-button type="primary" @click="handleRetry">重试</el-button>
            <el-button @click="handleContactAdmin">联系管理员</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  Close,
  Check,
  Loading,
  MoreFilled,
  Document,
  SetUp,
  Connection,
  Tools,
  Paperclip,
  CopyDocument,
  Right,
  ArrowUp,
  ArrowDown,
  SuccessFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import type { DiagnosticResult, DiagnosticStatus } from '~/demo/types/diagnostic'
import { analyzeDiagnostic, buildDiagnosticContext } from '~/demo/api/diagnostic'

// Props
const props = defineProps<{
  modelValue: boolean
  recordId: string
  operationName: string
  operationCategory: string
  failedResources: Array<{
    pk: string
    pkDisplay: string
    errorMsg: string
  }>
  similarCases?: Array<{
    id: string
    operationName: string
    errorMsg: string
    rootCause?: string
    solution?: string
    executeTime: string
    similarity: number
  }>
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'goToOperation': [operationId: string]
}>()

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const status = ref<DiagnosticStatus>('idle')
const progress = ref(0)
const currentStep = ref('')
const result = ref<DiagnosticResult | null>(null)
const errorMessage = ref('')
const feedback = ref<'helpful' | 'not_helpful' | null>(null)
const showRootCauseDetail = ref(false)
const expandedCases = ref<number[]>([])

// 诊断步骤
const diagnosticSteps = computed(() => {
  const steps = [
    { label: '收集上下文信息', status: 'wait' },
    { label: '检索相似案例', status: 'wait' },
    { label: '分析错误日志', status: 'wait' },
    { label: '生成修复建议', status: 'wait' }
  ]

  if (progress.value >= 20) steps[0].status = 'finish'
  if (progress.value >= 40) steps[1].status = 'finish'
  if (progress.value >= 60) steps[2].status = 'finish'
  if (progress.value >= 80) steps[3].status = 'finish'

  if (progress.value < 20) steps[0].status = 'process'
  else if (progress.value < 40) steps[1].status = 'process'
  else if (progress.value < 60) steps[2].status = 'process'
  else if (progress.value < 80) steps[3].status = 'process'

  return steps
})

// 监听面板打开
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    startDiagnosis()
  } else {
    resetState()
  }
})

// 开始诊断
async function startDiagnosis() {
  status.value = 'analyzing'
  progress.value = 0
  currentStep.value = '准备开始...'
  result.value = null
  errorMessage.value = ''
  feedback.value = null
  showRootCauseDetail.value = false
  expandedCases.value = []

  try {
    const context = buildDiagnosticContext(
      props.recordId,
      props.operationName,
      props.operationCategory,
      props.failedResources
    )

    const diagnosticResult = await analyzeDiagnostic(context, (progressData) => {
      progress.value = progressData.progress
      currentStep.value = progressData.currentStep
    })

    result.value = diagnosticResult
    
    // 合并外部传入的相似案例（如果有）
    if (props.similarCases && props.similarCases.length > 0) {
      result.value.similarCases = props.similarCases.map(c => ({
        caseId: c.id,
        title: c.operationName,
        solution: c.solution || c.errorMsg,
        resolvedAt: c.executeTime,
        relevance: c.similarity
      }))
    }
    
    status.value = 'completed'
  } catch (error) {
    status.value = 'failed'
    errorMessage.value = error instanceof Error ? error.message : '诊断过程出现未知错误'
  }
}

// 重置状态
function resetState() {
  status.value = 'idle'
  progress.value = 0
  currentStep.value = ''
  result.value = null
  errorMessage.value = ''
  feedback.value = null
  showRootCauseDetail.value = false
  expandedCases.value = []
}

// 关闭面板
function handleClose() {
  visible.value = false
}

// 重试
function handleRetry() {
  startDiagnosis()
}

// 联系管理员
function handleContactAdmin() {
  ElMessage.info('请联系系统管理员：admin@example.com')
}

// 复制命令
function copyCommand(command: string) {
  navigator.clipboard.writeText(command).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 复制结果
function copyResult() {
  if (!result.value) return

  const text = formatResultAsMarkdown(result.value)
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('诊断结果已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 格式化结果为 Markdown
function formatResultAsMarkdown(result: DiagnosticResult): string {
  let md = `# AI 诊断结果\n\n`
  md += `## 根因分析\n`
  md += `**分类**: ${getCategoryLabel(result.rootCause.category)}\n`
  md += `**置信度**: ${Math.round(result.rootCause.confidence * 100)}%\n\n`
  md += `${result.rootCause.summary}\n\n`
  md += `${result.rootCause.detail}\n\n`

  md += `## 修复建议\n`
  result.suggestions.forEach((s, i) => {
    md += `${i + 1}. **${getPriorityLabel(s.priority)}**: ${s.action}\n`
    if (s.command) md += `   \`\`\`\n   ${s.command}\n   \`\`\`\n`
    md += `   风险: ${getRiskLabel(s.risk)} | 预估耗时: ${s.estimatedTime || '未知'}\n\n`
  })

  if (result.similarCases && result.similarCases.length > 0) {
    md += `## 相似案例\n`
    result.similarCases.forEach((c, i) => {
      md += `${i + 1}. **${c.title}** (相似度 ${Math.round(c.relevance * 100)}%)\n`
      md += `   解决方案: ${c.solution}\n`
      md += `   解决时间: ${c.resolvedAt}\n\n`
    })
  }

  return md
}

// 提交反馈
function handleFeedback(type: 'helpful' | 'not_helpful') {
  feedback.value = type
  if (type === 'helpful') {
    ElMessage.success('感谢您的反馈！')
  } else {
    ElMessage.info('感谢您的反馈，我们会持续优化！')
  }
}

// 跳转到操作
function handleGoToOperation(operation: { operationId: string }) {
  emit('goToOperation', operation.operationId)
  visible.value = false
}

// 展开/收起案例
function toggleCaseExpand(index: number) {
  const idx = expandedCases.value.indexOf(index)
  if (idx > -1) {
    expandedCases.value.splice(idx, 1)
  } else {
    expandedCases.value.push(index)
  }
}

// 辅助函数
function getCategoryTagType(category: string) {
  const map: Record<string, string> = {
    permission: 'warning',
    resource: 'danger',
    network: 'info',
    config: 'warning',
    dependency: 'danger',
    script_error: 'danger',
    timeout: 'info',
    environment: 'warning',
    unknown: 'info'
  }
  return map[category] || 'info'
}

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    permission: '权限问题',
    resource: '资源不足',
    network: '网络问题',
    config: '配置错误',
    dependency: '依赖异常',
    script_error: '脚本错误',
    timeout: '超时',
    environment: '环境问题',
    unknown: '未知问题'
  }
  return map[category] || '未知'
}

function getConfidenceTagType(confidence: number) {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'danger'
}

function getPriorityTagType(priority: string) {
  const map: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[priority] || 'info'
}

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return map[priority] || priority
}

function getRiskLabel(risk: string) {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[risk] || risk
}

function getRelevanceTagType(relevance: number) {
  if (relevance >= 0.9) return 'success'
  if (relevance >= 0.7) return 'warning'
  return 'info'
}
</script>

<style lang="scss" scoped>
.diagnostic-panel {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding: 0;
    border-bottom: 1px solid #e4e7ed;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .header-icon {
    font-size: 20px;
    color: #3290ff;
  }
  
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #25303c;
  }
}

.panel-content {
  padding: 20px;
  height: calc(100vh - 120px);
  overflow-y: auto;
}

// 分析中状态
.analyzing-state {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .progress-title {
    font-size: 14px;
    font-weight: 500;
    color: #25303c;
  }
  
  .progress-percent {
    font-size: 14px;
    font-weight: 600;
    color: #3290ff;
  }
  
  .progress-bar {
    margin-bottom: 12px;
  }
  
  .progress-step-text {
    font-size: 13px;
    color: #606266;
  }
}

.steps-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  
  .steps-title {
    font-size: 14px;
    font-weight: 500;
    color: #25303c;
    margin-bottom: 12px;
  }
  
  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    
    &.is-finish {
      .step-icon {
        color: #00c771;
      }
      .step-text {
        color: #25303c;
      }
    }
    
    &.is-process {
      .step-icon {
        color: #3290ff;
        animation: rotate 1s linear infinite;
      }
      .step-text {
        color: #3290ff;
        font-weight: 500;
      }
    }
    
    &.is-wait {
      .step-icon {
        color: #c0c4cc;
      }
      .step-text {
        color: #909399;
      }
    }
  }
}

.tip-alert {
  :deep(.el-alert__title) {
    font-size: 13px;
  }
}

// 诊断完成状态
.completed-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  
  .card-header {
    background: #f5f7fa;
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .card-icon {
    font-size: 16px;
    color: #3290ff;
  }
  
  .card-title {
    font-size: 14px;
    font-weight: 500;
    color: #25303c;
  }
  
  .card-body {
    padding: 16px;
  }
}

// 根因分析
.root-cause-card {
  .confidence-tag {
    margin-left: auto;
  }
  
  .root-cause-summary {
    font-size: 14px;
    color: #25303c;
    line-height: 1.6;
    margin-bottom: 12px;
  }
  
  .root-cause-detail {
    background: #f5f7fa;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 12px;
    
    .detail-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  }
  
  .expand-btn {
    padding: 0;
    font-size: 13px;
  }
}

// 修复建议
.suggestions-card {
  .suggestion-item {
    &:not(:last-child) {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
  }
  
  .suggestion-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .suggestion-action {
      font-size: 14px;
      color: #25303c;
      font-weight: 500;
    }
  }
  
  .command-block {
    display: flex;
    align-items: center;
    background: #f3f6f9;
    border-radius: 4px;
    padding: 8px 12px;
    margin-bottom: 8px;
    
    .command-text {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #25303c;
    }
    
    .copy-btn {
      padding: 4px 8px;
      font-size: 12px;
    }
  }
  
  .suggestion-meta {
    display: flex;
    gap: 8px;
  }
}

// 相似案例
.cases-card {
  .case-item {
    &:not(:last-child) {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  }
  
  .case-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .case-icon {
      color: #3290ff;
    }
    
    .case-title {
      flex: 1;
      font-size: 14px;
      color: #25303c;
    }
  }
  
  .case-detail {
    background: #f8f9fc;
    border-left: 3px solid #3290ff;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 8px;
    
    .case-solution,
    .case-time {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
      
      .label {
        color: #909399;
      }
    }
  }
}

// 推荐操作
.operations-card {
  .operation-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    &:not(:last-child) {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  }
  
  .operation-info {
    flex: 1;
    
    .operation-name {
      font-size: 14px;
      color: #25303c;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .operation-reason {
      font-size: 13px;
      color: #909399;
    }
  }
}

// 反馈区域
.feedback-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  
  .feedback-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

// 失败状态
.failed-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
