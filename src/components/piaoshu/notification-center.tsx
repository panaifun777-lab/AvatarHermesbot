'use client'

import { useState } from 'react'
import {
  Bell,
  Cpu,
  RefreshCw,
  FileText,
  CheckSquare,
  Brain,
  Zap,
  Network,
  CheckCheck,
  Trash2,
  Inbox,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore, type AppNotification, type NotificationType } from '@/lib/notification-store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Map notification type to icon component
const TYPE_ICON_MAP: Record<NotificationType, React.ElementType> = {
  'agent:status': Cpu,
  'agent:cycle': RefreshCw,
  'agent:output': FileText,
  'clone:activity': Cpu,
  'task:updated': CheckSquare,
  'task:created': CheckSquare,
  'shard:updated': Brain,
  'simulation:completed': Zap,
  'node:status': Network,
}

// Map notification type to left border color
const TYPE_BORDER_MAP: Record<NotificationType, string> = {
  'agent:status': 'border-l-emerald-500',
  'agent:cycle': 'border-l-violet-500',
  'agent:output': 'border-l-teal-500',
  'clone:activity': 'border-l-purple-500',
  'task:updated': 'border-l-cyan-500',
  'task:created': 'border-l-sky-500',
  'shard:updated': 'border-l-emerald-600',
  'simulation:completed': 'border-l-amber-500',
  'node:status': 'border-l-rose-500',
}

// Map notification type to icon color
const TYPE_ICON_COLOR_MAP: Record<NotificationType, string> = {
  'agent:status': 'text-emerald-500',
  'agent:cycle': 'text-violet-500',
  'agent:output': 'text-teal-500',
  'clone:activity': 'text-purple-500',
  'task:updated': 'text-cyan-500',
  'task:created': 'text-sky-500',
  'shard:updated': 'text-emerald-600',
  'simulation:completed': 'text-amber-500',
  'node:status': 'text-rose-500',
}

// Map notification type to icon bg color
const TYPE_ICON_BG_MAP: Record<NotificationType, string> = {
  'agent:status': 'bg-emerald-500/10',
  'agent:cycle': 'bg-violet-500/10',
  'agent:output': 'bg-teal-500/10',
  'clone:activity': 'bg-purple-500/10',
  'task:updated': 'bg-cyan-500/10',
  'task:created': 'bg-sky-500/10',
  'shard:updated': 'bg-emerald-600/10',
  'simulation:completed': 'bg-amber-500/10',
  'node:status': 'bg-rose-500/10',
}

// Relative timestamp in Chinese
function relativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

interface NotificationCenterProps {
  onNavigate: (module: string) => void
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount())
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const removeNotification = useNotificationStore((s) => s.removeNotification)

  const count = unreadCount

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id)
    onNavigate(notification.module)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 shrink-0"
          aria-label={`通知中心${count > 0 ? ` - ${count}条未读` : ''}`}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {count > 0 && (
            <Badge
              key={count}
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] font-bold border-0 bg-rose-500 text-white animate-pulse"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-xl shadow-xl border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">通知中心</span>
            {count > 0 && (
              <Badge variant="secondary" className="h-5 text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0">
                {count} 条未读
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
                disabled={count === 0}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                全部已读
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-rose-500"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                清空
              </Button>
            </div>
          )}
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">暂无通知</p>
            <p className="text-xs text-muted-foreground mt-1">新消息将显示在这里</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="flex flex-col">
              {notifications.map((notification, index) => {
                const IconComp = TYPE_ICON_MAP[notification.type] || Bell
                const borderColor = TYPE_BORDER_MAP[notification.type] || 'border-l-muted'
                const iconColor = TYPE_ICON_COLOR_MAP[notification.type] || 'text-muted-foreground'
                const iconBg = TYPE_ICON_BG_MAP[notification.type] || 'bg-muted'

                return (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-l-[3px]",
                        borderColor,
                        notification.read
                          ? "bg-transparent hover:bg-muted/50"
                          : "bg-muted/30 hover:bg-muted/60",
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Icon */}
                      <div className={cn("shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5", iconBg)}>
                        <IconComp className={cn("h-4 w-4", iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "text-sm leading-tight",
                            notification.read ? "font-medium text-foreground/80" : "font-semibold text-foreground"
                          )}>
                            {notification.title}
                          </span>
                          <button
                            className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            aria-label="删除通知"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground/70">
                            {relativeTime(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="mx-4" />}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <p className="text-[10px] text-muted-foreground text-center">
              点击通知跳转到对应模块 · 最多保留 {50} 条通知
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
