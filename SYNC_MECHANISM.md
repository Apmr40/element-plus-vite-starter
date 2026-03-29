# 目录同步机制

## 目录结构说明

```
ws-git/
├── project_root/
│   └── source/                    # 源代码仓库（完整项目）
│       └── element-plus-vite-starter/
│           ├── src/
│           │   ├── components/    # 组件源文件
│           │   ├── pages/         # 页面源文件
│           │   └── ...
│           └── ...
├── work/                          # 工作目录（当前正在编辑的文件）
│   └── *.vue                      # 从 source 提取的工作副本
├── review/                        # 审查目录（待审查的文件）
│   └── *.vue                      # 从 work 提交的待审查文件
└── scripts/
    └── sync.sh                    # 同步脚本
```

## 目录用途

| 目录 | 用途 | 来源 | 去向 |
|------|------|------|------|
| `source/` | 源代码仓库 | git 仓库 | 被 work 引用 |
| `work/` | 工作区 | 从 source 提取 | 编辑后同步回 source 或提交到 review |
| `review/` | 审查区 | 从 work 提交 | 审查通过后合并回 source |

## 文件映射关系

work 和 review 目录中的文件应该与 source 目录建立映射关系：

```
work/api-cascade-generator.vue
    ↓ maps to
source/element-plus-vite-starter/src/components/api-cascade-generator.vue

work/CascadePreviewModal.vue
    ↓ maps to
source/element-plus-vite-starter/src/components/CascadePreviewModal.vue
```

## 同步流程

### 1. 从 source 提取文件到 work
```bash
./scripts/sync.sh extract <file-path>
```

### 2. 从 work 提交文件到 review
```bash
./scripts/sync.sh submit <file-name>
```

### 3. 从 review 合并回 source
```bash
./scripts/sync.sh merge <file-name>
```

### 4. 完整性检查
```bash
./scripts/sync.sh check
```

## 当前状态

- ✅ source 目录：完整
- ⚠️ work 目录：部分文件（需要检查完整性）
- ❌ review 目录：不存在（需要创建）

## 维护规则

1. **work 目录**：只包含当前正在编辑的文件个体，不是完整的项目结构
2. **review 目录**：包含等待审查的文件，审查通过后删除
3. **source 目录**：完整的源代码，是最终的真相源（single source of truth）
4. **映射文件**：使用 `SYNC_MAP.json` 记录文件映射关系
