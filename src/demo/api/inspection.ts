/**
 * 巡检结果 API
 * 当前使用 mock 数据，后续可切换为真实 API
 */

import { mockInspectionService } from '~/demo/mock/service'
import type {
  InspectionResult,
  InspectionFilter,
  PaginationParams,
  PaginationResponse,
  ApiResponse,
} from '~/demo/types/inspection'

/** 获取巡检结果列表 */
export function getInspectionList(
  filter: Partial<InspectionFilter>,
  pagination: PaginationParams
): Promise<ApiResponse<PaginationResponse<InspectionResult>>> {
  return mockInspectionService.getList(filter, pagination)
}

/** 获取巡检结果详情 */
export function getInspectionDetail(id: string): Promise<ApiResponse<InspectionResult>> {
  return mockInspectionService.getDetail(id)
}

/** 批量创建工单 */
export function batchCreateOrders(
  inspectionId: string,
  nonCompliantItemIds: string[]
): Promise<ApiResponse<any[]>> {
  return mockInspectionService.batchCreateOrders(inspectionId, nonCompliantItemIds)
}

/** 导出巡检结果 */
export function exportInspection(ids: string[]): Promise<ApiResponse<Blob>> {
  return mockInspectionService.export(ids)
}
