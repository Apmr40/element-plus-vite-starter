<script setup lang="ts">
import type { ComponentParm } from '~/demo/types/workbench'
import { CTRL_TYPE_NAMES } from '~/demo/types/workbench'

const props = defineProps<{
  parms: ComponentParm[]
  extractedVars: string[]
  /** 只读模式（查看草稿场景） */
  disabled?: boolean
}>()

defineEmits<{
  add: []
  remove: [row: ComponentParm]
}>()

/** 模板提取的行，但变量已从模板中删除 → 待清理 */
function isStale(row: ComponentParm): boolean {
  return row.source === 'template' && !props.extractedVars.includes(row.name)
}

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}
</script>

<template>
  <div class="execute-section">
    <div class="section-title-bar">
      <div class="title-indicator" />
      <span class="title-text">参数配置</span>
      <el-tag size="small" type="info" class="section-badge">
        模板提取 + 手动添加
      </el-tag>
    </div>

    <el-table :data="parms" border size="small" class="parm-table">
      <el-table-column label="#" width="48" align="center">
        <template #default="{ $index }">
          {{ formatIndex($index) }}
        </template>
      </el-table-column>
      <el-table-column label="参数名(英文)" min-width="140">
        <template #default="{ row }">
          <el-input
            v-model="row.name"
            size="small"
            :readonly="row.source === 'template'"
            :disabled="disabled"
            :class="{ 'parm-readonly': row.source === 'template' }"
          />
        </template>
      </el-table-column>
      <el-table-column label="中文名" min-width="110">
        <template #default="{ row }">
          <el-input v-model="row.cnName" size="small" placeholder="中文名" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="控件类型" width="110">
        <template #default="{ row }">
          <el-select v-model="row.ctrlType" size="small" style="width: 100%" :disabled="disabled">
            <el-option
              v-for="(name, val) in CTRL_TYPE_NAMES"
              :key="val"
              :label="name"
              :value="val"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="预设值/选项" min-width="130">
        <template #default="{ row }">
          <el-input v-model="row.presetValue" size="small" placeholder="选填" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="校验规则" width="120">
        <template #default="{ row }">
          <el-select v-model="row.validateRule" size="small" style="width: 100%" :disabled="disabled">
            <el-option label="可空+不校验" value="0" />
            <el-option label="可空+正则" value="1" />
            <el-option label="必填" value="2" />
            <el-option label="必填+正则" value="3" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="加密" width="70" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.encrypted" size="small" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="来源" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="isStale(row)" size="small" type="warning">
            ⚠ 待清理
          </el-tag>
          <el-tag v-else-if="row.source === 'template'" size="small">
            🔗 模板
          </el-tag>
          <el-tag v-else size="small" type="info">
            ✍ 手动
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="!disabled" label="操作" width="60" align="center">
        <template #default="{ row }">
          <el-button link type="danger" size="small" @click="$emit('remove', row)">
            ✕
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-button v-if="!disabled" class="add-row-btn" link type="primary" @click="$emit('add')">
      + 添加参数
    </el-button>

    <div class="legend">
      <span>🔗 = 模板提取</span>
      <span>✍ = 手动添加</span>
      <span>⚠ = 待清理(模板变量已删除)</span>
    </div>
  </div>
</template>
