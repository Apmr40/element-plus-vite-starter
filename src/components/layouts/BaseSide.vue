<script lang="ts" setup>
import {
  Check,
  Document,
  Menu as IconMenu,
  List,
  Location,
  Lock,
  Monitor,
  Setting,
  SetUp,
  Switch,
  Tickets,
  Tools,
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <el-menu
    router
    :default-active="route.path"
    class="el-menu-vertical-demo"
  >
    <el-sub-menu index="1">
      <template #title>
        <el-icon>
          <Location />
        </el-icon>
        <span>Navigator One</span>
      </template>
      <el-menu-item-group>
        <template #title>
          <span>Group One</span>
        </template>
        <el-menu-item index="/nav/1/item-1">
          item one
        </el-menu-item>
        <el-menu-item index="1-2">
          item two
        </el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="Group Two">
        <el-menu-item index="1-3">
          item three
        </el-menu-item>
      </el-menu-item-group>
      <el-sub-menu index="1-4">
        <template #title>
          <span>item four</span>
        </template>
        <el-menu-item index="1-4-1">
          item one
        </el-menu-item>
      </el-sub-menu>
    </el-sub-menu>
    <el-menu-item index="/nav/2">
      <el-icon>
        <IconMenu />
      </el-icon>
      <template #title>
        Navigator Two
      </template>
    </el-menu-item>
    <el-menu-item index="3" disabled>
      <el-icon>
        <Document />
      </el-icon>
      <template #title>
        Navigator Three
      </template>
    </el-menu-item>
    <el-menu-item index="/nav/4">
      <el-icon>
        <Setting />
      </el-icon>
      <template #title>
        Navigator Four
      </template>
    </el-menu-item>

    <!-- Demo 模块：应用配置巡检系统（2026-08-17 菜单合并：原"巡检管理"+"配置巡检"统一） -->
    <el-sub-menu index="demo">
      <template #title>
        <el-icon>
          <Monitor />
        </el-icon>
        <span>应用配置巡检</span>
      </template>
      <el-menu-item index="/inspection">
        <el-icon><Location /></el-icon>
        <span>巡检总览</span>
      </el-menu-item>
      <el-sub-menu index="demo-inspect-config">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>巡检配置</span>
        </template>
        <el-menu-item index="/inspection/rule">
          <el-icon><Setting /></el-icon>
          <span>规则配置</span>
        </el-menu-item>
        <el-menu-item index="/config-inspect/strategy">
          <el-icon><List /></el-icon>
          <span>巡检策略</span>
        </el-menu-item>
        <el-menu-item index="/config-inspect/plan">
          <el-icon><Tickets /></el-icon>
          <span>巡检计划</span>
        </el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/config-inspect/result">
        <el-icon><Check /></el-icon>
        <span>检查结果</span>
      </el-menu-item>
      <el-menu-item index="/inspection/order">
        <el-icon><Tickets /></el-icon>
        <span>整改工单</span>
      </el-menu-item>
      <el-menu-item index="/inspection/admin">
        <el-icon><Lock /></el-icon>
        <span>权限后台</span>
      </el-menu-item>
    </el-sub-menu>

    <el-menu-item index="/change-protection">
      <el-icon><Switch /></el-icon>
      <template #title>
        变更特护视图
      </template>
    </el-menu-item>

    <el-menu-item index="/api-config">
      <el-icon><Tools /></el-icon>
      <template #title>
        操作资源配置
      </template>
    </el-menu-item>

    <el-menu-item index="/workbench">
      <el-icon><SetUp /></el-icon>
      <template #title>
        操作工作台
      </template>
    </el-menu-item>
  </el-menu>
</template>
