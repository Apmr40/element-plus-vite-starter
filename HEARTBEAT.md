# HEARTBEAT.md - 前端代码 agent

## ⏰ 简报生成任务

### 定时任务
- **早间简报**：北京时间 06:00 → 生成早间简报（覆盖昨日 18:00～今日 06:00）
- **晚间简报**：北京时间 18:00 → 生成晚间简报（覆盖今日 06:00～18:00）

### 📝 简报内容模板
```markdown
## 【前端代码简报】YYYY-MM-DD HH:mm
...
```

### 📤 发送目标
- **接收人**：pm (产品经理) + 飞书群组 `oc_47bb1fdb7010ae87894d3d01576775a2`
- **发送方式**：集中式发送（frontend 只负责生成并发送到 pm + 群组，不重复发送）

### 🔧 生成逻辑（改进版）
1. **幂等性检查**：
   - 检查 `memory/briefing-state.json` 中的 `submittedToday` 标志
   - 如果 `submittedToday === true`，直接跳过（已发送过）
2. **时间窗口检查**：
   - 早间简报：06:00-06:30 窗口内发送（避免重复触发）
   - 晚间简报：18:00-18:30 窗口内发送
3. **集中式发送**：
   - 只通过 `sessions_send` 发送到 pm 会话（`agent:pm:main`）
   - **同时**通过 `message` 工具发送到飞书群组 `oc_47bb1fdb7010ae87894d3d01576775a2`
   - **禁止**发送到多个会话目标（避免重复）
4. **发送后更新状态**：
   - 更新 `memory/briefing-state.json`，设置 `submittedToday: true`
   - 记录 `lastBriefingMorning` 或 `lastBriefingEvening` 时间戳

---

## 📌 注意事项

### 防止重复发送
- 使用 `memory/briefing-state.json` 记录简报发送状态
- 每次 heartbeat 只发送一次简报
- 同一轮 heartbeat 不重复发送同一时段的简报

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
  "lastBriefingMorning": 1743332100000,  // 上次早间简报发送时间（Unix 毫秒）
  "lastBriefingEvening": 1743347400000,  // 上次晚间简报发送时间（Unix 毫秒）
  "submittedToday": true,                 // 当日是否已提交简报（核心幂等性标志）
  "reminderCount": 0,                     // 提醒次数
  "userNotified": false,                  // 是否已通知用户
  "blockingIssue": null                   // 阻塞问题
}
```

### 🛡️ 幂等性保护（关键改进）
- **检查点 1**：发送前检查 `submittedToday === true`？→ 是则跳过
- **检查点 2**：发送成功后立即更新 `submittedToday: true`
- **禁止**：在同一次 heartbeat 中发送多次简报
- **集中式**：只通过 `agent:pm:main` 会话发送，禁止发送到多个会话目标
