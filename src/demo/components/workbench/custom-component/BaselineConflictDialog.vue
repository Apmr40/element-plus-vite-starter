<script setup lang="ts">
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  showConflictDialog,
  conflictDetail,
  confirmForcePublish,
  cancelConflict,
  viewConflictDiff,
} = useWorkbenchContext()
</script>

<template>
  <el-dialog
    v-model="showConflictDialog"
    title="基线冲突"
    width="520px"
    :append-to-body="true"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-if="conflictDetail" class="conflict-body">
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>
          线上已更新至 <b>V{{ conflictDetail.online.versionNo }}</b>，
          你的草稿基于 <b>V{{ conflictDetail.baseNo }}</b>
        </template>
        <p class="conflict-desc">
          继续发布将覆盖 V{{ conflictDetail.baseNo + 1 }}～V{{ conflictDetail.online.versionNo }} 的变更。
          建议先查看变更内容再决定。
        </p>
      </el-alert>

      <div class="conflict-online-info">
        <span>V{{ conflictDetail.online.versionNo }} 发布人：{{ conflictDetail.online.publisher }}</span>
        <span>{{ conflictDetail.online.publishTime }}</span>
      </div>
      <ul v-if="conflictDetail.online.changeSummary.length" class="conflict-changes">
        <li v-for="(s, i) in conflictDetail.online.changeSummary" :key="i">
          {{ s }}
        </li>
      </ul>
    </div>

    <template #footer>
      <el-button @click="cancelConflict">
        取消
      </el-button>
      <el-button type="info" plain @click="viewConflictDiff">
        查看 V{{ conflictDetail?.baseNo }} → V{{ conflictDetail?.online.versionNo }} 变更
      </el-button>
      <el-button type="primary" @click="confirmForcePublish">
        仍要继续发布
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.conflict-body {
  .conflict-desc {
    margin: 4px 0 0;
    font-size: $font-size-label;
    color: $uops-text-secondary;
    line-height: 1.6;
  }

  .conflict-online-info {
    display: flex;
    justify-content: space-between;
    margin-top: $uops-spacing-md;
    padding: $uops-spacing-sm $uops-spacing-md;
    background: $uops-bg-color;
    border-radius: $uops-radius-sm;
    font-size: $font-size-label;
    color: $uops-text-regular;
  }

  .conflict-changes {
    margin: $uops-spacing-sm 0 0;
    padding-left: 18px;
    font-size: $font-size-label;
    color: $uops-text-regular;
    line-height: 1.9;
  }
}
</style>
