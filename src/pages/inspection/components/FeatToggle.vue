<!-- 功能开关组件 -->
<template>
  <div class="feat-toggle">
    <!-- 统计数据 -->
    <div class="stats-section">
      <el-statistic title="启用用户数" :value="stats.enabledUsers" />
      <el-statistic title="使用次数" :value="stats.usageCount" />
      <el-statistic title="成功率" :value="stats.successRate" suffix="/" />
    </div>

    <!-- 开关配置 -->
    <div class="toggle-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>功能开关</span>
          </div>
        </template>
        <div class="toggle-item">
          <div class="toggle-label">灰度管控功能</div>
          <el-switch
            v-model="grayToggle"
            active-text="开启"
            inactive-text="关闭"
            @change="handleToggleChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 白名单配置 -->
    <div class="whitelist-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>白名单配置</span>
          </div>
        </template>

        <!-- 用户白名单 -->
        <div class="whitelist subsection">
          <div class="subsection-header">
            <span>用户白名单</span>
            <el-button size="small" type="primary" @click="addUser">
              <el-icon><Plus /></el-icon>
              添加用户
            </el-button>
          </div>
          <el-table
            :data="userWhitelist"
            style="width: 100%"
            size="small"
          >
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column prop="department" label="部门" width="120" />
            <el-table-column prop="role" label="角色" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="removeUser(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 部门白名单 -->
        <div class="whitelist subsection">
          <div class="subsection-header">
            <span>部门白名单</span>
            <el-button size="small" type="primary" @click="addDepartment">
              <el-icon><Plus /></el-icon>
              添加部门
            </el-button>
          </div>
          <el-table
            :data="deptWhitelist"
            style="width: 100%"
            size="small"
          >
            <el-table-column prop="name" label="部门名称" width="150" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="removeDepartment(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 角色白名单 -->
        <div class="whitelist subsection">
          <div class="subsection-header">
            <span>角色白名单</span>
            <el-button size="small" type="primary" @click="addRole">
              <el-icon><Plus /></el-icon>
              添加角色
            </el-button>
          </div>
          <el-table
            :data="roleWhitelist"
            style="width: 100%"
            size="small"
          >
            <el-table-column prop="name" label="角色名称" width="150" />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="removeRole(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saveLoading">
            保存配置
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

// 类型定义
interface User {
  id: string
  name: string
  email: string
  department: string
  role: string
}

interface Department {
  id: string
  name: string
  enabled: boolean
}

interface Role {
  id: string
  name: string
  enabled: boolean
}

// 统计数据
const stats = reactive({
  enabledUsers: 45,
  usageCount: 128,
  successRate: 96.2,
})

// 白名单数据
const userWhitelist = ref<User[]>([
  { id: 'u1', name: '张三', email: 'zhangsan@example.com', department: '技术部', role: '管理员' },
  { id: 'u2', name: '李四', email: 'lisi@example.com', department: '运维部', role: '运维人员' },
  { id: 'u3', name: '王五', email: 'wangwu@example.com', department: '安全部', role: '安全官' },
])

const deptWhitelist = ref<Department[]>([
  { id: 'd1', name: '技术部', enabled: true },
  { id: 'd2', name: '运维部', enabled: true },
  { id: 'd3', name: '安全部', enabled: true },
])

const roleWhitelist = ref<Role[]>([
  { id: 'r1', name: '管理员', enabled: true },
  { id: 'r2', name: '运维人员', enabled: true },
  { id: 'r3', name: '安全官', enabled: true },
])

const grayToggle = ref(true)

// 加载状态
const whitelistLoading = ref(false)
const saveLoading = ref(false)

// Methods
const handleToggleChange = (value: boolean) => {
  ElMessage.success(`功能已${value ? '开启' : '关闭'}`)
}

const addUser = () => {
  ElMessage.info('添加用户功能开发中...')
}

const removeUser = (row: User) => {
  const index = userWhitelist.value.findIndex(u => u.email === row.email)
  if (index > -1) {
    userWhitelist.value.splice(index, 1)
    ElMessage.success('用户已移除')
  }
}

const addDepartment = () => {
  ElMessage.info('添加部门功能开发中...')
}

const removeDepartment = (row: any) => {
  const index = deptWhitelist.value.findIndex(d => d.name === row.name)
  if (index > -1) {
    deptWhitelist.value.splice(index, 1)
    ElMessage.success('部门已移除')
  }
}

const addRole = () => {
  ElMessage.info('添加角色功能开发中...')
}

const removeRole = (row: any) => {
  const index = roleWhitelist.value.findIndex(r => r.name === row.name)
  if (index > -1) {
    roleWhitelist.value.splice(index, 1)
    ElMessage.success('角色已移除')
  }
}

// Emits
const emit = defineEmits<{
  'save-success': []
  'cancel': []
}>()

const handleSave = () => {
  saveLoading.value = true
  
  // 模拟保存
  setTimeout(() => {
    saveLoading.value = false
    ElMessage.success('配置已保存')
    emit('save-success')
  }, 1000)
}

const handleCancel = () => {
  ElMessage.info('取消保存')
  emit('cancel')
}

// Lifecycle
onMounted(() => {
  // 加载配置
  loadConfig()
})

const loadConfig = async () => {
  whitelistLoading.value = true
  // 模拟加载
  await new Promise(resolve => setTimeout(resolve, 500))
  whitelistLoading.value = false
}
</script>

<style lang="scss" scoped>
.feat-toggle {
  padding: 16px;

  .stats-section {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
  }

  .toggle-section {
    margin-bottom: 24px;
  }

  .whitelist-section {
    .card-header {
      font-weight: 600;
    }

    .whitelist {
      margin-bottom: 24px;

      &.subsection {
        &-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e8e9eb;
  }
}
</style>
