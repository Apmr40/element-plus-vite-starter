<script setup lang="ts">
import { computed, ref } from 'vue'
import { highlight } from '~/pages/workbench/composables/utils'

const props = defineProps<{
  modelValue: string
  /** 语法高亮语言标识（shell/python/sql/groovy/json/text） */
  lang: string
  /** 工具栏展示的语言标签 */
  langTag: string
  /** 埋点变量格式提示（如 ${var} / {{var}}） */
  varFormat?: string
  /** 只读模式（查看草稿场景） */
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const hlRef = ref<HTMLElement>()

const highlightHtml = computed(() => `${highlight(props.modelValue, props.lang)}\n`)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function syncScroll() {
  if (textareaRef.value && hlRef.value) {
    hlRef.value.scrollTop = textareaRef.value.scrollTop
    hlRef.value.scrollLeft = textareaRef.value.scrollLeft
  }
}
</script>

<template>
  <div class="editor-wrap">
    <div class="editor-toolbar">
      <span class="lang-tag">{{ langTag }}</span>
      <span class="var-hint">
        <slot name="hint">
          预埋参数变量：<code>{{ varFormat }}</code>，保存时自动提取
        </slot>
      </span>
    </div>
    <div class="editor-box">
      <pre ref="hlRef" class="editor-hl" aria-hidden="true" v-html="highlightHtml" />
      <textarea
        ref="textareaRef"
        :value="modelValue"
        class="editor"
        spellcheck="false"
        :disabled="disabled"
        @input="onInput"
        @scroll="syncScroll"
      />
    </div>
    <slot name="footer" />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/uops-theme.scss' as *;

.editor-wrap {
  border: 1px solid $uops-border-color;
  border-radius: $uops-radius-sm;
  overflow: hidden;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:focus-within {
    border-color: $uops-primary-color;
    box-shadow: 0 0 0 2px rgba($uops-primary-color, 0.12);
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: $uops-spacing-md;
    padding: $uops-spacing-sm $uops-spacing-md;
    background: $bg-list-header;
    border-bottom: 1px solid var(--el-border-color-light);

    .lang-tag {
      font-size: $font-size-label;
      font-weight: 700;
      color: $uops-primary-color;
      background: $bg-card-large;
      padding: 2px 10px;
      border-radius: 10px;
    }

    .var-hint {
      font-size: $font-size-label;
      color: $uops-text-placeholder;
      margin-left: auto;

      code {
        background: rgba($uops-primary-color, 0.08);
        color: $uops-primary-color;
        padding: 1px 5px;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
      }
    }
  }

  .editor-box {
    position: relative;
    background: #1e2733;
  }

  .editor-hl,
  .editor {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
    padding: $uops-spacing-md $uops-spacing-lg;
    margin: 0;
    border: none;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .editor-hl {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    color: #d7e2ee;

    // 语法高亮 token（与 utils.ts highlight() 输出对应）
    .tk-c {
      color: #7c9cb4;
      font-style: italic;
    } // 注释
    .tk-s {
      color: #8bd697;
    } // 字符串
    .tk-p {
      color: #ffce3f;
      font-weight: 700;
    } // ${var} / {{var}} 埋点
    .tk-k {
      color: #55cfff;
    } // 关键字
    .tk-n {
      color: #ff9f41;
    } // 数字
  }

  .editor {
    position: relative;
    display: block;
    width: 100%;
    min-height: 180px;
    background: transparent;
    color: transparent;
    caret-color: #fff;
    resize: vertical;

    &:focus {
      outline: none;
    }

    &::selection {
      background: rgba($uops-primary-color, 0.35);
      color: transparent;
    }
  }
}
</style>
