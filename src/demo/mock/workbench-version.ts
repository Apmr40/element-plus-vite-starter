/**
 * 操作工作台 - 版本历史 mock 数据
 *
 * 对应交互原型：docs/prototypes/编辑操作-版本历史-交互原型.html
 * 数据主体：op0901-1「定制应用健康检查」的 V1~V3 版本链 + V4 外部发布数据。
 *
 * - mockOperationVersions 为可变数组，API 层 publishNewVersion / simulateExternalPublish
 *   直接 push 新版本，模拟 DB 表 iop_mc_app_serv_version 的写入。
 * - mockDraftSnapshotV3 为草稿 d1 的表单快照（基于 V3），用于编辑弹窗回填。
 */
import type { CustomComponentForm, OperationSnapshot, OperationVersion } from '../types/workbench'

// ============ 版本快照（与原型 VERSIONS 对齐） ============

const SNAP_V1: OperationSnapshot = {
  nameEn: 'app_health_check',
  nameCn: '定制应用健康检查',
  category: '查询',
  risk: '低',
  tplType: '脚本 · Shell',
  timeout: '30 秒',
  successFlag: '退出码 = 0',
  description: '检查定制应用运行状态并输出报告',
  script: `#!/bin/bash
# 定制应用健康检查 v1
STATUS=$(curl -s http://localhost:8080/health)
echo "STATUS: $STATUS"
exit 0`,
}

const SNAP_V2: OperationSnapshot = {
  ...SNAP_V1,
  successFlag: '退出码 = 0 且输出包含 SUCCESS',
  script: `#!/bin/bash
# 定制应用健康检查 v2
ENV=\${env}
STATUS=$(curl -s http://$ENV-api:8080/health)
echo "STATUS: $STATUS"
[ "$STATUS" = "UP" ] && echo SUCCESS`,
}

const SNAP_V3: OperationSnapshot = {
  ...SNAP_V2,
  timeout: '60 秒',
  description: '检查定制应用运行状态并输出报告（含主从延迟）',
  script: `#!/bin/bash
# 定制应用健康检查 v3
ENV=\${env}
STATUS=$(curl -s --max-time 50 http://$ENV-api:8080/health)
LAG=$(redis-cli info replication | grep lag)
echo "STATUS: $STATUS | LAG: $LAG"
[ "$STATUS" = "UP" ] && echo SUCCESS`,
}

/** V4：同事（王运维）发布 —— 用于 simulateExternalPublish */
export const SNAP_V4: OperationSnapshot = {
  ...SNAP_V3,
  timeout: '120 秒',
  script: `#!/bin/bash
# 定制应用健康检查 v4
ENV=\${env}
STATUS=$(curl -s --max-time 110 http://$ENV-api:8080/health)
LAG=$(redis-cli info replication | grep lag)
redis-cli -n 0 flushdb  # 检查前清理缓存
echo "STATUS: $STATUS | LAG: $LAG"
[ "$STATUS" = "UP" ] && echo SUCCESS`,
}

// ============ 版本记录（可变，API 层追加） ============

export const mockOperationVersions: OperationVersion[] = [
  {
    id: 'ver-0901-1',
    operationId: 'op0901-1',
    versionNo: 1,
    publishTime: '2026-05-20 09:00',
    publisher: '李平台',
    changeType: 'create',
    changeSummary: ['创建操作'],
    snapshot: SNAP_V1,
  },
  {
    id: 'ver-0901-2',
    operationId: 'op0901-1',
    versionNo: 2,
    publishTime: '2026-06-15 10:12',
    publisher: '王运维',
    changeType: 'update',
    changeSummary: ['新增参数 $' + '{env}', '修改成功判定规则'],
    snapshot: SNAP_V2,
  },
  {
    id: 'ver-0901-3',
    operationId: 'op0901-1',
    versionNo: 3,
    publishTime: '2026-07-28 14:30',
    publisher: '贺诗辉',
    changeType: 'update',
    changeSummary: ['修改脚本内容', '超时时间 30s → 60s'],
    snapshot: SNAP_V3,
  },
]

// ============ 草稿 d1 的表单快照（基于 V3） ============

export const mockDraftSnapshotV3: CustomComponentForm = {
  servicename: 'app_health_check',
  servicecnname: '定制应用健康检查',
  category: 'query',
  timeout: 60,
  description: '检查定制应用运行状态并输出报告（含主从延迟）',
  tplCategory: 'script',
  scriptSubtype: '1',
  scriptContent: SNAP_V3.script,
  scriptSuccessFlag: '退出码 = 0 且输出包含 SUCCESS',
  apiSubtype: 'http',
  apiProtocol: 'https',
  apiMethod: 'POST',
  apiUrl: '',
  apiHeaders: [],
  apiBodyFormat: 'json',
  apiBodyJson: '',
  apiFormRows: [],
  tcpHost: '',
  tcpPort: '',
  tcpContent: '',
  apiSuccessFlag: '',
  parms: [
    { id: 'parm_d1_1', name: 'env', cnName: '环境', ctrlType: '1', presetValue: 'prod,staging,dev', validateRule: '', encrypted: false, source: 'template' },
  ],
}
