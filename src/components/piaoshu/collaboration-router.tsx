'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Network,
  Send,
  Users,
  Bot,
  Crown,
  CircleDot,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  GitBranch,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { useTasks, useCreateTask, useUpdateTask } from '@/lib/api-hooks'
import { useWebSocket } from '@/lib/use-websocket'

// ─── Types ───────────────────────────────────────────────────────────────────

type Complexity = 'low' | 'medium' | 'high' | 'critical'
type Category = 'code' | 'design' | 'research' | 'creative'
type Assignment = 'auto' | 'ai' | 'human'
type TaskStatus = 'open' | 'in_progress' | 'review' | 'completed'
type NodeType = 'ai' | 'human' | 'founder'
type NodeStatus = 'online' | 'offline'
type PaymentStatus = 'confirmed' | 'pending' | 'failed'

interface ApiTask {
  id: string
  title: string
  description?: string | null
  complexity: string
  category: string
  reward: number
  rewardToken: string
  status: string
  assigneeType: string
  ciStatus: string
  safetyScan: string
  createdAt: string
  payments?: { id: string; amount: number; token: string; txHash?: string | null; status: string; createdAt: string }[]
}

interface NetworkNode {
  id: string
  label: string
  type: NodeType
  status: NodeStatus
}

interface PaymentRecord {
  id: string
  taskTitle: string
  amount: number
  token: string
  txHash: string
  status: PaymentStatus
  timestamp: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const COMPLEXITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: '低', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  medium: { label: '中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  critical: { label: '关键', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  code: { label: '代码', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: <GitBranch className="h-3 w-3" /> },
  design: { label: '设计', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: <CircleDot className="h-3 w-3" /> },
  research: { label: '调研', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: <Network className="h-3 w-3" /> },
  creative: { label: '创意', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Zap className="h-3 w-3" /> },
}

const INITIAL_NETWORK_NODES: NetworkNode[] = [
  { id: 'n0', label: '创始人 (you)', type: 'founder', status: 'online' },
  { id: 'n1', label: 'AI-Analyst-01', type: 'ai', status: 'online' },
  { id: 'n2', label: 'AI-Coder-02', type: 'ai', status: 'online' },
  { id: 'n3', label: 'dev-0x7f', type: 'human', status: 'online' },
  { id: 'n4', label: 'designer-alice', type: 'human', status: 'offline' },
  { id: 'n5', label: 'researcher-bob', type: 'human', status: 'online' },
  { id: 'n6', label: 'AI-Reviewer-03', type: 'ai', status: 'online' },
  { id: 'n7', label: 'dev-0xa3', type: 'human', status: 'online' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNodeIcon(type: NodeType) {
  switch (type) {
    case 'ai':
      return <Bot className="h-4 w-4" />
    case 'human':
      return <Users className="h-4 w-4" />
    case 'founder':
      return <Crown className="h-4 w-4" />
  }
}

function getNodeStyle(type: NodeType) {
  switch (type) {
    case 'ai':
      return 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
    case 'human':
      return 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-950/40 dark:text-teal-400'
    case 'founder':
      return 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
  }
}

function getPaymentStatusStyle(status: string) {
  switch (status) {
    case 'confirmed': return 'text-emerald-600 dark:text-emerald-400'
    case 'pending': return 'text-amber-600 dark:text-amber-400'
    case 'failed': return 'text-red-600 dark:text-red-400'
    default: return 'text-muted-foreground'
  }
}

function getPaymentStatusIcon(status: string) {
  switch (status) {
    case 'confirmed': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    case 'pending': return <Clock className="h-3.5 w-3.5 text-amber-500" />
    case 'failed': return <AlertCircle className="h-3.5 w-3.5 text-red-500" />
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

// Map API task status to kanban column key
function mapTaskStatus(status: string): TaskStatus {
  switch (status) {
    case 'open':
    case 'assigned':
      return 'open'
    case 'in_progress':
      return 'in_progress'
    case 'review':
      return 'review'
    case 'completed':
      return 'completed'
    default:
      return 'open'
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, description }: { icon: React.ReactNode; label: string; value: string | number; description: string }) {
  return (
    <Card className="relative overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskCard({ task }: { task: ApiTask }) {
  const comp = COMPLEXITY_CONFIG[task.complexity] ?? COMPLEXITY_CONFIG.medium
  const cat = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG.code

  return (
    <Card className="border-border/50 transition-all hover:shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700">
      <CardContent className="p-3 sm:p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
          <span className="flex items-center gap-1 shrink-0">
            <span className={`h-1.5 w-1.5 rounded-full ${comp.dot}`} />
            <span className="text-[10px] font-medium text-muted-foreground">{comp.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 gap-0.5 font-medium ${cat.color}`}>
            {cat.icon}
            {cat.label}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${comp.color}`}>
            {comp.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {task.reward} {task.rewardToken}
          </span>
          {task.assigneeType && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CircleDot className="h-3 w-3" />
              {task.assigneeType}
            </span>
          )}
        </div>

        {(task.ciStatus !== 'pending' || task.safetyScan !== 'pending') && (
          <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-border/40">
            {task.ciStatus && task.ciStatus !== 'pending' && (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                CI: {task.ciStatus === 'passed' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">passed ✓</span>
                ) : (
                  <span className="text-red-500 font-medium">{task.ciStatus} ✗</span>
                )}
              </span>
            )}
            {task.safetyScan && task.safetyScan !== 'pending' && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Safety: {task.safetyScan === 'passed' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">passed ✓</span>
                ) : task.safetyScan === 'scanning' ? (
                  <span className="text-amber-500 font-medium">scanning...</span>
                ) : (
                  <span className="text-red-500 font-medium">failed ✗</span>
                )}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sortable TaskCard wrapper
function SortableTaskCard({ task }: { task: ApiTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <TaskCard task={task} />
    </div>
  )
}

function KanbanColumn({ id, title, count, tasks, accentColor, footer }: { id: string; title: string; count: number; tasks: ApiTask[]; accentColor: string; footer?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-0 rounded-lg p-2 -m-2 transition-colors duration-200 ${
        isOver ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`h-2 w-2 rounded-full ${accentColor}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary" className="h-5 text-[10px] px-1.5 font-mono">{count}</Badge>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 flex-1">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
      {footer}
    </div>
  )
}

function NetworkNodeCard({ node, isCenter }: { node: NetworkNode; isCenter: boolean }) {
  return (
    <div
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
        ${getNodeStyle(node.type)}
        ${isCenter ? 'ring-2 ring-amber-300 dark:ring-amber-600 scale-105' : ''}
        ${node.status === 'offline' ? 'opacity-50' : ''}
      `}
    >
      {/* Connection indicator dot */}
      <span
        className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
          node.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
        }`}
      />

      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
        node.type === 'founder'
          ? 'bg-amber-200 dark:bg-amber-800/60'
          : node.type === 'ai'
          ? 'bg-emerald-200 dark:bg-emerald-800/60'
          : 'bg-teal-200 dark:bg-teal-800/60'
      }`}>
        {getNodeIcon(node.type)}
      </div>

      <span className="text-[10px] font-semibold text-center leading-tight max-w-[80px] truncate">
        {node.label}
      </span>

      <Badge
        variant="secondary"
        className={`text-[9px] px-1 py-0 h-4 ${
          node.type === 'ai'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            : node.type === 'human'
            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
        }`}
      >
        {node.type === 'ai' ? 'AI节点' : node.type === 'human' ? '人类节点' : '创始人节点'}
      </Badge>

      <span className={`text-[9px] font-medium ${node.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
        {node.status === 'online' ? '在线' : '离线'}
      </span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CollaborationRouterView() {
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [complexity, setComplexity] = useState<Complexity | ''>('')
  const [category, setCategory] = useState<Category | ''>('')
  const [reward, setReward] = useState('')
  const [rewardToken, setRewardToken] = useState('USDT')
  const [deadline, setDeadline] = useState('')
  const [assignment, setAssignment] = useState<Assignment | ''>('')
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>(INITIAL_NETWORK_NODES)

  const { data, isLoading, error } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const queryClient = useQueryClient()
  const { emit } = useWebSocket({
    onEvent: useCallback((event) => {
      switch (event.type) {
        case 'task:updated':
        case 'task:created':
          // Invalidate react-query cache for tasks
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          break
        case 'node:status': {
          // Update network node status
          const nodeData = event.data as { nodeId: string; status: 'online' | 'offline'; label?: string }
          if (nodeData?.nodeId && nodeData?.status) {
            setNetworkNodes(prev => prev.map(node =>
              node.id === nodeData.nodeId
                ? { ...node, status: nodeData.status, label: nodeData.label || node.label }
                : node
            ))
          }
          break
        }
      }
    }, [queryClient]),
  })

  const tasks = (data?.tasks ?? []) as ApiTask[]

  // DnD state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback is handled by isOver on droppable columns
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Determine target column - over.id could be a column id or a task id
    const overId = over.id as string
    let targetStatus: TaskStatus | null = null

    // Check if dropped on a column directly
    const columnIds: TaskStatus[] = ['open', 'in_progress', 'review', 'completed']
    if (columnIds.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus
    } else {
      // Dropped on a task - find that task's column
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        targetStatus = mapTaskStatus(overTask.status)
      }
    }

    if (!targetStatus) return

    // Find the dragged task
    const draggedTask = tasks.find(t => t.id === active.id as string)
    if (!draggedTask) return

    // Check if status actually changed
    const currentStatus = mapTaskStatus(draggedTask.status)
    if (currentStatus === targetStatus) return

    // Update the task status
    try {
      await updateTask.mutateAsync({ id: draggedTask.id, status: targetStatus })
      // Broadcast task update via WebSocket
      emit('task:updated', { taskId: draggedTask.id, status: targetStatus, title: draggedTask.title })
      toast.success(`任务已移至「${
        targetStatus === 'open' ? '开放' :
        targetStatus === 'in_progress' ? '进行中' :
        targetStatus === 'review' ? '审核中' : '已完成'
      }」`)
    } catch {
      toast.error('任务状态更新失败')
    }
  }, [tasks, updateTask, emit])

  // Group tasks by kanban status
  const kanbanGroups = useMemo(() => {
    const groups: Record<TaskStatus, ApiTask[]> = {
      open: [],
      in_progress: [],
      review: [],
      completed: [],
    }
    for (const task of tasks) {
      const key = mapTaskStatus(task.status)
      groups[key].push(task)
    }
    return groups
  }, [tasks])

  // Collect all payment records from tasks
  const paymentRecords: PaymentRecord[] = useMemo(() => {
    const records: PaymentRecord[] = []
    for (const task of tasks) {
      if (task.payments) {
        for (const p of task.payments) {
          records.push({
            id: p.id,
            taskTitle: task.title,
            amount: p.amount,
            token: p.token,
            txHash: p.txHash ? p.txHash.slice(0, 6) + '…' + p.txHash.slice(-4) : '—',
            status: p.status as PaymentStatus,
            timestamp: new Date(p.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          })
        }
      }
    }
    return records
  }, [tasks])

  const completedCount = kanbanGroups.completed.length
  const completedTotalReward = kanbanGroups.completed.reduce((sum, t) => sum + t.reward, 0)
  const totalRewardPool = tasks.filter((t) => t.status !== 'completed').reduce((sum, t) => sum + t.reward, 0)

  const handlePublish = async () => {
    if (!taskTitle.trim()) {
      toast.error('请输入任务标题')
      return
    }
    try {
      await createTask.mutateAsync({
        title: taskTitle,
        description: taskDesc || undefined,
        complexity: complexity || undefined,
        category: category || undefined,
        reward: reward ? parseFloat(reward) : undefined,
        rewardToken: rewardToken || undefined,
        deadline: deadline || undefined,
        assigneeType: assignment || undefined,
      })
      toast.success('任务发布成功')
      // Broadcast task creation via WebSocket
      emit('task:created', { taskId: 'new', title: taskTitle })
      setTaskTitle('')
      setTaskDesc('')
      setComplexity('')
      setCategory('')
      setReward('')
      setRewardToken('USDT')
      setDeadline('')
      setAssignment('')
    } catch {
      toast.error('任务发布失败')
    }
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">

      {/* ── Section 1: Router Overview ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">调度器概览</h2>
            <p className="text-xs text-muted-foreground">Fluid Collaboration Router 实时状态</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="在线节点"
            value={networkNodes.filter(n => n.status === 'online').length}
            description="AI + 人类节点活跃"
          />
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="进行中任务"
            value={isLoading ? '—' : kanbanGroups.in_progress.length + kanbanGroups.review.length}
            description="正在执行或审核"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="待审核"
            value={isLoading ? '—' : kanbanGroups.review.length}
            description="等待CI/安全验证"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="总赏金池"
            value={isLoading ? '—' : `$${totalRewardPool.toLocaleString()} USDT`}
            description="未结算赏金总额"
          />
        </div>
      </section>

      <Separator />

      {/* ── Section 2: Task Publishing Panel ───────────────────────────── */}
      <section>
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Send className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">发布新任务</CardTitle>
            </div>
            <CardDescription className="text-xs">
              通过流体民主机制，任务将自动路由至最合适的节点
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-foreground">任务标题</label>
                <Input
                  placeholder="输入任务标题..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-foreground">任务描述</label>
                <Textarea
                  placeholder="详细描述任务需求、验收标准..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                />
              </div>

              {/* Complexity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">复杂度</label>
                <Select value={complexity} onValueChange={(v) => setComplexity(v as Complexity)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择复杂度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低 (Low)</SelectItem>
                    <SelectItem value="medium">中 (Medium)</SelectItem>
                    <SelectItem value="high">高 (High)</SelectItem>
                    <SelectItem value="critical">关键 (Critical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">任务类别</label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">代码 (Code)</SelectItem>
                    <SelectItem value="design">设计 (Design)</SelectItem>
                    <SelectItem value="research">调研 (Research)</SelectItem>
                    <SelectItem value="creative">创意 (Creative)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reward */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">赏金</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    className="h-9 text-sm flex-1"
                  />
                  <Select value={rewardToken} onValueChange={setRewardToken}>
                    <SelectTrigger className="h-9 w-[100px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="DAI">DAI</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">截止时间</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Assignment */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-foreground">分配方式</label>
                <Select value={assignment} onValueChange={(v) => setAssignment(v as Assignment)}>
                  <SelectTrigger className="h-9 text-sm max-w-xs">
                    <SelectValue placeholder="选择分配方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动路由 (Auto)</SelectItem>
                    <SelectItem value="ai">AI节点 (AI)</SelectItem>
                    <SelectItem value="human">人类节点 (Human)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hard constraint warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                ⚠️ 硬性约束：外部节点贡献的代码或创意，必须通过自动化CI/CD和安全扫描才能合并。
              </p>
            </div>

            <Button
              onClick={handlePublish}
              disabled={createTask.isPending}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-2"
            >
              <Send className="h-4 w-4" />
              {createTask.isPending ? '发布中...' : '发布任务'}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Section 3: Task Board (Kanban) ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">任务看板</h2>
            <p className="text-xs text-muted-foreground">任务全生命周期管理 · 拖拽卡片切换状态</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm">加载任务失败，请稍后重试</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Open */}
              <KanbanColumn
                id="open"
                title="开放"
                count={kanbanGroups.open.length}
                tasks={kanbanGroups.open}
                accentColor="bg-emerald-500"
              />

              {/* In Progress */}
              <KanbanColumn
                id="in_progress"
                title="进行中"
                count={kanbanGroups.in_progress.length}
                tasks={kanbanGroups.in_progress}
                accentColor="bg-amber-500"
              />

              {/* Review */}
              <KanbanColumn
                id="review"
                title="审核中"
                count={kanbanGroups.review.length}
                tasks={kanbanGroups.review}
                accentColor="bg-orange-500"
              />

              {/* Completed */}
              <KanbanColumn
                id="completed"
                title="已完成"
                count={completedCount}
                tasks={kanbanGroups.completed}
                accentColor="bg-teal-500"
                footer={
                  <Card className="border-dashed border-border/60 bg-muted/30 mt-2.5">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[100px]">
                      <CheckCircle2 className="h-8 w-8 text-teal-500" />
                      <p className="text-sm font-semibold">{completedCount} 个任务已完成</p>
                      <p className="text-xs text-muted-foreground">
                        已结算赏金: <span className="font-semibold text-teal-600 dark:text-teal-400">{completedTotalReward} USDT</span>
                      </p>
                    </CardContent>
                  </Card>
                }
              />
            </div>

            <DragOverlay dropAnimation={{
              duration: 200,
              easing: 'ease',
            }}>
              {activeTask ? (
                <div className="rotate-2 scale-105 shadow-xl shadow-emerald-500/10 rounded-lg">
                  <TaskCard task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      <Separator />

      {/* ── Section 4: Node Network ────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">节点网络</h2>
            <p className="text-xs text-muted-foreground">流体民主协作节点拓扑</p>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                AI节点
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                人类节点
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                创始人节点
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                在线
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                离线
              </span>
            </div>

            {/* Founder center with connections */}
            <div className="flex flex-col items-center gap-6">
              {/* Center founder node */}
              <div className="relative">
                <NetworkNodeCard node={networkNodes[0]} isCenter />

                {/* Connection lines radiating outward - visual indicator */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gradient-to-b from-amber-300 to-transparent dark:from-amber-600" />
              </div>

              {/* Connection indicator */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ArrowRight className="h-3 w-3 rotate-90" />
                <span>连接至协作网络</span>
                <ArrowRight className="h-3 w-3 rotate-90" />
              </div>

              {/* Node grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {networkNodes.slice(1).map((node) => (
                  <div key={node.id} className="relative">
                    {/* Connection line to top */}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 ${
                      node.status === 'online'
                        ? 'bg-emerald-300 dark:bg-emerald-700'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`} />
                    <NetworkNodeCard node={node} isCenter={false} />
                  </div>
                ))}
              </div>
            </div>

            {/* Network stats */}
            <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                <Bot className="inline h-3 w-3 mr-1" />
                AI节点: <span className="font-semibold text-foreground">{networkNodes.filter(n => n.type === 'ai').length}</span>
              </span>
              <span>
                <Users className="inline h-3 w-3 mr-1" />
                人类节点: <span className="font-semibold text-foreground">{networkNodes.filter(n => n.type === 'human').length}</span>
              </span>
              <span>
                在线率: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {Math.round((networkNodes.filter(n => n.status === 'online').length / networkNodes.length) * 100)}%
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Section 5: Payment Records ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">支付记录</h2>
            <p className="text-xs text-muted-foreground">自动化权益确认与结算</p>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : paymentRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">暂无支付记录</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border/60">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 pl-4">任务</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">金额</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Tx Hash</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">状态</th>
                      <th className="text-right text-xs font-medium text-muted-foreground p-3 pr-4 hidden lg:table-cell">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRecords.map((record) => (
                      <tr key={record.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-4">
                          <span className="font-medium text-sm">{record.taskTitle}</span>
                          <span className="block sm:hidden text-xs text-muted-foreground mt-0.5">
                            {record.amount} {record.token}
                          </span>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {record.amount}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{record.token}</span>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <code className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                            {record.txHash}
                          </code>
                        </td>
                        <td className="p-3">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${getPaymentStatusStyle(record.status)}`}>
                            {getPaymentStatusIcon(record.status)}
                            <span className="hidden sm:inline">{record.status === 'confirmed' ? '已确认' : record.status === 'pending' ? '待确认' : '失败'}</span>
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{record.timestamp}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
