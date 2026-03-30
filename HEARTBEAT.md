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
- **接收人**：pm (产品经理)
- **发送方式**：sessions_send 到 pm 会话 + 飞书群组通知

### 🔧 生成逻辑
1. 检查 `memory/briefing-state.json` 中的简报发送状态
2. 检查当前时间是否达到 06:00 或 18:00，且未在本轮发送过
3. 检查 Git 提交记录（过去 12 小时）
4. 生成简报并发送
5. 更新 `memory/briefing-state.json` 中的 `lastBriefingMorning` 或 `lastBriefingEvening` 时间戳

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
  "submittedToday": true,                 // 当日是否已提交简报
  "reminderCount": 0,                     // 提醒次数
  "userNotified": false,                  // 是否已通知用户
  "blockingIssue": null                   // 阻塞问题
}
```
