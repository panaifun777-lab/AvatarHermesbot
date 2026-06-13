'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Shield,
  ShieldCheck,
  Network,
  Box,
  Target,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  UserCircle2,
  LogOut,
  CreditCard,
  Settings2,
  Command,
  Mail,
  Radio,
  Handshake,
  Search,
  Quote,
} from 'lucide-react'
import { toast } from 'sonner'
import { PiaoshuLogoSidebar } from '@/components/piaoshu/piaoshu-logo'
import { useWebSocket, type WSEventType } from '@/lib/use-websocket'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import dynamic from 'next/dynamic'
import { DashboardView } from '@/components/piaoshu/dashboard'
import { AIChatWidget } from '@/components/piaoshu/ai-chat-widget'
import { CommandPalette } from '@/components/piaoshu/command-palette'
import { AuthModal } from '@/components/piaoshu/auth-modal'
import { SubscriptionPlans } from '@/components/piaoshu/subscription-plans'
import { SettingsPanel } from '@/components/piaoshu/settings-panel'
import { NotificationCenter } from '@/components/piaoshu/notification-center'
import { ModuleErrorBoundary } from '@/components/piaoshu/error-boundary'
import { TopLoadingBar } from '@/components/piaoshu/top-loading-bar'
import { LandingPage } from '@/components/piaoshu/landing-page'

// Lazy-load heavy module views to reduce initial bundle size
const AvatarCloneView = dynamic(
  () => import('@/components/piaoshu/avatar-clone').then(m => ({ default: m.AvatarCloneView })),
  { loading: () => <ModuleSkeleton /> }
)
const CognitiveEngineView = dynamic(
  () => import('@/components/piaoshu/cognitive-engine').then(m => ({ default: m.CognitiveEngineView })),
  { loading: () => <ModuleSkeleton /> }
)
const EvidenceChainView = dynamic(
  () => import('@/components/piaoshu/evidence-chain').then(m => ({ default: m.EvidenceChainView })),
  { loading: () => <ModuleSkeleton /> }
)
const CollaborationRouterView = dynamic(
  () => import('@/components/piaoshu/collaboration-router').then(m => ({ default: m.CollaborationRouterView })),
  { loading: () => <ModuleSkeleton /> }
)
const XDPSandboxView = dynamic(
  () => import('@/components/piaoshu/xdp-sandbox').then(m => ({ default: m.XDPSandboxView })),
  { loading: () => <ModuleSkeleton /> }
)
const RoadmapTrackerView = dynamic(
  () => import('@/components/piaoshu/roadmap-tracker').then(m => ({ default: m.RoadmapTrackerView })),
  { loading: () => <ModuleSkeleton /> }
)
const EmailTrackingView = dynamic(
  () => import('@/components/piaoshu/email-tracking').then(m => ({ default: m.EmailTrackingView })),
  { loading: () => <ModuleSkeleton /> }
)
const MediaMatrixView = dynamic(
  () => import('@/components/piaoshu/media-matrix').then(m => ({ default: m.MediaMatrixView })),
  { loading: () => <ModuleSkeleton /> }
)
const BDPipelineView = dynamic(
  () => import('@/components/piaoshu/bd-pipeline').then(m => ({ default: m.BDPipelineView })),
  { loading: () => <ModuleSkeleton /> }
)
const GEOCenterView = dynamic(
  () => import('@/components/piaoshu/geo-center').then(m => ({ default: m.GEOCenterView })),
  { loading: () => <ModuleSkeleton /> }
)
const FounderManifestoView = dynamic(
  () => import('@/components/piaoshu/founder-manifesto').then(m => ({ default: m.FounderManifestoView })),
  { loading: () => <ModuleSkeleton /> }
)
const MemoryPalaceView = dynamic(
  () => import('@/components/piaoshu/memory-palace').then(m => ({ default: m.MemoryPalace })),
  { loading: () => <ModuleSkeleton /> }
)
const SwarmCoordinatorView = dynamic(
  () => import('@/components/piaoshu/swarm-coordinator').then(m => ({ default: m.SwarmCoordinator })),
  { loading: () => <ModuleSkeleton /> }
)
const FederationLayerView = dynamic(
  () => import('@/components/piaoshu/federation-layer').then(m => ({ default: m.FederationLayerView })),
  { loading: () => <ModuleSkeleton /> }
)

function ModuleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  )
}

type ActiveModule = 'dashboard' | 'avatar' | 'email' | 'cognitive' | 'memory' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap' | 'subscription' | 'media' | 'bd' | 'geo' | 'manifesto' | 'swarm' | 'federation'

interface NavItem {
  id: ActiveModule
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
}

// Navigation grouped by function (OS-style launcher categories)
const navGroups = [
  {
    label: '核心',
    items: [
      { id: 'dashboard' as ActiveModule, label: '总控台', sublabel: 'Mission Control', icon: LayoutDashboard, color: 'text-emerald-500' },
      { id: 'avatar' as ActiveModule, label: '分身系统', sublabel: 'Avatar Clone', icon: UserCircle2, color: 'text-violet-500' },
    ]
  },
  {
    label: '引擎',
    items: [
      { id: 'cognitive' as ActiveModule, label: '认知引擎', sublabel: 'Cognitive Engine', icon: Brain, color: 'text-emerald-600' },
      { id: 'memory' as ActiveModule, label: '记忆宫殿', sublabel: 'Memory Palace', icon: Brain, color: 'text-teal-500' },
      { id: 'evidence' as ActiveModule, label: '可信证据链', sublabel: 'Evidence Chain', icon: Shield, color: 'text-teal-600' },
      { id: 'federation' as ActiveModule, label: '联邦信任层', sublabel: 'Federation Trust', icon: ShieldCheck, color: 'text-emerald-600' },
    ]
  },
  {
    label: '业务',
    items: [
      { id: 'media' as ActiveModule, label: '媒体矩阵', sublabel: 'Media Matrix', icon: Radio, color: 'text-emerald-600' },
      { id: 'bd' as ActiveModule, label: '合作管线', sublabel: 'BD Pipeline', icon: Handshake, color: 'text-amber-600' },
      { id: 'geo' as ActiveModule, label: 'GEO优化', sublabel: 'GEO Center', icon: Search, color: 'text-teal-600' },
      { id: 'email' as ActiveModule, label: '邮件跟踪', sublabel: 'Email Tracking', icon: Mail, color: 'text-emerald-500' },
    ]
  },
  {
    label: '协作',
    items: [
      { id: 'collaboration' as ActiveModule, label: '流体调度', sublabel: 'Fluid Router', icon: Network, color: 'text-cyan-600' },
      { id: 'swarm' as ActiveModule, label: '蜂群协作', sublabel: 'Swarm', icon: Network, color: 'text-cyan-500' },
      { id: 'sandbox' as ActiveModule, label: '共生沙盒', sublabel: 'XDP Sandbox', icon: Box, color: 'text-amber-600' },
    ]
  },
  {
    label: '规划',
    items: [
      { id: 'roadmap' as ActiveModule, label: '路线图', sublabel: 'Roadmap', icon: Target, color: 'text-rose-500' },
      { id: 'subscription' as ActiveModule, label: '订阅方案', sublabel: 'AFC Plans', icon: CreditCard, color: 'text-amber-500' },
      { id: 'manifesto' as ActiveModule, label: '创始人致辞', sublabel: 'Manifesto', icon: Quote, color: 'text-amber-500' },
    ]
  },
]

const navItems = navGroups.flatMap(g => g.items)

// Extracted sidebar component to avoid render-time component creation
interface SidebarContentProps {
  activeModule: ActiveModule
  sidebarCollapsed: boolean
  theme: string | undefined
  mounted: boolean
  onNavigate: (module: ActiveModule) => void
  onToggleTheme: () => void
  onMobileClose?: () => void
  onOpenSettings?: () => void
}

function SidebarContent({ activeModule, sidebarCollapsed, theme, mounted, onNavigate, onToggleTheme, onMobileClose, onOpenSettings }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <PiaoshuLogoSidebar collapsed={false} />
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight text-foreground truncate">飘叔 Piaoshu</span>
              <span className="text-[10px] text-muted-foreground font-mono">AI AVATAR OS v0.1</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="mx-3 my-2" />

      {/* Navigation Items — Grouped (OS Launcher Style) */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              {/* Group Label */}
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
              )}
              {sidebarCollapsed && <div className="my-1 h-px bg-border/30" />}
              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeModule === item.id
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            onNavigate(item.id)
                            onMobileClose?.()
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                            "hover:bg-accent hover:text-accent-foreground",
                            isActive
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm"
                              : "text-muted-foreground",
                            sidebarCollapsed && "justify-center px-2 py-2.5"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center rounded-md h-7 w-7 shrink-0 transition-colors",
                            isActive ? "bg-emerald-500/15" : "bg-transparent"
                          )}>
                            <item.icon className={cn("h-4 w-4", isActive ? item.color : 'text-muted-foreground/60')} />
                          </div>
                          {!sidebarCollapsed && (
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="flex flex-col items-start min-w-0">
                                <span className="truncate leading-tight">{item.label}</span>
                                <span className="text-[9px] text-muted-foreground font-mono truncate leading-tight">{item.sublabel}</span>
                              </div>
                              {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                              )}
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                          <span className="block text-xs text-muted-foreground">{item.sublabel}</span>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      <Separator className="mx-3 my-2" />

      {/* System Status — OS-style system tray */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-2">
          <div className="rounded-lg border bg-card/80 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">System</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Ph1', value: '1/3', color: 'text-emerald-600' },
                { label: 'Day', value: '18', color: 'text-amber-600' },
                { label: 'AI', value: '4', color: 'text-violet-600' },
                { label: 'VC', value: '12', color: 'text-teal-600' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center p-1 rounded bg-muted/40">
                  <span className="text-[8px] text-muted-foreground font-mono">{s.label}</span>
                  <span className={cn('text-[11px] font-bold font-mono', s.color)}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-3 space-y-1">
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={onOpenSettings}
          >
            <Settings2 className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2 text-xs">设置</span>}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={onToggleTheme}
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 opacity-0" />
          )}
          {!sidebarCollapsed && (
            <span className="ml-2 text-xs">
              {mounted ? (theme === 'dark' ? '浅色' : '深色') : '\u00A0'}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

// Map WS event types to friendly Chinese labels
const EVENT_LABELS: Record<WSEventType, string> = {
  'task:updated': '任务更新',
  'task:created': '新任务',
  'shard:updated': '分片更新',
  'simulation:completed': '模拟完成',
  'node:status': '节点状态',
  'notification': '通知',
  'agent:status': '分身状态',
  'agent:cycle': '周期事件',
  'agent:output': '新产出',
  'clone:activity': '分身活动',
}

// Module name mapping for error boundary
const MODULE_NAMES: Record<ActiveModule, string> = {
  dashboard: '总控台 Mission Control',
  avatar: '分身系统 Avatar Clone',
  media: '媒体矩阵 Media Matrix',
  bd: '合作管线 BD Pipeline',
  geo: 'GEO优化 GEO Center',
  email: '邮件跟踪 Email Tracking',
  cognitive: '认知引擎 Cognitive Engine',
  memory: '记忆宫殿 Memory Palace',
  evidence: '可信证据链 Evidence Chain',
  collaboration: '流体调度 Fluid Router',
  sandbox: '共生沙盒 XDP Sandbox',
  roadmap: '路线图 Roadmap',
  subscription: '订阅方案 AFC Plans',
  manifesto: '创始人致辞 Manifesto',
  swarm: '蜂群协作 Swarm',
  federation: '联邦信任层 Federation Trust',
}

// Page transition animation variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()
  const { connected, lastEvent } = useWebSocket()
  const lastToastRef = useRef<string | null>(null)
  const { data: session, status } = useSession()
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [isModuleLoading, setIsModuleLoading] = useState(false)
  const [, startTransition] = useTransition()
  const adminSetupRef = useRef(false)

  // Setup super admin on first load
  useEffect(() => {
    if (adminSetupRef.current) return
    adminSetupRef.current = true
    fetch('/api/auth/setup-admin', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.message === 'Super admin created successfully') {
          console.log('Super admin created:', data.data)
        }
      })
      .catch(() => {
        // Silently fail - admin might already exist
      })
  }, [])

  // Check URL for auth=login param — use lazy init to avoid set-state-in-effect
  const [authModalOpen, setAuthModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('auth') === 'login') {
        window.history.replaceState({}, '', '/')
        return true
      }
    }
    return false
  })

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // Navigate to a new module with loading bar
  const handleNavigate = useCallback((module: ActiveModule) => {
    if (module === activeModule) return
    setIsModuleLoading(true)
    startTransition(() => {
      setActiveModule(module)
    })
    // Close mobile sidebar on navigation
    setMobileMenuOpen(false)
    // Give a small window for the loading bar to show before module renders
    setTimeout(() => setIsModuleLoading(false), 600)
  }, [activeModule])

  // Show toast on WebSocket events (with debounce to avoid spam)
  useEffect(() => {
    if (!lastEvent) return
    const key = `${lastEvent.type}-${lastEvent.timestamp}`
    if (key === lastToastRef.current) return
    lastToastRef.current = key

    const label = EVENT_LABELS[lastEvent.type] || lastEvent.type
    const data = lastEvent.data as Record<string, unknown> | undefined
    const message = data?.message || data?.title || ''

    toast.info(`[${label}] ${message}`, {
      duration: 3000,
    })
  }, [lastEvent])

  const renderModule = () => {
    const moduleName = MODULE_NAMES[activeModule]
    switch (activeModule) {
      case 'dashboard':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <DashboardView onNavigate={handleNavigate} />
          </ModuleErrorBoundary>
        )
      case 'avatar':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <AvatarCloneView />
          </ModuleErrorBoundary>
        )
      case 'email':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <EmailTrackingView />
          </ModuleErrorBoundary>
        )
      case 'cognitive':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <CognitiveEngineView />
          </ModuleErrorBoundary>
        )
      case 'memory':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <MemoryPalaceView />
          </ModuleErrorBoundary>
        )
      case 'evidence':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <EvidenceChainView />
          </ModuleErrorBoundary>
        )
      case 'collaboration':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <CollaborationRouterView />
          </ModuleErrorBoundary>
        )
      case 'sandbox':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <XDPSandboxView />
          </ModuleErrorBoundary>
        )
      case 'roadmap':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <RoadmapTrackerView />
          </ModuleErrorBoundary>
        )
      case 'media':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <MediaMatrixView />
          </ModuleErrorBoundary>
        )
      case 'bd':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <BDPipelineView />
          </ModuleErrorBoundary>
        )
      case 'geo':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <GEOCenterView />
          </ModuleErrorBoundary>
        )
      case 'subscription':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <SubscriptionPlans />
          </ModuleErrorBoundary>
        )
      case 'manifesto':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <FounderManifestoView />
          </ModuleErrorBoundary>
        )
      case 'swarm':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <SwarmCoordinatorView />
          </ModuleErrorBoundary>
        )
      case 'federation':
        return (
          <ModuleErrorBoundary moduleName={moduleName}>
            <FederationLayerView />
          </ModuleErrorBoundary>
        )
      default:
        return (
          <ModuleErrorBoundary moduleName="总览 Dashboard">
            <DashboardView onNavigate={handleNavigate} />
          </ModuleErrorBoundary>
        )
    }
  }

  // Show landing page when not authenticated
  const isAuthenticated = status === 'authenticated' && !!session?.user

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse">
            <PiaoshuLogoSidebar collapsed={false} />
          </div>
          <span className="text-xs text-gray-500 font-mono animate-pulse">Loading Piaoshu Avatar OS...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onLogin={() => setAuthModalOpen(true)} />
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    )
  }

  // Dashboard view for authenticated users
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Loading Bar */}
      <TopLoadingBar isLoading={isModuleLoading} />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r bg-card transition-all duration-300 shrink-0",
            sidebarCollapsed ? "w-[68px]" : "w-[260px]"
          )}
        >
          <SidebarContent
            activeModule={activeModule}
            sidebarCollapsed={sidebarCollapsed}
            theme={resolvedTheme}
            mounted={mounted}
            onNavigate={handleNavigate}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setSettingsPanelOpen(true)}
          />
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            </Button>
          </div>
        </aside>

        {/* Mobile Menu Overlay - only renders in DOM when open and on mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar - only renders when menu is open, completely hidden on md+ */}
        {mobileMenuOpen && (
          <aside
            className="fixed inset-y-0 left-0 z-50 w-[280px] border-r bg-card md:hidden"
          >
            <div className="flex items-center justify-between p-4 pb-2">
              <span className="text-sm font-semibold">导航菜单</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator />
            <SidebarContent
              activeModule={activeModule}
              sidebarCollapsed={false}
              theme={resolvedTheme}
              mounted={mounted}
              onNavigate={handleNavigate}
              onToggleTheme={toggleTheme}
              onMobileClose={() => setMobileMenuOpen(false)}
              onOpenSettings={() => setSettingsPanelOpen(true)}
            />
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar - compact on mobile */}
          <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 md:px-6 h-12 sm:h-14">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold truncate">
                {navItems.find(i => i.id === activeModule)?.label || '总览'}
              </h1>
              <Badge variant="outline" className="text-[8px] sm:text-[10px] font-mono h-4 sm:h-5 shrink-0 hidden sm:inline-flex">
                {navItems.find(i => i.id === activeModule)?.sublabel}
              </Badge>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Connection badge - compact on mobile */}
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] sm:text-[10px] h-5 sm:h-6 border-0 transition-colors",
                  connected
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                )}
              >
                {connected ? (
                  <Wifi className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <WifiOff className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                <span className="hidden sm:inline">{connected ? '实时连接' : '连接断开'}</span>
              </Badge>
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono cursor-pointer hover:text-foreground transition-colors rounded-md border border-border/50 px-2 py-1 hover:bg-accent"
                title="打开命令面板 (⌘K)"
              >
                <Command className="h-3 w-3" />
                <span>⌘K</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <span>Phase 1</span>
                <span>·</span>
                <span>Day 18</span>
              </div>

              {/* Settings Button in Header */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => setSettingsPanelOpen(true)}
                    >
                      <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>系统设置</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Notification Center */}
              <NotificationCenter onNavigate={handleNavigate} />

              {/* Auth button - smaller on mobile */}
              {session?.user ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-500/10 px-1.5 sm:px-2.5 py-0.5 sm:py-1">
                    <div className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[8px] sm:text-[9px] font-bold text-white">
                      {(session.user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-violet-700 dark:text-violet-400 max-w-[40px] sm:max-w-[60px] truncate">
                      {session.user.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    title="退出登录"
                  >
                    <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <UserCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">登录</span>
                </Button>
              )}
            </div>
          </header>

          {/* Module Content with page transitions */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeModule}
                  variants={pageVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {renderModule()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Footer - sticky to bottom */}
          <footer className="mt-auto border-t bg-card/80 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2">
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">ONLINE</span>
                </div>
                <span className="text-border">|</span>
                <span className="font-medium">Piaoshu Avatar OS</span>
                <span className="font-mono">v0.1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">Phase 1/3 · Day 18</span>
                <span className="text-border">|</span>
                <span>AI分身 · 认知引擎 · 可信证据链</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette onNavigate={handleNavigate} onToggleTheme={toggleTheme} />

      {/* Floating AI Chat Widget */}
      <AIChatWidget />

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Settings Panel */}
      <SettingsPanel open={settingsPanelOpen} onOpenChange={setSettingsPanelOpen} />
    </div>
  )
}
