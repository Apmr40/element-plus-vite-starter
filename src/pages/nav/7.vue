<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ElTable } from 'element-plus'

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
  resourceLevel: string      // '01', '02', '03'
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

// 解析输出报文
function parseOutput() {
  if (!currentLevel.value) {
    ElMessage.warning('请先添加层级')
    return
  }
  
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
    
    for (const [key] of Object.entries(firstRecord)) {
      fields.push({
        fieldName: key,
        description: '',
        orderIndex: orderIndex++,
        hideFlag: 0,
        pkFlag: 0,
        pkDisplayFlag: 0
      })
    }
    
    currentLevel.value.fields = fields
    
    if (fields.length > 0) {
      fields[0].pkFlag = 1
      fields[0].pkDisplayFlag = 1
    }
    
    ElMessage.success(`解析成功，共 ${fields.length} 个字段`)
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
  const resourceLevel = String(levelNum).padStart(2, '0')
  
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
    level.resourceLevel = String(i + 1).padStart(2, '0')
  })
  currentLevelIndex.value = index - 1
}

// 下移层级
function moveLevelDown(index: number) {
  if (index === levels.value.length - 1) return
  ;[levels.value[index], levels.value[index + 1]] = [levels.value[index + 1], levels.value[index]]
  levels.value.forEach((level, i) => {
    level.resourceLevel = String(i + 1).padStart(2, '0')
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

// 复制 SQL
function copySQL() {
  if (sqlResult.value && sqlResult.value.full) {
    navigator.clipboard.writeText(sqlResult.value.full)
    ElMessage.success('SQL 已复制到剪贴板')
  }
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
        <el-table :data="levels" border style="width: 100%" highlight-current-row @current-change="(val) => { if(val) currentLevelIndex = levels.findIndex(l => l === val) }">
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
              {{ row.fields.length }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ $index }">
              <el-button size="small" @click="moveLevelUp($index)" :disabled="$index === 0">⬆️</el-button>
              <el-button size="small" @click="moveLevelDown($index)" :disabled="$index === levels.length - 1">⬇️</el-button>
              <el-button size="small" type="danger" @click="deleteLevel($index)">🗑️</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-divider v-if="levels.length > 0" />

      <!-- 3. 当前层级字段配置 -->
      <div v-if="currentLevel" class="mt-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">
            📝 字段配置 - 层级 {{ currentLevel.resourceLevel }} ({{ currentLevel.resourceName }})
          </h3>
          <el-button type="primary" size="small" @click="parseOutput">📋 解析 API 字段</el-button>
        </div>
        
        <el-table :data="fieldList" border style="width: 100%">
          <!-- 拖拽手柄列 -->
          <el-table-column key="drag" width="50" align="center" :resizable="false">
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
          <el-table-column label="序号" width="70" align="center">
            <template #default="{ row }">
              <span class="order-index">{{ row.orderIndex }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="fieldName" label="属性名" min-width="120" />
          
          <el-table-column label="描述" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="字段中文描述" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          
          <el-table-column label="隐藏" width="60" align="center">
            <template #default="{ row }">
              <el-checkbox v-model="row.hideFlag" :true-value="1" :false-value="0" />
            </template>
          </el-table-column>
          
          <el-table-column label="主键" width="60" align="center">
            <template #default="{ row }">
              <el-radio 
                :model-value="currentLevel?.fields.find(f => f.pkFlag === 1)?.fieldName || ''"
                :label="row.fieldName"
                name="pkField"
                @change="setPkField(row.fieldName)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="展示" width="60" align="center">
            <template #default="{ row }">
              <el-radio 
                :model-value="currentLevel?.fields.find(f => f.pkDisplayFlag === 1)?.fieldName || ''"
                :label="row.fieldName"
                name="pkDisplayField"
                @change="setPkDisplayField(row.fieldName)"
              />
            </template>
          </el-table-column>
        </el-table>

        <!-- 输入报文配置 -->
        <div class="mt-4">
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
        <div class="mt-4">
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
      </div>

      <el-divider v-if="levels.length > 0" />

      <!-- 4. 操作按钮 -->
      <div v-if="levels.length > 0" class="mt-4">
        <el-button type="success" @click="generateSQL">✨ 生成完整 SQL</el-button>
        <el-button @click="resetForm">🔄 重置</el-button>
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
  </div>
</template>

<style scoped>
.cascade-config {
  min-height: calc(100vh - 120px);
}

.card-header {
  width: 100%;
}

.sql-result pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
}

/* 表格边框样式 */
:deep(.el-table) {
  margin-bottom: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  border-bottom: 1px solid #dcdfe6;
}

:deep(.el-table td) {
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table--border) {
  border-right: none;
}

:deep(.el-table--border th) {
  border-right: 1px solid #dcdfe6;
}

:deep(.el-table--border td) {
  border-right: 1px solid #ebeef5;
}

/* 拖拽手柄样式 */
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drag-handle:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle.drag-over {
  background-color: #ecf5ff;
  color: #409eff;
  transform: scale(1.1);
}

/* 序号样式 */
.order-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #f5f7fa;
  border-radius: 50%;
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

/* 拖拽中的行样式 */
:deep(.el-table__row.dragging) {
  opacity: 0.5;
  background-color: #f5f7fa;
}
</style>
