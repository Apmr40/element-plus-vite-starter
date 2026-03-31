# HEARTBEAT.md - 前端代码 agent

## ⏰ 简报生成任务

### 定时任务
- **早间简报**：北京时间 06:30 → 生成早间简报（覆盖昨日 18:00～今日 06:00）
- **晚间简报**：北京时间 18:00 → 生成晚间简报（覆盖今日 06:00～18:00）

### 📝 简报内容模板
```markdown
## 【前端代码简报】YYYY-MM-DD HH:mm
...
```

### 📤 发送目标
- **接收人**：pm (产品经理) + 飞书群组 `oc_47bb1fdb7010ae87894d3d01576775a2`
- **发送方式**：集中式发送（frontend 只负责生成并发送到 pm 会话 + 群组，不重复发送）

### 🔧 生成逻辑（幂等性保护）
1. **幂等性检查**（关键）：
   - 检查 `memory/briefing-state.json` 中的 `submittedToday` 标志
   - 如果 `submittedToday === true`，直接返回并输出 `HEARTBEAT_OK`
2. **集中式发送**：
   - 通过 `sessions_send` 发送到 pm 会话（`agent:pm:main`）
   - **仅此一次**，不再发送到其他会话
3. **发送后更新状态**：
   - 更新 `memory/briefing-state.json`，设置 `submittedToday: true`
   - 记录 `lastBriefingMorning` 或 `lastBriefingEvening` 时间戳

---

## 📌 注意事项

### 防止重复发送（幂等性保护）
- **发送前**：检查 `submittedToday === true`？→ 是则跳过并输出 `HEARTBEAT_OK`
- **发送后**：立即更新 `submittedToday: true`，防止重复
- **集中式**：只通过 `agent:pm:main` 会话发送，禁止发送到多个会话目标
- **禁止**：在同一次 heartbeat 中发送多次简报

### 代码提交
- 每次开发完成后**立即**提交给 reviewer
- 提交内容必须完整（变更摘要 + diff + 需求文件）
- 等待 reviewer 确认后再进行下一步工作

### 📅 早间简报时间范围
- **时段**：昨日 18:00～今日 06:00
- **统计Period**：检查 Git 提交记录（过去 12 小时）

### 📊 briefing-state.json 字段说明
```json
{
  "lastBriefingMorning": 1775068800000,  // 上次早间简报发送时间（Unix 毫秒）
  "lastBriefingEvening": 1775107800000,  // 上次晚间简报发送时间（Unix 毫秒）
  "submittedToday": true,                // 当日是否已提交简报（核心幂等性标志）
  "reminderCount": 0,                    // 提醒次数
  "userNotified": false,                 // 是否已通知用户
  "blockingIssue": null                  // 阻塞问题
}
```

### 🛡️ 幂等性保护（关键）
- **发送前检查**：如果 `submittedToday === true`，直接return `HEARTBEAT_OK`
- **发送后更新**：立即更新 `submittedToday: true`
- **禁止重复**：同一次 heartbeat 中禁止发送多次简报

## 📌 代码审核问题（2026-03-31）

### 🔴 P0 - crypto 兼容性问题（已修复）

**问题**: `crypto.randomUUID()` 和 `crypto.getRandomValues()` 未检查 `typeof crypto`

**影响**: IE/旧浏览器会直接抛出 `crypto is not defined` 错误

**修复状态**: 
- ✅ `generateSafeId()` 已添加 `if (typeof crypto !== 'undefined' && crypto.randomUUID)` 检查
- ✅ `ElMessageBox` 已移除未使用导入
- ✅ `generateId()` 已删除未使用函数
- ⏳ 等待 reviewer 复审确认

### 🟡 中等问题（已修复）
- ✅ 未使用的导入：`ElTable`, `CascadePreviewModal` 已检查
- ⏳ 重复 emit 'close' 风险 - 需确认
- ⏳ 冗余计算属性 `levelConfigLength` - CascadePreviewModal 中存在
