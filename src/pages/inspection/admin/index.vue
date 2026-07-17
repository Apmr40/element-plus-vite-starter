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
        <el-button type="primary" @click="handleSavePermissions" :loading="saving">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Trophy,
  Setting,
  User,
  Monitor,
  Document,
} from '@element-plus/icons-vue'
import {
  getRoleList,
  createRole,
  updateRolePermissions,
  deleteRole,
} from '~/demo/api/system'
import type { Role } from '~/demo/types/inspection'

// 状态
const permissionDialogVisible = ref(false)
const addRoleDialogVisible = ref(false)
const currentRole = ref<Role | null>(null)

// 表单数据
const newRoleForm = reactive({
  name: '',
  description: '',
})

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
const predefinRoles = ref<Role[]>([])

// 自定义角色
const customRoles = ref<Role[]>([])

// 计算属性
const allRoles = computed(() => [...predefinRoles.value, ...customRoles.value])

// 方法
const loadRoles = async () => {
  try {
    const res = await getRoleList()
    const roles = res.data
    predefinRoles.value = roles.filter(r => r.type !== 'custom')
    customRoles.value = roles.filter(r => r.type === 'custom')
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  }
}

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

const handleAddRoleSubmit = async () => {
  if (!newRoleForm.name) {
    ElMessage.warning('请输入角色名称')
    return
  }

  try {
    await createRole(newRoleForm.name, newRoleForm.description)
    addRoleDialogVisible.value = false
    ElMessage.success('角色创建成功')
    loadRoles()
  } catch (error) {
    ElMessage.error('创建失败')
  }
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

const handleSavePermissions = async () => {
  if (!currentRole.value) return

  try {
    await updateRolePermissions(currentRole.value.id, {
      permissions: {
        rulePermissions: permissionForm.rulePermissions,
        inspectionPermissions: permissionForm.inspectionPermissions,
        orderPermissions: permissionForm.orderPermissions,
        systemPermissions: permissionForm.systemPermissions,
      },
      dataPermissions: {
        techStackScope: permissionForm.techStackScope,
        appScope: permissionForm.appScope,
      },
      assignedUsers: permissionForm.assignedUsers,
    })

    permissionDialogVisible.value = false
    ElMessage.success('权限配置已保存')
    loadRoles()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleDeleteRole = async (role: Role) => {
  if (role.type === 'superadmin') {
    ElMessage.warning('平台超管角色不可删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除角色「${role.name}」吗？`, '删除确认', {
      type: 'warning',
    })

    await deleteRole(role.id)
    ElMessage.success('角色已删除')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 生命周期
onMounted(() => {
  loadRoles()
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
