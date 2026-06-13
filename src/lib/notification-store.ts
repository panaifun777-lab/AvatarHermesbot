'use client'

import { create } from 'zustand'

// Must match ActiveModule from page.tsx
type ActiveModule = 'dashboard' | 'avatar' | 'cognitive' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap'

export type NotificationType =
  | 'agent:status'
  | 'agent:cycle'
  | 'agent:output'
  | 'clone:activity'
  | 'task:updated'
  | 'task:created'
  | 'shard:updated'
  | 'simulation:completed'
  | 'node:status'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  module: ActiveModule
  timestamp: number
  read: boolean
}

const MAX_NOTIFICATIONS = 50

interface NotificationState {
  notifications: AppNotification[]
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  removeNotification: (id: string) => void
  unreadCount: () => number
}

let notificationIdCounter = 0

function generateId(): string {
  notificationIdCounter += 1
  return `notif-${Date.now()}-${notificationIdCounter}`
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (partial) => {
    const newNotification: AppNotification = {
      ...partial,
      id: generateId(),
      timestamp: Date.now(),
      read: false,
    }

    set((state) => {
      const updated = [newNotification, ...state.notifications]
      // Auto-prune oldest when exceeding max
      if (updated.length > MAX_NOTIFICATIONS) {
        return { notifications: updated.slice(0, MAX_NOTIFICATIONS) }
      }
      return { notifications: updated }
    })
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  clearAll: () => {
    set({ notifications: [] })
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length
  },
}))

// Map WS event type to notification module and default title/description
export function mapWSEventToNotification(
  type: string,
  data: Record<string, unknown>
): Omit<AppNotification, 'id' | 'timestamp' | 'read'> | null {
  switch (type) {
    case 'agent:status': {
      const agentName = (data.agentName as string) || '分身'
      const status = (data.status as string) || ''
      return {
        type: 'agent:status',
        title: `${agentName} 状态变更`,
        description: `${agentName} 状态已更新为 ${status}`,
        module: 'avatar',
      }
    }
    case 'agent:cycle': {
      const agentName = (data.agentName as string) || '分身'
      const phase = (data.phase as string) || ''
      return {
        type: 'agent:cycle',
        title: `${agentName} 周期更新`,
        description: `${agentName} 已进入${phase}阶段`,
        module: 'avatar',
      }
    }
    case 'agent:output': {
      const agentName = (data.agentName as string) || '分身'
      const outputType = (data.outputType as string) || '产出'
      const title = (data.title as string) || ''
      return {
        type: 'agent:output',
        title: `${agentName} 新产出`,
        description: title || `${agentName} 产生了新的${outputType}`,
        module: 'avatar',
      }
    }
    case 'clone:activity': {
      const description = (data.description as string) || '分身活动更新'
      const agentName = (data.agentName as string) || ''
      return {
        type: 'clone:activity',
        title: agentName ? `${agentName} 活动` : '分身活动',
        description,
        module: 'avatar',
      }
    }
    case 'task:updated': {
      return {
        type: 'task:updated',
        title: '任务状态更新',
        description: '协作任务状态已变更',
        module: 'collaboration',
      }
    }
    case 'task:created': {
      return {
        type: 'task:created',
        title: '新任务创建',
        description: '新的协作任务已发布',
        module: 'collaboration',
      }
    }
    case 'shard:updated': {
      return {
        type: 'shard:updated',
        title: '认知分片更新',
        description: '认知分片数据已更新',
        module: 'cognitive',
      }
    }
    case 'simulation:completed': {
      return {
        type: 'simulation:completed',
        title: '红蓝对抗完成',
        description: '新一轮红蓝对抗模拟已完成',
        module: 'cognitive',
      }
    }
    case 'node:status': {
      return {
        type: 'node:status',
        title: '节点状态变更',
        description: '协作节点状态已更新',
        module: 'collaboration',
      }
    }
    default:
      return null
  }
}
