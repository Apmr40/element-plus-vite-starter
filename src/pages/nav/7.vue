<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ElTable } from 'element-plus'
import CascadePreviewModal from '@/components/CascadePreviewModal.vue'

// 字段配置接口
interface FieldConfig {
  fieldName: string
  description: string
  orderIndex: number
  hideFlag: number
  pkFlag: number
  pkDisplayFlag: number
}

// 层级配置接口
interface CascadeLevel {
  resourceLevel: string      // '1', '2', '3'
  resourceName: string       // '数据中心'
  apiUrl: string
  resourceId: string         // 17 位
  apiId: string              // 17 位
  inputExample: string
  outputExample: string
  fields: FieldConfig[]
}

// 表单数据
const form = reactive({
  platformType: '',      // 平台编码（2 位大写字母，如 ZH）
  platformCode: '',      // 平台英文缩写（小写，如 zhmc）
  platformName: ''       // 平台名称（中文，如 中化）
})

// 层级列表
const levels = ref<CascadeLevel[]>([])
const currentLevelIndex = ref(0)

// 当前层级（计算属性）
const currentLevel = computed(() => {
  if (levels.value.length === 0) return null
  return levels.value[currentLevelIndex.value]
})

// 字段列表（绑定到当前层级）
const fieldList = computed({
  get: () => currentLevel.value?.fields || [],
  set: (val) => {
    if (currentLevel.value) {
      currentLevel.value.fields = val
    }
  }
})

// SQL 结果
interface SqlResult {
  pltfReso: string
  resoInfo: string
  apiInfo: string
  fldInfo: string
  apiParm: string
  full: string
}
const sqlResult = ref<SqlResult | null>(null)

// 拖拽相关
const draggingRow = ref<any>(null)
const dragOverRow = ref<any>(null)

// 生成 17 位资源 ID（平台英文缩写开头 + 小写字母 + 数字，补齐 17 位）
function generateResourceId(platformCode: string, prefix: string): string {
  const base = prefix + platformCode.toLowerCase()
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = base
  
  while (result.length < 17) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result.substring(0, 17)
}

// 解析入参字段
function parseInputFields(inputExample: string): { fieldName: string; description: string }[] {
  const fields: { fieldName: string; description: string }[] = []
  
  if (!inputExample) return fields
  
  try {
    const input = JSON.parse(inputExample)
    if (typeof input === 'object' && !Array.isArray(input)) {
      for (const [key] of Object.entries(input)) {
        fields.push({ fieldName: key, description: '' })
      }
    }
  } catch (e) {
    // 解析失败返回空数组
  }
  
  return fields
}

// 从已配置层级中构建字段名到中文描述的映射
function buildFieldDescriptionMap(): Map<string, string> {
  const descMap = new Map<string, string>()
  
  levels.value.forEach(level => {
    level.fields.forEach(field => {
      // 只记录有中文描述的字段
      if (field.fieldName && field.description) {
        descMap.set(field.fieldName, field.description)
      }
    })
  })
  
  return descMap
}

// 解析输出报文
function parseOutput() {
  // 修复：先检查是否有层级
  if (levels.value.length === 0) {
    ElMessage.warning('请先添加层级')
    return
  }
  
  // ✅ 2. 检查当前层级是否存在（修复：检查 currentLevel 而不是 levels 的其他字段）
  if (!currentLevel.value) {
    ElMessage.warning('请先选择层级')
    return
  }
  
  // ✅ 3. 检查是否填写了输出报文（保留原有逻辑）
  if (!currentLevel.value.outputExample) {
    ElMessage.warning('请先填写输出报文示例')
    return
  }
  
  // ❌ 删除：不要在解析前检查其他层级是否有字段（循环依赖）
  // 原代码：if (!levels.value.some(level => level.fields?.length > 0)) {
  //   ElMessage.warning('请先解析 API 字段')
  //   return
  // }
  
  try {
    const output = JSON.parse(currentLevel.value.outputExample)
    
    let records: any[] = []
    
    if (output.data && output.data.records) {
      records = output.data.records
    } else if (Array.isArray(output.data)) {
      records = output.data
    } else if (output.records && Array.isArray(output.records)) {
      records = output.records
    }
    
    if (records.length === 0) {
      const dataObj = output.data || output
      if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        records = [dataObj]
      }
    }
    
    if (records.length === 0) {
      ElMessage.warning('未找到有效数据')
      return
    }
    
    const firstRecord = records[0]
    const fields: FieldConfig[] = []
    let orderIndex = 1
    
    // 构建已配置字段的描述映射（用于智能填充）
    const descMap = buildFieldDescriptionMap()
    let autoFilledCount = 0
    
    for (const [key] of Object.entries(firstRecord)) {
      // 检查是否在其他层级已配置过该字段的中文描述
      const existingDesc = descMap.get(key)
      
      fields.push({
        fieldName: key,
        description: existingDesc || '',  // 智能预填中文描述
        orderIndex: orderIndex++,
        hideFlag: 0,
        pkFlag: 0,
        pkDisplayFlag: 0
      })
      
      if (existingDesc) {
        autoFilledCount++
      }
    }
    
    // 修复：使用 currentLevel.value 设置字段
    if (currentLevel.value && fields.length > 0) {
      currentLevel.value.fields = fields
      currentLevel.value.fields[0].pkFlag = 1
      currentLevel.value.fields[0].pkDisplayFlag = 1
    }
    // 提示用户有多少字段自动填充了中文描述
    if (autoFilledCount > 0) {
      ElMessage.success(`解析成功，共 ${fields.length} 个字段，${autoFilledCount} 个字段的中文描述已自动填充`)
    } else {
      ElMessage.success(`解析成功，共 ${fields.length} 个字段`)
    }
  } catch (e: any) {
    ElMessage.error('JSON 解析失败：' + e.message)
  }
}

// 添加层级
function addLevel() {
  if (!form.platformType || !form.platformCode || !form.platformName) {
    ElMessage.warning('请先填写平台编码、平台英文缩写和平台名称')
    return
  }
  
  const levelNum = levels.value.length + 1
  const resourceLevel = String(levelNum)
  
  const newLevel: CascadeLevel = {
    resourceLevel,
    resourceName: `资源${levelNum}`,
    apiUrl: '',
    resourceId: generateResourceId(form.platformCode, 'res'),
    apiId: generateResourceId(form.platformCode, 'api'),
    inputExample: '',
    outputExample: '',
    fields: []
  }
  
  levels.value.push(newLevel)
  currentLevelIndex.value = levels.value.length - 1
  
  ElMessage.success(`已添加层级 ${resourceLevel}`)
}

// 删除层级
function deleteLevel(index: number) {
  ElMessageBox.confirm('确定要删除该层级吗？', '提示', {
    type: 'warning'
  }).then(() => {
    levels.value.splice(index, 1)
    if (currentLevelIndex.value >= levels.value.length) {
      currentLevelIndex.value = Math.max(0, levels.value.length - 1)
    }
    ElMessage.success('已删除层级')
  }).catch(() => {})
}

// 上移层级
function moveLevelUp(index: number) {
  if (index === 0) return
  ;[levels.value[index - 1], levels.value[index]] = [levels.value[index], levels.value[index - 1]]
  levels.value.forEach((level, i) => {
    level.resourceLevel = String(i + 1)
  })
  currentLevelIndex.value = index - 1
}

// 下移层级
function moveLevelDown(index: number) {
  if (index === levels.value.length - 1) return
  ;[levels.value[index], levels.value[index + 1]] = [levels.value[index + 1], levels.value[index]]
  levels.value.forEach((level, i) => {
    level.resourceLevel = String(i + 1)
  })
  currentLevelIndex.value = index + 1
}

// 设置主键字段（单选）
function setPkField(fieldName: string) {
  if (!currentLevel.value) return
  currentLevel.value.fields.forEach(f => {
    f.pkFlag = f.fieldName === fieldName ? 1 : 0
  })
}

// 设置展示字段（单选）
function setPkDisplayField(fieldName: string) {
  if (!currentLevel.value) return
  currentLevel.value.fields.forEach(f => {
    f.pkDisplayFlag = f.fieldName === fieldName ? 1 : 0
  })
}

// 验证序号不重复
function validateOrderIndex(index: number) {
  if (!currentLevel.value) return
  const current = currentLevel.value.fields[index]
  const duplicates = currentLevel.value.fields.filter(
    (f, i) => i !== index && f.orderIndex === current.orderIndex
  )
  
  if (duplicates.length > 0) {
    ElMessage.warning('序号不能重复，已自动调整')
    const usedIndexes = currentLevel.value.fields
      .filter((f, i) => i !== index)
      .map(f => f.orderIndex)
    
    let newIndex = 1
    while (usedIndexes.includes(newIndex)) {
      newIndex++
    }
    current.orderIndex = newIndex
  }
}

// 拖拽开始
function handleDragStart(event: DragEvent, row: FieldConfig) {
  draggingRow.value = row
  event.dataTransfer!.effectAllowed = 'move'
}

// 拖拽悬停
function handleDragOver(event: DragEvent, row: FieldConfig) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  dragOverRow.value = row
}

// 拖拽离开
function handleDragLeave() {
  dragOverRow.value = null
}

// 拖拽放置
function handleDrop(event: DragEvent, targetRow: FieldConfig) {
  event.preventDefault()
  if (!currentLevel.value || !draggingRow.value || draggingRow.value === targetRow) {
    dragOverRow.value = null
    return
  }
  
  const fromIndex = currentLevel.value.fields.findIndex(row => row === draggingRow.value)
  const toIndex = currentLevel.value.fields.findIndex(row => row === targetRow)
  
  if (fromIndex === -1 || toIndex === -1) {
    dragOverRow.value = null
    return
  }
  
  const [removed] = currentLevel.value.fields.splice(fromIndex, 1)
  currentLevel.value.fields.splice(toIndex, 0, removed)
  
  currentLevel.value.fields.forEach((row, index) => {
    row.orderIndex = index + 1
  })
  
  draggingRow.value = null
  dragOverRow.value = null
  ElMessage.success('顺序已调整')
}

// 拖拽结束
function handleDragEnd() {
  draggingRow.value = null
  dragOverRow.value = null
}

// 判断是否是拖拽悬停的行
function isDragOverRow(row: FieldConfig) {
  return dragOverRow.value === row && draggingRow.value !== row
}

// 生成 SQL
function generateSQL() {
  if (!form.platformType) {
    ElMessage.warning('请输入平台编码')
    return
  }
  
  if (!form.platformCode) {
    ElMessage.warning('请输入平台英文缩写')
    return
  }
  
  if (!form.platformName) {
    ElMessage.warning('请输入平台名称')
    return
  }
  
  if (levels.value.length === 0) {
    ElMessage.warning('请至少添加一个层级')
    return
  }
  
  // 1. iop_mc_serv_pltf_reso_rln（级联关系）
  let pltfResoSql = `-- 平台与资源关联关系\n`
  levels.value.forEach(level => {
    pltfResoSql += `INSERT INTO iop_mc_serv_pltf_reso_rln (platformtype, resourcelevel, platformname, resourceid, resourcename, description, res1, res2, res3, res4, res5)
VALUES ('${form.platformType}', '${level.resourceLevel}', '${form.platformName}', '${level.resourceId}', '${level.resourceName}', NULL, NULL, NULL, NULL, NULL);
`
  })
  
  // 2. iop_mc_serv_reso_info（资源信息）
  let resoInfoSql = `-- 资源基本信息\n`
  levels.value.forEach(level => {
    resoInfoSql += `INSERT INTO iop_mc_serv_reso_info (resourceid, resourcename, description, resourceapiid, res1, res2, res3, res4, res5)
VALUES ('${level.resourceId}', '${level.resourceName}', NULL, '${level.apiId}', NULL, NULL, NULL, NULL, NULL);
`
  })
  
  // 3. iop_mc_api_info（API 信息）
  let apiInfoSql = `-- API 基本信息\n`
  levels.value.forEach(level => {
    apiInfoSql += `INSERT INTO iop_mc_api_info (apiid, apiname, apiurl, apitype, description, res1, res2, res3, res4, res5)
VALUES ('${level.apiId}', '${level.resourceName}查询接口', '${level.apiUrl || '#'}', 'G', NULL, NULL, NULL, NULL, NULL, NULL);
`
  })
  
  // 4. iop_mc_reso_fld_info（字段配置）
  let fldInfoSql = `-- 资源字段详细信息\n`
  levels.value.forEach(level => {
    level.fields.forEach(field => {
      const description = field.description ? field.description.replace(/'/g, "''") : field.fieldName
      fldInfoSql += `INSERT INTO iop_mc_reso_fld_info (resourceid, fieldname, resourcename, description, orderindex, hideflag, pkflag, pkdisplayflag, res1, res2, res3, res4, res5)
VALUES ('${level.resourceId}', 'str_${form.platformCode}_${field.fieldName.toLowerCase()}', '${level.resourceName}', '${description}', ${field.orderIndex}, ${field.hideFlag}, ${field.pkFlag}, ${field.pkDisplayFlag}, NULL, NULL, NULL, NULL, NULL);
`
    })
  })
  
  // 5. iop_mc_api_parm_rln（参数关联 - 出参）
  let apiParmSql = `-- API 参数关联关系（出参）\n`
  levels.value.forEach(level => {
    level.fields.forEach((field, index) => {
      const fieldName = field.fieldName.toLowerCase()
      apiParmSql += `INSERT INTO iop_mc_api_parm_rln (apiid, parmrlntype, orderindex, parmname, parmalisname, res1, res2, res3, res4, res5)
VALUES ('${level.apiId}', '1', ${index + 1}, 'str_${form.platformCode}_${fieldName}', '${field.fieldName}', NULL, NULL, NULL, NULL, NULL);
`
    })
  })
  
  // 添加入参配置（parmrlntype=0）
  levels.value.forEach(level => {
    const inputFields = parseInputFields(level.inputExample)
    if (inputFields.length > 0) {
      apiParmSql += `\n-- ${level.resourceName} - 入参\n`
      inputFields.forEach((field, index) => {
        const fieldName = field.fieldName.toLowerCase()
        apiParmSql += `INSERT INTO iop_mc_api_parm_rln (apiid, parmrlntype, orderindex, parmname, parmalisname, res1, res2, res3, res4, res5)
VALUES ('${level.apiId}', '0', ${index + 1}, 'str_${form.platformCode}_${fieldName}', '${field.fieldName}', NULL, NULL, NULL, NULL, NULL);
`
      })
    }
  })
  
  // 完整 SQL
  const fullSql = [
    '-- ========================================',
    `-- 级联资源配置 - ${form.platformType}(${form.platformCode})`,
    `-- 平台编码：${form.platformType}`,
    `-- 平台英文缩写：${form.platformCode}`,
    `-- 平台名称：${form.platformName}`,
    `-- 生成时间：${new Date().toLocaleString('zh-CN')}`,
    '-- ========================================\n',
    pltfResoSql,
    resoInfoSql,
    apiInfoSql,
    fldInfoSql,
    apiParmSql
  ].join('\n')
  
  sqlResult.value = {
    pltfReso: pltfResoSql,
    resoInfo: resoInfoSql,
    apiInfo: apiInfoSql,
    fldInfo: fldInfoSql,
    apiParm: apiParmSql,
    full: fullSql
  }
  
  ElMessage.success('SQL 生成成功！')
}

// 重置表单
function resetForm() {
  form.platformType = ''
  form.platformCode = ''
  form.platformName = ''
  levels.value = []
  currentLevelIndex.value = 0
  sqlResult.value = null
}

// 计算属性：是否至少有一个层级解析了字段
const hasParsedFields = computed(() => {
  return levels.value.some(level => level.fields?.length > 0)
})

// 复制 SQL
function copySQL() {
  if (sqlResult.value && sqlResult.value.full) {
    navigator.clipboard.writeText(sqlResult.value.full)
    ElMessage.success('SQL 已复制到剪贴板')
  }
}

// 预览配置接口
interface PreviewLevelConfig {
  level: number
  name: string
  data: Array<{ id: string; name: string }>
  columns: Array<{ field: string; header: string; width: number }>
  disabled: boolean
  loading: boolean
  page: number
  pageSize: number
  total: number
  selectedValue?: string
}

// 预览配置
const previewVisible = ref(false)
const previewLevelConfig = ref<PreviewLevelConfig[]>([])

function handlePreview(index: number = -1) {
  // 如果指定了索引，切换到该层级
  if (index !== -1) {
    currentLevelIndex.value = index
  }
  
  // ✅ 1. 检查是否有层级
  if (levels.value.length === 0) {
    ElMessage.warning('请先添加层级')
    return
  }
  
  // ✅ 2. 检查当前层级是否存在（V3 新增）
  if (!currentLevel.value) {
    ElMessage.warning('请先选择层级')
    return
  }
  
  // ✅ 3. 检查是否有层级解析了字段
  if (!levels.value.some(level => level.fields?.length > 0)) {
    ElMessage.warning('请先解析 API 字段')
    return
  }
  
  // 构建预览配置
  const levelConfig = levels.value.map((level, lvlIndex) => ({
    level: lvlIndex + 1,
    name: level.resourceName,
    data: level.fields.map(f => ({ id: f.fieldName, name: f.description || f.fieldName })),
    columns: [
      { field: 'id', header: '字段名', width: 150 },
      { field: 'name', header: '字段描述', width: 200 }
    ],
    disabled: lvlIndex > currentLevelIndex.value,
    loading: false,
    page: 1,
    pageSize: 20,
    total: 0,
    selectedValue: (lvlIndex === currentLevelIndex.value && level.fields.length > 0) ? level.fields[0].fieldName : undefined
  }))
  
  previewLevelConfig.value = levelConfig
  previewVisible.value = true
}

function handlePreviewClose() {
  previewVisible.value = false
}

// 预览指定层级（供模板调用）
function previewLevel(index: number) {
  handlePreview(index)
}
</script>

<template>
  <div class="cascade-config p-4">
    <el-card class="box-card">
      <template #header>
        <div class="card-header flex justify-between items-center">
          <span class="text-lg font-bold">🔗 级联资源配置</span>
          <el-tag type="info">支持多层级资源配置</el-tag>
        </div>
      </template>

      <!-- 1. 基础配置 -->
      <el-form :model="form" label-width="120px" size="default">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="平台编码" required>
              <el-input 
                v-model="form.platformType" 
                placeholder="如：ZH"
                clearable
                maxlength="2"
                style="text-transform: uppercase;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平台英文缩写" required>
              <el-input 
                v-model="form.platformCode" 
                placeholder="如：zhmc"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平台名称" required>
              <el-input 
                v-model="form.platformName" 
                placeholder="如：中化"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-button type="primary" @click="addLevel" :disabled="!form.platformType || !form.platformCode || !form.platformName">
              ➕ 添加层级
            </el-button>
          </el-col>
        </el-row>
      </el-form>

      <!-- 2. 层级列表 -->
      <div v-if="levels.length > 0" class="mt-4">
        <h3 class="text-lg font-bold mb-4">📊 级联层级列表</h3>
        <el-table 
          :data="levels" 
          border 
          style="width: 100%" 
          highlight-current-row 
          empty-text="暂无层级，请在上方填写平台信息后点击【添加层级】按钮"
          @current-change="(val) => { if(val) currentLevelIndex = levels.findIndex(l => l === val) }"
        >
          <el-table-column label="层级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="currentLevelIndex === levels.findIndex(l => l === row) ? 'primary' : 'info'">
                {{ row.resourceLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="资源名称" min-width="150">
            <template #default="{ row, $index }">
              <el-input v-model="row.resourceName" size="small" placeholder="资源名称" />
            </template>
          </el-table-column>
          <el-table-column label="API URL" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.apiUrl" size="small" placeholder="API 地址" />
            </template>
          </el-table-column>
          <el-table-column label="字段数" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.fields.length > 0 ? 'success' : 'info'" size="small">
                {{ row.fields.length }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center">
            <template #default="{ $index, row }">
              <el-button size="small" @click="moveLevelUp($index)" :disabled="$index === 0">⬆️</el-button>
              <el-button size="small" @click="moveLevelDown($index)" :disabled="$index === levels.length - 1">⬇️</el-button>
              <el-button size="small" type="danger" @click="deleteLevel($index)">🗑️</el-button>
              <el-button v-if="row.fields.length > 0" size="small" @click="previewLevel($index)" type="primary" link>
                👁️ 预览
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-divider v-if="levels.length > 0" />

      <!-- 3. 当前层级配置 -->
      <div v-if="currentLevel" class="mt-4">
        <h3 class="text-lg font-bold mb-4">
          📝 字段配置 - 层级 {{ currentLevel.resourceLevel }} ({{ currentLevel.resourceName }})
        </h3>

        <!-- 输入报文配置 -->
        <div class="mb-4">
          <h4 class="font-bold mb-2">📥 输入报文示例（用于生成入参配置）</h4>
          <el-input
            v-model="currentLevel.inputExample"
            type="textarea"
            :rows="4"
            placeholder='例如：
{
  "datacenterCnName": "测试环境北京",
  "datacenter": "hqx",
  "applicationId": "SDC201608_0203"
}'
          />
        </div>

        <!-- 输出报文配置 -->
        <div class="mb-4">
          <h4 class="font-bold mb-2">📤 输出报文示例</h4>
          <el-input
            v-model="currentLevel.outputExample"
            type="textarea"
            :rows="4"
            placeholder='例如：
{
  "code": 200,
  "data": {
    "records": [...]
  }
}'
          />
        </div>

        <!-- 解析按钮 -->
        <div class="mb-4 flex justify-between items-center">
          <el-button type="primary" @click="parseOutput" :disabled="!currentLevel.outputExample">
            📋 解析 API 字段
          </el-button>
          <el-tag v-if="fieldList.length > 0" type="success" size="small">
            已解析 {{ fieldList.length }} 个字段
          </el-tag>
        </div>
        
        <!-- 字段配置表格 -->
        <el-table 
          :data="fieldList" 
          border 
          style="width: 100%; table-layout: fixed;"
          empty-text="暂无字段，请在上方填写输出报文示例后点击【解析 API 字段】按钮"
        >
          <!-- 拖拽手柄列 -->
          <el-table-column key="drag" width="50" align="center" :resizable="false" fixed />
            <template #header>📍</template>
            <template #default="{ row }">
              <el-icon 
                class="drag-handle" 
                style="cursor: move; color: #909399;"
                :class="{ 'drag-over': isDragOverRow(row) }"
                draggable="true"
                @dragstart="handleDragStart($event, row)"
                @dragover.prevent="handleDragOver($event, row)"
                @dragleave="handleDragLeave"
                @drop.prevent="handleDrop($event, row)"
                @dragend="handleDragEnd"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </el-icon>
            </template>
          </el-table-column>
          
          <!-- 序号列 -->
          <el-table-column label="序号" width="70" align="center" fixed />
          
          <el-table-column prop="fieldName" label="属性名" width="150" fixed />
          
          <el-table-column label="描述" width="200">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="字段中文描述" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          
          <el-table-column label="隐藏" width="60" align="center" />
          
          <el-table-column label="主键" width="60" align="center" />
          
          <el-table-column label="展示" width="60" align="center" />
        </el-table>
      </div>

      <el-divider v-if="levels.length > 0" />

      <!-- 4. 操作按钮 -->
      <div v-if="levels.length > 0" class="mt-4 flex gap-2">
        <el-button type="success" @click="generateSQL" :disabled="!levels.some(l => l.fields.length > 0)">
          ✨ 生成完整 SQL
        </el-button>
        <el-button v-if="hasParsedFields" @click="handlePreview">
          👁️ 预览配置
        </el-button>
        <el-button @click="resetForm">🔄 重置</el-button>
        <el-button @click="copySQL" :disabled="!sqlResult">📋 复制 SQL</el-button>
      </div>

      <!-- 5. SQL 结果 -->
      <div v-if="sqlResult" class="sql-result mt-4">
        <h3 class="text-lg font-bold mb-4">📄 生成的 SQL 脚本</h3>
        <el-tabs type="border-card">
          <el-tab-pane label="级联关系">
            <pre>{{ sqlResult.pltfReso }}</pre>
          </el-tab-pane>
          <el-tab-pane label="资源信息">
            <pre>{{ sqlResult.resoInfo }}</pre>
          </el-tab-pane>
          <el-tab-pane label="API 信息">
            <pre>{{ sqlResult.apiInfo }}</pre>
          </el-tab-pane>
          <el-tab-pane label="字段配置">
            <pre>{{ sqlResult.fldInfo }}</pre>
          </el-tab-pane>
          <el-tab-pane label="参数关联">
            <pre>{{ sqlResult.apiParm }}</pre>
          </el-tab-pane>
          <el-tab-pane label="完整 SQL">
            <pre>{{ sqlResult.full }}</pre>
          </el-tab-pane>
        </el-tabs>

        <el-button type="primary" @click="copySQL" class="mt-4">📋 复制全部 SQL</el-button>
      </div>
    </el-card>
    
    <!-- 预览窗口 -->
    <CascadePreviewModal
      v-model="previewVisible"
      :level-config="previewLevelConfig"
      :config="{ displayField: 'name', valueField: 'id', pageSize: 20 }"
      @close="handlePreviewClose"
    />
  </div>
</template>

/* 114 平台样式调整 - 级联资源配置页面 */
/* 调整清单：TASK-2026-04-08-002 */

<style scoped>
/* 页面整体 */
.cascade-config {
  min-height: calc(100vh - 120px);
  background-color: #F8F9FC;
  padding: 24px;
}

/* 卡片样式 */
.card-header {
  width: 100%;
}

/* 卡片头部样式 */
.card-header .text-lg {
  font-size: 18px;
  font-weight: 600;
  color: #25303C;
}

/* SQL 结果样式 */
.sql-result pre {
  background: #F2F4FB;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #E8E9EB;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  color: #2F2E4B;
}

/* 表格样式 - 覆盖 Element Plus 默认值 */
:deep(.el-table) {
  margin-bottom: 24px;
  --el-table-border-color: #E8E9EB;
  --el-table-header-bg-color: #F3F5FA;
  --el-table-header-text-color: #25303C;
  --el-table-row-hover-bg-color: #F8F9FC;
  --el-table-fixed-box-shadow: 0 0 10px rgba(0, 0, 0, 0.12);
  border: 1px solid #E8E9EB;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #F3F5FA;
  color: #25303C;
  font-weight: 600;
  font-size: 14px;
  height: 48px;
  border-bottom: 1px solid #E8E9EB;
}

:deep(.el-table td) {
  padding: 12px 0;
  border-bottom: 1px solid #E8E9EB;
  color: #2F2E4B;
  font-size: 14px;
}

:deep(.el-table--border) {
  border-right: none;
}

:deep(.el-table--border th) {
  border-right: 1px solid #E8E9EB;
}

:deep(.el-table--border td) {
  border-right: 1px solid #E8E9EB;
}

:deep(.el-table__row) {
  height: 48px;
}

/* 拖拽手柄样式 - 更新颜色为规范值 */
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drag-handle:hover {
  background-color: #F8F9FC;
  color: #3290FF;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle.drag-over {
  background-color: #E6F0FF;
  color: #3290FF;
  transform: scale(1.1);
}

/* 序号样式 */
.order-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #F8F9FC;
  border-radius: 50%;
  font-weight: 600;
  color: #2F2E4B;
  font-size: 14px;
}

/* 拖拽中的行样式 */
:deep(.el-table__row.dragging) {
  opacity: 0.5;
  background-color: #F8F9FC;
}

/* 章节标题样式 */
h3 {
  font-size: 16px;
  font-weight: 600;
  color: #25303C;
  margin: 24px 0 16px 0;
}

h4 {
  font-size: 14px;
  font-weight: 600;
  color: #3B5369;
  margin: 16px 0 12px 0;
}

/* 输入框样式 - 确保高度为 36px */
:deep(.el-input__wrapper) {
  height: 36px;
  border-radius: 4px;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(50, 144, 255, 0.2);
}

/* 输入框错误状态 */
:deep(.el-input.is-error .el-input__wrapper) {
  border-color: #F13039;
}

/* 选择器下拉框 */
:deep(.el-select .el-input__wrapper) {
  height: 36px;
}

:deep(.el-select-dropdown) {
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(154, 172, 193, 0.23);
}

/* 按钮组间距 - 覆盖 Tailwind gap-2 (8px) */
:deep(.flex.gap-2) {
  gap: 16px !important;
}

/* 卡片内边距 */
:deep(.el-card__body) {
  padding: 24px;
}

/* 分隔线 */
:deep(.el-divider) {
  background-color: #E8E9EB;
  margin: 24px 0;
  height: 1px;
}

/* 按钮高度 - 确保标准按钮为 36px */
:deep(.el-button) {
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
}

:deep(.el-button--small) {
  height: 24px;
  padding: 0 12px;
  font-size: 13px;
}

/* 按钮禁用态 */
:deep(.el-button.is-disabled) {
  background-color: #F5F5F5;
  border-color: #E8E9EB;
  color: #A4B4BC;
}

/* ======================================== */
/* 主色 #3290FF - 按钮背景定义（新增）    */
/* ======================================== */
:deep(.el-button--primary) {
  background-color: #3290FF;
  border-color: #3290FF;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* ======================================== */
/* 成功色 #00C771 - Tag/Toast 定义（新增） */
/* ======================================== */
:deep(.el-tag--success) {
  background-color: #F6FFED;
  border-color: #00C771;
  color: #00C771;
}

:deep(.el-message--success) {
  background-color: #F6FFED;
  border-color: #00C771;
}

:deep(.el-alert--success.is-light) {
  background-color: #F6FFED;
  border-color: #00C771;
}

/* ======================================== */
/* 输入框聚焦时的主色边框（新增）          */
/* ======================================== */
:deep(.el-input.is-focus .el-input__wrapper),
:deep(.el-input:focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(50, 144, 255, 0.2);
}

/* ======================================== */
/* 输入框 disabled 状态                   */
/* ======================================== */
:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #F5F5F5;
  border-color: #E8E9EB;
  color: #A4B4BC;
}

/* ======================================== */
/* 按钮 stroked 样式（新增）                */
/* ======================================== */
:deep(.el-button.is-plain) {
  background-color: transparent;
}

:deep(.el-button--primary.is-plain) {
  background-color: transparent;
  border-color: #3290FF;
  color: #3290FF;
}

:deep(.el-button--primary.is-plain:hover) {
  background-color: #F6FFED;
  border-color: #3290FF;
  color: #66b1ff;
}

/* ======================================== */
/* Selected row highlight                 */
/* ======================================== */
:deep(.el-table .el-table__row.current-row) {
  background-color: #F6FFED;
}
</style>
