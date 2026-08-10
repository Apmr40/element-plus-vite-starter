/**
 * 操作工作台 - composable 共享工具
 */
import { ref, watch } from 'vue'

/**
 * 状态映射工厂函数
 * 将字符串状态映射为 Element Plus tag type 或显示文本
 */
export function createStatusMapper<T extends string>(map: Record<string, T>, defaultValue: T) {
  return (status: string): T => map[status] || defaultValue
}

/** 列表视图形态：卡片 / 表单（表格） */
export type ViewMode = 'card' | 'table'

/**
 * 创建持久化的视图模式 ref（设计文档 §3/§6）
 * - localStorage 按分区记忆，非法/缺失值回退 'card'
 * - watch 自动写回；存储不可用（隐私模式等）时静默降级为纯内存
 */
export function createPersistedViewMode(storageKey: string) {
  let initial: ViewMode = 'card'
  try {
    if (localStorage.getItem(storageKey) === 'table')
      initial = 'table'
  }
  catch { /* 存储不可用：回退 card */ }

  const mode = ref<ViewMode>(initial)
  watch(mode, (value) => {
    try {
      localStorage.setItem(storageKey, value)
    }
    catch { /* 存储不可用：忽略 */ }
  })
  return mode
}

/**
 * 从模板内容中提取预埋参数变量（纯前端逻辑，无需后端 API）
 * - 脚本类：${var} 格式
 * - API类：{{var}} 格式
 * 返回去重后的变量名列表（保持出现顺序）
 */
export function extractTemplateVars(content: string, pattern: 'script' | 'api' = 'script'): string[] {
  if (!content)
    return []
  const regex = pattern === 'script' ? /\$\{([a-z_]\w*)\}/gi : /\{\{([a-z_]\w*)\}\}/gi
  const vars: string[] = []
  for (const match of content.matchAll(regex)) {
    if (!vars.includes(match[1]))
      vars.push(match[1])
  }
  return vars
}

let uidCounter = 0
/** 生成唯一行 ID（参数表 / KV 行） */
export function genRowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++uidCounter}`
}

// ============ 语法高亮（shell / python / sql / groovy / json / text） ============
interface LangDef {
  ci: boolean
  tokens: [RegExp, string][]
}

const LANGS: Record<string, LangDef> = {
  shell: { ci: false, tokens: [
    [/#[^\n]*/, 'tk-c'],
    [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'tk-s'],
    [/\$\{\w+\}/, 'tk-p'],
    [/\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|function|echo|exit|export|source|local|return|set|cd|read|eval|kubectl|grep|awk|sed|curl|cat|chmod|chown|systemctl|docker|sudo|nohup|tail|head|find|xargs|ssh|tar|mkdir|rm|cp|mv|ps|kill|df|du|ping)\b/, 'tk-k'],
  ] },
  python: { ci: false, tokens: [
    [/#[^\n]*/, 'tk-c'],
    [/"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'tk-s'],
    [/\$\{\w+\}/, 'tk-p'],
    [/\b(?:def|class|import|from|return|yield|if|elif|else|for|while|in|not|and|or|is|try|except|finally|raise|with|as|lambda|pass|break|continue|global|assert|del|print|True|False|None|self)\b/, 'tk-k'],
  ] },
  sql: { ci: true, tokens: [
    [/--[^\n]*|\/\*[\s\S]*?\*\//, 'tk-c'],
    [/'(?:[^'\\]|\\.)*'/, 'tk-s'],
    [/\$\{\w+\}/, 'tk-p'],
    [/\b(?:select|from|where|insert|into|values|update|set|delete|create|table|drop|alter|add|index|view|join|left|right|inner|outer|on|group|by|order|having|limit|offset|and|or|not|null|as|distinct|count|sum|avg|max|min|union|all|exists|between|like|is|case|when|then|end|asc|desc|primary|key|varchar|int|integer|text|date|timestamp|default|begin|commit|rollback|truncate)\b/, 'tk-k'],
  ] },
  groovy: { ci: false, tokens: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'tk-c'],
    [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'tk-s'],
    [/\$\{\w+\}/, 'tk-p'],
    [/\b(?:def|class|interface|return|if|else|for|while|in|new|try|catch|finally|throw|import|package|public|private|protected|static|final|void|int|long|boolean|String|true|false|null|println|assert|switch|case|break|continue|instanceof)\b/, 'tk-k'],
  ] },
  json: { ci: false, tokens: [
    [/\{\{\w+\}\}/, 'tk-p'],
    [/"(?:[^"\\\n]|\\.)*"(?=\s*:)/, 'tk-k'],
    [/"(?:[^"\\\n]|\\.)*"/, 'tk-s'],
    [/\b(?:true|false|null)\b/, 'tk-k'],
    [/-?\d+(?:\.\d+)?/, 'tk-n'],
  ] },
  text: { ci: false, tokens: [[/\{\{\w+\}\}/, 'tk-p']] },
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * 对代码做轻量语法高亮，返回可安全 v-html 的 HTML 字符串。
 * 逐 token 转义，避免先转义再匹配导致的错位。
 */
export function highlight(code: string, lang: string): string {
  const def = LANGS[lang]
  if (!def)
    return escapeHtml(code)
  const re = new RegExp(def.tokens.map(t => `(${t[0].source})`).join('|'), `g${def.ci ? 'i' : ''}`)
  let result = ''
  let lastIdx = 0
  for (const m of code.matchAll(re)) {
    result += escapeHtml(code.slice(lastIdx, m.index))
    let cls = ''
    for (let i = 1; i < m.length; i++) {
      if (m[i] != null) {
        cls = def.tokens[i - 1][1]
        break
      }
    }
    result += cls ? `<span class="${cls}">${escapeHtml(m[0])}</span>` : escapeHtml(m[0])
    lastIdx = (m.index ?? 0) + m[0].length
  }
  result += escapeHtml(code.slice(lastIdx))
  return result
}
