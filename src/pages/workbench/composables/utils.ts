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
  yaml: { ci: false, tokens: [
    [/#[^\n]*/, 'tk-c'],
    [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'tk-s'],
    [/^\s*[\w.-]+(?=\s*:)/m, 'tk-k'],
    [/\b(?:true|false|null|yes|no)\b/, 'tk-k'],
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

// ============ 返回信息智能识别（《执行记录信息扩展-交互设计》§7）============

/** 返回信息识别类型 */
export type ReturnDataType = 'json' | 'jsonarray' | 'yaml' | 'text'

/**
 * 识别返回信息的展示类型。
 * 优先级：JSON.parse 成功（Array→jsonarray / Object→json）→ YAML 启发式 → text。
 * 识别结果仅用于展示，原始字符串是唯一数据源。
 */
export function detectReturnType(content: string | undefined): ReturnDataType {
  const raw = (content ?? '').trim()
  if (!raw)
    return 'text'

  // JSON / JSON Array
  if (raw[0] === '{' || raw[0] === '[') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // 元素全为对象才走表格形式，否则降级 json 代码块
        const allObjects = parsed.length > 0 && parsed.every(item => item !== null && typeof item === 'object' && !Array.isArray(item))
        return allObjects ? 'jsonarray' : 'json'
      }
      if (parsed !== null && typeof parsed === 'object')
        return 'json'
    }
    catch {
      // parse 失败继续向下
    }
  }

  // YAML 启发式：首行 --- 或 ≥2 行 key:value（单行冒号文本不误判）
  const lines = raw.split('\n')
  if (lines[0].trim() === '---')
    return 'yaml'
  const kvLines = lines.filter(line => /^[\w.-]+\s*:/.test(line.trim()))
  if (kvLines.length >= 2)
    return 'yaml'

  return 'text'
}

/** 返回信息类型徽标文案 */
export const RETURN_TYPE_LABEL: Record<ReturnDataType, string> = {
  json: 'JSON',
  jsonarray: 'JSON Array',
  yaml: 'YAML',
  text: 'TEXT',
}

/** JSON Array 表格列推断结果 */
export interface InferredColumn {
  key: string
  /** object 类型的列为嵌套列 */
  nested: boolean
}

/**
 * 为 JSON Array 推断表格列：全体元素 key 的并集，按首次出现顺序排列。
 * 列类型按首个非空值的类型判定（object → 嵌套列）。
 */
export function inferArrayColumns(items: Record<string, any>[]): InferredColumn[] {
  const cols: InferredColumn[] = []
  const seen = new Set<string>()
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (seen.has(key))
        continue
      seen.add(key)
      const val = item[key]
      const nested = val !== null && typeof val === 'object'
      cols.push({ key, nested })
    }
  }
  return cols
}

/** 判断 JSON Array 中是否存在嵌套对象（决定是否出现展开列） */
export function hasNestedObject(items: Record<string, any>[]): boolean {
  return items.some(item => Object.values(item).some(v => v !== null && typeof v === 'object'))
}
