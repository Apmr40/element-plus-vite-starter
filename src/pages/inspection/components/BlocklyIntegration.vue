<!-- Blockly 画布集成组件 -->
<template>
  <div class="blockly-integration">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button size="small" @click="undo" :disabled="!canUndo">
          <el-icon><Undo /></el-icon> 撤销
        </el-button>
        <el-button size="small" @click="redo" :disabled="!canRedo">
          <el-icon><Redo /></el-icon> 重做
        </el-button>
      </el-button-group>
      
      <el-button-group>
        <el-button size="small" @click="copy">
          <el-icon><CopyDocument /></el-icon> 复制
        </el-button>
        <el-button size="small" @click="deleteSelected">
          <el-icon><Delete /></el-icon> 删除
        </el-button>
      </el-button-group>
      
      <div class="zoom-controls">
        <el-button size="small" @click="zoomOut">−</el-button>
        <span class="zoom-level">{{ zoomLevel }}%</span>
        <el-button size="small" @click="zoomIn">+</el-button>
        <el-button size="small" @click="fitCanvas">适应</el-button>
      </div>
    </div>

    <!-- Blockly 画布容器 -->
    <div class="blockly-container" ref="blocklyContainer">
      <!-- 
        Blockly 将渲染到这个 DOM 元素
        预计高度: 600px
      -->
    </div>

    <!-- 右侧参数面板 -->
    <div v-if="selectedBlock" class="properties-panel">
      <div class="panel-header">
        <span>积木参数</span>
        <el-icon @click="selectedBlock = null"><Close /></el-icon>
      </div>
      
      <!-- 参数配置表单 -->
      <el-form label-position="top" label-width="80px">
        <el-form-item label="字段名称">
          <el-input v-model="selectedBlock.params.field" />
        </el-form-item>
        
        <el-form-item label="操作符">
          <el-select v-model="selectedBlock.params.operator" placeholder="请选择">
            <el-option label="等于" value="=" />
            <el-option label="不等于" value="!=" />
            <el-option label="包含" value="contains" />
            <el-option label="正则匹配" value="regex" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="比较值">
          <el-input v-model="selectedBlock.params.value" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as Blockly from 'blockly'
import { 
  Undo, 
  Redo, 
  CopyDocument, 
  Delete, 
  Close,
} from '@element-plus/icons-vue'

// 状态
const blocklyContainer = ref<HTMLElement | null>(null)
const selectedBlock = ref<any>(null)
const zoomLevel = ref(100)
const canUndo = ref(false)
const canRedo = ref(false)

// Blockly 实例
let workspace: Blockly.WorkspaceSvg | null = null

// 方法
const initBlockly = () => {
  if (!blocklyContainer.value) return

  // 配置 Blockly
  workspace = Blockly.inject(blocklyContainer.value, {
    toolbox: `<xml xmlns="https://developers.google.com/blockly/xml">
      <category name="基础逻辑" colour="%{BKY_LOGIC_HUE}">
        <block type="controls_if"></block>
        <block type="logic_operation"></block>
        <block type="logic_compare"></block>
      </category>
      <category name="字符串处理" colour="%{BKY_TEXTS_HUE}">
        <block type="text_print"></block>
        <block type="text_length"></block>
        <block type="text_changeCase"></block>
      </category>
      <category name="循环遍历" colour="%{BKY_LOOPS_HUE}">
        <block type="lists_create_with"></block>
        <block type="lists_length"></block>
      </category>
      <category name="数据查询" colour="%{BKY_LISTS_HUE}">
        <block type="lists_indexOf"></block>
        <block type="lists_getIndex"></block>
      </category>
      <category name="操作类" colour="%{BKY_PROCEDURES_HUE}">
        <block type="alert"></block>
        <block type="output"></block>
      </category>
    </toolbox>`,
    theme: Blockly.Theme.defineTheme('myTheme', {
      base: Blockly.Themes.CLASSIC,
      styles: {
        'connectionDragStyle': {
          stroke: '#ff6600',
          strokeWidth: 3,
        },
        'connectionHighlightStyle': {
          stroke: '#ffcc00',
          strokeWidth: 3,
        },
        'hashFieldHighlightStyle': {
          stroke: '#ffcc00',
          strokeWidth: 3,
        },
      },
    }),
    media: '/node_modules/blockly/media/',
    zoom: {
      controls: false,
      startScale: 0.5,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
    },
  })

  // 监听事件
  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    // 事件处理逻辑
    console.log('Blockly event:', event.type)
  })
}

const undo = () => {
  if (workspace) {
    workspace.undo()
    updateUndoRedoState()
  }
}

const redo = () => {
  if (workspace) {
    workspace.redo()
    updateUndoRedoState()
  }
}

const copy = () => {
  // 复制选中的积木
  if (workspace) {
    const selectedBlocks = workspace.getTopBlocks(true)
    console.log('Selected blocks:', selectedBlocks)
  }
}

const deleteSelected = () => {
  if (workspace) {
    workspace.deleteCurrentBlock()
  }
}

const zoomIn = () => {
  if (workspace) {
    const currentScale = workspace.getMetrics().scale
    workspace.setScale(currentScale * 1.2)
    zoomLevel.value = Math.round(currentScale * 1.2 * 100)
  }
}

const zoomOut = () => {
  if (workspace) {
    const currentScale = workspace.getMetrics().scale
    workspace.setScale(currentScale / 1.2)
    zoomLevel.value = Math.round(currentScale / 1.2 * 100)
  }
}

const fitCanvas = () => {
  if (workspace) {
    workspace.zoomToFit()
    const currentMetrics = workspace.getMetrics()
    zoomLevel.value = Math.round(currentMetrics.scale * 100)
  }
}

const updateUndoRedoState = () => {
  if (workspace) {
    canUndo.value = (workspace as any).undoStack?.length > 0
    canRedo.value = (workspace as any).redoStack?.length > 0
  }
}

// 生命周期
onMounted(() => {
  initBlockly()
  updateUndoRedoState()
})

// 监听缩放变化
watch(zoomLevel, (newVal) => {
  // 可以添加缩放变化的监听逻辑
})
</script>

<style lang="scss" scoped>
.blockly-integration {
  display: flex;
  flex-direction: column;
  height: 100%;

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #ffffff;
    border-bottom: 1px solid #e8e9eb;
    flex-wrap: wrap;

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      
      .zoom-level {
        min-width: 48px;
        text-align: center;
        font-size: 14px;
        color: #25303c;
      }
    }
  }

  .blockly-container {
    flex: 1;
    height: 600px;
    background: #fafbfc;
    position: relative;
    overflow: auto;
  }

  .properties-panel {
    width: 280px;
    padding: 16px;
    background: #ffffff;
    border-left: 1px solid #e8e9eb;

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      span {
        font-weight: 600;
        color: #25303c;
      }
    }
  }
}
</style>
