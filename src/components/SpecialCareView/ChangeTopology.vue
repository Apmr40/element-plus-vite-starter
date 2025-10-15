<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

interface ChangeItem { id: string, name: string }
interface TopologyTask { id: string, status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING', label: string }
interface TopologyData { predecessors: ChangeItem[], currentChange: { id: string, tasks: TopologyTask[] }, successors: ChangeItem[] }
interface K8sDetailItem { component: string, namespace: string, cluster: string, status: string }

interface Props {
  selectedChangeId: string
  changeSearchText: string
  selectedTaskId: string
  filteredChangeList: ChangeItem[]
  topologyData: TopologyData
  k8sDetailData: K8sDetailItem[]
}

defineProps<Props>()

const _emit = defineEmits<{
  (e: 'changeSelect', id: string): void
  (e: 'taskSelect', id: string): void
  (e: 'detailClick', prop: string, value: string): void
  (e: 'update:changeSearchText', value: string): void
}>()
</script>

<template>
  <el-row :gutter="20" class="bottom-content-area">
    <el-col :span="4">
      <el-card class="change-list-card" shadow="never">
        <template #header>
          <div class="sidebar-search">
            <el-input
              :model-value="changeSearchText"
              placeholder="Cxxxxxx 模糊查询"
              clearable
              @update:model-value="$emit('update:changeSearchText', $event)"
            >
              <template #prefix>
                <el-icon><i-ep-search /></el-icon>
              </template>
            </el-input>
          </div>
        </template>
        <el-menu
          :default-active="selectedChangeId"
          class="el-menu-vertical-change"
          :collapse="false"
          @select="$emit('changeSelect', $event as string)"
        >
          <el-menu-item
            v-for="change in filteredChangeList"
            :key="change.id"
            :index="change.id"
            :title="change.name"
          >
            <el-icon><i-ep-document /></el-icon>
            <span class="change-id">{{ change.id }}</span>
          </el-menu-item>
          <el-empty
            v-if="filteredChangeList.length === 0"
            description="无匹配变更"
            :image-size="50"
          />
        </el-menu>
      </el-card>
    </el-col>

    <el-col :span="12">
      <el-card class="topology-card" shadow="never">
        <template #header>
          <div class="card-header-title">
            变更拓扑图：{{ selectedChangeId }}
          </div>
        </template>
        <div class="topology-container">
          <div class="connector top-line" />
          <div class="connector bottom-line" />

          <div class="topo-step predecessor">
            <div class="step-title">
              前置变更
            </div>
            <div
              v-for="pred in topologyData.predecessors"
              :key="pred.id"
              class="topo-node topo-change"
            >
              {{ pred.id }}
            </div>
          </div>

          <div class="topo-step current">
            <div class="step-title">
              当前变更: {{ topologyData.currentChange.id }}
            </div>
            <div class="tasks-container">
              <div
                v-for="task in topologyData.currentChange.tasks"
                :key="task.id"
                class="topo-node topo-task"
                :class="[task.status.toLowerCase(), { 'is-selected': task.id === selectedTaskId }]"
                @click="$emit('taskSelect', task.id)"
              >
                <span class="task-id">{{ task.id }}</span>
                <span class="task-label">{{ task.label }}</span>
              </div>
            </div>
          </div>

          <div class="topo-step successor">
            <div class="step-title">
              后续变更
            </div>
            <div
              v-for="succ in topologyData.successors"
              :key="succ.id"
              class="topo-node topo-change"
            >
              {{ succ.id }}
            </div>
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="8">
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header-title">
            任务单明细：{{ selectedTaskId }}
          </div>
        </template>
        <el-table
          :data="k8sDetailData"
          border
          style="width: 100%;"
          max-height="350"
          size="small"
          class="k8s-detail-table"
        >
          <el-table-column prop="component" label="组件">
            <template #default="{ row }">
              <el-button link @click="$emit('detailClick', 'component', row.component)">
                {{ row.component }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="namespace" label="命名空间" width="100">
            <template #default="{ row }">
              <el-button link @click="$emit('detailClick', 'namespace', row.namespace)">
                {{ row.namespace }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="cluster" label="集群" width="100">
            <template #default="{ row }">
              <el-button link @click="$emit('detailClick', 'cluster', row.cluster)">
                {{ row.cluster }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-col>
  </el-row>
</template>
