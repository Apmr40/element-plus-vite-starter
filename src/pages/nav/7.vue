<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
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

// 表单数据
const form = reactive({
  platformType: '',      // 平台类型（2 位大写字母，如 ZH）
  platformName: '',      // 平台名称（小写，如 zhmc）
  apiUrl: '',
  inputExample: '',
  outputExample: ''
})

// 字段列表
const fieldList = ref<FieldConfig[]>([])
const pkField = ref('')
const pkDisplayField = ref('')
const tableRef = ref<InstanceType<typeof ElTable>>()

// SQL 结果
interface SqlResult {
  resoInfo: string
  fldInfo: string
  apiInfo: string
  apiParm: string
  full: string
}
const sqlResult = ref<SqlResult | null>(null)

// 拖拽相关
const draggingRow = ref<any>(null)
const dragOverRow = ref<any>(null)

// 生成唯一 ID（旧方法，保留兼容）
function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `${prefix}${timestamp}${random}`.toUpperCase()
}

// 生成 17 位资源 ID（平台名称开头 + 小写字母 + 数字，补齐 17 位）
function generateResourceId(platformName: string, prefix: string): string {
  const base = prefix + platformName.toLowerCase()
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = base
  
  // 补齐到 17 位
  while (result.length < 17) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // 如果超过 17 位，截断（平台名太长的情况）
  return result.substring(0, 17)
}

// 解析入参字段
function parseInputFields(): { fieldName: string; description: string }[] {
  const fields: { fieldName: string; description: string }[] = []
  
  if (!form.inputExample) {
    return fields
  }
  
  try {
    const input = JSON.parse(form.inputExample)
    if (typeof input === 'object' && !Array.isArray(input)) {
      for (const [key, value] of Object.entries(input)) {
        fields.push({
          fieldName: key,
          description: ''
        })
      }
    }
  } catch (e) {
    // 解析失败则返回空数组
  }
  
  return fields
}

// 拖拽开始
function handleDragStart(event: DragEvent, row: FieldConfig) {
  draggingRow.value = row
  event.dataTransfer!.effectAllowed = 'move'
  // 设置拖拽透明度
  setTimeout(() => {
    const target = event.target as HTMLElement
    if (target) {
      target.closest('.el-table__row')?.classList.add('dragging')
    }
  }, 0)
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
  if (!draggingRow.value || draggingRow.value === targetRow) {
    dragOverRow.value = null
    return
  }
  
  const fromIndex = fieldList.value.findIndex(row => row === draggingRow.value)
  const toIndex = fieldList.value.findIndex(row => row === targetRow)
  
  if (fromIndex === -1 || toIndex === -1) {
    dragOverRow.value = null
    return
  }
  
  // 移动数组元素
  const [removed] = fieldList.value.splice(fromIndex, 1)
  fieldList.value.splice(toIndex, 0, removed)
  
  // 重新计算序号
  fieldList.value.forEach((row, index) => {
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

// 解析输出报文
function parseOutput() {
  try {
    const output = JSON.parse(form.outputExample)
    
    // 查找 records 数组，兼容三种格式：
    // 格式 1: { code, message, data: { records: [...] } }
    // 格式 2: { code, message, data: [...], total, size, current, pages }
    // 格式 3: { code, message, records: [...], total, size, current, pages }
    let records: any[] = []
    
    if (output.data && output.data.records) {
      // 格式 1: data 是对象，包含 records 数组
      records = output.data.records
    } else if (Array.isArray(output.data)) {
      // 格式 2: data 直接是数组
      records = output.data
    } else if (output.records && Array.isArray(output.records)) {
      // 格式 3: records 在根级别
      records = output.records
    }
    
    if (records.length === 0) {
      // 如果没有 records，尝试从 data 对象中提取字段
      const dataObj = output.data || output
      if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        const firstRecord = dataObj
        records = [firstRecord]
      }
    }
    
    if (records.length === 0) {
      ElMessage.warning('未找到 records 数组或有效数据')
      return
    }
    
    // 提取字段
    const firstRecord = records[0]
    const fields: FieldConfig[] = []
    let orderIndex = 1
    
    for (const [key, value] of Object.entries(firstRecord)) {
      fields.push({
        fieldName: key,
        description: '',
        orderIndex: orderIndex++,
        hideFlag: 0,
        pkFlag: 0,
        pkDisplayFlag: 0
      })
    }
    
    fieldList.value = fields
    
    // 默认第一个字段为主键
    if (fields.length > 0) {
      pkField.value = fields[0].fieldName
      pkDisplayField.value = fields[0].fieldName
      fields[0].pkFlag = 1
      fields[0].pkDisplayFlag = 1
    }
    
    ElMessage.success(`解析成功，共 ${fields.length} 个字段`)
  } catch (e: any) {
    ElMessage.error('JSON 解析失败：' + e.message)
  }
}

// 验证序号不重复
function validateOrderIndex(index: number) {
  const current = fieldList.value[index]
  const duplicates = fieldList.value.filter(
    (f, i) => i !== index && f.orderIndex === current.orderIndex
  )
  
  if (duplicates.length > 0) {
    ElMessage.warning('序号不能重复，已自动调整')
    // 自动调整为不重复的值
    const usedIndexes = fieldList.value
      .filter((f, i) => i !== index)
      .map(f => f.orderIndex)
    
    let newIndex = 1
    while (usedIndexes.includes(newIndex)) {
      newIndex++
    }
    current.orderIndex = newIndex
  }
}

// 设置主键字段
function setPkField(fieldName: string) {
  fieldList.value.forEach(f => {
    f.pkFlag = f.fieldName === fieldName ? 1 : 0
  })
}

// 设置主键展示字段
function setPkDisplayField(fieldName: string) {
  fieldList.value.forEach(f => {
    f.pkDisplayFlag = f.fieldName === fieldName ? 1 : 0
  })
}

// 生成 SQL
function generateSQL() {
  if (!form.platformType) {
    ElMessage.warning('请输入平台类型')
    return
  }
  
  if (!form.platformName) {
    ElMessage.warning('请输入平台名称')
    return
  }
  
  if (!form.apiUrl) {
    ElMessage.warning('请输入 API URL')
    return
  }
  
  if (fieldList.value.length === 0) {
    ElMessage.warning('请先解析输出报文')
    return
  }
  
  // 生成 17 位 ID（平台名称开头 + 小写字母 + 数字）
  const apiId = generateResourceId(form.platformName, 'api')
  const resourceId = generateResourceId(form.platformName, 'res')
  
  // 1. iop_mc_api_info（枚举所有字段，空值用 NULL）
  const apiInfoSql = `-- API 基本信息
INSERT INTO iop_mc_api_info (apiid, apiname, apiurl, apitype, description, res1, res2, res3, res4, res5)
VALUES ('${apiId}', '${form.platformName}查询接口', '${form.apiUrl}', 'G', '自动生成的 API 配置', NULL, NULL, NULL, NULL, NULL);
`
  
  // 2. iop_mc_serv_reso_info（枚举所有字段）
  const resoInfoSql = `-- 资源基本信息
INSERT INTO iop_mc_serv_reso_info (resourceid, resourcename, description, resourceapiid, res1, res2, res3, res4, res5)
VALUES ('${resourceId}', '${form.platformName}资源', '自动生成的资源', '${apiId}', NULL, NULL, NULL, NULL, NULL);
`
  
  // 3. iop_mc_reso_fld_info（枚举所有字段，orderindex 不补 0）
  let fldInfoSql = `-- 资源字段详细信息\n`
  fieldList.value.forEach(field => {
    const description = field.description ? field.description.replace(/'/g, "''") : field.fieldName
    fldInfoSql += `INSERT INTO iop_mc_reso_fld_info (resourceid, fieldname, resourcename, description, orderindex, hideflag, pkflag, pkdisplayflag, res1, res2, res3, res4, res5)
VALUES ('${resourceId}', 'str_${form.platformName}_${field.fieldName.toLowerCase()}', '${form.platformName}资源', '${description}', ${field.orderIndex}, ${field.hideFlag}, ${field.pkFlag}, ${field.pkDisplayFlag}, NULL, NULL, NULL, NULL, NULL);
`
  })
  
  // 4. iop_mc_api_parm_rln（出参 + 入参，枚举所有字段，orderindex 不补 0）
  let apiParmSql = `-- API 参数关联关系（出参）\n`
  fieldList.value.forEach((field, index) => {
    const fieldName = field.fieldName.toLowerCase()
    apiParmSql += `INSERT INTO iop_mc_api_parm_rln (apiid, parmrlntype, orderindex, parmname, parmalisname, res1, res2, res3, res4, res5)
VALUES ('${apiId}', '1', ${index + 1}, 'str_${form.platformName}_${fieldName}', '${field.fieldName}', NULL, NULL, NULL, NULL, NULL);
`
  })
  
  // 添加入参配置（parmrlntype=0）
  const inputFields = parseInputFields()
  if (inputFields.length > 0) {
    apiParmSql += `\n-- API 参数关联关系（入参）\n`
    inputFields.forEach((field, index) => {
      const fieldName = field.fieldName.toLowerCase()
      apiParmSql += `INSERT INTO iop_mc_api_parm_rln (apiid, parmrlntype, orderindex, parmname, parmalisname, res1, res2, res3, res4, res5)
VALUES ('${apiId}', '0', ${index + 1}, 'str_${form.platformName}_${fieldName}', '${field.fieldName}', NULL, NULL, NULL, NULL, NULL);
`
    })
  }
  
  // 5. iop_mc_serv_pltf_reso_rln（枚举所有字段）
  const pltfResoSql = `-- 平台与资源关联关系
INSERT INTO iop_mc_serv_pltf_reso_rln (platformtype, resourcelevel, platformname, resourceid, resourcename, description, res1, res2, res3, res4, res5)
VALUES ('${form.platformType}', '01', '${form.platformName}', '${resourceId}', '${form.platformName}资源', NULL, NULL, NULL, NULL, NULL);
`
  
  // 完整 SQL
  const fullSql = [
    '-- ========================================',
    `-- API 表单生成器 - ${form.platformName}`,
    `-- 生成时间：${new Date().toLocaleString('zh-CN')}`,
    '-- ========================================\n',
    apiInfoSql,
    resoInfoSql,
    fldInfoSql,
    apiParmSql,
    pltfResoSql
  ].join('\n')
  
  sqlResult.value = {
    apiInfo: apiInfoSql,
    resoInfo: resoInfoSql,
    fldInfo: fldInfoSql,
    apiParm: apiParmSql,
    full: fullSql
  }
  
  ElMessage.success('SQL 生成成功！')
}

// 重置表单
function resetForm() {
  form.platformType = ''
  form.platformName = ''
  form.apiUrl = ''
  form.inputExample = ''
  form.outputExample = ''
  fieldList.value = []
  pkField.value = ''
  pkDisplayField.value = ''
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
  <div class="api-form-generator p-4">
    <el-card class="box-card">
      <template #header>
        <div class="card-header flex justify-between items-center">
          <span class="text-lg font-bold">🔧 API 表单生成器</span>
        </div>
      </template>

      <!-- 1. 基础配置区域 -->
      <el-form :model="form" label-width="120px" size="default">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="平台类型" required>
              <el-input 
                v-model="form.platformType" 
                placeholder="如：ZH（2 位大写字母）"
                clearable
                maxlength="2"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平台名称" required>
              <el-input 
                v-model="form.platformName" 
                placeholder="如：zhmc（小写）"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="API URL" required>
              <el-input 
                v-model="form.apiUrl" 
                placeholder="查询接口 URL"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="输入报文示例">
              <el-input
                v-model="form.inputExample"
                type="textarea"
                :rows="6"
                placeholder='例如：
{
  "username": "李四",
  "email": "lisi@example.com"
}'
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="输出报文示例">
              <el-input
                v-model="form.outputExample"
                type="textarea"
                :rows="6"
                placeholder='例如：
{
  "code": 200,
  "data": {
    "records": [...]
  }
}'
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="parseOutput">
            📋 解析输出报文
          </el-button>
          <el-button @click="resetForm">🔄 重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <!-- 2. 字段配置表格 -->
      <div v-if="fieldList.length > 0">
        <h3 class="text-lg font-bold mb-4">📝 字段配置</h3>
        <el-table 
          ref="tableRef"
          :data="fieldList" 
          border 
          style="width: 100%"
        >
          <!-- 拖拽手柄列 -->
          <el-table-column key="drag" width="50" align="center" :resizable="false">
            <template #header>
              <span>📍</span>
            </template>
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
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ row }">
              <span class="order-index">{{ row.orderIndex }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="fieldName" label="属性名" min-width="120" />
          
          <el-table-column label="描述 (description)" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="字段中文描述" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          
          <el-table-column label="是否隐藏" width="80" align="center">
            <template #default="{ row }">
              <el-checkbox 
                v-model="row.hideFlag" 
                :true-value="1" 
                :false-value="0"
                size="large"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="主键" width="70" align="center">
            <template #default="{ row }">
              <el-checkbox 
                :model-value="row.pkFlag === 1"
                @change="setPkField(row.fieldName)"
                size="large"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="主键展示" width="80" align="center">
            <template #default="{ row }">
              <el-checkbox 
                :model-value="row.pkDisplayFlag === 1"
                @change="setPkDisplayField(row.fieldName)"
                size="large"
              />
            </template>
          </el-table-column>
        </el-table>

        <el-divider />

        <!-- 3. 平台名称配置 -->
        <el-form label-width="120px">
          <el-form-item label="平台名称">
            <el-input 
              v-model="form.platformName" 
              placeholder="用于拼接 parmname，如：zhmc"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button type="success" @click="generateSQL">
              ✨ 生成 SQL 脚本
            </el-button>
            <el-button @click="resetForm">🔄 重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 4. 生成的 SQL 结果 -->
      <div v-if="sqlResult" class="sql-result mt-4">
        <h3 class="text-lg font-bold mb-4">📄 生成的 SQL 脚本</h3>
        <el-tabs type="border-card">
          <el-tab-pane label="iop_mc_serv_reso_info">
            <pre>{{ sqlResult.resoInfo }}</pre>
          </el-tab-pane>
          <el-tab-pane label="iop_mc_reso_fld_info">
            <pre>{{ sqlResult.fldInfo }}</pre>
          </el-tab-pane>
          <el-tab-pane label="iop_mc_api_info">
            <pre>{{ sqlResult.apiInfo }}</pre>
          </el-tab-pane>
          <el-tab-pane label="iop_mc_api_parm_rln">
            <pre>{{ sqlResult.apiParm }}</pre>
          </el-tab-pane>
          <el-tab-pane label="完整 SQL">
            <pre>{{ sqlResult.full }}</pre>
          </el-tab-pane>
        </el-tabs>

        <el-button type="primary" @click="copySQL" class="mt-4">
          📋 复制全部 SQL
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.api-form-generator {
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

:deep(.el-input-number) {
  width: 100px;
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
