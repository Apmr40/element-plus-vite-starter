# 目录同步机制

## 目录结构说明

```
ws-git/
└── project_root/
    ├── source/                        # 源代码仓库（完整项目，Single Source of Truth）
    │   └── element-plus-vite-starter/
    │       ├── src/
    │       │   ├── components/        # 组件源文件
    │       │   ├── pages/             # 页面源文件
    │       │   └── ...
    │       └── ...
    ├── work/                          # 开发工作区（所有临时开发、编译、测试在此进行）
    │   └── feat/YYYYMMDD_<task_id>/   # 任务子目录（命名格式：feat/YYYYMMDD_<task_id>）
    │       └── *.vue                  # 正在编辑的工作副本
    └── review/                        # 待审核区（仅当代码自检通过后，方可移入此目录）
        └── <task_id>/                 # 任务 ID 子目录
            └── *.vue                  # 待审查的最终代码文件

scripts/
└── sync.sh                            # 同步脚本（位于 ws-git 根目录）
```

## 目录用途

| 目录 | 用途 | 负责人 |
|------|------|--------|
| `project_root/source/` | 源代码仓库（Single Source of Truth） | git |
| `project_root/work/` | 开发工作区：代码开发、自检、测试 | **frontend** |
| `project_root/review/` | 待审核区：代码审查、问题反馈、状态更新 | **reviewer** → **frontend** → **git** |

## 文件映射关系

work 和 review 目录中的文件应该与 source 目录建立映射关系：

```
project_root/work/feat/20260330_001/api-cascade-generator.vue
    ↓ maps to
project_root/source/element-plus-vite-starter/src/components/api-cascade-generator.vue

project_root/review/001/api-cascade-generator.vue
    ↓ maps to
project_root/source/element-plus-vite-starter/src/components/api-cascade-generator.vue
```

## 同步流程

### 1. 从 source 提取文件到 work（frontend 负责）
```bash
./scripts/sync.sh extract <file-path>
# 示例：./scripts/sync.sh extract src/components/api-cascade-generator.vue
# 创建：project_root/work/feat/YYYYMMDD_<task_id>/src/components/api-cascade-generator.vue
```

### 2. 从 work 提交文件到 review（frontend 负责）
```bash
./scripts/sync.sh submit <task_id>
# 将 project_root/work/feat/YYYYMMDD_<task_id>/ 下的最终代码文件移动至 project_root/review/<task_id>/
# 注意：只移动变更后的源代码文件，保持目录结构清晰
```

### 3. 从 review 合并回 source（git 负责）
```bash
./scripts/sync.sh merge <task_id>
# 审查通过后，将 project_root/review/<task_id>/ 合并回 project_root/source/
# 然后删除 project_root/review/<task_id>/
```

### 4. 完整性检查（git 负责）
```bash
./scripts/sync.sh check
# 检查 work 和 review 目录的完整性，验证映射关系
```

## 角色分工（关键）

### frontend
1. 在 `work/feat/YYYYMMDD_<task_id>/` 开发代码
2. 运行自检（测试、静态检查）
3. 自检通过后，将文件移动到 `review/<task_id>/`
4. **发送审核请求到 reviewer 会话**
5. **根据 reviewer 的反馈修复代码**（在 review/ 目录中）
6. 修复完成后，发送 `ACTION_REQUIRED: GIT_PUSH` 消息给 git

### reviewer
**负责人**: `reviewer` agent
**职责**: 代码质量守门员
1. **监听审核请求**：接收来自 frontend 的审核请求消息
2. **代码审查**：检查 `project_root/review/<task_id>/` 中的文件
   - ✅ 功能需求：是否符合产品需求
   - 🔒 安全漏洞：SQL 注入、XSS、敏感数据泄露等
   - 📐 代码规范：类型安全、错误处理、边界条件
   - 🚀 性能问题：冗余计算、资源泄漏等
3. **输出审核报告**：
   - `[Pass]`：审核通过，通知 frontend 可推送
   - `[Reject]`：审核驳回，列出必须修复的问题清单
4. **更新文件状态**：在 `SYNC_MAP.json` 中更新任务状态
   - `pending_review` → 待审核
   - `under_review` → 审核中
   - `approved` → 审核通过
   - `rejected` → 审核驳回需修复
5. **通知机制**：
   - 审核开始前：发送"开始审核"通知到飞书群
   - 审核完成后：发送审核报告给 frontend（私密）和飞书群（公开）

### git
1. 监听 frontend 的 `ACTION_REQUIRED: GIT_PUSH` 消息
2. **确认审核状态**：确保 reviewer 已标记为 `approved`
3. 将 `review/<task_id>/` 合并到 `source/`
4. 删除 `review/<task_id>/`
5. 执行 `git commit` 和 `git push`
6. 更新 `SYNC_MAP.json` 中的任务状态为 `merged`

## 当前状态

- ✅ `project_root/source/`：完整（element-plus-vite-starter 项目）
- ✅ `project_root/work/`：存在（用于开发工作区）
- ✅ `project_root/review/`：存在（用于待审核区）
- ⚠️ `ws-git/work/` 和 `ws-git/review/`（旧结构）：已弃用，应迁移至 `project_root/` 下

## 维护规则

1. **开发工作区 (`project_root/work/`)**：
   - 只包含当前正在编辑的文件
   - 按任务创建子目录：`feat/YYYYMMDD_<task_id>/`
   - 任务完成后清理临时构建文件

2. **待审核区 (`project_root/review/`)**：
   - 仅当代码自检通过后，方可移入此目录
   - 按任务 ID 创建子目录：`<task_id>/`
   - **frontend 负责：修复 reviewer 提出的问题**
   - **git 负责：合并回 source 并清理 review 目录**

3. **源代码仓库 (`project_root/source/`)**：
   - 完整的源代码，是最终的真相源（single source of truth）
   - **只有通过 review 的代码才能合并至此（由 git 执行）**

4. **映射文件**：使用 `SYNC_MAP.json` 记录文件映射关系

5. **🔒 推送规则**：
   - 只有 review 目录中审查通过的文件才能合并到 source 并推送
   - **禁止 frontend 直接从 work 同步到 source**
   - **必须经过 review 审查，由 git 执行合并**

6. **🚫 绝对禁止**：
   - frontend 直接在 `review` 目录或 git 主分支进行修改
   - frontend 直接操作 git push
   - 禁止修改 `/home/admin` 下非项目相关文件

## 工作流程

### Step1：需求接收与分析（frontend 负责）
1. 监听来自 `product` 的 `session_send` 消息
2. 解析需求文档和核心功能点
3. 在 `project_root/work/feat/YYYYMMDD_<task_id>/` 创建任务子目录

### Step2：开发与自检（frontend 负责）
1. 编写代码，遵循项目现有的 Lint 规范和架构模式
2. 运行自动化测试（`npm test` 等）
3. 运行静态检查（安全扫描、代码风格检查）

### Step3：提交审核（frontend 负责）
1. 将 `project_root/work/<task_dir>/` 下的最终代码文件移动至 `project_root/review/<task_id>/`
2. 执行 `git diff` 生成变更摘要
3. **发送审核请求到 reviewer 会话**
4. 发送通知到飞书群 `oc_47bb1fdb7010ae87894d3d01576775a2`

### Step4：代码审查（reviewer 负责）⭐
1. **接收审核请求**：监听来自 frontend 的审核请求
2. **发送审核开始通知**：在飞书群中发送"开始审核"消息
3. **执行代码审查**：
   - 功能需求验证
   - 安全漏洞扫描（SQL 注入、XSS、敏感数据等）
   - 代码规范检查（类型安全、错误处理、边界条件）
   - 性能问题分析
4. **输出审核报告**：
   - `[Pass]`：审核通过，更新状态为 `approved`，通知 frontend
   - `[Reject]`：审核驳回，更新状态为 `rejected`，列出问题清单
5. **通知 frontend**：发送审核报告（私密到 frontend 会话 + 公开到飞书群）
6. **等待修复**：如被驳回，等待 frontend 修复后重新提交

### Step5：修复代码（frontend 负责，仅当审核驳回时）
1. 根据 reviewer 的反馈在 `review/` 目录中修复代码
2. 重新提交审核（回到 Step4）

### Step6：Git Push（git 负责）
1. 监听 frontend 的 `ACTION_REQUIRED: GIT_PUSH` 消息
2. **确认审核状态**：验证 reviewer 已标记为 `approved`
3. 将 `review/<task_id>/` 合并到 `source/`
4. 删除 `review/<task_id>/`
5. 执行 `git commit` 和 `git push`
6. 更新 `SYNC_MAP.json` 中的任务状态为 `merged`
7. 发送通知到 pm 和飞书群
