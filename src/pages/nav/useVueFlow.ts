import type { Elements, VueFlowStore } from '@vue-flow/core'
import type { Ref } from 'vue'
import type { Task } from './types'
import { computed, watch } from 'vue'

// 定义节点和边的类型
interface TopologyData {
  predecessors: Array<{ id: string, name: string, linksTo: string[] }>
  currentChange: {
    id: string | null
    tasks: Task[][]
  }
  successors: Array<{ id: string, name: string, linksTo: string[] }>
}

export function useTopologyVueFlow(vueFlowInstance: VueFlowStore, topologyData: Ref<TopologyData>, selectedTaskId: Ref<string | undefined>) {
  const { fitView, addEdges, addNodes, nodes, edges, removeNodes, removeEdges } = vueFlowInstance

  const flowElements = computed<Elements>(() => {
    const elements: Elements = []
    const { predecessors, currentChange, successors } = topologyData.value
    const nodeWidth = 150
    const nodeHeight = 60
    const groupGap = 100
    const taskGroupGap = 30
    const taskNodeGap = 20

    // 1. 前置变更节点
    const predecessorNodes = predecessors.map((pred, index) => ({
      id: pred.id,
      type: 'default',
      label: `${pred.id}\n(${pred.name})`,
      position: { x: 0, y: index * (nodeHeight + taskNodeGap) },
      data: { type: 'change' },
    }))
    elements.push(...predecessorNodes)

    // 计算当前变更区域的起始 X 坐标
    const currentChangeStartX = nodeWidth + groupGap

    // 2. 当前变更任务节点 (核心逻辑)
    let currentX = currentChangeStartX
    const taskNodes: any[] = []
    const taskNodePositions: Record<string, { x: number, y: number }> = {}

    currentChange.tasks.forEach((taskGroup) => {
      const groupHeight = taskGroup.length * nodeHeight + (taskGroup.length - 1) * taskNodeGap
      let currentY = -(groupHeight / 2) + nodeHeight / 2

      taskGroup.forEach((task) => {
        const position = { x: currentX, y: currentY }
        taskNodePositions[task.id] = position
        taskNodes.push({
          id: task.id,
          type: 'custom',
          label: task.label,
          position,
          data: { ...task, isSelected: task.id === selectedTaskId.value },
        })
        currentY += nodeHeight + taskNodeGap
      })

      currentX += nodeWidth + taskGroupGap
    })
    elements.push(...taskNodes)

    // 3. 后续变更节点
    const successorStartX = currentX - taskGroupGap + groupGap
    const successorNodes = successors.map((succ, index) => ({
      id: succ.id,
      type: 'default',
      label: `${succ.id}\n(${succ.name})`,
      position: { x: successorStartX, y: index * (nodeHeight + taskNodeGap) },
      data: { type: 'change' },
    }))
    elements.push(...successorNodes)

    // 4. 创建连接线
    // 前置 -> 任务
    predecessors.forEach((pred) => {
      pred.linksTo.forEach((taskId) => {
        elements.push({ id: `e-${pred.id}-${taskId}`, source: pred.id, target: taskId, animated: true })
      })
    })

    // 任务 -> 任务 (串行)
    for (let i = 0; i < currentChange.tasks.length - 1; i++) {
      const currentGroup = currentChange.tasks[i]
      const nextGroup = currentChange.tasks[i + 1]
      currentGroup.forEach((sourceTask) => {
        nextGroup.forEach((targetTask) => {
          elements.push({ id: `e-${sourceTask.id}-${targetTask.id}`, source: sourceTask.id, target: targetTask.id, animated: true })
        })
      })
    }

    // 任务 -> 后续
    successors.forEach((succ) => {
      succ.linksTo.forEach((taskId) => {
        elements.push({ id: `e-${taskId}-${succ.id}`, source: taskId, target: succ.id, animated: true })
      })
    })

    return elements
  })

  // 监听数据变化，并更新到 Vue Flow 实例中
  watch(flowElements, (newElements) => {
    // 清空旧的节点和边
    removeNodes(nodes.value)
    removeEdges(edges.value)

    // 添加新的节点和边
    const newNodes = newElements.filter(el => 'position' in el)
    const newEdges = newElements.filter(el => 'source' in el)
    addNodes(newNodes)
    addEdges(newEdges)

    // 自动缩放视图
    setTimeout(() => fitView(), 100)
  }, { immediate: true, deep: true })

  // 监听选中任务的变化，更新节点的样式
  watch(selectedTaskId, (newId, oldId) => {
    const oldNode = nodes.value.find(n => n.id === oldId)
    if (oldNode)
      oldNode.data.isSelected = false

    const newNode = nodes.value.find(n => n.id === newId)
    if (newNode)
      newNode.data.isSelected = true
  })
}
