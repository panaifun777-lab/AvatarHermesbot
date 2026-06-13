'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Brain,
  Swords,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  Dna,
  Database,
  Crown,
  Cpu,
  Rocket,
  Wrench,
  Activity,
  Play,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  BarChart3,
} from 'lucide-react'
import { useShards, useCreateShard, useRunSimulation, useDecisions, useMemories, useAgentRoles, useTriggerCycle, useAgentCycles, useVectorSearch, useVectorSync, useVectorCollections } from '@/lib/api-hooks'
import { useToast } from '@/hooks/use-toast'

// ─── Data Types ──────────────────────────────────────────────────────────────

interface Vulnerability {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium'
  description: string
}

interface DefenseStrategy {
  id: string
  title: string
  strength: 'strong' | 'moderate' | 'weak'
  description: string
}

// ─── DB Row Types ────────────────────────────────────────────────────────────

interface ShardRow {
  id: string
  name: string
  description: string | null
  modelBase: string
  loraAdapter: string | null
  status: string
  confidence: number
  shardType: string
  lastTrained: string | null
  createdAt: string
  updatedAt: string
}

interface SimulationRow {
  id: string
  shardId: string
  inputIdea: string
  redOutput: string | null
  blueOutput: string | null
  verdict: string | null
  confidence: number
  status: string
  createdAt: string
}

interface DecisionRow {
  id: string
  founderId: string
  title: string
  content: string
  category: string
  outcome: string | null
  confidence: number
  tags: string | null
  createdAt: string
}

interface AgentRoleRow {
  id: string
  name: string
  persona: string
  avatar: string | null
  capabilities: string | null
  status: string
  lastCycleAt: string | null
  cycleCount: number
  shardId: string | null
  createdAt: string
  updatedAt: string
  cycles?: DailyCycleRow[]
}

interface DailyCycleRow {
  id: string
  agentId: string
  phase: string
  plan: string | null
  execution: string | null
  report: string | null
  startedAt: string
  completedAt: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getConfidenceColor(value: number): string {
  if (value > 80) return 'text-emerald-500'
  if (value >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function getConfidenceBg(value: number): string {
  if (value > 80) return 'bg-emerald-500'
  if (value >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function getSeverityConfig(severity: Vulnerability['severity']) {
  switch (severity) {
    case 'critical':
      return { color: 'bg-red-500/10 text-red-600 border-red-200', label: '致命' }
    case 'high':
      return { color: 'bg-orange-500/10 text-orange-600 border-orange-200', label: '高危' }
    case 'medium':
      return { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '中危' }
  }
}

function getStrengthConfig(strength: DefenseStrategy['strength']) {
  switch (strength) {
    case 'strong':
      return { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', label: '强' }
    case 'moderate':
      return { color: 'bg-teal-500/10 text-teal-700 border-teal-200', label: '中' }
    case 'weak':
      return { color: 'bg-amber-500/10 text-amber-600 border-amber-200', label: '弱' }
  }
}

function getCategoryConfig(category: string) {
  switch (category) {
    case 'strategic':
      return { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', label: '战略' }
    case 'hiring':
      return { color: 'bg-teal-500/10 text-teal-700 border-teal-200', label: '招聘' }
    case 'technical':
      return { color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200', label: '技术' }
    case 'financial':
      return { color: 'bg-amber-500/10 text-amber-700 border-amber-200', label: '财务' }
    case 'product':
      return { color: 'bg-violet-500/10 text-violet-700 border-violet-200', label: '产品' }
    default:
      return { color: 'bg-slate-500/10 text-slate-700 border-slate-200', label: category }
  }
}

function getShardTypeBadge(type: string) {
  switch (type) {
    case 'red':
      return { color: 'bg-red-500/10 text-red-600 border-red-200', label: '红方·攻击' }
    case 'blue':
      return { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', label: '蓝方·防御' }
    case 'neutral':
      return { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: '中立·观察' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600 border-slate-200', label: type }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return { color: 'bg-emerald-500/10 text-emerald-700', label: '运行中' }
    case 'training':
      return { color: 'bg-amber-500/10 text-amber-700', label: '训练中' }
    case 'draft':
      return { color: 'bg-slate-500/10 text-slate-600', label: '草稿' }
    case 'error':
      return { color: 'bg-red-500/10 text-red-600', label: '异常' }
    case 'offline':
      return { color: 'bg-slate-500/10 text-slate-600', label: '离线' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600', label: status }
  }
}

function getAgentStatusBadge(status: string) {
  switch (status) {
    case 'working':
      return { color: 'bg-amber-500/10 text-amber-700', label: '工作中', dot: 'bg-amber-500 animate-pulse' }
    case 'idle':
      return { color: 'bg-emerald-500/10 text-emerald-700', label: '待命', dot: 'bg-emerald-500' }
    case 'sleeping':
      return { color: 'bg-slate-500/10 text-slate-600', label: '休眠', dot: 'bg-slate-400' }
    case 'error':
      return { color: 'bg-red-500/10 text-red-600', label: '异常', dot: 'bg-red-500' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600', label: status, dot: 'bg-slate-400' }
  }
}

function getAgentConfig(name: string) {
  switch (name) {
    case 'CEO':
      return { icon: Crown, accent: 'amber', color: '#f59e0b', bgLight: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', hoverBorder: 'hover:border-amber-500/40', shadow: 'hover:shadow-amber-500/5' }
    case 'CTO':
      return { icon: Cpu, accent: 'cyan', color: '#06b6d4', bgLight: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-200', hoverBorder: 'hover:border-cyan-500/40', shadow: 'hover:shadow-cyan-500/5' }
    case 'Growth':
      return { icon: Rocket, accent: 'emerald', color: '#10b981', bgLight: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-500/40', shadow: 'hover:shadow-emerald-500/5' }
    case 'Engineer':
      return { icon: Wrench, accent: 'teal', color: '#14b8a6', bgLight: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-200', hoverBorder: 'hover:border-teal-500/40', shadow: 'hover:shadow-teal-500/5' }
    default:
      return { icon: Brain, accent: 'slate', color: '#64748b', bgLight: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-200', hoverBorder: 'hover:border-slate-500/40', shadow: 'hover:shadow-slate-500/5' }
  }
}

function getPhaseConfig(phase: string) {
  switch (phase) {
    case 'planning':
      return { label: '规划', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200', icon: FileText }
    case 'executing':
      return { label: '执行', color: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: Loader2 }
    case 'reporting':
      return { label: '报告', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: TrendingUp }
    case 'completed':
      return { label: '完成', color: 'bg-teal-500/10 text-teal-700 border-teal-200', icon: CheckCircle2 }
    default:
      return { label: phase, color: 'bg-slate-500/10 text-slate-600 border-slate-200', icon: Clock }
  }
}

function getModelDisplay(modelBase: string): string {
  const map: Record<string, string> = {
    qwen: 'Qwen-72B',
    llama: 'Llama-3-70B',
    qwen14b: 'Qwen-14B',
    'llama-3': 'Llama-3-70B',
    glm: 'GLM-4',
    deepseek: 'DeepSeek-V2',
  }
  return map[modelBase] || modelBase
}

// ─── Parse AI Simulation Output ──────────────────────────────────────────────

function parseRedOutput(raw: string | null): Vulnerability[] {
  if (!raw) return []
  try {
    const json = JSON.parse(raw)
    const vulns = json.vulnerabilities || []
    return vulns.map((v: Record<string, string>, i: number) => {
      const sev = v.severity || '中危'
      let severity: Vulnerability['severity'] = 'medium'
      if (sev === '致命' || sev === 'critical') severity = 'critical'
      else if (sev === '高危' || sev === 'high') severity = 'high'
      return {
        id: `rv-${i}`,
        title: v.impact || v.description?.substring(0, 20) || `漏洞 #${i + 1}`,
        severity,
        description: v.description || '',
      }
    })
  } catch {
    const lines = raw.split('\n').filter((l) => l.trim().length > 0)
    return lines.slice(0, 5).map((line, i) => ({
      id: `rv-${i}`,
      title: line.substring(0, 30) || `风险 #${i + 1}`,
      severity: (i === 0 ? 'critical' : i === 1 ? 'high' : 'medium') as Vulnerability['severity'],
      description: line,
    }))
  }
}

function parseBlueOutput(raw: string | null): DefenseStrategy[] {
  if (!raw) return []
  try {
    const json = JSON.parse(raw)
    const defs = json.defenses || []
    return defs.map((d: Record<string, string>, i: number) => {
      const str = d.strength || '中'
      let strength: DefenseStrategy['strength'] = 'moderate'
      if (str === '强' || str === 'strong') strength = 'strong'
      else if (str === '弱' || str === 'weak') strength = 'weak'
      return {
        id: `bd-${i}`,
        title: d.strategy?.substring(0, 30) || d.target_vulnerability || `策略 #${i + 1}`,
        strength,
        description: d.strategy || '',
      }
    })
  } catch {
    const lines = raw.split('\n').filter((l) => l.trim().length > 0)
    return lines.slice(0, 5).map((line, i) => ({
      id: `bd-${i}`,
      title: line.substring(0, 30) || `防御 #${i + 1}`,
      strength: (i === 0 ? 'strong' : 'moderate') as DefenseStrategy['strength'],
      description: line,
    }))
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ConfidenceGauge({ value, threshold = 60 }: { value: number; threshold: number }) {
  const circumference = 2 * Math.PI * 54
  const progress = (value / 100) * circumference
  const thresholdAngle = (threshold / 100) * 360
  const thresholdX = 60 + 54 * Math.sin((thresholdAngle * Math.PI) / 180)
  const thresholdY = 60 - 54 * Math.cos((thresholdAngle * Math.PI) / 180)

  const strokeColor =
    value > 80 ? 'stroke-emerald-500' : value >= 60 ? 'stroke-amber-500' : 'stroke-red-500'

  const glowColor =
    value > 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" className="stroke-muted" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none" className={strokeColor} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor}40)`, transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(0deg)' }}>
          <line
            x1={60 + 48 * Math.sin((thresholdAngle * Math.PI) / 180)}
            y1={60 - 48 * Math.cos((thresholdAngle * Math.PI) / 180)}
            x2={60 + 60 * Math.sin((thresholdAngle * Math.PI) / 180)}
            y2={60 - 60 * Math.cos((thresholdAngle * Math.PI) / 180)}
            stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
          />
          <text x={thresholdX + 4} y={thresholdY - 2} className="fill-amber-500" fontSize="6" fontWeight="600" textAnchor="start">
            {threshold}%
          </text>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className={`text-2xl font-bold ${getConfidenceColor(value)}`}>{value}%</span>
          <span className="text-[10px] text-muted-foreground">置信度</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-muted-foreground">&gt;80%</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-muted-foreground">60-80%</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-muted-foreground">&lt;60%</span></div>
      </div>
    </div>
  )
}

function ShardCard({ shard }: { shard: ShardRow }) {
  const typeBadge = getShardTypeBadge(shard.shardType)
  const statusBadge = getStatusBadge(shard.status)
  const confidencePercent = Math.round(shard.confidence * 100)

  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${shard.shardType === 'red' ? 'bg-red-500' : shard.shardType === 'blue' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${shard.shardType === 'red' ? 'bg-red-500/10 text-red-500' : shard.shardType === 'blue' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
              {shard.shardType === 'red' ? <Swords className="h-4 w-4" /> : shard.shardType === 'blue' ? <Shield className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{shard.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{getModelDisplay(shard.modelBase)}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusBadge.color}`}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">置信度</span>
            <span className={`font-semibold ${getConfidenceColor(confidencePercent)}`}>{confidencePercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${getConfidenceBg(confidencePercent)}`} style={{ width: `${confidencePercent}%` }} />
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeBadge.color}`}>{typeBadge.label}</Badge>
        {shard.description && <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{shard.description}</p>}
      </CardContent>
    </Card>
  )
}

function ShardCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.5 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-8" /></div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-16 rounded-full" />
      </CardContent>
    </Card>
  )
}

function CreateShardCard({ onCreate }: { onCreate: () => void; disabled?: boolean }) {
  return (
    <Card className="group flex flex-col items-center justify-center border-dashed border-2 border-border/50 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer min-h-[180px]" onClick={onCreate}>
      <CardContent className="flex flex-col items-center justify-center gap-2 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110"><Plus className="h-5 w-5" /></div>
        <span className="text-sm font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">创建新分身</span>
        <span className="text-[10px] text-muted-foreground/60">吸收新的认知维度</span>
      </CardContent>
    </Card>
  )
}

function DecisionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-4 w-10 rounded-full" /></div>
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-10" />
    </div>
  )
}

// ─── Agent Role Card ─────────────────────────────────────────────────────────

function AgentRoleCard({ agent, onStartCycle, isTriggering }: { agent: AgentRoleRow; onStartCycle: (id: string) => void; isTriggering: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const config = getAgentConfig(agent.name)
  const statusBadge = getAgentStatusBadge(agent.status)
  const IconComponent = config.icon
  const capabilities = useMemo(() => {
    if (!agent.capabilities) return []
    try { return JSON.parse(agent.capabilities) as string[] } catch { return [] }
  }, [agent.capabilities])

  return (
    <Card className={`group relative overflow-hidden border-border/60 transition-all duration-300 ${config.hoverBorder} hover:shadow-lg ${config.shadow}`}>
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: config.color }} />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgLight} ${config.text}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{agent.name} Agent</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {agent.name === 'CEO' ? '飘叔CEO分身' : agent.name === 'CTO' ? '技术总监分身' : agent.name === 'Growth' ? '增长引擎分身' : agent.name === 'Engineer' ? '工程执行分身' : 'AI代理'}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusBadge.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} mr-1`} />
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {/* Cycle info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">已完成周期</span>
          <span className="font-semibold" style={{ color: config.color }}>{agent.cycleCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">最近执行</span>
          <span className="text-muted-foreground">
            {agent.lastCycleAt ? new Date(agent.lastCycleAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '暂无'}
          </span>
        </div>

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {capabilities.slice(0, 4).map((cap, i) => (
              <Badge key={i} variant="outline" className={`text-[9px] px-1.5 py-0 ${config.border} ${config.text}`}>
                {cap}
              </Badge>
            ))}
            {capabilities.length > 4 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                +{capabilities.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className={`gap-1.5 text-xs ${config.text} ${config.bgLight} hover:opacity-80 border ${config.border}`}
            variant="outline"
            onClick={() => onStartCycle(agent.id)}
            disabled={isTriggering || agent.status === 'working'}
          >
            {isTriggering || agent.status === 'working' ? (
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

        {/* Expanded: Recent Cycles */}
        {expanded && (
          <div className="pt-2 border-t space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {agent.cycles && agent.cycles.length > 0 ? (
              agent.cycles.map((cycle) => {
                const phaseConfig = getPhaseConfig(cycle.phase)
                const PhaseIcon = phaseConfig.icon
                return (
                  <div key={cycle.id} className="rounded-lg border border-border/60 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <PhaseIcon className={`h-3 w-3 ${cycle.phase === 'executing' ? 'animate-spin' : ''}`} style={{ color: config.color }} />
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${phaseConfig.color}`}>{phaseConfig.label}</Badge>
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(cycle.startedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {cycle.report && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{cycle.report}</p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-2">暂无周期记录</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AgentCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60">
      <div className="h-0.5 w-full bg-muted animate-pulse" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="flex items-center justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-6" /></div>
        <div className="flex items-center justify-between"><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-20" /></div>
        <div className="flex gap-1"><Skeleton className="h-4 w-12 rounded-full" /><Skeleton className="h-4 w-14 rounded-full" /><Skeleton className="h-4 w-10 rounded-full" /></div>
        <div className="flex gap-2 pt-1"><Skeleton className="h-7 w-20 rounded-md" /><Skeleton className="h-7 w-16 rounded-md" /></div>
      </CardContent>
    </Card>
  )
}

// ─── Daily Cycle Progress Panel ──────────────────────────────────────────────

function CycleProgressPanel({ activeCycles }: { activeCycles: { agentId: string; agentName: string; phase: string; startedAt: string }[] }) {
  if (activeCycles.length === 0) return null

  const phases = ['planning', 'executing', 'reporting', 'completed']

  return (
    <Card className="border-teal-500/20 bg-teal-500/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500/10 text-teal-500">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-sm text-teal-700">周期执行监控</CardTitle>
          <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-600">
            {activeCycles.length} 进行中
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeCycles.map((cycle) => {
          const config = getAgentConfig(cycle.agentName)
          const currentPhaseIdx = phases.indexOf(cycle.phase)
          return (
            <div key={cycle.agentId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse`} />
                  <span className="text-xs font-medium" style={{ color: config.color }}>{cycle.agentName} Agent</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(cycle.startedAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 开始
                </span>
              </div>
              <div className="flex items-center gap-1">
                {phases.map((phase, idx) => {
                  const phaseConfig = getPhaseConfig(phase)
                  const isCompleted = idx < currentPhaseIdx
                  const isCurrent = idx === currentPhaseIdx
                  return (
                    <div key={phase} className="flex items-center gap-1 flex-1">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        isCompleted ? 'bg-teal-500/10 text-teal-700' :
                        isCurrent ? 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-300/50' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        {isCurrent && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                        {isCompleted && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {phaseConfig.label}
                      </div>
                      {idx < phases.length - 1 && (
                        <div className={`h-px flex-1 ${isCompleted ? 'bg-teal-300' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

function ActivityFeed({ agents, memories }: { agents: AgentRoleRow[]; memories: unknown[] }) {
  const activities = useMemo(() => {
    const items: { id: string; type: string; agent: string; content: string; time: string; color: string }[] = []

    // Add agent cycle activities
    for (const agent of agents) {
      if (agent.lastCycleAt) {
        const config = getAgentConfig(agent.name)
        items.push({
          id: `agent-${agent.id}`,
          type: 'agent_cycle',
          agent: agent.name,
          content: `${agent.name} Agent 完成周期 #${agent.cycleCount}`,
          time: agent.lastCycleAt,
          color: config.color,
        })
      }
    }

    // Add recent memories
    const memList = (memories || []) as { id: string; sourceType: string; content: string; createdAt: string; tags?: string }[]
    for (const mem of memList.slice(0, 10)) {
      if (mem.sourceType === 'agent_cycle') {
        const agentTag = (mem.tags || '').split(',').find(t => ['CEO', 'CTO', 'Growth', 'Engineer'].includes(t.trim()))
        const config = getAgentConfig(agentTag?.trim() || '')
        items.push({
          id: mem.id,
          type: 'memory',
          agent: agentTag?.trim() || '系统',
          content: mem.content,
          time: mem.createdAt,
          color: config.color,
        })
      }
    }

    // Sort by time desc
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    return items.slice(0, 15)
  }, [agents, memories])

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-600" />
          <CardTitle className="text-sm">活动流</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{activities.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {activities.length > 0 ? activities.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                <div className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium" style={{ color: item.color }}>{item.agent}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">
                      {item.type === 'agent_cycle' ? '周期' : '记忆'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">{item.content}</p>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">
                  {new Date(item.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {idx < activities.length - 1 && <Separator />}
            </div>
          )) : (
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function CognitiveEngineView() {
  const [strategyInput, setStrategyInput] = useState('')
  const [simulationResult, setSimulationResult] = useState<SimulationRow | null>(null)
  const [triggeringAgentId, setTriggeringAgentId] = useState<string | null>(null)
  const [vectorQuery, setVectorQuery] = useState('')
  const [vectorServiceOnline, setVectorServiceOnline] = useState(false)
  const humanThreshold = 60
  const { toast } = useToast()

  // ── Data hooks ──────────────────────────────────────────────────────────
  const { data: shardsData, isLoading: shardsLoading } = useShards()
  const createShardMutation = useCreateShard()
  const runSimulationMutation = useRunSimulation()
  const { data: decisionsData, isLoading: decisionsLoading } = useDecisions()
  const { data: memoriesData, isLoading: memoriesLoading } = useMemories()
  const { data: agentsData, isLoading: agentsLoading } = useAgentRoles()
  const triggerCycleMutation = useTriggerCycle()
  const vectorSearchMutation = useVectorSearch()
  const vectorSyncMutation = useVectorSync()
  const { data: vectorCollectionsData } = useVectorCollections()

  // ── Vector service health check ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/health?XTransformPort=3004')
      .then(res => { if (res.ok) setVectorServiceOnline(true); else setVectorServiceOnline(false) })
      .catch(() => setVectorServiceOnline(false))
  }, [])

  // ── Derived data ────────────────────────────────────────────────────────
  const shards: ShardRow[] = useMemo(
    () => (shardsData?.shards as ShardRow[]) || [],
    [shardsData]
  )

  const decisions: DecisionRow[] = useMemo(
    () => (decisionsData?.decisions as DecisionRow[]) || [],
    [decisionsData]
  )

  const agents: AgentRoleRow[] = useMemo(
    () => (agentsData?.agents as AgentRoleRow[]) || [],
    [agentsData]
  )

  const memories = useMemo(
    () => (memoriesData?.memories as unknown[]) || [],
    [memoriesData]
  )

  const systemConfidence = useMemo(() => {
    if (shards.length === 0) return 0
    const avg = shards.reduce((sum, s) => sum + s.confidence, 0) / shards.length
    return Math.round(avg * 100)
  }, [shards])

  const activeShardCount = useMemo(
    () => shards.filter((s) => s.status === 'active' || s.status === 'training').length,
    [shards]
  )

  // ── Parsed simulation outputs ───────────────────────────────────────────
  const vulnerabilities = useMemo(
    () => parseRedOutput(simulationResult?.redOutput),
    [simulationResult?.redOutput]
  )

  const defenses = useMemo(
    () => parseBlueOutput(simulationResult?.blueOutput),
    [simulationResult?.blueOutput]
  )

  const simConfidencePercent = useMemo(
    () => (simulationResult ? Math.round(simulationResult.confidence * 100) : 0),
    [simulationResult]
  )

  const isEscalated = useMemo(
    () => simulationResult ? simulationResult.confidence < 0.6 : false,
    [simulationResult]
  )

  // Active cycles for progress panel
  const activeCycles = useMemo(() => {
    return agents
      .filter(a => a.status === 'working')
      .map(a => {
        const latestCycle = a.cycles?.find(c => c.phase !== 'completed')
        return {
          agentId: a.id,
          agentName: a.name,
          phase: latestCycle?.phase || 'planning',
          startedAt: latestCycle?.startedAt || new Date().toISOString(),
        }
      })
  }, [agents])

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCreateShard = () => {
    const names = ['战略分析分身', '市场洞察分身', '技术评估分身', '风险预警分身', '产品直觉分身']
    const types = ['red', 'blue', 'neutral'] as const
    const models = ['qwen', 'llama', 'qwen14b'] as const
    const randomName = names[Math.floor(Math.random() * names.length)]
    const randomType = types[Math.floor(Math.random() * types.length)]
    const randomModel = models[Math.floor(Math.random() * models.length)]

    createShardMutation.mutate({
      name: randomName,
      description: `${randomName} - 负责${randomType === 'red' ? '攻击视角的风险识别' : randomType === 'blue' ? '防御视角的策略构建' : '中立的客观观察'}`,
      modelBase: randomModel,
      shardType: randomType,
    })
  }

  const handleStartAdversarial = async () => {
    if (!strategyInput.trim()) return
    setSimulationResult(null)

    try {
      const result = await runSimulationMutation.mutateAsync({ inputIdea: strategyInput })
      if (result?.simulation) {
        setSimulationResult(result.simulation as SimulationRow)
      }
    } catch {
      // Error is handled by the mutation state
    }
  }

  const handleTriggerCycle = async (agentId: string) => {
    setTriggeringAgentId(agentId)
    try {
      await triggerCycleMutation.mutateAsync({ agentId })
      toast({
        title: '周期完成',
        description: '代理已完成一个完整的日周期 (规划→执行→报告)',
      })
    } catch {
      toast({
        title: '周期执行失败',
        description: '代理周期执行过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setTriggeringAgentId(null)
    }
  }

  const handleVectorSearch = async () => {
    if (!vectorQuery.trim()) return
    try {
      await vectorSearchMutation.mutateAsync({ query: vectorQuery, topK: 8 })
    } catch {
      toast({
        title: '语义搜索失败',
        description: '向量搜索服务暂时不可用',
        variant: 'destructive',
      })
    }
  }

  const handleVectorSync = async () => {
    try {
      const result = await vectorSyncMutation.mutateAsync()
      if (result?.data) {
        toast({
          title: '记忆同步完成',
          description: `成功嵌入 ${result.data.synced}/${result.data.total} 条记忆`,
        })
      }
    } catch {
      toast({
        title: '记忆同步失败',
        description: '向量服务暂时不可用',
        variant: 'destructive',
      })
    }
  }

  const isSimulating = runSimulationMutation.isPending

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">认知分片引擎</h1>
              <p className="text-xs text-muted-foreground">
                创始人战略直觉数字化 · 认知分身与红蓝对抗系统
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-500/5">
              <Dna className="h-3 w-3" />
              🧬 SOUL.md 人格已加载
            </Badge>
            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-500/5">
              <Zap className="h-3 w-3" />
              引擎在线
            </Badge>
            <Badge variant="outline" className={`gap-1 ${vectorServiceOnline ? 'text-emerald-600 border-emerald-200 bg-emerald-500/5' : 'text-red-600 border-red-200 bg-red-500/5'}`}>
              {vectorServiceOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {vectorServiceOnline ? '向量服务' : '向量离线'}
            </Badge>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              v3.0
            </Badge>
          </div>
        </div>

        <Separator />

        {/* ── Section 1: Digital Twin Management ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold">分身管理区</h2>
            <Badge variant="secondary" className="text-[10px]">
              {shardsLoading ? '...' : `${activeShardCount} 活跃`}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shardsLoading ? (
              <><ShardCardSkeleton /><ShardCardSkeleton /><ShardCardSkeleton /></>
            ) : (
              shards.map((shard) => <ShardCard key={shard.id} shard={shard} />)
            )}
            <CreateShardCard onCreate={handleCreateShard} disabled={createShardMutation.isPending} />
            {createShardMutation.isPending && <ShardCardSkeleton />}
          </div>
          {createShardMutation.isError && (
            <p className="text-xs text-red-500">创建分身失败: {(createShardMutation.error as Error)?.message || '未知错误'}</p>
          )}
        </section>

        {/* ── Section 2: Mission Control (使命调度中心) ─────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600" />
            <h2 className="text-base font-semibold">使命调度中心</h2>
            <Badge variant="secondary" className="text-[10px]">
              {agentsLoading ? '...' : `${agents.filter(a => a.status === 'working').length} 执行中`}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-600 bg-teal-500/5">
              Polsia架构
            </Badge>
          </div>

          {/* Agent Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentsLoading ? (
              <><AgentCardSkeleton /><AgentCardSkeleton /><AgentCardSkeleton /><AgentCardSkeleton /></>
            ) : (
              agents.map((agent) => (
                <AgentRoleCard
                  key={agent.id}
                  agent={agent}
                  onStartCycle={handleTriggerCycle}
                  isTriggering={triggeringAgentId === agent.id}
                />
              ))
            )}
          </div>

          {/* Daily Cycle Progress Panel */}
          <CycleProgressPanel activeCycles={activeCycles} />

          {/* Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed agents={agents} memories={memories} />

            {/* Memory Continuity Overview */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm">记忆连续性</CardTitle>
                </div>
                <CardDescription className="text-xs">跨代理记忆链与连贯性指标</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {memoriesLoading ? (
                  <><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">记忆总量</span>
                      <span className="text-sm font-semibold">{memoriesData?.total || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">连续性评分</span>
                      <span className={`text-sm font-semibold ${getConfidenceColor(memoriesData?.continuity || 0)}`}>
                        {Math.round(memoriesData?.continuity || 0)}%
                      </span>
                    </div>
                    <Progress value={memoriesData?.continuity || 0} className="h-1.5" />
                    {/* Memory Chains */}
                    {memoriesData?.memoryChains && (memoriesData.memoryChains as { sourceType: string; count: number; latestContent: string }[]).length > 0 && (
                      <div className="pt-2 border-t space-y-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">记忆链条</span>
                        {(memoriesData.memoryChains as { sourceType: string; count: number; latestContent: string }[]).map((chain, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">{chain.sourceType}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{chain.count} 条</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Agent Memory Counts */}
                    {memoriesData?.agentMemoryCounts && Object.keys(memoriesData.agentMemoryCounts).length > 0 && (
                      <div className="pt-2 border-t space-y-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">代理记忆分布</span>
                        {Object.entries(memoriesData.agentMemoryCounts as Record<string, number>).map(([agentName, count]) => {
                          const config = getAgentConfig(agentName)
                          return (
                            <div key={agentName} className="flex items-center justify-between text-[10px]">
                              <span style={{ color: config.color }}>{agentName}</span>
                              <span className="text-muted-foreground">{count} 条</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Section 3: Red-Blue Adversarial Simulator ──────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold">红蓝对抗模拟器</h2>
            <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-500/5">RED</Badge>
            <span className="text-muted-foreground text-xs">vs</span>
            <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-500/5">BLUE</Badge>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">输入战略假设</CardTitle>
              <CardDescription className="text-xs">输入你的战略构想、产品决策或风险假设，启动红蓝对抗模拟</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="例如：我们应该在Q1进入东南亚市场，利用现有技术优势快速建立据点..."
                className="min-h-[100px] resize-none text-sm"
                value={strategyInput}
                onChange={(e) => setStrategyInput(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span>置信度低于阈值 → 自动触发人工介入</span>
                  <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600">阈值 {humanThreshold}%</Badge>
                </div>
                <Button
                  onClick={handleStartAdversarial}
                  disabled={!strategyInput.trim() || isSimulating}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {isSimulating ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />AI分析中...</>
                  ) : (
                    <><Swords className="h-4 w-4" />启动对抗</>
                  )}
                </Button>
              </div>
              {runSimulationMutation.isError && (
                <p className="text-xs text-red-500">对抗模拟失败: {(runSimulationMutation.error as Error)?.message || '未知错误'}</p>
              )}
            </CardContent>
          </Card>

          {/* Adversarial output panels */}
          {(isSimulating || simulationResult) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Red Team Panel */}
              <Card className="border-red-500/20 bg-red-500/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-500/10 text-red-500"><Swords className="h-3.5 w-3.5" /></div>
                    <CardTitle className="text-sm text-red-700">红方攻击</CardTitle>
                    {!isSimulating && <Badge variant="outline" className="text-[10px] border-red-200 text-red-600">{vulnerabilities.length} 致命漏洞</Badge>}
                  </div>
                  <CardDescription className="text-xs">攻击视角：识别战略中的致命缺陷与潜在风险</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isSimulating ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-red-500/5 animate-pulse" />)
                  ) : vulnerabilities.length > 0 ? (
                    vulnerabilities.map((vuln) => {
                      const severityConfig = getSeverityConfig(vuln.severity)
                      return (
                        <div key={vuln.id} className="rounded-lg border border-red-200/60 bg-background p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-xs font-semibold">{vuln.title}</span></div>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severityConfig.color}`}>{severityConfig.label}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{vuln.description}</p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">红方攻击结果解析为空</p>
                  )}
                </CardContent>
              </Card>

              {/* Blue Team Panel */}
              <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500"><Shield className="h-3.5 w-3.5" /></div>
                    <CardTitle className="text-sm text-emerald-700">蓝方防御</CardTitle>
                    {!isSimulating && <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600">{defenses.length} 防御策略</Badge>}
                  </div>
                  <CardDescription className="text-xs">防御视角：构建反证论据与战略加固方案</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isSimulating ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-emerald-500/5 animate-pulse" />)
                  ) : defenses.length > 0 ? (
                    defenses.map((defense) => {
                      const strengthConfig = getStrengthConfig(defense.strength)
                      return (
                        <div key={defense.id} className="rounded-lg border border-emerald-200/60 bg-background p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs font-semibold">{defense.title}</span></div>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${strengthConfig.color}`}>强度: {strengthConfig.label}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{defense.description}</p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">蓝方防御结果解析为空</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Verdict Section */}
          {simulationResult && !isSimulating && (
            <Card className={`border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5 ${isEscalated ? '!border-red-500/40 !from-red-500/5 !via-background !to-red-500/5' : ''}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isEscalated ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">对抗裁决</h3>
                      <Badge className={`text-[10px] ${isEscalated ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {isEscalated ? '需人工介入' : simulationResult.status === 'escalated' ? '已升级' : '通过'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{simulationResult.verdict || '分析完成'}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0 sm:ml-4">
                    <span className={`text-2xl font-bold ${isEscalated ? 'text-red-600' : 'text-emerald-600'}`}>{simConfidencePercent}%</span>
                    <span className="text-[10px] text-muted-foreground">综合置信度</span>
                  </div>
                </div>
                {isEscalated && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-300/60 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <span className="text-[11px] text-red-700 font-medium">
                      ⚠️ 置信度低于阈值（{simConfidencePercent}% &lt; {humanThreshold}%）→ 自动触发人工介入！需要创始人审核后方可执行。
                    </span>
                  </div>
                )}
                {!isEscalated && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-200/60 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] text-amber-700">
                      置信度高于阈值 → 无需人工介入（当前 {simConfidencePercent}% &gt; 阈值 {humanThreshold}%）
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Section 4: Vector Semantic Search ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-600" />
            <h2 className="text-base font-semibold">向量语义搜索</h2>
            <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-600 bg-teal-500/5">
              Qdrant替代
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {vectorCollectionsData?.data?.total ?? 0} 向量
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-teal-500/20 bg-teal-500/[0.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500/10 text-teal-500">
                        <Search className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm text-teal-700">语义搜索</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs border-teal-200 text-teal-600 hover:bg-teal-500/10"
                      onClick={handleVectorSync}
                      disabled={vectorSyncMutation.isPending}
                    >
                      {vectorSyncMutation.isPending ? (
                        <><Loader2 className="h-3 w-3 animate-spin" />同步中...</>
                      ) : (
                        <><RefreshCw className="h-3 w-3" />同步记忆到向量库</>
                      )}
                    </Button>
                  </div>
                  <CardDescription className="text-xs">基于向量嵌入的语义搜索，查找语义最相关的记忆条目</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入搜索查询，例如：市场扩张策略..."
                      className="flex-1 text-sm"
                      value={vectorQuery}
                      onChange={(e) => setVectorQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVectorSearch()}
                    />
                    <Button
                      onClick={handleVectorSearch}
                      disabled={!vectorQuery.trim() || vectorSearchMutation.isPending}
                      className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                    >
                      {vectorSearchMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />搜索中...</>
                      ) : (
                        <><Search className="h-4 w-4" />搜索</>
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {vectorSearchMutation.isPending && (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-lg bg-teal-500/5 animate-pulse" />
                      ))}
                    </div>
                  )}

                  {vectorSearchMutation.data?.data?.results && vectorSearchMutation.data.data.results.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          找到 {vectorSearchMutation.data.data.total} 个相关结果
                        </span>
                        <Badge variant="outline" className="text-[9px] border-teal-200 text-teal-600">
                          {vectorSearchMutation.data.data.queryDimensions}维向量
                        </Badge>
                      </div>
                      {vectorSearchMutation.data.data.results.map((result, idx) => (
                        <div key={result.id} className="rounded-lg border border-border/60 bg-background p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 text-[10px] font-bold">
                                #{idx + 1}
                              </div>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-teal-200 text-teal-600">
                                {result.metadata?.sourceType || 'unknown'}
                              </Badge>
                              {result.metadata?.tags && (
                                <span className="text-[9px] text-muted-foreground">
                                  {String(result.metadata.tags).split(',').slice(0, 2).join(', ')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-teal-600">
                                {(result.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                            {result.text}
                          </p>
                          {/* Similarity bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground shrink-0">相似度</span>
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  result.similarity > 0.8 ? 'bg-emerald-500' :
                                  result.similarity > 0.6 ? 'bg-teal-500' :
                                  result.similarity > 0.4 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.round(result.similarity * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {vectorSearchMutation.data?.data?.results?.length === 0 && !vectorSearchMutation.isPending && vectorQuery && (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <Search className="h-6 w-6 mb-2 opacity-40" />
                      <p className="text-xs">未找到语义相关结果</p>
                      <p className="text-[10px] mt-1">尝试同步记忆到向量库后重试</p>
                    </div>
                  )}

                  {vectorSearchMutation.isError && (
                    <div className="rounded-md bg-red-500/10 border border-red-200/60 px-3 py-2">
                      <span className="text-[11px] text-red-700 font-medium">
                        向量搜索服务暂不可用，请确认向量服务是否已启动
                      </span>
                    </div>
                  )}

                  {vectorSyncMutation.isSuccess && vectorSyncMutation.data?.data && (
                    <div className="rounded-md bg-emerald-500/10 border border-emerald-200/60 px-3 py-2">
                      <span className="text-[11px] text-emerald-700">
                        ✅ 记忆同步完成: {vectorSyncMutation.data.data.synced} 条成功嵌入, {vectorSyncMutation.data.data.errors} 条失败
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Vector Stats Panel */}
            <div className="space-y-4">
              <Card className="border-teal-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500/10 text-teal-500">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </div>
                    <CardTitle className="text-sm">向量库状态</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">服务状态</span>
                    <Badge variant="outline" className={`text-[10px] ${vectorServiceOnline ? 'border-emerald-200 text-emerald-600' : 'border-red-200 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${vectorServiceOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {vectorServiceOnline ? '在线' : '离线'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">存储向量数</span>
                    <span className="text-sm font-semibold text-teal-600">
                      {vectorCollectionsData?.data?.total ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">向量维度</span>
                    <span className="text-sm font-semibold">64</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">相似度算法</span>
                    <span className="text-xs font-medium">余弦相似度</span>
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">最近入库向量</span>
                    {vectorCollectionsData?.data?.vectors?.slice(0, 5).map((vec) => (
                      <div key={vec.id} className="flex items-center gap-2 text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-teal-500 shrink-0" />
                        <span className="text-muted-foreground truncate flex-1">{vec.text.substring(0, 40)}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-teal-200 text-teal-600 shrink-0">
                          {vec.metadata?.sourceType || 'unknown'}
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-[10px] text-muted-foreground text-center py-2">暂无向量数据</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Section 5: Decision Log + Confidence Dashboard ──────── ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decision Log */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold">决策日志</h2>
              <Badge variant="secondary" className="text-[10px]">{decisionsLoading ? '...' : `${decisions.length} 条记录`}</Badge>
            </div>
            <Card className="border-border/60">
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {decisionsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i}><DecisionSkeleton />{i < 4 && <Separator />}</div>
                    ))
                  ) : decisions.length > 0 ? (
                    decisions.map((entry, index) => {
                      const categoryConfig = getCategoryConfig(entry.category)
                      const confidencePercent = Math.round(entry.confidence * 100)
                      return (
                        <div key={entry.id}>
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${confidencePercent > 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              <TrendingUp className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{entry.title}</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${categoryConfig.color}`}>{categoryConfig.label}</Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-sm font-semibold ${getConfidenceColor(confidencePercent)}`}>{confidencePercent}%</span>
                            </div>
                          </div>
                          {index < decisions.length - 1 && <Separator />}
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Clock className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-xs">暂无决策记录</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Confidence Dashboard */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold">置信度仪表盘</h2>
            </div>
            <Card className="border-border/60">
              <CardContent className="pt-6 flex flex-col items-center gap-4">
                <ConfidenceGauge value={systemConfidence} threshold={humanThreshold} />
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">分身数量</span>
                    <span className="font-semibold">{shards.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">活跃分身</span>
                    <span className="font-semibold text-emerald-600">{activeShardCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">代理周期总数</span>
                    <span className="font-semibold text-teal-600">{agents.reduce((sum, a) => sum + a.cycleCount, 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
