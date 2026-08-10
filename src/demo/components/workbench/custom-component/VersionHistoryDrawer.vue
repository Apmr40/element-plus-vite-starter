<script setup lang="ts">
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

const {
  showVersionDrawer,
  versionDrawerOpName,
  versions,
  versionsLoading,
  latestVersion,
  openDiff,
  simulateExternal,
} = useWorkbenchContext()
</script>

<template>
  <el-drawer
    v-model="showVersionDrawer"
    size="520px"
    direction="rtl"
    :close-on-click-modal="true"
    :append-to-body="true"
  >
    <template #header>
      <div class="ver-drawer-header">
        <span class="ver-drawer-title">{{ versionDrawerOpName }}</span>
        <el-tag v-if="latestVersion" size="small" type="primary" effect="dark">
          V{{ latestVersion.versionNo }}
        </el-tag>
      </div>
    </template>

    <div v-loading="versionsLoading" class="ver-timeline">
      <div
        v-for="(ver, idx) in versions"
        :key="ver.id"
        class="ver-node"
        :class="{ 'is-current': idx === 0 }"
      >
        <!-- 时间线圆点 + 连线 -->
        <div class="ver-node-line">
          <span class="ver-dot" :class="{ current: idx === 0 }" />
          <span v-if="idx < versions.length - 1" class="ver-connector" />
        </div>

        <!-- 版本卡片 -->
        <div class="ver-card">
          <div class="ver-card-head">
            <span class="ver-no">V{{ ver.versionNo }}</span>
            <el-tag v-if="idx === 0" size="small" type="success" effect="plain">
              当前版本
            </el-tag>
            <el-tag v-if="ver.changeType === 'create'" size="small" type="info" effect="plain">
              初始版本
            </el-tag>
          </div>
          <div class="ver-meta">
            <span>{{ ver.publishTime }}</span>
            <span class="ver-sep">·</span>
            <span>{{ ver.publisher }}</span>
          </div>
          <ul v-if="ver.changeSummary.length" class="ver-summary">
            <li v-for="(s, si) in ver.changeSummary.slice(0, 3)" :key="si">
              {{ s }}
            </li>
            <li v-if="ver.changeSummary.length > 3" class="ver-more">
              等 {{ ver.changeSummary.length }} 项变更
            </li>
          </ul>
          <!-- 对比按钮（非当前版本才显示） -->
          <div v-if="idx !== 0" class="ver-actions">
            <el-button
              link
              type="primary"
              size="small"
              @click="openDiff(versions[idx + 1].versionNo, ver.versionNo)"
            >
              与上一版对比
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="openDiff(ver.versionNo, versions[0].versionNo)"
            >
              与当前对比
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!versionsLoading && versions.length === 0" description="暂无版本记录" />

      <!-- Demo：模拟他人在编辑期间发布新版本，用于演示基线冲突检测 -->
      <div class="ver-demo-footer">
        <el-button link type="warning" size="small" @click="simulateExternal()">
          ⚡ 模拟外部发布（演示基线冲突）
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.ver-drawer-header {
  display: flex;
  align-items: center;
  gap: $uops-spacing-sm;

  .ver-drawer-title {
    font-size: 16px;
    font-weight: 700;
    color: $uops-text-primary;
  }
}

.ver-timeline {
  min-height: 200px;
  padding: 0 $uops-spacing-sm;
}

.ver-demo-footer {
  padding: $uops-spacing-md 0;
  border-top: 1px dashed $uops-border-color;
  text-align: center;
}

.ver-node {
  display: flex;
  gap: $uops-spacing-md;

  // 时间线轨道
  .ver-node-line {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 14px;
    flex-shrink: 0;

    .ver-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $uops-border-color;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px $uops-border-color;
      margin-top: 6px;
      flex-shrink: 0;
      transition: all 0.2s;

      &.current {
        background: $uops-primary-color;
        box-shadow:
          0 0 0 2px $uops-primary-color,
          0 0 0 5px rgba($uops-primary-color, 0.15);
      }
    }

    .ver-connector {
      width: 2px;
      flex: 1;
      min-height: 16px;
      background: linear-gradient(to bottom, $uops-border-color, rgba($uops-border-color, 0.3));
    }
  }

  // 版本卡片
  .ver-card {
    flex: 1;
    min-width: 0;
    background: $uops-bg-color;
    border: 1px solid $uops-border-color;
    border-radius: $uops-radius-sm;
    padding: $uops-spacing-md $uops-spacing-lg;
    margin-bottom: $uops-spacing-md;
    transition:
      box-shadow 0.2s,
      border-color 0.2s,
      transform 0.2s;

    &:hover {
      border-color: rgba($uops-primary-color, 0.4);
      box-shadow: 0 2px 12px rgba($uops-primary-color, 0.1);
      transform: translateX(2px);
    }

    .ver-card-head {
      display: flex;
      align-items: center;
      gap: $uops-spacing-sm;
      margin-bottom: 4px;

      .ver-no {
        font-size: 15px;
        font-weight: 700;
        color: $uops-text-primary;
        font-family: 'SFMono-Regular', Consolas, monospace;
      }
    }

    .ver-meta {
      font-size: $font-size-label;
      color: $uops-text-secondary;
      margin-bottom: $uops-spacing-xs;

      .ver-sep {
        margin: 0 4px;
        color: $uops-text-placeholder;
      }
    }

    .ver-summary {
      margin: 0;
      padding-left: 16px;
      font-size: $font-size-label;
      color: $uops-text-regular;
      line-height: 1.8;

      .ver-more {
        color: $uops-text-placeholder;
        list-style: none;
        margin-left: -16px;
      }
    }

    .ver-actions {
      margin-top: $uops-spacing-sm;
      display: flex;
      gap: $uops-spacing-md;
    }
  }

  // 当前版本卡片高亮
  &.is-current .ver-card {
    border-color: rgba($uops-primary-color, 0.35);
    background: rgba($uops-primary-color, 0.03);
  }
}
</style>
