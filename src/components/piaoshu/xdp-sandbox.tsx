'use client'

import { useState, useMemo, Component, type ReactNode, type ErrorInfo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Box,
  Eye,
  MousePointer,
  Mic,
  ArrowRight,
  Layers,
  Globe,
  Sparkles,
  Code,
  Zap,
  Move3d,
} from 'lucide-react'
import { useProjects, useCreateProject } from '@/lib/api-hooks'

// Dynamic import for Three.js viewport (SSR disabled)
const Sandbox3DViewport = dynamic(
  () => import('./sandbox-3d-viewport').then((m) => ({ default: m.Sandbox3DViewport })),
  {
    ssr: false,
    loading: () => (
      <div className="relative overflow-hidden rounded-xl border border-emerald-700/30" style={{ background: '#0a0f1a', minHeight: 420 }}>
        <div className="flex items-center justify-center h-full min-h-[420px]">
          <div className="flex flex-col items-center gap-3 text-emerald-400/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
            <span className="text-sm font-medium">加载3D视口...</span>
          </div>
        </div>
      </div>
    ),
  }
)

// ---------------------------------------------------------------------------
// Lazy 3D Viewport (click to load, prevents heavy chunk on page load)
// ---------------------------------------------------------------------------

function LazyThreeViewport({ projectName }: { projectName?: string }) {
  const [load3D, setLoad3D] = useState(false)

  if (!load3D) {
    return (
      <div
        className="relative overflow-hidden rounded-xl border border-emerald-700/30 cursor-pointer group"
        style={{ background: '#0a0f1a', minHeight: 420 }}
        onClick={() => setLoad3D(true)}
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[420px] gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
              <Box className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-400">点击加载3D视口</p>
            <p className="text-xs text-emerald-400/50 mt-1">WebGL渲染 · 可拖拽旋转缩放</p>
          </div>
        </div>
      </div>
    )
  }

  return <Sandbox3DViewport projectName={projectName} />
}

// ---------------------------------------------------------------------------
// Error Boundary for 3D viewport
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ViewportErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Viewport error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative overflow-hidden rounded-xl border border-amber-700/30" style={{ background: '#0a0f1a', minHeight: 420 }}>
          <div className="flex flex-col items-center justify-center h-full min-h-[420px] gap-3 text-amber-400/80">
            <Box className="h-8 w-8" />
            <span className="text-sm font-medium">3D视口加载失败</span>
            <span className="text-xs text-amber-400/50 max-w-xs text-center">{this.state.error?.message || 'WebGL不可用或加载超时'}</span>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              重试
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiProject {
  id: string
  name: string
  description?: string | null
  projectType: string
  xdpEnabled: boolean
  status: string
  version: number
  interactions?: ApiInteraction[]
  createdAt: string
}

interface ApiInteraction {
  id: string
  name: string
  triggerType: string
  actionType: string
}

type ProjectType = '3d_prototype' | 'spatial_ui' | 'ar_scene'
type ProjectStatus = 'interactive' | 'building' | 'published' | 'draft'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeLabel(t: string): string {
  switch (t) {
    case '3d_prototype':
      return '3D 原型'
    case 'spatial_ui':
      return '空间 UI'
    case 'ar_scene':
      return 'AR 场景'
    default:
      return t
  }
}

function typeColor(t: string): string {
  switch (t) {
    case '3d_prototype':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    case 'spatial_ui':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
    case 'ar_scene':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
  }
}

function statusLabel(s: string): string {
  switch (s) {
    case 'interactive':
      return '交互中'
    case 'building':
      return '构建中'
    case 'published':
      return '已发布'
    case 'draft':
      return '草稿'
    default:
      return s
  }
}

function statusColor(s: string): string {
  switch (s) {
    case 'interactive':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'building':
      return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
    case 'published':
      return 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
    case 'draft':
      return 'bg-gray-500/15 text-gray-500 dark:text-gray-400'
    default:
      return 'bg-gray-500/15 text-gray-500 dark:text-gray-400'
  }
}

function triggerIcon(type: string) {
  switch (type) {
    case 'click':
      return <MousePointer className="h-3.5 w-3.5" />
    case 'gaze':
      return <Eye className="h-3.5 w-3.5" />
    case 'proximity':
      return <Move3d className="h-3.5 w-3.5" />
    case 'voice':
      return <Mic className="h-3.5 w-3.5" />
    default:
      return <Zap className="h-3.5 w-3.5" />
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: number
  description: string
}) {
  return (
    <Card className="relative overflow-hidden border-emerald-200/50 dark:border-emerald-800/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ProjectCard({
  project,
  xdpState,
  onToggleXdp,
  onOpen,
}: {
  project: ApiProject
  xdpState: boolean
  onToggleXdp: () => void
  onOpen: () => void
}) {
  return (
    <Card className="group flex flex-col justify-between border-border/60 transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">{project.name}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            v{project.version}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge className={`text-[10px] ${typeColor(project.projectType)}`}>{typeLabel(project.projectType)}</Badge>
          <Badge className={`text-[10px] ${statusColor(project.status)}`}>{statusLabel(project.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>XDP:</span>
            <Switch
              checked={xdpState}
              onCheckedChange={onToggleXdp}
              className="scale-75 data-[state=checked]:bg-emerald-500"
            />
            <span className={xdpState ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
              {xdpState ? 'enabled' : 'disabled'}
            </span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onOpen}>
            打开
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function XDPSandboxView() {
  const { data, isLoading, error } = useProjects()
  const createProject = useCreateProject()

  const projects = (data?.projects ?? []) as ApiProject[]

  // XDP toggle states per project
  const [xdpToggles, setXdpToggles] = useState<Record<string, boolean>>({})
  const [xdpProtocolEnabled, setXdpProtocolEnabled] = useState(true)
  const [selectedTriggerType, setSelectedTriggerType] = useState('click')
  const [selectedActionType, setSelectedActionType] = useState('navigate')

  // New project form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectType, setNewProjectType] = useState<string>('3d_prototype')
  const [newProjectXdp, setNewProjectXdp] = useState(false)

  // Initialize xdp toggles from project data
  const initializedToggles = useMemo(() => {
    const toggles: Record<string, boolean> = {}
    for (const p of projects) {
      toggles[p.id] = xdpToggles[p.id] ?? p.xdpEnabled
    }
    return toggles
  }, [projects, xdpToggles])

  const toggleXdp = (id: string) => {
    setXdpToggles((prev) => ({ ...prev, [id]: !(prev[id] ?? projects.find(p => p.id === id)?.xdpEnabled ?? false) }))
  }

  // Compute stats
  const totalProjects = projects.length
  const publishedCount = projects.filter((p) => p.status === 'published' || p.status === 'interactive').length
  const xdpEnabledCount = projects.filter((p) => initializedToggles[p.id] ?? p.xdpEnabled).length

  // Collect all interactions across projects
  const allInteractions = useMemo(() => {
    const interactions: { name: string; triggerType: string; actionType: string; projectName: string }[] = []
    for (const p of projects) {
      if (p.interactions) {
        for (const i of p.interactions) {
          interactions.push({
            name: i.name,
            triggerType: i.triggerType,
            actionType: i.actionType,
            projectName: p.name,
          })
        }
      }
    }
    return interactions
  }, [projects])

  const handleOpenProject = () => {
    toast.info('3D编辑器开发中')
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('请输入项目名称')
      return
    }
    try {
      await createProject.mutateAsync({
        name: newProjectName,
        description: newProjectDesc || undefined,
        projectType: newProjectType,
        xdpEnabled: newProjectXdp,
      })
      toast.success('原型项目已创建')
      setNewProjectName('')
      setNewProjectDesc('')
      setNewProjectType('3d_prototype')
      setNewProjectXdp(false)
      setShowCreateForm(false)
    } catch {
      toast.error('创建原型项目失败')
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* 1. 沙盒概览 Sandbox Overview                                       */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">沙盒概览</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Box className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            title="原型项目"
            value={isLoading ? 0 : totalProjects}
            description="活跃的空间计算原型总数"
          />
          <StatCard
            icon={<Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            title="已发布"
            value={isLoading ? 0 : publishedCount}
            description="已上线可公开访问的原型"
          />
          <StatCard
            icon={<Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            title="XDP协议启用"
            value={isLoading ? 0 : xdpEnabledCount}
            description="启用跨维度社交协议的原型"
          />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. 原型项目列表 Prototype Projects                                  */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">原型项目</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-1.5 mt-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <Skeleton className="h-7 w-full" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Box className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">加载项目失败，请稍后重试</p>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                xdpState={initializedToggles[project.id] ?? project.xdpEnabled}
                onToggleXdp={() => toggleXdp(project.id)}
                onOpen={handleOpenProject}
              />
            ))
          )}

          {/* Create new prototype button card / expanded form */}
          <Card className="group flex flex-col items-center justify-center border-dashed border-emerald-300 bg-emerald-50/50 py-6 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/20 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30">
            {showCreateForm ? (
              <div className="w-full px-4 space-y-3">
                <div className="text-center mb-2">
                  <Sparkles className="h-5 w-5 mx-auto text-emerald-600 dark:text-emerald-300 mb-1" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">创建新原型</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">项目名称</label>
                  <Input
                    placeholder="输入项目名称"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">项目描述</label>
                  <Textarea
                    placeholder="描述项目用途..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">项目类型</label>
                  <Select value={newProjectType} onValueChange={setNewProjectType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3d_prototype">3D 原型</SelectItem>
                      <SelectItem value="spatial_ui">空间 UI</SelectItem>
                      <SelectItem value="ar_scene">AR 场景</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>XDP协议:</span>
                  <Switch
                    checked={newProjectXdp}
                    onCheckedChange={setNewProjectXdp}
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                  />
                  <span className={newProjectXdp ? 'text-emerald-600' : 'text-muted-foreground'}>
                    {newProjectXdp ? '启用' : '禁用'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                    onClick={handleCreateProject}
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? '创建中...' : '创建'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setShowCreateForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 rounded-full bg-emerald-200 p-3 dark:bg-emerald-800/60">
                  <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                </div>
                <Button
                  variant="ghost"
                  className="text-emerald-700 dark:text-emerald-300"
                  onClick={() => setShowCreateForm(true)}
                >
                  创建新原型
                </Button>
              </>
            )}
          </Card>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. 3D视口预览区 3D Viewport Preview                                 */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">3D 视口预览</h2>
        </div>

        <ViewportErrorBoundary>
          <LazyThreeViewport projectName={projects[0]?.name} />
        </ViewportErrorBoundary>
      </section>

      {/* ================================================================= */}
      {/* 4. 交互循环编辑器 Interaction Loop Editor                           */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">核心交互循环定义</h2>
        </div>

        {/* Type selectors */}
        <div className="mb-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">触发类型:</span>
            <Select value={selectedTriggerType} onValueChange={setSelectedTriggerType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">click</SelectItem>
                <SelectItem value="gaze">gaze</SelectItem>
                <SelectItem value="proximity">proximity</SelectItem>
                <SelectItem value="voice">voice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">动作类型:</span>
            <Select value={selectedActionType} onValueChange={setSelectedActionType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="navigate">navigate</SelectItem>
                <SelectItem value="animate">animate</SelectItem>
                <SelectItem value="data_fetch">data_fetch</SelectItem>
                <SelectItem value="state_change">state_change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Interaction loop rows */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 flex-1 rounded-lg" />
                ))}
              </div>
            ))
          ) : allInteractions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">暂无交互循环，请在项目中定义交互</p>
            </div>
          ) : (
            allInteractions.map((loop, idx) => (
              <div
                key={idx}
                className="flex flex-col items-start gap-2 rounded-lg border border-border/50 bg-card p-4 sm:flex-row sm:items-center sm:gap-0"
              >
                {/* Trigger */}
                <Card className="flex-1 border-emerald-300/40 dark:border-emerald-700/40">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="shrink-0 rounded bg-emerald-100 p-1 dark:bg-emerald-900/40">
                      {triggerIcon(loop.triggerType)}
                    </span>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        触发
                      </p>
                      <p className="text-sm font-medium">{loop.name}</p>
                    </div>
                  </CardContent>
                </Card>

                <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

                {/* Action */}
                <Card className="flex-1 border-teal-300/40 dark:border-teal-700/40">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="shrink-0 rounded bg-teal-100 p-1 dark:bg-teal-900/40">
                      <Code className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    </span>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        动作
                      </p>
                      <p className="text-sm font-medium">{loop.actionType}</p>
                    </div>
                  </CardContent>
                </Card>

                <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

                {/* Response */}
                <Card className="flex-1 border-amber-300/40 dark:border-amber-700/40">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="shrink-0 rounded bg-amber-100 p-1 dark:bg-amber-900/40">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </span>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        响应
                      </p>
                      <p className="text-sm font-medium">{loop.triggerType} → {loop.actionType}</p>
                    </div>
                  </CardContent>
                </Card>

                <ArrowRight className="mx-1 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />

                {/* State Change */}
                <Card className="flex-1 border-rose-300/40 dark:border-rose-700/40">
                  <CardContent className="flex items-center gap-2 p-3">
                    <span className="shrink-0 rounded bg-rose-100 p-1 dark:bg-rose-900/40">
                      <Zap className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    </span>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        状态变更
                      </p>
                      <p className="text-sm font-medium">{loop.projectName}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Hard constraint warning */}
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20">
          <span className="text-amber-600 dark:text-amber-400">⚠️</span>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">硬性约束：</span>原型必须包含核心交互循环。不能只是静态展示模型。
          </p>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. XDP协议接口 XDP Protocol Interface                               */}
      {/* ================================================================= */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/40">
            <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">XDP 协议接口</h2>
        </div>

        <Card className="border-emerald-200/50 dark:border-emerald-800/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">跨维度社交协议 (XDP)</CardTitle>
                <CardDescription className="mt-1">v0.1.0-draft</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {xdpProtocolEnabled ? '已启用' : '已禁用'}
                </span>
                <Switch
                  checked={xdpProtocolEnabled}
                  onCheckedChange={setXdpProtocolEnabled}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Connected dimensions */}
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">连接维度</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: 'Web2D', status: 'active', color: 'emerald' },
                  { name: 'Web3D', status: 'active', color: 'emerald' },
                  { name: 'AR', status: 'standby', color: 'amber' },
                  { name: 'VR', status: 'planned', color: 'gray' },
                ].map((dim) => (
                  <div
                    key={dim.name}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dim.status === 'active'
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : dim.status === 'standby'
                            ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                            : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium">{dim.name}</span>
                    <Badge
                      variant="outline"
                      className={`ml-auto text-[9px] ${
                        dim.status === 'active'
                          ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                          : dim.status === 'standby'
                            ? 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400'
                            : 'border-gray-300 text-gray-500 dark:border-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {dim.status === 'active' ? '活跃' : dim.status === 'standby' ? '待命' : '计划中'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Asset migration */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/40">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">资产迁移状态</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{xdpEnabledCount}</span>{' '}
                  个资产已迁移至XDP兼容格式
                </p>
              </div>
            </div>

            <Separator />

            {/* Identity bridging */}
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/40">
                <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium">身份桥接</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  did:piaoshu:0x3f...&nbsp;↔&nbsp;XDP:entity:spatial-001
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
