import type {
  ApiBodyFormat,
  ComponentMode,
  ComponentScene,
  CustomComponentForm,
  CustomDraft,
  InstanceForm,
  OperationCategory,
  OperationSnapshot,
  RiskInfo,
} from '~/demo/types/workbench'
import { ElMessage } from 'element-plus'
/**
 * 操作工作台 - 应用定制组件入库 composable
 *
 * 职责：「新增操作」三步弹窗的全部表单状态与业务逻辑。
 * - 定制模式：Step1 基本信息（分类→风险反显、大类→平台自动赋值）
 *             Step2 模板编辑（脚本语法高亮 / API HTTP(S)+TCP、JSON↔form-urlencoded、变量提取→参数同步）
 *             Step3 确认预览
 * - 实例固化模式：按来源类型分流
 *     执行脚本类公共组件 → 操作分类可选（复用定制模式列表）+ 风险反显 + 成功判定规则必填
 *     其他公共操作       → 操作分类继承来源（只读）+ 无需成功判定规则
 *
 * 交互原型对照：docs/prototypes/应用定制组件入库-交互原型.html v1.5
 */
import { computed, reactive, ref, watch } from 'vue'
import { mockPublicSources } from '~/demo/mock/workbench-extra'
import { CATEGORY_NAMES, RISK_MAP, SCRIPT_SUBTYPES } from '~/demo/types/workbench'
import { extractTemplateVars, genRowId } from './utils'
import { formToSnapshot, snapshotToForm } from './version-utils'

/** 默认脚本示例（与原型一致） */
const DEFAULT_SCRIPT = `#!/bin/bash
# 检查指定集群的节点状态（注释高亮演示）
echo "检查集群 \${cluster_id} 状态"
kubectl get nodes --context \${env}
exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo "SUCCESS"
else
  echo "FAILED: exit_code=$exit_code"
fi`

const DEFAULT_API_JSON = `{
  "app": "{{app_name}}",
  "version": "{{version}}",
  "force": false
}`

function createCustomForm(): CustomComponentForm {
  return {
    servicename: '',
    servicecnname: '',
    category: '',
    timeout: 300,
    description: '',
    tplCategory: '',
    scriptSubtype: '1',
    scriptContent: DEFAULT_SCRIPT,
    scriptSuccessFlag: '',
    apiSubtype: 'http',
    apiProtocol: 'https',
    apiMethod: 'POST',
    apiUrl: 'deploy.internal.com/api/v1/deploy',
    apiHeaders: [
      { id: genRowId('hd'), key: 'Content-Type', value: 'application/json' },
      { id: genRowId('hd'), key: 'Authorization', value: 'Bearer {{token}}' },
    ],
    apiBodyFormat: 'json',
    apiBodyJson: DEFAULT_API_JSON,
    apiFormRows: [
      { id: genRowId('fm'), key: 'app', value: '{{app_name}}' },
      { id: genRowId('fm'), key: 'action', value: 'deploy' },
    ],
    tcpHost: '10.0.1.100',
    tcpPort: '6379',
    tcpContent: 'PING {{cluster_id}}',
    apiSuccessFlag: 'response.code==200 && response.body.status==\'ok\'',
    parms: [],
  }
}

function createInstanceForm(): InstanceForm {
  return {
    sourceId: '',
    instanceName: '',
    category: '',
    successRule: '',
    description: '',
    fixValues: {},
  }
}

export function useCustomComponent() {
  // ============ 弹窗与步骤 ============
  const showComponentDialog = ref(false)
  const componentMode = ref<ComponentMode>('custom')
  const componentStep = ref(1)

  // ============ 场景状态（新建 / 编辑 / 查看草稿） ============
  const componentScene = ref<ComponentScene>('create')
  /** 编辑场景：来源操作 ID（op0901-1） */
  const editOperationId = ref('')
  /** 编辑场景：来源操作名称（横幅展示用） */
  const editOperationName = ref('')
  /** 编辑场景：基线版本号（提交时冲突检测用） */
  const baseVersionNo = ref(0)
  /** 草稿场景：草稿 ID */
  const draftId = ref('')
  /** 草稿场景：草稿状态（rejected → 允许修改后重新提交） */
  const draftStatus = ref<CustomDraft['status']>('draft')

  /** 是否处于编辑类场景（编辑已发布操作 / 编辑草稿） */
  const isEditScene = computed(() => componentScene.value !== 'create')
  /** 弹窗标题 */
  const dialogTitle = computed(() => {
    if (componentScene.value === 'editPublished')
      return '编辑操作'
    if (componentScene.value === 'editDraft')
      return '编辑草稿'
    if (componentScene.value === 'viewDraft')
      return '查看草稿'
    return '新增操作'
  })
  /** 草稿是否只读（查看草稿场景不可修改） */
  const isDraftReadonly = computed(() => componentScene.value === 'viewDraft')
  /** 当前表单的基线快照（编辑场景打开时固化，用于 Step3 变更摘要与提交 diff） */
  const baseSnapshot = ref<OperationSnapshot | null>(null)

  // ============ 表单状态 ============
  const customForm = reactive<CustomComponentForm>(createCustomForm())
  const instanceForm = reactive<InstanceForm>(createInstanceForm())

  // ============ 来源公共组件（实例固化） ============
  const publicSources = mockPublicSources
  const sourceComponent = computed(() =>
    publicSources.find(s => s.id === instanceForm.sourceId) || null,
  )
  /** 来源是否为执行脚本类公共组件 */
  const sourceIsScript = computed(() => sourceComponent.value?.isScript ?? false)

  // ============ 定制模式派生状态 ============
  /** 操作分类 → 风险等级（定制模式 + 实例固化脚本类共用） */
  const customRisk = computed<RiskInfo | null>(() =>
    customForm.category ? RISK_MAP[customForm.category as OperationCategory] : null,
  )
  /** 实例固化（脚本类）选择分类后的风险 */
  const instanceRisk = computed<RiskInfo | null>(() =>
    instanceForm.category ? RISK_MAP[instanceForm.category as OperationCategory] : null,
  )
  /** 实例固化（非脚本类）继承来源的分类名 */
  const inheritCategoryName = computed(() =>
    sourceComponent.value ? CATEGORY_NAMES[sourceComponent.value.category] : '-',
  )
  /** 实例固化（非脚本类）继承来源的分类风险（用于徽章着色） */
  const inheritCategoryRisk = computed<RiskInfo | null>(() =>
    sourceComponent.value ? RISK_MAP[sourceComponent.value.category] : null,
  )
  /** 平台类型：脚本类→01-Linux，API类→空值（自动赋值，无需手选） */
  const platformBadge = computed(() => {
    if (customForm.tplCategory === 'script')
      return { text: '01-Linux（自动赋值）', type: 'success' as const }
    if (customForm.tplCategory === 'api')
      return { text: '空值（API类无需平台）', type: 'info' as const }
    return { text: '待选择模板大类', type: 'info' as const }
  })
  const currentScriptSubtype = computed(() =>
    SCRIPT_SUBTYPES.find(s => s.value === customForm.scriptSubtype) || SCRIPT_SUBTYPES[0],
  )

  // ============ 变量提取 → 参数同步 ============
  /** 当前模板内容中提取到的变量（脚本 ${var} / API {{var}}） */
  const extractedVars = computed<string[]>(() => {
    if (customForm.tplCategory === 'script') {
      return extractTemplateVars(customForm.scriptContent, 'script')
    }
    if (customForm.tplCategory === 'api') {
      let content: string
      if (customForm.apiSubtype === 'tcp') {
        content = `${customForm.tcpHost} ${customForm.tcpPort} ${customForm.tcpContent}`
      }
      else {
        content = customForm.apiUrl
        customForm.apiHeaders.forEach((h) => {
          content += ` ${h.key} ${h.value}`
        })
        content += customForm.apiBodyFormat === 'json'
          ? ` ${customForm.apiBodyJson}`
          : customForm.apiFormRows.map(r => ` ${r.key} ${r.value}`).join('')
      }
      return extractTemplateVars(content, 'api')
    }
    return []
  })

  /**
   * 提取变量 → 参数表双向同步：
   * - 新变量自动追加行（来源=模板提取）
   * - 模板中已删除的变量行标记为待清理（不自动删除，由用户确认）
   */
  function syncParmsFromTemplate() {
    const vars = extractedVars.value
    // 追加新变量
    vars.forEach((v) => {
      if (!customForm.parms.some(p => p.name === v)) {
        customForm.parms.push({
          id: genRowId('parm'),
          name: v,
          cnName: '',
          ctrlType: '0',
          presetValue: '',
          validateRule: '',
          encrypted: false,
          source: 'template',
        })
      }
    })
    // 模板提取的行若变量已消失 → 回退为手动来源（保留数据，避免误删用户填写的内容）
    customForm.parms.forEach((p) => {
      if (p.source === 'template' && !vars.includes(p.name)) {
        p.source = 'manual'
      }
    })
  }
  watch(extractedVars, syncParmsFromTemplate)

  // ============ 参数表操作 ============
  function addManualParm() {
    customForm.parms.push({
      id: genRowId('parm'),
      name: '',
      cnName: '',
      ctrlType: '0',
      presetValue: '',
      validateRule: '',
      encrypted: false,
      source: 'manual',
    })
  }
  function removeParm(id: string) {
    customForm.parms = customForm.parms.filter(p => p.id !== id)
  }
  function addHeaderRow() {
    customForm.apiHeaders.push({ id: genRowId('hd'), key: '', value: '' })
  }
  function removeHeaderRow(id: string) {
    customForm.apiHeaders = customForm.apiHeaders.filter(h => h.id !== id)
  }
  function addFormRow() {
    customForm.apiFormRows.push({ id: genRowId('fm'), key: '', value: '' })
  }
  function removeFormRow(id: string) {
    customForm.apiFormRows = customForm.apiFormRows.filter(r => r.id !== id)
  }

  /** 报文格式切换（JSON ↔ x-www-form-urlencoded），联动 Content-Type */
  function switchBodyFormat(fmt: ApiBodyFormat) {
    customForm.apiBodyFormat = fmt
    const ct = customForm.apiHeaders.find(h => h.key.toLowerCase() === 'content-type')
    if (ct) {
      ct.value = fmt === 'json' ? 'application/json' : 'application/x-www-form-urlencoded'
    }
  }

  // ============ 实例固化：来源切换联动 ============
  function handleInstanceSourceChange(sourceId: string) {
    instanceForm.sourceId = sourceId
    const src = sourceComponent.value
    if (!src) {
      instanceForm.instanceName = ''
      instanceForm.category = ''
      instanceForm.successRule = ''
      instanceForm.fixValues = {}
      return
    }
    instanceForm.instanceName = `${src.name.replace(/（.*）/, '')}-生产环境-01`
    instanceForm.category = ''
    instanceForm.successRule = ''
    instanceForm.fixValues = {}
    src.params.forEach((p) => {
      // 单选类控件默认选中第一个选项（与原型一致）
      instanceForm.fixValues[p.name] = p.ctrlType === '1' && p.presetValue ? p.presetValue.split(',')[0] : ''
    })
    ElMessage.success(`已加载「${src.name}」${src.isScript ? '（执行脚本类）' : '（非脚本类）'}的 ${src.params.length} 个参数定义`)
  }

  // ============ 步骤校验 ============
  function validateStep1(): boolean {
    if (componentMode.value === 'custom') {
      if (!customForm.servicename.trim()) {
        ElMessage.warning('请输入操作名称(英文)')
        return false
      }
      if (!/^\w{1,200}$/.test(customForm.servicename.trim())) {
        ElMessage.warning('操作名称(英文)仅支持字母/数字/下划线，≤200字符')
        return false
      }
      if (!customForm.servicecnname.trim()) {
        ElMessage.warning('请输入操作名称(中文)')
        return false
      }
      if (!customForm.category) {
        ElMessage.warning('请选择操作分类')
        return false
      }
      if (!customForm.tplCategory) {
        ElMessage.warning('请选择模板大类（脚本类 / API类）')
        return false
      }
    }
    else {
      if (!instanceForm.sourceId) {
        ElMessage.warning('请选择来源公共组件')
        return false
      }
      if (!instanceForm.instanceName.trim()) {
        ElMessage.warning('请填写实例名称')
        return false
      }
      if (sourceIsScript.value) {
        if (!instanceForm.category) {
          ElMessage.warning('请选择操作分类')
          return false
        }
        if (!instanceForm.successRule.trim()) {
          ElMessage.warning('成功判定规则为必填（执行脚本类）')
          return false
        }
      }
    }
    return true
  }

  function validateStep2(): boolean {
    if (componentMode.value !== 'custom')
      return true
    if (customForm.tplCategory === 'api') {
      if (!customForm.apiSuccessFlag.trim()) {
        ElMessage.warning('API类成功判定规则为必填（写入 successflag）')
        return false
      }
    }
    else {
      if (!customForm.scriptContent.trim()) {
        ElMessage.warning('模板内容不能为空')
        return false
      }
    }
    return true
  }

  // ============ 步骤导航 ============
  function nextComponentStep() {
    if (componentStep.value === 1 && !validateStep1())
      return
    if (componentStep.value === 2 && !validateStep2())
      return
    if (componentStep.value < 3)
      componentStep.value++
  }
  function prevComponentStep() {
    if (componentStep.value > 1)
      componentStep.value--
  }
  function gotoComponentStep(n: number) {
    if (n < componentStep.value)
      componentStep.value = n
  }

  // ============ 模式切换 ============
  function switchComponentMode(mode: ComponentMode) {
    if (componentMode.value === mode)
      return
    componentMode.value = mode
    componentStep.value = 1
  }

  // ============ 打开 / 关闭 / 重置 ============
  function openComponentDialog() {
    resetComponentForm()
    showComponentDialog.value = true
  }

  /**
   * 编辑已发布操作：从版本快照预填表单，固化基线版本号。
   * 提交时走 submitEditPublish → 基线冲突检测 → 发布新版本。
   */
  function openEditPublished(op: { id: string, name: string, versionNo?: number }, snapshot: OperationSnapshot) {
    resetComponentForm()
    componentScene.value = 'editPublished'
    editOperationId.value = op.id
    editOperationName.value = op.name
    baseVersionNo.value = op.versionNo ?? 0
    Object.assign(customForm, snapshotToForm(snapshot))
    baseSnapshot.value = { ...snapshot }
    showComponentDialog.value = true
  }

  /**
   * 编辑/查看草稿：从草稿快照预填表单。
   * - editDraft：可修改，提交走 submitEditPublish
   * - viewDraft：只读预览
   */
  function openDraftScene(draft: CustomDraft, scene: 'editDraft' | 'viewDraft') {
    resetComponentForm()
    componentScene.value = scene
    draftId.value = draft.id
    draftStatus.value = draft.status
    editOperationId.value = draft.sourceOperationId ?? ''
    editOperationName.value = draft.name
    baseVersionNo.value = draft.baseVersionNo ?? 0
    if (draft.snapshot) {
      // 草稿快照是完整表单，直接回填
      Object.assign(customForm, draft.snapshot)
      baseSnapshot.value = formToSnapshot(customForm)
    }
    showComponentDialog.value = true
  }

  function resetComponentForm() {
    Object.assign(customForm, createCustomForm())
    Object.assign(instanceForm, createInstanceForm())
    componentMode.value = 'custom'
    componentStep.value = 1
    componentScene.value = 'create'
    editOperationId.value = ''
    editOperationName.value = ''
    baseVersionNo.value = 0
    draftId.value = ''
    draftStatus.value = 'draft'
    baseSnapshot.value = null
  }
  function handleComponentDialogClose() {
    resetComponentForm()
  }

  // ============ 保存草稿 / 提交 ============
  function saveComponentDraft(customDrafts: { value: CustomDraft[] }) {
    const name = componentMode.value === 'custom'
      ? (customForm.servicecnname || customForm.servicename || '未命名定制操作')
      : (instanceForm.instanceName || '未命名实例')

    // 编辑草稿场景 → 更新已有草稿
    if (componentScene.value === 'editDraft' && draftId.value) {
      const existing = customDrafts.value.find(d => d.id === draftId.value)
      if (existing) {
        existing.name = `${name}（${componentMode.value === 'custom' ? '定制' : '实例固化'}）`
        existing.saveTime = new Date().toLocaleString()
        existing.snapshot = { ...customForm }
        showComponentDialog.value = false
        ElMessage.success('草稿已更新')
        return
      }
    }

    // 新建 / 编辑已发布操作 → 创建新草稿
    customDrafts.value.unshift({
      id: `draft_${Date.now()}`,
      name: `${name}（${componentMode.value === 'custom' ? '定制' : '实例固化'}）`,
      saveTime: new Date().toLocaleString(),
      status: 'draft',
      sourceOperationId: editOperationId.value || undefined,
      baseVersionNo: baseVersionNo.value || undefined,
      snapshot: { ...customForm },
    })
    showComponentDialog.value = false
    ElMessage.success('已保存草稿，可在「我的草稿」中查看')
  }

  /**
   * 提交组件：
   * - 新建场景 → 直接提交入库
   * - 编辑场景 → 返回 { snapshot, baseVersionNo, operationId } 供 useWorkbench 走冲突检测发布流程
   */
  function submitComponent(): { snapshot: OperationSnapshot, baseVersionNo: number, operationId: string } | null {
    const name = componentMode.value === 'custom'
      ? customForm.servicecnname || customForm.servicename
      : instanceForm.instanceName

    if (isEditScene.value && editOperationId.value) {
      const snapshot = formToSnapshot(customForm)
      showComponentDialog.value = false
      return { snapshot, baseVersionNo: baseVersionNo.value, operationId: editOperationId.value }
    }

    showComponentDialog.value = false
    ElMessage.success(`「${name}」已提交，审批通过后正式入库（审批走外部工单系统）`)
    return null
  }

  return {
    // 状态
    showComponentDialog,
    componentMode,
    componentStep,
    customForm,
    instanceForm,
    publicSources,
    // 场景
    componentScene,
    isEditScene,
    dialogTitle,
    isDraftReadonly,
    editOperationId,
    editOperationName,
    baseVersionNo,
    baseSnapshot,
    // 派生
    sourceComponent,
    sourceIsScript,
    customRisk,
    instanceRisk,
    inheritCategoryName,
    inheritCategoryRisk,
    platformBadge,
    currentScriptSubtype,
    extractedVars,
    // 操作
    switchComponentMode,
    handleInstanceSourceChange,
    switchBodyFormat,
    addManualParm,
    removeParm,
    addHeaderRow,
    removeHeaderRow,
    addFormRow,
    removeFormRow,
    // 导航与校验
    nextComponentStep,
    prevComponentStep,
    gotoComponentStep,
    validateStep1,
    validateStep2,
    // 弹窗生命周期
    openComponentDialog,
    openEditPublished,
    openDraftScene,
    handleComponentDialogClose,
    saveComponentDraft,
    submitComponent,
  }
}
