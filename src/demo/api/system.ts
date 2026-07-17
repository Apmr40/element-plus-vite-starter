/**
 * 系统管理 API
 * 当前使用 mock 数据，后续可切换为真实 API
 */

import { mockSystemService } from '~/demo/mock/service'
import type {
  Role,
  ApiResponse,
} from '~/demo/types/inspection'

/** 获取角色列表 */
export function getRoleList(): Promise<ApiResponse<Role[]>> {
  return mockSystemService.getRoles()
}

/** 创建角色 */
export function createRole(name: string, description: string): Promise<ApiResponse<Role>> {
  return mockSystemService.createRole(name, description)
}

/** 更新角色权限 */
export function updateRolePermissions(id: string, permissions: any): Promise<ApiResponse<void>> {
  return mockSystemService.updatePermissions(id, permissions)
}

/** 删除角色 */
export function deleteRole(id: string): Promise<ApiResponse<void>> {
  return mockSystemService.deleteRole(id)
}
