<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

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
  apiUrl: '',
  inputExample: '',
  outputExample: '',
  platformName: ''
})

// 字段列表
const fieldList = ref<FieldConfig[]>([])
const pkField = ref('')
const pkDisplayField = ref('')

// SQL 结果
interface SqlResult {
  resoInfo: string
  fldInfo: string
  apiInfo: string
  apiParm: string
  full: string
}
const sqlResult = ref<SqlResult | null>(null)

// 生成唯一 ID
function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `${prefix}${timestamp}${random}`.toUpperCase()
}

// 解析输出报文
function parseOutput() {
  try {
    const output = JSON.parse(form.outputExample)
    
    // 查找 records 数组
    let records: any[] = []
    if (output.data && output.data.records) {
      records = output.data.records
    } else if (output.records) {
      records = output.records
    } else if (Array.isArray(output.data)) {
      records = output.data
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
  if (!form.apiUrl) {
    ElMessage.warning('请输入 API URL')
    return
  }
  
  if (!form.platformName) {
    ElMessage.warning('请输入平台名称')
    return
  }
  
  if (fieldList.value.length === 0) {
    ElMessage.warning('请先解析输出报文')
    return
  }
  
  const apiId = generateId('API')
  const resourceId = generateId('RES')
  const platformType = form.platformName.toUpperCase()
  
  // 1. iop_mc_api_info
  const apiInfoSql = `-- API 基本信息
INSERT INTO iop_mc_api_info (apiid, apiname, apiurl, apitype, description)
VALUES ('${apiId}', '${form.platformName}查询接口', '${form.apiUrl}', 'G', '自动生成的 API 配置');
`
  
  // 2. iop_mc_serv_reso_info
  const resoInfoSql = `-- 资源基本信息
INSERT INTO iop_mc_serv_reso_info (resourceid, resourcename, resourceapiid)
VALUES ('${resourceId}', '${form.platformName}资源', '${apiId}');
`
  
  // 3. iop_mc_reso_fld_info
  let fldInfoSql = `-- 资源字段详细信息\n`
  fieldList.value.forEach(field => {
    fldInfoSql += `INSERT INTO iop_mc_reso_fld_info (resourceid, fieldname, resourcename, description, orderindex, hideflag, pkflag, pkdisplayflag)
VALUES ('${resourceId}', 'str_${form.platformName}_${field.fieldName.toLowerCase()}', '${form.platformName}资源', '${field.description || field.fieldName}', '${String(field.orderIndex).padStart(2, '0')}', '${field.hideFlag}', '${field.pkFlag}', '${field.pkDisplayFlag}');
`
  })
  
  // 4. iop_mc_api_parm_rln (出参)
  let apiParmSql = `-- API 参数关联关系（出参）\n`
  fieldList.value.forEach((field, index) => {
    apiParmSql += `INSERT INTO iop_mc_api_parm_rln (apiid, parmrlntype, orderindex, parmname, parmalisname)
VALUES ('${apiId}', '1', '${String(index + 1).padStart(2, '0')}', 'str_${form.platformName}_${field.fieldName.toLowerCase()}', '${field.fieldName}');
`
  })
  
  // 5. iop_mc_serv_pltf_reso_rln (级联关系)
  const pltfResoSql = `-- 平台与资源关联关系
INSERT INTO iop_mc_serv_pltf_reso_rln (platformtype, resourcelevel, platformname, resourceid, resourcename)
VALUES ('${platformType}', '01', '${form.platformName}', '${resourceId}', '${form.platformName}资源');
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
  form.apiUrl = ''
  form.inputExample = ''
  form.outputExample = ''
  form.platformName = ''
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
        <el-form-item label="API URL">
          <el-input 
            v-model="form.apiUrl" 
            placeholder="请输入 Spring Boot HTTP 查询接口 URL"
            clearable
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="输入报文示例">
              <el-input
                v-model="form.inputExample"
                type="textarea"
                :rows="8"
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
                :rows="8"
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
        </el-form-item>
      </el-form>

      <el-divider />

      <!-- 2. 字段配置表格 -->
      <div v-if="fieldList.length > 0">
        <h3 class="text-lg font-bold mb-4">📝 字段配置</h3>
        <el-table :data="fieldList" border style="width: 100%">
          <el-table-column prop="fieldName" label="属性名" width="180" />
          
          <el-table-column label="描述 (description)" width="200">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="字段中文描述" />
            </template>
          </el-table-column>
          
          <el-table-column label="序号 (orderindex)" width="120">
            <template #default="{ row, $index }">
              <el-input-number 
                v-model="row.orderIndex" 
                :min="1" 
                :max="99"
                @change="validateOrderIndex($index)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="是否隐藏 (hideflag)" width="120">
            <template #default="{ row }">
              <el-checkbox v-model="row.hideFlag" :true-value="1" :false-value="0" />
            </template>
          </el-table-column>
          
          <el-table-column label="主键 (pkflag)" width="100">
            <template #default="{ row }">
              <el-radio 
                v-model="pkField" 
                :label="row.fieldName"
                @change="setPkField(row.fieldName)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="主键展示 (pkdisplayflag)" width="140">
            <template #default="{ row }">
              <el-radio 
                v-model="pkDisplayField" 
                :label="row.fieldName"
                @change="setPkDisplayField(row.fieldName)"
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

:deep(.el-table) {
  margin-bottom: 20px;
}

:deep(.el-input-number) {
  width: 100px;
}
</style>
