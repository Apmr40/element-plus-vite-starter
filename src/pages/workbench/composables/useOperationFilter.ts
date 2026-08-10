import type { Ref } from 'vue'
/**
 * 操作工作台 - 筛选与自定义标签状态 composable
 *
 * 逻辑收敛点：三个 tab（我的收藏/公共组件/应用定制）共享同一份筛选状态，
 * 维度可用性由 UI 层按 tab 裁剪（见《操作组件筛选与自定义标签-交互设计》§4.2）。
 *
 * 职责边界：
 * - 本 composable：筛选状态、筛选谓词、标签聚合
 * - useOperations：数据本体与标签写操作（updateCustomTags/batchAppendTags）
 * 数据通过惰性 accessor 传入，避免 composable 间循环依赖。
 */
import type { OperationCategory, OperationComponent } from '~/demo/types/workbench'
import { computed, ref } from 'vue'
import { CATEGORY_NAMES } from '~/demo/types/workbench'

export interface FilterChip {
  type: 'category' | 'tag'
  label: string
  value: string
}

export interface OperationFilter {
  /** 操作分类筛选（'' = 全部），三 tab 共用 */
  operationCategoryFilter: Ref<OperationCategory | ''>
  /** 自定义标签多选筛选，仅应用定制/收藏 tab 可用 */
  customTagFilter: Ref<string[]>
  /** 操作分类枚举（全量恒定，Q2 决策：不随结果集收缩） */
  categoryOptions: { value: OperationCategory, label: string }[]
  /** 自定义标签候选（应用系统范围内聚合去重） */
  customTagOptions: Ref<string[]>
  /** 筛选面板展开态（筛选条收纳方案：按钮 toggle，不持久化） */
  filterExpanded: Ref<boolean>
  /** 激活筛选条件的 chips（收起态内联展示，可逐个移除） */
  activeFilterChips: Ref<FilterChip[]>
  /** 是否有激活筛选（按钮高亮态判断） */
  hasActiveFilter: Ref<boolean>
  /** 筛选谓词：供 useOperations 各 filtered computed 复用 */
  applyOpFilter: (op: OperationComponent) => boolean
  /** 切换分区时清空筛选（不持久化，设计 §7-3） */
  resetOperationFilters: () => void
  /** toggle 筛选面板展开/收起 */
  toggleFilterExpanded: () => void
  /** 移除单个 chip 条件 */
  removeFilterChip: (chip: FilterChip) => void
}

export function useOperationFilter(
  operationsAccessor: () => OperationComponent[],
): OperationFilter {
  const operationCategoryFilter = ref<OperationCategory | ''>('')
  const customTagFilter = ref<string[]>([])

  // ============ 筛选面板收纳（按钮 toggle，不持久化）============
  const filterExpanded = ref(false)
  function toggleFilterExpanded() {
    filterExpanded.value = !filterExpanded.value
  }

  const categoryOptions = (Object.keys(CATEGORY_NAMES) as OperationCategory[])
    .map(value => ({ value, label: CATEGORY_NAMES[value] }))

  // 标签聚合：全体操作 customTags 去重（v1 无独立标签库实体，设计 §5.3）
  const customTagOptions = computed(() => {
    const set = new Set<string>()
    for (const op of operationsAccessor()) {
      for (const tag of op.customTags || []) set.add(tag)
    }
    return [...set]
  })

  // 激活筛选条件的 chips（收起态内联展示）
  const activeFilterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = []
    if (operationCategoryFilter.value) {
      chips.push({
        type: 'category',
        label: CATEGORY_NAMES[operationCategoryFilter.value],
        value: operationCategoryFilter.value,
      })
    }
    for (const tag of customTagFilter.value) {
      chips.push({ type: 'tag', label: tag, value: tag })
    }
    return chips
  })

  const hasActiveFilter = computed(() => activeFilterChips.value.length > 0)

  // 移除单个 chip 条件
  function removeFilterChip(chip: FilterChip) {
    if (chip.type === 'category') {
      operationCategoryFilter.value = ''
    }
    else {
      customTagFilter.value = customTagFilter.value.filter(t => t !== chip.value)
    }
  }

  // AND 语义（Q5）：分类命中 AND 标签全部命中
  function applyOpFilter(op: OperationComponent): boolean {
    if (operationCategoryFilter.value && op.operationCategory !== operationCategoryFilter.value)
      return false
    if (customTagFilter.value.length > 0
      && !customTagFilter.value.every(tag => (op.customTags || []).includes(tag))) {
      return false
    }
    return true
  }

  function resetOperationFilters() {
    operationCategoryFilter.value = ''
    customTagFilter.value = []
  }

  return {
    operationCategoryFilter,
    customTagFilter,
    categoryOptions,
    customTagOptions,
    filterExpanded,
    activeFilterChips,
    hasActiveFilter,
    applyOpFilter,
    resetOperationFilters,
    toggleFilterExpanded,
    removeFilterChip,
  }
}
