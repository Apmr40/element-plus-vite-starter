# 同步机制使用指南

## 快速开始

### 1. 检查当前状态
```bash
./scripts/sync.sh check
```

### 2. 从 source 提取文件到 work
```bash
# 提取单个文件
./scripts/sync.sh extract src/components/MyComponent.vue

# 提取后，文件会出现在 work/ 目录，并自动记录映射关系
```

### 3. 编辑 work 目录中的文件
在 `work/` 目录中编辑你的文件。

### 4. 提交到 review（可选）
```bash
# 将 work 中的文件提交到 review 目录等待审查
./scripts/sync.sh submit MyComponent.vue
```

### 5. 合并回 source
```bash
# 审查通过后，将文件合并回 source
./scripts/sync.sh merge MyComponent.vue
```

### 6. 批量同步
```bash
# 同步所有 work 文件到 source
./scripts/sync.sh sync-all
```

## 目录说明

| 目录 | 用途 | 是否版本控制 |
|------|------|-------------|
| `source/` | 完整源代码仓库 | ✅ 是 |
| `work/` | 当前工作文件 | ✅ 是（工作副本） |
| `review/` | 待审查文件 | ✅ 是（临时） |
| `scripts/` | 同步脚本 | ✅ 是 |

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
A: 当需要代码审查时，将文件从 work 提交到 review，审查通过后再合并回 source。

### Q: 如果映射关系错误怎么办？
A: 手动编辑 `SYNC_MAP.json` 文件修正映射关系。

## 当前状态

- ✅ 机制已建立
- ✅ work 目录：2 个文件（已映射）
- ✅ review 目录：已创建（空）
- ✅ 映射文件：已初始化
