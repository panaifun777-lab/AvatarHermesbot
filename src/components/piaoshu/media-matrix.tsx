'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Radio,
  Tv,
  Newspaper,
  Globe2,
  Hash,
  FileText,
  Link2,
  Shield,
  Sparkles,
  Plus,
  TrendingUp,
  Database,
  Eye,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useMediaVerticals,
  useMediaChannels,
  useMediaContents,
  useCreateMediaContent,
  useSeedMedia,
} from '@/lib/api-hooks'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerticalData {
  id: string
  name: string
  slug: string
  icon?: string | null
  color?: string | null
  description?: string | null
  status: string
  priority: number
  createdAt: string
  updatedAt: string
  channels?: ChannelData[]
  contents?: ContentData[]
  _count?: { channels: number; contents: number }
}

interface ChannelData {
  id: string
  verticalId: string
  name: string
  platform: string
  url?: string | null
  followers: number
  avgReach: number
  postFrequency: string
  status: string
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}

interface ContentData {
  id: string
  verticalId: string
  channelId?: string | null
  title: string
  contentType: string
  status: string
  contentData?: string | null
  citationUrl?: string | null
  contentHash?: string | null
  onChainTxId?: string | null
  schemaMarkup?: string | null
  reachCount: number
  citationCount: number
  aiCitationCount: number
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Fallback / Demo Data ─────────────────────────────────────────────────────

const FALLBACK_VERTICALS: VerticalData[] = [
  {
    id: 'v-tech',
    name: '科技',
    slug: 'tech',
    icon: '💻',
    color: '#10b981',
    description: '科技垂直领域 — AI、Web3、开发者生态',
    status: 'active',
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { channels: 4, contents: 8 },
  },
  {
    id: 'v-finance',
    name: '金融',
    slug: 'finance',
    icon: '📊',
    color: '#06b6d4',
    description: '金融垂直领域 — 投资、DeFi、宏观经济',
    status: 'active',
    priority: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { channels: 3, contents: 5 },
  },
  {
    id: 'v-lifestyle',
    name: '生活方式',
    slug: 'lifestyle',
    icon: '🌿',
    color: '#f43f5e',
    description: '生活方式垂直领域 — 健康、旅行、文化',
    status: 'active',
    priority: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { channels: 3, contents: 4 },
  },
]

const FALLBACK_CHANNELS: ChannelData[] = [
  { id: 'ch1', verticalId: 'v-tech', name: '飘叔科技说', platform: 'wechat', followers: 52000, avgReach: 18000, postFrequency: '3篇/周', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch2', verticalId: 'v-tech', name: '@piaoshu_tech', platform: 'twitter', followers: 28500, avgReach: 12000, postFrequency: '5条/天', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch3', verticalId: 'v-tech', name: '飘叔AI实验室', platform: 'xiaohongshu', followers: 15800, avgReach: 8500, postFrequency: '2篇/周', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch4', verticalId: 'v-tech', name: 'Piaoshu Tech', platform: 'youtube', followers: 8200, avgReach: 4200, postFrequency: '1视频/周', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch5', verticalId: 'v-finance', name: '飘叔金融观察', platform: 'wechat', followers: 38000, avgReach: 15000, postFrequency: '2篇/周', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch6', verticalId: 'v-finance', name: '@piaoshu_fi', platform: 'twitter', followers: 19200, avgReach: 9500, postFrequency: '3条/天', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch7', verticalId: 'v-finance', name: 'Piaoshu DeFi', platform: 'discord', followers: 5600, avgReach: 2800, postFrequency: '每日互动', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch8', verticalId: 'v-lifestyle', name: '飘叔的生活', platform: 'xiaohongshu', followers: 22000, avgReach: 11000, postFrequency: '3篇/周', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch9', verticalId: 'v-lifestyle', name: '@piaoshu_life', platform: 'twitter', followers: 12800, avgReach: 6500, postFrequency: '2条/天', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ch10', verticalId: 'v-lifestyle', name: '飘叔Piaoshu', platform: 'douyin', followers: 45000, avgReach: 22000, postFrequency: '2视频/周', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const FALLBACK_CONTENTS: ContentData[] = [
  { id: 'c1', verticalId: 'v-tech', title: 'AI Agent架构：从AutoGPT到多智能体协作', contentType: 'article', status: 'indexed', reachCount: 28500, citationCount: 42, aiCitationCount: 12, onChainTxId: '0xabc123', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c2', verticalId: 'v-tech', title: 'Web4.0: AI原生的下一代互联网', contentType: 'article', status: 'verified', reachCount: 35200, citationCount: 67, aiCitationCount: 23, onChainTxId: '0xdef456', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c3', verticalId: 'v-tech', title: '用LangChain构建企业级AI Agent', contentType: 'video', status: 'published', reachCount: 18500, citationCount: 18, aiCitationCount: 5, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c4', verticalId: 'v-tech', title: 'AI Agent可验证性三大核心要素', contentType: 'citation_unit', status: 'indexed', reachCount: 12800, citationCount: 31, aiCitationCount: 19, onChainTxId: '0xghi789', createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c5', verticalId: 'v-tech', title: 'RAG检索增强生成的最佳实践', contentType: 'micro_content', status: 'published', reachCount: 9800, citationCount: 8, aiCitationCount: 3, createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c6', verticalId: 'v-finance', title: 'DeFi流动性挖矿的可持续性分析', contentType: 'article', status: 'indexed', reachCount: 22400, citationCount: 35, aiCitationCount: 14, onChainTxId: '0xjkl012', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c7', verticalId: 'v-finance', title: '2024加密市场监管趋势', contentType: 'citation_unit', status: 'verified', reachCount: 15800, citationCount: 52, aiCitationCount: 28, onChainTxId: '0xmno345', createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c8', verticalId: 'v-finance', title: 'RWA资产代币化解读', contentType: 'video', status: 'published', reachCount: 11200, citationCount: 12, aiCitationCount: 4, createdAt: new Date(Date.now() - 518400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c9', verticalId: 'v-lifestyle', title: '数字游民生活指南2024', contentType: 'article', status: 'draft', reachCount: 0, citationCount: 0, aiCitationCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c10', verticalId: 'v-lifestyle', title: 'AI创业者的一天', contentType: 'video', status: 'published', reachCount: 19800, citationCount: 15, aiCitationCount: 6, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString() },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function getVerticalConfig(slug: string) {
  switch (slug) {
    case 'tech':
      return {
        emoji: '💻',
        color: '#10b981',
        bgLight: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        gradient: 'from-emerald-500 to-teal-600',
        icon: Radio,
        glow: 'shadow-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      }
    case 'finance':
      return {
        emoji: '📊',
        color: '#06b6d4',
        bgLight: 'bg-cyan-500/10',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800',
        gradient: 'from-cyan-500 to-teal-600',
        icon: TrendingUp,
        glow: 'shadow-cyan-500/20',
        badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      }
    case 'lifestyle':
      return {
        emoji: '🌿',
        color: '#f43f5e',
        bgLight: 'bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800',
        gradient: 'from-rose-500 to-pink-600',
        icon: Newspaper,
        glow: 'shadow-rose-500/20',
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      }
    default:
      return {
        emoji: '🌐',
        color: '#64748b',
        bgLight: 'bg-slate-500/10',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-800',
        gradient: 'from-slate-500 to-gray-600',
        icon: Globe2,
        glow: 'shadow-slate-500/20',
        badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
      }
  }
}

function getPlatformConfig(platform: string) {
  switch (platform) {
    case 'wechat':
      return { icon: Hash, label: '微信公众号', color: '#07c160' }
    case 'twitter':
      return { icon: Globe2, label: 'X/Twitter', color: '#1d9bf0' }
    case 'xiaohongshu':
      return { icon: Newspaper, label: '小红书', color: '#fe2c55' }
    case 'douyin':
      return { icon: Tv, label: '抖音', color: '#000000' }
    case 'youtube':
      return { icon: Tv, label: 'YouTube', color: '#ff0000' }
    case 'discord':
      return { icon: Hash, label: 'Discord', color: '#5865f2' }
    case 'reddit':
      return { icon: Globe2, label: 'Reddit', color: '#ff4500' }
    default:
      return { icon: Globe2, label: platform, color: '#64748b' }
  }
}

function getContentTypeConfig(type: string) {
  switch (type) {
    case 'article':
      return { icon: FileText, label: '文档', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' }
    case 'video':
      return { icon: Tv, label: '视频', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' }
    case 'micro_content':
      return { icon: Hash, label: '微内容', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
    case 'citation_unit':
      return { icon: Link2, label: '引用单元', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' }
    default:
      return { icon: FileText, label: type, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' }
  }
}

function getContentStatusConfig(status: string) {
  switch (status) {
    case 'draft':
      return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', label: '草稿' }
    case 'published':
      return { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: '已发布' }
    case 'indexed':
      return { color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400', label: '已索引' }
    case 'verified':
      return { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', label: '已验证' }
    default:
      return { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', label: status }
  }
}

// ─── Motion Variants ──────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function VerticalCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full animate-pulse bg-muted" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MediaMatrixView() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedVerticalId, setSelectedVerticalId] = useState<string | null>(null)
  const [contentStatusFilter, setContentStatusFilter] = useState<string>('all')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all')
  const [citationDialogOpen, setCitationDialogOpen] = useState(false)
  const [citationForm, setCitationForm] = useState({
    title: '',
    verticalId: '',
    conclusion: '',
    sources: '',
    changelog: '',
  })

  // ── API Hooks ──────────────────────────────────────────────────────────────
  const verticalsQuery = useMediaVerticals()
  const channelsQuery = useMediaChannels(selectedVerticalId || undefined)
  const contentsQuery = useMediaContents({
    verticalId: selectedVerticalId || undefined,
    status: contentStatusFilter !== 'all' ? contentStatusFilter : undefined,
    contentType: contentTypeFilter !== 'all' ? contentTypeFilter : undefined,
  })
  const createContentMutation = useCreateMediaContent()
  const seedMediaMutation = useSeedMedia()

  // ── Data with fallbacks ────────────────────────────────────────────────────
  const verticals = (verticalsQuery.data?.verticals as VerticalData[] | undefined) ?? FALLBACK_VERTICALS
  const channels = (channelsQuery.data?.channels as ChannelData[] | undefined) ?? FALLBACK_CHANNELS.filter(c => !selectedVerticalId || c.verticalId === selectedVerticalId)
  const contents = (contentsQuery.data?.contents as ContentData[] | undefined) ?? FALLBACK_CONTENTS.filter(c => !selectedVerticalId || c.verticalId === selectedVerticalId)

  const isLoading = verticalsQuery.isLoading
  const hasNoData = !verticalsQuery.isLoading && (verticalsQuery.data?.verticals as VerticalData[] | undefined)?.length === 0

  // ── Auto-seed on first load ───────────────────────────────────────────────
  useEffect(() => {
    if (hasNoData && !seedMediaMutation.isPending) {
      seedMediaMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success('媒体矩阵示例数据已自动生成')
        },
        onError: () => {
          toast.error('自动生成示例数据失败')
        },
      })
    }
  }, [hasNoData, seedMediaMutation])

  // ── Selected vertical ──────────────────────────────────────────────────────
  const selectedVertical = useMemo(() => {
    if (!selectedVerticalId) return null
    return verticals.find(v => v.id === selectedVerticalId) ?? null
  }, [verticals, selectedVerticalId])

  const selectedVerticalSlug = selectedVertical?.slug ?? 'tech'
  const verticalConfig = selectedVertical ? getVerticalConfig(selectedVerticalSlug) : getVerticalConfig('tech')

  // ── Filtered contents ──────────────────────────────────────────────────────
  const filteredContents = useMemo(() => {
    let filtered = contents
    if (contentStatusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === contentStatusFilter)
    }
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(c => c.contentType === contentTypeFilter)
    }
    return filtered
  }, [contents, contentStatusFilter, contentTypeFilter])

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalVerticals = verticals.length
  const totalChannels = channels.length
  const totalContents = contents.length
  const totalAiCitations = contents.reduce((sum, c) => sum + (c.aiCitationCount || 0), 0)

  // ── Stats cards data ───────────────────────────────────────────────────────
  const overviewStats = [
    { label: '垂直领域', value: String(totalVerticals), unit: '个', icon: Globe2, gradient: 'from-emerald-500 to-teal-600', bgGlow: 'bg-emerald-500/10' },
    { label: '分发渠道', value: String(totalChannels), unit: '个', icon: Radio, gradient: 'from-cyan-500 to-teal-500', bgGlow: 'bg-cyan-500/10' },
    { label: '内容总量', value: String(totalContents), unit: '篇', icon: FileText, gradient: 'from-rose-500 to-pink-600', bgGlow: 'bg-rose-500/10' },
    { label: 'AI引用次数', value: String(totalAiCitations), unit: '次', icon: Bot, gradient: 'from-emerald-500 to-cyan-500', bgGlow: 'bg-emerald-500/10' },
  ]

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSeedMedia = () => {
    seedMediaMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('媒体矩阵示例数据已生成')
      },
      onError: () => {
        toast.error('生成示例数据失败')
      },
    })
  }

  const handleVerticalClick = (verticalId: string) => {
    setSelectedVerticalId(prev => prev === verticalId ? null : verticalId)
  }

  const handleCreateCitationUnit = () => {
    if (!citationForm.title || !citationForm.conclusion || !citationForm.verticalId) {
      toast.error('请填写标题、垂直领域和结论')
      return
    }
    createContentMutation.mutate({
      verticalId: citationForm.verticalId,
      title: citationForm.title,
      contentType: 'citation_unit',
      status: 'draft',
      contentData: JSON.stringify({
        conclusion: citationForm.conclusion,
        sources: citationForm.sources.split('\n').filter(Boolean),
        changelog: citationForm.changelog,
      }),
    }, {
      onSuccess: () => {
        toast.success(`引用单元 "${citationForm.title}" 已创建`)
        setCitationDialogOpen(false)
        setCitationForm({ title: '', verticalId: '', conclusion: '', sources: '', changelog: '' })
      },
      onError: () => {
        toast.error('创建引用单元失败')
      },
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-background text-foreground space-y-6">
      {/* ── 1. Header Section ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-6 sm:p-8 bg-gradient-to-br from-emerald-500/[0.03] via-background to-cyan-500/[0.02]"
      >
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                <Radio className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">媒体矩阵</h1>
                <p className="text-xs text-muted-foreground font-mono">Media Matrix · AI-Agent可用的可信知识资产</p>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              把高质量内容升级成AI-Agent可用的可信知识资产 · 管理垂直领域媒体存在与内容分发
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasNoData && (
              <Button
                onClick={handleSeedMedia}
                disabled={seedMediaMutation.isPending}
                className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              >
                {seedMediaMutation.isPending ? (
                  <Database className="h-4 w-4 animate-pulse" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                生成示例数据
              </Button>
            )}
            <Button
              onClick={() => setCitationDialogOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              创建引用单元
            </Button>
          </div>
        </div>

        {/* Overview stats row */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            overviewStats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className="rounded-xl shadow-sm border-emerald-500/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg', stat.gradient, 'shadow-emerald-500/10')}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <div className="text-xl font-bold">
                            {stat.value}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">{stat.unit}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* ── 2. Vertical Domain Cards ─────────────────────────────────────────── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <Card className="rounded-xl shadow-sm border-emerald-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-semibold">垂直领域</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{verticals.length} 个领域</Badge>
              </div>
              {selectedVerticalId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setSelectedVerticalId(null)}
                >
                  查看全部
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => <VerticalCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {verticals.map((vertical, i) => {
                  const config = getVerticalConfig(vertical.slug)
                  const Icon = config.icon
                  const isSelected = selectedVerticalId === vertical.id
                  const channelCount = (vertical as Record<string, unknown>)._count
                    ? ((vertical as Record<string, unknown>)._count as Record<string, number>).channels ?? 0
                    : FALLBACK_CHANNELS.filter(c => c.verticalId === vertical.id).length
                  const contentCount = (vertical as Record<string, unknown>)._count
                    ? ((vertical as Record<string, unknown>)._count as Record<string, number>).contents ?? 0
                    : FALLBACK_CONTENTS.filter(c => c.verticalId === vertical.id).length

                  return (
                    <motion.div
                      key={vertical.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={cn(
                          'cursor-pointer transition-all duration-300 overflow-hidden',
                          isSelected
                            ? `border-2 shadow-lg ${config.glow}`
                            : 'border-border/60 hover:shadow-md'
                        )}
                        onClick={() => handleVerticalClick(vertical.id)}
                      >
                        {/* Top accent bar */}
                        <div className="h-1 w-full" style={{ backgroundColor: config.color }} />

                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-lg', config.bgLight)}>
                              {config.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={cn('text-sm font-semibold', config.text)}>{vertical.name}</h3>
                              <p className="text-[10px] text-muted-foreground font-mono">{vertical.slug}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] px-1.5', vertical.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400')}
                            >
                              {vertical.status === 'active' ? '活跃' : vertical.status}
                            </Badge>
                          </div>

                          {vertical.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{vertical.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Radio className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{channelCount}</span>
                              <span className="text-muted-foreground">渠道</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{contentCount}</span>
                              <span className="text-muted-foreground">内容</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 3. Channels Grid (for selected vertical) ─────────────────────────── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <Card className="rounded-xl shadow-sm border-emerald-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4" style={{ color: verticalConfig.color }} />
                <CardTitle className="text-sm font-semibold">
                  {selectedVertical ? `${selectedVertical.name} 渠道` : '全部分发渠道'}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">{channels.length} 个</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Radio className="h-6 w-6 mb-2 opacity-40" />
                <p className="text-xs">暂无渠道数据</p>
                <p className="text-[10px] mt-1">选择一个垂直领域查看渠道</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {channels.map((channel, i) => {
                    const platform = getPlatformConfig(channel.platform)
                    const PlatformIcon = platform.icon
                    return (
                      <motion.div
                        key={channel.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="rounded-lg border border-border/60 p-3 transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          {/* Platform icon */}
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${platform.color}15` }}
                          >
                            <PlatformIcon className="h-4 w-4" style={{ color: platform.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate">{channel.name}</span>
                            </div>
                            <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0 mt-0.5">
                              {platform.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-2.5 w-2.5" />
                            {formatNumber(channel.followers)} 粉丝
                          </span>
                          <span className="flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />
                            {formatNumber(channel.avgReach)} 均触达
                          </span>
                        </div>

                        {/* Reach progress bar */}
                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-1.5">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: platform.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (channel.avgReach / Math.max(...channels.map(c => c.avgReach), 1)) * 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>

                        {/* Frequency badge */}
                        <Badge variant="secondary" className="text-[8px] h-4 px-1.5 border-0 bg-muted/50">
                          {channel.postFrequency}
                        </Badge>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 4. Content Library Table ──────────────────────────────────────────── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <Card className="rounded-xl shadow-sm border-emerald-500/10">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: verticalConfig.color }} />
                <CardTitle className="text-sm font-semibold">
                  {selectedVertical ? `${selectedVertical.name} 内容库` : '全量内容库'}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">{filteredContents.length} 条</Badge>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Status filter */}
                {['all', 'draft', 'published', 'indexed', 'verified'].map(status => (
                  <button
                    key={status}
                    onClick={() => setContentStatusFilter(status)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-medium transition-colors border',
                      contentStatusFilter === status
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        : 'text-muted-foreground hover:bg-accent border-transparent'
                    )}
                  >
                    {status === 'all' ? '全部状态' : getContentStatusConfig(status).label}
                  </button>
                ))}

                <Separator orientation="vertical" className="h-4 mx-1" />

                {/* Content type filter */}
                {['all', 'article', 'video', 'micro_content', 'citation_unit'].map(type => (
                  <button
                    key={type}
                    onClick={() => setContentTypeFilter(type)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-medium transition-colors border',
                      contentTypeFilter === type
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        : 'text-muted-foreground hover:bg-accent border-transparent'
                    )}
                  >
                    {type === 'all' ? '全部类型' : getContentTypeConfig(type).label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredContents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">暂无匹配内容</p>
                <p className="text-[11px] mt-1">尝试调整筛选条件</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px]">标题</TableHead>
                      <TableHead className="text-[11px] w-[70px]">类型</TableHead>
                      <TableHead className="text-[11px] w-[70px]">状态</TableHead>
                      <TableHead className="text-[11px] w-[65px] text-right">触达</TableHead>
                      <TableHead className="text-[11px] w-[55px] text-right">引用</TableHead>
                      <TableHead className="text-[11px] w-[55px] text-right">AI引用</TableHead>
                      <TableHead className="text-[11px] w-[65px] text-center">上链</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContents.map((content, i) => {
                      const typeConfig = getContentTypeConfig(content.contentType)
                      const statusConfig = getContentStatusConfig(content.status)
                      const TypeIcon = typeConfig.icon
                      return (
                        <motion.tr
                          key={content.id}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className="group transition-colors hover:bg-emerald-500/[0.03]"
                        >
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-xs font-medium truncate max-w-[200px] lg:max-w-[280px]">{content.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0', typeConfig.color)}>
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0', statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono text-muted-foreground">
                            {formatNumber(content.reachCount)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono text-muted-foreground">
                            {content.citationCount}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            <span className={content.aiCitationCount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                              {content.aiCitationCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {!!content.onChainTxId ? (
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0 gap-0.5 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                <Shield className="h-2.5 w-2.5" />
                                ✓ 链上
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40">—</span>
                            )}
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 5. Create Citation Unit Dialog ────────────────────────────────────── */}
      <Dialog open={citationDialogOpen} onOpenChange={setCitationDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-emerald-500" />
              创建引用单元
            </DialogTitle>
            <DialogDescription className="text-xs">
              结构化内容让AI代理可以放心引用。每个单元包含：结论 + 来源 + 更正日志
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">标题 *</Label>
              <Input
                placeholder="例：AI Agent可验证性三大核心要素"
                value={citationForm.title}
                onChange={e => setCitationForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* Vertical selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">垂直领域 *</Label>
              <Select
                value={citationForm.verticalId}
                onValueChange={v => setCitationForm(prev => ({ ...prev, verticalId: v }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="选择领域" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Conclusion */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-500" />
                结论 *
              </Label>
              <Textarea
                placeholder="把核心结论放在最前面，让AI Agent一目了然..."
                value={citationForm.conclusion}
                onChange={e => setCitationForm(prev => ({ ...prev, conclusion: e.target.value }))}
                className="text-sm min-h-[80px]"
              />
              <p className="text-[10px] text-muted-foreground">AI Agent优先读取结论，确保一句话说清要点</p>
            </div>

            {/* Sources */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Link2 className="h-3 w-3 text-cyan-500" />
                引用来源
              </Label>
              <Textarea
                placeholder="每行一个来源URL或引用&#10;例：https://openai.com/research&#10;例：Smith et al., 2024, Nature"
                value={citationForm.sources}
                onChange={e => setCitationForm(prev => ({ ...prev, sources: e.target.value }))}
                className="text-sm min-h-[60px]"
              />
            </div>

            {/* Changelog */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <FileText className="h-3 w-3 text-amber-500" />
                更正日志
              </Label>
              <Textarea
                placeholder="记录内容的更正与修订历史..."
                value={citationForm.changelog}
                onChange={e => setCitationForm(prev => ({ ...prev, changelog: e.target.value }))}
                className="text-sm min-h-[60px]"
              />
              <p className="text-[10px] text-muted-foreground">保持内容的可追溯性与可信度</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCitationDialogOpen(false)}
              className="text-sm"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateCitationUnit}
              disabled={createContentMutation.isPending}
              className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              {createContentMutation.isPending ? (
                <Database className="h-4 w-4 animate-pulse" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              创建引用单元
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
