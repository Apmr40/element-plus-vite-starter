# HEARTBEAT.md - Git Agent 简报任务

## ⏰ 定时简报任务

### 定时任务
- **早间简报**：当前时间达到 06:00-06:30 → 生成并发送早间简报（覆盖昨日 18:00～今日 06:00）
- **晚间简报**：当前时间达到 18:00-18:30 → 生成并发送晚间简报（覆盖今日 06:00～18:00）

### 📤 发送目标
**同时发送到以下两个目标：**
1. **飞书群**：`oc_47bb1fdb7010ae87894d3d01576775a2`
2. **PM 会话**：`sessions_send` 到 `agent:pm:main` 会话

### 🔧 生成逻辑（AI 在 heartbeat 时执行）

1. **检查时间**：
   - 早间窗口：06:00-06:30
   - 晚间窗口：18:00-18:30
   - 当前时间：通过 `session_status` 或系统时间获取

2. **检查状态**：
   - 读取 `BRIEFING_STATE.json`
   - 如果今日已发送过该时段简报，跳过

3. **生成简报**：
   - 读取 `COMMIT_LOG.md` 和 git 提交记录 (`git log --oneline -5`)
   - 生成简报内容

4. **发送简报**：
   - 使用 `message` 工具发送到飞书群 `oc_47bb1fdb7010ae87894d3d01576775a2`
   - 使用 `sessions_send` 发送到 `agent:pm:main`

5. **更新状态**：
   - 更新 `BRIEFING_STATE.json` 记录已发送

### 📝 简报模板

**早间简报**：
```markdown
## 🌅 早间简报 | YYYY-MM-DD

### 📋 昨夜回顾 (昨日 18:00～今日 06:00)
- Git 提交：...

### 🔄 进行中
- ...

### ⚠️ 问题与风险
- ...

### 📅 今日计划
- ...
```

**晚间简报**：
```markdown
## 🌆 晚间简报 | YYYY-MM-DD

### 📋 今日工作 (06:00～18:00)
- Git 提交：...

### 🔄 进行中
- ...

### ⚠️ 问题与风险
- ...

### 📅 明日计划
- ...
```

---

## 📌 注意事项

1. ⚠️ **问题风险必须标注**（如无风险写"无重大风险"）
2. 避免重复发送（检查 `BRIEFING_STATE.json`）
3. Git 提交必须附哈希和说明
4. **双目标发送**：飞书群 + PM 会话都要发送

---

## 🔄 触发机制

**本任务通过 OpenClaw heartbeat 机制触发**。

### 配置位置

`openclaw.json` → `agents.list[]` → `heartbeat`:
```json
{
  "id": "git",
  "heartbeat": {
    "every": "30m",
    "target": "feishu",
    "to": "oc_47bb1fdb7010ae87894d3d01576775a2",
    "prompt": "Read HEARTBEAT.md if it exists..."
  }
}
```

### 执行流程

1. OpenClaw 每 30 分钟触发 git agent 的 heartbeat
2. AI 收到 heartbeat 消息后读取本文件
3. 检查当前时间是否在简报窗口内
4. 检查 `BRIEFING_STATE.json` 确认是否已发送
5. 如未发送，生成简报并发送到两个目标
6. 更新 `BRIEFING_STATE.json`

### 状态文件

`BRIEFING_STATE.json` 格式：
```json
{
  "last_morning": "2026-03-30",
  "last_evening": "2026-03-30",
  "version": "1.0"
}
```

---

## 📋 相关脚本（可选）

`scripts/morning-briefing.sh` 和 `scripts/evening-briefing.sh` 可用于手动生成简报内容，但**实际发送必须通过 AI 调用 `message` 和 `sessions_send`**。
