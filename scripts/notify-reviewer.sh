#!/bin/bash

# notify-reviewer.sh - 发送代码变更通知给审核人

# 审核人配置
REVIEWER_APP_ID="cli_a936af0674785bb6"
REVIEWER_NAME="审核"
CHAT_ID="oc_47bb1fdb7010ae87894d3d01576775a2"

# 获取 Git 信息
LAST_COMMIT_HASH=$(git log -1 --format="%H" 2>/dev/null)
LAST_COMMIT_MSG=$(git log -1 --format="%s" 2>/dev/null)
GIT_DIFF=$(git diff HEAD~1 2>/dev/null || echo "首次提交，无diff")

# 获取需求文件（如果有）
REQUIREMENT_FILE=""
if [ -f "REQUIREMENT.md" ]; then
  REQUIREMENT_FILE="**需求文件**: REQUIREMENT.md"
elif [ -f "需求文档.md" ]; then
  REQUIREMENT_FILE="**需求文件**: 需求文档.md"
elif [ -f "需求说明.md" ]; then
  REQUIREMENT_FILE="**需求文件**: 需求说明.md"
fi

# 构建通知内容
CONTENT="**🔔 代码开发完成，请审核**\n\n"
CONTENT+="**变更摘要**:\n"
CONTENT+="• Git 提交: ${LAST_COMMIT_HASH}\n"
CONTENT+="• 提交信息: ${LAST_COMMIT_MSG}\n"
CONTENT+="\n"

if [ -n "$REQUIREMENT_FILE" ]; then
  CONTENT+="${REQUIREMENT_FILE}\n"
  CONTENT+="\n"
fi

CONTENT+="**Git diff**:\n"
CONTENT+="\`\`\`diff\n"
CONTENT+="${GIT_DIFF}\n"
CONTENT+="\`\`\`\n"

CONTENT+="\n<at user_id='${REVIEWER_APP_ID}'>${REVIEWER_NAME}</at> 请检查代码并确认是否可以继续下一步"

# 输出通知内容（用于测试）
echo "通知内容预览："
echo "$CONTENT"
echo ""
echo "----------------------------"
echo "发送到群聊: $CHAT_ID"

# 发送消息到飞书群
if command -v curl &> /dev/null; then
  echo "正在发送通知..."
  # 使用飞书机器人 Webhook 发送（需要配置）
  #curl -X POST -H "Content-Type: application/json" -d "$CONTENT" <飞书机器人Webhook URL>
fi
