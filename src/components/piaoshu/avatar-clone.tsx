'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserCircle2,
  Crown,
  Cpu,
  Rocket,
  Wrench,
  Play,
  Clock,
  Activity,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  CalendarClock,
  FileCode2,
  Mail,
  Upload,
  BarChart3,
  Palette,
  ListTodo,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Pencil,
  Users,
  TrendingUp,
  GitBranch,
  Shield,
  Code2,
  PenTool,
  Megaphone,
  Settings,
  Plus,
  Filter,
  ArrowRight,
  Brain,
  Lightbulb,
  Network,
  ThumbsUp,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  useAvatarClone,
  useCreateClone,
  useCloneAgents,
  useTriggerCloneCycle,
  useCloneSkills,
  useCloneActivities,
  useCloneSchedule,
  useGenerateSchedule,
  useCloneOutputs,
  useSharedKnowledge,
  useApplySharedKnowledge,
} from '@/lib/api-hooks'
import { useToast } from '@/hooks/use-toast'
import { useWebSocket, type WSEvent } from '@/lib/use-websocket'
import { useQueryClient } from '@tanstack/react-query'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CloneData {
  id: string
  name: string
  persona: string | null
  status: string
  level: number
  experience: number
  totalCycles: number
  createdAt: string
  updatedAt: string
}

interface AgentData {
  id: string
  name: string
  role: string
  persona: string | null
  avatar: string | null
  status: string
  level: number
  experience: number
  cycleCount: number
  lastCycleAt: string | null
  capabilities: string | null
  outputs?: OutputData[]
}

interface OutputData {
  id: string
  title: string
  type: string
  status: string
  content: string
  agentId: string
  agentName?: string
  createdAt: string
}

interface SkillData {
  id: string
  name: string
  category: string
  level: number
  maxLevel: number
}

interface ActivityData {
  id: string
  type: string
  description: string
  agentName?: string
  createdAt: string
  icon?: string
}

interface ScheduleBlock {
  agentId: string
  agentName: string
  agentRole: string
  startHour: number
  endHour: number
  task: string
  color: string
}

interface ScheduleData {
  date: string
  blocks: ScheduleBlock[]
}

// ─── Fallback / Demo Data ─────────────────────────────────────────────────────

const FALLBACK_AGENTS: AgentData[] = [
  {
    id: 'demo-ceo',
    name: '飘叔CEO分身',
    role: 'CEO',
    persona: '战略决策、愿景规划、合伙人关系',
    avatar: null,
    status: 'idle',
    level: 5,
    experience: 72,
    cycleCount: 23,
    lastCycleAt: new Date(Date.now() - 3600000).toISOString(),
    capabilities: '["战略规划","融资决策","团队管理","商务谈判"]',
  },
  {
    id: 'demo-cto',
    name: '技术总监分身',
    role: 'CTO',
    persona: '架构评审、技术选型、代码审查',
    avatar: null,
    status: 'working',
    level: 4,
    experience: 58,
    cycleCount: 31,
    lastCycleAt: new Date(Date.now() - 1800000).toISOString(),
    capabilities: '["架构设计","代码审查","技术选型","性能优化"]',
  },
  {
    id: 'demo-growth',
    name: '增长引擎分身',
    role: 'Growth',
    persona: '市场推广、用户获取、数据驱动增长',
    avatar: null,
    status: 'idle',
    level: 3,
    experience: 45,
    cycleCount: 18,
    lastCycleAt: new Date(Date.now() - 7200000).toISOString(),
    capabilities: '["内容营销","用户增长","数据分析","社交媒体"]',
  },
  {
    id: 'demo-engineer',
    name: '工程执行分身',
    role: 'Engineer',
    persona: '代码实现、部署运维、CI/CD流水线',
    avatar: null,
    status: 'sleeping',
    level: 4,
    experience: 64,
    cycleCount: 42,
    lastCycleAt: new Date(Date.now() - 86400000).toISOString(),
    capabilities: '["前端开发","后端架构","DevOps","自动化测试"]',
  },
]

const FALLBACK_SKILLS: SkillData[] = [
  { id: 's1', name: '架构设计', category: 'engineering', level: 8, maxLevel: 10 },
  { id: 's2', name: '前端开发', category: 'engineering', level: 7, maxLevel: 10 },
  { id: 's3', name: '后端开发', category: 'engineering', level: 9, maxLevel: 10 },
  { id: 's4', name: 'DevOps', category: 'engineering', level: 6, maxLevel: 10 },
  { id: 's5', name: '内容营销', category: 'marketing', level: 5, maxLevel: 10 },
  { id: 's6', name: '用户增长', category: 'marketing', level: 6, maxLevel: 10 },
  { id: 's7', name: '品牌建设', category: 'marketing', level: 4, maxLevel: 10 },
  { id: 's8', name: '团队管理', category: 'operations', level: 7, maxLevel: 10 },
  { id: 's9', name: '项目管理', category: 'operations', level: 8, maxLevel: 10 },
  { id: 's10', name: '融资能力', category: 'operations', level: 5, maxLevel: 10 },
  { id: 's11', name: 'UI设计', category: 'design', level: 6, maxLevel: 10 },
  { id: 's12', name: 'UX研究', category: 'design', level: 5, maxLevel: 10 },
  { id: 's13', name: '产品设计', category: 'design', level: 7, maxLevel: 10 },
]

const FALLBACK_OUTPUTS: OutputData[] = [
  { id: 'o1', title: '重构认证模块', type: 'code', status: 'approved', content: '将JWT认证迁移到OAuth2.0，支持多租户...', agentId: 'demo-cto', agentName: 'CTO', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'o2', title: '本周增长报告', type: 'analysis', status: 'submitted', content: '本周新增用户1,247人，环比增长23%...', agentId: 'demo-growth', agentName: 'Growth', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'o3', title: '合作伙伴邀请函', type: 'email', status: 'draft', content: '尊敬的张总，关于战略合作事宜...', agentId: 'demo-ceo', agentName: 'CEO', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'o4', title: 'CI/CD流水线优化', type: 'deployment', status: 'approved', content: '部署时间从12分钟优化至3分钟...', agentId: 'demo-engineer', agentName: 'Engineer', createdAt: new Date(Date.now() - 28800000).toISOString() },
  { id: 'o5', title: '产品路线图Q2', type: 'task', status: 'submitted', content: 'Q2重点: 多语言支持、插件系统、API开放...', agentId: 'demo-ceo', agentName: 'CEO', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'o6', title: '品牌视觉升级方案', type: 'design', status: 'draft', content: '从Pantone 2025年度色提取灵感...', agentId: 'demo-growth', agentName: 'Growth', createdAt: new Date(Date.now() - 86400000).toISOString() },
]

const FALLBACK_ACTIVITIES: ActivityData[] = [
  { id: 'a1', type: 'cycle_completed', description: 'CTO Agent 完成周期 #31 - 架构评审', agentName: 'CTO', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'a2', type: 'output_created', description: 'CEO Agent 产出: 合作伙伴邀请函', agentName: 'CEO', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a3', type: 'skill_upgraded', description: '后端开发 升级到 Lv.9', agentName: 'Engineer', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a4', type: 'cycle_completed', description: 'Growth Agent 完成周期 #18 - 增长分析', agentName: 'Growth', createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 'a5', type: 'output_created', description: 'Engineer Agent 产出: CI/CD流水线优化', agentName: 'Engineer', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'a6', type: 'cycle_completed', description: 'CEO Agent 完成周期 #23 - 战略规划', agentName: 'CEO', createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: 'a7', type: 'skill_upgraded', description: '用户增长 升级到 Lv.6', agentName: 'Growth', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'a8', type: 'output_created', description: 'CTO Agent 产出: 重构认证模块', agentName: 'CTO', createdAt: new Date(Date.now() - 86400000).toISOString() },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAgentRoleConfig(role: string) {
  switch (role) {
    case 'CEO':
      return {
        icon: Crown,
        accent: 'violet',
        color: '#8b5cf6',
        bgLight: 'bg-violet-500/10',
        text: 'text-violet-600',
        border: 'border-violet-200',
        darkText: 'dark:text-violet-400',
        glow: 'shadow-violet-500/20',
        gradient: 'from-violet-500 to-purple-600',
      }
    case 'CTO':
      return {
        icon: Cpu,
        accent: 'cyan',
        color: '#06b6d4',
        bgLight: 'bg-cyan-500/10',
        text: 'text-cyan-600',
        border: 'border-cyan-200',
        darkText: 'dark:text-cyan-400',
        glow: 'shadow-cyan-500/20',
        gradient: 'from-cyan-500 to-blue-600',
      }
    case 'Growth':
      return {
        icon: Rocket,
        accent: 'emerald',
        color: '#10b981',
        bgLight: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        darkText: 'dark:text-emerald-400',
        glow: 'shadow-emerald-500/20',
        gradient: 'from-emerald-500 to-teal-600',
      }
    case 'Engineer':
      return {
        icon: Wrench,
        accent: 'teal',
        color: '#14b8a6',
        bgLight: 'bg-teal-500/10',
        text: 'text-teal-600',
        border: 'border-teal-200',
        darkText: 'dark:text-teal-400',
        glow: 'shadow-teal-500/20',
        gradient: 'from-teal-500 to-cyan-600',
      }
    default:
      return {
        icon: UserCircle2,
        accent: 'slate',
        color: '#64748b',
        bgLight: 'bg-slate-500/10',
        text: 'text-slate-600',
        border: 'border-slate-200',
        darkText: 'dark:text-slate-400',
        glow: 'shadow-slate-500/20',
        gradient: 'from-slate-500 to-gray-600',
      }
  }
}

function getAgentStatusConfig(status: string) {
  switch (status) {
    case 'working':
      return { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: '工作中', dot: 'bg-amber-500 animate-pulse' }
    case 'idle':
      return { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', label: '待命', dot: 'bg-emerald-500' }
    case 'sleeping':
      return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', label: '休眠', dot: 'bg-slate-400' }
    case 'error':
      return { color: 'bg-red-500/10 text-red-600 dark:text-red-400', label: '异常', dot: 'bg-red-500' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', label: status, dot: 'bg-slate-400' }
  }
}

function getOutputTypeConfig(type: string) {
  switch (type) {
    case 'code':
      return { icon: FileCode2, color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200', label: '代码' }
    case 'email':
      return { icon: Mail, color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200', label: '邮件' }
    case 'deployment':
      return { icon: Upload, color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200', label: '部署' }
    case 'analysis':
      return { icon: BarChart3, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200', label: '分析' }
    case 'design':
      return { icon: Palette, color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200', label: '设计' }
    case 'task':
      return { icon: ListTodo, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200', label: '任务' }
    default:
      return { icon: FileCode2, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200', label: type }
  }
}

function getOutputStatusConfig(status: string) {
  switch (status) {
    case 'draft':
      return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', label: '草稿', icon: Pencil }
    case 'submitted':
      return { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: '已提交', icon: ArrowRight }
    case 'approved':
      return { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', label: '已批准', icon: CheckCircle2 }
    case 'rejected':
      return { color: 'bg-red-500/10 text-red-600 dark:text-red-400', label: '已驳回', icon: XCircle }
    default:
      return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', label: status, icon: AlertCircle }
  }
}

function getActivityTypeConfig(type: string) {
  switch (type) {
    case 'cycle_completed':
      return { icon: Zap, color: '#8b5cf6', label: '周期' }
    case 'output_created':
      return { icon: Sparkles, color: '#06b6d4', label: '产出' }
    case 'skill_upgraded':
      return { icon: TrendingUp, color: '#10b981', label: '升级' }
    case 'agent_added':
      return { icon: Users, color: '#f59e0b', label: '新增' }
    default:
      return { icon: Activity, color: '#64748b', label: type }
  }
}

function getSkillCategoryConfig(category: string) {
  switch (category) {
    case 'engineering':
      return { label: '工程', icon: Code2, color: '#06b6d4', bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400' }
    case 'marketing':
      return { label: '营销', icon: Megaphone, color: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400' }
    case 'operations':
      return { label: '运营', icon: Settings, color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' }
    case 'design':
      return { label: '设计', icon: PenTool, color: '#ec4899', bg: 'bg-pink-500/10', text: 'text-pink-700 dark:text-pink-400' }
    default:
      return { label: category, icon: Star, color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' }
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

// Avatar Header Section
function AvatarHeader({ clone, agents }: { clone: CloneData | null; agents: AgentData[] }) {
  const isCloneLoaded = !!clone
  const cloneName = clone?.name || '飘叔分身'
  const cloneStatus = clone?.status || 'active'
  const cloneLevel = clone?.level || 6
  const cloneExperience = clone?.experience || 85
  const totalCycles = clone?.totalCycles || agents.reduce((s, a) => s + a.cycleCount, 0)
  const activeAgents = agents.filter(a => a.status === 'idle' || a.status === 'working').length

  const statusConfig = (() => {
    switch (cloneStatus) {
      case 'active': return { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200', label: '在线', dot: 'bg-emerald-500' }
      case 'sleeping': return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200', label: '休眠', dot: 'bg-slate-400' }
      case 'error': return { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200', label: '异常', dot: 'bg-red-500' }
      default: return { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200', label: '在线', dot: 'bg-emerald-500' }
    }
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/[0.03] to-purple-500/[0.03]">
        {/* Background glow effect */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />

        <CardContent className="relative p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar circle with glow */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <UserCircle2 className="h-12 w-12 text-white" />
              </div>
              {/* Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background ${statusConfig.dot} flex items-center justify-center`}>
                <span className="sr-only">{statusConfig.label}</span>
              </div>
            </div>

            {/* Clone info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{cloneName}</h2>
                <Badge variant="outline" className={`text-[10px] ${statusConfig.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1`} />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Level indicator */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 hover:bg-violet-500/20">
                  <Star className="h-3 w-3 mr-1" />
                  Lv.{cloneLevel}
                </Badge>
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <Progress value={cloneExperience} className="h-2 [&>div]:bg-violet-500" />
                  <span className="text-xs text-muted-foreground font-mono">{cloneExperience}%</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
                  <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{agents.length}</div>
                  <div className="text-[10px] text-muted-foreground">总分身</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeAgents}</div>
                  <div className="text-[10px] text-muted-foreground">活跃</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
                  <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{totalCycles}</div>
                  <div className="text-[10px] text-muted-foreground">总周期</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{cloneExperience}</div>
                  <div className="text-[10px] text-muted-foreground">经验值</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <Button className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
                <Zap className="h-4 w-4" />
                启动全部分身
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
                <Pencil className="h-3.5 w-3.5" />
                编辑分身
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Agent Card
function AgentCard({
  agent,
  onStartCycle,
  isTriggering,
}: {
  agent: AgentData
  onStartCycle: (id: string) => void
  isTriggering: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const config = getAgentRoleConfig(agent.role)
  const statusConfig = getAgentStatusConfig(agent.status)
  const IconComponent = config.icon
  const capabilities = useMemo(() => {
    if (!agent.capabilities) return []
    try { return JSON.parse(agent.capabilities) as string[] } catch { return [] }
  }, [agent.capabilities])

  const isWorking = agent.status === 'working'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`group relative overflow-hidden border-border/60 transition-all duration-300 ${isWorking ? `shadow-lg ${config.glow}` : ''}`}>
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: config.color }} />

        {/* Working glow effect */}
        {isWorking && (
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: config.color }} />
        )}

        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {/* Agent avatar */}
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${config.bgLight} ${config.text}`}>
                <IconComponent className="h-5 w-5" />
                {isWorking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse border-2 border-background" />
                )}
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{agent.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                  <span style={{ color: config.color }}>{agent.role}</span> Agent
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConfig.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1`} />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-4 space-y-3">
          {/* Level & Experience */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">等级</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" style={{ color: config.color }} />
                <span className="font-semibold" style={{ color: config.color }}>Lv.{agent.level}</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: config.color }}
                initial={{ width: 0 }}
                animate={{ width: `${agent.experience}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>经验值</span>
              <span>{agent.experience}/100</span>
            </div>
          </div>

          {/* Cycle count */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              完成周期
            </span>
            <span className="font-semibold" style={{ color: config.color }}>{agent.cycleCount}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              最近执行
            </span>
            <span className="text-muted-foreground">
              {agent.lastCycleAt ? formatTime(agent.lastCycleAt) : '暂无'}
            </span>
          </div>

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {capabilities.slice(0, 3).map((cap, i) => (
                <Badge key={i} variant="outline" className={`text-[9px] px-1.5 py-0 ${config.border} ${config.text}`}>
                  {cap}
                </Badge>
              ))}
              {capabilities.length > 3 && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                  +{capabilities.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className={`gap-1.5 text-xs bg-gradient-to-r ${config.gradient} text-white shadow-md hover:opacity-90 transition-all`}
              onClick={() => onStartCycle(agent.id)}
              disabled={isTriggering || isWorking}
            >
              {isTriggering || isWorking ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  启动周期
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? '收起' : '详情'}
            </Button>
          </div>

          {/* Expanded outputs */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t space-y-2 max-h-48 overflow-y-auto">
                  {agent.outputs && agent.outputs.length > 0 ? (
                    agent.outputs.slice(0, 3).map((output) => (
                      <div key={output.id} className="rounded-lg border border-border/60 p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium">{output.title}</span>
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 ${getOutputStatusConfig(output.status).color}`}>
                            {getOutputStatusConfig(output.status).label}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{output.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <FileCode2 className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground">暂无产出记录</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AgentCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.5 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-10" /></div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <div className="flex items-center justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-6" /></div>
        <div className="flex gap-1"><Skeleton className="h-4 w-12 rounded-full" /><Skeleton className="h-4 w-14 rounded-full" /></div>
        <div className="flex gap-2 pt-1"><Skeleton className="h-7 w-20 rounded-md" /><Skeleton className="h-7 w-16 rounded-md" /></div>
      </CardContent>
    </Card>
  )
}

// Schedule Timeline
function ScheduleTimeline({ schedule, onGenerate, isGenerating }: { schedule: ScheduleData | null; onGenerate: () => void; isGenerating: boolean }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7) // 7:00 - 22:00
  const currentHour = new Date().getHours()
  const currentMinute = new Date().getMinutes()
  const currentTimeOffset = currentHour >= 7 && currentHour <= 22 ? ((currentHour - 7) * 60 + currentMinute) / (15 * 60) * 100 : 0

  const blocks = schedule?.blocks || []
  const agentColors = useMemo(() => {
    const colorMap: Record<string, string> = {}
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#14b8a6', '#f59e0b', '#ec4899']
    blocks.forEach((b, i) => {
      if (!colorMap[b.agentId]) {
        colorMap[b.agentId] = colors[i % colors.length]
      }
    })
    return colorMap
  }, [blocks])

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-sm">今日日程</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI生成日程
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Time labels */}
          <div className="flex justify-between mb-2 text-[9px] text-muted-foreground font-mono">
            {hours.filter((_, i) => i % 3 === 0).map(h => (
              <span key={h}>{h}:00</span>
            ))}
          </div>

          {/* Timeline track */}
          <div className="relative h-32 border border-border/60 rounded-lg bg-muted/30 overflow-hidden">
            {/* Hour grid lines */}
            {hours.filter((_, i) => i % 3 === 0).map(h => {
              const left = ((h - 7) / 15) * 100
              return (
                <div key={h} className="absolute top-0 bottom-0 border-l border-border/40" style={{ left: `${left}%` }}>
                  <span className="absolute -top-4 left-1 text-[8px] text-muted-foreground font-mono">{h}</span>
                </div>
              )
            })}

            {/* Current time indicator */}
            {currentHour >= 7 && currentHour <= 22 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${currentTimeOffset}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}

            {/* Schedule blocks */}
            {blocks.length > 0 ? (
              <div className="relative h-full p-2">
                {blocks.map((block, i) => {
                  const startPct = ((block.startHour - 7) / 15) * 100
                  const widthPct = ((block.endHour - block.startHour) / 15) * 100
                  const topPct = 8 + (i % 3) * 30
                  return (
                  <motion.div
                    key={`${block.agentId}-${block.startHour}`}
                    className="absolute rounded-md px-2 py-1 text-[9px] text-white font-medium truncate cursor-default"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      top: `${topPct}%`,
                      height: '24%',
                      backgroundColor: block.color || agentColors[block.agentId] || '#8b5cf6',
                    }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    title={`${block.agentName}: ${block.task}`}
                  >
                    <span className="font-semibold">{block.agentName}</span> · {block.task}
                  </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <CalendarClock className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  <p className="text-[10px]">暂无日程安排</p>
                  <p className="text-[9px] opacity-60">点击"AI生成日程"自动安排</p>
                </div>
              </div>
            )}
          </div>

          {/* Agent legend */}
          {blocks.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(agentColors).map(([agentId, color]) => {
                const block = blocks.find(b => b.agentId === agentId)
                return (
                  <div key={agentId} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground">{block?.agentName || agentId}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Output Feed Card
function OutputFeedCard({ output }: { output: OutputData }) {
  const typeConfig = getOutputTypeConfig(output.type)
  const statusConfig = getOutputStatusConfig(output.status)
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group border-border/60 transition-all duration-200 hover:border-violet-500/30 hover:shadow-md">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 ${typeConfig.color.split(' ').slice(0, 2).join(' ')}`}>
                <TypeIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold truncate">{output.title}</h4>
                <p className="text-[10px] text-muted-foreground">{output.agentName} Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={`text-[8px] px-1 py-0 ${statusConfig.color}`}>
                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{output.content}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-[8px] px-1 py-0 ${typeConfig.color}`}>{typeConfig.label}</Badge>
            <span className="text-[9px] text-muted-foreground font-mono">{formatTime(output.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Skill Matrix Section
function SkillMatrix({ skills }: { skills: SkillData[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = new Set(skills.map(s => s.category))
    return ['all', ...Array.from(cats)]
  }, [skills])

  const filteredSkills = useMemo(() => {
    if (selectedCategory === 'all') return skills
    return skills.filter(s => s.category === selectedCategory)
  }, [skills, selectedCategory])

  // Radar chart data - average by category
  const radarData = useMemo(() => {
    const catMap: Record<string, { sum: number; count: number }> = {}
    for (const s of skills) {
      if (!catMap[s.category]) catMap[s.category] = { sum: 0, count: 0 }
      catMap[s.category].sum += s.level
      catMap[s.category].count += 1
    }
    return Object.entries(catMap).map(([cat, { sum, count }]) => ({
      category: getSkillCategoryConfig(cat).label,
      value: Math.round((sum / count) * 10) / 10,
      fullMark: 10,
    }))
  }, [skills])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of skills) {
      counts[s.category] = (counts[s.category] || 0) + 1
    }
    return counts
  }, [skills])

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-600" />
          <CardTitle className="text-sm">技能矩阵</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{skills.length} 项技能</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                />
                <Radar
                  name="技能等级"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Separator />

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => {
            const catConfig = cat === 'all' ? { label: '全部', bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400' } : getSkillCategoryConfig(cat)
            const count = cat === 'all' ? skills.length : categoryCounts[cat] || 0
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  selectedCategory === cat
                    ? `${catConfig.bg} ${catConfig.text} ring-1 ring-current/20`
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {catConfig.label}
                <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Skill bars */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
          {filteredSkills.map(skill => {
            const catConfig = getSkillCategoryConfig(skill.category)
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <catConfig.icon className="h-3 w-3" style={{ color: catConfig.color }} />
                    <span className="font-medium">{skill.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{skill.level}/{skill.maxLevel}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: catConfig.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Knowledge Sharing Network Section
function KnowledgeSharingNetwork() {
  const { data: knowledgeData, isLoading: knowledgeLoading } = useSharedKnowledge()
  const applyMutation = useApplySharedKnowledge()
  const { toast } = useToast()

  const knowledge = useMemo(() => {
    const rawData = knowledgeData as { success?: boolean; data?: { knowledge: { id: string; domain: string; insight: string; sourceType: string; confidence: number; appliedCount: number; createdAt: string }[]; total: number; domainDistribution: { domain: string; count: number; avgConfidence: number }[] } } | undefined
    if (rawData?.data?.knowledge && Array.isArray(rawData.data.knowledge)) {
      return rawData.data.knowledge
    }
    // Fallback demo data
    return [
      { id: 'k1', domain: 'engineering', insight: '微服务拆分时应优先考虑团队边界而非技术边界，减少跨团队依赖', sourceType: 'agent_cycle', confidence: 0.85, appliedCount: 3, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'k2', domain: 'growth', insight: 'A/B测试显示：简化注册流程可提升转化率35%，移除非必要字段是关键', sourceType: 'agent_cycle', confidence: 0.92, appliedCount: 5, createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 'k3', domain: 'strategy', insight: '早期创业公司应聚焦单一市场做到极致，而非同时拓展多个垂直领域', sourceType: 'simulation', confidence: 0.78, appliedCount: 2, createdAt: new Date(Date.now() - 14400000).toISOString() },
      { id: 'k4', domain: 'code', insight: '使用依赖注入模式可显著提高代码可测试性，测试覆盖率平均提升40%', sourceType: 'agent_cycle', confidence: 0.88, appliedCount: 7, createdAt: new Date(Date.now() - 28800000).toISOString() },
      { id: 'k5', domain: 'marketing', insight: '内容营销中，深度技术文章比浅层介绍文带来的高质量线索多3倍', sourceType: 'task', confidence: 0.75, appliedCount: 1, createdAt: new Date(Date.now() - 43200000).toISOString() },
      { id: 'k6', domain: 'engineering', insight: 'CI/CD流水线中加入安全扫描步骤可提前发现80%的常见漏洞', sourceType: 'agent_cycle', confidence: 0.9, appliedCount: 4, createdAt: new Date(Date.now() - 86400000).toISOString() },
    ]
  }, [knowledgeData])

  const domainDistribution = useMemo(() => {
    const rawData = knowledgeData as { success?: boolean; data?: { domainDistribution: { domain: string; count: number; avgConfidence: number }[] } } | undefined
    if (rawData?.data?.domainDistribution && Array.isArray(rawData.data.domainDistribution) && rawData.data.domainDistribution.length > 0) {
      return rawData.data.domainDistribution
    }
    // Compute from fallback data
    const domainMap: Record<string, { count: number; confSum: number }> = {}
    for (const k of knowledge) {
      if (!domainMap[k.domain]) domainMap[k.domain] = { count: 0, confSum: 0 }
      domainMap[k.domain].count++
      domainMap[k.domain].confSum += k.confidence
    }
    return Object.entries(domainMap).map(([domain, { count, confSum }]) => ({
      domain,
      count,
      avgConfidence: confSum / count,
    }))
  }, [knowledgeData, knowledge])

  const totalInsights = knowledge.length

  const domainColorMap: Record<string, string> = {
    engineering: '#06b6d4',
    code: '#14b8a6',
    growth: '#10b981',
    marketing: '#8b5cf6',
    strategy: '#f59e0b',
    operations: '#ef4444',
    analytics: '#3b82f6',
    devops: '#6366f1',
    architecture: '#0891b2',
  }

  const domainLabelMap: Record<string, string> = {
    engineering: '工程',
    code: '代码',
    growth: '增长',
    marketing: '营销',
    strategy: '战略',
    operations: '运营',
    analytics: '分析',
    devops: '运维',
    architecture: '架构',
  }

  const pieData = domainDistribution.map(d => ({
    name: domainLabelMap[d.domain] || d.domain,
    value: d.count,
    color: domainColorMap[d.domain] || '#64748b',
    avgConfidence: d.avgConfidence,
  }))

  const handleApply = (id: string) => {
    applyMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: '知识已应用', description: '洞察已注入下次周期执行上下文' })
      },
    })
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-sm">知识共享网络</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{totalInsights} 条洞察</Badge>
          </div>
          <Badge variant="outline" className="gap-1 text-[10px] border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
            <Network className="h-3 w-3" />
            跨分身共享
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
            <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{totalInsights}</div>
            <div className="text-[10px] text-muted-foreground">总洞察</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{domainDistribution.length}</div>
            <div className="text-[10px] text-muted-foreground">领域覆盖</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {knowledge.length > 0 ? Math.round(knowledge.reduce((s, k) => s + k.confidence, 0) / knowledge.length * 100) : 0}%
            </div>
            <div className="text-[10px] text-muted-foreground">平均置信</div>
          </div>
        </div>

        {/* Domain distribution PieChart */}
        {pieData.length > 0 && (
          <div className="h-44 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number, name: string) => [`${value} 条`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-1.5">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-muted-foreground flex-1">{d.name}</span>
                  <span className="text-[10px] font-semibold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Recent insights */}
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {knowledgeLoading ? (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </>
          ) : knowledge.length > 0 ? knowledge.slice(0, 6).map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-border/60 p-3 space-y-1.5 hover:border-violet-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0" style={{ color: domainColorMap[item.domain] || '#64748b' }} />
                  <Badge variant="outline" className="text-[8px] px-1 py-0" style={{ color: domainColorMap[item.domain] || '#64748b', borderColor: `${domainColorMap[item.domain] || '#64748b'}30` }}>
                    {domainLabelMap[item.domain] || item.domain}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-muted-foreground font-mono">
                    置信 {(item.confidence * 100).toFixed(0)}%
                  </span>
                  {item.appliedCount > 0 && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 gap-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      <ThumbsUp className="h-2.5 w-2.5" />
                      {item.appliedCount}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{item.insight}</p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground font-mono">{formatTime(item.createdAt)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 text-[9px] gap-0.5 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                  onClick={() => handleApply(item.id)}
                  disabled={applyMutation.isPending}
                >
                  <Zap className="h-2.5 w-2.5" />
                  应用
                </Button>
              </div>
            </motion.div>
          )) : (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Brain className="h-6 w-6 mb-2 opacity-40" />
              <p className="text-xs">暂无共享知识</p>
              <p className="text-[9px] opacity-60">启动代理周期将自动提取洞察</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Stream
function ActivityStream({ activities }: { activities: ActivityData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activities])

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-600" />
          <CardTitle className="text-sm">活动流</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{activities.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="max-h-80 overflow-y-auto custom-scrollbar">
          {activities.length > 0 ? activities.map((item, idx) => {
            const typeConfig = getActivityTypeConfig(item.type)
            const TypeIcon = typeConfig.icon
            const agentConfig = getAgentRoleConfig(item.agentName || '')
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${typeConfig.color}15` }}>
                    <TypeIcon className="h-3 w-3" style={{ color: typeConfig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.agentName && (
                        <span className="text-[11px] font-semibold" style={{ color: agentConfig.color }}>{item.agentName}</span>
                      )}
                      <Badge variant="outline" className="text-[8px] px-1 py-0" style={{ color: typeConfig.color, borderColor: `${typeConfig.color}30` }}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5 font-mono">
                    {formatTimeShort(item.createdAt)}
                  </span>
                </div>
                {idx < activities.length - 1 && <Separator />}
              </motion.div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-6 w-6 mb-2 opacity-40" />
              <p className="text-xs">暂无活动记录</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Onboarding Modal
function CloneOnboardingModal({ open, onOpenChange, onComplete }: { open: boolean; onOpenChange: (v: boolean) => void; onComplete: (name: string, persona: string) => void }) {
  const [step, setStep] = useState(0)
  const [cloneName, setCloneName] = useState('')
  const [clonePersona, setClonePersona] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['CEO', 'CTO', 'Growth', 'Engineer'])
  const [isCreating, setIsCreating] = useState(false)

  const agentOptions = [
    { role: 'CEO', name: 'CEO分身', desc: '战略决策、愿景规划', icon: Crown, color: '#8b5cf6' },
    { role: 'CTO', name: '技术总监分身', desc: '架构评审、技术选型', icon: Cpu, color: '#06b6d4' },
    { role: 'Growth', name: '增长引擎分身', desc: '市场推广、用户获取', icon: Rocket, color: '#10b981' },
    { role: 'Engineer', name: '工程执行分身', desc: '代码实现、部署运维', icon: Wrench, color: '#14b8a6' },
  ]

  const steps = [
    { title: '命名你的分身', desc: '为你的AI分身取一个名字' },
    { title: '定义人格', desc: '描述分身的性格和行为准则' },
    { title: '选择初始分身团队', desc: '选择你的AI分身团队成员' },
    { title: '确认创建', desc: '检查并确认你的分身配置' },
  ]

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleComplete = async () => {
    setIsCreating(true)
    try {
      await onComplete(cloneName, clonePersona)
      onOpenChange(false)
    } finally {
      setIsCreating(false)
    }
  }

  const toggleAgent = (role: string) => {
    setSelectedAgents(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-violet-500" />
            创建你的AI分身
          </DialogTitle>
          <DialogDescription>
            步骤 {step + 1}/4 · {steps[step].desc}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < step ? 'bg-violet-500' : i === step ? 'bg-violet-500/60' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[200px]">
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <UserCircle2 className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">分身名称</label>
                <Input
                  placeholder="例如: 飘叔分身"
                  value={cloneName}
                  onChange={e => setCloneName(e.target.value)}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                />
                <p className="text-[10px] text-muted-foreground">这个名字将作为你AI分身的标识</p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">人格描述</label>
                <Textarea
                  placeholder="描述你的AI分身应该具备的性格特征、行为准则和决策风格...&#10;&#10;例如: 作为一名连续创业者，我具有敏锐的商业直觉和果断的决策能力..."
                  value={clonePersona}
                  onChange={e => setClonePersona(e.target.value)}
                  className="min-h-[140px] border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                />
                <p className="text-[10px] text-muted-foreground">人格描述将影响分身的决策风格和输出倾向</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-muted-foreground mr-1">快速添加:</span>
                {['果断决策', '战略思维', '技术敏感', '用户导向', '数据驱动', '创新突破'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setClonePersona(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="text-[9px] px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <p className="text-xs text-muted-foreground">选择你的分身团队初始成员（至少选择1个）</p>
              <div className="grid grid-cols-2 gap-3">
                {agentOptions.map(opt => {
                  const isSelected = selectedAgents.includes(opt.role)
                  const IconComp = opt.icon
                  return (
                    <button
                      key={opt.role}
                      onClick={() => toggleAgent(opt.role)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/5 shadow-md shadow-violet-500/10'
                          : 'border-border/60 hover:border-violet-500/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors`} style={{ backgroundColor: `${opt.color}15` }}>
                        <IconComp className="h-5 w-5" style={{ color: opt.color }} />
                      </div>
                      <span className="text-xs font-medium">{opt.name}</span>
                      <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-violet-500" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <UserCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cloneName || '未命名分身'}</h3>
                    <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 text-[9px]">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" /> 即将创建
                    </Badge>
                  </div>
                </div>
                {clonePersona && (
                  <div>
                    <span className="text-[10px] text-muted-foreground">人格:</span>
                    <p className="text-xs mt-0.5 line-clamp-3">{clonePersona}</p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-muted-foreground">团队成员:</span>
                  <div className="flex gap-1.5 mt-1">
                    {selectedAgents.map(role => {
                      const opt = agentOptions.find(a => a.role === role)
                      if (!opt) return null
                      const IconComp = opt.icon
                      return (
                        <Badge key={role} variant="outline" className="text-[9px] gap-1" style={{ color: opt.color, borderColor: `${opt.color}30` }}>
                          <IconComp className="h-2.5 w-2.5" />
                          {role}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
          >
            上一步
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={step === 0 && !cloneName.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                下一步
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isCreating || !cloneName.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isCreating ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> 创建中...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> 创建分身</>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AvatarCloneView() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [triggeringAgentId, setTriggeringAgentId] = useState<string | null>(null)
  const [outputFilter, setOutputFilter] = useState<string>('all')
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  // Data hooks
  const { data: cloneData, isLoading: cloneLoading, error: cloneError } = useAvatarClone()
  const { data: agentsData, isLoading: agentsLoading } = useCloneAgents()
  const { data: skillsData, isLoading: skillsLoading } = useCloneSkills()
  const { data: activitiesData, isLoading: activitiesLoading } = useCloneActivities()
  const { data: scheduleData, isLoading: scheduleLoading } = useCloneSchedule()
  const { data: outputsData, isLoading: outputsLoading } = useCloneOutputs()
  const createCloneMutation = useCreateClone()
  const triggerCycleMutation = useTriggerCloneCycle()
  const generateScheduleMutation = useGenerateSchedule()

  // WebSocket integration for real-time agent/clone updates
  useWebSocket({
    onEvent: (event: WSEvent) => {
      // Non-blocking: invalidate queries to refresh data based on event type
      switch (event.type) {
        case 'agent:status': {
          const data = event.data as { agentId?: string; status?: string; agentName?: string }
          if (data.agentId) {
            queryClient.invalidateQueries({ queryKey: ['cloneAgents'] })
            queryClient.invalidateQueries({ queryKey: ['avatarClone'] })
          }
          break
        }
        case 'agent:cycle': {
          const data = event.data as { agentId?: string; phase?: string; agentName?: string }
          if (data.agentId) {
            queryClient.invalidateQueries({ queryKey: ['cloneAgents'] })
            queryClient.invalidateQueries({ queryKey: ['avatarClone'] })
            if (data.phase === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['cloneOutputs'] })
              queryClient.invalidateQueries({ queryKey: ['cloneActivities'] })
            }
          }
          break
        }
        case 'agent:output': {
          queryClient.invalidateQueries({ queryKey: ['cloneOutputs'] })
          queryClient.invalidateQueries({ queryKey: ['cloneActivities'] })
          break
        }
        case 'clone:activity': {
          queryClient.invalidateQueries({ queryKey: ['cloneActivities'] })
          queryClient.invalidateQueries({ queryKey: ['cloneAgents'] })
          break
        }
      }
    },
  })

  // Resolve data with fallbacks
  const clone: CloneData | null = useMemo(() => {
    if (cloneError || !cloneData?.clone) return null
    return cloneData.clone as CloneData
  }, [cloneData, cloneError])

  const agents: AgentData[] = useMemo(() => {
    if (agentsData?.agents && Array.isArray(agentsData.agents) && agentsData.agents.length > 0) {
      return agentsData.agents as AgentData[]
    }
    return FALLBACK_AGENTS
  }, [agentsData])

  const skills: SkillData[] = useMemo(() => {
    if (skillsData?.skills && Array.isArray(skillsData.skills) && skillsData.skills.length > 0) {
      return skillsData.skills as SkillData[]
    }
    return FALLBACK_SKILLS
  }, [skillsData])

  const activities: ActivityData[] = useMemo(() => {
    if (activitiesData?.activities && Array.isArray(activitiesData.activities) && activitiesData.activities.length > 0) {
      return activitiesData.activities as ActivityData[]
    }
    return FALLBACK_ACTIVITIES
  }, [activitiesData])

  const schedule: ScheduleData | null = useMemo(() => {
    if (scheduleData?.schedule) {
      return scheduleData.schedule as ScheduleData
    }
    // Fallback schedule
    return {
      date: new Date().toISOString(),
      blocks: [
        { agentId: 'demo-ceo', agentName: 'CEO', agentRole: 'CEO', startHour: 9, endHour: 11, task: '战略规划会议', color: '#8b5cf6' },
        { agentId: 'demo-cto', agentName: 'CTO', agentRole: 'CTO', startHour: 10, endHour: 13, task: '架构评审', color: '#06b6d4' },
        { agentId: 'demo-growth', agentName: 'Growth', agentRole: 'Growth', startHour: 14, endHour: 16, task: '增长分析报告', color: '#10b981' },
        { agentId: 'demo-engineer', agentName: 'Engineer', agentRole: 'Engineer', startHour: 13, endHour: 18, task: '功能迭代开发', color: '#14b8a6' },
        { agentId: 'demo-ceo', agentName: 'CEO', agentRole: 'CEO', startHour: 16, endHour: 17, task: '合作伙伴沟通', color: '#8b5cf6' },
      ],
    }
  }, [scheduleData])

  const outputs: OutputData[] = useMemo(() => {
    if (outputsData?.outputs && Array.isArray(outputsData.outputs) && outputsData.outputs.length > 0) {
      return outputsData.outputs as OutputData[]
    }
    return FALLBACK_OUTPUTS
  }, [outputsData])

  // Show onboarding if no clone exists (only after loading finishes)
  const showOnboarding = !cloneLoading && !clone

  useEffect(() => {
    if (showOnboarding) {
      setOnboardingOpen(true)
    }
  }, [showOnboarding])

  // Filtered outputs
  const filteredOutputs = useMemo(() => {
    if (outputFilter === 'all') return outputs
    return outputs.filter(o => o.type === outputFilter)
  }, [outputs, outputFilter])

  // Handlers
  const handleStartCycle = async (agentId: string) => {
    setTriggeringAgentId(agentId)
    try {
      await triggerCycleMutation.mutateAsync({ agentId })
      toast({
        title: '周期启动成功',
        description: '分身已开始执行新周期 (规划→执行→报告)',
      })
    } catch {
      toast({
        title: '周期启动失败',
        description: '分身周期执行过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setTriggeringAgentId(null)
    }
  }

  const handleCreateClone = async (name: string, persona: string) => {
    try {
      await createCloneMutation.mutateAsync({ name, persona })
      toast({
        title: '分身创建成功',
        description: `${name} 已成功创建并开始工作`,
      })
    } catch {
      toast({
        title: '创建失败',
        description: '分身创建过程中出现错误，请重试',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateSchedule = async () => {
    try {
      await generateScheduleMutation.mutateAsync()
      toast({
        title: '日程已生成',
        description: 'AI已为你的分身团队生成今日日程',
      })
    } catch {
      toast({
        title: '日程生成失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">分身系统</h1>
              <p className="text-xs text-muted-foreground">
                Polsia风格AI分身团队 · 自主周期执行 · 智能协作
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1 text-violet-600 border-violet-200 bg-violet-500/5">
              <Zap className="h-3 w-3" />
              分身在线
            </Badge>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              v1.0
            </Badge>
          </div>
        </motion.div>

        <Separator />

        {/* ── Section A: Avatar Header ──────────────────────────────── */}
        {cloneLoading ? (
          <Card className="overflow-hidden border-violet-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <div className="grid grid-cols-4 gap-3">
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AvatarHeader clone={clone} agents={agents} />
        )}

        {/* ── Section B: Agent Team Grid ────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-600" />
            <h2 className="text-base font-semibold">分身团队</h2>
            <Badge variant="secondary" className="text-[10px]">
              {agentsLoading ? '...' : `${agents.length} 分身`}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {agentsLoading ? (
              <><AgentCardSkeleton /><AgentCardSkeleton /><AgentCardSkeleton /><AgentCardSkeleton /></>
            ) : (
              agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onStartCycle={handleStartCycle}
                  isTriggering={triggeringAgentId === agent.id}
                />
              ))
            )}
          </div>
        </section>

        {/* ── Section C: Daily Schedule Timeline ─────────────────────── */}
        {scheduleLoading ? (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        ) : (
          <ScheduleTimeline
            schedule={schedule}
            onGenerate={handleGenerateSchedule}
            isGenerating={generateScheduleMutation.isPending}
          />
        )}

        {/* ── Sections D+F: Outputs + Activity (side by side) ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Section D: Agent Outputs Feed ──────────────────────── */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <h2 className="text-base font-semibold">产出动态</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {outputsLoading ? '...' : `${outputs.length} 条`}
                </Badge>
              </div>
            </div>

            {/* Output type filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setOutputFilter('all')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  outputFilter === 'all'
                    ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400 ring-1 ring-violet-500/20'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Filter className="h-3 w-3" />
                全部
              </button>
              {['code', 'email', 'deployment', 'analysis', 'design', 'task'].map(type => {
                const config = getOutputTypeConfig(type)
                const count = outputs.filter(o => o.type === type).length
                if (count === 0) return null
                return (
                  <button
                    key={type}
                    onClick={() => setOutputFilter(type)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                      outputFilter === type
                        ? `${config.color} ring-1 ring-current/20`
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <config.icon className="h-3 w-3" />
                    {config.label}
                    <span className="opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Output cards */}
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {outputsLoading ? (
                <><Card className="border-border/60"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card className="border-border/60"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card className="border-border/60"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card></>
              ) : filteredOutputs.length > 0 ? (
                filteredOutputs.map(output => (
                  <OutputFeedCard key={output.id} output={output} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileCode2 className="h-6 w-6 mb-2 opacity-40" />
                  <p className="text-xs">暂无产出记录</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Section F: Activity Stream ──────────────────────────── */}
          <div className="space-y-3">
            {activitiesLoading ? (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ActivityStream activities={activities} />
            )}
          </div>
        </div>

        {/* ── Section E: Skill Matrix + Knowledge Sharing ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {skillsLoading ? (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <SkillMatrix skills={skills} />
          )}
          <KnowledgeSharingNetwork />
        </div>
      </div>

      {/* ── Section G: Clone Onboarding Modal ─────────────────────────── */}
      <CloneOnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onComplete={handleCreateClone}
      />
    </div>
  )
}
