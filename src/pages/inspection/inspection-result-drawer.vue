<!-- 应用配置巡检系统 - 巡检详情抽屉（UX 优化版） -->
<template>
  <div v-loading="drawerLoading" class="drawer-content">
    <!-- 页面顶部导航 -->
    <div class="page-header">
      <el-button type="primary" link @click="handleClose">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h2>巡检详情页</h2>
      <el-button type="primary" plain @click="handleExportPDF">
        <el-icon><Download /></el-icon>
        导出 PDF
      </el-button>
    </div>

    <!-- 详情内容区 -->
    <div class="detail-content">
      <!-- 1️⃣ 核心信息区 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-title">核心信息</div>
        </template>
        
        <!-- 行1：基础信息 -->
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">巡检 ID</span>
            <span class="info-value">{{ currentInspection?.id || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">应用名称</span>
            <span class="info-value">{{ currentInspection?.appName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">技术栈</span>
            <span class="info-value">{{ getTechStackLabel(currentInspection?.techStack || '') }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">巡检时间</span>
            <span class="info-value">{{ currentInspection?.inspectedAt || '-' }}</span>
          </div>
        </div>
        
        <!-- 行2：统计信息 -->
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">合规数量</span>
            <span class="info-value status-compliant">{{ currentInspection?.compliant ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">不合规数量</span>
            <span class="info-value status-noncompliant">{{ currentInspection?.nonCompliant ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">整改时效</span>
            <span class="info-value" :class="{
              'status-urgent': currentInspection?.nonCompliant > 0,
              'status-none': currentInspection?.nonCompliant === 0
            }">
              {{ currentInspection?.nonCompliant > 0 ? currentInspection.deadlineRemaining : '--' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <el-tag v-if="currentInspection?.nonCompliant === 0" type="success" effect="plain">
              <el-icon><Check /></el-icon> 全部合规
            </el-tag>
            <el-tag v-else type="danger" effect="plain">
              <el-icon><Warning /></el-icon> 未通过
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 2️⃣ 不合规检查项（红色高亮，默认展开） -->
      <el-card v-if="currentInspection?.nonCompliant > 0" class="section-card" shadow="never">
        <template #header>
          <div class="card-title warning-title">
            <el-icon><Warning /></el-icon>
            不合规检查项（{{ currentInspection.nonCompliantItems?.length || 0 }} 项）
          </div>
        </template>
        <div class="non-compliant-list">
          <div 
            v-for="(item, index) in currentInspection.nonCompliantItems" 
            :key="index" 
            class="nc-item-card"
          >
            <div class="nc-item-header">
              <el-icon class="nc-icon danger-icon"><Warning /></el-icon>
              <span class="nc-rulename">{{ item.ruleName }}</span>
              <span class="nc-ruleversion">{{ item.ruleVersion || 'v1.0' }}</span>
              <el-tag type="danger" size="small" class="nc-status-tag">不合规</el-tag>
              <span class="nc-timeremaining">剩余 3 天</span>
            </div>
            <div class="nc-reason">
              <span class="nc-reason-label">不合规原因：</span>
              <span class="nc-reason-text">{{ item.reason }}</span>
            </div>
            <div class="nc-datasource">
              <span class="nc-datasource-label">数据源文件：</span>
              <code class="nc-datasource-path">{{ item.dataSource || 'jdbc-config.yaml' }}</code>
              <span class="nc-datasource-info">当期值：{{ item.currentValue || 5 }} | 要求值：{{ item.requireValue || '≥20' }}</span>
            </div>
            <div class="nc-actions">
              <el-button size="small" type="primary" link @click="handleViewRule(item)">
                查看规则
              </el-button>
              <el-button size="small" type="primary" link @click="handleCreateOrder(item)">
                创建整改
              </el-button>
              <el-button size="small" type="primary" link @click="handleIgnore(item)">
                忽略
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 3️⃣ 合规检查项（灰色弱化，默认折叠） -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div 
            class="card-title compliant-title" 
            @click="toggleCompliantItems"
          >
            <el-icon class="compliant-icon"><Check /></el-icon>
            <span>合规检查项</span>
            <span class="compliant-count">({{ currentInspection?.checks?.length || 0 }} 项)</span>
            <el-icon class="toggle-icon" :class="{ 'expanded': compliantExpanded }">
              <ArrowDown />
            </el-icon>
          </div>
        </template>
        <div v-show="compliantExpanded" class="compliant-list">
          <div 
            v-for="(item, index) in currentInspection?.checks || []" 
            :key="index" 
            class="compliant-item"
          >
            <div class="compliant-header">
              <span class="compliant-rulename">{{ item.ruleName }}</span>
              <span class="compliant-ruleversion">{{ item.ruleVersion || 'v1.0' }}</span>
              <el-tag type="info" size="small" class="compliant-status-tag" effect="plain">
                <el-icon><Check /></el-icon> 合规
              </el-tag>
            </div>
            <div class="compliant-datasource">
              <span class="compliant-datasource-label">数据源文件：</span>
              <code class="compliant-datasource-path">{{ item.dataSource || 'port-config.yaml' }}</code>
              <span class="compliant-datasource-info">当前值：{{ item.currentValue || '8080' }} | 要求值：{{ item.requireValue || '8080' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 4️⃣ 历史对比区 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-title">
            <el-icon><TrendCharts /></el-icon>
            <span>历史对比</span>
            <span class="history-label">（近 3 次同规则同应用）</span>
          </div>
        </template>
        <div class="history-table">
          <table>
            <thead>
              <tr>
                <th>规则名称</th>
                <th v-for="(date, index) in historyDates" :key="index">{{ date }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in historyData" :key="row.ruleName">
                <td>{{ row.ruleName }}</td>
                <td v-for="(cell, cellIndex) in row.results" :key="cellIndex" :class="['history-cell', cell.status, cell.diff ? 'history-diff' : '']">
                  <span v-if="cell.showDiff" class="diff-arrow">{{ cell.showDiff }}</span>
                  {{ cell.icon }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="history-tip">
            <el-icon class="tip-icon"><Info-filled /></el-icon>
            <span>黄色背景标记表示与上次巡检结果有差异</span>
          </div>
        </div>
      </el-card>

      <!-- 5️⃣ 关联操作区 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-title">
            <el-icon><Link /></el-icon>
            <span>关联操作</span>
          </div>
        </template>
        <div class="related-actions">
          <el-button @click="handleViewOrders">
            <el-icon><Document /></el-icon>
            查看整改工单
          </el-button>
          <el-button @click="handleViewRules">
            <el-icon><Setting /></el-icon>
            规则配置
          </el-button>
          <el-button @click="handleDownloadSource">
            <el-icon><Folder /></el-icon>
            下载数据源
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Download,
  Check,
  Warning,
  TrendCharts,
  ArrowLeft,
  ArrowDown,
  Link,
  InfoFilled,
  Document,
  Setting,
  Folder
} from '@element-plus/icons-vue'

// 类型定义
interface InspectionDetail {
  id: string
  appName: string
  techStack: string
  inspectedAt: string
  compliant: number
  nonCompliant: number
  complianceRate: number
  dataSource: string
  ruleVersion: string
  checks?: Array<{
    ruleName: string
    ruleVersion: string
    status: string
    dataSource?: string
    currentValue?: string
    requireValue?: string
  }>
  nonCompliantItems?: Array<{
    ruleName: string
    ruleVersion: string
    status: string
    reason: string
    dataSource: string
    currentValue: number | string
    requireValue: string
    riskLevel: 'high' | 'medium' | 'low'
    deadlineRemaining?: string
  }>
  deadlineRemaining?: string
}

// Props
const props = defineProps<{
  modelValue: boolean
  currentInspection: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// 状态
const drawerLoading = ref(false)
const compliantExpanded = ref(false)

// 方法
const handleClose = () => {
  emit('update:modelValue', false)
}

const handleViewRule = (item: any) => {
  ElMessage.success(`查看规则: ${item.ruleName}`)
}

const handleCreateOrder = (item: any) => {
  ElMessage.success(`创建整改工单: ${item.ruleName}`)
}

const handleIgnore = (item: any) => {
  ElMessage.success(`忽略规则: ${item.ruleName}（需填写忽略原因）`)
}

const handleViewOrders = () => {
  ElMessage.success('跳转整改工单列表页（筛选当前巡检 ID）')
}

const handleViewRules = () => {
  ElMessage.success('跳转规则配置列表页（新标签）')
}

const handleDownloadSource = () => {
  ElMessage.success('下载数据源文件（JSON/YAML）')
}

const handleExportPDF = () => {
  ElMessage.success('正在生成 PDF 文件...')
}

// 历史对比数据
const historyDates = ref(['2026-04-20', '2026-04-22', '2026-04-24'])

const historyData = ref([
  { ruleName: '数据库连接池检查', results: [{icon: '✅'}, {icon: '🔴', diff: true}, {icon: '🔴', diff: true}] },
  { ruleName: '端口配置检查', results: [{icon: '✅'}, {icon: '✅'}, {icon: '✅'}] },
  { ruleName: '日志级别检查', results: [{icon: '✅', showDiff: '←'}, {icon: '✅'}, {icon: '✅'}] },
])

const toggleCompliantItems = () => {
  compliantExpanded.value = !compliantExpanded.value
}

const getTechStackLabel = (techStack: string) => {
  const map: Record<string, string> = {
    java: 'Java/Spring',
    python: 'Python',
    go: 'Go',
    nodejs: 'Node.js',
  }
  return map[techStack] || techStack
}
</script>

<style lang="scss" scoped>
.drawer-content {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 500;
    color: #25303c;
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    font-size: 16px;
    color: #2f2e4b;
    padding: 12px 16px;

    .warning-title {
      color: #f13039;
    }

    .compliant-title {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #91969d;

      .compliant-icon {
        color: #00c771;
      }

      .compliant-count {
        color: #91969d;
        font-weight: normal;
      }

      .toggle-icon {
        margin-left: auto;
        color: #91969d;
        &.expanded {
          transform: rotate(180deg);
        }
      }
    }
  }

  .info-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    padding: 16px;
    border-bottom: 1px solid #e8e9eb;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .info-label {
        font-size: 13px;
        color: #91969d;
      }

      .info-value {
        font-size: 14px;
        font-weight: 500;
        color: #2f2e4b;

        &.status-compliant {
          color: #00c771;
        }

        &.status-noncompliant {
          color: #f13039;
        }

        &.status-urgent {
          color: #f13039;
        }

        &.status-none {
          color: #91969d;
        }
      }
    }
  }

  .non-compliant-list {
    .nc-item-card {
      border: 1px solid #e8e9eb;
      border-left: 4px solid #f13039;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fff;

      .nc-item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .nc-icon {
          color: #f13039;
        }

        .nc-rulename {
          font-size: 14px;
          font-weight: 500;
          color: #2f2e4b;
        }

        .nc-ruleversion {
          font-size: 12px;
          color: #91969d;
        }

        .nc-status-tag {
          font-size: 12px;
        }

        .nc-timeremaining {
          font-size: 12px;
          color: #f13039;
          margin-left: auto;
        }
      }

      .nc-reason {
        margin-bottom: 12px;
        padding: 12px;
        background: #fff1f0;
        border-radius: 4px;

        .nc-reason-label {
          font-weight: 500;
          color: #f13039;
        }

        .nc-reason-text {
          color: #f13039;
          margin-left: 4px;
        }
      }

      .nc-datasource {
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f8f9fc;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #3b5369;

        .nc-datasource-label {
          font-weight: 500;
        }
      }

      .nc-actions {
        display: flex;
        gap: 16px;
      }
    }
  }

  .compliant-list {
    .compliant-item {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #e8e9eb;
      border-left: 4px solid #e8e9eb;
      border-radius: 4px;
      background: #fff;

      .compliant-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .compliant-rulename {
          font-size: 14px;
          color: #91969d;
        }

        .compliant-ruleversion {
          font-size: 12px;
          color: #91969d;
        }

        .compliant-status-tag {
          font-size: 12px;
          background: #f5f5f5;
        }
      }

      .compliant-datasource {
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #91969d;

        .compliant-datasource-label {
          font-weight: 500;
        }

        .compliant-datasource-info {
          margin-left: 12px;
        }
      }
    }
  }

  .history-table {
    padding: 16px;

    table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 12px;
        text-align: center;
        border-bottom: 1px solid #e8e9eb;
      }

      th {
        font-weight: 500;
        font-size: 14px;
        color: #25303c;
        background: #f3f5fa;
      }

      .history-cell {
        &.history-compliant {
          color: #00c771;
        }

        &.history-noncompliant {
          color: #f13039;
        }

        &.history-diff {
          background: #fffbe6;
        }
      }
    }

    .history-tip {
      margin-top: 12px;
      padding: 8px 12px;
      background: #fffbe6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #ffb100;

      .tip-icon {
        color: #ffb100;
      }
    }
  }

  .related-actions {
    display: flex;
    gap: 16px;
    padding: 16px;

    .el-button {
      min-width: 120px;
    }
  }
}
</style>
