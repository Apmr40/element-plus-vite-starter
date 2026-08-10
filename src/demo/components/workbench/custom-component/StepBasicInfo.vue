<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'
import { CATEGORY_NAMES } from '~/demo/types/workbench'
import { useWorkbenchContext } from '~/pages/workbench/composables/useWorkbench'

defineProps<{ readonly?: boolean }>()

const {
  componentMode,
  customForm,
  instanceForm,
  publicSources,
  sourceComponent,
  sourceIsScript,
  customRisk,
  instanceRisk,
  inheritCategoryName,
  inheritCategoryRisk,
  platformBadge,
  handleInstanceSourceChange,
} = useWorkbenchContext()
</script>

<template>
  <!-- ---- 定制模式 ---- -->
  <template v-if="componentMode === 'custom'">
    <div class="execute-section">
      <div class="section-title-bar">
        <div class="title-indicator" />
        <span class="title-text">基本信息</span>
      </div>
      <el-form label-position="top" class="component-form" :disabled="readonly">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="操作名称(英文)" required>
              <el-input v-model="customForm.servicename" placeholder="字母/数字/下划线，≤200字符" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作名称(中文)" required>
              <el-input v-model="customForm.servicecnname" placeholder="≤800字符" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item required>
              <template #label>
                操作分类
                <span class="label-hint">选择后自动推算风险等级</span>
              </template>
              <el-select v-model="customForm.category" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="(name, val) in CATEGORY_NAMES"
                  :key="val"
                  :label="name"
                  :value="val"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <template #label>
                风险等级
                <span class="label-hint">由操作分类自动推算</span>
              </template>
              <div class="auto-display">
                <span class="auto-arrow">←</span>
                <el-tag :type="customRisk?.tagType || 'info'" size="small">
                  {{ customRisk ? `${customRisk.level}（${customRisk.code}）` : '待选择操作分类' }}
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="超时时间(秒)">
              <el-input-number v-model="customForm.timeout" :min="1" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <template #label>
                平台类型
                <span class="label-hint">由模板大类自动赋值，无需手选</span>
              </template>
              <div class="auto-display">
                <span class="auto-arrow">←</span>
                <el-tag :type="platformBadge.type" size="small">
                  {{ platformBadge.text }}
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 模板大类：脚本类 / API类 -->
        <el-form-item required>
          <template #label>
            模板大类
            <span class="label-hint">具体类型在 Step2 选择</span>
          </template>
          <div class="tpl-cards">
            <div
              class="tpl-card"
              :class="{ selected: customForm.tplCategory === 'script' }"
              @click="customForm.tplCategory = 'script'"
            >
              <div class="tc-check">
                <el-icon><Check /></el-icon>
              </div>
              <div class="tc-icon">
                📜
              </div>
              <div class="tc-name">
                脚本类
              </div>
              <div class="tc-desc">
                Shell / Python2 / Python3 / SQL / Groovy<br>代码编辑器 + 语法高亮 + ${'{var}'} 埋点
              </div>
            </div>
            <div
              class="tpl-card"
              :class="{ selected: customForm.tplCategory === 'api' }"
              @click="customForm.tplCategory = 'api'"
            >
              <div class="tc-check">
                <el-icon><Check /></el-icon>
              </div>
              <div class="tc-icon">
                🔗
              </div>
              <div class="tc-name">
                API 类
              </div>
              <div class="tc-desc">
                HTTP(S) / TCP 报文调用<br>JSON / form-urlencoded 键值对 + <code>&#123;&#123;var&#125;&#125;</code> 埋点
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="操作描述">
          <el-input v-model="customForm.description" type="textarea" :rows="2" placeholder="≤2000字符，选填" />
        </el-form-item>
      </el-form>
    </div>
  </template>

  <!-- ---- 实例固化模式 ---- -->
  <template v-else>
    <div class="execute-section">
      <div class="section-title-bar">
        <div class="title-indicator" />
        <span class="title-text">实例固化</span>
      </div>
      <el-form label-position="top" class="component-form" :disabled="readonly">
        <el-form-item required>
          <template #label>
            来源公共组件
            <span class="label-hint">仅显示已启用(confstatus=1)的公共组件，实例将继承其全部参数定义</span>
          </template>
          <el-select
            v-model="instanceForm.sourceId"
            placeholder="请搜索/选择公共组件"
            filterable
            style="width: 100%"
            @change="handleInstanceSourceChange"
          >
            <el-option
              v-for="src in publicSources"
              :key="src.id"
              :label="src.name"
              :value="src.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item required>
          <template #label>
            实例名称
            <span class="label-hint">自动生成，可修改</span>
          </template>
          <el-input v-model="instanceForm.instanceName" placeholder="{组件名}-{应用系统}-{序号}" />
        </el-form-item>

        <!-- 操作分类：脚本类→下拉选择 / 非脚本类→继承只读 -->
        <el-form-item v-if="sourceIsScript" required>
          <template #label>
            操作分类
            <span class="label-hint">复用定制模式分类，选择后推算风险</span>
          </template>
          <el-select v-model="instanceForm.category" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="(name, val) in CATEGORY_NAMES"
              :key="val"
              :label="name"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-else-if="sourceComponent">
          <template #label>
            操作分类
            <span class="label-hint">继承来源公共组件，不可修改</span>
          </template>
          <div class="auto-display">
            <span class="auto-arrow">←</span>
            <el-tag :type="inheritCategoryRisk?.tagType || 'info'" size="small">
              {{ inheritCategoryName }}（继承来源）
            </el-tag>
          </div>
        </el-form-item>

        <!-- 风险等级：仅脚本类显示 -->
        <el-form-item v-if="sourceIsScript">
          <template #label>
            风险等级
            <span class="label-hint">由操作分类自动推算</span>
          </template>
          <div class="auto-display">
            <span class="auto-arrow">←</span>
            <el-tag :type="instanceRisk?.tagType || 'info'" size="small">
              {{ instanceRisk ? `${instanceRisk.level}（${instanceRisk.code}）` : '待选择操作分类' }}
            </el-tag>
          </div>
        </el-form-item>

        <!-- 成功判定规则：仅脚本类需要 -->
        <el-form-item v-if="sourceIsScript" required>
          <template #label>
            成功判定规则
            <span class="label-hint">定义执行结果的判定逻辑</span>
          </template>
          <el-input
            v-model="instanceForm.successRule"
            type="textarea"
            :rows="2"
            placeholder="如：exit_code==0 && output.contains('switch success')"
          />
        </el-form-item>
        <div v-else-if="sourceComponent" class="no-rule-note">
          <span class="nr-title">成功判定规则</span>
          <span class="nr-text">非脚本类公共操作无需设置，由来源组件统一管控</span>
        </div>

        <el-form-item label="操作描述">
          <el-input v-model="instanceForm.description" type="textarea" :rows="2" placeholder="选填，默认继承来源" />
        </el-form-item>
      </el-form>
    </div>
  </template>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.component-form {
  .label-hint {
    margin-left: $uops-spacing-sm;
    font-size: $font-size-label;
    font-weight: 400;
    color: $uops-text-placeholder;
  }

  .auto-display {
    display: flex;
    align-items: center;
    gap: $uops-spacing-sm;
    min-height: 32px;

    .auto-arrow {
      color: $uops-text-placeholder;
      font-size: 14px;
    }
  }
}

// 模板大类选择卡片
.tpl-cards {
  display: flex;
  gap: $uops-spacing-lg;
  width: 100%;

  .tpl-card {
    position: relative;
    flex: 1;
    padding: $uops-spacing-lg $uops-spacing-xl;
    border: 1px solid $uops-border-color;
    border-radius: $uops-radius-md;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: rgba($uops-primary-color, 0.55);
      box-shadow: $uops-shadow-sm;
    }

    &.selected {
      border-color: $uops-primary-color;
      background: rgba($uops-primary-color, 0.04);
      box-shadow: 0 0 0 2px rgba($uops-primary-color, 0.12);
    }

    .tc-check {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid $uops-border-color;
      background: #fff;
      color: #fff;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    &.selected .tc-check {
      background: $uops-primary-color;
      border-color: $uops-primary-color;
    }

    .tc-icon {
      font-size: 26px;
      margin-bottom: $uops-spacing-sm;
    }

    .tc-name {
      font-size: 15px;
      font-weight: 600;
      color: $uops-text-primary;
      margin-bottom: $uops-spacing-xs;
    }

    .tc-desc {
      font-size: $font-size-label;
      line-height: 1.6;
      color: $uops-text-secondary;
    }
  }
}

// 实例固化：无需判定规则提示
.no-rule-note {
  display: flex;
  align-items: center;
  gap: $uops-spacing-sm;
  padding: $uops-spacing-sm $uops-spacing-md;
  background: $uops-bg-nested;
  border-radius: $uops-radius-sm;
  border-left: 3px solid $uops-border-color;

  .nr-title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $uops-text-primary;
    white-space: nowrap;
  }

  .nr-text {
    font-size: $font-size-label;
    color: $uops-text-placeholder;
  }
}
</style>
