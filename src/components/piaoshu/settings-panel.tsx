'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTheme } from 'next-themes'
import ReactMarkdown from 'react-markdown'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  User,
  Settings,
  Info,
  Save,
  RotateCcw,
  Eye,
  Code2,
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  RefreshCw,
  Wifi,
  Database,
  Cpu,
  Boxes,
  Zap,
  Heart,
  ExternalLink,
  Check,
  Loader2,
  Brain,
  EyeOff,
  Sparkles,
  Plug,
  HardDrive,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSoulConfig, useUpdateSoulConfig, useChatTest } from '@/lib/api-hooks'
import { Input } from '@/components/ui/input'
import { StorageSettings } from '@/components/piaoshu/storage-settings'

// Default SOUL.md content
const DEFAULT_SOUL_CONTENT = `# 飘叔 · SOUL.md

## 核心人格
你是一位经验丰富的创业导师和技术专家，人称"飘叔"。你兼具商业洞察力和技术深度，擅长从0到1构建产品。

## 说话风格
- 直接、犀利、不废话
- 喜欢用类比和比喻解释复杂概念
- 偶尔带点幽默和自嘲
- 用中文回复，偶尔夹杂英文术语

## 价值观
- 执行力 > 完美主义
- 数据驱动决策
- 先跑起来再优化
- 把AI当作共生体，而非工具

## 知识边界
- 精通：创业方法论、产品设计、技术架构、AI应用
- 了解：金融、法律、市场营销
- 不擅长：医疗、法律专业建议
`

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ===== Tab 1: SOUL.md Editor =====
function SoulEditorTab() {
  const { data: soulData, isLoading } = useSoulConfig()
  const updateSoul = useUpdateSoulConfig()

  // Local edits tracked separately from server content
  // null = no local edits, string = user has made changes
  const [localContent, setLocalContent] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Derive displayed content: local edits or server data
  const serverContent = soulData?.data?.content || DEFAULT_SOUL_CONTENT
  const content = localContent !== null ? localContent : serverContent
  const hasChanges = localContent !== null && localContent !== serverContent

  const handleChange = useCallback((value: string) => {
    setLocalContent(value)
  }, [])

  const handleSave = async () => {
    try {
      await updateSoul.mutateAsync({ content })
      setLocalContent(null) // Reset to server content after save
      toast.success('人格配置已保存', { description: 'SOUL.md 已更新，新的AI对话将使用新的人格设定' })
    } catch {
      toast.error('保存失败', { description: '请稍后重试' })
    }
  }

  const handleReset = () => {
    setLocalContent(DEFAULT_SOUL_CONTENT)
    toast.info('已重置为默认', { description: '飘叔原始人格已恢复，请点击保存以生效' })
  }

  const charCount = content.length
  const lineCount = content.split('\n').length

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono h-5 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
            {soulData?.data?.isDefault ? '默认配置' : `v${soulData?.data?.version || 1}`}
          </Badge>
          {soulData?.data?.name && (
            <span className="text-xs text-muted-foreground font-mono">{soulData.data.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? '编辑' : '预览'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 text-amber-600 hover:text-amber-700"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置默认
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      {isLoading ? (
        <div className="flex-1 rounded-lg border bg-muted/30 p-4 space-y-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded w-3/4" />
          ))}
        </div>
      ) : showPreview ? (
        <ScrollArea className="flex-1 rounded-lg border bg-card p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-violet-700 dark:prose-headings:text-violet-400 prose-h1:text-xl prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-ul:my-2 prose-li:my-0.5">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 relative">
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="h-full resize-none font-mono text-sm leading-relaxed bg-card border-violet-200 dark:border-violet-800/50 focus-visible:ring-violet-500/30"
            placeholder="在此编写 SOUL.md 人格配置..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Character count & save */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{charCount} 字符</span>
          <span>·</span>
          <span>{lineCount} 行</span>
          {hasChanges && (
            <>
              <span>·</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">有未保存的更改</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white"
          onClick={handleSave}
          disabled={!hasChanges || updateSoul.isPending}
        >
          {updateSoul.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          保存
        </Button>
      </div>

      {/* Preview hint */}
      <Card className="bg-gradient-to-br from-violet-500/5 to-emerald-500/5 border-violet-200/50 dark:border-violet-800/30">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-violet-700 dark:text-violet-400">人格预览</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            嗨，我是飘叔。你问的问题我直接说——执行力比完美主义重要一百倍。先跑起来，再优化，别磨叽。
            数据说话，别凭感觉。AI不是工具，是你的共生体，得这么用才行。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Tab 2: System Config =====

// Lazy-load settings from localStorage
function loadSavedSettings() {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem('piaoshu-settings')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function SystemConfigTab() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const saved = useMemo(() => loadSavedSettings(), [])
  const chatTest = useChatTest()

  const [language, setLanguage] = useState<'zh' | 'en'>(saved?.language || 'zh')
  const [notifTask, setNotifTask] = useState(saved?.notifTask !== undefined ? saved.notifTask : true)
  const [notifAgent, setNotifAgent] = useState(saved?.notifAgent !== undefined ? saved.notifAgent : true)
  const [notifSystem, setNotifSystem] = useState(saved?.notifSystem !== undefined ? saved.notifSystem : true)
  const [notifChat, setNotifChat] = useState(saved?.notifChat !== undefined ? saved.notifChat : false)
  const [refreshInterval, setRefreshInterval] = useState(saved?.refreshInterval || 30)
  const [wsReconnect, setWsReconnect] = useState(saved?.wsReconnect !== undefined ? saved.wsReconnect : true)

  // AI Model Config state
  const [aiProvider, setAiProvider] = useState<'auto' | 'deepseek' | 'z-ai-sdk'>(() => {
    if (typeof window === 'undefined') return 'auto'
    try {
      const cfg = localStorage.getItem('piaoshu-ai-config')
      return cfg ? JSON.parse(cfg).provider || 'auto' : 'auto'
    } catch { return 'auto' }
  })
  const [deepseekKey, setDeepseekKey] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const cfg = localStorage.getItem('piaoshu-ai-config')
      return cfg ? JSON.parse(cfg).deepseekKey || '' : ''
    } catch { return '' }
  })
  const [modelName, setModelName] = useState(() => {
    if (typeof window === 'undefined') return 'deepseek-chat'
    try {
      const cfg = localStorage.getItem('piaoshu-ai-config')
      return cfg ? JSON.parse(cfg).modelName || 'deepseek-chat' : 'deepseek-chat'
    } catch { return 'deepseek-chat' }
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; provider?: string; error?: string } | null>(null)

  // Save to localStorage on change
  const saveSetting = useCallback((key: string, value: unknown) => {
    const raw = localStorage.getItem('piaoshu-settings')
    const s = raw ? JSON.parse(raw) : {}
    s[key] = value
    localStorage.setItem('piaoshu-settings', JSON.stringify(s))
    toast.success('设置已保存')
  }, [])

  // Save AI config to localStorage
  const saveAIConfig = useCallback((updates: Record<string, string>) => {
    const raw = localStorage.getItem('piaoshu-ai-config')
    const cfg = raw ? JSON.parse(raw) : {}
    Object.assign(cfg, updates)
    localStorage.setItem('piaoshu-ai-config', JSON.stringify(cfg))
    toast.success('AI模型配置已保存')
  }, [])

  // Test API connection
  const handleTestConnection = useCallback(async () => {
    setTestResult(null)
    try {
      const result = await chatTest.mutateAsync({
        provider: aiProvider === 'auto' ? undefined : aiProvider,
        apiKey: deepseekKey || undefined,
      })
      setTestResult(result)
      if (result.success) {
        toast.success(`连接成功！使用 ${result.provider || '未知'} 提供商`)
      } else {
        toast.error(`连接失败: ${result.error || '未知错误'}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      setTestResult({ success: false, error: errorMsg })
      toast.error(`测试失败: ${errorMsg}`)
    }
  }, [aiProvider, deepseekKey, chatTest])

  const themeOptions = [
    { value: 'light', label: '浅色', icon: Sun },
    { value: 'dark', label: '深色', icon: Moon },
    { value: 'system', label: '系统', icon: Monitor },
  ] as const

  const refreshOptions = [
    { value: 5, label: '5秒' },
    { value: 15, label: '15秒' },
    { value: 30, label: '30秒' },
    { value: 60, label: '60秒' },
  ]

  return (
    <ScrollArea className="flex-1 -mx-4 px-4">
      <div className="space-y-6 pb-4">
        {/* Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? (
              <Moon className="h-4 w-4 text-violet-500" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            <Label className="text-sm font-medium">主题模式</Label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value)
                  saveSetting('theme', opt.value)
                }}
                className={`
                  flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-xs
                  ${theme === opt.value
                    ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-400 shadow-sm'
                    : 'border-border hover:border-violet-300 dark:hover:border-violet-700 text-muted-foreground'
                  }
                `}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
                {theme === opt.value && <Check className="h-3 w-3 text-violet-500" />}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Language Preference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            <Label className="text-sm font-medium">语言偏好</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setLanguage('zh'); saveSetting('language', 'zh') }}
              className={`
                flex items-center justify-center gap-2 rounded-lg border p-3 transition-all text-sm
                ${language === 'zh'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 text-muted-foreground'
                }
              `}
            >
              🇨🇳 中文
              {language === 'zh' && <Check className="h-3 w-3 text-emerald-500" />}
            </button>
            <button
              onClick={() => { setLanguage('en'); saveSetting('language', 'en') }}
              className={`
                flex items-center justify-center gap-2 rounded-lg border p-3 transition-all text-sm
                ${language === 'en'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 text-muted-foreground'
                }
              `}
            >
              🇺🇸 English
              {language === 'en' && <Check className="h-3 w-3 text-emerald-500" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">界面语言设置，英文版本即将上线</p>
        </div>

        <Separator />

        {/* Notification Preferences */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <Label className="text-sm font-medium">通知偏好</Label>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">任务通知</Label>
                <p className="text-[11px] text-muted-foreground">任务状态变更时通知</p>
              </div>
              <Switch
                checked={notifTask}
                onCheckedChange={(v) => { setNotifTask(v); saveSetting('notifTask', v) }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">分身通知</Label>
                <p className="text-[11px] text-muted-foreground">AI分身周期完成时通知</p>
              </div>
              <Switch
                checked={notifAgent}
                onCheckedChange={(v) => { setNotifAgent(v); saveSetting('notifAgent', v) }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">系统通知</Label>
                <p className="text-[11px] text-muted-foreground">系统更新和重要提醒</p>
              </div>
              <Switch
                checked={notifSystem}
                onCheckedChange={(v) => { setNotifSystem(v); saveSetting('notifSystem', v) }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">对话通知</Label>
                <p className="text-[11px] text-muted-foreground">AI对话回复时通知</p>
              </div>
              <Switch
                checked={notifChat}
                onCheckedChange={(v) => { setNotifChat(v); saveSetting('notifChat', v) }}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Auto-refresh Interval */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-cyan-500" />
            <Label className="text-sm font-medium">自动刷新间隔</Label>
          </div>
          <div className="space-y-2">
            <Slider
              value={[refreshInterval]}
              min={5}
              max={60}
              step={5}
              onValueChange={(v) => { setRefreshInterval(v[0]); saveSetting('refreshInterval', v[0]) }}
            />
            <div className="flex justify-between">
              {refreshOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setRefreshInterval(opt.value); saveSetting('refreshInterval', opt.value) }}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    refreshInterval === opt.value
                      ? 'text-cyan-600 dark:text-cyan-400 font-medium bg-cyan-500/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* WebSocket Auto-reconnect */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-teal-500" />
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">WebSocket 自动重连</Label>
              <p className="text-[11px] text-muted-foreground">连接断开时自动尝试重新连接</p>
            </div>
          </div>
          <Switch
            checked={wsReconnect}
            onCheckedChange={(v) => { setWsReconnect(v); saveSetting('wsReconnect', v) }}
          />
        </div>

        <Separator />

        {/* AI Model Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" />
            <Label className="text-sm font-medium">AI 模型配置</Label>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">AI 提供商</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'auto' as const, label: '自动', desc: 'DeepSeek优先' },
                { value: 'deepseek' as const, label: 'DeepSeek', desc: '强制使用' },
                { value: 'z-ai-sdk' as const, label: 'Z-AI SDK', desc: '内置模型' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setAiProvider(opt.value)
                    saveAIConfig({ provider: opt.value })
                    setTestResult(null)
                  }}
                  className={`
                    flex flex-col items-center gap-0.5 rounded-lg border p-2.5 transition-all text-xs
                    ${aiProvider === opt.value
                      ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-400 shadow-sm'
                      : 'border-border hover:border-violet-300 dark:hover:border-violet-700 text-muted-foreground'
                    }
                  `}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
                  {aiProvider === opt.value && <Check className="h-3 w-3 text-violet-500" />}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              "自动"模式优先使用DeepSeek（需配置API Key），不可用时自动回退到Z-AI SDK
            </p>
          </div>

          {/* DeepSeek API Key */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">DeepSeek API Key</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={deepseekKey}
                  onChange={(e) => {
                    setDeepseekKey(e.target.value)
                    saveAIConfig({ deepseekKey: e.target.value })
                    setTestResult(null)
                  }}
                  placeholder="sk-..."
                  className="pr-9 font-mono text-xs h-8 border-violet-200 dark:border-violet-800/50 focus-visible:ring-violet-500/30"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showApiKey ? '隐藏API Key' : '显示API Key'}
                >
                  {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              在 <span className="font-mono">deepseek.com</span> 获取API Key，存储在本地浏览器中
            </p>
          </div>

          {/* Model Name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">模型名称</Label>
            <Input
              value={modelName}
              onChange={(e) => {
                setModelName(e.target.value)
                saveAIConfig({ modelName: e.target.value })
              }}
              placeholder="deepseek-chat"
              className="font-mono text-xs h-8 border-violet-200 dark:border-violet-800/50 focus-visible:ring-violet-500/30"
            />
            <p className="text-[10px] text-muted-foreground">
              默认: deepseek-chat | 可选: deepseek-reasoner
            </p>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 w-full border-violet-200 dark:border-violet-800/50 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
              onClick={handleTestConnection}
              disabled={chatTest.isPending}
            >
              {chatTest.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug className="h-3.5 w-3.5" />
              )}
              测试连接
            </Button>
            {testResult && (
              <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
                testResult.success
                  ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                  : 'border-red-200 dark:border-red-800/50 bg-red-500/5 text-red-700 dark:text-red-400'
              }`}>
                {testResult.success ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>连接成功 · 提供商: {testResult.provider || '未知'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>连接失败: {testResult.error || '未知错误'}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

// ===== Tab 3: About =====
function AboutTab() {
  const dbStats = useMemo(() => ({ tables: 18, records: 142 }), [])

  const techBadges = [
    { name: 'Next.js 16', color: 'bg-black dark:bg-white text-white dark:text-black' },
    { name: 'TypeScript', color: 'bg-blue-600 text-white' },
    { name: 'Prisma', color: 'bg-indigo-600 text-white' },
    { name: 'shadcn/ui', color: 'bg-emerald-600 text-white' },
    { name: 'Tailwind CSS 4', color: 'bg-cyan-600 text-white' },
    { name: 'React Query', color: 'bg-red-500 text-white' },
    { name: 'Socket.io', color: 'bg-violet-600 text-white' },
    { name: 'Three.js', color: 'bg-amber-600 text-white' },
    { name: 'Recharts', color: 'bg-rose-500 text-white' },
    { name: 'NextAuth', color: 'bg-teal-600 text-white' },
    { name: 'Zustand', color: 'bg-orange-500 text-white' },
    { name: 'Framer Motion', color: 'bg-pink-600 text-white' },
  ]

  return (
    <ScrollArea className="flex-1 -mx-4 px-4">
      <div className="space-y-6 pb-4">
        {/* App Info */}
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 h-16 w-16 mb-3">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold">飘叔 Piaoshu</h3>
          <p className="text-sm text-muted-foreground">AI分身操作系统</p>
          <Badge variant="outline" className="mt-2 text-[10px] font-mono h-5">
            v0.1.0-alpha
          </Badge>
        </div>

        <Separator />

        {/* System Info */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-500" />
            系统信息
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Cpu className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                <div className="text-lg font-bold">{dbStats.tables}</div>
                <div className="text-[11px] text-muted-foreground">数据表</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Boxes className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                <div className="text-lg font-bold">{dbStats.records}</div>
                <div className="text-[11px] text-muted-foreground">数据记录</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Zap className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                <div className="text-lg font-bold">4</div>
                <div className="text-[11px] text-muted-foreground">AI 分身</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Heart className="h-4 w-4 mx-auto mb-1 text-rose-500" />
                <div className="text-lg font-bold">64</div>
                <div className="text-[11px] text-muted-foreground">向量维度</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Tech Stack */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">技术栈</Label>
          <div className="flex flex-wrap gap-1.5">
            {techBadges.map((badge) => (
              <span
                key={badge.name}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${badge.color}`}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* Links & Credits */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">相关链接</Label>
          <div className="space-y-2">
            {[
              { label: 'GitHub Repository', desc: '开源代码仓库' },
              { label: '产品文档', desc: '使用指南和API文档' },
              { label: '社区论坛', desc: '用户交流和反馈' },
            ].map((link) => (
              <button
                key={link.label}
                className="w-full flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{link.label}</div>
                  <div className="text-[11px] text-muted-foreground">{link.desc}</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="text-center text-[11px] text-muted-foreground pb-2">
          <p>Web4.0 AI-Native · 将AI从执行者升维为共生体</p>
          <p className="mt-1">© 2024 Piaoshu Team. Built with 💜</p>
        </div>
      </div>
    </ScrollArea>
  )
}

// ===== Main SettingsPanel =====
export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col gap-0"
      >
        <SheetHeader className="p-4 pb-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4.5 w-4.5 text-violet-500" />
            系统设置
          </SheetTitle>
          <SheetDescription className="text-xs">
            配置人格、主题、通知和系统参数
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-2">
          <Tabs defaultValue="soul" className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="soul" className="gap-1 text-[11px]">
                <User className="h-3.5 w-3.5" />
                人格设定
              </TabsTrigger>
              <TabsTrigger value="storage" className="gap-1 text-[11px]">
                <HardDrive className="h-3.5 w-3.5" />
                分布式存储
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1 text-[11px]">
                <Settings className="h-3.5 w-3.5" />
                系统配置
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-1 text-[11px]">
                <Info className="h-3.5 w-3.5" />
                关于
              </TabsTrigger>
            </TabsList>

            <TabsContent value="soul" className="flex-1 min-h-0 flex flex-col mt-0">
              <SoulEditorTab />
            </TabsContent>
            <TabsContent value="storage" className="flex-1 min-h-0 flex flex-col mt-0">
              <StorageSettings />
            </TabsContent>
            <TabsContent value="system" className="flex-1 min-h-0 flex flex-col mt-0">
              <SystemConfigTab />
            </TabsContent>
            <TabsContent value="about" className="flex-1 min-h-0 flex flex-col mt-0">
              <AboutTab />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
