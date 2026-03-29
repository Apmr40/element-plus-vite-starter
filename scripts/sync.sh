#!/bin/bash
# 目录同步脚本 - 维护 work、review 和 source 之间的文件同步

set -e

WORKSPACE="/home/admin/.openclaw/ws-git"
SOURCE_DIR="$WORKSPACE/project_root/source/element-plus-vite-starter"
WORK_DIR="$WORKSPACE/work"
REVIEW_DIR="$WORKSPACE/review"
MAP_FILE="$WORKSPACE/SYNC_MAP.json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 初始化映射文件
init_map() {
    if [ ! -f "$MAP_FILE" ]; then
        echo '{"mappings": []}' > "$MAP_FILE"
        log_info "已创建映射文件：$MAP_FILE"
    fi
}

# 添加映射关系
add_mapping() {
    local work_file="$1"
    local source_path="$2"
    
    # 检查是否已存在
    if grep -q "\"work_file\": \"$work_file\"" "$MAP_FILE" 2>/dev/null; then
        log_warn "映射已存在：$work_file"
        return 1
    fi
    
    # 使用 jq 添加映射（如果 jq 不可用，使用简单的 sed 方法）
    if command -v jq &> /dev/null; then
        jq ".mappings += [{\"work_file\": \"$work_file\", \"source_path\": \"$source_path\", \"created\": \"$(date -Iseconds)\"}]" "$MAP_FILE" > "${MAP_FILE}.tmp" && mv "${MAP_FILE}.tmp" "$MAP_FILE"
    else
        # 简单的 JSON 追加（不使用 jq）
        sed -i 's/}$/,"mappings":[{"work_file":"'"$work_file"'","source_path":"'"$source_path"'","created":"'"$(date -Iseconds)"'"}]}/' "$MAP_FILE" 2>/dev/null || true
    fi
    
    log_info "已添加映射：$work_file -> $source_path"
}

# 从 source 提取文件到 work
extract() {
    local source_rel_path="$1"
    local source_file="$SOURCE_DIR/$source_rel_path"
    local work_file=$(basename "$source_rel_path")
    
    if [ ! -f "$source_file" ]; then
        log_error "源文件不存在：$source_file"
        return 1
    fi
    
    cp "$source_file" "$WORK_DIR/$work_file"
    log_info "已提取：$work_file"
    
    add_mapping "$work_file" "$source_rel_path"
}

# 从 work 提交文件到 review
submit() {
    local work_file="$1"
    
    if [ ! -f "$WORK_DIR/$work_file" ]; then
        log_error "工作文件不存在：$WORK_DIR/$work_file"
        return 1
    fi
    
    cp "$WORK_DIR/$work_file" "$REVIEW_DIR/$work_file"
    log_info "已提交到审查：$work_file"
}

# 从 review 合并回 source
merge() {
    local review_file="$1"
    
    if [ ! -f "$REVIEW_DIR/$review_file" ]; then
        log_error "审查文件不存在：$REVIEW_DIR/$review_file"
        return 1
    fi
    
    # 查找映射的源路径
    local source_rel_path=$(grep -o "\"source_path\": \"[^\"]*\"" "$MAP_FILE" | grep -B1 "\"work_file\": \"$review_file\"" | head -1 | cut -d'"' -f4)
    
    if [ -z "$source_rel_path" ]; then
        log_warn "未找到映射关系，需要手动指定源路径"
        source_rel_path="src/components/$review_file"  # 默认路径
    fi
    
    local source_file="$SOURCE_DIR/$source_rel_path"
    
    # 创建目标目录（如果不存在）
    mkdir -p "$(dirname "$source_file")"
    
    cp "$REVIEW_DIR/$review_file" "$source_file"
    rm "$REVIEW_DIR/$review_file"
    
    log_info "已合并：$review_file -> $source_rel_path"
}

# 检查完整性
check() {
    log_info "=== 目录完整性检查 ==="
    
    # 检查 work 目录
    log_info "Work 目录文件："
    if [ -d "$WORK_DIR" ] && [ "$(ls -A $WORK_DIR 2>/dev/null)" ]; then
        ls -1 "$WORK_DIR"
    else
        log_warn "Work 目录为空"
    fi
    
    echo ""
    
    # 检查 review 目录
    log_info "Review 目录文件："
    if [ -d "$REVIEW_DIR" ] && [ "$(ls -A $REVIEW_DIR 2>/dev/null)" ]; then
        ls -1 "$REVIEW_DIR"
    else
        log_warn "Review 目录为空"
    fi
    
    echo ""
    
    # 检查映射关系
    log_info "映射关系："
    if [ -f "$MAP_FILE" ]; then
        cat "$MAP_FILE"
    else
        log_warn "映射文件不存在"
    fi
    
    echo ""
    
    # 验证映射文件是否存在于 source
    log_info "验证源文件存在性："
    if [ -f "$MAP_FILE" ]; then
        grep -o "\"work_file\": \"[^\"]*\"" "$MAP_FILE" | cut -d'"' -f4 | while read work_file; do
            source_path=$(grep -A2 "\"work_file\": \"$work_file\"" "$MAP_FILE" | grep "source_path" | cut -d'"' -f4)
            if [ -f "$SOURCE_DIR/$source_path" ]; then
                log_info "✓ $work_file -> $source_path"
            else
                log_error "✗ $work_file -> $source_path (源文件不存在)"
            fi
        done
    fi
}

# 同步所有 work 文件到 source（批量操作）
sync_all() {
    log_info "=== 同步所有 work 文件到 source ==="
    
    for work_file in "$WORK_DIR"/*; do
        if [ -f "$work_file" ]; then
            filename=$(basename "$work_file")
            source_rel_path=$(grep -A2 "\"work_file\": \"$filename\"" "$MAP_FILE" 2>/dev/null | grep "source_path" | cut -d'"' -f4)
            
            if [ -n "$source_rel_path" ]; then
                local source_file="$SOURCE_DIR/$source_rel_path"
                mkdir -p "$(dirname "$source_file")"
                cp "$work_file" "$source_file"
                log_info "已同步：$filename -> $source_rel_path"
            else
                log_warn "跳过 $filename（无映射关系）"
            fi
        fi
    done
}

# 主函数
case "${1:-check}" in
    extract)
        init_map
        extract "$2"
        ;;
    submit)
        submit "$2"
        ;;
    merge)
        merge "$2"
        ;;
    check)
        init_map
        check
        ;;
    sync-all)
        sync_all
        ;;
    *)
        echo "用法：$0 {extract|submit|merge|check|sync-all} [参数]"
        echo ""
        echo "命令:"
        echo "  extract <source-rel-path>  从 source 提取文件到 work"
        echo "  submit <work-file>         从 work 提交文件到 review"
        echo "  merge <review-file>        从 review 合并文件到 source"
        echo "  check                      检查目录完整性"
        echo "  sync-all                   同步所有 work 文件到 source"
        exit 1
        ;;
esac
