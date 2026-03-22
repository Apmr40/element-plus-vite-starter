# STATUS.md - 状态跟踪机制

## 目录状态

| 目录   | 状态     | 说明                     |
|--------|----------|--------------------------|
| source | 空闲     | Git 维护，只读           |
| work   | 进行中   | frontend 开发/待审核     |
| review | 空闲     | 审核通过，待 git 提交    |

---

## 文件状态追踪

### 状态文件命名规范

- `.status` 文件：记录当前状态
- `.review` 文件：记录审核意见

### 状态流转

```
[frontend 开发]
work/your-file.vue
work/your-file.vue.status → PENDING_REVIEW

         ↓ 提交审核

[reviewer 审核]
         ├─ [Pass] → review/your-file.vue
         │           review/your-file.vue.status → PASSED
         │           review/your-file.vue.review → 检查项 + 备注
         │
         └─ [Reject] → work/your-file.vue
                       work/your-file.vue.status → REJECTED
                       work/your-file.vue.review → 驳回原因 + 修改建议

         ↓ [Pass] 后

[git 提交]
review/ → source/ → commit & push
review/ 清空
```

### 状态值定义

| 状态值         | 说明           | 创建者   | 下一步       |
|----------------|----------------|----------|--------------|
| PENDING_REVIEW | 待审核         | frontend | reviewer 审核 |
| PASSED         | 审核通过       | reviewer | git 提交     |
| REJECTED       | 审核驳回       | reviewer | frontend 修改 |
| SUBMITTED      | 已提交到 GitHub| git      | -            |

---

## 文件状态追踪表

| 文件 | 当前位置 | 状态 | 审核人 | 时间 | 备注 |
|------|----------|------|--------|------|------|
| -    | -        | -    | -      | -    | -    |

---

## 操作日志

| 时间 | 操作者 | 动作 | 文件 | 状态变更 | 备注 |
|------|--------|------|------|----------|------|
| -    | -      | -    | -    | -        | -    |

---

## 示例

### frontend 提交审核

```bash
# 1. 修改文件
work/src/views/Home.vue

# 2. 标记状态
echo "PENDING_REVIEW" > work/src/views/Home.vue.status

# 3. 通知 reviewer
```

### reviewer 审核通过

```bash
# 1. 移动文件到 review/
mv work/src/views/Home.vue review/src/views/Home.vue
mv work/src/views/Home.vue.status review/src/views/Home.vue.status

# 2. 更新状态
echo "PASSED" > review/src/views/Home.vue.status

# 3. 写审核记录
cat > review/src/views/Home.vue.review << 'EOF'
## 审核检查项
- [x] 代码规范
- [x] 功能测试
- [x] 类型检查

## 备注
代码质量良好，无修改建议
EOF

# 4. 通知 git
```

### reviewer 审核驳回

```bash
# 1. 更新状态（文件保留在 work/）
echo "REJECTED" > work/src/views/Home.vue.status

# 2. 写驳回原因
cat > work/src/views/Home.vue.review << 'EOF'
## 驳回原因
1. 缺少类型定义
2. 未处理边界情况

## 修改建议
1. 为 props 添加类型注解
2. 添加空状态处理
EOF

# 3. 通知 frontend
```

### git 提交

```bash
# 1. 检查 review/ 中 PASSED 的文件
find review/ -name "*.status" -exec grep -l "PASSED" {} \;

# 2. 同步到 source/
cp review/src/views/Home.vue source/src/views/Home.vue

# 3. git 操作
cd source
git pull --rebase
git add src/views/Home.vue
git commit -m "feat(view): update Home.vue"
git push

# 4. 更新状态
echo "SUBMITTED" > review/src/views/Home.vue.status

# 5. 清空 review/
rm -rf review/*

# 6. 记录日志
```

---

## 自动化检查清单

### git agent 提交前检查

- [ ] review/ 中存在 `.status` 文件且内容为 `PASSED`
- [ ] 已执行 `git pull --rebase`
- [ ] commit message 符合 Conventional Commits
- [ ] push 成功后清空 review/

### reviewer 审核检查

- [ ] 代码规范检查
- [ ] 功能逻辑验证
- [ ] 类型安全检查
- [ ] 边界情况处理
- [ ] 测试覆盖（如适用）

---

## 异常处理

### 状态文件丢失
- 默认视为 `PENDING_REVIEW`
- 需要人工确认状态

### 并发冲突
- 同一文件同时被修改 → 以后提交的状态为准
- 发现冲突时通知相关方协调

### 审核超时
- `PENDING_REVIEW` 超过 24 小时 → 自动提醒 reviewer
