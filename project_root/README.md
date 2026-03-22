# Project Root Workflow

## Directory Structure

```
project_root/
├── source/    # Git 维护的主代码库（只读，仅 git agent 可写）
├── work/      # 开发工作区（frontend 修改，reviewer 审核）
└── review/    # 审核通过区（reviewer [Pass] 后移入）
```

## 工作流程

### 1. frontend 开发
- 从 `source/` 复制需要修改的文件到 `work/`
- 在 `work/` 中完成代码修改
- 通知 reviewer 审核

### 2. reviewer 审核
- 检查 `work/` 中的变更
- **[Pass]** → 将文件从 `work/` 移动到 `review/`
- **[Reject]** → 将文件退回 `work/` 并标注问题

### 3. git 提交
- 检查 `review/` 中是否有待提交的文件
- 执行 `git pull --rebase`
- 将 `review/` 文件同步到 `source/`
- 执行 commit & push（遵循 Conventional Commits）
- 清空 `review/`

## 权限说明

| 目录   | frontend | reviewer | git    |
|--------|----------|----------|--------|
| source | 只读     | 只读     | 读写   |
| work   | 读写     | 读写     | 只读   |
| review | 只读     | 读写     | 读写   |

## 注意事项

- 避免多个 agent 同时修改同一文件
- reviewer 必须在 `review/` 中的文件上标注 `[Pass]` 后，git 才会提交
- 敏感信息不要提交到 source/
