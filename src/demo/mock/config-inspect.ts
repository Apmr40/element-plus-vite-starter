/**
 * 配置巡检 - Mock 数据
 * 基于 GaussDB 实际表结构 (iop_mc_inspect_*) + 系统截图数据
 */
import type {
  CategoryNode,
  InspectComponent,
  InspectExecDetail,
  InspectExecMiss,
  InspectItem,
  InspectPlan,
  InspectResult,
  InspectStrategy,
  MachineInfo,
} from '~/demo/types/config-inspect'

// 再导出类型，页面可直接从 mock 路径引用
export type * from '~/demo/types/config-inspect'

// ==================== 字典 ====================

export const TAGS_MAP: Record<string, string> = {
  '01': '安全基线',
  '02': '安全漏洞',
  '03': '运行优化',
  '04': '合规检查',
}

export const TOP_TYPE_MAP: Record<string, string> = {
  '01': '基础',
  '02': '应用',
}

export const STRATEGY_TYPE_MAP: Record<string, string> = {
  '01': '公共',
  '02': '部门定制',
}

export const STRATEGY_STATUS_MAP: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  disabled: '已停用',
}

export const RISK_LEVEL_MAP: Record<string, string> = {
  '01': '低风险',
  '02': '中风险',
  '03': '高风险',
}

export const CROSS_CENTER_MAP: Record<string, string> = {
  AC: '需要应用配合',
  AE: '需要应用实施',
  N: '否',
}

export const PLAN_STATUS_MAP: Record<string, string> = {
  '0': '试运行',
  '1': '常态化',
  '2': '已取消',
}

export const ENABLE_FLAG_MAP: Record<string, string> = {
  '01': '启动',
  '02': '暂停',
  '03': '禁用',
}

export const RESULT_STATUS_MAP: Record<string, string> = {
  正常: '正常',
  异常: '异常',
  警告: '警告',
}

export const RESULT_STATUS_OPTIONS = ['正常', '异常', '警告']

export const DEPT_OPTIONS = ['系统一部', '系统二部', '系统三部', '系统四部', '系统五部', '系统六部', '网络部', '平台部']

export const RESOURCE_TYPE_OPTIONS = ['Linux', 'Windows', 'Oracle', 'MySQL', 'GaussDB', 'Redis', 'TongLinkQ', 'TongWeb', 'PostgreSQL', 'MongoDB']

// ==================== 策略分类树 ====================

export const categoryTree: CategoryNode[] = [
  {
    id: 'base',
    label: '基础操作库',
    children: [
      {
        id: 'sys',
        label: '系统条线',
        children: [
          {
            id: 'os',
            label: '操作系统',
            children: [
              { id: 'linux', label: 'Linux' },
              { id: 'windows', label: 'Windows' },
            ],
          },
          {
            id: 'middleware',
            label: '中间件',
            children: [
              { id: 'tonglinkq', label: 'TongLinkQ' },
              { id: 'tongweb', label: 'TongWeb' },
              { id: 'redis', label: 'Redis' },
            ],
          },
          {
            id: 'db',
            label: '数据库',
            children: [
              { id: 'oracle', label: 'Oracle' },
              { id: 'mysql', label: 'MySQL' },
              { id: 'gaussdb', label: 'GaussDB' },
              { id: 'postgresql', label: 'PostgreSQL' },
              { id: 'mongodb', label: 'MongoDB' },
            ],
          },
        ],
      },
      {
        id: 'app',
        label: '应用条线',
        children: [
          { id: 'netfin', label: '网络金融' },
          { id: 'payment', label: '支付平台' },
        ],
      },
    ],
  },
]

// ==================== 机器资源 ====================

export const machines: MachineInfo[] = [
  // Linux (8)
  { host_name: 'HQxPVAL-ECAS-RE14', ip: '10.223.49.152', resource_type: 'Linux', app_id: 'SDC2020040501', app_name: '网络金融安全认证中心-手机号认证', admin_name: '张伟', admin_group: '系统五部-认证组' },
  { host_name: 'HQhPVAL-CLOA-NG09', ip: '10.240.1.42', resource_type: 'Linux', app_id: 'SDC2009070106', app_name: '企业金融服务平台-融资', admin_name: '李强', admin_group: '系统五部-融资组' },
  { host_name: 'HQzPVAL-FSCP-A11', ip: '10.212.212.7', resource_type: 'Linux', app_id: 'SDC2019050201', app_name: '数字非税系统-数字非税产品服务模块', admin_name: '王芳', admin_group: '系统五部-非税组' },
  { host_name: 'HQsPSL-MSCM-DB03', ip: '10.215.213.231', resource_type: 'Linux', app_id: 'SDC2010110402', app_name: '消息服务平台(上海)-消息服务合约', admin_name: '赵敏', admin_group: '系统五部-消息组' },
  { host_name: 'HQzPVAL-PSCV-P02', ip: '10.212.141.33', resource_type: 'Linux', app_id: 'SDC2015060101,SDC2015060102', app_name: '个人客户统一视图服务系统-统一客户视图', admin_name: '张伟', admin_group: '系统五部-视图组' },
  { host_name: 'HQsPSL-BEPS-PR01', ip: '10.215.209.3', resource_type: 'Linux', app_id: 'SDC2021060204', app_name: '智汇支付平台-小额支付', admin_name: '陈杰', admin_group: '系统五部-支付组' },
  { host_name: 'HQtPPAL-T51N-MA02', ip: '10.199.167.43', resource_type: 'Linux', app_id: 'SDC2017090108', app_name: '银行卡受理中心-标准卡折应用', admin_name: '刘洋', admin_group: '系统五部-卡折组' },
  { host_name: 'HQxPVAL-ECAS-RE15', ip: '10.223.49.153', resource_type: 'Linux', app_id: 'SDC2020040501', app_name: '网络金融安全认证中心-手机号认证', admin_name: '张伟', admin_group: '系统五部-认证组' },
  // Windows (3)
  { host_name: 'HQwPVAL-WINS-S01', ip: '10.220.30.5', resource_type: 'Windows', app_id: 'SDC2018060301', app_name: '统一监控平台-Windows采集', admin_name: '马丽', admin_group: '系统四部-监控组' },
  { host_name: 'HQwPVAL-WINS-S02', ip: '10.220.30.6', resource_type: 'Windows', app_id: 'SDC2018060301', app_name: '统一监控平台-Windows采集', admin_name: '马丽', admin_group: '系统四部-监控组' },
  { host_name: 'HQwPVAL-WINS-S03', ip: '10.220.31.10', resource_type: 'Windows', app_id: 'SDC2019020401', app_name: '报表服务平台-Windows报表', admin_name: '黄磊', admin_group: '系统四部-报表组' },
  // Oracle (3)
  { host_name: 'HQoPVAL-ORCL-D01', ip: '10.230.18.61', resource_type: 'Oracle', app_id: 'SDC2018030201', app_name: '核心账务系统-账务处理', admin_name: '孙磊', admin_group: '系统六部-账务组' },
  { host_name: 'HQoPVAL-ORCL-D02', ip: '10.230.18.62', resource_type: 'Oracle', app_id: 'SDC2018030201', app_name: '核心账务系统-账务处理', admin_name: '孙磊', admin_group: '系统六部-账务组' },
  { host_name: 'HQoPVAL-ORCL-D03', ip: '10.230.19.10', resource_type: 'Oracle', app_id: 'SDC2017050101', app_name: '信贷管理系统-授信审批', admin_name: '钱进', admin_group: '系统六部-信贷组' },
  // MySQL (3)
  { host_name: 'HQmPVAL-MYSQL-A01', ip: '10.231.20.15', resource_type: 'MySQL', app_id: 'SDC2020080101', app_name: '互联网渠道平台-用户中心', admin_name: '吴昊', admin_group: '系统三部-渠道组' },
  { host_name: 'HQmPVAL-MYSQL-A02', ip: '10.231.20.16', resource_type: 'MySQL', app_id: 'SDC2020080101', app_name: '互联网渠道平台-用户中心', admin_name: '吴昊', admin_group: '系统三部-渠道组' },
  { host_name: 'HQmPVAL-MYSQL-B01', ip: '10.231.21.8', resource_type: 'MySQL', app_id: 'SDC2021030201', app_name: '移动银行平台-交易流水', admin_name: '郑洁', admin_group: '系统三部-移动组' },
  // GaussDB (2)
  { host_name: 'HQgPVAL-GAUS-C01', ip: '10.232.10.8', resource_type: 'GaussDB', app_id: 'SDC2022050101', app_name: '分布式核心系统-客户信息', admin_name: '孙磊', admin_group: '系统六部-分布式组' },
  { host_name: 'HQgPVAL-GAUS-C02', ip: '10.232.10.9', resource_type: 'GaussDB', app_id: 'SDC2022050101', app_name: '分布式核心系统-客户信息', admin_name: '孙磊', admin_group: '系统六部-分布式组' },
  // Redis (2)
  { host_name: 'HQrPVAL-REDIS-C01', ip: '10.226.77.21', resource_type: 'Redis', app_id: 'SDC2022010301', app_name: '分布式缓存平台-会话缓存', admin_name: '周婷', admin_group: '平台部-缓存组' },
  { host_name: 'HQrPVAL-REDIS-C02', ip: '10.226.77.22', resource_type: 'Redis', app_id: 'SDC2022010301', app_name: '分布式缓存平台-会话缓存', admin_name: '周婷', admin_group: '平台部-缓存组' },
  // TongLinkQ (2)
  { host_name: 'HQtPVAL-TLQ-Q01', ip: '10.218.55.11', resource_type: 'TongLinkQ', app_id: 'SDC2016080101', app_name: '消息队列平台-交易队列', admin_name: '吴昊', admin_group: '系统二部-队列组' },
  { host_name: 'HQtPVAL-TLQ-Q02', ip: '10.218.55.12', resource_type: 'TongLinkQ', app_id: 'SDC2016080101', app_name: '消息队列平台-交易队列', admin_name: '吴昊', admin_group: '系统二部-队列组' },
  // TongWeb (2)
  { host_name: 'HQtWPVAL-TWEB-W01', ip: '10.219.40.7', resource_type: 'TongWeb', app_id: 'SDC2019090101', app_name: '统一应用服务平台-业务网关', admin_name: '冯涛', admin_group: '系统二部-网关组' },
  { host_name: 'HQtWPVAL-TWEB-W02', ip: '10.219.40.8', resource_type: 'TongWeb', app_id: 'SDC2019090101', app_name: '统一应用服务平台-业务网关', admin_name: '冯涛', admin_group: '系统二部-网关组' },
]

// ==================== 策略数据 ====================

export const strategies: InspectStrategy[] = [
  // --- Linux (5) ---
  {
    strategy_id: 'STG20260101000001',
    strategy_name: 'Linux日志留存配置检查',
    top_type: '01',
    sub_type: 'os',
    tags: '01',
    category_id: 'linux',
    category_name: 'Linux',
    test_ip: '10.223.49.152',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Linux', 'env=production'], ips: [] }),
    status: 'published',
    creator: '贺诗辉',
    create_time: '2026-05-10 09:30:00',
    modifier: '贺诗辉',
    modify_time: '2026-07-20 14:22:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000009',
    strategy_name: 'Linux密码策略安全检查',
    top_type: '01',
    sub_type: 'os',
    tags: '01',
    category_id: 'linux',
    category_name: 'Linux',
    test_ip: '10.240.1.42',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Linux'], ips: [] }),
    status: 'published',
    creator: '张伟',
    create_time: '2026-03-12 10:00:00',
    modifier: '张伟',
    modify_time: '2026-07-18 11:30:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000010',
    strategy_name: 'Linux内核参数优化检查',
    top_type: '01',
    sub_type: 'os',
    tags: '03',
    category_id: 'linux',
    category_name: 'Linux',
    test_ip: '10.212.212.7',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Linux', 'env=production'], ips: [] }),
    status: 'published',
    creator: '李强',
    create_time: '2026-04-08 14:20:00',
    modifier: '李强',
    modify_time: '2026-07-15 09:45:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000011',
    strategy_name: 'Linux文件权限合规检查',
    top_type: '01',
    sub_type: 'os',
    tags: '04',
    category_id: 'linux',
    category_name: 'Linux',
    test_ip: '10.215.213.231',
    dept_id: 'D005',
    dept_name: '系统五部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Linux'], ips: ['10.215.213.231'] }),
    status: 'published',
    creator: '王芳',
    create_time: '2026-02-28 09:15:00',
    modifier: '王芳',
    modify_time: '2026-07-12 16:00:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000012',
    strategy_name: 'Linux安全漏洞扫描策略',
    top_type: '01',
    sub_type: 'os',
    tags: '02',
    category_id: 'linux',
    category_name: 'Linux',
    test_ip: '10.212.141.33',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Linux'], ips: [] }),
    status: 'disabled',
    creator: '赵敏',
    create_time: '2026-01-20 11:00:00',
    modifier: '贺诗辉',
    modify_time: '2026-06-30 10:20:00',
    exec_type: '0',
  },
  // --- Windows (3) ---
  {
    strategy_id: 'STG20260101000007',
    strategy_name: 'Windows安全基线检查',
    top_type: '01',
    sub_type: 'os',
    tags: '02',
    category_id: 'windows',
    category_name: 'Windows',
    test_ip: '10.220.30.5',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Windows'], ips: [] }),
    status: 'published',
    creator: '赵敏',
    create_time: '2026-01-15 09:45:00',
    modifier: '赵敏',
    modify_time: '2026-06-28 10:10:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000013',
    strategy_name: 'Windows注册表安全检查',
    top_type: '01',
    sub_type: 'os',
    tags: '01',
    category_id: 'windows',
    category_name: 'Windows',
    test_ip: '10.220.30.6',
    dept_id: 'D004',
    dept_name: '系统四部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Windows'], ips: ['10.220.30.6'] }),
    status: 'draft',
    creator: '马丽',
    create_time: '2026-07-05 10:30:00',
    modifier: '马丽',
    modify_time: '2026-07-24 14:00:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000014',
    strategy_name: 'Windows服务配置合规检查',
    top_type: '01',
    sub_type: 'os',
    tags: '04',
    category_id: 'windows',
    category_name: 'Windows',
    test_ip: '10.220.31.10',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['os_type=Windows'], ips: [] }),
    status: 'draft',
    creator: '黄磊',
    create_time: '2026-06-20 15:00:00',
    modifier: '黄磊',
    modify_time: '2026-07-22 09:30:00',
    exec_type: '0',
  },
  // --- Oracle (4) ---
  {
    strategy_id: 'STG20260101000002',
    strategy_name: 'Oracle安全基线检查',
    top_type: '01',
    sub_type: 'db',
    tags: '01',
    category_id: 'oracle',
    category_name: 'Oracle',
    test_ip: '10.230.18.61',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=Oracle', 'version>=11g'], ips: [] }),
    status: 'published',
    creator: '王建国',
    create_time: '2026-04-18 10:15:00',
    modifier: '王建国',
    modify_time: '2026-07-18 16:45:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000015',
    strategy_name: 'Oracle性能优化检查',
    top_type: '01',
    sub_type: 'db',
    tags: '03',
    category_id: 'oracle',
    category_name: 'Oracle',
    test_ip: '10.230.18.62',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=Oracle'], ips: [] }),
    status: 'published',
    creator: '孙磊',
    create_time: '2026-03-05 09:30:00',
    modifier: '孙磊',
    modify_time: '2026-07-16 14:20:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000016',
    strategy_name: 'Oracle补丁合规检查',
    top_type: '01',
    sub_type: 'db',
    tags: '04',
    category_id: 'oracle',
    category_name: 'Oracle',
    test_ip: '10.230.19.10',
    dept_id: 'D006',
    dept_name: '系统六部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=Oracle'], ips: ['10.230.19.10'] }),
    status: 'published',
    creator: '钱进',
    create_time: '2026-05-22 11:00:00',
    modifier: '钱进',
    modify_time: '2026-07-20 10:45:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000017',
    strategy_name: 'Oracle安全漏洞扫描',
    top_type: '01',
    sub_type: 'db',
    tags: '02',
    category_id: 'oracle',
    category_name: 'Oracle',
    test_ip: '10.230.18.61',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=Oracle'], ips: [] }),
    status: 'disabled',
    creator: '王建国',
    create_time: '2026-02-10 10:00:00',
    modifier: '王建国',
    modify_time: '2026-05-15 09:00:00',
    exec_type: '0',
  },
  // --- MySQL (4) ---
  {
    strategy_id: 'STG20260101000005',
    strategy_name: 'MySQL安全基线检查',
    top_type: '01',
    sub_type: 'db',
    tags: '01',
    category_id: 'mysql',
    category_name: 'MySQL',
    test_ip: '10.231.20.15',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MySQL'], ips: [] }),
    status: 'published',
    creator: '王建国',
    create_time: '2026-02-20 09:00:00',
    modifier: '贺诗辉',
    modify_time: '2026-07-10 15:30:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000018',
    strategy_name: 'MySQL慢查询优化检查',
    top_type: '01',
    sub_type: 'db',
    tags: '03',
    category_id: 'mysql',
    category_name: 'MySQL',
    test_ip: '10.231.20.16',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MySQL'], ips: [] }),
    status: 'published',
    creator: '吴昊',
    create_time: '2026-04-15 14:00:00',
    modifier: '吴昊',
    modify_time: '2026-07-19 11:15:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000019',
    strategy_name: 'MySQL权限合规检查',
    top_type: '01',
    sub_type: 'db',
    tags: '04',
    category_id: 'mysql',
    category_name: 'MySQL',
    test_ip: '10.231.21.8',
    dept_id: 'D003',
    dept_name: '系统三部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MySQL'], ips: ['10.231.21.8'] }),
    status: 'draft',
    creator: '郑洁',
    create_time: '2026-07-08 09:30:00',
    modifier: '郑洁',
    modify_time: '2026-07-25 10:00:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000020',
    strategy_name: 'MySQL安全漏洞检查',
    top_type: '01',
    sub_type: 'db',
    tags: '02',
    category_id: 'mysql',
    category_name: 'MySQL',
    test_ip: '10.231.20.15',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MySQL'], ips: [] }),
    status: 'published',
    creator: '王建国',
    create_time: '2026-03-28 10:45:00',
    modifier: '王建国',
    modify_time: '2026-07-14 16:30:00',
    exec_type: '0',
  },
  // --- GaussDB (3) ---
  {
    strategy_id: 'STG20260101000006',
    strategy_name: 'GaussDB配置检查',
    top_type: '01',
    sub_type: 'db',
    tags: '03',
    category_id: 'gaussdb',
    category_name: 'GaussDB',
    test_ip: '10.232.10.8',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=GaussDB'], ips: [] }),
    status: 'published',
    creator: '孙磊',
    create_time: '2026-06-05 10:30:00',
    modifier: '孙磊',
    modify_time: '2026-07-19 17:00:00',
    exec_type: '1',
  },
  {
    strategy_id: 'STG20260101000021',
    strategy_name: 'GaussDB安全基线检查',
    top_type: '01',
    sub_type: 'db',
    tags: '01',
    category_id: 'gaussdb',
    category_name: 'GaussDB',
    test_ip: '10.232.10.9',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=GaussDB'], ips: [] }),
    status: 'published',
    creator: '孙磊',
    create_time: '2026-05-18 09:00:00',
    modifier: '孙磊',
    modify_time: '2026-07-21 14:30:00',
    exec_type: '1',
  },
  {
    strategy_id: 'STG20260101000022',
    strategy_name: 'GaussDB合规检查',
    top_type: '01',
    sub_type: 'db',
    tags: '04',
    category_id: 'gaussdb',
    category_name: 'GaussDB',
    test_ip: '10.232.10.8',
    dept_id: 'D006',
    dept_name: '系统六部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=GaussDB'], ips: ['10.232.10.8'] }),
    status: 'draft',
    creator: '孙磊',
    create_time: '2026-07-12 10:00:00',
    modifier: '孙磊',
    modify_time: '2026-07-26 09:20:00',
    exec_type: '1',
  },
  // --- Redis (3) ---
  {
    strategy_id: 'STG20260101000004',
    strategy_name: 'Redis安全基线检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '01',
    category_id: 'redis',
    category_name: 'Redis',
    test_ip: '10.226.77.21',
    dept_id: 'D005',
    dept_name: '系统五部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['cache_type=Redis'], ips: ['10.226.77.21', '10.226.77.22'] }),
    status: 'draft',
    creator: '周婷',
    create_time: '2026-07-01 14:00:00',
    modifier: '周婷',
    modify_time: '2026-07-22 11:20:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000023',
    strategy_name: 'Redis性能优化检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '03',
    category_id: 'redis',
    category_name: 'Redis',
    test_ip: '10.226.77.22',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['cache_type=Redis'], ips: [] }),
    status: 'published',
    creator: '周婷',
    create_time: '2026-04-25 11:30:00',
    modifier: '周婷',
    modify_time: '2026-07-17 15:45:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000024',
    strategy_name: 'Redis内存合规检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '04',
    category_id: 'redis',
    category_name: 'Redis',
    test_ip: '10.226.77.21',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['cache_type=Redis'], ips: [] }),
    status: 'disabled',
    creator: '周婷',
    create_time: '2026-03-15 09:00:00',
    modifier: '周婷',
    modify_time: '2026-06-20 10:00:00',
    exec_type: '0',
  },
  // --- TongLinkQ (3) ---
  {
    strategy_id: 'STG20260101000003',
    strategy_name: 'TongLinkQ配置检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '03',
    category_id: 'tonglinkq',
    category_name: 'TongLinkQ',
    test_ip: '10.218.55.11',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['mq_type=TongLinkQ'], ips: [] }),
    status: 'published',
    creator: '李文博',
    create_time: '2026-03-25 11:00:00',
    modifier: '李文博',
    modify_time: '2026-07-15 09:30:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000025',
    strategy_name: 'TongLinkQ安全基线检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '01',
    category_id: 'tonglinkq',
    category_name: 'TongLinkQ',
    test_ip: '10.218.55.12',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['mq_type=TongLinkQ'], ips: [] }),
    status: 'published',
    creator: '李文博',
    create_time: '2026-05-08 10:15:00',
    modifier: '李文博',
    modify_time: '2026-07-20 11:00:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000026',
    strategy_name: 'TongLinkQ漏洞检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '02',
    category_id: 'tonglinkq',
    category_name: 'TongLinkQ',
    test_ip: '10.218.55.11',
    dept_id: 'D002',
    dept_name: '系统二部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['mq_type=TongLinkQ'], ips: ['10.218.55.11'] }),
    status: 'draft',
    creator: '吴昊',
    create_time: '2026-07-15 14:30:00',
    modifier: '吴昊',
    modify_time: '2026-07-25 16:00:00',
    exec_type: '0',
  },
  // --- TongWeb (3) ---
  {
    strategy_id: 'STG20260101000008',
    strategy_name: 'TongWeb配置检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '03',
    category_id: 'tongweb',
    category_name: 'TongWeb',
    test_ip: '10.219.40.7',
    dept_id: 'D002',
    dept_name: '系统二部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['was_type=TongWeb'], ips: [] }),
    status: 'draft',
    creator: '吴昊',
    create_time: '2026-07-10 13:30:00',
    modifier: '吴昊',
    modify_time: '2026-07-23 09:15:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000027',
    strategy_name: 'TongWeb安全基线检查',
    top_type: '01',
    sub_type: 'middleware',
    tags: '01',
    category_id: 'tongweb',
    category_name: 'TongWeb',
    test_ip: '10.219.40.8',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['was_type=TongWeb'], ips: [] }),
    status: 'published',
    creator: '冯涛',
    create_time: '2026-04-10 09:00:00',
    modifier: '冯涛',
    modify_time: '2026-07-18 10:30:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000028',
    strategy_name: 'TongWeb漏洞扫描',
    top_type: '01',
    sub_type: 'middleware',
    tags: '02',
    category_id: 'tongweb',
    category_name: 'TongWeb',
    test_ip: '10.219.40.7',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['was_type=TongWeb'], ips: [] }),
    status: 'disabled',
    creator: '冯涛',
    create_time: '2026-02-05 11:30:00',
    modifier: '冯涛',
    modify_time: '2026-05-28 14:00:00',
    exec_type: '0',
  },
  // --- PostgreSQL (4) ---
  {
    strategy_id: 'STG20260101000029',
    strategy_name: 'PostgreSQL安全基线检查',
    top_type: '01',
    sub_type: 'db',
    tags: '01',
    category_id: 'postgresql',
    category_name: 'PostgreSQL',
    test_ip: '10.233.5.20',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=PostgreSQL'], ips: [] }),
    status: 'published',
    creator: '王建国',
    create_time: '2026-05-25 10:00:00',
    modifier: '王建国',
    modify_time: '2026-07-22 15:30:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000030',
    strategy_name: 'PostgreSQL性能优化检查',
    top_type: '01',
    sub_type: 'db',
    tags: '03',
    category_id: 'postgresql',
    category_name: 'PostgreSQL',
    test_ip: '10.233.5.21',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=PostgreSQL'], ips: [] }),
    status: 'published',
    creator: '王建国',
    create_time: '2026-06-10 14:00:00',
    modifier: '王建国',
    modify_time: '2026-07-23 11:20:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000031',
    strategy_name: 'PostgreSQL合规检查',
    top_type: '01',
    sub_type: 'db',
    tags: '04',
    category_id: 'postgresql',
    category_name: 'PostgreSQL',
    test_ip: '10.233.5.20',
    dept_id: 'D001',
    dept_name: '系统一部',
    strategy_type: '02',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=PostgreSQL'], ips: ['10.233.5.20'] }),
    status: 'draft',
    creator: '陈明',
    create_time: '2026-07-18 09:30:00',
    modifier: '陈明',
    modify_time: '2026-07-26 14:45:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000032',
    strategy_name: 'PostgreSQL漏洞检查',
    top_type: '01',
    sub_type: 'db',
    tags: '02',
    category_id: 'postgresql',
    category_name: 'PostgreSQL',
    test_ip: '10.233.5.21',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=PostgreSQL'], ips: [] }),
    status: 'published',
    creator: '王建国',
    create_time: '2026-04-20 10:30:00',
    modifier: '王建国',
    modify_time: '2026-07-15 16:00:00',
    exec_type: '0',
  },
  // --- MongoDB (3) ---
  {
    strategy_id: 'STG20260101000033',
    strategy_name: 'MongoDB安全基线检查',
    top_type: '01',
    sub_type: 'db',
    tags: '01',
    category_id: 'mongodb',
    category_name: 'MongoDB',
    test_ip: '10.234.8.30',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MongoDB'], ips: [] }),
    status: 'published',
    creator: '陈明',
    create_time: '2026-06-01 09:00:00',
    modifier: '陈明',
    modify_time: '2026-07-21 10:15:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000034',
    strategy_name: 'MongoDB性能优化检查',
    top_type: '01',
    sub_type: 'db',
    tags: '03',
    category_id: 'mongodb',
    category_name: 'MongoDB',
    test_ip: '10.234.8.31',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MongoDB'], ips: [] }),
    status: 'draft',
    creator: '陈明',
    create_time: '2026-07-20 11:00:00',
    modifier: '陈明',
    modify_time: '2026-07-26 16:30:00',
    exec_type: '0',
  },
  {
    strategy_id: 'STG20260101000035',
    strategy_name: 'MongoDB合规检查',
    top_type: '01',
    sub_type: 'db',
    tags: '04',
    category_id: 'mongodb',
    category_name: 'MongoDB',
    test_ip: '10.234.8.30',
    dept_id: '',
    dept_name: '',
    strategy_type: '01',
    inspect_scope: JSON.stringify({ osKeyword: ['db_type=MongoDB'], ips: [] }),
    status: 'disabled',
    creator: '陈明',
    create_time: '2026-03-10 14:30:00',
    modifier: '陈明',
    modify_time: '2026-06-15 09:45:00',
    exec_type: '0',
  },
]

// ==================== 组件数据 ====================

export const components: InspectComponent[] = [
  { strategy_id: 'STG20260101000001', component_id: '8cedaebf086d42449468658aea0b7f17', component_version: '8', component_code: 'OP-SYS-OS-LINUX-SEC-SH', component_name: '操作-系统条线-操作系统-Linux-安全基线检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000001', component_id: 'a1b2c3d4e5f6478890abcdef12345678', component_version: '3', component_code: 'OP-SYS-OS-LINUX-LOG-SH', component_name: '操作-系统条线-操作系统-Linux-日志检查-SH', status: '1', exec_type: '0', param_json: '[{"name":"logPath","description":"日志路径","value":"/var/log","required":true}]' },
  { strategy_id: 'STG20260101000002', component_id: 'b2c3d4e5f6a7489901bcdef234567890', component_version: '5', component_code: 'OP-SYS-DB-ORACLE-SEC-SH', component_name: '操作-系统条线-数据库-Oracle-安全基线检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000003', component_id: 'c3d4e5f6a7b8490012cdef3456789012', component_version: '2', component_code: 'OP-SYS-MW-TLQ-CFG-SH', component_name: '操作-系统条线-中间件-TongLinkQ-配置检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000004', component_id: 'd4e5f6a7b8c9401123def45678901234', component_version: '1', component_code: 'OP-SYS-MW-REDIS-SEC-SH', component_name: '操作-系统条线-中间件-Redis-安全基线检查-SH', status: '0', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000005', component_id: 'e5f6a7b8c9d0412234ef567890123456', component_version: '4', component_code: 'OP-SYS-DB-MYSQL-SEC-SH', component_name: '操作-系统条线-数据库-MySQL-安全基线检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000006', component_id: 'f6a7b8c9d0e1423345f6789012345678', component_version: '2', component_code: 'OP-SYS-DB-GAUSS-CFG-SRV', component_name: '操作-系统条线-数据库-GaussDB-配置检查-SRV', status: '1', exec_type: '1', param_json: '[{"name":"execObjectList","description":"资源对象列表","value":"","required":false}]' },
  { strategy_id: 'STG20260101000007', component_id: 'a7b8c9d0e1f2434456a7890123456789', component_version: '3', component_code: 'OP-SYS-OS-WIN-SEC-SH', component_name: '操作-系统条线-操作系统-Windows-安全基线检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000008', component_id: 'b8c9d0e1f2a3445567b8901234567890', component_version: '1', component_code: 'OP-SYS-MW-TWEB-CFG-SH', component_name: '操作-系统条线-中间件-TongWeb-配置检查-SH', status: '0', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000029', component_id: 'c9d0e1f2a3b4456678c9012345678901', component_version: '2', component_code: 'OP-SYS-DB-PG-SEC-SH', component_name: '操作-系统条线-数据库-PostgreSQL-安全基线检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000033', component_id: 'd0e1f2a3b4c5467789d0123456789012', component_version: '1', component_code: 'OP-SYS-DB-MONGO-SEC-SH', component_name: '操作-系统条线-数据库-MongoDB-安全基线检查-SH', status: '1', exec_type: '0', param_json: '' },
  { strategy_id: 'STG20260101000009', component_id: 'e1f2a3b4c5d6478890e1234567890123', component_version: '2', component_code: 'OP-SYS-OS-LINUX-PWD-SH', component_name: '操作-系统条线-操作系统-Linux-密码策略检查-SH', status: '1', exec_type: '0', param_json: '' },
]

// ==================== 检查项数据 ====================

export const checkItems: InspectItem[] = [
  { component_id: '8cedaebf086d42449468658aea0b7f17', check_name: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', component_version: '8', obj_name: '/var/log/secure', std_value: 'weekly and rotate > 27', baseline_no: 'BL-SEC-001', cross_center: 'N', risk_level: '02', govern_deadline: '30', govern_component_id: 'gov001', govern_component_name: '治理-日志留存修复-SH', govern_component_version: '2', govern_desc: '修改/etc/logrotate.conf中secure日志的rotate配置为27以上', status: '1' },
  { component_id: '8cedaebf086d42449468658aea0b7f17', check_name: 'LOGSIZE_/var/log/messages_日志留存配置是否存在', component_version: '8', obj_name: '/var/log/messages', std_value: 'weekly and rotate > 27', baseline_no: 'BL-SEC-002', cross_center: 'N', risk_level: '02', govern_deadline: '30', govern_component_id: 'gov001', govern_component_name: '治理-日志留存修复-SH', govern_component_version: '2', govern_desc: '修改/etc/logrotate.conf中messages日志的rotate配置为27以上', status: '1' },
  { component_id: '8cedaebf086d42449468658aea0b7f17', check_name: 'PERM_/etc/passwd_文件权限检查', component_version: '8', obj_name: '/etc/passwd', std_value: '644', baseline_no: 'BL-SEC-003', cross_center: 'N', risk_level: '03', govern_deadline: '7', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '设置/etc/passwd文件权限为644', status: '1' },
  { component_id: 'a1b2c3d4e5f6478890abcdef12345678', check_name: 'LOG_RETENTION_日志保留天数检查', component_version: '3', obj_name: '/etc/logrotate.conf', std_value: 'rotate >= 180', baseline_no: 'BL-LOG-001', cross_center: 'N', risk_level: '02', govern_deadline: '30', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '配置日志保留天数不少于180天', status: '1' },
  { component_id: 'b2c3d4e5f6a7489901bcdef234567890', check_name: 'ORA_AUDIT_审计配置检查', component_version: '5', obj_name: 'audit_trail', std_value: 'DB', baseline_no: 'BL-ORA-001', cross_center: 'AE', risk_level: '02', govern_deadline: '30', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '开启数据库审计', status: '1' },
  { component_id: 'b2c3d4e5f6a7489901bcdef234567890', check_name: 'ORA_PWD_密码有效期检查', component_version: '5', obj_name: 'DEFAULT profile', std_value: 'PASSWORD_LIFE_TIME <= 90', baseline_no: 'BL-ORA-002', cross_center: 'N', risk_level: '01', govern_deadline: '60', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '设置密码有效期不超过90天', status: '1' },
  { component_id: 'c3d4e5f6a7b8490012cdef3456789012', check_name: 'TLQ_QDEPTH_队列深度阈值检查', component_version: '2', obj_name: 'QUEUE.SVRCONN', std_value: 'QDEPTH < 1000', baseline_no: 'BL-TLQ-001', cross_center: 'N', risk_level: '02', govern_deadline: '15', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '清理积压消息或扩容队列', status: '1' },
  { component_id: 'd4e5f6a7b8c9401123def45678901234', check_name: 'REDIS_AUTH_认证配置检查', component_version: '1', obj_name: 'requirepass', std_value: 'enabled', baseline_no: 'BL-RDS-001', cross_center: 'N', risk_level: '03', govern_deadline: '7', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '开启Redis密码认证', status: '1' },
  { component_id: 'e5f6a7b8c9d0412234ef567890123456', check_name: 'MYSQL_PWD_密码策略检查', component_version: '4', obj_name: 'validate_password_policy', std_value: 'MEDIUM', baseline_no: 'BL-MYSQL-001', cross_center: 'N', risk_level: '02', govern_deadline: '30', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '设置密码验证策略为MEDIUM以上', status: '1' },
  { component_id: 'f6a7b8c9d0e1423345f6789012345678', check_name: 'GAUSS_CONN_最大连接数检查', component_version: '2', obj_name: 'max_connections', std_value: '>= 500', baseline_no: 'BL-GAUSS-001', cross_center: 'N', risk_level: '01', govern_deadline: '60', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '调整最大连接数配置', status: '1' },
  { component_id: 'a7b8c9d0e1f2434456a7890123456789', check_name: 'WIN_POLICY_账户锁定策略检查', component_version: '3', obj_name: 'AccountLockoutThreshold', std_value: '<= 5', baseline_no: 'BL-WIN-001', cross_center: 'N', risk_level: '02', govern_deadline: '30', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '设置账户锁定阈值为5次以内', status: '1' },
  { component_id: 'b8c9d0e1f2a3445567b8901234567890', check_name: 'TW_THREAD_线程池配置检查', component_version: '1', obj_name: 'server.xml/ThreadPool', std_value: 'maxThreads >= 200', baseline_no: 'BL-TW-001', cross_center: 'AC', risk_level: '01', govern_deadline: '60', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '调整TongWeb线程池最大线程数', status: '1' },
  { component_id: 'c9d0e1f2a3b4456678c9012345678901', check_name: 'PG_SSL_SSL连接检查', component_version: '2', obj_name: 'postgresql.conf/ssl', std_value: 'on', baseline_no: 'BL-PG-001', cross_center: 'AE', risk_level: '02', govern_deadline: '30', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '开启PostgreSQL SSL连接', status: '1' },
  { component_id: 'd0e1f2a3b4c5467789d0123456789012', check_name: 'MONGO_AUTH_认证机制检查', component_version: '1', obj_name: 'security.authorization', std_value: 'enabled', baseline_no: 'BL-MONGO-001', cross_center: 'N', risk_level: '03', govern_deadline: '7', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '开启MongoDB访问认证', status: '1' },
  { component_id: 'e1f2a3b4c5d6478890e1234567890123', check_name: 'PWD_COMPLEX_密码复杂度检查', component_version: '2', obj_name: '/etc/pam.d/system-auth', std_value: 'minlen >= 8 and dcredit >= 1', baseline_no: 'BL-PWD-001', cross_center: 'AC', risk_level: '01', govern_deadline: '60', govern_component_id: '', govern_component_name: '', govern_component_version: '', govern_desc: '配置密码复杂度策略', status: '1' },
]

// ==================== 计划数据 ====================

export const plans: InspectPlan[] = [
  // STG001 Linux日志 (4)
  { plan_id: 'PLN20260201000001', strategy_id: 'STG20260101000001', dept_id: 'D005', plan_name: 'Linux日志留存配置检查-系统五部', crontab: '0 0 18 * * ?', trial_times: '1', cur_trial_times: '0', trial_ips: '10.223.49.152', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260701-001', category_code: 'linux', category_name: 'Linux', dept_name: '系统五部', creator: '贺诗辉', create_time: '2026-07-01 10:00:00', modifier: '贺诗辉', modify_time: '2026-07-23 15:30:00', batch_size: '200', wait_time: '0' },
  { plan_id: 'PLN20260201000008', strategy_id: 'STG20260101000001', dept_id: 'D001', plan_name: 'Linux日志留存配置检查-系统一部', crontab: '0 0 19 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.223.49.153', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260610-008', category_code: 'linux', category_name: 'Linux', dept_name: '系统一部', creator: '贺诗辉', create_time: '2026-06-10 09:00:00', modifier: '贺诗辉', modify_time: '2026-07-17 15:10:00', batch_size: '200', wait_time: '0' },
  { plan_id: 'PLN20260201000009', strategy_id: 'STG20260101000001', dept_id: 'D002', plan_name: 'Linux日志留存配置检查-系统二部', crontab: '0 0 20 ? * MON', trial_times: '2', cur_trial_times: '2', trial_ips: '10.240.1.42', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260615-009', category_code: 'linux', category_name: 'Linux', dept_name: '系统二部', creator: '李文博', create_time: '2026-06-15 10:30:00', modifier: '李文博', modify_time: '2026-07-20 09:00:00', batch_size: '150', wait_time: '10' },
  { plan_id: 'PLN20260201000010', strategy_id: 'STG20260101000001', dept_id: 'D003', plan_name: 'Linux日志留存配置检查-系统三部', crontab: '0 0 21 1 * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.212.212.7', status: '1', enable_flag: '02', jobtimer_id: 'JT-20260620-010', category_code: 'linux', category_name: 'Linux', dept_name: '系统三部', creator: '王芳', create_time: '2026-06-20 14:00:00', modifier: '王芳', modify_time: '2026-07-22 11:30:00', batch_size: '100', wait_time: '0' },
  // STG002 Oracle (3)
  { plan_id: 'PLN20260201000002', strategy_id: 'STG20260101000002', dept_id: 'D006', plan_name: 'Oracle安全基线检查-系统六部', crontab: '0 0 2 * * ?', trial_times: '2', cur_trial_times: '2', trial_ips: '10.230.18.61', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260615-002', category_code: 'oracle', category_name: 'Oracle', dept_name: '系统六部', creator: '王建国', create_time: '2026-06-15 09:00:00', modifier: '王建国', modify_time: '2026-07-20 11:00:00', batch_size: '100', wait_time: '30' },
  { plan_id: 'PLN20260201000011', strategy_id: 'STG20260101000002', dept_id: 'D001', plan_name: 'Oracle安全基线检查-系统一部', crontab: '0 0 3 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.230.18.62', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260618-011', category_code: 'oracle', category_name: 'Oracle', dept_name: '系统一部', creator: '陈明', create_time: '2026-06-18 10:00:00', modifier: '陈明', modify_time: '2026-07-19 14:20:00', batch_size: '80', wait_time: '20' },
  { plan_id: 'PLN20260201000012', strategy_id: 'STG20260101000002', dept_id: 'D004', plan_name: 'Oracle安全基线检查-系统四部', crontab: '0 0 4 1 * ?', trial_times: '3', cur_trial_times: '1', trial_ips: '10.230.19.10', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260710-012', category_code: 'oracle', category_name: 'Oracle', dept_name: '系统四部', creator: '马丽', create_time: '2026-07-10 09:30:00', modifier: '马丽', modify_time: '2026-07-24 10:15:00', batch_size: '50', wait_time: '60' },
  // STG003 TongLinkQ (2)
  { plan_id: 'PLN20260201000003', strategy_id: 'STG20260101000003', dept_id: 'D002', plan_name: 'TongLinkQ配置检查-系统二部', crontab: '0 30 3 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.218.55.11', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260620-003', category_code: 'tonglinkq', category_name: 'TongLinkQ', dept_name: '系统二部', creator: '李文博', create_time: '2026-06-20 14:00:00', modifier: '李文博', modify_time: '2026-07-18 16:20:00', batch_size: '50', wait_time: '10' },
  { plan_id: 'PLN20260201000013', strategy_id: 'STG20260101000003', dept_id: 'D005', plan_name: 'TongLinkQ配置检查-系统五部', crontab: '0 30 4 ? * MON', trial_times: '2', cur_trial_times: '0', trial_ips: '10.218.55.12', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260712-013', category_code: 'tonglinkq', category_name: 'TongLinkQ', dept_name: '系统五部', creator: '张伟', create_time: '2026-07-12 11:00:00', modifier: '张伟', modify_time: '2026-07-25 09:40:00', batch_size: '50', wait_time: '0' },
  // STG005 MySQL (3)
  { plan_id: 'PLN20260201000005', strategy_id: 'STG20260101000005', dept_id: 'D003', plan_name: 'MySQL安全基线检查-系统三部', crontab: '0 0 5 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.231.20.15', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260601-005', category_code: 'mysql', category_name: 'MySQL', dept_name: '系统三部', creator: '王建国', create_time: '2026-06-01 09:30:00', modifier: '贺诗辉', modify_time: '2026-07-16 10:15:00', batch_size: '200', wait_time: '0' },
  { plan_id: 'PLN20260201000014', strategy_id: 'STG20260101000005', dept_id: 'D001', plan_name: 'MySQL安全基线检查-系统一部', crontab: '0 0 6 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.231.20.16', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260625-014', category_code: 'mysql', category_name: 'MySQL', dept_name: '系统一部', creator: '陈明', create_time: '2026-06-25 10:00:00', modifier: '陈明', modify_time: '2026-07-21 15:00:00', batch_size: '150', wait_time: '10' },
  { plan_id: 'PLN20260201000015', strategy_id: 'STG20260101000005', dept_id: 'D006', plan_name: 'MySQL安全基线检查-系统六部', crontab: '0 0 7 1 * ?', trial_times: '2', cur_trial_times: '2', trial_ips: '10.231.21.8', status: '1', enable_flag: '02', jobtimer_id: 'JT-20260701-015', category_code: 'mysql', category_name: 'MySQL', dept_name: '系统六部', creator: '孙磊', create_time: '2026-07-01 14:30:00', modifier: '孙磊', modify_time: '2026-07-23 09:10:00', batch_size: '100', wait_time: '30' },
  // STG006 GaussDB (2)
  { plan_id: 'PLN20260201000006', strategy_id: 'STG20260101000006', dept_id: 'D006', plan_name: 'GaussDB配置检查-系统六部', crontab: '0 0 6 * * ?', trial_times: '2', cur_trial_times: '0', trial_ips: '10.232.10.8', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260715-006', category_code: 'gaussdb', category_name: 'GaussDB', dept_name: '系统六部', creator: '孙磊', create_time: '2026-07-15 11:00:00', modifier: '孙磊', modify_time: '2026-07-21 09:40:00', batch_size: '50', wait_time: '60' },
  { plan_id: 'PLN20260201000016', strategy_id: 'STG20260101000006', dept_id: 'D001', plan_name: 'GaussDB配置检查-系统一部', crontab: '0 0 8 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.232.10.9', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260705-016', category_code: 'gaussdb', category_name: 'GaussDB', dept_name: '系统一部', creator: '陈明', create_time: '2026-07-05 09:00:00', modifier: '陈明', modify_time: '2026-07-22 14:30:00', batch_size: '50', wait_time: '30' },
  // STG007 Windows (3)
  { plan_id: 'PLN20260201000007', strategy_id: 'STG20260101000007', dept_id: 'D004', plan_name: 'Windows安全基线检查-系统四部', crontab: '0 0 7 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.220.30.5', status: '1', enable_flag: '02', jobtimer_id: 'JT-20260520-007', category_code: 'windows', category_name: 'Windows', dept_name: '系统四部', creator: '赵敏', create_time: '2026-05-20 10:00:00', modifier: '赵敏', modify_time: '2026-07-19 13:50:00', batch_size: '150', wait_time: '20' },
  { plan_id: 'PLN20260201000017', strategy_id: 'STG20260101000007', dept_id: 'D002', plan_name: 'Windows安全基线检查-系统二部', crontab: '0 0 8 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.220.30.6', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260622-017', category_code: 'windows', category_name: 'Windows', dept_name: '系统二部', creator: '冯涛', create_time: '2026-06-22 10:30:00', modifier: '冯涛', modify_time: '2026-07-20 16:00:00', batch_size: '100', wait_time: '10' },
  { plan_id: 'PLN20260201000018', strategy_id: 'STG20260101000007', dept_id: 'D005', plan_name: 'Windows安全基线检查-系统五部', crontab: '0 0 9 1 * ?', trial_times: '2', cur_trial_times: '0', trial_ips: '10.220.31.10', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260718-018', category_code: 'windows', category_name: 'Windows', dept_name: '系统五部', creator: '张伟', create_time: '2026-07-18 09:00:00', modifier: '张伟', modify_time: '2026-07-26 10:30:00', batch_size: '80', wait_time: '0' },
  // STG009 Linux密码 (2)
  { plan_id: 'PLN20260201000019', strategy_id: 'STG20260101000009', dept_id: 'D005', plan_name: 'Linux密码策略检查-系统五部', crontab: '0 0 10 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.240.1.42', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260605-019', category_code: 'linux', category_name: 'Linux', dept_name: '系统五部', creator: '张伟', create_time: '2026-06-05 10:00:00', modifier: '张伟', modify_time: '2026-07-18 11:00:00', batch_size: '200', wait_time: '0' },
  { plan_id: 'PLN20260201000020', strategy_id: 'STG20260101000009', dept_id: 'D003', plan_name: 'Linux密码策略检查-系统三部', crontab: '0 0 11 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.212.212.7', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260628-020', category_code: 'linux', category_name: 'Linux', dept_name: '系统三部', creator: '王芳', create_time: '2026-06-28 14:00:00', modifier: '王芳', modify_time: '2026-07-21 09:30:00', batch_size: '150', wait_time: '10' },
  // STG010 Linux内核 (2)
  { plan_id: 'PLN20260201000021', strategy_id: 'STG20260101000010', dept_id: 'D005', plan_name: 'Linux内核参数优化检查-系统五部', crontab: '0 0 12 * * ?', trial_times: '2', cur_trial_times: '2', trial_ips: '10.215.213.231', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260612-021', category_code: 'linux', category_name: 'Linux', dept_name: '系统五部', creator: '赵敏', create_time: '2026-06-12 09:30:00', modifier: '赵敏', modify_time: '2026-07-19 15:45:00', batch_size: '200', wait_time: '0' },
  { plan_id: 'PLN20260201000022', strategy_id: 'STG20260101000010', dept_id: 'D006', plan_name: 'Linux内核参数优化检查-系统六部', crontab: '0 0 13 1 * ?', trial_times: '1', cur_trial_times: '0', trial_ips: '10.212.141.33', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260720-022', category_code: 'linux', category_name: 'Linux', dept_name: '系统六部', creator: '孙磊', create_time: '2026-07-20 10:00:00', modifier: '孙磊', modify_time: '2026-07-26 11:20:00', batch_size: '100', wait_time: '30' },
  // STG015 Oracle性能 (2)
  { plan_id: 'PLN20260201000023', strategy_id: 'STG20260101000015', dept_id: 'D006', plan_name: 'Oracle性能优化检查-系统六部', crontab: '0 0 14 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.230.18.62', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260608-023', category_code: 'oracle', category_name: 'Oracle', dept_name: '系统六部', creator: '孙磊', create_time: '2026-06-08 10:00:00', modifier: '孙磊', modify_time: '2026-07-17 14:00:00', batch_size: '80', wait_time: '30' },
  { plan_id: 'PLN20260201000024', strategy_id: 'STG20260101000015', dept_id: 'D004', plan_name: 'Oracle性能优化检查-系统四部', crontab: '0 0 15 ? * MON', trial_times: '2', cur_trial_times: '1', trial_ips: '10.230.19.10', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260702-024', category_code: 'oracle', category_name: 'Oracle', dept_name: '系统四部', creator: '马丽', create_time: '2026-07-02 09:00:00', modifier: '马丽', modify_time: '2026-07-23 16:30:00', batch_size: '50', wait_time: '20' },
  // STG018 MySQL慢查询 (2)
  { plan_id: 'PLN20260201000025', strategy_id: 'STG20260101000018', dept_id: 'D003', plan_name: 'MySQL慢查询优化检查-系统三部', crontab: '0 0 16 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.231.20.16', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260618-025', category_code: 'mysql', category_name: 'MySQL', dept_name: '系统三部', creator: '吴昊', create_time: '2026-06-18 14:00:00', modifier: '吴昊', modify_time: '2026-07-20 10:45:00', batch_size: '200', wait_time: '0' },
  { plan_id: 'PLN20260201000026', strategy_id: 'STG20260101000018', dept_id: 'D001', plan_name: 'MySQL慢查询优化检查-系统一部', crontab: '0 0 17 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.231.21.8', status: '1', enable_flag: '02', jobtimer_id: 'JT-20260708-026', category_code: 'mysql', category_name: 'MySQL', dept_name: '系统一部', creator: '陈明', create_time: '2026-07-08 10:30:00', modifier: '陈明', modify_time: '2026-07-24 15:00:00', batch_size: '150', wait_time: '10' },
  // STG021 GaussDB安全 (2)
  { plan_id: 'PLN20260201000027', strategy_id: 'STG20260101000021', dept_id: 'D006', plan_name: 'GaussDB安全基线检查-系统六部', crontab: '0 0 18 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.232.10.9', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260620-027', category_code: 'gaussdb', category_name: 'GaussDB', dept_name: '系统六部', creator: '孙磊', create_time: '2026-06-20 09:00:00', modifier: '孙磊', modify_time: '2026-07-21 11:30:00', batch_size: '50', wait_time: '60' },
  { plan_id: 'PLN20260201000028', strategy_id: 'STG20260101000021', dept_id: 'D002', plan_name: 'GaussDB安全基线检查-系统二部', crontab: '0 0 19 1 * ?', trial_times: '2', cur_trial_times: '0', trial_ips: '10.232.10.8', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260715-028', category_code: 'gaussdb', category_name: 'GaussDB', dept_name: '系统二部', creator: '李文博', create_time: '2026-07-15 14:00:00', modifier: '李文博', modify_time: '2026-07-25 10:00:00', batch_size: '50', wait_time: '30' },
  // STG023 Redis性能 (2)
  { plan_id: 'PLN20260201000029', strategy_id: 'STG20260101000023', dept_id: 'D005', plan_name: 'Redis性能优化检查-系统五部', crontab: '0 0 20 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.226.77.22', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260625-029', category_code: 'redis', category_name: 'Redis', dept_name: '系统五部', creator: '周婷', create_time: '2026-06-25 10:00:00', modifier: '周婷', modify_time: '2026-07-22 14:15:00', batch_size: '100', wait_time: '0' },
  { plan_id: 'PLN20260201000030', strategy_id: 'STG20260101000023', dept_id: 'D001', plan_name: 'Redis性能优化检查-系统一部', crontab: '0 0 21 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.226.77.21', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260710-030', category_code: 'redis', category_name: 'Redis', dept_name: '系统一部', creator: '陈明', create_time: '2026-07-10 09:30:00', modifier: '陈明', modify_time: '2026-07-24 11:00:00', batch_size: '100', wait_time: '10' },
  // STG025 TLQ安全 (1)
  { plan_id: 'PLN20260201000031', strategy_id: 'STG20260101000025', dept_id: 'D002', plan_name: 'TongLinkQ安全基线检查-系统二部', crontab: '0 0 22 * * ?', trial_times: '1', cur_trial_times: '1', trial_ips: '10.218.55.12', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260701-031', category_code: 'tonglinkq', category_name: 'TongLinkQ', dept_name: '系统二部', creator: '李文博', create_time: '2026-07-01 14:00:00', modifier: '李文博', modify_time: '2026-07-23 10:30:00', batch_size: '50', wait_time: '0' },
  // STG027 TongWeb安全 (1)
  { plan_id: 'PLN20260201000032', strategy_id: 'STG20260101000027', dept_id: 'D002', plan_name: 'TongWeb安全基线检查-系统二部', crontab: '0 0 23 ? * MON', trial_times: '1', cur_trial_times: '1', trial_ips: '10.219.40.8', status: '1', enable_flag: '01', jobtimer_id: 'JT-20260705-032', category_code: 'tongweb', category_name: 'TongWeb', dept_name: '系统二部', creator: '冯涛', create_time: '2026-07-05 10:00:00', modifier: '冯涛', modify_time: '2026-07-25 14:45:00', batch_size: '50', wait_time: '10' },
  // PLN004 修正：关联已发布策略STG005(MySQL)而非草稿STG004(Redis)
  { plan_id: 'PLN20260201000004', strategy_id: 'STG20260101000005', dept_id: 'D005', plan_name: 'MySQL安全基线检查-系统五部', crontab: '0 0 4 * * ?', trial_times: '3', cur_trial_times: '1', trial_ips: '10.231.20.15', status: '0', enable_flag: '01', jobtimer_id: 'JT-20260710-004', category_code: 'mysql', category_name: 'MySQL', dept_name: '系统五部', creator: '周婷', create_time: '2026-07-10 10:30:00', modifier: '周婷', modify_time: '2026-07-22 14:45:00', batch_size: '100', wait_time: '0' },
]

// ==================== 结果数据 ====================

interface ResultSeed {
  strategy: InspectStrategy
  machine: MachineInfo
  componentId: string
  componentVersion: string
  checkName: string
  objName: string
  stdValue: string
  currentValue: string
  status: string
  baselineNo: string
  riskLevel: string
  crossCenter: string
  date: string
  time: string
  isException?: string
}

function buildResult(seed: ResultSeed): InspectResult {
  const { strategy: s, machine: m } = seed
  return {
    strategy_id: s.strategy_id,
    dept_id: s.dept_id || 'D005',
    component_id: seed.componentId,
    check_name: seed.checkName,
    host_name: m.host_name,
    component_version: seed.componentVersion,
    job_id: `JOB-${seed.date.replace(/-/g, '')}-${s.strategy_id.slice(-3)}`,
    strategy_name: s.strategy_name,
    tags: s.tags,
    dept_name: s.dept_name || '系统五部',
    category_code: s.category_id,
    category_name: s.category_name,
    baseline_no: seed.baselineNo,
    resource_type: m.resource_type,
    top_type: s.top_type,
    sub_type: s.sub_type,
    obj_name: seed.objName,
    std_value: seed.stdValue,
    current_value: seed.currentValue,
    result_status: seed.status,
    inspect_date: seed.date,
    inspect_time: seed.time,
    cross_center: seed.crossCenter,
    risk_level: seed.riskLevel,
    trial_flag: '1',
    is_exception: seed.isException || '',
    exception_remark: seed.isException === '1' ? '该机器为临时环境，由应用侧自行管理' : '',
    exception_applicant: seed.isException === '1' ? m.admin_name : '',
    exception_apply_time: seed.isException === '1' ? '2026-07-20 10:30:00' : '',
    admin_name: m.admin_name,
    admin_id: `U${m.app_id.slice(3, 8)}`,
    admin_group: m.admin_group,
    app_id: m.app_id,
    app_name: m.app_name,
    ip: m.ip,
  }
}

const stg001 = strategies.find(s => s.strategy_id === 'STG20260101000001')!
const stg002 = strategies.find(s => s.strategy_id === 'STG20260101000002')!
const stg003 = strategies.find(s => s.strategy_id === 'STG20260101000003')!
const stg005 = strategies.find(s => s.strategy_id === 'STG20260101000005')!
const stg006 = strategies.find(s => s.strategy_id === 'STG20260101000006')!
const stg007 = strategies.find(s => s.strategy_id === 'STG20260101000007')!

const linuxMs = machines.filter(m => m.resource_type === 'Linux')
const oracleMs = machines.filter(m => m.resource_type === 'Oracle')
const mysqlMs = machines.filter(m => m.resource_type === 'MySQL')
const windowsMs = machines.filter(m => m.resource_type === 'Windows')
const gaussMs = machines.filter(m => m.resource_type === 'GaussDB')
const tlqMs = machines.filter(m => m.resource_type === 'TongLinkQ')

export const results: InspectResult[] = [
  // === STG001 Linux日志 (12) ===
  buildResult({ strategy: stg001, machine: linuxMs[0], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', objName: '/var/log/secure', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate > 27', status: '正常', baselineNo: 'BL-SEC-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[1], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', objName: '/var/log/secure', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate > 27', status: '正常', baselineNo: 'BL-SEC-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[2], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/messages_日志留存配置是否存在', objName: '/var/log/messages', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate 12', status: '异常', baselineNo: 'BL-SEC-002', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[3], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/messages_日志留存配置是否存在', objName: '/var/log/messages', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate > 27', status: '正常', baselineNo: 'BL-SEC-002', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[4], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', objName: '/var/log/secure', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate 8', status: '异常', baselineNo: 'BL-SEC-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[5], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', objName: '/var/log/secure', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate > 27', status: '正常', baselineNo: 'BL-SEC-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[6], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/messages_日志留存配置是否存在', objName: '/var/log/messages', stdValue: 'weekly and rotate > 27', currentValue: 'not configured', status: '异常', baselineNo: 'BL-SEC-002', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[7], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', objName: '/var/log/secure', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate > 27', status: '正常', baselineNo: 'BL-SEC-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[2], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'PERM_/etc/passwd_文件权限检查', objName: '/etc/passwd', stdValue: '644', currentValue: '644', status: '正常', baselineNo: 'BL-SEC-003', riskLevel: '03', crossCenter: 'N', date: '2026-07-24', time: '19:10:28' }),
  buildResult({ strategy: stg001, machine: linuxMs[4], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'PERM_/etc/passwd_文件权限检查', objName: '/etc/passwd', stdValue: '644', currentValue: '666', status: '异常', baselineNo: 'BL-SEC-003', riskLevel: '03', crossCenter: 'N', date: '2026-07-24', time: '19:10:28', isException: '1' }),
  buildResult({ strategy: stg001, machine: linuxMs[0], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', objName: '/var/log/secure', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate > 27', status: '正常', baselineNo: 'BL-SEC-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '19:10:27' }),
  buildResult({ strategy: stg001, machine: linuxMs[2], componentId: '8cedaebf086d42449468658aea0b7f17', componentVersion: '8', checkName: 'LOGSIZE_/var/log/messages_日志留存配置是否存在', objName: '/var/log/messages', stdValue: 'weekly and rotate > 27', currentValue: 'weekly and rotate 12', status: '异常', baselineNo: 'BL-SEC-002', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '19:10:27' }),
  // === STG002 Oracle (8) ===
  buildResult({ strategy: stg002, machine: oracleMs[0], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_AUDIT_审计配置检查', objName: 'audit_trail', stdValue: 'DB', currentValue: 'DB', status: '正常', baselineNo: 'BL-ORA-001', riskLevel: '02', crossCenter: 'AE', date: '2026-07-24', time: '02:15:30' }),
  buildResult({ strategy: stg002, machine: oracleMs[1], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_AUDIT_审计配置检查', objName: 'audit_trail', stdValue: 'DB', currentValue: 'NONE', status: '异常', baselineNo: 'BL-ORA-001', riskLevel: '02', crossCenter: 'AE', date: '2026-07-24', time: '02:15:30' }),
  buildResult({ strategy: stg002, machine: oracleMs[2], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_AUDIT_审计配置检查', objName: 'audit_trail', stdValue: 'DB', currentValue: 'DB', status: '正常', baselineNo: 'BL-ORA-001', riskLevel: '02', crossCenter: 'AE', date: '2026-07-24', time: '02:15:30' }),
  buildResult({ strategy: stg002, machine: oracleMs[0], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_PWD_密码有效期检查', objName: 'DEFAULT profile', stdValue: 'PASSWORD_LIFE_TIME <= 90', currentValue: 'PASSWORD_LIFE_TIME = 180', status: '警告', baselineNo: 'BL-ORA-002', riskLevel: '01', crossCenter: 'N', date: '2026-07-24', time: '02:15:30' }),
  buildResult({ strategy: stg002, machine: oracleMs[1], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_PWD_密码有效期检查', objName: 'DEFAULT profile', stdValue: 'PASSWORD_LIFE_TIME <= 90', currentValue: 'PASSWORD_LIFE_TIME = 90', status: '正常', baselineNo: 'BL-ORA-002', riskLevel: '01', crossCenter: 'N', date: '2026-07-24', time: '02:15:30' }),
  buildResult({ strategy: stg002, machine: oracleMs[2], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_PWD_密码有效期检查', objName: 'DEFAULT profile', stdValue: 'PASSWORD_LIFE_TIME <= 90', currentValue: 'PASSWORD_LIFE_TIME = 60', status: '正常', baselineNo: 'BL-ORA-002', riskLevel: '01', crossCenter: 'N', date: '2026-07-24', time: '02:15:30' }),
  buildResult({ strategy: stg002, machine: oracleMs[0], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_AUDIT_审计配置检查', objName: 'audit_trail', stdValue: 'DB', currentValue: 'DB', status: '正常', baselineNo: 'BL-ORA-001', riskLevel: '02', crossCenter: 'AE', date: '2026-07-23', time: '02:15:28' }),
  buildResult({ strategy: stg002, machine: oracleMs[1], componentId: 'b2c3d4e5f6a7489901bcdef234567890', componentVersion: '5', checkName: 'ORA_PWD_密码有效期检查', objName: 'DEFAULT profile', stdValue: 'PASSWORD_LIFE_TIME <= 90', currentValue: 'PASSWORD_LIFE_TIME = 180', status: '警告', baselineNo: 'BL-ORA-002', riskLevel: '01', crossCenter: 'N', date: '2026-07-23', time: '02:15:28' }),
  // === STG005 MySQL (7) ===
  buildResult({ strategy: stg005, machine: mysqlMs[0], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'MEDIUM', status: '正常', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '05:20:15' }),
  buildResult({ strategy: stg005, machine: mysqlMs[1], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'LOW', status: '异常', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '05:20:15' }),
  buildResult({ strategy: stg005, machine: mysqlMs[2], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'STRONG', status: '正常', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '05:20:15' }),
  buildResult({ strategy: stg005, machine: mysqlMs[0], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'MEDIUM', status: '正常', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '05:20:12' }),
  buildResult({ strategy: stg005, machine: mysqlMs[1], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'LOW', status: '异常', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '05:20:12' }),
  buildResult({ strategy: stg005, machine: mysqlMs[2], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'MEDIUM', status: '正常', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-22', time: '05:20:10' }),
  buildResult({ strategy: stg005, machine: mysqlMs[0], componentId: 'e5f6a7b8c9d0412234ef567890123456', componentVersion: '4', checkName: 'MYSQL_PWD_密码策略检查', objName: 'validate_password_policy', stdValue: 'MEDIUM', currentValue: 'LOW', status: '警告', baselineNo: 'BL-MYSQL-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-22', time: '05:20:10' }),
  // === STG007 Windows (6) ===
  buildResult({ strategy: stg007, machine: windowsMs[0], componentId: 'a7b8c9d0e1f2434456a7890123456789', componentVersion: '3', checkName: 'WIN_POLICY_账户锁定策略检查', objName: 'AccountLockoutThreshold', stdValue: '<= 5', currentValue: '5', status: '正常', baselineNo: 'BL-WIN-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '07:05:40' }),
  buildResult({ strategy: stg007, machine: windowsMs[1], componentId: 'a7b8c9d0e1f2434456a7890123456789', componentVersion: '3', checkName: 'WIN_POLICY_账户锁定策略检查', objName: 'AccountLockoutThreshold', stdValue: '<= 5', currentValue: '10', status: '异常', baselineNo: 'BL-WIN-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '07:05:40' }),
  buildResult({ strategy: stg007, machine: windowsMs[2], componentId: 'a7b8c9d0e1f2434456a7890123456789', componentVersion: '3', checkName: 'WIN_POLICY_账户锁定策略检查', objName: 'AccountLockoutThreshold', stdValue: '<= 5', currentValue: '3', status: '正常', baselineNo: 'BL-WIN-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '07:05:40' }),
  buildResult({ strategy: stg007, machine: windowsMs[0], componentId: 'a7b8c9d0e1f2434456a7890123456789', componentVersion: '3', checkName: 'WIN_POLICY_账户锁定策略检查', objName: 'AccountLockoutThreshold', stdValue: '<= 5', currentValue: '5', status: '正常', baselineNo: 'BL-WIN-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '07:05:38' }),
  buildResult({ strategy: stg007, machine: windowsMs[1], componentId: 'a7b8c9d0e1f2434456a7890123456789', componentVersion: '3', checkName: 'WIN_POLICY_账户锁定策略检查', objName: 'AccountLockoutThreshold', stdValue: '<= 5', currentValue: '10', status: '异常', baselineNo: 'BL-WIN-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '07:05:38' }),
  buildResult({ strategy: stg007, machine: windowsMs[2], componentId: 'a7b8c9d0e1f2434456a7890123456789', componentVersion: '3', checkName: 'WIN_POLICY_账户锁定策略检查', objName: 'AccountLockoutThreshold', stdValue: '<= 5', currentValue: '0', status: '警告', baselineNo: 'BL-WIN-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-22', time: '07:05:35' }),
  // === STG006 GaussDB (6) ===
  buildResult({ strategy: stg006, machine: gaussMs[0], componentId: 'f6a7b8c9d0e1423345f6789012345678', componentVersion: '2', checkName: 'GAUSS_CONN_最大连接数检查', objName: 'max_connections', stdValue: '>= 500', currentValue: '1000', status: '正常', baselineNo: 'BL-GAUSS-001', riskLevel: '01', crossCenter: 'N', date: '2026-07-24', time: '06:30:20' }),
  buildResult({ strategy: stg006, machine: gaussMs[1], componentId: 'f6a7b8c9d0e1423345f6789012345678', componentVersion: '2', checkName: 'GAUSS_CONN_最大连接数检查', objName: 'max_connections', stdValue: '>= 500', currentValue: '200', status: '异常', baselineNo: 'BL-GAUSS-001', riskLevel: '01', crossCenter: 'N', date: '2026-07-24', time: '06:30:20' }),
  buildResult({ strategy: stg006, machine: gaussMs[0], componentId: 'f6a7b8c9d0e1423345f6789012345678', componentVersion: '2', checkName: 'GAUSS_CONN_最大连接数检查', objName: 'max_connections', stdValue: '>= 500', currentValue: '1000', status: '正常', baselineNo: 'BL-GAUSS-001', riskLevel: '01', crossCenter: 'N', date: '2026-07-23', time: '06:30:18' }),
  buildResult({ strategy: stg006, machine: gaussMs[1], componentId: 'f6a7b8c9d0e1423345f6789012345678', componentVersion: '2', checkName: 'GAUSS_CONN_最大连接数检查', objName: 'max_connections', stdValue: '>= 500', currentValue: '500', status: '正常', baselineNo: 'BL-GAUSS-001', riskLevel: '01', crossCenter: 'N', date: '2026-07-23', time: '06:30:18' }),
  buildResult({ strategy: stg006, machine: gaussMs[0], componentId: 'f6a7b8c9d0e1423345f6789012345678', componentVersion: '2', checkName: 'GAUSS_CONN_最大连接数检查', objName: 'max_connections', stdValue: '>= 500', currentValue: '800', status: '正常', baselineNo: 'BL-GAUSS-001', riskLevel: '01', crossCenter: 'N', date: '2026-07-22', time: '06:30:15' }),
  buildResult({ strategy: stg006, machine: gaussMs[1], componentId: 'f6a7b8c9d0e1423345f6789012345678', componentVersion: '2', checkName: 'GAUSS_CONN_最大连接数检查', objName: 'max_connections', stdValue: '>= 500', currentValue: '200', status: '异常', baselineNo: 'BL-GAUSS-001', riskLevel: '01', crossCenter: 'N', date: '2026-07-22', time: '06:30:15' }),
  // === STG003 TongLinkQ (6) ===
  buildResult({ strategy: stg003, machine: tlqMs[0], componentId: 'c3d4e5f6a7b8490012cdef3456789012', componentVersion: '2', checkName: 'TLQ_QDEPTH_队列深度阈值检查', objName: 'QUEUE.SVRCONN', stdValue: 'QDEPTH < 1000', currentValue: '350', status: '正常', baselineNo: 'BL-TLQ-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '03:35:10' }),
  buildResult({ strategy: stg003, machine: tlqMs[1], componentId: 'c3d4e5f6a7b8490012cdef3456789012', componentVersion: '2', checkName: 'TLQ_QDEPTH_队列深度阈值检查', objName: 'QUEUE.SVRCONN', stdValue: 'QDEPTH < 1000', currentValue: '1520', status: '异常', baselineNo: 'BL-TLQ-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-24', time: '03:35:10' }),
  buildResult({ strategy: stg003, machine: tlqMs[0], componentId: 'c3d4e5f6a7b8490012cdef3456789012', componentVersion: '2', checkName: 'TLQ_QDEPTH_队列深度阈值检查', objName: 'QUEUE.SVRCONN', stdValue: 'QDEPTH < 1000', currentValue: '420', status: '正常', baselineNo: 'BL-TLQ-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '03:35:08' }),
  buildResult({ strategy: stg003, machine: tlqMs[1], componentId: 'c3d4e5f6a7b8490012cdef3456789012', componentVersion: '2', checkName: 'TLQ_QDEPTH_队列深度阈值检查', objName: 'QUEUE.SVRCONN', stdValue: 'QDEPTH < 1000', currentValue: '980', status: '警告', baselineNo: 'BL-TLQ-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-23', time: '03:35:08' }),
  buildResult({ strategy: stg003, machine: tlqMs[0], componentId: 'c3d4e5f6a7b8490012cdef3456789012', componentVersion: '2', checkName: 'TLQ_QDEPTH_队列深度阈值检查', objName: 'QUEUE.SVRCONN', stdValue: 'QDEPTH < 1000', currentValue: '280', status: '正常', baselineNo: 'BL-TLQ-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-22', time: '03:35:05' }),
  buildResult({ strategy: stg003, machine: tlqMs[1], componentId: 'c3d4e5f6a7b8490012cdef3456789012', componentVersion: '2', checkName: 'TLQ_QDEPTH_队列深度阈值检查', objName: 'QUEUE.SVRCONN', stdValue: 'QDEPTH < 1000', currentValue: '1100', status: '异常', baselineNo: 'BL-TLQ-001', riskLevel: '02', crossCenter: 'N', date: '2026-07-22', time: '03:35:05' }),
]

// ==================== 缺失结果数据 ====================

export const missResults: InspectExecMiss[] = [
  { miss_id: 'MIS001', plan_id: 'PLN20260201000001', strategy_id: 'STG20260101000001', component_id: '8cedaebf086d42449468658aea0b7f17', check_name: 'LOGSIZE_/var/log/secure_日志留存配置是否存在', obj_name: '/var/log/secure', ip: '10.223.49.200', host_name: 'HQxPVAL-ECAS-RE20', resource_type: 'Linux', inspect_date: '2026-07-24', inspect_time: '19:10:28' },
  { miss_id: 'MIS002', plan_id: 'PLN20260201000001', strategy_id: 'STG20260101000001', component_id: '8cedaebf086d42449468658aea0b7f17', check_name: 'LOGSIZE_/var/log/messages_日志留存配置是否存在', obj_name: '/var/log/messages', ip: '10.223.49.200', host_name: 'HQxPVAL-ECAS-RE20', resource_type: 'Linux', inspect_date: '2026-07-24', inspect_time: '19:10:28' },
  { miss_id: 'MIS003', plan_id: 'PLN20260201000001', strategy_id: 'STG20260101000001', component_id: '8cedaebf086d42449468658aea0b7f17', check_name: 'PERM_/etc/passwd_文件权限检查', obj_name: '/etc/passwd', ip: '10.240.1.88', host_name: 'HQhPVAL-CLOA-NG15', resource_type: 'Linux', inspect_date: '2026-07-24', inspect_time: '19:10:28' },
  { miss_id: 'MIS004', plan_id: 'PLN20260201000002', strategy_id: 'STG20260101000002', component_id: 'b2c3d4e5f6a7489901bcdef234567890', check_name: 'ORA_AUDIT_审计配置检查', obj_name: 'audit_trail', ip: '10.230.20.5', host_name: 'HQoPVAL-ORCL-D05', resource_type: 'Oracle', inspect_date: '2026-07-24', inspect_time: '02:15:30' },
  { miss_id: 'MIS005', plan_id: 'PLN20260201000005', strategy_id: 'STG20260101000005', component_id: 'e5f6a7b8c9d0412234ef567890123456', check_name: 'MYSQL_PWD_密码策略检查', obj_name: 'validate_password_policy', ip: '10.231.22.3', host_name: 'HQmPVAL-MYSQL-C01', resource_type: 'MySQL', inspect_date: '2026-07-24', inspect_time: '05:20:15' },
]

// ==================== 辅助函数 ====================

/** 获取策略关联的组件 */
export function getComponentsByStrategy(strategyId: string): InspectComponent[] {
  return components.filter(c => c.strategy_id === strategyId)
}

/** 获取组件的检查项 */
export function getItemsByComponent(componentId: string): InspectItem[] {
  return checkItems.filter(i => i.component_id === componentId)
}

/** 获取策略关联的机器（根据资源范围模拟CMDB查询） */
export function getMachinesByStrategy(strategy: InspectStrategy): MachineInfo[] {
  const scope = JSON.parse(strategy.inspect_scope || '{}')
  const keyword = (scope.osKeyword?.[0] || '').toLowerCase()
  if (keyword.includes('linux'))
    return machines.filter(m => m.resource_type === 'Linux')
  if (keyword.includes('windows'))
    return machines.filter(m => m.resource_type === 'Windows')
  if (keyword.includes('oracle'))
    return machines.filter(m => m.resource_type === 'Oracle')
  if (keyword.includes('mysql'))
    return machines.filter(m => m.resource_type === 'MySQL')
  if (keyword.includes('gaussdb'))
    return machines.filter(m => m.resource_type === 'GaussDB')
  if (keyword.includes('redis'))
    return machines.filter(m => m.resource_type === 'Redis')
  if (keyword.includes('tonglinkq'))
    return machines.filter(m => m.resource_type === 'TongLinkQ')
  if (keyword.includes('tongweb'))
    return machines.filter(m => m.resource_type === 'TongWeb')
  if (keyword.includes('postgresql'))
    return machines.filter(m => m.resource_type === 'PostgreSQL')
  if (keyword.includes('mongodb'))
    return machines.filter(m => m.resource_type === 'MongoDB')
  return machines.slice(0, 6)
}

/** 获取历史检查结果（明细表数据） */
export function getHistoryDetails(hostName: string, checkName: string): InspectExecDetail[] {
  const matched = results.filter(r => r.host_name === hostName && r.check_name === checkName)
  const details: InspectExecDetail[] = []
  const baseDates = ['2026-07-24', '2026-07-23', '2026-07-22', '2026-07-21', '2026-07-20', '2026-07-19', '2026-07-18']
  baseDates.forEach((date, idx) => {
    const existing = matched.find(r => r.inspect_date === date)
    const source = existing || matched[0]
    if (!source)
      return
    details.push({
      detail_id: `DTL-${date.replace(/-/g, '')}-${idx}`,
      plan_id: 'PLN20260201000001',
      jobtimer_id: 'JT-20260701-001',
      job_id: source.job_id,
      component_id: source.component_id,
      component_version: source.component_version,
      trial_flag: '1',
      check_name: source.check_name,
      ip: source.ip,
      host_name: source.host_name,
      resource_type: source.resource_type,
      obj_name: source.obj_name,
      std_value: source.std_value,
      current_value: existing ? existing.current_value : source.current_value,
      baseline_no: source.baseline_no,
      result_status: existing ? existing.result_status : source.result_status,
      inspect_date: date,
      inspect_time: `${source.inspect_time.slice(0, 6)}${String(27 + idx % 3).padStart(2, '0')}`,
    })
  })
  return details
}
