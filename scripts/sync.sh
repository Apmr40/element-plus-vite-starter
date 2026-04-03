#!/bin/bash

# sync.sh - 项目目录同步脚本
# 用途：在 source、work、review 三个目录之间同步文件

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")/project_root"
SOURCE_DIR="$PROJECT_ROOT/source/element-plus-vite-starter"
WORK_DIR="$PROJECT_ROOT/work"
REVIEW_DIR="$PROJECT_ROOT/review"
SYNC_MAP="$PROJECT_ROOT/../SYNC_MAP.json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 初始化映射文件
init_sync_map() {
    if [ ! -f "$SYNC_MAP" ]; then
        cat > "$SYNC_MAP" << 'EOF'
{
  "version": "1.0",
  "mappings": []
}
EOF
        print_success "已初始化 SYNC_MAP.json"
    else
        print_info "SYNC_MAP.json 已存在"
    fi
}

# 添加映射关系
add_mapping() {
    local work_file="$1"
    local source_path="$2"
    local description="$3"
    local created=$(date -Iseconds)
    
    # 检查是否已存在
    if grep -q "\"work_file\": \"$work_file\"" "$SYNC_MAP" 2>/dev/null; then
        print_warning "映射已存在：$work_file"
        return 1
    fi
    
    # 读取现有映射
    local temp_file=$(mktemp)
    if [ -s "$SYNC_MAP" ] && [ "$(cat "$SYNC_MAP" | wc -l)" -gt 3 ]; then
        # 已有映射，插入新的
        cat "$SYNC_MAP" | sed 's/"mappings": \[/"mappings": [\n    {\n      "work_file": "'"$work_file"'",\n      "source_path": "'"$source_path"'",\n      "created": "'"$created"'",\n      "description": "'"$description"'"\n    },/' > "$temp_file"
    else
        # 空映射，创建第一个
        cat > "$temp_file" << EOF
{
  "version": "1.0",
  "mappings": [
    {
      "work_file": "$work_file",
      "source_path": "$source_path",
      "created": "$created",
      "description": "$description"
    }
  ]
}
EOF
    fi
    
    mv "$temp_file" "$SYNC_MAP"
    print_success "已添加映射：$work_file → $source_path"
}

# 从 source 提取文件到 work
cmd_extract() {
    local source_path="$1"
    local task_id="$2"
    
    if [ -z "$source_path" ]; then
        print_error "用法：$0 extract <source-path> [task_id]"
        print_info "示例：$0 extract src/components/MyComponent.vue 20260402_001"
        exit 1
    fi
    
    # 生成任务 ID（如果未提供）
    if [ -z "$task_id" ]; then
        task_id="$(date +%Y%m%d)_$(printf '%03d' $(ls -1 "$WORK_DIR/feat/" 2>/dev/null | wc -l | xargs -I {} expr {} + 1))"
    fi
    
    local work_task_dir="$WORK_DIR/feat/$task_id"
    local source_file="$SOURCE_DIR/$source_path"
    local work_file="$work_task_dir/$source_path"
    
    # 检查源文件是否存在
    if [ ! -f "$source_file" ]; then
        print_error "源文件不存在：$source_file"
        exit 1
    fi
    
    # 创建工作目录
    mkdir -p "$(dirname "$work_file")"
    
    # 复制文件
    cp "$source_file" "$work_file"
    
    print_success "已提取：$source_path → work/feat/$task_id/$source_path"
    
    # 添加映射关系
    add_mapping "feat/$task_id/$source_path" "$source_path" "从 source 提取"
}

# 从 work 提交文件到 review
cmd_submit() {
    local task_id="$1"
    
    if [ -z "$task_id" ]; then
        print_error "用法：$0 submit <task_id>"
        print_info "示例：$0 submit 20260402_001"
        exit 1
    fi
    
    local work_task_dir="$WORK_DIR/feat/$task_id"
    local review_task_dir="$REVIEW_DIR/$task_id"
    
    # 检查工作目录是否存在
    if [ ! -d "$work_task_dir" ]; then
        print_error "工作目录不存在：$work_task_dir"
        exit 1
    fi
    
    # 创建 review 目录
    mkdir -p "$review_task_dir"
    
    # 复制文件（保持目录结构）
    local file_count=0
    find "$work_task_dir" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" -o -name "*.scss" -o -name "*.css" \) | while read file; do
        local rel_path="${file#$work_task_dir/}"
        local dest_file="$review_task_dir/$rel_path"
        mkdir -p "$(dirname "$dest_file")"
        cp "$file" "$dest_file"
        print_info "提交：$rel_path"
        file_count=$((file_count + 1))
    done
    
    print_success "已提交 task $task_id 到 review 目录"
}

# 从 review 合并文件到 source
cmd_merge() {
    local task_id="$1"
    
    if [ -z "$task_id" ]; then
        print_error "用法：$0 merge <task_id>"
        print_info "示例：$0 merge 20260402_001"
        exit 1
    fi
    
    local review_task_dir="$REVIEW_DIR/$task_id"
    
    # 检查 review 目录是否存在
    if [ ! -d "$review_task_dir" ]; then
        print_error "Review 目录不存在：$review_task_dir"
        exit 1
    fi
    
    # 合并文件到 source
    local file_count=0
    find "$review_task_dir" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" -o -name "*.scss" -o -name "*.css" \) | while read file; do
        local rel_path="${file#$review_task_dir/}"
        local dest_file="$SOURCE_DIR/$rel_path"
        
        # 如果目标路径是文件名（不是完整路径），需要根据映射找到正确位置
        if [[ "$rel_path" != */* ]]; then
            # 简单文件名，尝试在 source 中查找
            local found=$(find "$SOURCE_DIR/src" -name "$rel_path" 2>/dev/null | head -1)
            if [ -n "$found" ]; then
                dest_file="$found"
            else
                # 默认放到 components 目录
                dest_file="$SOURCE_DIR/src/components/$rel_path"
            fi
        fi
        
        mkdir -p "$(dirname "$dest_file")"
        cp "$file" "$dest_file"
        print_info "合并：$rel_path → $dest_file"
        file_count=$((file_count + 1))
    done
    
    print_success "已合并 task $task_id 到 source"
    
    # 删除 review 目录
    rm -rf "$review_task_dir"
    print_info "已清理 review/$task_id"
}

# 检查映射关系完整性
cmd_check() {
    print_info "检查目录同步状态..."
    echo ""
    
    # 检查 source 目录
    if [ -d "$SOURCE_DIR" ]; then
        local source_files=$(find "$SOURCE_DIR" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) | wc -l)
        print_success "Source: $source_files 个文件"
    else
        print_error "Source 目录不存在：$SOURCE_DIR"
    fi
    
    # 检查 work 目录
    if [ -d "$WORK_DIR" ]; then
        local work_files=$(find "$WORK_DIR" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) | wc -l)
        print_success "Work: $work_files 个文件"
        find "$WORK_DIR" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) | while read f; do
            echo "  - ${f#$PROJECT_ROOT/}"
        done
    else
        print_warning "Work 目录不存在"
    fi
    
    # 检查 review 目录
    if [ -d "$REVIEW_DIR" ]; then
        local review_files=$(find "$REVIEW_DIR" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) | wc -l)
        print_success "Review: $review_files 个文件"
        find "$REVIEW_DIR" -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) | while read f; do
            echo "  - ${f#$PROJECT_ROOT/}"
        done
    else
        print_warning "Review 目录不存在"
    fi
    
    # 检查映射文件
    if [ -f "$SYNC_MAP" ]; then
        print_success "SYNC_MAP.json 存在"
    else
        print_warning "SYNC_MAP.json 不存在"
    fi
    
    echo ""
    print_info "检查完成"
}

# 显示帮助
cmd_help() {
    cat << EOF
同步脚本 - 在 source、work、review 目录之间同步文件

用法：$0 <command> [arguments]

命令:
  extract <source-path> [task_id]  从 source 提取文件到 work
  submit <task_id>                 从 work 提交文件到 review
  merge <task_id>                  从 review 合并文件到 source
  check                            检查映射关系完整性
  init                             初始化 SYNC_MAP.json
  help                             显示此帮助信息

示例:
  $0 extract src/components/MyComponent.vue 20260402_001
  $0 submit 20260402_001
  $0 merge 20260402_001
  $0 check

目录结构:
  project_root/
  ├── source/element-plus-vite-starter/  ← 源代码仓库
  ├── work/feat/<task_id>/               ← 开发工作区
  └── review/<task_id>/                  ← 待审核区

EOF
}

# 主入口
case "${1:-help}" in
    extract)
        cmd_extract "$2" "$3"
        ;;
    submit)
        cmd_submit "$2"
        ;;
    merge)
        cmd_merge "$2"
        ;;
    check)
        cmd_check
        ;;
    init)
        init_sync_map
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "未知命令：$1"
        cmd_help
        exit 1
        ;;
esac
