<!-- 应用配置巡检系统 - 权限后台页（角色管理） -->
<template>
  <div class="system-admin-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>系统管理 - 角色管理</h2>
      <el-button type="primary" @click="handleAddRole">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <!-- 角色列表 -->
    <div class="role-list-section">
      <!-- 预置角色 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-title">
            <el-icon><Trophy /></el-icon>
            预置角色（不可删除）
          </div>
        </template>

        <el-card v-for="role in predefinRoles" :key="role.id" class="role-card" shadow="hover">
          <template #header>
            <div class="role-card-header">
              <el-icon :size="24" :color="getRoleIconColor(role.type)">{{ getRoleIcon(role.type) }}</el-icon>
              <div class="role-name">{{ role.name }}</div>
            </div>
          </template>

          <div class="role-description">{{ role.description }}</div>

          <div class="role-actions">
            <el-button size="small" type="primary" @click="handleViewPermissions(role)">
              查看权限
            </el-button>
            <template v-if="role.type !== 'superadmin'">
              <el-button size="small" @click="handleEditPermissions(role)">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDeleteRole(role)" :disabled="role.type === 'superadmin'">
                删除
              </el-button>
            </template>
          </div>
        </el-card>
      </el-card>

      <!-- 自定义角色 -->
      <el-card class="section-card" shadow="never" style="margin-top: 16px">
        <template #header>
          <div class="card-title">
            <el-icon><Document /></el-icon>
            自定义角色
          </div>
        </template>

        <div v-if="customRoles.length === 0" class="empty-state">
          <el-empty description="暂无自定义角色" />
          <el-button type="primary" @click="handleAddRole">创建角色</el-button>
        </div>

        <div v-else class="custom-roles-grid">
          <el-card
            v-for="role in customRoles"
            :key="role.id"
            class="role-card"
            shadow="hover"
          >
            <template #header>
              <div class="role-card-header">
                <el-icon :size="24" color="#3290FF"><Document /></el-icon>
                <div class="role-name">{{ role.name }}</div>
              </div>
            </template>

            <div class="role-description">{{ role.description }}</div>

            <div class="role-actions">
              <el-button size="small" type="primary" @click="handleViewPermissions(role)">
                查看权限
              </el-button>
              <el-button size="small" @click="handleEditPermissions(role)">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDeleteRole(role)">
                删除
              </el-button>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 权限配置弹窗 -->
    <el-dialog
      v-model="permissionDialogVisible"
      :title="`权限配置：${currentRole?.name}`"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="permissionLoading" class="permission-form">
        <!-- 功能权限 -->
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="card-title">功能权限</div>
          </template>
          <el-form :model="permissionForm" label-width="120px">
            <el-form-item label="规则管理">
              <el-checkboxGroup v-model="permissionForm.rulePermissions">
                <el-checkbox label="view">规则查看</el-checkbox>
                <el-checkbox label="create">规则创建</el-checkbox>
                <el-checkbox label="edit">规则编辑</el-checkbox>
                <el-checkbox label="delete">规则删除</el-checkbox>
              </el-checkboxGroup>
            </el-form-item>
            <el-form-item label="巡检结果">
              <el-checkboxGroup v-model="permissionForm.inspectionPermissions">
                <el-checkbox label="view">结果查看</el-checkbox>
                <el-checkbox label="export">结果导出</el-checkbox>
              </el-checkboxGroup>
            </el-form-item>
            <el-form-item label="工单处理">
              <el-checkboxGroup v-model="permissionForm.orderPermissions">
                <el-checkbox label="view">工单查看</el-checkbox>
                <el-checkbox label="handle">工单处理</el-checkbox>
                <el-checkbox label="create">工单创建</el-checkbox>
              </el-checkboxGroup>
            </el-form-item>
            <el-form-item label="系统管理">
              <el-checkboxGroup v-model="permissionForm.systemPermissions">
                <el-checkbox label="role">角色管理</el-checkbox>
                <el-checkbox label="config">系统配置</el-checkbox>
                <el-checkbox label="audit">审计日志</el-checkbox>
              </el-checkboxGroup>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据权限 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">数据权限</div>
          </template>
          <el-form :model="permissionForm" label-width="120px">
            <el-form-item label="技术栈范围">
              <el-checkbox-group v-model="permissionForm.techStackScope">
                <el-checkbox label="java">Java</el-checkbox>
                <el-checkbox label="python">Python</el-checkbox>
                <el-checkbox label="go">Go</el-checkbox>
                <el-checkbox label="nodejs">Node.js</el-checkbox>
                <el-checkbox label="all">全部</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="应用范围">
              <el-select v-model="permissionForm.appScope" multiple collapse-tags placeholder="选择应用">
                <el-option label="APP-A" value="app-a" />
                <el-option label="APP-B" value="app-b" />
                <el-option label="APP-C" value="app-c" />
                <el-option label="APP-D" value="app-d" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 用户分配 -->
        <el-card class="section-card" shadow="never" style="margin-top: 16px">
          <template #header>
            <div class="card-title">用户分配</div>
          </template>
          <el-form :model="permissionForm" label-width="120px">
            <el-form-item label="已分配用户">
              <el-tag v-for="user in permissionForm.assignedUsers" :key="user.id" closable @close="removeUser(user)">
                {{ user.name }}
              </el-tag>
              <el-button size="small" type="primary" @click="handleSelectUsers">
                添加用户
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions" :loading="Saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增角色 dialog -->
    <el-dialog
      v-model="addRoleDialogVisible"
      title="新增角色"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newRoleForm" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="newRoleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="newRoleForm.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddRoleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Trophy,
  Document,
} from '@element-plus/icons-vue'

// 状态
const permissionDialogVisible = ref(false)
const addRoleDialogVisible = ref(false)
const permissionLoading = ref(false)
const saving = ref(false)
const currentRole = ref<Role | null>(null)

// 新增角色表单
const newRoleForm = reactive({
  name: '',
  description: '',
})

// 权限表单
const permissionForm = reactive({
  rulePermissions: [] as string[],
  inspectionPermissions: [] as string[],
  orderPermissions: [] as string[],
  systemPermissions: [] as string[],
  techStackScope: [] as string[],
  appScope: [] as string[],
  assignedUsers: [] as Array<{ id: string; name: string }>,
})

// 预置角色
const predefinRoles = ref<Role[]>([
  {
    id: 'superadmin',
    name: '平台超管',
    type: 'superadmin',
    description: '全权限，可配置角色、权限、存储路径',
    permissions: {
      rulePermissions: ['view', 'create', 'edit', 'delete'],
      inspectionPermissions: ['view', 'export'],
      orderPermissions: ['view', 'handle', 'create'],
      systemPermissions: ['role', 'config', 'audit'],
    },
    dataPermissions: {
      techStackScope: ['all'],
      appScope: ['all'],
    },
    assignedUsers: [
      { id: 'u1', name: '系统管理员' },
    ],
  },
  {
    id: 'tech-admin',
    name: '技术栈管理员',
    type: 'tech-admin',
    description: '操作自己技术栈的规则，查看巡检结果',
    permissions: {
      rulePermissions: ['view', 'edit'],
      inspectionPermissions: ['view'],
      orderPermissions: ['view'],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: ['java', 'python'],
      appScope: [],
    },
    assignedUsers: [
      { id: 'u2', name: 'Java 管理员' },
      { id: 'u3', name: 'Python 管理员' },
    ],
  },
  {
    id: 'one-line-admin',
    name: '一线管理员',
    type: 'one-line-admin',
    description: '查看负责应用结果，确认/转单',
    permissions: {
      rulePermissions: ['view'],
      inspectionPermissions: ['view'],
      orderPermissions: ['view', 'handle'],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: [],
      appScope: ['app-a', 'app-b'],
    },
    assignedUsers: [
      { id: 'u4', name: '一线管理员-张三' },
      { id: 'u5', name: '一线管理员-李四' },
    ],
  },
  {
    id: 'two-line-admin',
    name: '二线管理员',
    type: 'two-line-admin',
    description: '查看负责应用结果，提交整改',
    permissions: {
      rulePermissions: ['view'],
      inspectionPermissions: ['view'],
      orderPermissions: ['view', 'handle'],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: [],
      appScope: ['app-a', 'app-b', 'app-c'],
    },
    assignedUsers: [
      { id: 'u6', name: '二线管理员-王五' },
    ],
  },
])

// 自定义角色
const customRoles = ref<Role[]>([])

// 方法
const getRoleIcon = (type: string) => {
  switch (type) {
    case 'superadmin':
      return 'Trophy'
    case 'tech-admin':
      return 'Setting'
    case 'one-line-admin':
      return 'User'
    case 'two-line-admin':
      return 'Monitor'
    default:
      return 'Document'
  }
}

const getRoleIconColor = (type: string) => {
  switch (type) {
    case 'superadmin':
      return '#FFB100'
    case 'tech-admin':
      return '#3290FF'
    case 'one-line-admin':
      return '#00C771'
    case 'two-line-admin':
      return '#F13039'
    default:
      return '#3290FF'
  }
}

const handleAddRole = () => {
  newRoleForm.name = ''
  newRoleForm.description = ''
  addRoleDialogVisible.value = true
}

const handleAddRoleSubmit = () => {
  if (!newRoleForm.name) {
    ElMessage.warning('请输入角色名称')
    return
  }

  const newRole: Role = {
    id: 'custom-' + Date.now(),
    name: newRoleForm.name,
    type: 'custom',
    description: newRoleForm.description,
    permissions: {
      rulePermissions: [],
      inspectionPermissions: [],
      orderPermissions: [],
      systemPermissions: [],
    },
    dataPermissions: {
      techStackScope: [],
      appScope: [],
    },
    assignedUsers: [],
  }

  customRoles.value.push(newRole)
  addRoleDialogVisible.value = false
  ElMessage.success('角色创建成功')
}

const handleViewPermissions = (role: Role) => {
  currentRole.value = { ...role }
  permissionForm.rulePermissions = [...role.permissions.rulePermissions]
  permissionForm.inspectionPermissions = [...role.permissions.inspectionPermissions]
  permissionForm.orderPermissions = [...role.permissions.orderPermissions]
  permissionForm.systemPermissions = [...role.permissions.systemPermissions]
  permissionForm.techStackScope = [...role.dataPermissions.techStackScope]
  permissionForm.appScope = [...role.dataPermissions.appScope]
  permissionForm.assignedUsers = [...role.assignedUsers]
  permissionDialogVisible.value = true
}

const handleEditPermissions = (role: Role) => {
  currentRole.value = { ...role }
  permissionForm.rulePermissions = [...role.permissions.rulePermissions]
  permissionForm.inspectionPermissions = [...role.permissions.inspectionPermissions]
  permissionForm.orderPermissions = [...role.permissions.orderPermissions]
  permissionForm.systemPermissions = [...role.permissions.systemPermissions]
  permissionForm.techStackScope = [...role.dataPermissions.techStackScope]
  permissionForm.appScope = [...role.dataPermissions.appScope]
  permissionForm.assignedUsers = [...role.assignedUsers]
  permissionDialogVisible.value = true
}

const handleSelectUsers = () => {
  ElMessage.info('选择用户功能开发中...')
}

const removeUser = (user: any) => {
  permissionForm.assignedUsers = permissionForm.assignedUsers.filter((u) => u.id !== user.id)
}

const handleSavePermissions = () => {
  if (!currentRole.value) return

  currentRole.value.permissions = {
    rulePermissions: permissionForm.rulePermissions,
    inspectionPermissions: permissionForm.inspectionPermissions,
    orderPermissions: permissionForm.orderPermissions,
    systemPermissions: permissionForm.systemPermissions,
  }

  currentRole.value.dataPermissions = {
    techStackScope: permissionForm.techStackScope,
    appScope: permissionForm.appScope,
  }

  currentRole.value.assignedUsers = permissionForm.assignedUsers

  permissionDialogVisible.value = false
  ElMessage.success('权限配置已保存')
}

const handleDeleteRole = (role: Role) => {
  if (role.type === 'superadmin') {
    ElMessage.warning('平台超管角色不可删除')
    return
  }

  ElMessageBox.confirm(`确定要删除角色「${role.name}」吗？`, '删除确认', {
    type: 'warning',
  }).then(() => {
    if (role.type === 'custom') {
      customRoles.value = customRoles.value.filter((r) => r.id !== role.id)
      ElMessage.success('角色已删除')
    }
  }).catch(() => {})
}

// 类型定义
interface Role {
  id: string
  name: string
  type: 'superadmin' | 'tech-admin' | 'one-line-admin' | 'two-line-admin' | 'custom'
  description: string
  permissions: {
    rulePermissions: string[]
    inspectionPermissions: string[]
    orderPermissions: string[]
    systemPermissions: string[]
  }
  dataPermissions: {
    techStackScope: string[]
    appScope: string[]
  }
  assignedUsers: Array<{ id: string; name: string }>
}

// 生命周期
onMounted(() => {
  // 初始化
})
</script>

<style lang="scss" scoped>
.system-admin-page {
  padding: 16px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: #25303c;
    }
  }

  .section-card {
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 16px;
      color: #2f2e4b;

      .el-icon {
        color: #3290ff;
      }
    }

    .role-card {
      margin-bottom: 12px;

      .role-card-header {
        display: flex;
        align-items: center;
        gap: 12px;

        .role-name {
          font-weight: 500;
          font-size: 16px;
          color: #2f2e4b;
        }
      }

      .role-description {
        color: #3b5369;
        margin-bottom: 12px;
      }

      .role-actions {
        display: flex;
        gap: 8px;
      }
    }

    .custom-roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;

    .el-empty {
      margin-bottom: 16px;
    }
  }

  .permission-form {
    .section-card {
      margin-bottom: 16px;
    }
  }
}
</style>
