<script setup lang="ts">
import type { ParmCtrlType } from '~/demo/types/workbench'
import { Connection } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { CTRL_TYPE_NAMES } from '~/demo/types/workbench'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

defineProps<{ readonly?: boolean }>()

const { instanceForm, sourceComponent } = useWorkbenchContext()

const inheritMeta = computed(() => {
  const src = sourceComponent.value
  if (!src)
    return '实例将继承来源组件的 templateType + templateId，不创建独立模板'
  return src.isScript
    ? `执行脚本类 · 复用来源 templateType=${src.templateType} + templateId=${src.templateId} · 需选择操作分类并设置成功判定规则`
    : `非脚本类公共操作 · 复用来源 templateType=${src.templateType} · 操作分类继承来源，无需设置成功判定规则`
})

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}
</script>

<template>
  <div class="execute-section">
    <div class="inherit-banner">
      <el-icon class="ib-icon">
        <Connection />
      </el-icon>
      <div>
        <div class="ib-name">
          {{ sourceComponent?.name || '请先在 Step1 选择来源公共组件' }}
        </div>
        <div class="ib-meta">
          {{ inheritMeta }}
        </div>
      </div>
    </div>

    <div class="section-title-bar">
      <div class="title-indicator" />
      <span class="title-text">参数固化值填写</span>
      <el-tag size="small" type="info" class="section-badge">
        继承参数，仅填固化值
      </el-tag>
    </div>

    <el-table :data="sourceComponent?.params || []" border size="small" class="fix-table">
      <el-table-column label="#" width="48" align="center">
        <template #default="{ $index }">
          {{ formatIndex($index) }}
        </template>
      </el-table-column>
      <el-table-column label="参数名" min-width="170">
        <template #default="{ row }">
          <span>{{ row.name }}</span>
          <span class="parm-cn">（{{ row.cnName }}）</span>
        </template>
      </el-table-column>
      <el-table-column label="控件类型" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">
            {{ CTRL_TYPE_NAMES[row.ctrlType as ParmCtrlType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="固化值" min-width="240">
        <template #default="{ row }">
          <el-radio-group
            v-if="row.ctrlType === '1'"
            v-model="instanceForm.fixValues[row.name]"
            size="small"
            :disabled="readonly"
          >
            <el-radio
              v-for="opt in String(row.presetValue || '').split(',')"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </el-radio>
          </el-radio-group>
          <el-input
            v-else
            v-model="instanceForm.fixValues[row.name]"
            size="small"
            placeholder="填写固化值（校验规则继承来源）"
            :disabled="readonly"
          />
        </template>
      </el-table-column>
      <el-table-column label="参数来源" width="90" align="center">
        <template #default>
          <el-tag size="small">
            继承
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="legend">
      <span>固化值校验规则继承来源参数(parmcheckflag + parmcheckapiid)</span>
      <span>固化后前台执行不再显示该参数输入框</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

// 来源横幅
.inherit-banner {
  display: flex;
  align-items: center;
  gap: $uops-spacing-md;
  padding: $uops-spacing-md $uops-spacing-lg;
  background: $bg-card-large;
  border-radius: $uops-radius-sm;
  margin-bottom: $uops-spacing-lg;

  .ib-icon {
    width: 36px;
    height: 36px;
    border-radius: $uops-radius-sm;
    background: $uops-primary-color;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .ib-name {
    font-size: $font-size-base;
    font-weight: 700;
    color: $uops-text-primary;
  }

  .ib-meta {
    font-size: $font-size-label;
    color: $uops-text-placeholder;
    margin-top: 2px;
  }
}

.section-badge {
  margin-left: $uops-spacing-sm;
}

.fix-table {
  .parm-cn {
    color: $uops-text-placeholder;
    font-size: $font-size-label;
  }
}

.legend {
  display: flex;
  gap: $uops-spacing-lg;
  align-items: center;
  margin-top: $uops-spacing-sm;
  font-size: $font-size-label;
  color: $uops-text-placeholder;
}
</style>
