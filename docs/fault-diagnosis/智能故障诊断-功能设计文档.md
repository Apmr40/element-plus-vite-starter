# 智能故障诊断功能设计方案

**文档版本**: v1.0  
**创建日期**: 2026-07-21  
**作者**: 贺诗辉 (Apmr40)  
**状态**: 设计阶段

---

## 一、功能概述

智能故障诊断是操作工作台的核心 AI 能力之一，旨在帮助用户快速定位操作执行失败的根因，并提供可执行的修复建议。

### 1.1 核心价值

- **降低排障时间**：从人工分析日志到 AI 自动诊断，预计节省 70% 排障时间
- **知识沉淀**：通过相似案例匹配，复用历史解决方案
- **降低门槛**：新手运维也能快速定位复杂问题

### 1.2 适用场景

- 操作执行失败后的根因分析
- 批量操作中部分资源失败的原因诊断
- 重复性故障的快速定位

---

## 二、模块划分

```
┌─────────────────────────────────────────────────────────┐
│                    操作工作台                              │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  执行结果弹窗  │───→│  AI 诊断面板   │←──│  执行历史   │ │
│  │ (失败时触发)  │    │  (侧边滑出)   │    │ (相似案例)  │ │
│  └──────────────┘    └──────┬───────┘    └────────────┘ │
│                             │                            │
└─────────────────────────────┼────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  DiagnosticService │
                    │  (诊断服务层)       │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
        │ 上下文收集  │  │  Prompt 构建│  │  结果解析  │
        │ Context    │  │  Builder   │  │  Parser    │
        └───────────┘  └───────────┘  └───────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   LLM 调用层       │
                    │ (Ollama / API)     │
                    └───────────────────┘
```

### 2.1 核心模块说明

| 模块 | 职责 | 技术栈 |
|------|------|--------|
| **UI 层** | 诊断面板展示、交互 | Vue 3 + Element Plus |
| **服务层** | 上下文收集、Prompt 构建、结果解析 | TypeScript |
| **LLM 层** | 模型调用、流式输出 | Ollama (llama3.1:8b) / 远程 API |
| **数据层** | 执行历史、相似案例存储 | MySQL + 向量数据库(可选) |

---

## 三、核心流程

### 3.1 诊断流程

```
用户操作                    系统处理
────────                    ────────
                            
执行操作失败 ──────────→  检测到失败状态
     │                        │
     ▼                        ▼
点击"AI诊断" ──────────→  收集诊断上下文
     │                   ├─ 操作定义（名称、参数、脚本）
     │                   ├─ 失败日志（errorMsg、资源信息）
     │                   ├─ 资源信息（CMDB 数据）
     │                   └─ 历史相似案例（最近10条同类失败）
     │                        │
     │                        ▼
     │                   构建 Prompt
     │                   ├─ System: 运维诊断专家角色
     │                   ├─ Context: 操作+资源+日志
     │                   ├─ History: 相似案例
     │                   └─ Output: 要求结构化 JSON 输出
     │                        │
     │                        ▼
     │                   调用 LLM
     │                   ├─ 本地 Ollama (llama3.1:8b)
     │                   └─ 或远程 API (备用)
     │                        │
     │                        ▼
     │                   解析诊断结果
     │                   ├─ rootCause: 根因分析
     │                   ├─ confidence: 置信度
     │                   ├─ suggestions: 修复建议[]
     │                   ├─ relatedOps: 推荐操作[]
     │                   └─ similarCases: 相似案例[]
     │                        │
     ▼                        ▼
诊断面板展示 ←──────────  渲染结构化结果
├─ 根因分析（置信度标签）
├─ 修复建议（可点击执行）
├─ 推荐操作（跳转到操作组件）
└─ 相似案例（展开查看详情）
```

### 3.2 数据流

```
输入数据                          处理逻辑                        输出数据
─────────                        ────────                        ─────────
                                 
ExecutionRecord                  ContextBuilder                  DiagnosticResult
├─ operation                     ├─ 提取操作信息                 ├─ rootCause
├─ failure                       ├─ 提取失败信息                 ├─ suggestions[]
│  ├─ errorMsg                   ├─ 查询 CMDB                   ├─ relatedOperations[]
│  └─ failedResources[]          ├─ 检索相似案例                 └─ similarCases[]
└─ resourceInfo                  └─ 构建 Prompt
                                        │
                                        ▼
                                 LLMService
                                 ├─ 调用 Ollama
                                 └─ 流式输出
                                        │
                                        ▼
                                 ResultParser
                                 ├─ JSON 解析
                                 ├─ 校验完整性
                                 └─ 格式化输出
```

---

## 四、数据结构设计

### 4.1 诊断上下文（输入）

```typescript
interface DiagnosticContext {
  // 操作信息
  operation: {
    id: string
    name: string              // 操作名称
    category: string          // 分类
    script?: string           // 执行脚本内容
    params?: Record<string, any>  // 用户填写的参数
  }
  
  // 失败信息
  failure: {
    recordId: string          // 执行记录 ID
    status: 'failed'
    errorMsg: string          // 错误信息
    failedResources: Array<{  // 失败资源
      pk: string
      pkDisplay: string
      errorMsg: string
      duration?: number
    }>
    executeTime: string
    duration?: number
  }
  
  // 资源信息（从 CMDB 获取）
  resourceInfo?: {
    os: string                // 操作系统
    env: string               // 环境（prod/test/dev）
    datacenter: string        // 机房
    cluster: string           // 集群
    lastDeployTime?: string   // 最近部署时间
    recentChanges?: string[]  // 近期变更记录
  }
  
  // 历史相似案例
  similarCases: Array<{
    id: string
    operationName: string
    errorMsg: string
    rootCause?: string        // 上次诊断的根因
    solution?: string         // 上次的解决方案
    executeTime: string
    similarity: number        // 相似度 0-1
  }>
}
```

### 4.2 诊断结果（输出）

```typescript
interface DiagnosticResult {
  // 根因分析
  rootCause: {
    summary: string           // 一句话总结
    detail: string            // 详细分析
    category: DiagnosticCategory  // 根因分类
    confidence: number        // 置信度 0-1
  }
  
  // 修复建议
  suggestions: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string            // 建议动作
    command?: string          // 推荐命令
    risk: 'high' | 'medium' | 'low'  // 执行风险
    estimatedTime?: string    // 预估耗时
  }>
  
  // 推荐操作（可跳转到操作组件执行）
  relatedOperations: Array<{
    operationId: string
    operationName: string
    reason: string            // 推荐理由
    suggestedParams?: Record<string, any>
  }>
  
  // 相似案例引用
  similarCases: Array<{
    caseId: string
    title: string
    solution: string
    resolvedAt: string
    relevance: number
  }>
  
  // 元数据
  meta: {
    model: string             // 使用的模型
    tokensUsed: ***
    duration: number          // 诊断耗时(ms)
  }
}

type DiagnosticCategory = 
  | 'permission'       // 权限问题
  | 'resource'         // 资源不足（磁盘/内存/CPU）
  | 'network'          // 网络问题
  | 'config'           // 配置错误
  | 'dependency'       // 依赖服务异常
  | 'script_error'     // 脚本逻辑错误
  | 'timeout'          // 超时
  | 'environment'      // 环境问题
  | 'unknown'          // 未知
```

---

## 五、Prompt 设计

### 5.1 Prompt 模板

```typescript
const buildDiagnosticPrompt = (ctx: DiagnosticContext): string => {
  return `
## 角色
你是一个资深的 IT 运维专家，擅长分析操作执行失败的原因并给出修复建议。

## 任务
根据以下操作执行失败的上下文信息，分析失败根因并给出修复建议。

## 操作信息
- 操作名称：${ctx.operation.name}
- 操作分类：${ctx.operation.category}
- 执行参数：${JSON.stringify(ctx.operation.params, null, 2)}
${ctx.operation.script ? `- 执行脚本：\n\`\`\`bash\n${ctx.operation.script}\n\`\`\`` : ''}

## 失败信息
- 执行时间：${ctx.failure.executeTime}
- 失败资源数：${ctx.failure.failedResources.length}
- 失败资源详情：
${ctx.failure.failedResources.map(r => `  - ${r.pkDisplay}(${r.pk}): ${r.errorMsg}`).join('\n')}

## 资源环境信息
${ctx.resourceInfo ? `
- 操作系统：${ctx.resourceInfo.os}
- 环境：${ctx.resourceInfo.env}
- 机房：${ctx.resourceInfo.datacenter}
- 集群：${ctx.resourceInfo.cluster}
- 近期变更：${ctx.resourceInfo.recentChanges?.join(', ') || '无'}
` : '暂无资源信息'}

## 历史相似案例
${ctx.similarCases.length > 0 ? ctx.similarCases.map((c, i) => `
### 案例 ${i + 1}（相似度 ${Math.round(c.similarity * 100)}%）
- 操作：${c.operationName}
- 错误：${c.errorMsg}
- 根因：${c.rootCause || '未诊断'}
- 解决方案：${c.solution || '未记录'}
`).join('\n') : '暂无相似案例'}

## 输出要求
请以 JSON 格式输出诊断结果，结构如下：
{
  "rootCause": {
    "summary": "一句话总结根因",
    "detail": "详细分析过程",
    "category": "根因分类(permission/resource/network/config/dependency/script_error/timeout/environment/unknown)",
    "confidence": 0.85
  },
  "suggestions": [
    {
      "priority": "high/medium/low",
      "action": "具体修复动作",
      "command": "推荐执行的命令（可选）",
      "risk": "high/medium/low",
      "estimatedTime": "预估耗时"
    }
  ],
  "relatedOperations": [
    {
      "operationId": "推荐操作的ID（如果能匹配）",
      "operationName": "推荐操作名称",
      "reason": "推荐理由"
    }
  ],
  "similarCases": [
    {
      "caseId": "引用的案例ID",
      "title": "案例标题",
      "solution": "解决方案摘要",
      "relevance": 0.9
    }
  ]
}

注意：
1. confidence 表示你对诊断结果的置信度，0-1之间
2. suggestions 按优先级排序，最多3条
3. 如果历史案例中有成功解决的方案，优先引用
4. relatedOperations 中的 operationId 需要匹配系统中已有的操作
`
}
```

### 5.2 Prompt 优化要点

1. **角色定义**：明确 AI 的专家身份，提升回答专业性
2. **上下文完整**：提供操作、资源、历史案例的完整信息
3. **结构化输出**：强制 JSON 格式，便于前端解析和渲染
4. **置信度要求**：让 AI 自我评估，帮助用户判断可靠性
5. **相似案例引用**：优先复用历史解决方案，提高准确性

---

## 六、API 接口设计

### 6.1 诊断服务 API

```typescript
interface DiagnosticAPI {
  /**
   * 发起诊断
   * POST /api/workbench/diagnostic/analyze
   */
  analyze: (params: {
    recordId: string          // 执行记录 ID
    operationId: string       // 操作 ID
    resourceIds?: string[]    // 指定资源（可选，默认全部失败资源）
  }) => Promise<DiagnosticResult>
  
  /**
   * 获取诊断进度（流式输出时使用）
   * GET /api/workbench/diagnostic/progress/:taskId
   */
  getProgress: (taskId: string) => Promise<{
    status: 'pending' | 'analyzing' | 'completed' | 'failed'
    progress: number          // 0-100
    partialResult?: DiagnosticResult  // 部分结果（流式）
  }>
  
  /**
   * 获取历史诊断记录
   * GET /api/workbench/diagnostic/history
   */
  getHistory: (params: {
    operationId?: string
    limit?: number
  }) => Promise<Array<{
    id: string
    recordId: string
    operationName: string
    result: DiagnosticResult
    createdAt: string
  }>>
  
  /**
   * 反馈诊断结果（用于优化模型）
   * POST /api/workbench/diagnostic/feedback
   */
  submitFeedback: (params: {
    diagnosticId: string
    rating: 'helpful' | 'not_helpful'
    actualRootCause?: string  // 实际根因（用户纠正）
    actualSolution?: string   // 实际解决方案
  }) => Promise<void>
}
```

### 6.2 接口说明

| 接口 | 方法 | 用途 | 备注 |
|------|------|------|------|
| `/analyze` | POST | 发起诊断 | 核心接口，返回完整诊断结果 |
| `/progress/:taskId` | GET | 获取进度 | 流式输出时使用 |
| `/history` | GET | 历史记录 | 支持按操作筛选 |
| `/feedback` | POST | 用户反馈 | 用于持续优化模型 |

---

## 七、UI 交互设计

### 7.1 触发入口

在执行结果弹窗中，当状态为"失败"时，显示"AI 诊断"按钮：

```
┌─────────────────────────────────────────────────────────────────┐
│ 执行结果弹窗                                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️ 执行失败                                              │   │
│  │                                                         │   │
│  │ 操作：日志清理                                            │   │
│  │ 时间：2026-07-21 15:30:00                                │   │
│  │ 资源：4个（成功2 / 失败2）                                 │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ server-03  ✗  权限不足：无法删除 /var/log/app.log    │ │   │
│  │ │ server-04  ✗  磁盘空间不足                           │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │ │ 🤖 AI 诊断    │  │ 🔄 重试失败   │  │ 📋 查看详情   │   │   │
│  │ └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 诊断面板

点击"AI 诊断"后，右侧滑出诊断面板：

```
┌─────────────────────────────────────────┐
│ 🤖 AI 诊断                    [×] 关闭   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ 分析中... ────────────────────────┐ │
│  │ ████████████░░░░░░░░  65%          │ │
│  │ 正在分析错误日志...                 │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ─── 或分析完成后 ───                    │
│                                         │
│  ┌─ 根因分析 ────────────────────────┐ │
│  │ 📋 权限问题            置信度 85%  │ │
│  │                                   │ │
│  │ 目标服务器 /var/log 目录权限配置    │ │
│  │ 异常，当前用户无删除权限。          │ │
│  │ 该问题在 server-03 上首次出现，     │ │
│  │ 可能与上周的系统安全加固有关。       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─ 修复建议 ────────────────────────┐ │
│  │ 🔴 高优先级                       │ │
│  │ 检查并修复 /var/log 目录权限       │ │
│  │ ┌─────────────────────────────┐   │ │
│  │ │ $ chmod 755 /var/log/app    │   │ │
│  │ │                    [复制]   │   │ │
│  │ └─────────────────────────────┘   │ │
│  │ 风险: 低  预估耗时: < 1分钟       │ │
│  │                                   │ │
│  │ 🟡 中优先级                       │ │
│  │ 清理磁盘空间                      │ │
│  │ 推荐操作: [磁盘清理]  →  跳转执行  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─ 相似案例 ────────────────────────┐ │
│  │ 📎 server-02 日志清理失败          │ │
│  │    (2026-07-15, 相似度 92%)        │ │
│  │    解决方案: 修复目录权限后重试成功  │ │
│  │    [查看详情]                      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─ 推荐操作 ────────────────────────┐ │
│  │ 🔧 磁盘空间清理                    │ │
│  │    原因: server-04 磁盘空间不足     │ │
│  │    [去执行 →]                      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ─────────────────────────────────────  │
│  [👍 有帮助] [👎 没帮助]  [📋 复制结果]  │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 交互细节

| 交互 | 行为 | 备注 |
|------|------|------|
| 点击"AI 诊断" | 打开诊断面板，开始分析 | 面板从右侧滑出，宽度 480px |
| 分析中 | 显示进度条和状态文案 | 支持流式输出，逐步展示结果 |
| 点击修复建议的命令 | 复制到剪贴板 | 显示"已复制"提示 |
| 点击"推荐操作" | 跳转到操作组件执行页 | 自动填充推荐参数 |
| 点击"相似案例" | 展开案例详情 | 显示完整的错误日志和解决方案 |
| 点击"有帮助/没帮助" | 提交反馈 | 用于持续优化模型 |

---

## 八、实现路径

### 8.1 阶段规划

| 阶段 | 内容 | 工作量 | 优先级 |
|------|------|--------|--------|
| **Phase 1** | 诊断面板 UI + 本地 Ollama 调用 + 基础 Prompt | 2天 | P0 |
| **Phase 2** | 相似案例检索（基于 errorMsg 文本相似度） | 1天 | P0 |
| **Phase 3** | 流式输出 + 诊断进度展示 | 1天 | P1 |
| **Phase 4** | 反馈机制 + 诊断历史 | 1天 | P1 |
| **Phase 5** | 向量数据库优化相似案例检索 | 2天 | P2 |

### 8.2 MVP 最小可运行版本

**核心功能**：
1. 失败执行记录 → 收集上下文
2. 构建 Prompt → 调用 Ollama
3. 解析 JSON 结果 → 渲染面板

**技术选型**：
- 前端：Vue 3 + Element Plus
- LLM：Ollama (llama3.1:8b)
- 相似度：基于 errorMsg 的文本匹配（Levenshtein 距离或 TF-IDF）

**预计工作量**：3天

### 8.3 技术依赖

```json
{
  "dependencies": {
    "ollama": "^0.5.0",           // Ollama SDK
    "natural": "^6.0.0",          // 文本相似度计算
    "vue3-slide-panels": "^1.0.0" // 侧边面板组件（可选）
  }
}
```

---

## 九、风险与挑战

### 9.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| LLM 输出不稳定 | 诊断结果格式错误 | 增加 JSON 校验和重试机制 |
| 相似案例检索不准 | 推荐方案不相关 | 优化相似度算法，引入向量数据库 |
| 本地模型能力有限 | 复杂问题诊断不准 | 支持切换到更强的远程模型 |
| 响应速度慢 | 用户体验差 | 实现流式输出，展示进度 |

### 9.2 产品风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 用户不信任 AI 诊断 | 功能使用率低 | 显示置信度，提供相似案例佐证 |
| 诊断结果不准确 | 误导用户 | 提供反馈机制，持续优化 |
| 过度依赖 AI | 用户丧失判断力 | 强调 AI 是辅助，最终决策在用户 |

---

## 十、后续优化方向

### 10.1 短期优化（1-2个月）

- **多轮对话**：支持用户追问，深入分析特定问题
- **知识库集成**：接入运维知识库，提升诊断准确性
- **批量诊断**：支持同时诊断多个失败记录

### 10.2 中期优化（3-6个月）

- **向量数据库**：使用 Qdrant/Milvus 优化相似案例检索
- **微调模型**：基于历史诊断数据微调专用模型
- **自动化修复**：诊断后自动执行修复建议（需人工确认）

### 10.3 长期优化（6个月+）

- **预测性诊断**：在执行前预测可能的问题
- **知识图谱**：构建运维知识图谱，提升推理能力
- **多模态诊断**：支持日志、指标、链路追踪的综合分析

---

## 十一、附录

### 11.1 相关文档

- [操作工作台 PRD](./operation-workbench-prd.md)
- [执行历史功能设计](./execution-history-design.md)
- [Ollama 集成指南](./ollama-integration.md)

### 11.2 参考资料

- [Ollama 官方文档](https://ollama.ai/docs)
- [Prompt Engineering 最佳实践](https://www.promptingguide.ai/)
- [运维知识库建设指南](./ops-knowledge-base.md)

---

**文档变更记录**

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-07-21 | 初始版本 | 贺诗辉 |
