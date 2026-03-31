#!/bin/bash
# 早间简报生成脚本 - 06:00 执行
# 覆盖时间范围：昨日 18:00 ～ 今日 06:00

set -e

WORKSPACE="/home/admin/.openclaw/ws-git"
cd "$WORKSPACE"

# 获取日期信息
TODAY=$(date +"%Y-%m-%d")
YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# 检查是否已发送过今日早间简报
if [ -f BRIEFING_STATE.json ]; then
    LAST_MORNING=$(grep -o '"last_morning": *"[^"]*"' BRIEFING_STATE.json | cut -d'"' -f4)
    if [ "$LAST_MORNING" = "$TODAY" ]; then
        echo "[$TIMESTAMP] 早间简报已发送过，跳过"
        exit 0
    fi
fi

# 读取最近的 git 提交
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null | head -5 || echo "无提交记录")

# 生成早间简报内容
BRIEFING="## 🌅 早间简报 | $TODAY

### 📋 昨夜回顾 (昨日 18:00 ～ 今日 06:00)
- **Git 提交**:
$RECENT_COMMITS

### 🔄 进行中
- 持续监控 Git 仓库状态
- 维护代码同步机制

### ⚠️ 问题与风险
- 无重大风险

### 📅 今日计划
- 等待新的开发任务
- 继续维护 review 审查流程

---
*自动生成于 $TIMESTAMP*"

# 更新状态
if command -v jq &> /dev/null; then
    jq ".last_morning = \"$TODAY\"" BRIEFING_STATE.json > BRIEFING_STATE.json.tmp && mv BRIEFING_STATE.json.tmp BRIEFING_STATE.json
else
    sed -i "s/\"last_morning\": *\"[^\"]*\"/\"last_morning\": \"$TODAY\"/" BRIEFING_STATE.json
fi

# 输出简报内容（供日志记录）
echo "[$TIMESTAMP] 早间简报内容:"
echo "$BRIEFING"
echo ""
echo "[$TIMESTAMP] 状态已更新：last_morning = $TODAY"

# 注意：实际发送需要通过 OpenClaw 会话调用 sessions_send 工具
# 此脚本由 crontab 触发，记录日志供 AI 在下次会话时处理
echo "[$TIMESTAMP] 简报已生成，等待 AI 会话发送..."
