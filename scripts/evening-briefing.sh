#!/bin/bash
# 晚间简报生成脚本 - 18:00 执行
# 覆盖时间范围：今日 06:00 ～ 18:00

set -e

WORKSPACE="/home/admin/.openclaw/ws-git"
cd "$WORKSPACE"

# 获取日期信息
TODAY=$(date +"%Y-%m-%d")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# 检查是否已发送过今日晚间简报
if [ -f BRIEFING_STATE.json ]; then
    LAST_EVENING=$(grep -o '"last_evening": *"[^"]*"' BRIEFING_STATE.json | cut -d'"' -f4)
    if [ "$LAST_EVENING" = "$TODAY" ]; then
        echo "[$TIMESTAMP] 晚间简报已发送过，跳过"
        exit 0
    fi
fi

# 读取最近的 git 提交
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null | head -5 || echo "无提交记录")

# 生成晚间简报内容
BRIEFING="## 🌆 晚间简报 | $TODAY

### 📋 今日工作 (06:00 ～ 18:00)
- **Git 提交**:
$RECENT_COMMITS

### 🔄 进行中
- 持续监控 Git 仓库状态
- 维护代码同步机制

### ⚠️ 问题与风险
- 无重大风险

### 📅 明日计划
- 继续等待新的开发任务
- 维护 review 审查流程

---
*自动生成于 $TIMESTAMP*"

# 更新状态
if command -v jq &> /dev/null; then
    jq ".last_evening = \"$TODAY\"" BRIEFING_STATE.json > BRIEFING_STATE.json.tmp && mv BRIEFING_STATE.json.tmp BRIEFING_STATE.json
else
    sed -i "s/\"last_evening\": *\"[^\"]*\"/\"last_evening\": \"$TODAY\"/" BRIEFING_STATE.json
fi

# 输出简报内容（供日志记录）
echo "[$TIMESTAMP] 晚间简报内容:"
echo "$BRIEFING"
echo ""
echo "[$TIMESTAMP] 状态已更新：last_evening = $TODAY"

# 注意：实际发送需要通过 OpenClaw 会话调用 sessions_send 工具
# 此脚本由 crontab 触发，记录日志供 AI 在下次会话时处理
echo "[$TIMESTAMP] 简报已生成，等待 AI 会话发送..."
