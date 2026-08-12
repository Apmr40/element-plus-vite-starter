<script setup lang="ts">
/**
 * 资源详情弹窗（《执行记录信息扩展-交互设计》§6）
 *
 * 分区：基本信息 / 执行参数 / 资源信息 / 报错信息 / 返回信息。
 * 返回信息智能识别（§7）：JSON / JSON Array / YAML / TEXT，
 * JSON Array 走表格形式（列自动推断 + 嵌套对象展开行）。
 *
 * 状态由 useExecution 收敛（resourceDetailVisible / resourceDetail），
 * 本组件纯渲染，通过 context 读取状态并 emit 关闭。
 */
import type { ExecutionDetail } from '~/demo/types/workbench'
import type { InferredColumn, ReturnDataType } from '~/pages/workbench/composables/utils'
import { CopyDocument } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import {
  detectReturnType,
  hasNestedObject,
  highlight,
  inferArrayColumns,
  RETURN_TYPE_LABEL,
} from '~/pages/workbench/composables/utils'

const {
  resourceDetailVisible,
  resourceDetail,
} = useWorkbenchContext()

function close() {
  resourceDetailVisible.value = false
}

const detail = computed<ExecutionDetail | null>(() => resourceDetail.value)

// ============ 返回信息智能识别 ============
const returnType = computed<ReturnDataType>(() => detectReturnType(detail.value?.returnInfo))

const returnBadge = computed(() => RETURN_TYPE_LABEL[returnType.value])

/** JSON / YAML 高亮后的 HTML（v-html 安全：highlight 内部逐 token 转义） */
const returnHighlighted = computed(() => {
  const raw = detail.value?.returnInfo ?? ''
  if (!raw.trim())
    return ''
  // JSON 先格式化再高亮
  if (returnType.value === 'json') {
    try {
      return highlight(JSON.stringify(JSON.parse(raw.trim()), null, 2), 'json')
    }
    catch {
      return highlight(raw, 'text')
    }
  }
  if (returnType.value === 'yaml')
    return highlight(raw, 'yaml')
  return ''
})

// ============ JSON Array 表格化 ============
const arrayItems = computed<Record<string, any>[]>(() => {
  if (returnType.value !== 'jsonarray')
    return []
  try {
    const parsed = JSON.parse((detail.value?.returnInfo ?? '').trim())
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
})

const arrayColumns = computed<InferredColumn[]>(() => inferArrayColumns(arrayItems.value))

const hasNested = computed(() => hasNestedObject(arrayItems.value))

/** 单元格展示值：标量直接转字符串，对象显示字段数提示 */
function cellDisplay(row: Record<string, any>, key: string): string {
  const val = row[key]
  if (val === undefined || val === null)
    return '-'
  if (typeof val === 'object')
    return `{${Object.keys(val).length} 个字段}`
  return String(val)
}

/** 提取行内所有嵌套对象（展开区渲染） */
function nestedEntries(row: Record<string, any>): Array<{ key: string, value: Record<string, any> }> {
  return Object.entries(row)
    .filter(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v))
    .map(([key, value]) => ({ key, value: value as Record<string, any> }))
}

/** 嵌套对象内的值展示：标量直接显示，对象/数组降级 JSON 代码片段（v1 只支持一层） */
function nestedValueDisplay(val: any): { text: string, isCode: boolean } {
  if (val === null || val === undefined)
    return { text: '-', isCode: false }
  if (typeof val === 'object')
    return { text: JSON.stringify(val, null, 2), isCode: true }
  return { text: String(val), isCode: false }
}

function copyReturn() {
  const raw = detail.value?.returnInfo ?? ''
  navigator.clipboard?.writeText(raw)
}

/** 状态文案映射 */
function statusText(detail?: ExecutionDetail | null): string {
  if (!detail)
    return '-'
  const map: Record<string, string> = { S: '成功', F: '失败', P: '执行中', R: '等待' }
  return map[detail.execStatus] ?? detail.execStatus
}
</script>

<template>
  <el-dialog
    :model-value="resourceDetailVisible"
    :title="`资源详情 · ${detail?.pkDisplay ?? ''}`"
    width="640px"
    :close-on-click-modal="false"
    append-to-body
    @close="close"
  >
    <div v-if="detail" class="resource-detail">
      <!-- 基本信息 -->
      <div class="rd-section">
        <div class="rd-section-title">
          基本信息
        </div>
        <div class="rd-desc-list">
          <div class="rd-desc-item">
            <span class="rd-desc-label">开始时间</span>
            <span class="rd-desc-value">{{ detail.startTime || '-' }}</span>
          </div>
          <div class="rd-desc-item">
            <span class="rd-desc-label">结束时间</span>
            <span class="rd-desc-value">{{ detail.endTime || '-' }}</span>
          </div>
          <div class="rd-desc-item">
            <span class="rd-desc-label">耗时</span>
            <span class="rd-desc-value">{{ detail.duration != null ? `${detail.duration.toFixed(1)}s` : '-' }}</span>
          </div>
          <div class="rd-desc-item">
            <span class="rd-desc-label">状态</span>
            <span class="rd-desc-value">{{ statusText(detail) }}</span>
          </div>
        </div>
      </div>

      <!-- 执行参数 -->
      <div v-if="detail.paramsInfo && Object.keys(detail.paramsInfo).length > 0" class="rd-section">
        <div class="rd-section-title">
          执行参数
        </div>
        <table class="rd-kv-table">
          <tr v-for="(val, key) in detail.paramsInfo" :key="key">
            <td class="rd-kv-key">
              {{ key }}
            </td>
            <td class="rd-kv-val">
              {{ val }}
            </td>
          </tr>
        </table>
      </div>

      <!-- 资源信息 -->
      <div v-if="detail.resourceInfo && Object.keys(detail.resourceInfo).length > 0" class="rd-section">
        <div class="rd-section-title">
          资源信息
        </div>
        <table class="rd-kv-table">
          <tr v-for="(val, key) in detail.resourceInfo" :key="key">
            <td class="rd-kv-key">
              {{ key }}
            </td>
            <td class="rd-kv-val">
              {{ val }}
            </td>
          </tr>
        </table>
      </div>

      <!-- 报错信息 -->
      <div v-if="detail.errorMsg" class="rd-section">
        <div class="rd-section-title">
          报错信息
        </div>
        <div class="rd-error-block">
          {{ detail.errorMsg }}
        </div>
      </div>

      <!-- 返回信息 -->
      <div v-if="detail.returnInfo && detail.returnInfo.trim()" class="rd-section">
        <div class="rd-section-title">
          返回信息
          <el-tag size="small" effect="plain" class="rd-type-badge">
            {{ returnBadge }}
          </el-tag>
          <el-button size="small" type="primary" link class="rd-copy-btn" @click="copyReturn">
            <el-icon><CopyDocument /></el-icon>复制
          </el-button>
        </div>

        <!-- JSON Array：表格形式 -->
        <div v-if="returnType === 'jsonarray'" class="rd-array">
          <el-table
            :data="arrayItems"
            size="small"
            border
            :row-key="(row: any) => JSON.stringify(row)"
            :max-height="arrayItems.length > 20 ? 300 : undefined"
          >
            <el-table-column v-if="hasNested" type="expand">
              <template #default="{ row }">
                <div class="rd-nested-area">
                  <div v-for="entry in nestedEntries(row)" :key="entry.key" class="rd-nested-block">
                    <div class="rd-nested-title">
                      {{ entry.key }}
                    </div>
                    <table class="rd-kv-table rd-kv-mini">
                      <tr v-for="(val, key) in entry.value" :key="key">
                        <td class="rd-kv-key">
                          {{ key }}
                        </td>
                        <td class="rd-kv-val">
                          <template v-if="nestedValueDisplay(val).isCode">
                            <pre class="rd-nested-code">{{ nestedValueDisplay(val).text }}</pre>
                          </template>
                          <template v-else>
                            {{ nestedValueDisplay(val).text }}
                          </template>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              v-for="col in arrayColumns"
              :key="col.key"
              :prop="col.key"
              :label="col.key"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span :class="{ 'rd-nested-hint': col.nested }">{{ cellDisplay(row, col.key) }}</span>
              </template>
            </el-table-column>
            <template #empty>
              返回信息为空数组
            </template>
          </el-table>
        </div>

        <!-- JSON / YAML：只读代码块 -->
        <div v-else-if="returnType === 'json' || returnType === 'yaml'" class="rd-code-block-wrap">
          <pre class="rd-code-block"><code v-html="returnHighlighted" /></pre>
        </div>

        <!-- TEXT：等宽纯文本 -->
        <pre v-else class="rd-text-block">{{ detail.returnInfo }}</pre>
      </div>
    </div>
  </el-dialog>
</template>
