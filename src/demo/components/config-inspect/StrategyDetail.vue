<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  checkItems,
  components,
  CROSS_CENTER_MAP,
  getMachinesByStrategy,
  RISK_LEVEL_MAP,
  TAGS_MAP,
  type InspectComponent,
  type InspectItem,
  type InspectStrategy,
  type MachineInfo,
} from '~/demo/mock/config-inspect'

const props = defineProps<{
  mode: 'view' | 'edit' | 'add'
  strategy: InspectStrategy | null
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

// 弹窗可见状态（defineModel 直接同步父组件 v-model:visible）
const visible = defineModel<boolean>('visible', { default: false })

const isReadonly = computed(() => props.mode === 'view')
const dialogTitle = computed(() => ({ view: '策略详情', edit: '编辑策略', add: '新增策略' })[props.mode])

// ==================== 表单 ====================
const form = ref({
  strategy_name: '',
  tags: '01',
  category_id: 'linux',
  exec_type: '0',
  test_ip: '',
  osKeywords: [] as string[],
  ips: [] as string[],
  keywordInput: '',
  ipInput: '',
})

const selectedComponents = ref<InspectComponent[]>([])
const componentOptions = computed(() => components.filter(c => c.status === '1'))

watch(visible, (val) => {
  if (val && props.strategy) {
    const s = props.strategy
    let scope: { osKeyword?: string[], ips?: string[] } = {}
    try {
      scope = JSON.parse(s.inspect_scope || '{}')
    }
    catch {
      scope = {}
    }
    form.value = {
      strategy_name: s.strategy_name,
      tags: s.tags,
      category_id: s.category_id,
      exec_type: s.exec_type,
      test_ip: s.test_ip,
      osKeywords: scope.osKeyword || [],
      ips: scope.ips || [],
      keywordInput: '',
      ipInput: '',
    }
    selectedComponents.value = components.filter(c => c.strategy_id === s.strategy_id)
  }
  else if (val) {
    form.value = { strategy_name: '', tags: '01', category_id: 'linux', exec_type: '0', test_ip: '', osKeywords: [], ips: [], keywordInput: '', ipInput: '' }
    selectedComponents.value = []
  }
})

// ==================== 资源范围 ====================
const matchedMachines = computed<MachineInfo[]>(() => {
  if (props.strategy && props.mode !== 'add')
    return getMachinesByStrategy(props.strategy)
  if (form.value.osKeywords.some(k => k.toLowerCase().includes('linux')))
    return getMachinesByStrategy({ inspect_scope: JSON.stringify({ osKeyword: ['os_type=Linux'] }) } as InspectStrategy)
  return []
})

function addKeyword() {
  const v = form.value.keywordInput.trim()
  if (v && !form.value.osKeywords.includes(v))
    form.value.osKeywords.push(v)
  form.value.keywordInput = ''
}

function addIp() {
  const v = form.value.ipInput.trim()
  if (v && !form.value.ips.includes(v))
    form.value.ips.push(v)
  form.value.ipInput = ''
}

// ==================== 检查项清单 ====================
const itemsLoading = ref(false)
const itemsLoaded = ref(false)
const itemList = ref<InspectItem[]>([])
const expandedItems = ref<string[]>([])

function fetchCheckItems() {
  if (!form.value.test_ip) {
    ElMessage.warning('请先填写测试IP')
    return
  }
  itemsLoading.value = true
  itemsLoaded.value = false
  // 模拟调用 automation 获取检查项清单
  setTimeout(() => {
    const compIds = selectedComponents.value.map(c => c.component_id)
    itemList.value = checkItems.filter(i => compIds.includes(i.component_id))
    itemsLoading.value = false
    itemsLoaded.value = true
    ElMessage.success(`从 ${form.value.test_ip} 获取到 ${itemList.value.length} 个检查项`)
  }, 1200)
}

// ==================== 组件参数 ====================
function getParams(comp: InspectComponent) {
  try {
    return JSON.parse(comp.param_json || '[]')
  }
  catch {
    return []
  }
}

// ==================== AI 智能分析 ====================
const aiAnalyzing = ref(false)
function handleAiAnalysis() {
  aiAnalyzing.value = true
  setTimeout(() => {
    aiAnalyzing.value = false
    ElMessage.success('智能分析完成：建议将检查项按风险等级分组执行，高风险项优先（demo模拟）')
  }, 2000)
}

// ==================== 保存 ====================
function handleSave() {
  if (!form.value.strategy_name) {
    ElMessage.warning('请填写策略名称')
    return
  }
  emit('saved')
}

function riskTagType(level: string) {
  return ({ '01': 'info', '02': 'warning', '03': 'danger' } as Record<string, string>)[level] || 'info'
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="1060px"
    top="4vh"
    destroy-on-close
  >
    <div class="sd-body">
      <!-- 基本信息 -->
      <div class="sd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />基本信息
        </div>
        <el-form label-width="90px" :disabled="isReadonly" class="sd-form">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="策略名称" required>
                <el-input v-model="form.strategy_name" placeholder="请输入策略名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签">
                <el-select v-model="form.tags" class="w-full">
                  <el-option v-for="(label, key) in TAGS_MAP" :key="key" :label="label" :value="key" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属分类">
                <el-cascader
                  v-model="form.category_id"
                  :options="[
                    { value: 'linux', label: '基础操作库 / 系统条线 / 操作系统 / Linux' },
                    { value: 'windows', label: '基础操作库 / 系统条线 / 操作系统 / Windows' },
                    { value: 'oracle', label: '基础操作库 / 系统条线 / 数据库 / Oracle' },
                    { value: 'mysql', label: '基础操作库 / 系统条线 / 数据库 / MySQL' },
                    { value: 'gaussdb', label: '基础操作库 / 系统条线 / 数据库 / GaussDB' },
                    { value: 'tonglinkq', label: '基础操作库 / 系统条线 / 中间件 / TongLinkQ' },
                    { value: 'redis', label: '基础操作库 / 系统条线 / 中间件 / Redis' },
                  ]"
                  :props="{ emitPath: false }"
                  class="w-full"
                  placeholder="请选择分类"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="执行方式">
                <el-radio-group v-model="form.exec_type">
                  <el-radio value="0">代理端执行</el-radio>
                  <el-radio value="1">服务端执行</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 关联组件 -->
      <div class="sd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />关联组件
          <el-button v-if="!isReadonly" type="primary" link size="small" class="ml-8px" @click="ElMessage.info('组件选择器（demo模拟）')">
            <i-ep-plus class="mr-2px" />添加组件
          </el-button>
          <el-button type="primary" link size="small" :loading="aiAnalyzing" @click="handleAiAnalysis">
            <i-ep-magic-stick class="mr-2px" />巡检组件智能分析
          </el-button>
        </div>
        <el-table :data="selectedComponents" size="small" class="sd-comp-table">
          <el-table-column prop="component_code" label="组件编码" min-width="240" />
          <el-table-column prop="component_name" label="组件名称" min-width="280" />
          <el-table-column prop="component_version" label="版本" width="60" align="center" />
          <el-table-column prop="exec_type" label="执行方式" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.exec_type === '0' ? '' : 'warning'" effect="plain">
                {{ row.exec_type === '0' ? '代理端' : '服务端' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="参数" min-width="200">
            <template #default="{ row }">
              <template v-if="getParams(row).length">
                <el-tag v-for="p in getParams(row)" :key="p.name" size="small" class="mr-4px mb-2px" effect="plain">
                  {{ p.name }}: {{ p.value || p.description }}
                </el-tag>
              </template>
              <span v-else class="sd-empty-text">无参数</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 资源范围 -->
      <div class="sd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />资源范围
          <span class="ci-section-hint">（来源：CMDB，demo 模拟匹配 {{ matchedMachines.length }} 台机器）</span>
        </div>
        <div class="sd-scope-cards">
          <div class="sd-scope-card">
            <div class="sd-scope-card-title">
              <i-ep-collection-tag class="mr-4px" />OS属性关键字
            </div>
            <div class="sd-scope-card-body">
              <el-tag
                v-for="kw in form.osKeywords"
                :key="kw"
                :closable="!isReadonly"
                class="sd-scope-tag"
                @close="form.osKeywords = form.osKeywords.filter(k => k !== kw)"
              >
                {{ kw }}
              </el-tag>
              <el-input
                v-if="!isReadonly"
                v-model="form.keywordInput"
                size="small"
                placeholder="输入关键字后回车"
                class="sd-scope-input"
                @keyup.enter="addKeyword"
              />
              <span v-if="!form.osKeywords.length && isReadonly" class="sd-empty-text">未配置</span>
            </div>
          </div>
          <div class="sd-scope-card">
            <div class="sd-scope-card-title">
              <i-ep-monitor class="mr-4px" />实例IP
            </div>
            <div class="sd-scope-card-body">
              <el-tag
                v-for="ip in form.ips"
                :key="ip"
                type="success"
                :closable="!isReadonly"
                class="sd-scope-tag"
                @close="form.ips = form.ips.filter(i => i !== ip)"
              >
                {{ ip }}
              </el-tag>
              <el-input
                v-if="!isReadonly"
                v-model="form.ipInput"
                size="small"
                placeholder="输入IP后回车"
                class="sd-scope-input"
                @keyup.enter="addIp"
              />
              <span v-if="!form.ips.length && isReadonly" class="sd-empty-text">未配置（按关键字匹配全部）</span>
            </div>
          </div>
        </div>
        <!-- 匹配机器网格 -->
        <div class="sd-machine-grid">
          <div v-for="m in matchedMachines.slice(0, 9)" :key="m.host_name" class="ci-machine-card">
            <div class="ci-machine-name">{{ m.host_name }}</div>
            <div class="ci-machine-ip">{{ m.ip }}</div>
            <div class="sd-machine-meta">
              <el-tag size="small" effect="plain">{{ m.resource_type }}</el-tag>
            </div>
          </div>
          <div v-if="matchedMachines.length > 9" class="ci-machine-card sd-machine-more">
            +{{ matchedMachines.length - 9 }} 台
          </div>
        </div>
      </div>

      <!-- 测试IP + 检查项清单 -->
      <div class="sd-section">
        <div class="ci-section-title">
          <span class="ci-section-dot" />检查项清单
        </div>
        <div class="sd-testip-row">
          <span class="sd-testip-label">测试IP：</span>
          <el-input v-model="form.test_ip" :disabled="isReadonly" placeholder="用于获取检查项清单" class="sd-testip-input" />
          <el-button type="primary" :loading="itemsLoading" :disabled="isReadonly && itemsLoaded" @click="fetchCheckItems">
            <i-ep-download class="mr-4px" />获取检查项清单
          </el-button>
        </div>

        <el-table
          v-if="itemsLoaded || isReadonly"
          :data="isReadonly && !itemsLoaded ? checkItems.filter(i => selectedComponents.some(c => c.component_id === i.component_id)) : itemList"
          size="small"
          row-key="check_name"
          :expand-row-keys="expandedItems"
          class="sd-item-table"
          @expand-change="(row: InspectItem, expanded: InspectItem[]) => expandedItems = expanded.map(r => r.check_name)"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="sd-item-expand">
                <div class="sd-item-expand-row">
                  <span class="sd-item-expand-label">治理说明：</span>{{ row.govern_desc || '—' }}
                </div>
                <div class="sd-item-expand-row">
                  <span class="sd-item-expand-label">治理组件：</span>
                  <template v-if="row.govern_component_name">
                    {{ row.govern_component_name }} (v{{ row.govern_component_version }})
                  </template>
                  <span v-else class="sd-empty-text">未关联</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="check_name" label="检查项名称" min-width="300" show-overflow-tooltip />
          <el-table-column prop="obj_name" label="检查对象" width="160" show-overflow-tooltip />
          <el-table-column prop="std_value" label="标准值" min-width="180" show-overflow-tooltip />
          <el-table-column prop="baseline_no" label="基线编号" width="110" />
          <el-table-column prop="cross_center" label="跨中心" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.cross_center === 'N' ? 'info' : 'warning'" effect="plain">
                {{ CROSS_CENTER_MAP[row.cross_center] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="risk_level" label="风险等级" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="riskTagType(row.risk_level) as any" effect="light">
                {{ RISK_LEVEL_MAP[row.risk_level] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="govern_deadline" label="治理期限(天)" width="100" align="center" />
        </el-table>
        <el-empty v-else description="请填写测试IP并点击「获取检查项清单」" :image-size="60" />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ isReadonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!isReadonly" type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.sd-body {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
}
.sd-section {
  margin-bottom: 24px;
}
.sd-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
.sd-comp-table {
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}
.sd-empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.sd-scope-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.sd-scope-card {
  background: var(--uops-bg-card-small);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--uops-radius-card-sm);
  padding: 10px 12px;
  transition: border-color 0.2s;
}
.sd-scope-card:hover {
  border-color: var(--el-color-primary-light-3);
}
.sd-scope-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}
.sd-scope-card-body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 28px;
}
.sd-scope-tag {
  margin: 0;
}
.sd-scope-input {
  width: 160px;
}
.sd-machine-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.sd-machine-more {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  background: var(--uops-bg-list-nested);
}
.sd-testip-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.sd-testip-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.sd-testip-input {
  width: 220px;
}
.sd-item-table {
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}
.sd-item-expand {
  padding: 8px 16px;
}
.sd-item-expand-row {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}
.sd-item-expand-label {
  color: var(--el-text-color-placeholder);
}
</style>
