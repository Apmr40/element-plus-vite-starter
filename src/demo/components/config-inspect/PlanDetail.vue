<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getComponentsByStrategy,
  getMachinesByStrategy,
  strategies,
  type InspectPlan,
  type InspectStrategy,
} from '~/demo/mock/config-inspect'

const props = defineProps<{
  mode: 'view' | 'edit' | 'add'
  plan: InspectPlan | null
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

// 弹窗可见状态（defineModel 直接同步父组件 v-model:visible）
const visible = defineModel<boolean>('visible', { default: false })

const isReadonly = computed(() => props.mode === 'view')
const dialogTitle = computed(() => ({ view: '计划详情', edit: '编辑计划', add: '新增计划' })[props.mode])

// ==================== 表单 ====================
const form = ref({
  plan_name: '',
  tech_stack: 'linux',
  strategy_id: '',
  crontab: '0 0 18 * * ?',
  batch_size: 200,
  wait_time: 0,
  trial_times: 1,
  trial_ips: '',
})

const techStackOptions = [
  { value: 'linux', label: 'Linux' },
  { value: 'windows', label: 'Windows' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'gaussdb', label: 'GaussDB' },
  { value: 'tonglinkq', label: 'TongLinkQ' },
  { value: 'redis', label: 'Redis' },
]

// 技术栈筛选可选策略
const strategyOptions = computed(() =>
  strategies.filter(s => s.category_id === form.value.tech_stack && s.status === 'published'),
)

const selectedStrategy = computed<InspectStrategy | null>(() =>
  strategies.find(s => s.strategy_id === form.value.strategy_id) || null,
)

const relatedComponents = computed(() =>
  form.value.strategy_id ? getComponentsByStrategy(form.value.strategy_id) : [],
)

const matchedMachines = computed(() =>
  selectedStrategy.value ? getMachinesByStrategy(selectedStrategy.value) : [],
)

const scopeKeywords = computed(() => {
  if (!selectedStrategy.value)
    return []
  try {
    return JSON.parse(selectedStrategy.value.inspect_scope || '{}').osKeyword || []
  }
  catch {
    return []
  }
})

watch(visible, (val) => {
  if (val && props.plan) {
    const p = props.plan
    const stg = strategies.find(s => s.strategy_id === p.strategy_id)
    form.value = {
      plan_name: p.plan_name,
      tech_stack: stg?.category_id || 'linux',
      strategy_id: p.strategy_id,
      crontab: p.crontab,
      batch_size: Number(p.batch_size),
      wait_time: Number(p.wait_time),
      trial_times: Number(p.trial_times),
      trial_ips: p.trial_ips,
    }
  }
  else if (val) {
    form.value = { plan_name: '', tech_stack: 'linux', strategy_id: '', crontab: '0 0 18 * * ?', batch_size: 200, wait_time: 0, trial_times: 1, trial_ips: '' }
  }
})

// 技术栈切换时清空策略
function handleTechStackChange() {
  form.value.strategy_id = ''
}

// 选择策略后自动填充计划名称
function handleStrategyChange() {
  const stg = strategies.find(s => s.strategy_id === form.value.strategy_id)
  if (stg && !props.plan)
    form.value.plan_name = `${stg.strategy_name}-`
}

// ==================== 保存 ====================
function handleSave() {
  if (!form.value.plan_name) {
    ElMessage.warning('请填写计划名称')
    return
  }
  if (!form.value.strategy_id) {
    ElMessage.warning('请选择关联策略')
    return
  }
  emit('saved')
}

// Cron 预设
const cronPresets = [
  { label: '每天18:00', value: '0 0 18 * * ?' },
  { label: '每天02:00', value: '0 0 2 * * ?' },
  { label: '每周一03:00', value: '0 0 3 ? * MON' },
  { label: '每月1号04:00', value: '0 0 4 1 * ?' },
]
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    top="4vh"
    destroy-on-close
  >
    <div class="pd-body">
      <el-form label-width="110px" :disabled="isReadonly" class="pd-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="计划名称" required>
              <el-input v-model="form.plan_name" placeholder="建议格式：策略名-部门名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技术栈" required>
              <el-select v-model="form.tech_stack" class="w-full" @change="handleTechStackChange">
                <el-option v-for="t in techStackOptions" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联策略" required>
              <el-select
                v-model="form.strategy_id"
                class="w-full"
                filterable
                placeholder="先选择技术栈，再选择策略"
                @change="handleStrategyChange"
              >
                <el-option
                  v-for="s in strategyOptions"
                  :key="s.strategy_id"
                  :label="s.strategy_name"
                  :value="s.strategy_id"
                >
                  <span>{{ s.strategy_name }}</span>
                  <el-tag v-if="s.strategy_type === '01'" size="small" class="ml-6px" effect="plain">公共</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="巡检周期" required>
              <div class="pd-cron-row">
                <el-input v-model="form.crontab" placeholder="Cron表达式" class="pd-cron-input" />
                <el-dropdown trigger="click" :disabled="isReadonly" @command="(v: string) => form.crontab = v">
                  <el-button>
                    常用<i-ep-arrow-down class="ml-4px" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="p in cronPresets" :key="p.value" :command="p.value">
                        {{ p.label }} <code class="pd-cron-code">{{ p.value }}</code>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 关联组件（只读，来自策略） -->
      <div class="pd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />关联组件
          <span class="ci-section-hint">（由策略自动带入，不可修改）</span>
        </div>
        <div v-if="relatedComponents.length" class="pd-comp-tags">
          <el-tag v-for="c in relatedComponents" :key="c.component_id" class="pd-comp-tag" effect="plain">
            <i-ep-box class="mr-4px" />{{ c.component_name }} (v{{ c.component_version }})
          </el-tag>
        </div>
        <el-empty v-else description="请先选择关联策略" :image-size="40" />
      </div>

      <!-- 资源范围（只读，来自策略） -->
      <div class="pd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />资源范围
          <span class="ci-section-hint">（由策略定义，共匹配 {{ matchedMachines.length }} 台机器）</span>
        </div>
        <div v-if="selectedStrategy" class="pd-scope">
          <div class="pd-scope-keywords">
            <el-tag v-for="kw in scopeKeywords" :key="kw" size="small" class="mr-6px">
              {{ kw }}
            </el-tag>
            <span v-if="!scopeKeywords.length" class="pd-empty">未配置关键字</span>
          </div>
          <div class="pd-machine-strip">
            <div v-for="m in matchedMachines.slice(0, 10)" :key="m.host_name" class="ci-machine-card">
              <span class="ci-machine-name">{{ m.host_name }}</span>
              <span class="ci-machine-ip">{{ m.ip }}</span>
            </div>
            <div v-if="matchedMachines.length > 10" class="ci-machine-card pd-machine-chip-more">
              +{{ matchedMachines.length - 10 }} 台
            </div>
          </div>
        </div>
        <el-empty v-else description="请先选择关联策略" :image-size="40" />
      </div>

      <!-- 执行参数 -->
      <div class="pd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />执行参数
        </div>
        <el-form label-width="110px" :disabled="isReadonly" class="pd-form">
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="每批次机器数">
                <el-input-number v-model="form.batch_size" :min="1" :max="1000" controls-position="right" class="w-full!" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="批次间等待">
                <el-input-number v-model="form.wait_time" :min="0" :max="3600" controls-position="right" class="w-full!">
                  <template #suffix>秒</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="试运行次数">
                <el-input-number v-model="form.trial_times" :min="0" :max="10" controls-position="right" class="w-full!" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="试运行范围">
                <el-input v-model="form.trial_ips" placeholder="试运行IP，多个用逗号分隔（留空则随机选取）" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="pd-exec-hint">
          <i-ep-info-filled class="mr-4px" />
          执行流程：automation 创建任务 → vortex 分批下发（每批 {{ form.batch_size }} 台，间隔 {{ form.wait_time }}s）→ 轮询结果 → 试运行 {{ form.trial_times }} 次通过后自动转常态化
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ isReadonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!isReadonly" type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.pd-body {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
}
.pd-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.pd-cron-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.pd-cron-input {
  flex: 1;
}
.pd-cron-code {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: 8px;
}
.pd-section {
  margin-bottom: 16px;
}
.pd-comp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pd-comp-tag {
  height: auto;
  padding: 6px 10px;
  white-space: normal;
  line-height: 1.4;
}
.pd-scope {
  background: var(--uops-bg-card-small);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--uops-radius-card-sm);
  padding: 12px;
}
.pd-scope-keywords {
  margin-bottom: 10px;
}
.pd-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.pd-machine-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pd-machine-chip-more {
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  background: var(--uops-bg-list-nested);
}
.pd-machine-chip-more:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--el-border-color);
}
.pd-exec-hint {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--uops-text-color-special);
  background: var(--uops-bg-card-large);
  border-radius: var(--el-border-radius-base);
  padding: 8px 12px;
  margin-top: 4px;
}
</style>
