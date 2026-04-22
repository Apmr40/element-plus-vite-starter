import type { ViteSSGContext } from 'vite-ssg'

export type UserModule = (ctx: ViteSSGContext) => void

// 巡检系统类型定义
export interface RuleConfig {
  id: string
  name: string
  techStack: string
  tags: string[]
  status: 'enabled' | 'disabled'
  logicBlocks: LogicBlock[]
  createdAt: string
  updatedAt: string
}

export interface LogicBlock {
  id: string
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'regex' | 'range' | 'and' | 'or' | 'not'
  value: string | number | (string | number)[]
  childBlocks?: LogicBlock[]
}

export interface InspectionResult {
  id: string
  appName: string
  techStack: string
  inspectedAt: string
  compliant: number
  nonCompliant: number
  status: 'compliant' | 'nonCompliant'
  nonCompliantItems: NonCompliantItem[]
}

export interface NonCompliantItem {
  appId: string
  instanceId: string
  reason: string
  riskLevel: 'high' | 'medium' | 'low'
}

export interface Order {
  id: string
  appName: string
  nonCompliantItem: string
  riskLevel: 'high' | 'medium' | 'low'
  remainingTime: string
  status: 'pending-confirm' | 'pending-rectify' | 'pending-review' | 'closed' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  role: 'superadmin' | 'admin' | 'user'
}
