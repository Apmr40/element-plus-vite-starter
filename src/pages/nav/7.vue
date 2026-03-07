<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'

// 定义资源配置的类型
interface ConfigItem {
  id: number
  name: string
  type: string
  status: string
  description: string
  createdAt: string
}

// 表格数据
const configData = ref<ConfigItem[]>([
  { id: 1, name: '配置项 A', type: '数据库', status: '启用', description: '主数据库配置', createdAt: '2026-03-01' },
  { id: 2, name: '配置项 B', type: '缓存', status: '启用', description: 'Redis 缓存配置', createdAt: '2026-03-02' },
  { id: 3, name: '配置项 C', type: '消息队列', status: '禁用', description: 'Kafka 配置', createdAt: '2026-03-03' },
])

// 对话框控制
const dialogVisible = ref(false)
const editMode = ref(false)
const currentForm = reactive<ConfigItem>({
  id: 0,
  name: '',
  type: '',
  status: '启用',
  description: '',
  createdAt: '',
})

// 表单规则
const formRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
}

// 打开新增对话框
function handleAdd() {
  editMode.value = false
  Object.assign(currentForm, { id: 0, name: '', type: '', status: '启用', description: '', createdAt: '' })
  dialogVisible.value = true
}

// 打开编辑对话框
function handleEdit(row: ConfigItem) {
  editMode.value = true
  Object.assign(currentForm, row)
  dialogVisible.value = true
}

// 删除确认
function handleDelete(row: ConfigItem) {
  ElMessageBox.confirm(`确定要删除配置 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    configData.value = configData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 提交表单
function handleSubmit() {
  if (editMode.value) {
    const index = configData.value.findIndex(item => item.id === currentForm.id)
    if (index !== -1) {
      configData.value[index] = { ...currentForm }
    }
    ElMessage.success('更新成功')
  } else {
    const newId = Math.max(...configData.value.map(item => item.id), 0) + 1
    configData.value.push({
      ...currentForm,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    })
    ElMessage.success('添加成功')
  }
  dialogVisible.value = false
}
</script>

<template>
  <div class="config-container p-4">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">操作资源配置</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增配置
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="mb-4">
      <el-form :inline="true">
        <el-form-item label="配置名称">
          <el-input placeholder="请输入配置名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="配置类型">
          <el-select placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="数据库" value="数据库" />
            <el-option label="缓存" value="缓存" />
            <el-option label="消息队列" value="消息队列" />
            <el-option label="API" value="API" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" value="启用" />
            <el-option label="禁用" value="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary">查询</el-button>
          <el-button>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table :data="configData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="配置名称" min-width="150" />
        <el-table-column prop="type" label="配置类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === '数据库' ? 'primary' : row.type === '缓存' ? 'success' : 'warning'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="createdAt" label="创建时间" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="1"
          v-model:page-size="10"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="configData.length"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editMode ? '编辑配置' : '新增配置'"
      width="500px"
    >
      <el-form :model="currentForm" :rules="formRules" label-width="100px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="currentForm.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置类型" prop="type">
          <el-select v-model="currentForm.type" placeholder="请选择配置类型" style="width: 100%">
            <el-option label="数据库" value="数据库" />
            <el-option label="缓存" value="缓存" />
            <el-option label="消息队列" value="消息队列" />
            <el-option label="API" value="API" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="currentForm.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="currentForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入配置描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.config-container {
  min-height: calc(100vh - 120px);
}
</style>
