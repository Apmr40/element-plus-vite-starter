/**
 * 操作工作台 - Mock 数据
 */
import type { WorkbenchData, ParamField } from '../types/workbench'

// 通用参数配置
const commonParams: ParamField[] = [
  {
    field: 'target',
    label: '目标主机',
    type: 'input',
    required: true,
    placeholder: '请输入主机IP或主机名'
  },
  {
    field: 'env',
    label: '环境',
    type: 'select',
    required: true,
    options: [
      { label: '生产环境', value: 'prod' },
      { label: '测试环境', value: 'test' },
      { label: '开发环境', value: 'dev' }
    ]
  },
  {
    field: 'remark',
    label: '备注',
    type: 'textarea',
    required: false,
    placeholder: '请输入备注信息'
  }
]

export const mockWorkbenchData: WorkbenchData = {
  // 应用模块
  modules: [
    { id: 'mod1', name: '用户中心', code: 'user-center' },
    { id: 'mod2', name: '订单系统', code: 'order-system' },
    { id: 'mod3', name: '支付网关', code: 'payment-gateway' },
    { id: 'mod4', name: '库存管理', code: 'inventory' },
    { id: 'mod5', name: '消息中心', code: 'message-center' },
    { id: 'mod6', name: '权限系统', code: 'auth-system' },
    { id: 'mod7', name: '日志平台', code: 'log-platform' },
    { id: 'mod8', name: '监控告警', code: 'monitor-alert' }
  ],

  // 操作组件
  operations: [
    // 操作系统（01）
    { id: 'op0101-1', name: '查看系统日志', description: '查看操作系统日志', category: '操作系统', subCategory: 'Linux/AIX', executeCount: 10, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0101-2', name: '重启系统服务', description: '重启操作系统服务', category: '操作系统', subCategory: 'Linux/AIX', executeCount: 5, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0101-3', name: '查看CPU使用率', description: '查看系统CPU使用情况', category: '操作系统', subCategory: 'Linux/AIX', executeCount: 15, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0101-4', name: '查看内存使用率', description: '查看系统内存使用情况', category: '操作系统', subCategory: 'Linux/AIX', executeCount: 12, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0101-5', name: '清理日志文件', description: '清理过期日志文件', category: '操作系统', subCategory: 'Linux/AIX', executeCount: 6, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op0102-1', name: 'Windows服务管理', description: '管理Windows系统服务', category: '操作系统', subCategory: 'Windows', executeCount: 8, isFavorite: false, riskLevel: 'medium', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0102-2', name: 'Windows事件日志查看', description: '查看Windows事件日志', category: '操作系统', subCategory: 'Windows', executeCount: 7, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0102-3', name: 'Windows补丁检查', description: '检查Windows补丁安装状态', category: '操作系统', subCategory: 'Windows', executeCount: 3, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    // 数据库（02）
    { id: 'op0201-1', name: 'DBbridge数据迁移', description: '使用DBbridge执行数据库迁移', category: '数据库', subCategory: '数据库迁移-DBbridge', executeCount: 4, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0201-2', name: 'DBbridge迁移状态查询', description: '查询DBbridge迁移任务状态', category: '数据库', subCategory: '数据库迁移-DBbridge', executeCount: 9, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0201-3', name: 'DBbridge回滚操作', description: '回滚DBbridge迁移任务', category: '数据库', subCategory: '数据库迁移-DBbridge', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    // 中间件（03）
    { id: 'op0301-1', name: 'IIS服务重启', description: '重启IIS中间件服务', category: '中间件', subCategory: 'IIS', executeCount: 6, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0301-2', name: 'IIS连接池检查', description: '检查IIS连接池状态', category: '中间件', subCategory: 'IIS', executeCount: 11, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0301-3', name: 'IIS日志查看', description: '查看IIS运行日志', category: '中间件', subCategory: 'IIS', executeCount: 8, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0302-1', name: 'WAS服务重启', description: '重启WAS中间件服务', category: '中间件', subCategory: 'WAS', executeCount: 5, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0302-2', name: 'WAS线程池检查', description: '检查WAS线程池状态', category: '中间件', subCategory: 'WAS', executeCount: 7, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0302-3', name: 'WAS应用部署', description: '部署应用到WAS', category: '中间件', subCategory: 'WAS', executeCount: 3, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    // 负载均衡（04）
    { id: 'op0401-1', name: 'F5节点池检查', description: '检查F5节点池状态', category: '负载均衡', subCategory: 'F5', executeCount: 9, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0401-2', name: 'F5虚拟服务器切换', description: '切换F5虚拟服务器', category: '负载均衡', subCategory: 'F5', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0401-3', name: 'F5配置备份', description: '备份F5配置文件', category: '负载均衡', subCategory: 'F5', executeCount: 4, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op0402-1', name: 'Nginx配置检查', description: '检查Nginx配置语法', category: '负载均衡', subCategory: 'Nginx', executeCount: 12, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0402-2', name: 'Nginx重载配置', description: '重载Nginx配置', category: '负载均衡', subCategory: 'Nginx', executeCount: 6, isFavorite: false, riskLevel: 'medium', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0402-3', name: 'Nginx访问日志查看', description: '查看Nginx访问日志', category: '负载均衡', subCategory: 'Nginx', executeCount: 10, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    // 应用平台（05）
    { id: 'op0501-1', name: 'TaihangFlow流程查询', description: '查询太行流程图执行状态', category: '应用平台', subCategory: '太行流程图-TaihangFlow', executeCount: 8, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0501-2', name: 'TaihangFlow流程重启', description: '重启太行流程图实例', category: '应用平台', subCategory: '太行流程图-TaihangFlow', executeCount: 3, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0502-1', name: 'ACCM服务健康检查', description: '检查AIR微服务ACCM健康状态', category: '应用平台', subCategory: 'AIR微服务-ACCM', executeCount: 14, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0502-2', name: 'ACCM服务重启', description: '重启ACCM微服务实例', category: '应用平台', subCategory: 'AIR微服务-ACCM', executeCount: 5, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0503-1', name: 'ACC应用启停', description: '启停AIR传统ACC应用', category: '应用平台', subCategory: 'AIR传统-ACC', executeCount: 7, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0503-2', name: 'ACC日志查看', description: '查看ACC应用运行日志', category: '应用平台', subCategory: 'AIR传统-ACC', executeCount: 11, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0504-1', name: 'UOps平台巡检', description: '一体化运维平台日常巡检', category: '应用平台', subCategory: '一体化运维平台-UOps', executeCount: 16, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0504-2', name: 'UOps服务重启', description: '重启UOps平台服务', category: '应用平台', subCategory: '一体化运维平台-UOps', executeCount: 4, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0505-1', name: 'ICC外联检查', description: '检查ICC外联服务平台状态', category: '应用平台', subCategory: '外联服务平台-ICC', executeCount: 9, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0505-2', name: 'ICC通道切换', description: '切换ICC外联通道', category: '应用平台', subCategory: '外联服务平台-ICC', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0506-1', name: 'G01防护状态检查', description: '检查综合防护系统状态', category: '应用平台', subCategory: '综合防护系统-G01', executeCount: 8, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0507-1', name: 'DCC配置同步', description: '同步DCC分布式配置', category: '应用平台', subCategory: '分布式配置中心-DCC', executeCount: 6, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op0507-2', name: 'DCC配置回滚', description: '回滚DCC配置到历史版本', category: '应用平台', subCategory: '分布式配置中心-DCC', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0508-1', name: 'BoEing节点检查', description: '检查分布式核心BoEing节点状态', category: '应用平台', subCategory: '分布式核心-BoEing', executeCount: 10, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0509-1', name: 'UMAP应用部署', description: '部署移动应用平台UMAP应用', category: '应用平台', subCategory: '移动应用平台-UMAP', executeCount: 3, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0510-1', name: 'MDS版本发布', description: '执行昆仑发布MDS版本发布', category: '应用平台', subCategory: '昆仑发布-MDS', executeCount: 5, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0510-2', name: 'MDS发布回滚', description: '回滚MDS发布版本', category: '应用平台', subCategory: '昆仑发布-MDS', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0511-1', name: 'BJS作业调度查看', description: '查看BJS作业集中调度状态', category: '应用平台', subCategory: '作业集中调度平台-BJS', executeCount: 13, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0511-2', name: 'BJS作业重跑', description: '重跑BJS调度作业', category: '应用平台', subCategory: '作业集中调度平台-BJS', executeCount: 4, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op0513-1', name: 'GAP网关检查', description: '检查综合网关平台状态', category: '应用平台', subCategory: '综合网关平台-GAP', executeCount: 7, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0514-1', name: 'MGS网关路由检查', description: '检查昆仑网关MGS路由配置', category: '应用平台', subCategory: '昆仑网关-MGS', executeCount: 8, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0515-1', name: 'MGS_VIP掌银网关检查', description: '检查掌银昆仑网关状态', category: '应用平台', subCategory: '昆仑网关_掌银-MGS_VIP', executeCount: 6, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0516-1', name: 'DWBS调度任务查看', description: '查看大数据平台统一调度任务', category: '应用平台', subCategory: '大数据平台统一调度系统-DWBS', executeCount: 11, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0517-1', name: 'DLGC数据湖检查', description: '检查数据湖仓DLGC状态', category: '应用平台', subCategory: '数据湖仓-DLGC', executeCount: 5, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0518-1', name: 'QCLOUD轻容器检查', description: '检查轻云平台容器状态', category: '应用平台', subCategory: '轻云平台_QCLOUD', executeCount: 9, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0519-1', name: 'BFC分行服务检查', description: '检查分行金融服务平台状态', category: '应用平台', subCategory: '分行金融服务平台-BFC', executeCount: 7, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0521-1', name: 'GTP文件传输检查', description: '检查通用文件传输平台状态', category: '应用平台', subCategory: '通用文件传输平台-GTP', executeCount: 6, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0522-1', name: 'EXP数据总线检查', description: '检查实时数据总线状态', category: '应用平台', subCategory: '实时数据总线-EXP', executeCount: 8, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    // CCE（06）
    { id: 'op0601-1', name: '集群状态检查', description: '检查CCE集群运行状态', category: 'CCE', subCategory: '集群-Cluster', executeCount: 15, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0601-2', name: '集群节点查看', description: '查看集群节点信息', category: 'CCE', subCategory: '集群-Cluster', executeCount: 12, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0602-1', name: 'Deployment滚动重启', description: '滚动重启无状态负载', category: 'CCE', subCategory: '无状态负载-Deployment', executeCount: 8, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0602-2', name: 'Deployment副本数调整', description: '调整无状态负载副本数', category: 'CCE', subCategory: '无状态负载-Deployment', executeCount: 6, isFavorite: false, riskLevel: 'medium', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0602-3', name: 'Deployment镜像更新', description: '更新无状态负载镜像', category: 'CCE', subCategory: '无状态负载-Deployment', executeCount: 4, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0603-1', name: 'Ingress路由检查', description: '检查外部路由Ingress配置', category: 'CCE', subCategory: '外部路由-Ingress', executeCount: 10, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0603-2', name: 'Ingress规则更新', description: '更新Ingress路由规则', category: 'CCE', subCategory: '外部路由-Ingress', executeCount: 3, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0604-1', name: 'StatefulSet状态检查', description: '检查有状态负载运行状态', category: 'CCE', subCategory: '有状态负载-Statefulset', executeCount: 9, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0604-2', name: 'StatefulSet滚动重启', description: '滚动重启有状态负载', category: 'CCE', subCategory: '有状态负载-Statefulset', executeCount: 4, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op0605-1', name: 'Service连通性检查', description: '检查内部路由Service连通性', category: 'CCE', subCategory: '内部路由-Service', executeCount: 11, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0605-2', name: 'Service端点查看', description: '查看Service端点列表', category: 'CCE', subCategory: '内部路由-Service', executeCount: 7, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    // 大数据平台（07）
    { id: 'op0701-1', name: 'ZDH-HDFS状态检查', description: '检查ZDH HDFS集群状态', category: '大数据平台', subCategory: 'ZDH-HDFS', executeCount: 8, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0701-2', name: 'ZDH-HDFS磁盘清理', description: '清理ZDH HDFS过期数据', category: '大数据平台', subCategory: 'ZDH-HDFS', executeCount: 3, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op0702-1', name: 'MRS-HDFS状态检查', description: '检查MRS HDFS集群状态', category: '大数据平台', subCategory: 'MRS-HDFS', executeCount: 7, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0702-2', name: 'MRS-HDFS节点扩容', description: '扩容MRS HDFS数据节点', category: '大数据平台', subCategory: 'MRS-HDFS', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    // 应用定制（09）
    { id: 'op0901-1', name: '定制应用健康检查', description: '检查定制应用运行状态', category: '应用定制', subCategory: '定制应用', executeCount: 6, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    { id: 'op0901-2', name: '定制应用配置更新', description: '更新定制应用配置', category: '应用定制', subCategory: '定制应用', executeCount: 3, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op0901-3', name: '定制应用日志导出', description: '导出定制应用运行日志', category: '应用定制', subCategory: '定制应用', executeCount: 5, isFavorite: false, riskLevel: 'low', tags: ['生产办公', '一二线'], paramConfig: commonParams },
    // 人行演练专用（99）
    { id: 'op9901-1', name: '演练环境初始化', description: '初始化人行演练环境', category: '人行演练专用', subCategory: '演练环境', executeCount: 2, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op9901-2', name: '演练场景执行', description: '执行人行演练场景', category: '人行演练专用', subCategory: '演练环境', executeCount: 1, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
    { id: 'op9901-3', name: '演练结果收集', description: '收集人行演练执行结果', category: '人行演练专用', subCategory: '演练环境', executeCount: 2, isFavorite: false, riskLevel: 'low', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op9902-1', name: '演练数据备份', description: '备份人行演练数据', category: '人行演练专用', subCategory: '演练数据', executeCount: 3, isFavorite: false, riskLevel: 'medium', tags: ['仅生产'], paramConfig: commonParams },
    { id: 'op9902-2', name: '演练数据恢复', description: '恢复人行演练数据', category: '人行演练专用', subCategory: '演练数据', executeCount: 1, isFavorite: false, riskLevel: 'high', tags: ['仅生产', '应急'], paramConfig: commonParams },
  ],

  // 编排
  orchestrations: [
    { id: 'orch1', name: '日常巡检流程', stepCount: 5, status: 'normal', lastExecuteTime: '2024-01-15 14:23:45', paramConfig: [{ field: 'checkItems', label: '巡检项目', type: 'checkbox', required: true, options: [{ label: 'CPU检查', value: 'cpu' }, { label: '内存检查', value: 'memory' }, { label: '磁盘检查', value: 'disk' }, { label: '网络检查', value: 'network' }, { label: '服务状态', value: 'service' }] }, ...commonParams] },
    { id: 'orch2', name: '故障恢复流程', stepCount: 8, status: 'warning', lastExecuteTime: '2024-01-10 09:15:30', paramConfig: [{ field: 'faultType', label: '故障类型', type: 'select', required: true, options: [{ label: '服务宕机', value: 'down' }, { label: '性能异常', value: 'performance' }, { label: '网络故障', value: 'network' }] }, ...commonParams] },
    { id: 'orch3', name: '版本发布流程', stepCount: 12, status: 'normal', lastExecuteTime: '2024-01-08 16:45:00', paramConfig: [{ field: 'version', label: '版本号', type: 'input', required: true, placeholder: '请输入版本号' }, { field: 'releaseType', label: '发布类型', type: 'select', required: true, options: [{ label: '全量发布', value: 'full' }, { label: '灰度发布', value: 'gray' }, { label: '滚动发布', value: 'rolling' }] }, ...commonParams] },
    { id: 'orch4', name: '数据备份流程', stepCount: 3, status: 'disabled', lastExecuteTime: '2024-01-05 02:00:00', paramConfig: [{ field: 'backupType', label: '备份类型', type: 'select', required: true, options: [{ label: '全量备份', value: 'full' }, { label: '增量备份', value: 'incremental' }] }, { field: 'retentionDays', label: '保留天数', type: 'input', required: true, placeholder: '请输入保留天数' }, ...commonParams] },
    { id: 'orch5', name: '安全扫描流程', stepCount: 6, status: 'normal', lastExecuteTime: '2024-01-12 03:30:00', paramConfig: [{ field: 'scanScope', label: '扫描范围', type: 'checkbox', required: true, options: [{ label: '漏洞扫描', value: 'vulnerability' }, { label: '端口扫描', value: 'port' }, { label: '弱口令检测', value: 'password' }] }, ...commonParams] },
    { id: 'orch6', name: '应用扩容流程', stepCount: 7, status: 'normal', lastExecuteTime: '2024-01-14 10:00:00', paramConfig: commonParams },
    { id: 'orch7', name: '日志清理流程', stepCount: 4, status: 'normal', lastExecuteTime: '2024-01-13 22:00:00', paramConfig: commonParams },
    { id: 'orch8', name: '证书更新流程', stepCount: 9, status: 'normal', lastExecuteTime: '2024-01-07 08:30:00', paramConfig: commonParams },
    { id: 'orch9', name: '数据库主从切换', stepCount: 10, status: 'warning', lastExecuteTime: '2024-01-09 15:20:00', paramConfig: commonParams },
    { id: 'orch10', name: '容器镜像更新', stepCount: 6, status: 'normal', lastExecuteTime: '2024-01-11 14:00:00', paramConfig: commonParams },
    { id: 'orch11', name: '服务健康检查', stepCount: 3, status: 'normal', lastExecuteTime: '2024-01-15 06:00:00', paramConfig: commonParams },
    { id: 'orch12', name: '网络隔离恢复', stepCount: 8, status: 'normal', lastExecuteTime: '2024-01-06 11:45:00', paramConfig: commonParams },
    { id: 'orch13', name: '配置变更审批流程', stepCount: 5, status: 'normal', lastExecuteTime: '2024-01-14 09:30:00', paramConfig: commonParams },
    { id: 'orch14', name: '灰度发布验证', stepCount: 7, status: 'normal', lastExecuteTime: '2024-01-13 16:00:00', paramConfig: commonParams },
    { id: 'orch15', name: '监控告警处理', stepCount: 4, status: 'warning', lastExecuteTime: '2024-01-15 08:15:00', paramConfig: commonParams },
    { id: 'orch16', name: '负载均衡切换', stepCount: 6, status: 'normal', lastExecuteTime: '2024-01-10 20:00:00', paramConfig: commonParams },
    { id: 'orch17', name: '缓存清理流程', stepCount: 3, status: 'normal', lastExecuteTime: '2024-01-12 12:00:00', paramConfig: commonParams },
    { id: 'orch18', name: '服务降级流程', stepCount: 5, status: 'normal', lastExecuteTime: '2024-01-08 22:30:00', paramConfig: commonParams },
    { id: 'orch19', name: '灾备切换演练', stepCount: 15, status: 'disabled', lastExecuteTime: '2024-01-01 09:00:00', paramConfig: commonParams },
    { id: 'orch20', name: '批量重启服务', stepCount: 4, status: 'normal', lastExecuteTime: '2024-01-14 23:00:00', paramConfig: commonParams },
    { id: 'orch21', name: '磁盘扩容流程', stepCount: 6, status: 'normal', lastExecuteTime: '2024-01-11 10:30:00', paramConfig: commonParams },
    { id: 'orch22', name: '防火墙规则更新', stepCount: 5, status: 'normal', lastExecuteTime: '2024-01-09 14:00:00', paramConfig: commonParams },
    { id: 'orch23', name: '应用配置热更新', stepCount: 3, status: 'normal', lastExecuteTime: '2024-01-15 11:00:00', paramConfig: commonParams },
    { id: 'orch24', name: '数据库性能优化', stepCount: 8, status: 'normal', lastExecuteTime: '2024-01-07 16:00:00', paramConfig: commonParams },
    { id: 'orch25', name: 'SSL证书部署', stepCount: 7, status: 'normal', lastExecuteTime: '2024-01-13 09:00:00', paramConfig: commonParams },
    { id: 'orch26', name: '服务熔断恢复', stepCount: 4, status: 'warning', lastExecuteTime: '2024-01-15 07:45:00', paramConfig: commonParams },
    { id: 'orch27', name: '日志归档流程', stepCount: 5, status: 'normal', lastExecuteTime: '2024-01-14 03:00:00', paramConfig: commonParams },
    { id: 'orch28', name: '节点上下线', stepCount: 6, status: 'normal', lastExecuteTime: '2024-01-12 15:30:00', paramConfig: commonParams },
    { id: 'orch29', name: '数据迁移流程', stepCount: 10, status: 'disabled', lastExecuteTime: '2024-01-03 22:00:00', paramConfig: commonParams },
    { id: 'orch30', name: '全链路压测', stepCount: 12, status: 'normal', lastExecuteTime: '2024-01-10 10:00:00', paramConfig: commonParams },
  ],

  // 执行历史
  executionHistory: [
    {
      id: 'EXE20240115001',
      type: 'operation',
      name: '查询主机信息',
      status: 'success',
      duration: 2.3,
      operator: '张三',
      executeTime: '2024-01-15 14:23:45',
      params: { target: '192.168.1.100', env: 'prod', queryType: 'basic' }
    },
    {
      id: 'EXE20240115002',
      type: 'orchestration',
      name: '日常巡检流程',
      status: 'failed',
      duration: 15.6,
      operator: '李四',
      executeTime: '2024-01-15 13:45:12',
      params: { checkItems: ['cpu', 'memory', 'disk'], env: 'prod' }
    },
    {
      id: 'EXE20240115003',
      type: 'operation',
      name: '重启服务',
      status: 'running',
      operator: '王五',
      executeTime: '2024-01-15 14:30:00',
      params: { serviceName: 'user-service', forceRestart: 'false' }
    },
    {
      id: 'EXE20240115004',
      type: 'operation',
      name: '查询日志',
      status: 'success',
      duration: 1.8,
      operator: '张三',
      executeTime: '2024-01-15 11:20:30',
      params: { appName: 'order-service', logLevel: 'error', timeRange: '1h' }
    },
    {
      id: 'EXE20240115005',
      type: 'orchestration',
      name: '故障恢复流程',
      status: 'cancelled',
      operator: '赵六',
      executeTime: '2024-01-15 10:15:00',
      params: { faultType: 'down', env: 'test' }
    }
  ],

  // 参数模板
  paramTemplates: [
    {
      id: 'tpl1',
      name: '生产环境查询模板',
      componentId: 'op1',
      params: { target: '192.168.1.100', env: 'prod', queryType: 'basic' },
      createTime: '2024-01-10 10:00:00'
    },
    {
      id: 'tpl2',
      name: '测试环境重启模板',
      componentId: 'op2',
      params: { serviceName: 'test-service', forceRestart: 'false', env: 'test' },
      createTime: '2024-01-08 15:30:00'
    }
  ]
}
