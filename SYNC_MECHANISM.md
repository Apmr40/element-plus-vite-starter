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

| 目录 | 用途 | 来源 | 去向 |
|------|------|------|------|
| `project_root/source/` | 源代码仓库（Single Source of Truth） | git 主分支 | 被 work 引用 |
| `project_root/work/` | 开发工作区 | 从 source 提取 | 自检通过后提交到 review |
| `project_root/review/` | 待审核区 | 从 work 提交 | 审查通过后合并回 source |

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

### 1. 从 source 提取文件到 work
```bash
./scripts/sync.sh extract <file-path>
# 示例：./scripts/sync.sh extract src/components/api-cascade-generator.vue
# 创建：project_root/work/feat/YYYYMMDD_<task_id>/src/components/api-cascade-generator.vue
```

### 2. 从 work 提交文件到 review
```bash
./scripts/sync.sh submit <task_id>
# 将 project_root/work/feat/YYYYMMDD_<task_id>/ 下的最终代码文件移动至 project_root/review/<task_id>/
# 注意：只移动变更后的源代码文件，保持目录结构清晰
```

### 3. 从 review 合并回 source
```bash
./scripts/sync.sh merge <task_id>
# 审查通过后，将 project_root/review/<task_id>/ 合并回 project_root/source/
# 然后删除 project_root/review/<task_id>/
```

### 4. 完整性检查
```bash
./scripts/sync.sh check
# 检查 work 和 review 目录的完整性，验证映射关系
```

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
   - 审查通过后删除该子目录

3. **源代码仓库 (`project_root/source/`)**：
   - 完整的源代码，是最终的真相源（single source of truth）
   - 只有通过 review 审查的代码才能合并至此

4. **映射文件**：使用 `SYNC_MAP.json` 记录文件映射关系

5. **🔒 推送规则**：
   - 只有 review 目录中审查通过的文件才能合并到 source 并推送
   - 禁止直接从 work 同步到 source，必须经过 review 审查

6. **🚫 绝对禁止**：
   - 直接在 `review` 目录或 git 主分支进行修改
   - 禁止修改 `/home/admin` 下非项目相关文件

## 工作流程（参考 AGENTS.md）

### Step1：需求接收与分析
1. 监听来自 `product` 的 `session_send` 消息
2. 解析需求文档和核心功能点
3. 在 `project_root/work/feat/YYYYMMDD_<task_id>/` 创建任务子目录

### Step2：开发与自检
1. 编写代码，遵循项目现有的 Lint 规范和架构模式
2. 运行自动化测试（`npm test` 等）
3. 运行静态检查（安全扫描、代码风格检查）

### Step3：移交与通知
1. 将 `project_root/work/<task_dir>/` 下的最终代码文件移动至 `project_root/review/<task_id>/`
2. 执行 `git diff` 生成变更摘要
3. 发送审核请求到 reviewer 会话
4. 清理 `project_root/work/` 下的临时构建文件
