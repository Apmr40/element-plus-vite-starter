<template>
  <div class="diagnostic-result">
    <!-- 分析中状态（带进度） -->
    <div v-if="status === 'analyzing'" class="diagnostic-analyzing">
      <div class="analyzing-header">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在分析...</span>
      </div>
      <el-progress 
        :percentage="progress || 0" 
        :stroke-width="8"
        :show-text="true"
        class="analyzing-progress"
      />
      <div class="analyzing-step">{{ currentStep || '准备中...' }}</div>
    </div>

    <!-- 诊断结果 -->
    <div v-else-if="status === 'completed' && result" class="diagnostic-content">
      <!-- 根因分析 -->
      <div class="result-section">
        <div class="section-header">
          <el-icon><Document /></el-icon>
          <span>根因分析</span>
          <el-tag :type="getConfidenceTagType(result.rootCause.confidence)" size="small">
            置信度 {{ Math.round(result.rootCause.confidence * 100) }}%
          </el-tag>
        </div>
        <div class="root-cause">
          <el-tag :type="getCategoryTagType(result.rootCause.category)" size="small" effect="plain">
            {{ getCategoryLabel(result.rootCause.category) }}
          </el-tag>
          <p class="root-cause-summary">{{ result.rootCause.summary }}</p>
          <div v-if="showDetail" class="root-cause-detail">
            <p>{{ result.rootCause.detail }}</p>
          </div>
          <el-button link type="primary" size="small" @click="showDetail = !showDetail">
            {{ showDetail ? '收起详情' : '展开详情' }}
            <el-icon><ArrowDown v-if="!showDetail" /><ArrowUp v-else /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 修复建议 -->
      <div v-if="result.suggestions && result.suggestions.length > 0" class="result-section">
        <div class="section-header">
          <el-icon><SetUp /></el-icon>
          <span>修复建议</span>
        </div>
        <div class="suggestions">
          <div v-for="(suggestion, index) in result.suggestions" :key="index" class="suggestion-item">
            <el-tag :type="getPriorityTagType(suggestion.priority)" size="small" effect="dark">
              {{ getPriorityLabel(suggestion.priority) }}
            </el-tag>
            <p class="suggestion-action">{{ suggestion.action }}</p>
            <div v-if="suggestion.command" class="command-block">
              <code>{{ suggestion.command }}</code>
              <el-button link size="small" @click="copyCommand(suggestion.command!)">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
            <div class="suggestion-meta">
              <span>风险: {{ getRiskLabel(suggestion.risk) }}</span>
              <span v-if="suggestion.estimatedTime">预估耗时: {{ suggestion.estimatedTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 相似案例 -->
      <div v-if="result.similarCases && result.similarCases.length > 0" class="result-section">
        <div class="section-header">
          <el-icon><Connection /></el-icon>
          <span>相似案例</span>
        </div>
        <div class="similar-cases">
          <div v-for="(caseItem, index) in result.similarCases" :key="index" class="case-item">
            <el-icon><Paperclip /></el-icon>
            <span class="case-title">{{ caseItem.title }}</span>
            <el-tag size="small" type="info">
              相似度 {{ Math.round(caseItem.relevance * 100) }}%
            </el-tag>
            <div v-if="expandedCases.includes(index)" class="case-detail">
              <p><strong>解决方案:</strong> {{ caseItem.solution }}</p>
              <p><strong>解决时间:</strong> {{ caseItem.resolvedAt }}</p>
            </div>
            <el-button link type="primary" size="small" @click="toggleCaseExpand(index)">
              {{ expandedCases.includes(index) ? '收起' : '查看详情' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 推荐操作 -->
      <div v-if="result.relatedOperations && result.relatedOperations.length > 0" class="result-section">
        <div class="section-header">
          <el-icon><Tools /></el-icon>
          <span>推荐操作</span>
        </div>
        <div class="related-operations">
          <div v-for="(operation, index) in result.relatedOperations" :key="index" class="operation-item">
            <div class="operation-info">
              <strong>{{ operation.operationName }}</strong>
              <p>{{ operation.reason }}</p>
            </div>
            <el-button type="primary" size="small" @click="$emit('goToOperation', operation.operationId)">
              去执行
              <el-icon><Right /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 反馈区域 -->
      <div class="feedback-section">
        <el-button 
          :type="feedback === 'helpful' ? 'success' : 'default'" 
          size="small"
          @click="submitFeedback('helpful')"
        >
          <el-icon><SuccessFilled /></el-icon>
          有帮助
        </el-button>
        <el-button 
          :type="feedback === 'not_helpful' ? 'danger' : 'default'" 
          size="small"
          @click="submitFeedback('not_helpful')"
        >
          <el-icon><CircleCloseFilled /></el-icon>
          没帮助
        </el-button>
        <el-button size="small" @click="copyResult">
          <el-icon><CopyDocument /></el-icon>
          复制结果
        </el-button>
      </div>
    </div>

    <!-- 诊断失败 -->
    <div v-else-if="status === 'failed'" class="diagnostic-error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage || '诊断失败，请稍后重试' }}</span>
      <el-button link type="primary" size="small" @click="$emit('retry')">重试</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Loading,
  Document,
  SetUp,
  Connection,
  Tools,
  Paperclip,
  CopyDocument,
  Right,
  ArrowDown,
  ArrowUp,
  SuccessFilled,
  CircleCloseFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import type { DiagnosticResult as DiagnosticResultType, DiagnosticStatus } from '~/demo/types/diagnostic'

const props = defineProps<{
  status: DiagnosticStatus
  result: DiagnosticResultType | null
  errorMessage?: string
  progress?: number
  currentStep?: string
}>()

const emit = defineEmits<{
  (e: 'goToOperation', operationId: string): void
  (e: 'feedback', type: 'helpful' | 'not_helpful'): void
  (e: 'retry'): void
}>()

const showDetail = ref(false)
const expandedCases = ref<number[]>([])
const feedback = ref<'helpful' | 'not_helpful' | null>(null)

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

function copyCommand(command: string) {
  navigator.clipboard.writeText(command).then(() => {
    ElMessage.success('命令已复制到剪贴板')
  })
}

function copyResult() {
  if (!props.result) return
  
  const text = formatResultAsMarkdown(props.result)
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('诊断结果已复制到剪贴板')
  })
}

function formatResultAsMarkdown(result: DiagnosticResultType): string {
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

function toggleCaseExpand(index: number) {
  const idx = expandedCases.value.indexOf(index)
  if (idx > -1) {
    expandedCases.value.splice(idx, 1)
  } else {
    expandedCases.value.push(index)
  }
}

function submitFeedback(type: 'helpful' | 'not_helpful') {
  feedback.value = type
  emit('feedback', type)
  ElMessage.success(type === 'helpful' ? '感谢您的反馈！' : '感谢您的反馈，我们会持续优化！')
}
</script>

<style lang="scss" scoped>
.diagnostic-result {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #3290ff;
}

.diagnostic-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  
  .is-loading {
    animation: rotating 2s linear infinite;
  }
}

.diagnostic-analyzing {
  padding: 16px;
  
  .analyzing-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #3290ff;
    font-weight: 500;
    
    .is-loading {
      animation: rotating 2s linear infinite;
    }
  }
  
  .analyzing-progress {
    margin-bottom: 8px;
  }
  
  .analyzing-step {
    font-size: 13px;
    color: #909399;
  }
}

.diagnostic-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: #25303c;
    
    .el-icon {
      color: #3290ff;
    }
  }
}

.root-cause {
  .root-cause-summary {
    margin: 8px 0;
    color: #606266;
    line-height: 1.6;
  }
  
  .root-cause-detail {
    margin: 12px 0;
    padding: 12px;
    background: white;
    border-radius: 4px;
    color: #606266;
    line-height: 1.6;
  }
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  padding: 12px;
  background: white;
  border-radius: 4px;
  
  .suggestion-action {
    margin: 8px 0;
    color: #25303c;
    font-weight: 500;
  }
  
  .command-block {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
    padding: 8px 12px;
    background: #f3f6f9;
    border-radius: 4px;
    
    code {
      flex: 1;
      font-family: 'Courier New', monospace;
      color: #25303c;
    }
  }
  
  .suggestion-meta {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}

.similar-cases {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  
  .el-icon {
    color: #3290ff;
    margin-top: 2px;
  }
  
  .case-title {
    flex: 1;
    color: #25303c;
  }
  
  .case-detail {
    width: 100%;
    margin-top: 8px;
    padding: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    
    p {
      margin: 4px 0;
    }
  }
}

.related-operations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 4px;
  
  .operation-info {
    flex: 1;
    
    strong {
      color: #25303c;
    }
    
    p {
      margin-top: 4px;
      font-size: 13px;
      color: #909399;
    }
  }
}

.feedback-section {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.diagnostic-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  
  .el-icon {
    font-size: 16px;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
