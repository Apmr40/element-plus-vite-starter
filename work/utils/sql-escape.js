/**
 * SQL 单引号转义工具
 * 防止 SQL 注入攻击
 */

/**
 * 转义 SQL 单引号，防止 SQL 注入
 * @param {string|number|null|undefined} value - 需要转义的值
 * @returns {string} 转义后的字符串
 */
export function escapeSqlValue(value) {
  if (value == null) return ''
  return String(value).replace(/'/g, "''")
}

/**
 * 批量转义 SQL 值
 * @param {Array} values - 需要转义的值数组
 * @returns {Array} 转义后的字符串数组
 */
export function escapeSqlValues(values) {
  return values.map(v => escapeSqlValue(v))
}

export default {
  escapeSqlValue,
  escapeSqlValues
}
