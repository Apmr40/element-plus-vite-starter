<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  showDiffDialog,
  diffFromVer,
  diffToVer,
  diffRows,
  diffChangedCount,
  diffCodePairs,
  closeDiff,
} = useWorkbenchContext()

const showAll = ref(false)

/** 按筛选条件过滤行 */
const visibleRows = computed(() =>
  showAll.value ? diffRows.value : diffRows.value.filter(r => r.changed),
)

/** 脚本字段是否有变更 */
const scriptChanged = computed(() =>
  diffRows.value.some(r => r.isCode && r.changed),
)
</script>

<template>
  <el-dialog
    v-model="showDiffDialog"
    width="900px"
    :append-to-body="true"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <div class="diff-header">
        <span class="diff-title">
          版本对比 · V{{ diffFromVer?.versionNo }} → V{{ diffToVer?.versionNo }}
        </span>
        <div class="diff-meta">
          <span v-if="diffFromVer">V{{ diffFromVer.versionNo }}：{{ diffFromVer.publisher }} · {{ diffFromVer.publishTime }}</span>
          <span class="diff-arrow">→</span>
          <span v-if="diffToVer">V{{ diffToVer.versionNo }}：{{ diffToVer.publisher }} · {{ diffToVer.publishTime }}</span>
        </div>
      </div>
    </template>

    <!-- 汇总行 -->
    <div class="diff-summary-bar">
      <span>共 <b>{{ diffChangedCount }}</b> 处变更</span>
      <el-radio-group v-model="showAll" size="small">
        <el-radio-button :value="false">
          只看变更项
        </el-radio-button>
        <el-radio-button :value="true">
          显示全部
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 字段级 diff 表格 -->
    <el-table :data="visibleRows" border size="small" class="diff-table">
      <el-table-column prop="label" label="字段" width="140" />
      <el-table-column label="V{{ diffFromVer?.versionNo }} 值">
        <template #default="{ row }">
          <span :class="{ 'diff-old': row.changed }">{{ row.oldVal || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="V{{ diffToVer?.versionNo }} 值">
        <template #default="{ row }">
          <span :class="{ 'diff-new': row.changed }">{{ row.newVal || '-' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 脚本行级对比（仅当脚本字段有变更时展示） -->
    <template v-if="scriptChanged">
      <div class="diff-code-title">
        脚本内容对比
      </div>
      <div class="diff-code-panes">
        <div class="diff-code-pane">
          <div class="diff-code-head">
            V{{ diffFromVer?.versionNo }}
          </div>
          <pre class="diff-code-block"><template
            v-for="(pair, pi) in diffCodePairs"
            :key="pi"
          ><span
            class="diff-line" :class="[{ 'diff-del': pair.oldLine?.diff }]"
          >{{ pair.oldLine ? `${String(pair.oldLine.no).padStart(3)} | ${pair.oldLine.text}` : '    |' }}
</span></template></pre>
        </div>
        <div class="diff-code-pane">
          <div class="diff-code-head">
            V{{ diffToVer?.versionNo }}
          </div>
          <pre class="diff-code-block"><template
            v-for="(pair, pi) in diffCodePairs"
            :key="pi"
          ><span
            class="diff-line" :class="[{ 'diff-add': pair.newLine?.diff }]"
          >{{ pair.newLine ? `${String(pair.newLine.no).padStart(3)} | ${pair.newLine.text}` : '    |' }}
</span></template></pre>
        </div>
      </div>
    </template>

    <template #footer>
      <el-button @click="closeDiff">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.diff-header {
  .diff-title {
    font-size: 16px;
    font-weight: 700;
    color: $uops-text-primary;
    font-family: 'SFMono-Regular', Consolas, monospace;
  }

  .diff-meta {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    margin-top: 4px;
    font-size: $font-size-label;
    color: $uops-text-secondary;

    .diff-arrow {
      color: $uops-primary-color;
      font-weight: 700;
    }
  }
}

.diff-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $uops-spacing-md;
  font-size: $font-size-base;
  color: $uops-text-regular;

  b {
    color: $uops-warning-color;
    font-size: 16px;
  }
}

.diff-table {
  :deep(.diff-old) {
    color: $uops-danger-color;
    text-decoration: line-through;
    word-break: break-all;
  }

  :deep(.diff-new) {
    color: $uops-success-color;
    font-weight: 600;
    word-break: break-all;
  }
}

// 脚本行级对比
.diff-code-title {
  margin: $uops-spacing-lg 0 $uops-spacing-sm;
  font-size: $font-size-base;
  font-weight: 600;
  color: $uops-text-primary;
}

.diff-code-panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $uops-spacing-md;

  .diff-code-pane {
    min-width: 0;

    .diff-code-head {
      padding: 4px 12px;
      background: #2a3542;
      color: #8fa8c0;
      font-size: $font-size-label;
      font-family: 'SFMono-Regular', Consolas, monospace;
      border-radius: $uops-radius-sm $uops-radius-sm 0 0;
    }

    .diff-code-block {
      margin: 0;
      background: #1e2733;
      color: #d7e2ee;
      border-radius: 0 0 $uops-radius-sm $uops-radius-sm;
      padding: $uops-spacing-sm $uops-spacing-md;
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 12px;
      line-height: 1.7;
      max-height: 240px;
      overflow: auto;

      .diff-line {
        display: block;
        white-space: pre-wrap;
        word-break: break-all;
        padding: 0 4px;
        border-radius: 2px;

        &.diff-del {
          background: rgba($uops-danger-color, 0.18);
          color: #ff9a9e;
        }

        &.diff-add {
          background: rgba($uops-success-color, 0.15);
          color: #7ee8b2;
        }
      }
    }
  }
}
</style>
