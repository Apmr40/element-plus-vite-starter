/**
 * 整改工单 API
 * 当前使用 mock 数据，后续可切换为真实 API
 */

import { mockOrderService } from '~/demo/mock/service'
import type {
  Order,
  OrderFilter,
  PaginationParams,
  PaginationResponse,
  ApiResponse,
} from '~/demo/types/inspection'

/** 获取工单列表 */
export function getOrderList(
  filter: Partial<OrderFilter>,
  pagination: PaginationParams
): Promise<ApiResponse<PaginationResponse<Order>>> {
  return mockOrderService.getList(filter, pagination)
}

/** 获取工单详情 */
export function getOrderDetail(id: string): Promise<ApiResponse<Order>> {
  return mockOrderService.getDetail(id)
}

/** 误报闭环 */
export function closeAsFalseAlarm(id: string, reason: string): Promise<ApiResponse<void>> {
  return mockOrderService.closeAsFalseAlarm(id, reason)
}

/** 转单 */
export function transferOrder(id: string, handler: string, note: string): Promise<ApiResponse<void>> {
  return mockOrderService.transfer(id, handler, note)
}

/** 提交整改 */
export function submitRectification(
  id: string,
  note: string,
  attachments: any[]
): Promise<ApiResponse<void>> {
  return mockOrderService.submitRectification(id, note, attachments)
}
