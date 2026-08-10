<script setup lang="ts">
import type { ParmCtrlType } from '~/demo/types/workbench'
import { computed } from 'vue'
import { CATEGORY_NAMES, CTRL_TYPE_NAMES } from '~/demo/types/workbench'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'
import { computeChangeSummary, diffSnapshots, formToSnapshot } from '~/pages/workbench/composables/version-utils'

defineProps<{ readonly?: boolean }>()

const {
  componentMode,
  customForm,
  instanceForm,
  sourceComponent,
  sourceIsScript,
  customRisk,
  instanceRisk,
  inheritCategoryName,
  platformBadge,
  currentScriptSubtype,
  isEditScene,
  baseSnapshot,
  baseVersionNo,
} = useWorkbenchContext()

const previewBasicItems = computed(() => {
  if (componentMode.value === 'custom') {
    const catName = customForm.category ? CATEGORY_NAMES[customForm.category as keyof typeof CATEGORY_NAMES] : '-'
    const subName = customForm.tplCategory === 'script'
      ? currentScriptSubtype.value.label
      : customForm.apiSubtype.toUpperCase()
    return [
      { k: '操作名称(英文)', v: customForm.servicename || '-' },
      { k: '操作名称(中文)', v: customForm.servicecnname || '-' },
      { k: '操作分类', v: catName },
      { k: '风险等级', v: customRisk.value ? `${customRisk.value.level}（${customRisk.value.code}）` : '-' },
      { k: '平台类型', v: platformBadge.value.text },
      { k: '模板大类', v: customForm.tplCategory === 'script' ? '脚本类' : 'API类' },
      { k: '具体类型', v: subName },
      { k: '超时时间', v: `${customForm.timeout}s` },
      { k: '执行方式', v: '非批量（后台默认）' },
    ]
  }
  const src = sourceComponent.value
  const isScript = sourceIsScript.value
  return [
    { k: '实例名称', v: instanceForm.instanceName || '-' },
    { k: '来源公共组件', v: src?.name || '-' },
    { k: '来源类型', v: isScript ? '执行脚本类' : '非脚本类公共操作' },
    { k: '操作分类', v: isScript
      ? (instanceForm.category ? CATEGORY_NAMES[instanceForm.category as keyof typeof CATEGORY_NAMES] : '-')
      : `${inheritCategoryName.value}（继承来源）` },
    { k: '风险等级', v: isScript
      ? (instanceRisk.value ? `${instanceRisk.value.level}（${instanceRisk.value.code}）` : '-')
      : '由来源组件管控' },
    { k: '成功判定规则', v: isScript ? (instanceForm.successRule || '-') : '无需设置（非脚本类）' },
    { k: '复用模板', v: `templateType=${src?.templateType || '-'} / templateId=${src?.templateId || '-'}` },
    { k: '写入表', v: 'serv_ins_info + serv_ins_parm' },
  ]
})

const previewCode = computed(() => {
  if (customForm.tplCategory === 'api') {
    let prefix: string
    let bodyText: string
    if (customForm.apiSubtype === 'http') {
      prefix = `${customForm.apiProtocol.toUpperCase()} · ${customForm.apiMethod} ${customForm.apiUrl}`
      bodyText = customForm.apiBodyFormat === 'form'
        ? `[x-www-form-urlencoded]\n${customForm.apiFormRows.filter(r => r.key).map(r => `${r.key} = ${r.value}`).join('\n') || '（空）'}`
        : `[JSON]\n${customForm.apiBodyJson}`
    }
    else {
      prefix = `TCP ${customForm.tcpHost}:${customForm.tcpPort}`
      bodyText = customForm.tcpContent
    }
    return `${prefix}\n\nBody:\n${bodyText}\n\nsuccessflag: ${customForm.apiSuccessFlag}`
  }
  return customForm.scriptContent
})

const previewParms = computed(() => {
  if (componentMode.value === 'custom') {
    return customForm.parms.map(p => ({
      name: p.name,
      cnName: p.cnName,
      ctrlName: CTRL_TYPE_NAMES[p.ctrlType],
      presetValue: p.presetValue,
      sourceName: p.source === 'template' ? '🔗 模板' : '✍ 手动',
    }))
  }
  return (sourceComponent.value?.params || []).map(p => ({
    name: `${p.name}（${p.cnName}）`,
    cnName: '',
    ctrlName: CTRL_TYPE_NAMES[p.ctrlType as ParmCtrlType],
    presetValue: instanceForm.fixValues[p.name] || '-',
    sourceName: '继承',
  }))
})

const previewParmCount = computed(() =>
  componentMode.value === 'custom'
    ? `${customForm.parms.length} 个参数`
    : `${sourceComponent.value?.params.length || 0} 个固化参数`,
)

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}

// ============ 编辑场景：变更摘要 ============
const changeSummary = computed(() => {
  if (!isEditScene.value || !baseSnapshot.value)
    return []
  const current = formToSnapshot(customForm)
  return computeChangeSummary(baseSnapshot.value, current)
})

const diffRows = computed(() => {
  if (!isEditScene.value || !baseSnapshot.value)
    return []
  const current = formToSnapshot(customForm)
  return diffSnapshots(baseSnapshot.value, current).filter(r => r.changed)
})
</script>

<template>
  <div class="preview-card">
    <div class="pc-head">
      <span class="pc-title">基本信息</span>
      <el-tag size="small" :type="componentMode === 'custom' ? 'primary' : 'success'">
        {{ componentMode === 'custom' ? '定制模式' : '实例固化模式' }}
      </el-tag>
    </div>
    <div class="pv-grid">
      <div v-for="item in previewBasicItems" :key="item.k" class="pv-item">
        <span class="k">{{ item.k }}</span>
        <span class="v">{{ item.v }}</span>
      </div>
    </div>
  </div>

  <div v-if="componentMode === 'custom'" class="preview-card">
    <div class="pc-head">
      <span class="pc-title">模板内容</span>
      <el-tag size="small" type="info">
        {{ customForm.tplCategory === 'api' ? 'transtemplate' : 'scriptlibrary' }}
      </el-tag>
    </div>
    <pre class="pv-code">{{ previewCode }}</pre>
  </div>

  <div class="preview-card">
    <div class="pc-head">
      <span class="pc-title">参数列表</span>
      <el-tag size="small" type="info">
        {{ previewParmCount }}
      </el-tag>
    </div>
    <el-table :data="previewParms" border size="small">
      <el-table-column label="#" width="48" align="center">
        <template #default="{ $index }">
          {{ formatIndex($index) }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="参数名" min-width="130" />
      <el-table-column prop="cnName" label="中文名" min-width="110">
        <template #default="{ row }">
          {{ row.cnName || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="ctrlName" label="控件" width="100" />
      <el-table-column prop="presetValue" label="预设值" min-width="120">
        <template #default="{ row }">
          {{ row.presetValue || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="sourceName" label="来源" width="90" align="center" />
    </el-table>
  </div>

  <!-- 编辑场景：变更摘要（相对基线版本） -->
  <div v-if="isEditScene && baseSnapshot" class="preview-card change-card">
    <div class="pc-head">
      <span class="pc-title">变更摘要</span>
      <el-tag size="small" type="warning" effect="plain">
        相对基线 V{{ baseVersionNo }}
      </el-tag>
    </div>
    <div v-if="changeSummary.length" class="change-chips">
      <span v-for="s in changeSummary" :key="s" class="change-chip">{{ s }}</span>
    </div>
    <div v-else class="change-none">
      未检测到字段变更
    </div>
    <el-table v-if="diffRows.length" :data="diffRows" border size="small" class="diff-table">
      <el-table-column prop="label" label="字段" width="140" />
      <el-table-column label="基线值" min-width="180">
        <template #default="{ row }">
          <span class="diff-old">{{ row.oldVal || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前值" min-width="180">
        <template #default="{ row }">
          <span class="diff-new">{{ row.newVal || '-' }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.preview-card {
  background: $uops-bg-nested;
  border-radius: $uops-radius-sm;
  padding: $uops-spacing-lg $uops-spacing-xl;
  margin-bottom: $uops-spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  .pc-head {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    margin-bottom: $uops-spacing-md;

    .pc-title {
      font-size: $font-size-base;
      font-weight: 700;
      color: $uops-text-primary;
    }
  }

  .pv-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px $uops-spacing-xl;

    .pv-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .k {
        font-size: $font-size-label;
        color: $uops-text-placeholder;
      }

      .v {
        font-size: $font-size-base;
        color: $uops-text-regular;
        font-weight: 500;
      }
    }
  }

  .pv-code {
    background: #1e2733;
    color: #d7e2ee;
    border-radius: $uops-radius-sm;
    padding: $uops-spacing-md $uops-spacing-lg;
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: $font-size-label;
    line-height: 1.7;
    white-space: pre-wrap;
    max-height: 160px;
    overflow-y: auto;
    margin: 0;
  }
}

// 变更摘要卡片
.change-card {
  border-left: 3px solid $uops-warning-color;

  .change-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $uops-spacing-sm;
    margin-bottom: $uops-spacing-md;

    .change-chip {
      padding: 3px 12px;
      background: #fffbe6;
      border: 1px solid #ffe58f;
      border-radius: 12px;
      font-size: $font-size-label;
      color: $uops-text-regular;
    }
  }

  .change-none {
    font-size: $font-size-label;
    color: $uops-text-placeholder;
    margin-bottom: $uops-spacing-sm;
  }

  .diff-table {
    .diff-old {
      color: $uops-danger-color;
      text-decoration: line-through;
      word-break: break-all;
    }

    .diff-new {
      color: $uops-success-color;
      font-weight: 600;
      word-break: break-all;
    }
  }
}
</style>
