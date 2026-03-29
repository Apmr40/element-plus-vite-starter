#!/bin/bash
# notify-reviewer.sh - 代码提交审核通知脚本

# 配置
REVIEWER_SESSION="agent:reviewer:main"
CHANNEL="feishu"
GROUP_ID="oc_47bb1fdb7010ae87894d3d01576775a2"

# 获取最新提交信息
LATEST_HASH=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
COMMIT_TIME=$(git log -1 --pretty=%cd --date=format:"%Y-%m-%d %H:%M")

# 获取变更统计
CHANGES=$(git diff HEAD~1..HEAD --stat)
DIFF=$(git diff HEAD~1..HEAD)

# 构建通知消息
MESSAGE="## 📤 代码提交审核请求

### 📝 变更摘要
- **提交哈希**: \`$LATEST_HASH\`
- **提交消息**: $COMMIT_MSG
- **提交时间**: $COMMIT_TIME

### 📊 变更文件统计
\`\`\`diff
$CHANGES
\`\`\`

### 📂 Git Diff
\`\`\`diff
$DIFF
\`\`\`

### 🔗 需求文件链接
- Notion 资料库: https://www.notion.so/32a33b8576de8165b1ecd239f0d71fe7?v=32a33b8576de81edb3fb000c4d56116c

---

**提交人**: frontend  
**时间**: $COMMIT_TIME  
"

# 发送审核请求
sessionKey=$(cd /home/admin/.openclaw/ws-frontend && openclaw sessions list --json | jq -r '.[] | select(.agentId == "agent:reviewer:main") | .sessionKey')

cd /home/admin/.openclaw/ws-frontend
openclaw sessions send --session-key "$sessionKey" --message "$MESSAGE"

echo "✅ 审核请求已发送至 reviewer"
