import type { CodeDiffPair } from './version-utils'
import type {
  CodeDiffLine,
  DiffRow,
  OperationSnapshot,
  OperationVersion,
} from '~/demo/types/workbench'
/**
 * 操作工作台 - 版本历史 composable
 *
 * 职责：版本历史抽屉、版本对比弹窗、基线冲突弹窗的全部状态与业务逻辑。
 * - 版本历史抽屉：520px 时间线倒序，展示发布人/时间/变更摘要
 * - 版本对比弹窗：900px 字段级 diff + 脚本行级 LCS 对照
 * - 基线冲突检测：草稿提交时校验 baseVersionNo 与线上最新版本号
 *
 * 设计依据：docs/archive/编辑操作与草稿-交互设计.md §10
 * 交互原型：docs/prototypes/编辑操作-版本历史-交互原型.html
 */
import { computed, ref } from 'vue'
import {
  getOperationVersions,
  publishNewVersion,
  simulateExternalPublish,
} from '~/demo/api/workbench'
import {
  computeChangeSummary,
  diffCodeLines,
  diffSnapshots,
  formToSnapshot,
} from './version-utils'

export function useVersionHistory() {
  // ============ 版本历史抽屉 ============
  const showVersionDrawer = ref(false)
  const versionDrawerOpId = ref('')
  const versionDrawerOpName = ref('')
  const versions = ref<OperationVersion[]>([])
  const versionsLoading = ref(false)

  /** 当前加载的最新版本（versions 已倒序） */
  const latestVersion = computed<OperationVersion | null>(() => versions.value[0] ?? null)

  async function openVersionHistory(operationId: string, operationName: string) {
    versionDrawerOpId.value = operationId
    versionDrawerOpName.value = operationName
    showVersionDrawer.value = true
    versionsLoading.value = true
    try {
      versions.value = await getOperationVersions(operationId)
    }
    finally {
      versionsLoading.value = false
    }
  }

  function closeVersionHistory() {
    showVersionDrawer.value = false
  }

  /**
   * Demo 专用：模拟其他人在当前编辑期间发布了新版本（V4）。
   * 用于演示基线冲突检测：之后打开编辑弹窗提交时会命中 baseVersionNo < 线上最新。
   * 仅对 op0901-1 生效（mock 数据只准备了 V4 外部发布记录）。
   */
  async function simulateExternal() {
    if (!versionDrawerOpId.value)
      return
    await simulateExternalPublish(versionDrawerOpId.value)
    versions.value = await getOperationVersions(versionDrawerOpId.value)
  }

  // ============ 版本对比弹窗 ============
  const showDiffDialog = ref(false)
  const diffFromVer = ref<OperationVersion | null>(null)
  const diffToVer = ref<OperationVersion | null>(null)

  /** 字段级 diff 行 */
  const diffRows = computed<DiffRow[]>(() => {
    if (!diffFromVer.value || !diffToVer.value)
      return []
    return diffSnapshots(diffFromVer.value.snapshot, diffToVer.value.snapshot)
  })
  const diffChangedCount = computed(() => diffRows.value.filter(r => r.changed).length)
  const diffUnchangedCount = computed(() => diffRows.value.length - diffChangedCount.value)

  /** 脚本字段的行级 LCS 对齐结果 */
  const diffCodePairs = computed<CodeDiffPair[]>(() => {
    if (!diffFromVer.value || !diffToVer.value)
      return []
    return diffCodeLines(diffFromVer.value.snapshot.script, diffToVer.value.snapshot.script)
  })

  function openDiff(fromNo: number, toNo: number) {
    const from = versions.value.find(v => v.versionNo === fromNo)
    const to = versions.value.find(v => v.versionNo === toNo)
    if (!from || !to)
      return
    diffFromVer.value = from
    diffToVer.value = to
    showDiffDialog.value = true
  }

  function closeDiff() {
    showDiffDialog.value = false
  }

  // ============ 基线冲突弹窗 ============
  const showConflictDialog = ref(false)
  const conflictDetail = ref<{ baseNo: number, online: OperationVersion } | null>(null)
  /** 暂存强制发布的执行参数（冲突确认后复用） */
  let pendingPublishArgs: {
    operationId: string
    snapshot: OperationSnapshot
    changeSummary: string[]
    onSuccess: (ver: OperationVersion) => void
  } | null = null

  /**
   * 编辑场景提交入库统一入口：
   * 1. 拉取最新版本链
   * 2. 基线冲突检测（baseNo < 线上最新 → 弹冲突确认）
   * 3. 无冲突或强制发布 → 调用 publishNewVersion
   */
  async function submitEditPublish(
    operationId: string,
    baseNo: number,
    snapshot: OperationSnapshot,
    changeSummary: string[],
    onSuccess: (ver: OperationVersion) => void,
  ) {
    const latestVersions = await getOperationVersions(operationId)
    versions.value = latestVersions
    versionDrawerOpId.value = operationId
    const latest = latestVersions[0]

    if (latest && latest.versionNo > baseNo) {
      // 基线已过期 → 弹出冲突确认
      conflictDetail.value = { baseNo, online: latest }
      pendingPublishArgs = { operationId, snapshot, changeSummary, onSuccess }
      showConflictDialog.value = true
      return
    }
    await doPublish({ operationId, snapshot, changeSummary, onSuccess })
  }

  async function doPublish(args: NonNullable<typeof pendingPublishArgs>) {
    const newVer = await publishNewVersion(args.operationId, args.snapshot, args.changeSummary)
    versions.value = await getOperationVersions(args.operationId)
    pendingPublishArgs = null
    args.onSuccess(newVer)
  }

  /** 冲突弹窗：仍要继续发布 */
  async function confirmForcePublish() {
    showConflictDialog.value = false
    if (pendingPublishArgs)
      await doPublish(pendingPublishArgs)
  }

  /** 冲突弹窗：取消 */
  function cancelConflict() {
    showConflictDialog.value = false
    pendingPublishArgs = null
  }

  /** 冲突弹窗：先查看基线版本 → 线上版本的变更 */
  function viewConflictDiff() {
    if (!conflictDetail.value)
      return
    const { baseNo, online } = conflictDetail.value
    showConflictDialog.value = false
    openDiff(baseNo, online.versionNo)
  }

  return {
    // 抽屉
    showVersionDrawer,
    versionDrawerOpId,
    versionDrawerOpName,
    versions,
    versionsLoading,
    latestVersion,
    openVersionHistory,
    closeVersionHistory,
    simulateExternal,
    // 对比
    showDiffDialog,
    diffFromVer,
    diffToVer,
    diffRows,
    diffChangedCount,
    diffUnchangedCount,
    diffCodePairs,
    openDiff,
    closeDiff,
    // 冲突
    showConflictDialog,
    conflictDetail,
    submitEditPublish,
    confirmForcePublish,
    cancelConflict,
    viewConflictDiff,
  }
}

// 重新导出工具函数，供组件层按需引用
export { computeChangeSummary, formToSnapshot }
export type { CodeDiffLine }
