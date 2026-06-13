'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network, Users, ListTodo, MessageSquare, Zap, Activity, ArrowRight, Send,
  Plus, RefreshCw, ChevronRight, Clock, AlertCircle, CheckCircle2,
  Circle, Loader2, Wifi, WifiOff, Play, Eye, BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useSwarmStatus,
  useSwarmAgents,
  useSwarmTasks,
  useSwarmTopology,
  useSwarmMessages,
  useCreateSwarmTask,
  useInitSwarm,
  useDistributeTasks,
  useSendSwarmMessage,
} from '@/lib/api-hooks'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SwarmAgent {
  id: string
  name: string
  role: string
  status: 'idle' | 'working' | 'sleeping' | 'error'
  workload: number
  capabilities: string[]
  domain: string
  avatar: string
  level: number
  experience: number
  lastActiveAt: string
}

interface SwarmTask {
  id: string
  title: string
  description: string
  priority: number
  taskType: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed'
  assignedTo: string | null
  assignedAgentName: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  distributionReason: string | null
}

interface SwarmMsg {
  id: string
  from: string
  fromName: string
  to: string
  toName: string
  type: 'task_assign' | 'task_complete' | 'help_request' | 'knowledge_share' | 'status_update' | 'coordination'
  content: string
  timestamp: string
}

interface RoutingScoreEntry {
  agentId: string
  agentName: string
  capabilityMatch: number
  workloadFactor: number
  domainExpertise: number
  availability: number
  totalScore: number
}

// ─── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  idle: { color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20', label: '空闲' },
  working: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: '工作中' },
  sleeping: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: '休眠' },
  error: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', label: '异常' },
}

const MSG_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  task_assign: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: ArrowRight, label: '任务分配' },
  task_complete: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: '任务完成' },
  help_request: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertCircle, label: '请求帮助' },
  knowledge_share: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Zap, label: '知识共享' },
  status_update: { color: 'text-cyan-500', bg: 'bg-cyan-500/10', icon: Activity, label: '状态更新' },
  coordination: { color: 'text-teal-500', bg: 'bg-teal-500/10', icon: Users, label: '协调沟通' },
}

const TASK_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: '待分配' },
  assigned: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', label: '已分配' },
  in_progress: { color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20', label: '进行中' },
  completed: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: '已完成' },
}

// ─── Fallback data ──────────────────────────────────────────────────────────────

const FALLBACK_AGENTS: SwarmAgent[] = [
  { id: 'agent-ceo', name: '飘叔CEO分身', role: 'CEO', status: 'idle', workload: 35, capabilities: ['战略决策', '愿景规划', '合作伙伴'], domain: 'strategy', avatar: '👑', level: 8, experience: 2450, lastActiveAt: new Date(Date.now() - 300000).toISOString() },
  { id: 'agent-cto', name: '技术总监分身', role: 'CTO', status: 'working', workload: 72, capabilities: ['架构设计', '代码审查', '技术债务'], domain: 'engineering', avatar: '💻', level: 7, experience: 1980, lastActiveAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'agent-growth', name: '增长引擎分身', role: 'Growth', status: 'idle', workload: 48, capabilities: ['用户获取', '内容营销', '数据分析'], domain: 'growth', avatar: '🚀', level: 6, experience: 1520, lastActiveAt: new Date(Date.now() - 600000).toISOString() },
  { id: 'agent-engineer', name: '工程执行分身', role: 'Engineer', status: 'working', workload: 85, capabilities: ['代码实现', '部署运维', 'CI/CD'], domain: 'engineering', avatar: '🔧', level: 9, experience: 3200, lastActiveAt: new Date(Date.now() - 60000).toISOString() },
  { id: 'agent-design', name: '设计创意分身', role: 'Designer', status: 'idle', workload: 20, capabilities: ['UI设计', '品牌视觉', '交互原型'], domain: 'design', avatar: '🎨', level: 5, experience: 980, lastActiveAt: new Date(Date.now() - 900000).toISOString() },
  { id: 'agent-data', name: '数据分析分身', role: 'DataAnalyst', status: 'sleeping', workload: 10, capabilities: ['数据建模', 'BI报表', '预测分析'], domain: 'data', avatar: '📊', level: 6, experience: 1650, lastActiveAt: new Date(Date.now() - 1800000).toISOString() },
]

const FALLBACK_ROUTING_SCORES: RoutingScoreEntry[][] = [
  [
    { agentId: 'agent-engineer', agentName: '工程执行', capabilityMatch: 95, workloadFactor: 30, domainExpertise: 90, availability: 40, totalScore: 72 },
    { agentId: 'agent-cto', agentName: '技术总监', capabilityMatch: 80, workloadFactor: 55, domainExpertise: 85, availability: 50, totalScore: 68 },
    { agentId: 'agent-data', agentName: '数据分析', capabilityMatch: 40, workloadFactor: 85, domainExpertise: 30, availability: 90, totalScore: 55 },
    { agentId: 'agent-growth', agentName: '增长引擎', capabilityMatch: 25, workloadFactor: 60, domainExpertise: 15, availability: 70, totalScore: 40 },
    { agentId: 'agent-design', agentName: '设计创意', capabilityMatch: 15, workloadFactor: 80, domainExpertise: 10, availability: 90, totalScore: 42 },
    { agentId: 'agent-ceo', agentName: 'CEO分身', capabilityMatch: 20, workloadFactor: 50, domainExpertise: 25, availability: 85, totalScore: 42 },
  ],
]

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function AgentNode({ agent, isSelected, onClick }: { agent: SwarmAgent; isSelected: boolean; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all cursor-pointer hover:scale-105 ${
        isSelected ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'border-border bg-card hover:border-cyan-500/30'
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="text-2xl">{agent.avatar}</div>
      <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{agent.name.replace('分身', '')}</span>
      <Badge variant="outline" className={`text-[9px] h-4 px-1 border-0 ${statusCfg.bg} ${statusCfg.color}`}>
        {statusCfg.label}
      </Badge>
      {/* Workload bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${agent.workload}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: agent.workload > 80 ? '#ef4444' : agent.workload > 50 ? '#f59e0b' : '#06b6d4',
          }}
        />
      </div>
      <span className="text-[8px] text-muted-foreground">{agent.workload}%</span>
    </motion.button>
  )
}

function ConnectionLine({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <motion.line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-cyan-500/30"
        strokeDasharray="4 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />
      <motion.circle
        r={2}
        fill="currentColor"
        className="text-cyan-400"
        initial={{ cx: from.x, cy: from.y }}
        animate={{ cx: [from.x, to.x], cy: [from.y, to.y] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function TaskCard({ task, onAdvance }: { task: SwarmTask; onAdvance: (id: string) => void }) {
  const statusCfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending
  const priorityColor = task.priority >= 8 ? 'bg-red-500' : task.priority >= 5 ? 'bg-amber-500' : 'bg-cyan-500'
  const canAdvance = task.status !== 'completed'

  return (
    <motion.div
      layout
      className="rounded-lg border border-border bg-card p-3 space-y-2 hover:border-cyan-500/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground leading-tight">{task.title}</h4>
        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 shrink-0 border-0 ${statusCfg.bg} ${statusCfg.color}`}>
          {statusCfg.label}
        </Badge>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} />
          <span className="text-[10px] text-muted-foreground">P{task.priority}</span>
        </div>
        <Badge variant="secondary" className="text-[9px] h-4 border-0">{task.taskType}</Badge>
        {task.assignedAgentName && (
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400">{task.assignedAgentName}</span>
        )}
      </div>
      {task.distributionReason && (
        <p className="text-[10px] text-muted-foreground italic border-l-2 border-cyan-500/30 pl-2">
          {task.distributionReason}
        </p>
      )}
      {canAdvance && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-6 text-[10px] gap-1 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
          onClick={() => onAdvance(task.id)}
        >
          <ArrowRight className="h-3 w-3" />
          推进状态
        </Button>
      )}
    </motion.div>
  )
}

function MessageBubble({ msg }: { msg: SwarmMsg }) {
  const cfg = MSG_TYPE_CONFIG[msg.type] || MSG_TYPE_CONFIG.coordination
  const Icon = cfg.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2 py-2"
    >
      <div className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${cfg.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-foreground">{msg.fromName}</span>
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">{msg.toName}</span>
          <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border-0 ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </Badge>
          <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
            {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{msg.content}</p>
      </div>
    </motion.div>
  )
}

function ScoreBar({ label, value, maxVal = 100, color = 'bg-cyan-500' }: { label: string; value: number; maxVal?: number; color?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono font-medium text-foreground">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(value / maxVal) * 100}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function SwarmCoordinator() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 5, taskType: 'general' })
  const [msgForm, setMsgForm] = useState({ from: 'agent-ceo', to: 'broadcast', type: 'coordination', content: '' })
  const [topologyType, setTopologyType] = useState('hierarchical')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Data hooks
  const { data: statusData, isLoading: statusLoading } = useSwarmStatus()
  const { data: agentsData, isLoading: agentsLoading } = useSwarmAgents()
  const { data: tasksData, isLoading: tasksLoading } = useSwarmTasks()
  const { data: topologyData, isLoading: topologyLoading } = useSwarmTopology()
  const { data: messagesData, isLoading: messagesLoading } = useSwarmMessages()

  const createTaskMutation = useCreateSwarmTask()
  const initSwarmMutation = useInitSwarm()
  const distributeMutation = useDistributeTasks()
  const sendMessageMutation = useSendSwarmMessage()

  // Derived data with fallbacks
  const agents: SwarmAgent[] = agentsData?.data?.agents || FALLBACK_AGENTS
  const tasks: SwarmTask[] = tasksData?.data?.tasks || []
  const messages: SwarmMsg[] = messagesData?.data?.messages || []
  const status = statusData?.data
  const topology = topologyData?.data?.topology
  const serviceOnline = !!statusData?.ok

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handlers
  const handleCreateTask = useCallback(async () => {
    if (!newTask.title.trim()) return
    try {
      await createTaskMutation.mutateAsync(newTask)
      toast.success('任务创建成功')
      setCreateTaskOpen(false)
      setNewTask({ title: '', description: '', priority: 5, taskType: 'general' })
    } catch {
      toast.error('任务创建失败')
    }
  }, [newTask, createTaskMutation])

  const handleInitSwarm = useCallback(async () => {
    try {
      await initSwarmMutation.mutateAsync({ topologyType })
      toast.success(`蜂群已初始化 (${topologyType})`)
    } catch {
      toast.error('初始化失败')
    }
  }, [topologyType, initSwarmMutation])

  const handleDistribute = useCallback(async () => {
    try {
      const result = await distributeMutation.mutateAsync()
      const dist = (result as Record<string, unknown>)?.distributed || 0
      toast.success(`已分配 ${dist} 个任务`)
    } catch {
      toast.error('任务分配失败')
    }
  }, [distributeMutation])

  const handleSendMessage = useCallback(async () => {
    if (!msgForm.content.trim()) return
    try {
      await sendMessageMutation.mutateAsync(msgForm)
      setMsgForm(prev => ({ ...prev, content: '' }))
      toast.success('消息已发送')
    } catch {
      toast.error('消息发送失败')
    }
  }, [msgForm, sendMessageMutation])

  const handleAdvanceTask = useCallback(async (taskId: string) => {
    try {
      await fetch('/api/swarm/tasks?XTransformPort=3006', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance', taskId }),
      })
      toast.success('任务状态已推进')
    } catch {
      toast.error('操作失败')
    }
  }, [])

  // Group tasks by status for kanban
  const taskColumns = [
    { id: 'pending', label: '待分配', tasks: tasks.filter(t => t.status === 'pending') },
    { id: 'assigned', label: '已分配', tasks: tasks.filter(t => t.status === 'assigned') },
    { id: 'in_progress', label: '进行中', tasks: tasks.filter(t => t.status === 'in_progress') },
    { id: 'completed', label: '已完成', tasks: tasks.filter(t => t.status === 'completed') },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">蜂群协作</h2>
            <p className="text-xs text-muted-foreground">Swarm Coordinator · 多分身智能协同</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[10px] h-6 border-0 ${serviceOnline ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
            {serviceOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {serviceOnline ? '在线' : '离线'}
          </Badge>
          {status && (
            <>
              <Badge variant="secondary" className="text-[10px] h-6 border-0">
                {status.topologyType || 'hierarchical'}
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-6 border-0">
                {status.agentCount} 分身
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statusLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <Card className="border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/20">
                  <Users className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{status?.activeAgents || agents.filter(a => a.status !== 'sleeping').length}</p>
                  <p className="text-[10px] text-muted-foreground">活跃分身</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/20">
                  <ListTodo className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{status?.taskStats?.pending || tasks.filter(t => t.status === 'pending').length}</p>
                  <p className="text-[10px] text-muted-foreground">待分配任务</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/20">
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{status?.avgWorkload || Math.round(agents.reduce((s, a) => s + a.workload, 0) / agents.length)}%</p>
                  <p className="text-[10px] text-muted-foreground">平均负载</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/20">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{status?.messageCount || messages.length}</p>
                  <p className="text-[10px] text-muted-foreground">通信消息</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="topology" className="space-y-3">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="topology" className="gap-1.5 text-xs">
            <Network className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">蜂群拓扑</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-xs">
            <ListTodo className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">任务面板</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">分身通信</span>
          </TabsTrigger>
          <TabsTrigger value="routing" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">注意力路由</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Swarm Topology */}
        <TabsContent value="topology" className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={topologyType} onValueChange={setTopologyType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="拓扑类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hierarchical">层级式</SelectItem>
                <SelectItem value="mesh">网状</SelectItem>
                <SelectItem value="centralized">中心化</SelectItem>
                <SelectItem value="hybrid">混合式</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700 shadow-md shadow-cyan-500/20"
              onClick={handleInitSwarm}
              disabled={initSwarmMutation.isPending}
            >
              {initSwarmMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Init Swarm
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-cyan-500" />
                Agent Network
                <Badge variant="outline" className="text-[9px] h-4 border-0 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  {topology?.type || 'hierarchical'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <AnimatePresence>
                    {agents.map(agent => (
                      <AgentNode
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedAgentId === agent.id}
                        onClick={() => setSelectedAgentId(selectedAgentId === agent.id ? null : agent.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Topology connections visualization */}
              {topology && topology.connections.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-2">拓扑连接 ({topology.connections.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topology.connections.map((conn, i) => {
                      const from = agents.find(a => a.id === conn[0])
                      const to = agents.find(a => a.id === conn[1])
                      return (
                        <Badge key={i} variant="outline" className="text-[9px] h-5 gap-0.5 border-cyan-500/20 bg-cyan-500/5">
                          {from?.avatar || '?'} <ChevronRight className="h-2.5 w-2.5 text-cyan-500/50" /> {to?.avatar || '?'}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Detail Panel */}
          <AnimatePresence>
            {selectedAgent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-cyan-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="text-xl">{selectedAgent.avatar}</span>
                      {selectedAgent.name}
                      <Badge variant="outline" className={`text-[9px] h-4 border-0 ${STATUS_CONFIG[selectedAgent.status]?.bg} ${STATUS_CONFIG[selectedAgent.status]?.color}`}>
                        {STATUS_CONFIG[selectedAgent.status]?.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] h-4 border-0">Lv.{selectedAgent.level}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">角色</p>
                        <p className="text-sm font-medium">{selectedAgent.role}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">领域</p>
                        <p className="text-sm font-medium">{selectedAgent.domain}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">经验值</p>
                        <p className="text-sm font-medium font-mono">{selectedAgent.experience.toLocaleString()}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">负载</p>
                        <p className="text-sm font-medium font-mono">{selectedAgent.workload}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">能力</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedAgent.capabilities.map(cap => (
                          <Badge key={cap} variant="secondary" className="text-[10px] h-5 border-0 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      最后活跃: {new Date(selectedAgent.lastActiveAt).toLocaleString('zh-CN')}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Tab 2: Task Board */}
        <TabsContent value="tasks" className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700 shadow-md shadow-cyan-500/20">
                  <Plus className="h-3.5 w-3.5" />
                  创建任务
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新任务</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder="任务标题"
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder="任务描述（可选）"
                    value={newTask.description}
                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={String(newTask.priority)} onValueChange={v => setNewTask(prev => ({ ...prev, priority: Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="优先级" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>P{n} {n >= 8 ? '🔴' : n >= 5 ? '🟡' : '🟢'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newTask.taskType} onValueChange={v => setNewTask(prev => ({ ...prev, taskType: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="任务类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">工程</SelectItem>
                        <SelectItem value="strategy">战略</SelectItem>
                        <SelectItem value="growth">增长</SelectItem>
                        <SelectItem value="design">设计</SelectItem>
                        <SelectItem value="analytics">分析</SelectItem>
                        <SelectItem value="communication">沟通</SelectItem>
                        <SelectItem value="general">通用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white"
                    onClick={handleCreateTask}
                    disabled={createTaskMutation.isPending || !newTask.title.trim()}
                  >
                    {createTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    创建
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
              onClick={handleDistribute}
              disabled={distributeMutation.isPending}
            >
              {distributeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              智能分配
            </Button>
          </div>

          {/* Kanban Board */}
          {tasksLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {taskColumns.map(column => (
                <div key={column.id} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        column.id === 'pending' ? 'bg-amber-500' :
                        column.id === 'assigned' ? 'bg-blue-500' :
                        column.id === 'in_progress' ? 'bg-cyan-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-xs font-medium text-foreground">{column.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] h-4 border-0">{column.tasks.length}</Badge>
                  </div>
                  <ScrollArea className="h-72">
                    <div className="space-y-2 pr-1">
                      {column.tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Circle className="h-6 w-6 mb-1 opacity-30" />
                          <span className="text-[10px]">空</span>
                        </div>
                      ) : (
                        column.tasks.map(task => (
                          <TaskCard key={task.id} task={task} onAdvance={handleAdvanceTask} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          )}

          {/* Distribution Log */}
          {tasks.filter(t => t.distributionReason).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-500" />
                  分配日志
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-40">
                  <div className="space-y-1.5">
                    {tasks.filter(t => t.distributionReason).map(task => (
                      <div key={task.id} className="flex items-start gap-2 text-xs">
                        <Badge variant="outline" className="text-[9px] h-4 shrink-0 border-0 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          {task.taskType}
                        </Badge>
                        <span className="text-foreground font-medium">{task.title}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-cyan-600 dark:text-cyan-400">{task.assignedAgentName}</span>
                        <span className="text-muted-foreground line-clamp-1 flex-1">({task.distributionReason})</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Agent Messages */}
        <TabsContent value="messages" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-500" />
                实时通信
                <Badge variant="secondary" className="text-[9px] h-4 border-0">{messages.length} 条消息</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                    <span className="text-xs">暂无消息</span>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Send Message Form */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Select value={msgForm.from} onValueChange={v => setMsgForm(prev => ({ ...prev, from: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="发送者" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.avatar} {a.name.replace('分身', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={msgForm.to} onValueChange={v => setMsgForm(prev => ({ ...prev, to: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="接收者" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broadcast">📢 全体</SelectItem>
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.avatar} {a.name.replace('分身', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={msgForm.type} onValueChange={v => setMsgForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task_assign">任务分配</SelectItem>
                    <SelectItem value="task_complete">任务完成</SelectItem>
                    <SelectItem value="help_request">请求帮助</SelectItem>
                    <SelectItem value="knowledge_share">知识共享</SelectItem>
                    <SelectItem value="coordination">协调沟通</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="输入消息内容..."
                  value={msgForm.content}
                  onChange={e => setMsgForm(prev => ({ ...prev, content: e.target.value }))}
                  className="h-8 text-xs"
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 bg-gradient-to-r from-cyan-500 to-teal-600 text-white"
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !msgForm.content.trim()}
                >
                  {sendMessageMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Attention Router */}
        <TabsContent value="routing" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-500" />
                注意力路由评分
                <Badge variant="outline" className="text-[9px] h-4 border-0 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  最近分配
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {FALLBACK_ROUTING_SCORES.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-xs">暂无路由记录</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {FALLBACK_ROUTING_SCORES[0].map((entry, idx) => {
                    const agent = agents.find(a => a.id === entry.agentId)
                    return (
                      <motion.div
                        key={entry.agentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg border ${idx === 0 ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-border'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{agent?.avatar || '🤖'}</span>
                            <div>
                              <span className="text-sm font-medium text-foreground">{entry.agentName}</span>
                              {idx === 0 && (
                                <Badge className="ml-2 text-[8px] h-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-0">
                                  最佳匹配
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">{entry.totalScore}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <ScoreBar label="能力匹配" value={entry.capabilityMatch} color="bg-cyan-500" />
                          <ScoreBar label="负载因子" value={entry.workloadFactor} color="bg-emerald-500" />
                          <ScoreBar label="领域专长" value={entry.domainExpertise} color="bg-purple-500" />
                          <ScoreBar label="可用性" value={entry.availability} color="bg-amber-500" />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Routing Weights Explanation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-500" />
                路由权重配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 space-y-1">
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">35%</p>
                  <p className="text-xs font-medium text-foreground">能力匹配</p>
                  <p className="text-[10px] text-muted-foreground">分身能力与任务类型的匹配度</p>
                </div>
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">25%</p>
                  <p className="text-xs font-medium text-foreground">负载因子</p>
                  <p className="text-[10px] text-muted-foreground">当前负载越低得分越高</p>
                </div>
                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-1">
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">25%</p>
                  <p className="text-xs font-medium text-foreground">领域专长</p>
                  <p className="text-[10px] text-muted-foreground">基于等级和经验的专长评分</p>
                </div>
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1">
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">15%</p>
                  <p className="text-xs font-medium text-foreground">可用性</p>
                  <p className="text-[10px] text-muted-foreground">分身当前状态决定可调度性</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Routing Decisions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-500" />
                历史路由决策
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {tasks.filter(t => t.distributionReason).slice(0, 5).map((task, i) => (
                    <div key={task.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[9px] font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-foreground font-medium truncate">{task.title}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-cyan-600 dark:text-cyan-400 shrink-0">{task.assignedAgentName}</span>
                      <span className="text-muted-foreground ml-auto text-[10px] shrink-0">
                        {new Date(task.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
