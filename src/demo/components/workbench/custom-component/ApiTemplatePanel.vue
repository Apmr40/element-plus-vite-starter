<script setup lang="ts">
import type { ComponentParm } from '~/demo/types/workbench'
import { ElMessageBox } from 'element-plus'
import { computed } from 'vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import CodeEditor from './CodeEditor.vue'
import ParmSection from './ParmSection.vue'

defineProps<{ readonly?: boolean }>()

const {
  customForm,
  extractedVars,
  switchBodyFormat,
  addManualParm,
  removeParm,
  addHeaderRow,
  removeHeaderRow,
  addFormRow,
  removeFormRow,
} = useWorkbenchContext()

const contentTypeNote = computed(() =>
  customForm.apiBodyFormat === 'json'
    ? 'Content-Type: application/json'
    : 'Content-Type: application/x-www-form-urlencoded',
)

function handleRemoveParm(row: ComponentParm) {
  if (row.source === 'template') {
    ElMessageBox.confirm(
      '该参数来自模板提取，删除后模板内变量仍存在，执行时将缺少传参。确认删除？',
      '删除参数',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
      .then(() => removeParm(row.id))
      .catch(() => {})
  }
  else {
    removeParm(row.id)
  }
}
</script>

<template>
  <div class="execute-section">
    <div class="subtype-bar">
      <span class="st-label"><span class="req">*</span> API 类型</span>
      <div class="subtype-pills">
        <span
          class="subtype-pill"
          :class="{ active: customForm.apiSubtype === 'http', disabled: readonly }"
          @click="!readonly && (customForm.apiSubtype = 'http')"
        >HTTP</span>
        <span
          class="subtype-pill"
          :class="{ active: customForm.apiSubtype === 'tcp', disabled: readonly }"
          @click="!readonly && (customForm.apiSubtype = 'tcp')"
        >TCP</span>
      </div>
    </div>

    <!-- HTTP(S) -->
    <template v-if="customForm.apiSubtype === 'http'">
      <div class="api-row">
        <el-select v-model="customForm.apiProtocol" class="api-protocol" title="请求协议" :disabled="readonly">
          <el-option label="HTTPS" value="https" />
          <el-option label="HTTP" value="http" />
        </el-select>
        <el-select v-model="customForm.apiMethod" class="api-method" :disabled="readonly">
          <el-option v-for="m in ['GET', 'POST', 'PUT', 'DELETE']" :key="m" :label="m" :value="m" />
        </el-select>
        <el-input
          v-model="customForm.apiUrl"
          class="api-url"
          placeholder="主机 + 路径，支持 {{param_name}} 埋点"
          :disabled="readonly"
        />
      </div>

      <div class="kv-section">
        <div class="kv-title">
          Headers
        </div>
        <el-table :data="customForm.apiHeaders" border size="small" class="kv-table">
          <el-table-column label="Key" width="220">
            <template #default="{ row }">
              <el-input v-model="row.key" size="small" placeholder="Header Key" :disabled="readonly" />
            </template>
          </el-table-column>
          <el-table-column label="Value">
            <template #default="{ row }">
              <el-input v-model="row.value" size="small" placeholder="Value，支持 {{param}} 埋点" :disabled="readonly" />
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" width="56" align="center">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="removeHeaderRow(row.id)">
                ✕
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button v-if="!readonly" class="add-row-btn" link type="primary" @click="addHeaderRow">
          + 添加 Header
        </el-button>
      </div>

      <div class="body-format-bar">
        <span class="st-label"><span class="req">*</span> 报文格式</span>
        <div class="subtype-pills">
          <span
            class="subtype-pill"
            :class="{ active: customForm.apiBodyFormat === 'json', disabled: readonly }"
            @click="!readonly && switchBodyFormat('json')"
          >JSON</span>
          <span
            class="subtype-pill"
            :class="{ active: customForm.apiBodyFormat === 'form', disabled: readonly }"
            @click="!readonly && switchBodyFormat('form')"
          >x-www-form-urlencoded</span>
        </div>
        <span class="bf-note">{{ contentTypeNote }}</span>
      </div>

      <!-- JSON 编辑器 -->
      <CodeEditor
        v-if="customForm.apiBodyFormat === 'json'"
        v-model="customForm.apiBodyJson"
        lang="json"
        lang-tag="JSON"
        var-format="{{param_name}}"
        :disabled="readonly"
      />

      <!-- form-urlencoded 键值对 -->
      <div v-else class="kv-section">
        <el-table :data="customForm.apiFormRows" border size="small" class="kv-table">
          <el-table-column label="Key" width="220">
            <template #default="{ row }">
              <el-input v-model="row.key" size="small" placeholder="参数名" :disabled="readonly" />
            </template>
          </el-table-column>
          <el-table-column label="Value">
            <template #default="{ row }">
              <el-input v-model="row.value" size="small" placeholder="值，支持 {{param}} 埋点" :disabled="readonly" />
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" width="56" align="center">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="removeFormRow(row.id)">
                ✕
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button v-if="!readonly" class="add-row-btn" link type="primary" @click="addFormRow">
          + 添加键值对
        </el-button>
        <div class="form-note">
          键值对中的 <code>&#123;&#123;param&#125;&#125;</code> 埋点同样自动提取至下方参数表
        </div>
      </div>
    </template>

    <!-- TCP -->
    <template v-else>
      <el-row :gutter="24" class="tcp-row">
        <el-col :span="12">
          <el-form label-position="top" :disabled="readonly">
            <el-form-item label="目标地址" required>
              <el-input v-model="customForm.tcpHost" placeholder="IP 或主机名" />
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="12">
          <el-form label-position="top" :disabled="readonly">
            <el-form-item label="端口" required>
              <el-input v-model="customForm.tcpPort" placeholder="端口号" />
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
      <CodeEditor
        v-model="customForm.tcpContent"
        lang="text"
        lang-tag="Text"
        var-format="{{param_name}}"
        :disabled="readonly"
      />
    </template>

    <!-- API 埋点提取汇总 -->
    <div class="extract-bar standalone">
      <span>自动提取埋点：</span>
      <template v-if="extractedVars.length">
        <span v-for="v in extractedVars" :key="v" class="var-chip">{{ v }}<span class="src">🔗</span></span>
      </template>
      <span v-else class="var-none">无</span>
    </div>

    <div class="success-rule required">
      <div class="sr-head">
        <span class="sr-title">成功判定规则</span>
        <span class="sr-req">* 必填，写入 successflag</span>
      </div>
      <el-input v-model="customForm.apiSuccessFlag" placeholder="如：response.code==200 && response.body.status=='ok'" :disabled="readonly" />
    </div>
  </div>

  <ParmSection
    :parms="customForm.parms"
    :extracted-vars="extractedVars"
    :disabled="readonly"
    @add="addManualParm"
    @remove="handleRemoveParm"
  />
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.subtype-bar {
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-md;

  .st-label {
    font-size: $font-size-base;
    color: $uops-text-primary;
    white-space: nowrap;
  }
}

.req {
  color: $uops-danger-color;
  margin-right: 2px;
}

.subtype-pills {
  display: flex;
  gap: $uops-spacing-sm;

  .subtype-pill {
    padding: 4px 14px;
    border: 1px solid $uops-border-color;
    border-radius: 14px;
    font-size: $font-size-label;
    color: $uops-text-secondary;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;

    &:hover {
      border-color: $uops-primary-color;
      color: $uops-primary-color;
    }

    &.active {
      background: $uops-primary-color;
      border-color: $uops-primary-color;
      color: #fff;
      font-weight: 600;
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
}

// API 请求行
.api-row {
  display: flex;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-md;

  .api-protocol {
    width: 104px;
    flex-shrink: 0;

    :deep(.ep-input__inner) {
      font-weight: 700;
      color: $uops-primary-color;
    }
  }

  .api-method {
    width: 110px;
    flex-shrink: 0;
  }

  .api-url {
    flex: 1;
  }
}

// 键值对区域
.kv-section {
  margin-bottom: $uops-spacing-md;

  .kv-title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $uops-text-primary;
    margin-bottom: $uops-spacing-sm;
  }

  .form-note {
    margin-top: $uops-spacing-sm;
    font-size: $font-size-label;
    color: $uops-text-placeholder;
  }
}

.add-row-btn {
  margin-top: $uops-spacing-sm;
}

// 报文格式切换条
.body-format-bar {
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  margin-bottom: $uops-spacing-md;
  padding: $uops-spacing-sm $uops-spacing-lg;
  background: $uops-bg-nested;
  border-radius: $uops-radius-sm;

  .st-label {
    font-size: $font-size-base;
    color: $uops-text-secondary;
    white-space: nowrap;
  }

  .bf-note {
    font-size: $font-size-label;
    color: rgba($uops-primary-color, 0.85);
    margin-left: auto;
    font-family: 'SFMono-Regular', Consolas, monospace;
  }
}

// 变量提取条
.extract-bar {
  display: flex;
  align-items: center;
  gap: $uops-spacing-sm;
  padding: $uops-spacing-sm $uops-spacing-md;
  background: $bg-card-large;
  border-top: 1px solid var(--el-border-color-light);
  font-size: $font-size-label;
  color: $uops-text-secondary;
  min-height: 34px;
  flex-wrap: wrap;

  &.standalone {
    border: 1px solid $uops-border-color;
    border-radius: $uops-radius-sm;
    margin-top: $uops-spacing-md;
  }

  .var-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fff;
    border: 1px solid rgba($uops-primary-color, 0.4);
    color: $uops-primary-color;
    border-radius: 10px;
    padding: 2px 10px;
    font-family: 'SFMono-Regular', Consolas, monospace;
    animation: chipIn 0.25s ease;

    .src {
      font-size: 10px;
      color: $uops-text-placeholder;
    }
  }

  .var-none {
    color: $uops-text-placeholder;
  }
}

@keyframes chipIn {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 成功判定规则
.success-rule {
  margin-top: $uops-spacing-lg;
  padding: $uops-spacing-md $uops-spacing-lg;
  background: $uops-bg-nested;
  border-radius: $uops-radius-sm;
  border-left: 3px solid $uops-success-color;

  &.required {
    border-left-color: $uops-danger-color;
  }

  .sr-head {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    margin-bottom: $uops-spacing-sm;
  }

  .sr-title {
    font-size: $font-size-base;
    font-weight: 700;
    color: $uops-text-primary;
  }

  .sr-req {
    font-size: $font-size-label;
    color: $uops-danger-color;
  }

  :deep(.ep-input__inner) {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 13px;
  }
}

// TCP 行
.tcp-row {
  margin-bottom: $uops-spacing-md;
}
</style>
