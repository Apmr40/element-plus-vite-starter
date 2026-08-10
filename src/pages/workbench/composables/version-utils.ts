/**
 * 操作工作台 - 版本历史工具函数
 *
 * 职责：
 * - formToSnapshot：将当前表单序列化为版本快照（发布时调用）
 * - diffSnapshots：两个快照的字段级 diff（版本对比弹窗用）
 * - diffCodeLines：脚本行级 LCS diff（对比弹窗代码双栏用）
 * - computeChangeSummary：自动推算变更摘要（发布时写入 changeSummary）
 */
import type {
  CodeDiffLine,
  CustomComponentForm,
  DiffRow,
  OperationCategory,
  OperationSnapshot,
} from '~/demo/types/workbench'
import { CATEGORY_NAMES, RISK_MAP, SCRIPT_SUBTYPES } from '~/demo/types/workbench'

// ============ 快照字段定义（与原型 FIELDS 对齐） ============

export const SNAPSHOT_FIELDS: { key: keyof OperationSnapshot, label: string, isCode?: boolean }[] = [
  { key: 'nameEn', label: '操作名称(英文)' },
  { key: 'nameCn', label: '操作名称(中文)' },
  { key: 'category', label: '操作分类' },
  { key: 'risk', label: '风险等级' },
  { key: 'tplType', label: '模板大类' },
  { key: 'timeout', label: '超时时间' },
  { key: 'successFlag', label: '成功判定' },
  { key: 'script', label: '脚本内容', isCode: true },
  { key: 'description', label: '操作描述' },
]

// ============ 表单 → 快照序列化 ============

/** 模板大类展示名 */
function tplTypeLabel(form: CustomComponentForm): string {
  if (form.tplCategory === 'script') {
    const sub = SCRIPT_SUBTYPES.find(s => s.value === form.scriptSubtype)
    return `脚本 · ${sub?.label ?? 'Shell'}`
  }
  if (form.tplCategory === 'api') {
    return form.apiSubtype === 'tcp' ? 'API · TCP' : 'API · HTTP'
  }
  return '-'
}

/** API 类配置的文本摘要（写入快照 script 字段） */
function apiConfigSummary(form: CustomComponentForm): string {
  if (form.apiSubtype === 'tcp') {
    return `TCP ${form.tcpHost}:${form.tcpPort}\n${form.tcpContent}`
  }
  const lines = [`${form.apiMethod} ${form.apiProtocol}://${form.apiUrl}`]
  form.apiHeaders.forEach(h => lines.push(`${h.key}: ${h.value}`))
  if (form.apiBodyFormat === 'json') {
    lines.push('', form.apiBodyJson)
  }
  else {
    lines.push('', form.apiFormRows.map(r => `${r.key}=${r.value}`).join('&'))
  }
  return lines.join('\n')
}

/** 将当前表单序列化为版本快照 */
export function formToSnapshot(form: CustomComponentForm): OperationSnapshot {
  const isScript = form.tplCategory === 'script'
  return {
    nameEn: form.servicename,
    nameCn: form.servicecnname,
    category: form.category ? CATEGORY_NAMES[form.category] : '-',
    risk: form.category ? RISK_MAP[form.category].level : '-',
    tplType: tplTypeLabel(form),
    timeout: `${form.timeout} 秒`,
    successFlag: isScript ? form.scriptSuccessFlag : form.apiSuccessFlag,
    description: form.description,
    script: isScript ? form.scriptContent : apiConfigSummary(form),
  }
}

// ============ 字段级 diff ============

/** 比较两个快照，返回逐字段 diff 行 */
export function diffSnapshots(a: OperationSnapshot, b: OperationSnapshot): DiffRow[] {
  return SNAPSHOT_FIELDS.map(({ key, label, isCode }) => ({
    key,
    label,
    isCode: !!isCode,
    oldVal: a[key],
    newVal: b[key],
    changed: a[key] !== b[key],
  }))
}

/** 自动推算变更摘要（发布时写入版本记录） */
export function computeChangeSummary(a: OperationSnapshot, b: OperationSnapshot): string[] {
  const summary: string[] = []
  if (a.nameCn !== b.nameCn)
    summary.push(`操作名称 ${a.nameCn} → ${b.nameCn}`)
  if (a.category !== b.category)
    summary.push(`操作分类 ${a.category} → ${b.category}`)
  if (a.timeout !== b.timeout)
    summary.push(`超时时间 ${a.timeout} → ${b.timeout}`)
  if (a.successFlag !== b.successFlag)
    summary.push('修改成功判定规则')
  if (a.script !== b.script)
    summary.push('修改脚本内容')
  if (a.description !== b.description)
    summary.push('修改操作描述')
  return summary.length > 0 ? summary : ['无字段变更']
}

// ============ 脚本行级 LCS diff ============

/** 对齐后的行对：null 表示该侧无对应行（新增/删除） */
export interface CodeDiffPair {
  oldLine: CodeDiffLine | null
  newLine: CodeDiffLine | null
}

/**
 * LCS 行级 diff：返回对齐后的行对列表。
 * - 两侧都有且相同 → diff=false
 * - 仅一侧有，或两侧不同 → diff=true
 * 复杂度 O(m×n)，脚本通常 <200 行，无性能问题。
 */
export function diffCodeLines(oldCode: string, newCode: string): CodeDiffPair[] {
  const oldLines = oldCode.split('\n')
  const newLines = newCode.split('\n')
  const m = oldLines.length
  const n = newLines.length

  // DP 建表
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = oldLines[i] === newLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  // 回溯生成对齐行对
  const result: CodeDiffPair[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      result.push({
        oldLine: { no: i + 1, text: oldLines[i], diff: false },
        newLine: { no: j + 1, text: newLines[j], diff: false },
      })
      i++
      j++
    }
    else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ oldLine: { no: i + 1, text: oldLines[i], diff: true }, newLine: null })
      i++
    }
    else {
      result.push({ oldLine: null, newLine: { no: j + 1, text: newLines[j], diff: true } })
      j++
    }
  }
  while (i < m) {
    result.push({ oldLine: { no: i + 1, text: oldLines[i], diff: true }, newLine: null })
    i++
  }
  while (j < n) {
    result.push({ oldLine: null, newLine: { no: j + 1, text: newLines[j], diff: true } })
    j++
  }
  return result
}

// ============ 快照 → 表单反序列化 ============

/** 分类名 → 分类枚举值（反向查找） */
function categoryFromName(name: string): OperationCategory | '' {
  const entry = Object.entries(CATEGORY_NAMES).find(([, v]) => v === name)
  return (entry?.[0] as OperationCategory) ?? ''
}

/** 模板大类文本 → tplCategory + scriptSubtype */
function parseTplType(tplType: string): { tplCategory: 'script' | 'api', scriptSubtype: string } {
  if (tplType.startsWith('脚本')) {
    const sub = SCRIPT_SUBTYPES.find(s => tplType.includes(s.label))
    return { tplCategory: 'script', scriptSubtype: sub?.value ?? '1' }
  }
  return { tplCategory: 'api', scriptSubtype: '1' }
}

/**
 * 将版本快照反序列化为表单（编辑弹窗预填用）。
 * 仅填充快照中存在的字段，其余保持默认值。
 */
export function snapshotToForm(snapshot: OperationSnapshot): Partial<CustomComponentForm> {
  const { tplCategory, scriptSubtype } = parseTplType(snapshot.tplType)
  const timeoutNum = Number.parseInt(snapshot.timeout, 10) || 300
  return {
    servicename: snapshot.nameEn,
    servicecnname: snapshot.nameCn,
    category: categoryFromName(snapshot.category),
    timeout: Number.isNaN(timeoutNum) ? 300 : timeoutNum,
    description: snapshot.description,
    tplCategory,
    scriptSubtype,
    scriptContent: tplCategory === 'script' ? snapshot.script : '',
    scriptSuccessFlag: tplCategory === 'script' ? snapshot.successFlag : '',
    apiSuccessFlag: tplCategory === 'api' ? snapshot.successFlag : '',
  }
}
