'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  UserCircle2,
  Brain,
  Shield,
  Network,
  Box,
  Target,
  Play,
  FileCheck,
  Send,
  Moon,
  Sun,
  Search,
  Zap,
  Settings,
  ArrowRight,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

type ActiveModule = 'dashboard' | 'avatar' | 'cognitive' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap'

interface CommandPaletteProps {
  onNavigate: (module: ActiveModule) => void
  onToggleTheme: () => void
}

interface CommandEntry {
  id: string
  icon: React.ElementType
  label: string
  subtitle: string
  shortcut?: string
  keywords?: string
  onSelect: () => void
}

export function CommandPalette({ onNavigate, onToggleTheme }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()

  // Cmd+K / Ctrl+K shortcut + custom event for button trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const handleCustomOpen = () => {
      setOpen(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('open-command-palette', handleCustomOpen)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  // Navigation items
  const navigationItems: CommandEntry[] = [
    {
      id: 'nav-dashboard',
      icon: LayoutDashboard,
      label: '总览',
      subtitle: 'Dashboard',
      shortcut: '1',
      keywords: 'dashboard overview zonglan',
      onSelect: () => { onNavigate('dashboard'); handleClose() },
    },
    {
      id: 'nav-avatar',
      icon: UserCircle2,
      label: '分身系统',
      subtitle: 'Avatar Clone',
      shortcut: '2',
      keywords: 'avatar clone fenshen agent',
      onSelect: () => { onNavigate('avatar'); handleClose() },
    },
    {
      id: 'nav-cognitive',
      icon: Brain,
      label: '认知分片引擎',
      subtitle: 'Cognitive Sharding',
      shortcut: '3',
      keywords: 'cognitive shard renzhi engine',
      onSelect: () => { onNavigate('cognitive'); handleClose() },
    },
    {
      id: 'nav-evidence',
      icon: Shield,
      label: '可信证据链',
      subtitle: 'Evidence Chain',
      shortcut: '4',
      keywords: 'evidence chain zhengju verify',
      onSelect: () => { onNavigate('evidence'); handleClose() },
    },
    {
      id: 'nav-collaboration',
      icon: Network,
      label: '流体协作调度',
      subtitle: 'Fluid Router',
      shortcut: '5',
      keywords: 'collaboration router xiezuo task fluid',
      onSelect: () => { onNavigate('collaboration'); handleClose() },
    },
    {
      id: 'nav-sandbox',
      icon: Box,
      label: '虚实共生沙盒',
      subtitle: 'XDP Sandbox',
      shortcut: '6',
      keywords: 'sandbox xdp shabox virtual prototype',
      onSelect: () => { onNavigate('sandbox'); handleClose() },
    },
    {
      id: 'nav-roadmap',
      icon: Target,
      label: '90天路线图',
      subtitle: 'Roadmap',
      shortcut: '7',
      keywords: 'roadmap luxiantu 90day milestone',
      onSelect: () => { onNavigate('roadmap'); handleClose() },
    },
  ]

  // Action items
  const actionItems: CommandEntry[] = [
    {
      id: 'action-start-all-cycles',
      icon: Play,
      label: '启动全部周期',
      subtitle: 'Start All Agent Cycles',
      keywords: 'start cycle qidong cycle agent',
      onSelect: () => { onNavigate('avatar'); handleClose() },
    },
    {
      id: 'action-create-evidence',
      icon: FileCheck,
      label: '创建证据',
      subtitle: 'Create Evidence',
      keywords: 'create evidence chuangjian zhengju',
      onSelect: () => { onNavigate('evidence'); handleClose() },
    },
    {
      id: 'action-publish-task',
      icon: Send,
      label: '发布任务',
      subtitle: 'Publish Task',
      keywords: 'publish task fabu renwu',
      onSelect: () => { onNavigate('collaboration'); handleClose() },
    },
    {
      id: 'action-run-simulation',
      icon: Zap,
      label: '运行红蓝对抗',
      subtitle: 'Run Red-Blue Simulation',
      keywords: 'simulation honglan yunxing red blue',
      onSelect: () => { onNavigate('cognitive'); handleClose() },
    },
  ]

  // Settings items
  const settingsItems: CommandEntry[] = [
    {
      id: 'settings-dark-mode',
      icon: Moon,
      label: '切换深色模式',
      subtitle: 'Switch to Dark Mode',
      keywords: 'dark mode shense theme yejian',
      onSelect: () => { if (resolvedTheme !== 'dark') onToggleTheme(); handleClose() },
    },
    {
      id: 'settings-light-mode',
      icon: Sun,
      label: '切换浅色模式',
      subtitle: 'Switch to Light Mode',
      keywords: 'light mode qianse theme baitian',
      onSelect: () => { if (resolvedTheme !== 'light') onToggleTheme(); handleClose() },
    },
  ]

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="命令面板"
      description="搜索模块、操作或设置..."
      showCloseButton={false}
      className="sm:max-w-[580px] [&_[data-slot=dialog-overlay]]:bg-black/40 [&_[data-slot=dialog-overlay]]:backdrop-blur-sm"
    >
      <CommandInput placeholder="搜索模块、操作或设置..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1 py-4">
            <Search className="h-8 w-8 text-muted-foreground/40 mb-1" />
            <span className="text-sm">未找到匹配结果</span>
            <span className="text-xs text-muted-foreground/60">尝试其他关键词</span>
          </div>
        </CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading={
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ArrowRight className="h-3 w-3" />
            <span>导航</span>
            <span className="text-muted-foreground font-normal">Navigation</span>
          </div>
        }>
          {navigationItems.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.subtitle} ${item.keywords || ''}`}
              onSelect={item.onSelect}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 shrink-0">
                <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{item.subtitle}</span>
              </div>
              {item.shortcut && (
                <CommandShortcut className="text-[10px]">
                  <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px]">
                    {item.shortcut}
                  </kbd>
                </CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions Group */}
        <CommandGroup heading={
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <Zap className="h-3 w-3" />
            <span>快捷操作</span>
            <span className="text-muted-foreground font-normal">Quick Actions</span>
          </div>
        }>
          {actionItems.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.subtitle} ${item.keywords || ''}`}
              onSelect={item.onSelect}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-500/10 shrink-0">
                <item.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{item.subtitle}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Settings Group */}
        <CommandGroup heading={
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Settings className="h-3 w-3" />
            <span>设置</span>
            <span className="text-muted-foreground font-normal">Settings</span>
          </div>
        }>
          {settingsItems.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.subtitle} ${item.keywords || ''}`}
              onSelect={item.onSelect}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 shrink-0">
                <item.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{item.subtitle}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-border/50 bg-muted px-1 font-mono text-[9px]">↑↓</kbd>
            <span>导航</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-border/50 bg-muted px-1 font-mono text-[9px]">↵</kbd>
            <span>选择</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 items-center rounded border border-border/50 bg-muted px-1 font-mono text-[9px]">esc</kbd>
            <span>关闭</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Zap className="h-3 w-3 text-emerald-500" />
          <span>Piaoshu Founder OS</span>
        </div>
      </div>
    </CommandDialog>
  )
}
