#!/usr/bin/env python3
"""一次性脚本：为 mock/workbench.ts 的操作组件补齐 operationCategory，
并按《操作组件筛选与自定义标签-交互设计》§3.2 规则反算 riskLevel/tags。
用法: python3 scripts/enrich-mock-ops.py [--apply]  (默认 dry-run 打印 diff)
"""
import re
import sys

FILE = 'src/demo/mock/workbench.ts'

# 关键词 → 操作分类（按优先级顺序匹配，首个命中生效）
RULES = [
    ('verify',    ['健康检查', '连通性']),
    ('startstop', ['重启', '启停', '切换', '回滚', '重跑', '恢复', '初始化', '服务管理', '场景执行']),
    ('query',     ['查看', '查询', '检查', '巡检', '状态', '导出', '收集']),
    ('deploy',    ['迁移', '部署', '发布', '镜像更新', '扩容']),
    ('config',    ['同步', '更新', '重载', '调整', '变更']),
    ('cleanup',   ['清理', '备份', '归档', '回收']),
]
CATEGORY = {cat: kws for cat, kws in RULES}

# 操作分类 → 风险等级（RISK_MAP 的 mock 值形态）
RISK = {'query': 'low', 'verify': 'medium', 'startstop': 'high',
        'config': 'high', 'deploy': 'high', 'cleanup': 'medium'}
# 风险等级 → 权限提示推导
TAGS = {'low': "['生产办公', '一二线']",
        'medium': "['仅生产']",
        'high': "['仅生产', '应急']"}

# 人工覆盖样例（设计文档 §3.2）：risk 按推导，tags 保留人工值
OVERRIDES = {'op9901-3': "['仅生产']"}
# 分类覆盖：与版本快照保持一致（op0901-1 的 V3 快照为 查询/低，
# 快照是发布态事实，编辑弹窗从快照预填，列表显示必须一致）
CAT_OVERRIDES = {'op0901-1': 'query'}
# 应用定制的自定义标签示例
CUSTOM_TAGS = {'op0901-1': "['核心链路']",
               'op0901-2': "['配置管控']",
               'op0901-3': "['月度巡检']"}


def classify(name: str) -> str:
    for cat, kws in RULES:
        if any(kw in name for kw in kws):
            return cat
    return 'query'  # 兜底


def main():
    apply = '--apply' in sys.argv
    with open(FILE, encoding='utf-8') as f:
        lines = f.readlines()

    changes, deviations = [], []
    op_re = re.compile(r"^\s*\{ id: '(op[^']+)'")
    for i, line in enumerate(lines):
        m = op_re.match(line)
        if not m:
            continue
        op_id = m.group(1)
        name_m = re.search(r"name: '([^']+)'", line)
        risk_m = re.search(r"riskLevel: '([a-z]+)'", line)
        tags_m = re.search(r"tags: (\[[^\]]*\])", line)
        if not (name_m and risk_m and tags_m):
            continue
        name = name_m.group(1)
        old_risk = risk_m.group(1)
        old_tags = tags_m.group(1)

        cat = CAT_OVERRIDES.get(op_id, classify(name))
        risk = RISK[cat]
        tags = OVERRIDES.get(op_id, TAGS[risk])

        if op_id in OVERRIDES or old_risk != risk or old_tags != tags:
            deviations.append(f"{op_id} {name}: risk {old_risk}→{risk}, tags {old_tags}→{tags}, cat={cat}")

        new = line
        new = re.sub(r"riskLevel: '[a-z]+'", f"riskLevel: '{risk}'", new)
        new = re.sub(r"tags: \[[^\]]*\]", f"tags: {tags}", new)
        extra = f", operationCategory: '{cat}'"
        if op_id in CUSTOM_TAGS:
            extra += f", customTags: {CUSTOM_TAGS[op_id]}"
        new = new.replace(', paramConfig: commonParams', extra + ', paramConfig: commonParams')
        if new != line:
            changes.append((i, new))

    print(f"=== 操作总数: {sum(1 for l in lines if op_re.match(l))}, 变更行数: {len(changes)} ===")
    print("=== 推导与原值差异（偏离清单）===")
    for d in deviations:
        print(' ', d)

    if apply:
        for i, new in changes:
            lines[i] = new
        with open(FILE, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"=== 已写入 {FILE} ===")
    else:
        print("=== dry-run，未写入（加 --apply 落盘）===")


if __name__ == '__main__':
    main()
