/**
 * 操作工作台 - composable 共享工具
 */

/**
 * 状态映射工厂函数
 * 将字符串状态映射为 Element Plus tag type 或显示文本
 */
export const createStatusMapper = <T extends string>(
  map: Record<string, T>,
  defaultValue: T
) => (status: string): T => map[status] || defaultValue
