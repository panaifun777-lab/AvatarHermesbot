'use client'

import { useState, useMemo } from 'react'
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
import {
  Target,
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Flag,
  Zap,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useRoadmap } from '@/lib/api-hooks'

// ─── Types ───────────────────────────────────────────────────────────────────

type MilestoneStatus = 'completed' | 'in_progress' | 'pending'

interface ApiPhase {
  id: string
  phase: number
  name: string
  startDate: string
  endDate: string
  status: string
  milestones: ApiMilestone[]
}

interface ApiMilestone {
  id: string
  title: string
  description?: string | null
  targetDate: string
  status: string
  order: number
}

interface Metric {
  label: string
  value: string
  target: string
  status: 'pass' | 'na' | 'pending'
  phase: string
}

// ─── Static Data (metrics) ───────────────────────────────────────────────────

const metrics: Metric[] = [
  { label: '凭证生成时间', value: '1.8s', target: '< 2s', status: 'pass', phase: 'Phase 1' },
  { label: '链上查询延迟', value: '380ms', target: '< 500ms', status: 'pass', phase: 'Phase 1' },
  { label: '分身漏洞准确率', value: 'N/A', target: '> 70%', status: 'na', phase: 'Phase 2' },
  { label: '外部协作完成数', value: '0', target: '10次', status: 'pending', phase: 'Phase 3' },
  { label: '系统资金异常', value: '0', target: '0', status: 'pass', phase: '全局' },
  { label: '权限越界Bug', value: '0', target: '0', status: 'pass', phase: '全局' },
]

// Phase descriptions and criteria (static supplementary data)
const PHASE_DETAILS: Record<number, { goal: string; criteria: string; period: string }> = {
  1: {
    goal: '实现"输入一段访谈记录 → 自动提取假设 → 生成带哈希的VC凭证"',
    criteria: '凭证生成时间 < 2秒，链上查询延迟 < 500ms',
    period: 'D1-D30',
  },
  2: {
    goal: '上线"虚拟红蓝对抗"功能。输入新想法，分身必须输出至少3个致命漏洞',
    criteria: '分身找出的漏洞，经人工复核，准确率需 > 70%。达不到就换基座模型',
    period: 'D31-D60',
  },
  3: {
    goal: '验证"任务发布 → 节点接单 → 代码提交 → 自动化审计 → 微支付结算"全链路',
    criteria: '完成至少10次无摩擦的外部协作。系统无资金卡死或权限越界Bug',
    period: 'D61-D90',
  },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MilestoneIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
    case 'in_progress':
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
    default:
      return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
        <Zap className="mr-1 h-3 w-3" />
        进行中
      </Badge>
    )
  }
  if (status === 'completed') {
    return (
      <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-teal-200">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        已完成
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      <Clock className="mr-1 h-3 w-3" />
      待启动
    </Badge>
  )
}

function PhaseCard({ phase, details }: { phase: ApiPhase; details?: { goal: string; criteria: string; period: string } }) {
  const [expanded, setExpanded] = useState(phase.status === 'active')

  const completedCount = phase.milestones.filter(
    (m) => m.status === 'completed'
  ).length
  const totalCount = phase.milestones.length

  // Compute progress from milestone completion ratio
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const phaseColor =
    phase.status === 'active'
      ? 'border-emerald-200 bg-emerald-50/30'
      : phase.status === 'completed'
      ? 'border-teal-200 bg-teal-50/20'
      : 'border-border'

  const periodLabel = details?.period ?? `${phase.startDate?.slice(0, 10) ?? ''} - ${phase.endDate?.slice(0, 10) ?? ''}`

  return (
    <Card className={`transition-all duration-200 ${phaseColor}`}>
      {/* Header — always visible */}
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <CardHeader className="flex-1 py-4 px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Flag className="h-3.5 w-3.5" />
              Phase {phase.phase}
            </span>
            <span className="text-lg font-semibold tracking-tight">
              {phase.name}
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {periodLabel}
            </Badge>
            <StatusBadge status={phase.status} />
          </div>
          {/* Progress mini bar */}
          <div className="mt-2 flex items-center gap-3">
            <Progress
              value={progress}
              className="h-2 flex-1"
            />
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {completedCount}/{totalCount} 里程碑 · {progress}%
            </span>
          </div>
        </CardHeader>
        <div className="pr-6 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <CardContent className="px-6 pb-6 pt-0 space-y-5">
          <Separator />

          {/* Goal */}
          {details && (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Target className="h-4 w-4 text-emerald-600" />
                  目标
                </div>
                <p className="pl-5.5 text-sm text-muted-foreground leading-relaxed">
                  {details.goal}
                </p>
              </div>

              {/* Criteria */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  验收标准
                </div>
                <p className="pl-5.5 text-sm text-muted-foreground leading-relaxed">
                  {details.criteria}
                </p>
              </div>

              <Separator />
            </>
          )}

          {/* Milestones checklist */}
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-foreground mb-2">
              里程碑清单
            </div>
            {phase.milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无里程碑</p>
            ) : (
              phase.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <MilestoneIcon status={milestone.status} />
                  <span
                    className={`text-sm ${
                      milestone.status === 'completed'
                        ? 'text-muted-foreground line-through'
                        : milestone.status === 'in_progress'
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {milestone.title}
                  </span>
                  {milestone.status === 'in_progress' && (
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] border-amber-300 text-amber-600 bg-amber-50"
                    >
                      进行中
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RoadmapTrackerView() {
  const { data, isLoading, error } = useRoadmap()

  const apiPhases = (data?.phases ?? []) as ApiPhase[]

  // Sort phases by phase number
  const sortedPhases = useMemo(() => {
    return [...apiPhases].sort((a, b) => a.phase - b.phase)
  }, [apiPhases])

  // Compute overall progress
  const totalMilestones = sortedPhases.reduce((sum, p) => sum + p.milestones.length, 0)
  const completedMilestones = sortedPhases.reduce(
    (sum, p) => sum + p.milestones.filter((m) => m.status === 'completed').length,
    0
  )

  // Find the current day based on active phase
  const activePhase = sortedPhases.find((p) => p.status === 'active')
  let currentDay = 1
  let totalDays = 90

  if (activePhase) {
    const start = new Date(activePhase.startDate)
    const end = new Date(activePhase.endDate)
    const now = new Date()
    totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const elapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    currentDay = Math.max(1, Math.min(elapsed, totalDays))

    // Overall day offset
    const dayOffset = (activePhase.phase - 1) * 30
    currentDay = dayOffset + currentDay
    totalDays = 90
  }

  const overallProgress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : Math.round((currentDay / totalDays) * 100)

  return (
    <div className="space-y-6">
      {/* ── Roadmap Overview ──────────────────────────────────────────────── */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                90天硬核序列
              </CardTitle>
              <CardDescription className="text-sm">
                不追求大而全，先跑通核心链路
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                <Calendar className="mr-1 h-3 w-3" />
                第 {currentDay} 天
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {activePhase ? `Phase ${activePhase.phase} 进行中` : '待启动'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">整体进度</span>
            <span className="font-semibold text-emerald-700">
              Day {currentDay} / {totalDays}（{overallProgress}%）
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          {/* Phase timeline markers */}
          <div className="relative mt-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>D1</span>
              <span>D30</span>
              <span>D60</span>
              <span>D90</span>
            </div>
            <div className="absolute top-0 left-0 right-0 flex justify-between">
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
              <div className="h-1 w-px bg-border" />
            </div>
          </div>
          {/* Phase summaries */}
          <div className={`grid gap-3 pt-2 ${sortedPhases.length > 0 ? 'grid-cols-' + Math.min(sortedPhases.length, 3) : 'grid-cols-3'}`}
            style={{ gridTemplateColumns: `repeat(${Math.max(sortedPhases.length, 1)}, minmax(0, 1fr))` }}
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-3 text-center">
                  <Skeleton className="h-4 w-14 mx-auto mb-2" />
                  <Skeleton className="h-7 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))
            ) : sortedPhases.length === 0 ? (
              <div className="col-span-3 text-center py-4 text-muted-foreground text-sm">
                暂无阶段数据
              </div>
            ) : (
              sortedPhases.map((p) => {
                const pCompleted = p.milestones.filter((m) => m.status === 'completed').length
                const pTotal = p.milestones.length
                const pProgress = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0

                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 text-center transition-colors ${
                      p.status === 'active'
                        ? 'border-emerald-300 bg-emerald-50/60'
                        : p.status === 'completed'
                        ? 'border-teal-300 bg-teal-50/40'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Phase {p.phase}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        p.status === 'active' ? 'text-emerald-700' : p.status === 'completed' ? 'text-teal-700' : 'text-muted-foreground/60'
                      }`}
                    >
                      {pProgress}%
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {p.name}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Phase Cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ArrowRight className="h-4 w-4 text-emerald-600" />
          阶段详情
        </div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="py-4 px-6">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
            </Card>
          ))
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm">加载路线图失败，请稍后重试</p>
          </div>
        ) : sortedPhases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flag className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">暂无阶段数据</p>
          </div>
        ) : (
          sortedPhases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              details={PHASE_DETAILS[phase.phase]}
            />
          ))
        )}
      </div>

      {/* ── Key Metrics ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">关键指标追踪</CardTitle>
          </div>
          <CardDescription>实时验收指标，硬性标准不容妥协</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: card list / Desktop: table-like rows */}
          <div className="space-y-2">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                {/* Label */}
                <div className="flex items-center gap-2 sm:w-[200px] shrink-0">
                  {metric.status === 'pass' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : metric.status === 'na' ? (
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  ) : (
                    <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                {/* Value & Target */}
                <div className="flex items-center gap-3 pl-6 sm:pl-0 sm:flex-1 sm:justify-between">
                  <span className="text-sm text-foreground font-semibold">
                    {metric.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    目标 {metric.target}
                  </span>
                </div>
                {/* Phase tag & Status */}
                <div className="flex items-center gap-2 pl-6 sm:pl-0 sm:shrink-0 sm:w-[120px] sm:justify-end">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {metric.phase}
                  </Badge>
                  {metric.status === 'pass' ? (
                    <span className="text-xs font-medium text-emerald-600">✅ 达标</span>
                  ) : metric.status === 'na' ? (
                    <span className="text-xs text-muted-foreground">待验证</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600">进行中</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Summary row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                达标: {metrics.filter((m) => m.status === 'pass').length}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                进行中: {metrics.filter((m) => m.status === 'pending').length}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                待验证: {metrics.filter((m) => m.status === 'na').length}
              </span>
            </div>
            <span className="text-xs">
              最后更新: {new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
