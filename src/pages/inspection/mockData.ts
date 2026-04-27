// Mock data generator for testing
export function generateMockCSVFiles() {
  return [
    {
      id: 'file_1',
      originalName: 'server_list.csv',
      fileName: 'server_list.csv',
      size: 2456789,
      columns: ['server_id', 'server_name', 'ip_address', 'os_type', 'status', 'port', 'environment'],
      rows: 1200,
      alias: 'server_list',
      expanded: false,
      status: 'success',
    },
    {
      id: 'file_2',
      originalName: 'rule_config.csv',
      fileName: 'rule_config.csv',
      size: 856432,
      columns: ['rule_id', 'rule_name', 'rule_type', 'severity', 'enabled', 'created_at'],
      rows: 350,
      alias: 'rule_config',
      expanded: false,
      status: 'success',
    },
    {
      id: 'file_3',
      originalName: 'alert_history.csv',
      fileName: 'alert_history.csv',
      size: 5342123,
      columns: ['alert_id', 'server_id', 'alert_type', 'alert_time', 'status', 'resolved', 'message'],
      rows: 8500,
      alias: 'alert_history',
      expanded: false,
      status: 'success',
    },
  ]
}

export function generateMockTestResult() {
  return {
    passed: 7,
    total: 10,
    details: [
      {
        ruleName: 'SSL证书有效期检查',
        status: 'pass',
        message: '规则匹配成功，23个服务器符合条件',
      },
      {
        ruleName: '端口合规检查',
        status: 'pass',
        message: '规则匹配成功，512个端口符合规范',
      },
      {
        ruleName: '磁盘空间使用率检查',
        status: 'pass',
        message: '规则匹配成功，98%的磁盘使用率低于阈值',
      },
      {
        ruleName: '内存使用率检查',
        status: 'fail',
        message: '规则匹配失败，发现5个服务器内存使用率超过80%',
      },
      {
        ruleName: 'CPU使用率检查',
        status: 'pass',
        message: '规则匹配成功，CPU使用率均在合理范围内',
      },
      {
        ruleName: '网络连接数检查',
        status: 'pass',
        message: '规则匹配成功，网络连接数正常',
      },
      {
        ruleName: '日志文件大小检查',
        status: 'fail',
        message: '规则匹配失败，发现3个服务器日志文件过大',
      },
      {
        ruleName: '用户登录检查',
        status: 'pass',
        message: '规则匹配成功，用户登录行为正常',
      },
      {
        ruleName: '服务状态检查',
        status: 'pass',
        message: '规则匹配成功，所有核心服务运行正常',
      },
      {
        ruleName: '备份状态检查',
        status: 'pass',
        message: '规则匹配成功，备份任务全部完成',
      },
    ],
  }
}

export function generateMockRuleConfig() {
  return {
    id: '',
    name: '基础合规检查规则',
    techStack: ['java', 'python', 'nodejs'],
    tags: ['security', 'performance', 'standard'],
    status: 'disabled',
    version: 'V1.0',
    description: '基础合规检查规则，用于监控服务器基本配置',
    config: {
      type: 'advanced',
      fields: [
        'server_list.server_id',
        'server_list.server_name',
        'server_list.ip_address',
        'server_list.os_type',
      ],
      mode: 'advanced',
    },
  }
}
