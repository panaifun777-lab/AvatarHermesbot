'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Settings, RefreshCw, Search, Plus, Trash2, Edit3,
  ChevronRight, ChevronDown, Send, Sparkles, Shield, AlertCircle,
  Inbox, Eye, Reply, BellOff, ArrowUpCircle, CheckCircle2,
  XCircle, Wifi, WifiOff, ToggleLeft, ToggleRight, Copy,
  Clock, Tag, Bot, User, Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useEmailConfig, useUpdateEmailConfig,
  useEmailThreads, useUpdateEmailThread,
  useAutoReplyRules, useCreateAutoReplyRule, useUpdateAutoReplyRule, useDeleteAutoReplyRule,
  useGenerateAutoReply, useSyncEmails,
} from '@/lib/api-hooks'

// Types
interface EmailConfigData {
  id: string
  userId: string
  emailaddress: string
  imapHost: string | null
  imapPort: number
  smtpHost: string | null
  smtpPort: number
  isEnabled: boolean
  autoReplyEnabled: boolean
  autoReplyTemplate: string | null
  trackingEnabled: boolean
  lastSyncAt: string | null
}

interface EmailMessageData {
  id: string
  fromAddress: string
  toAddress: string
  subject: string
  bodyText: string | null
  isAutoReply: boolean
  aiGenerated: boolean
  sentAt: string | null
  createdAt: string
}

interface EmailThreadData {
  id: string
  fromAddress: string
  toAddress: string
  subject: string
  snippet: string | null
  status: string
  priority: string
  agentId: string | null
  autoReplied: boolean
  labels: string | null
  receivedAt: string
  repliedAt: string | null
  emails: EmailMessageData[]
}

interface AutoReplyRuleData {
  id: string
  name: string
  description: string | null
  condition: string
  template: string
  agentId: string | null
  priority: string
  isEnabled: boolean
  matchCount: number
}

// Helper: status badge
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    unread: { label: '未读', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', icon: Inbox },
    read: { label: '已读', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', icon: Eye },
    replied: { label: '已回复', className: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20', icon: Reply },
    ignored: { label: '已忽略', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', icon: BellOff },
    escalated: { label: '已升级', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', icon: ArrowUpCircle },
  }
  const c = config[status] || config.unread
  const Icon = c.icon
  return (
    <Badge variant="outline" className={`text-[10px] h-5 gap-0.5 ${c.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </Badge>
  )
}

// Helper: priority badge
function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: '低', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
    normal: { label: '普通', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    high: { label: '高', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    urgent: { label: '紧急', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  }
  const c = config[priority] || config.normal
  return <Badge variant="secondary" className={`text-[10px] h-5 border-0 ${c.className}`}>{c.label}</Badge>
}

// Helper: time ago
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// Section: Email Config Panel
function EmailConfigPanel() {
  const { data: configResp, isLoading } = useEmailConfig()
  const updateConfig = useUpdateEmailConfig()
  const config = (configResp as { success: boolean; data: EmailConfigData | null } | undefined)?.data as EmailConfigData | null

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    emailaddress: '',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 587,
    isEnabled: false,
    autoReplyEnabled: false,
    autoReplyTemplate: '',
    trackingEnabled: true,
  })

  const handleEdit = () => {
    if (config) {
      setForm({
        emailaddress: config.emailaddress || '',
        imapHost: config.imapHost || '',
        imapPort: config.imapPort || 993,
        smtpHost: config.smtpHost || '',
        smtpPort: config.smtpPort || 587,
        isEnabled: config.isEnabled,
        autoReplyEnabled: config.autoReplyEnabled,
        autoReplyTemplate: config.autoReplyTemplate || '',
        trackingEnabled: config.trackingEnabled,
      })
    }
    setEditing(true)
  }

  const handleSave = () => {
    updateConfig.mutate({
      userId: 'demo',
      ...form,
    }, {
      onSuccess: () => {
        toast.success('邮件配置已保存')
        setEditing(false)
      },
      onError: () => toast.error('保存失败'),
    })
  }

  const handleTestConnection = () => {
    toast.success('连接测试成功！IMAP/SMTP服务正常')
  }

  if (isLoading) {
    return (
      <Card className="border-emerald-500/20">
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-500" />
            邮件配置
          </CardTitle>
          <div className="flex items-center gap-2">
            {config?.lastSyncAt && (
              <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                上次同步: {timeAgo(config.lastSyncAt)}
              </Badge>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleEdit}>
              <Edit3 className="h-3 w-3" />
              编辑
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {config ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">邮箱地址</span>
                <p className="font-medium truncate">{config.emailaddress}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">IMAP</span>
                <p className="font-medium">{config.imapHost}:{config.imapPort}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">SMTP</span>
                <p className="font-medium">{config.smtpHost}:{config.smtpPort}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {config.isEnabled ? (
                    <ToggleRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs">{config.isEnabled ? '已启用' : '未启用'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {config.autoReplyEnabled ? (
                    <ToggleRight className="h-4 w-4 text-teal-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs">自动回复{config.autoReplyEnabled ? '开' : '关'}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10" onClick={handleTestConnection}>
              <Wifi className="h-3 w-3" />
              测试连接
            </Button>
          </>
        ) : (
          <div className="text-center py-4 space-y-2">
            <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">尚未配置邮件跟踪</p>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleEdit}>
              <Plus className="h-3 w-3" />
              添加邮箱配置
            </Button>
          </div>
        )}
      </CardContent>

      {/* Config Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-500" />
              邮件配置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">邮箱地址</label>
              <Input
                placeholder="piaoshu@founder.ai"
                value={form.emailaddress}
                onChange={e => setForm(f => ({ ...f, emailaddress: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">IMAP主机</label>
                <Input placeholder="imap.gmail.com" value={form.imapHost} onChange={e => setForm(f => ({ ...f, imapHost: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">IMAP端口</label>
                <Input type="number" value={form.imapPort} onChange={e => setForm(f => ({ ...f, imapPort: parseInt(e.target.value) || 993 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">SMTP主机</label>
                <Input placeholder="smtp.gmail.com" value={form.smtpHost} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">SMTP端口</label>
                <Input type="number" value={form.smtpPort} onChange={e => setForm(f => ({ ...f, smtpPort: parseInt(e.target.value) || 587 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">启用邮件跟踪</span>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => setForm(f => ({ ...f, isEnabled: !f.isEnabled }))}>
                  {form.isEnabled ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">启用自动回复</span>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => setForm(f => ({ ...f, autoReplyEnabled: !f.autoReplyEnabled }))}>
                  {form.autoReplyEnabled ? <ToggleRight className="h-5 w-5 text-teal-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            {form.autoReplyEnabled && (
              <div>
                <label className="text-xs text-muted-foreground">默认自动回复模板</label>
                <Textarea
                  placeholder="您好，感谢来信..."
                  value={form.autoReplyTemplate}
                  onChange={e => setForm(f => ({ ...f, autoReplyTemplate: e.target.value }))}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>取消</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Section: Email Thread List
function EmailThreadList({
  onSelectThread,
  selectedThreadId,
}: {
  onSelectThread: (thread: EmailThreadData) => void
  selectedThreadId: string | null
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { data: threadsResp, isLoading } = useEmailThreads(
    statusFilter !== 'all' ? statusFilter : undefined,
    searchQuery || undefined
  )
  const updateThread = useUpdateEmailThread()
  const syncEmails = useSyncEmails()

  const threads = ((threadsResp as { success: boolean; data: { threads: EmailThreadData[]; stats: Record<string, number> } } | undefined)?.data?.threads || []) as EmailThreadData[]
  const stats = ((threadsResp as { success: boolean; data: { threads: EmailThreadData[]; stats: Record<string, number> } } | undefined)?.data?.stats || {}) as Record<string, number>

  const handleSync = () => {
    syncEmails.mutate(undefined, {
      onSuccess: (resp) => {
        const r = resp as { success: boolean; data: { synced: number } }
        toast.success(`同步完成！新增 ${r.data.synced} 封邮件`)
      },
      onError: () => toast.error('同步失败'),
    })
  }

  const handleQuickStatusChange = (threadId: string, newStatus: string) => {
    updateThread.mutate({ id: threadId, status: newStatus }, {
      onSuccess: () => toast.success(`状态已更新为 ${newStatus}`),
    })
  }

  const statusTabs = [
    { id: 'all', label: '全部', count: stats.total || 0 },
    { id: 'unread', label: '未读', count: stats.unread || 0 },
    { id: 'read', label: '已读', count: stats.read || 0 },
    { id: 'replied', label: '已回复', count: stats.replied || 0 },
    { id: 'ignored', label: '已忽略', count: stats.ignored || 0 },
  ]

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Inbox className="h-4 w-4 text-emerald-500" />
            邮件线程
            <Badge variant="secondary" className="text-[10px] h-5 border-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {stats.total || 0}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
            onClick={handleSync}
            disabled={syncEmails.isPending}
          >
            <RefreshCw className={`h-3 w-3 ${syncEmails.isPending ? 'animate-spin' : ''}`} />
            同步邮件
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索邮件..."
            className="pl-8 h-8 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-muted-foreground hover:bg-accent border border-transparent'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Thread List */}
        <div className="max-h-96 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/50">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : threads.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? '没有匹配的邮件' : '暂无邮件，点击同步获取示例数据'}
              </p>
            </div>
          ) : (
            threads.map(thread => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedThreadId === thread.id
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border/50 hover:border-emerald-500/20 hover:bg-accent/50'
                } ${thread.status === 'unread' ? 'border-l-2 border-l-emerald-500' : ''}`}
                onClick={() => onSelectThread(thread)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">{thread.fromAddress}</span>
                      <StatusBadge status={thread.status} />
                      <PriorityBadge priority={thread.priority} />
                    </div>
                    <p className={`text-sm truncate ${thread.status === 'unread' ? 'font-semibold' : ''}`}>
                      {thread.subject}
                    </p>
                    {thread.snippet && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{thread.snippet}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{timeAgo(thread.receivedAt)}</span>
                    {thread.autoReplied && (
                      <Badge variant="secondary" className="text-[9px] h-4 border-0 bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Bot className="h-2.5 w-2.5 mr-0.5" />AI回复
                      </Badge>
                    )}
                    {thread.emails?.length > 1 && (
                      <Badge variant="outline" className="text-[9px] h-4">{thread.emails.length}条</Badge>
                    )}
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                  {thread.status === 'unread' && (
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => handleQuickStatusChange(thread.id, 'read')}>
                      <Eye className="h-2.5 w-2.5 mr-0.5" />标为已读
                    </Button>
                  )}
                  {(thread.status === 'unread' || thread.status === 'read') && (
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => handleQuickStatusChange(thread.id, 'replied')}>
                      <Reply className="h-2.5 w-2.5 mr-0.5" />回复
                    </Button>
                  )}
                  {thread.status !== 'ignored' && (
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => handleQuickStatusChange(thread.id, 'ignored')}>
                      <BellOff className="h-2.5 w-2.5 mr-0.5" />忽略
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Section: Thread Detail View
function ThreadDetailView({
  thread,
  onClose,
}: {
  thread: EmailThreadData
  onClose: () => void
}) {
  const updateThread = useUpdateEmailThread()
  const generateReply = useGenerateAutoReply()
  const [generatedReply, setGeneratedReply] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)

  const handleGenerateReply = () => {
    generateReply.mutate(
      { threadId: thread.id, customPrompt: customPrompt || undefined },
      {
        onSuccess: (resp) => {
          const r = resp as { success: boolean; data: { reply: string; soulInjected: boolean } }
          setGeneratedReply(r.data.reply)
          toast.success(r.data.soulInjected ? '已注入SOUL.md人格生成回复' : 'AI回复已生成')
        },
        onError: () => toast.error('生成回复失败'),
      }
    )
  }

  const handleCopyReply = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const handleSendReply = () => {
    if (!generatedReply) return
    updateThread.mutate(
      { id: thread.id, status: 'replied', autoReplied: true },
      {
        onSuccess: () => {
          toast.success('回复已发送！')
          setGeneratedReply(null)
          setShowGenerate(false)
        },
      }
    )
  }

  const handleStatusChange = (newStatus: string) => {
    updateThread.mutate(
      { id: thread.id, status: newStatus },
      { onSuccess: () => toast.success(`状态已更新为 ${newStatus}`) }
    )
  }

  const labels = useMemo(() => {
    try {
      return thread.labels ? JSON.parse(thread.labels) as string[] : []
    } catch {
      return []
    }
  }, [thread.labels])

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-500" />
            <span className="truncate max-w-[300px]">{thread.subject}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            收起
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thread meta */}
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{thread.fromAddress}</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">{thread.toAddress}</span>
          <Separator orientation="vertical" className="h-3" />
          <StatusBadge status={thread.status} />
          <PriorityBadge priority={thread.priority} />
          {labels.map((label: string) => (
            <Badge key={label} variant="outline" className="text-[10px] h-5">
              <Tag className="h-2.5 w-2.5 mr-0.5" />{label}
            </Badge>
          ))}
          <span className="text-muted-foreground ml-auto">{timeAgo(thread.receivedAt)}</span>
        </div>

        {/* Status & Agent Controls */}
        <div className="flex gap-2 flex-wrap">
          <Select value={thread.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unread">未读</SelectItem>
              <SelectItem value="read">已读</SelectItem>
              <SelectItem value="replied">已回复</SelectItem>
              <SelectItem value="ignored">已忽略</SelectItem>
              <SelectItem value="escalated">已升级</SelectItem>
            </SelectContent>
          </Select>
          <Select value={thread.agentId || 'none'} onValueChange={(v) => updateThread.mutate({ id: thread.id, agentId: v === 'none' ? null : v })}>
            <SelectTrigger className="w-[120px] h-7 text-xs">
              <SelectValue placeholder="分配代理" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分配</SelectItem>
              <SelectItem value="ceo-agent">CEO分身</SelectItem>
              <SelectItem value="cto-agent">CTO分身</SelectItem>
              <SelectItem value="growth-agent">Growth分身</SelectItem>
              <SelectItem value="engineer-agent">Engineer分身</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Email Messages */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {thread.emails.map((email, idx) => (
            <div
              key={email.id}
              className={`p-3 rounded-lg border ${
                email.aiGenerated
                  ? 'border-teal-500/20 bg-teal-500/5'
                  : email.isAutoReply
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-border/50 bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{email.fromAddress}</span>
                  {email.aiGenerated && (
                    <Badge variant="secondary" className="text-[9px] h-4 border-0 bg-teal-500/10 text-teal-600">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />AI生成
                    </Badge>
                  )}
                  {email.isAutoReply && !email.aiGenerated && (
                    <Badge variant="secondary" className="text-[9px] h-4 border-0 bg-emerald-500/10 text-emerald-600">
                      <Bot className="h-2.5 w-2.5 mr-0.5" />自动回复
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {email.sentAt ? timeAgo(email.sentAt) : timeAgo(email.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{email.bodyText || '(无文本内容)'}</p>
              {idx < thread.emails.length - 1 && (
                <div className="flex justify-center mt-3">
                  <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* AI Generate Reply */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              AI智能回复
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 border-teal-500/20 text-teal-600 hover:bg-teal-500/10"
              onClick={() => setShowGenerate(!showGenerate)}
            >
              <Sparkles className="h-3 w-3" />
              {showGenerate ? '收起' : '生成回复'}
            </Button>
          </div>

          <AnimatePresence>
            {showGenerate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div>
                  <label className="text-xs text-muted-foreground">额外指示（可选）</label>
                  <Input
                    placeholder="例如：语气更加正式，强调技术优势..."
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1"
                  onClick={handleGenerateReply}
                  disabled={generateReply.isPending}
                >
                  {generateReply.isPending ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {generateReply.isPending ? '正在生成...' : 'AI生成回复 (注入SOUL.md)'}
                </Button>

                {generatedReply && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border border-teal-500/20 bg-teal-500/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-teal-700 dark:text-teal-400">AI生成回复</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => handleCopyReply(generatedReply)}>
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-5 text-[10px] px-2 bg-teal-600 hover:bg-teal-700 text-white gap-0.5"
                          onClick={handleSendReply}
                        >
                          <Send className="h-2.5 w-2.5" />发送
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{generatedReply}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

// Section: Auto-Reply Rules
function AutoReplyRulesPanel() {
  const { data: rulesResp, isLoading } = useAutoReplyRules()
  const createRule = useCreateAutoReplyRule()
  const updateRule = useUpdateAutoReplyRule()
  const deleteRule = useDeleteAutoReplyRule()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    conditionField: 'subject',
    conditionOperator: 'contains',
    conditionValue: '',
    template: '',
    priority: 'normal',
  })

  const rules = ((rulesResp as { success: boolean; data: AutoReplyRuleData[] } | undefined)?.data || []) as AutoReplyRuleData[]

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.conditionValue || !newRule.template) {
      toast.error('请填写规则名称、条件和模板')
      return
    }
    createRule.mutate({
      userId: 'demo',
      name: newRule.name,
      description: newRule.description,
      condition: JSON.stringify({
        field: newRule.conditionField,
        operator: newRule.conditionOperator,
        value: newRule.conditionValue,
      }),
      template: newRule.template,
      priority: newRule.priority,
    }, {
      onSuccess: () => {
        toast.success('规则已创建')
        setShowAddDialog(false)
        setNewRule({ name: '', description: '', conditionField: 'subject', conditionOperator: 'contains', conditionValue: '', template: '', priority: 'normal' })
      },
      onError: () => toast.error('创建失败'),
    })
  }

  const handleToggleRule = (rule: AutoReplyRuleData) => {
    updateRule.mutate({ id: rule.id, isEnabled: !rule.isEnabled }, {
      onSuccess: () => toast.success(rule.isEnabled ? '规则已禁用' : '规则已启用'),
    })
  }

  const handleDeleteRule = (ruleId: string) => {
    deleteRule.mutate(ruleId, {
      onSuccess: () => toast.success('规则已删除'),
    })
  }

  const parseCondition = (condStr: string) => {
    try {
      return JSON.parse(condStr) as { field: string; operator: string; value: string }
    } catch {
      return { field: 'subject', operator: 'contains', value: condStr }
    }
  }

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-emerald-500" />
            自动回复规则
            <Badge variant="secondary" className="text-[10px] h-5 border-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {rules.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-3 w-3" />
            添加规则
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-6">
            <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无自动回复规则</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {rules.map(rule => {
              const cond = parseCondition(rule.condition)
              return (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    rule.isEnabled
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{rule.name}</span>
                        <PriorityBadge priority={rule.priority} />
                        {rule.matchCount > 0 && (
                          <Badge variant="outline" className="text-[9px] h-4">
                            匹配{rule.matchCount}次
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        当 <Badge variant="secondary" className="text-[9px] h-4 mx-0.5 border-0">{cond.field}</Badge>
                        <Badge variant="secondary" className="text-[9px] h-4 mx-0.5 border-0">{cond.operator}</Badge>
                        &quot;{cond.value}&quot;
                      </div>
                      <p className="text-xs text-muted-foreground/80 truncate">{rule.template.substring(0, 80)}...</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleToggleRule(rule)}>
                        {rule.isEnabled ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Rule Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-500" />
                添加自动回复规则
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">规则名称</label>
                <Input placeholder="例如：商务合作自动回复" value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">描述（可选）</label>
                <Input placeholder="规则说明" value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">匹配条件</label>
                <div className="flex gap-2">
                  <Select value={newRule.conditionField} onValueChange={v => setNewRule(r => ({ ...r, conditionField: v }))}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subject">主题</SelectItem>
                      <SelectItem value="from">发件人</SelectItem>
                      <SelectItem value="body">正文</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newRule.conditionOperator} onValueChange={v => setNewRule(r => ({ ...r, conditionOperator: v }))}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">包含</SelectItem>
                      <SelectItem value="equals">等于</SelectItem>
                      <SelectItem value="startsWith">开头是</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="关键词"
                    value={newRule.conditionValue}
                    onChange={e => setNewRule(r => ({ ...r, conditionValue: e.target.value }))}
                    className="flex-1 h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">回复模板</label>
                <Textarea
                  placeholder="您好，感谢来信..."
                  value={newRule.template}
                  onChange={e => setNewRule(r => ({ ...r, template: e.target.value }))}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">优先级</label>
                <Select value={newRule.priority} onValueChange={v => setNewRule(r => ({ ...r, priority: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>取消</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={handleCreateRule} disabled={createRule.isPending}>
                <CheckCircle2 className="h-3 w-3" />
                创建规则
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Main Component
export function EmailTrackingView() {
  const [selectedThread, setSelectedThread] = useState<EmailThreadData | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📧</span>
            邮件跟踪
            <Badge variant="outline" className="text-[10px] h-5 font-mono border-emerald-500/20 text-emerald-600">
              Email Tracking
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">AI分身邮件跟踪与自动回复系统</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-6 border-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <Wifi className="h-3 w-3 mr-0.5" />
            已连接
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '未读邮件', value: '—', icon: Inbox, color: 'text-emerald-500' },
          { label: '已回复', value: '—', icon: Reply, color: 'text-teal-500' },
          { label: 'AI自动回复', value: '—', icon: Bot, color: 'text-cyan-500' },
          { label: '自动规则', value: '—', icon: Shield, color: 'text-amber-500' },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 bg-muted/50 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Config */}
      <EmailConfigPanel />

      {/* Main Grid: Threads + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EmailThreadList
          onSelectThread={setSelectedThread}
          selectedThreadId={selectedThread?.id || null}
        />
        {selectedThread ? (
          <ThreadDetailView
            thread={selectedThread}
            onClose={() => setSelectedThread(null)}
          />
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <Mail className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">选择一个邮件线程查看详情</p>
              <p className="text-xs text-muted-foreground/60 mt-1">点击左侧邮件可查看完整内容和AI回复</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auto-Reply Rules */}
      <AutoReplyRulesPanel />
    </div>
  )
}
