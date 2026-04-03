# 同步机制使用指南

## 快速开始

### 1. 检查当前状态
```bash
./scripts/sync.sh check
```

### 2. 从 source 提取文件到 work（frontend 操作）
```bash
# 提取单个文件
./scripts/sync.sh extract src/components/MyComponent.vue

# 提取后，文件会出现在 work/ 目录，并自动记录映射关系
```

### 3. 编辑 work 目录中的文件（frontend 操作）
在 `work/` 目录中编辑你的文件。

### 4. 提交到 review（frontend 操作）
```bash
# 将 work 中的文件提交到 review 目录等待审查
./scripts/sync.sh submit MyComponent.vue
```

### 5. 代码审查（reviewer 操作）⭐
- **reviewer 接收**：审核请求（来自 frontend 会话）
- **reviewer 检查**：`project_root/review/<task_id>/` 中的文件
- **reviewer 输出**：审核报告（`[Pass]` 或 `[Reject]` + 问题清单）
- **reviewer 更新**：`SYNC_MAP.json` 中的任务状态

### 6. 修复代码（frontend 操作，仅当审核驳回时）
在 `review/` 目录中根据 reviewer 的意见修复代码，然后重新提交审核。

### 7. Git Push（git 负责）
- **frontend 发送**：`ACTION_REQUIRED: GIT_PUSH` 消息（审核通过后）
- **git 确认**：验证 reviewer 已标记为 `approved`
- **git 执行**：将 review 合并到 source，并推送远程仓库

## 目录说明

| 目录 | 用途 | 负责人 | 是否版本控制 |
|------|------|--------|-------------|
| `source/` | 完整源代码仓库 | git | ✅ 是 |
| `work/` | 当前工作文件：开发、自检 | frontend | ✅ 是（工作副本） |
| `review/` | 待审查文件：审查、修复、合并 | frontend → **reviewer** → git | ✅ 是（临时） |

## 角色分工

| 角色 | 负责人 | 核心职责 |
|------|--------|----------|
| **frontend** | frontend agent | 代码开发、自检、提交审核、修复问题 |
| **reviewer** ⭐ | reviewer agent | 代码审查、安全扫描、输出审核报告、更新状态 |
| **git** | git agent | 合并审核通过的代码、推送到远程仓库 |

## 映射文件

`SYNC_MAP.json` 记录 work 文件和 source 路径的映射关系：

```json
{
  "mappings": [
    {
      "work_file": "MyComponent.vue",
      "source_path": "src/components/MyComponent.vue",
      "created": "2026-03-29T20:30:00+08:00",
      "description": "组件描述"
    }
  ]
}
```

## 常见问题

### Q: work 目录应该是完整的吗？
A: 不，work 目录只包含当前正在编辑的文件个体，不是完整的项目结构。

### Q: 如何添加新的映射关系？
A: 使用 `./scripts/sync.sh extract <source-path>` 会自动添加映射。

### Q: review 目录什么时候使用？
A: 当需要代码审查时，将文件从 work 提交到 review，**reviewer 审查通过后**再由 git 合并回 source。

### Q: reviewer 负责什么？
A: **reviewer** 是代码质量守门员，负责：
- 审查 `review/` 目录中的代码
- 检查功能需求、安全漏洞、代码规范、性能问题
- 输出审核报告（`[Pass]` 或 `[Reject]`）
- 更新 `SYNC_MAP.json` 中的任务状态

### Q: 如果映射关系错误怎么办？
A: 手动编辑 `SYNC_MAP.json` 文件修正映射关系。

### Q: 审核通过后谁来合并回 source？
A: **git 负责**。frontend 只需发送 `ACTION_REQUIRED: GIT_PUSH` 消息。

### Q: 审核被驳回了怎么办？
A: frontend 根据 reviewer 的问题清单在 `review/` 目录中修复代码，然后重新提交审核。

## 当前状态

- ✅ 机制已建立
- ✅ 角色分工明确：frontend / reviewer / git
- ✅ work 目录：2 个文件（已映射）
- ✅ review 目录：已创建（空）
- ✅ 映射文件：已初始化
- ✅ 审核流程：已定义（Step1-6）
