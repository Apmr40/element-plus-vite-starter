<!-- 应用配置巡检系统 - 布局组件 -->
<template>
  <div class="inspection-system-layout">
    <!-- 顶部导航 -->
    <div class="layout-header">
      <div class="header-title">
        <el-icon :size="24" color="#3290ff"><Monitor /></el-icon>
        <span>应用配置巡检系统</span>
      </div>
      <div class="header-menu">
        <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/inspection/rule-config">
            <el-icon><Edit /></el-icon>
            规则配置
          </el-menu-item>
          <el-menu-item index="/inspection/inspection-result">
            <el-icon><TrendCharts /></el-icon>
            巡检结果
          </el-menu-item>
          <el-menu-item index="/inspection/rectification-order">
            <el-icon><Files /></el-icon>
            整改工单
          </el-menu-item>
          <el-menu-item index="/inspection/system-admin">
            <el-icon><Setting /></el-icon>
            系统管理
          </el-menu-item>
        </el-menu>
      </div>
      <div class="header-user">
        <el-dropdown>
          <div class="user-avatar">
            <el-icon><User /></el-icon>
            <span>{{ userName }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleProfile">
                用户设置
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 侧边导航 -->
    <div class="layout-sidebar">
      <div class="sidebar-title">
        <el-icon :size="20" color="#3290ff"><Monitor /></el-icon>
        <span>应用配置巡检</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/inspection/rule-config">
          <el-icon><Edit /></el-icon>
          <span>规则配置</span>
        </el-menu-item>
        <el-menu-item index="/inspection/inspection-result">
          <el-icon><TrendCharts /></el-icon>
          <span>巡检结果</span>
        </el-menu-item>
        <el-menu-item index="/inspection/rectification-order">
          <el-icon><Files /></el-icon>
          <span>整改工单</span>
        </el-menu-item>
        <el-menu-item index="/inspection/system-admin">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="layout-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Monitor,
  Edit,
  TrendCharts,
  Files,
  Setting,
  User,
} from '@element-plus/icons-vue'

// 状态
const route = useRoute()
const activeMenu = ref('/inspection/rule-config')
const userName = ref('一线管理员 - 张三')

// 计算属性
const currentPath = computed(() => route.path)

// 方法
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
}

const handleProfile = () => {
  ElMessage.info('用户设置功能开发中...')
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    type: 'warning',
  }).then(() => {
    // 退出登录逻辑
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

// 生命周期
onMounted(() => {
  activeMenu.value = currentPath.value
})
</script>

<style lang="scss" scoped>
.inspection-system-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fc;

  .layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 64px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(37, 48, 60, 0.18);
    flex-shrink: 0;

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 500;
      color: #2f2e4b;

      span {
        font-size: 18px;
        font-weight: 500;
        color: #25303c;
      }
    }

    .header-menu {
      flex: 1;
      margin: 0 24px;

      :deep(.el-menu) {
        border: none;
        background: transparent;

        .el-menu-item {
          &.is-active {
            background: #f0f7ff;
            color: #3290ff;

            &::before {
              position: absolute;
              bottom: 0;
              left: 50%;
              width: 100%;
              height: 3px;
              background: #3290ff;
              transform: translateX(-50%);
              content: '';
            }
          }
        }
      }
    }

    .header-user {
      .user-avatar {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 20px;
        transition: all 0.2s;

        &:hover {
          background: #f8f9fc;
        }

        .el-icon {
          color: #91969d;
        }

        span {
          font-size: 14px;
          color: #2f2e4b;
        }
      }
    }
  }

  .layout-sidebar {
    display: flex;
    flex-direction: column;
    width: 240px;
    height: calc(100vh - 64px);
    background: #ffffff;
    border-right: 1px solid #e8e9eb;
    flex-shrink: 0;

    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      font-size: 18px;
      font-weight: 500;
      color: #2f2e4b;

      .el-icon {
        color: #3290ff;
      }
    }

    .sidebar-menu {
      flex: 1;
      border: none;
      background: #ffffff;

      .el-menu-item {
        &.is-active {
          background: #f0f7ff;
          color: #3290ff;

          &::before {
            position: absolute;
            right: 0;
            top: 50%;
            width: 3px;
            height: 24px;
            background: #3290ff;
            transform: translateY(-50%);
            content: '';
          }
        }
      }
    }
  }

  .layout-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: #f8f9fc;
  }
}
</style>
