'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Handshake, Building2, Database, Radio, Server, Mail,
  MessageCircle, Calendar, Plus, Target, ArrowRight, ArrowLeft,
  ChevronDown, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useBDPartners, useCreateBDPartner, useUpdateBDPartner, useDeleteBDPartner,
  useBDInteractions, useCreateBDInteraction, useSeedBD, useMediaVerticals,
} from '@/lib/api-hooks'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BDPartnerData {
  id: string
  name: string
  verticalId?: string | null
  partnerType: string
  tier: string
  industry?: string | null
  website?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactWechat?: string | null
  status: string
  stage: string
  valueScore: number
  notes?: string | null
  bdScriptUsed?: string | null
  lastContactAt?: string | null
  createdAt: string
  updatedAt: string
}

interface BDInteractionData {
  id: string
  partnerId: string
  type: string
  subject: string
  content?: string | null
  outcome?: string | null
  nextAction?: string | null
  followUpDate?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Label Maps ───────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  identified: '已识别',
  contacted: '已联系',
  meeting: '会议中',
  proposal: '提案中',
  closed_won: '已签约',
  closed_lost: '已流失',
}

const STAGE_ORDER = ['identified', 'contacted', 'meeting', 'proposal', 'closed_won']

const TYPE_LABELS: Record<string, string> = {
  data_source: '数据源',
  distribution: '分发渠道',
  tech_infra: '技术基建',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  data_source: Database,
  distribution: Radio,
  tech_infra: Server,
}

const TIER_LABELS: Record<string, string> = {
  a: 'A层·权威',
  b: 'B层·平台',
  c: 'C层·技术',
}

const TIER_COLORS: Record<string, string> = {
  a: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  b: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  c: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
}

const INTERACTION_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  email: { label: '邮件', icon: Mail, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  meeting: { label: '会议', icon: Users, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  call: { label: '电话', icon: MessageCircle, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  proposal: { label: '提案', icon: Target, color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
  note: { label: '备注', icon: ChevronDown, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
}

// ─── Fallback / Demo Data ─────────────────────────────────────────────────────

const FALLBACK_PARTNERS: BDPartnerData[] = [
  { id: 'p1', name: '清华知识工程实验室', partnerType: 'data_source', tier: 'a', industry: '学术研究', website: 'https://keg.cs.tsinghua.edu.cn', contactName: '张教授', contactEmail: 'zhang@tsinghua.edu.cn', status: 'active', stage: 'closed_won', valueScore: 92, notes: '顶级NLP数据源，已签署长期合作协议', bdScriptUsed: '学术权威+数据稀缺性钩子', lastContactAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 2592000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p2', name: '百度文心生态', partnerType: 'tech_infra', tier: 'a', industry: 'AI平台', website: 'https://yiyan.baidu.com', contactName: '李总', contactEmail: 'li@baidu.com', status: 'active', stage: 'proposal', valueScore: 85, notes: '百度大模型生态接入谈判', bdScriptUsed: 'AI原生+可信知识钩子', lastContactAt: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date(Date.now() - 1728000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p3', name: '36氪', partnerType: 'distribution', tier: 'b', industry: '科技媒体', website: 'https://36kr.com', contactName: '王编辑', contactEmail: 'wang@36kr.com', status: 'active', stage: 'meeting', valueScore: 78, notes: '独家内容合作', bdScriptUsed: 'AI可引用内容+流量钩子', lastContactAt: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date(Date.now() - 3456000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p4', name: '阿里云百炼', partnerType: 'tech_infra', tier: 'a', industry: '云计算', website: 'https://bailian.aliyun.com', contactName: '赵经理', contactEmail: 'zhao@alibaba.com', status: 'active', stage: 'contacted', valueScore: 80, notes: 'MaaS平台合作', bdScriptUsed: '知识资产上云+结算钩子', lastContactAt: new Date(Date.now() - 345600000).toISOString(), createdAt: new Date(Date.now() - 4320000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p5', name: '虎嗅网', partnerType: 'distribution', tier: 'b', industry: '科技媒体', website: 'https://huxiu.com', contactName: '刘主编', contactEmail: 'liu@huxiu.com', status: 'active', stage: 'identified', valueScore: 65, notes: '内容分发渠道', bdScriptUsed: '', lastContactAt: null, createdAt: new Date(Date.now() - 5184000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p6', name: '中科院信工所', partnerType: 'data_source', tier: 'a', industry: '信息安全', website: 'https://iie.cas.cn', contactName: '陈博士', contactEmail: 'chen@iie.cas.cn', status: 'active', stage: 'meeting', valueScore: 88, notes: '可信AI数据合作', bdScriptUsed: '权威背书+可验证性钩子', lastContactAt: new Date(Date.now() - 432000000).toISOString(), createdAt: new Date(Date.now() - 6048000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p7', name: '即刻App', partnerType: 'distribution', tier: 'c', industry: '社交平台', website: 'https://okjk.co', contactName: '黄运营', contactEmail: 'huang@jike.com', status: 'active', stage: 'contacted', valueScore: 55, notes: 'AI内容社区分发', bdScriptUsed: '社区氛围+精准受众钩子', lastContactAt: new Date(Date.now() - 518400000).toISOString(), createdAt: new Date(Date.now() - 6912000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'p8', name: 'Vector Database Inc.', partnerType: 'tech_infra', tier: 'c', industry: '向量数据库', website: 'https://vectordb.io', contactName: 'Mike', contactEmail: 'mike@vectordb.io', status: 'active', stage: 'identified', valueScore: 48, notes: 'RAG基础设施供应商', bdScriptUsed: '', lastContactAt: null, createdAt: new Date(Date.now() - 7776000000).toISOString(), updatedAt: new Date().toISOString() },
]

const FALLBACK_INTERACTIONS: BDInteractionData[] = [
  { id: 'i1', partnerId: 'p1', type: 'meeting', subject: '知识图谱数据授权会议', content: '讨论了知识图谱数据的授权方式和定价模型', outcome: '达成初步合作意向', nextAction: '发送合作协议草案', followUpDate: new Date(Date.now() + 604800000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i2', partnerId: 'p1', type: 'email', subject: '发送合作框架文档', content: '包含数据授权、结算机制和AI引用追踪三部分', outcome: '对方已确认收到', nextAction: '安排签约会议', followUpDate: new Date(Date.now() + 259200000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i3', partnerId: 'p2', type: 'call', subject: '文心生态接入方案讨论', content: '讨论了API对接方式和知识资产结算分成', outcome: '需要内部评估', nextAction: '发送技术方案文档', followUpDate: new Date(Date.now() + 432000000).toISOString(), createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i4', partnerId: 'p3', type: 'meeting', subject: '独家内容合作洽谈', content: '讨论AI可引用内容的独家发布合作', outcome: '意向积极', nextAction: '提供内容样本', followUpDate: new Date(Date.now() + 345600000).toISOString(), createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'i5', partnerId: 'p6', type: 'proposal', subject: '可信AI数据合作提案', content: '提交了可信AI数据合作的详细提案', outcome: '待审核', nextAction: '跟进审核进度', followUpDate: new Date(Date.now() + 518400000).toISOString(), createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date().toISOString() },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  return `${months}月前`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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

function PartnerTypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] || Building2
  const label = TYPE_LABELS[type] || type
  return (
    <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const label = TIER_LABELS[tier] || tier
  const color = TIER_COLORS[tier] || TIER_COLORS.c
  return (
    <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5', color)}>
      {label}
    </Badge>
  )
}

function InteractionTypeBadge({ type }: { type: string }) {
  const config = INTERACTION_TYPE_LABELS[type] || INTERACTION_TYPE_LABELS.note
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 gap-0.5', config.color)}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BDPipelineView() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [addPartnerOpen, setAddPartnerOpen] = useState(false)
  const [addInteractionOpen, setAddInteractionOpen] = useState(false)
  const [newPartner, setNewPartner] = useState({
    name: '',
    partnerType: 'data_source',
    tier: 'b',
    industry: '',
    website: '',
    contactName: '',
    contactEmail: '',
    notes: '',
  })
  const [newInteraction, setNewInteraction] = useState({
    type: 'email',
    subject: '',
    content: '',
    outcome: '',
    nextAction: '',
    followUpDate: '',
  })

  // ── API Hooks ──────────────────────────────────────────────────────────────
  const partnersQuery = useBDPartners()
  const seedBD = useSeedBD()
  const createPartner = useCreateBDPartner()
  const updatePartner = useUpdateBDPartner()
  const deletePartner = useDeleteBDPartner()
  const interactionsQuery = useBDInteractions(selectedPartnerId || undefined)
  const createInteraction = useCreateBDInteraction()
  const verticalsQuery = useMediaVerticals()

  // ── Data with fallbacks ────────────────────────────────────────────────────
  const partners = (partnersQuery.data?.partners as BDPartnerData[] | undefined) ?? FALLBACK_PARTNERS
  const allInteractions = (interactionsQuery.data?.interactions as BDInteractionData[] | undefined) ?? FALLBACK_INTERACTIONS.filter(i => !selectedPartnerId || i.partnerId === selectedPartnerId)

  const isLoading = partnersQuery.isLoading
  const hasNoData = !partnersQuery.isLoading && (partnersQuery.data?.partners as BDPartnerData[] | undefined)?.length === 0

  // ── Auto-seed on first load ───────────────────────────────────────────────
  useEffect(() => {
    if (hasNoData && !seedBD.isPending) {
      seedBD.mutate(undefined, {
        onSuccess: () => {
          toast.success('BD管线示例数据已自动生成')
        },
        onError: () => {
          toast.error('自动生成示例数据失败')
        },
      })
    }
  }, [hasNoData, seedBD])

  // ── Selected partner ──────────────────────────────────────────────────────
  const selectedPartner = useMemo(() => {
    if (!selectedPartnerId) return null
    return partners.find(p => p.id === selectedPartnerId) ?? null
  }, [partners, selectedPartnerId])

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalCount = partners.length
  const activeCount = partners.filter(p => !['closed_lost', 'closed_won'].includes(p.stage)).length
  const closedWonCount = partners.filter(p => p.stage === 'closed_won').length
  const conversionRate = totalCount > 0 ? Math.round((closedWonCount / totalCount) * 100) : 0

  const overviewStats = [
    { label: '总伙伴', value: String(totalCount), unit: '个', icon: Users, gradient: 'from-amber-500 to-orange-600', bgGlow: 'bg-amber-500/10' },
    { label: '进行中', value: String(activeCount), unit: '个', icon: Handshake, gradient: 'from-orange-500 to-amber-600', bgGlow: 'bg-orange-500/10' },
    { label: '已签约', value: String(closedWonCount), unit: '个', icon: Building2, gradient: 'from-amber-500 to-yellow-500', bgGlow: 'bg-amber-500/10' },
    { label: '转化率', value: `${conversionRate}`, unit: '%', icon: Target, gradient: 'from-orange-500 to-red-500', bgGlow: 'bg-orange-500/10' },
  ]

  // ── Partners grouped by stage ─────────────────────────────────────────────
  const partnersByStage = useMemo(() => {
    const grouped: Record<string, BDPartnerData[]> = {}
    for (const stage of STAGE_ORDER) {
      grouped[stage] = partners.filter(p => p.stage === stage)
    }
    return grouped
  }, [partners])

  // ── Partner type counts ───────────────────────────────────────────────────
  const typeCards = useMemo(() => {
    const types = [
      { key: 'data_source', label: '数据源', icon: Database, desc: '提供训练数据与知识图谱的权威数据源' },
      { key: 'distribution', label: '分发渠道', icon: Radio, desc: '内容分发与触达的渠道伙伴' },
      { key: 'tech_infra', label: '技术基建', icon: Server, desc: 'AI基础设施与技术平台合作' },
    ] as const
    return types.map(t => ({
      ...t,
      count: partners.filter(p => p.partnerType === t.key).length,
    }))
  }, [partners])

  // ── Interactions for selected partner ─────────────────────────────────────
  const selectedInteractions = useMemo(() => {
    if (!selectedPartnerId) return []
    return allInteractions.filter(i => i.partnerId === selectedPartnerId)
  }, [allInteractions, selectedPartnerId])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSeed = () => {
    seedBD.mutate(undefined, {
      onSuccess: () => toast.success('BD管线示例数据已生成'),
      onError: () => toast.error('生成示例数据失败'),
    })
  }

  const handleCreatePartner = () => {
    if (!newPartner.name) {
      toast.error('请填写伙伴名称')
      return
    }
    createPartner.mutate({
      name: newPartner.name,
      partnerType: newPartner.partnerType,
      tier: newPartner.tier,
      industry: newPartner.industry || undefined,
      website: newPartner.website || undefined,
      contactName: newPartner.contactName || undefined,
      contactEmail: newPartner.contactEmail || undefined,
      notes: newPartner.notes || undefined,
      stage: 'identified',
      status: 'active',
      valueScore: 50,
    }, {
      onSuccess: () => {
        toast.success(`伙伴 "${newPartner.name}" 已创建`)
        setAddPartnerOpen(false)
        setNewPartner({ name: '', partnerType: 'data_source', tier: 'b', industry: '', website: '', contactName: '', contactEmail: '', notes: '' })
      },
      onError: () => toast.error('创建伙伴失败'),
    })
  }

  const handleStageChange = (partnerId: string, direction: 'prev' | 'next') => {
    const partner = partners.find(p => p.id === partnerId)
    if (!partner) return
    const currentIdx = STAGE_ORDER.indexOf(partner.stage)
    if (direction === 'next' && currentIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIdx + 1]
      updatePartner.mutate({ id: partnerId, stage: nextStage }, {
        onSuccess: () => toast.success(`已推进至 ${STAGE_LABELS[nextStage]}`),
        onError: () => toast.error('阶段更新失败'),
      })
    } else if (direction === 'prev' && currentIdx > 0) {
      const prevStage = STAGE_ORDER[currentIdx - 1]
      updatePartner.mutate({ id: partnerId, stage: prevStage }, {
        onSuccess: () => toast.success(`已回退至 ${STAGE_LABELS[prevStage]}`),
        onError: () => toast.error('阶段更新失败'),
      })
    }
  }

  const handleCreateInteraction = () => {
    if (!selectedPartnerId || !newInteraction.subject) {
      toast.error('请填写互动主题')
      return
    }
    createInteraction.mutate({
      partnerId: selectedPartnerId,
      type: newInteraction.type,
      subject: newInteraction.subject,
      content: newInteraction.content || undefined,
      outcome: newInteraction.outcome || undefined,
      nextAction: newInteraction.nextAction || undefined,
      followUpDate: newInteraction.followUpDate || undefined,
    }, {
      onSuccess: () => {
        toast.success('互动记录已添加')
        setAddInteractionOpen(false)
        setNewInteraction({ type: 'email', subject: '', content: '', outcome: '', nextAction: '', followUpDate: '' })
      },
      onError: () => toast.error('添加互动失败'),
    })
  }

  const handleDeletePartner = (partnerId: string) => {
    deletePartner.mutate(partnerId, {
      onSuccess: () => {
        toast.success('伙伴已删除')
        if (selectedPartnerId === partnerId) setSelectedPartnerId(null)
      },
      onError: () => toast.error('删除失败'),
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-background text-foreground space-y-6">
      {/* ── 1. Header Section ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 p-6 sm:p-8 bg-gradient-to-br from-amber-500/[0.03] via-background to-orange-500/[0.02]"
      >
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                <Handshake className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">合作伙伴管线</h1>
                <p className="text-xs text-muted-foreground font-mono">BD Pipeline · AI可引用、可计量、可结算的可信知识资产</p>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              管理BD全生命周期 · 从识别到签约的可视化管线
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasNoData && (
              <Button
                onClick={handleSeed}
                disabled={seedBD.isPending}
                className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20"
              >
                {seedBD.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                生成示例数据
              </Button>
            )}
            <Button
              onClick={() => setAddPartnerOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              添加伙伴
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
                  <Card className="rounded-xl shadow-sm border-amber-500/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg', stat.gradient, 'shadow-amber-500/10')}>
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

      {/* ── 2. Pipeline Columns ─────────────────────────────────────────────── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <Card className="rounded-xl shadow-sm border-amber-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">BD管线</CardTitle>
              <Badge variant="secondary" className="text-[10px] border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                {totalCount} 伙伴
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {STAGE_ORDER.map((stage, stageIdx) => {
                const stagePartners = partnersByStage[stage] || []
                return (
                  <div
                    key={stage}
                    className="min-w-[220px] flex-1 shrink-0"
                  >
                    {/* Stage header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
                      </div>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        {stagePartners.length}
                      </Badge>
                    </div>

                    {/* Connector arrow */}
                    {stageIdx < STAGE_ORDER.length - 1 && (
                      <div className="hidden sm:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                        <ArrowRight className="h-3 w-3 text-amber-500/40" />
                      </div>
                    )}

                    {/* Partner cards */}
                    <div className="space-y-2 min-h-[120px]">
                      {stagePartners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40 border border-dashed border-border/40 rounded-lg">
                          <Users className="h-5 w-5 mb-1" />
                          <span className="text-[10px]">暂无伙伴</span>
                        </div>
                      ) : (
                        stagePartners.map((partner, i) => (
                          <motion.div
                            key={partner.id}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card
                              className={cn(
                                'cursor-pointer transition-all duration-200 overflow-hidden',
                                selectedPartnerId === partner.id
                                  ? 'border-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/10'
                                  : 'border-border/60 hover:border-amber-500/20 hover:shadow-sm'
                              )}
                              onClick={() => setSelectedPartnerId(partner.id)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-semibold truncate">{partner.name}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <PartnerTypeBadge type={partner.partnerType} />
                                  <TierBadge tier={partner.tier} />
                                </div>
                                {partner.industry && (
                                  <p className="text-[10px] text-muted-foreground truncate">{partner.industry}</p>
                                )}
                                {/* Value score bar */}
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-muted-foreground">价值分</span>
                                    <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">{partner.valueScore}</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(100, partner.valueScore)}%` }}
                                      transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 3. Partner Type Cards Row ───────────────────────────────────────── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {typeCards.map((tc, i) => {
            const Icon = tc.icon
            return (
              <motion.div
                key={tc.key}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
              >
                <Card className="rounded-xl shadow-sm border-amber-500/10 overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                        <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{tc.label}</h3>
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            {tc.count}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tc.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── 4. Selected Partner Detail ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPartner && (
          <motion.div
            key="partner-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Card className="rounded-xl shadow-sm border-amber-500/20 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{selectedPartner.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PartnerTypeBadge type={selectedPartner.partnerType} />
                        <TierBadge tier={selectedPartner.tier} />
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-amber-500/20 text-amber-600 dark:text-amber-400">
                          {STAGE_LABELS[selectedPartner.stage] || selectedPartner.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Stage navigation */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                      onClick={() => handleStageChange(selectedPartner.id, 'prev')}
                      disabled={STAGE_ORDER.indexOf(selectedPartner.stage) <= 0}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      上一阶段
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                      onClick={() => handleStageChange(selectedPartner.id, 'next')}
                      disabled={STAGE_ORDER.indexOf(selectedPartner.stage) >= STAGE_ORDER.length - 1}
                    >
                      下一阶段
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setSelectedPartnerId(null)}
                    >
                      收起
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => handleDeletePartner(selectedPartner.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Partner info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">伙伴信息</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedPartner.industry && (
                          <div>
                            <span className="text-xs text-muted-foreground">行业</span>
                            <p className="font-medium text-sm">{selectedPartner.industry}</p>
                          </div>
                        )}
                        {selectedPartner.website && (
                          <div>
                            <span className="text-xs text-muted-foreground">网站</span>
                            <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-amber-600 dark:text-amber-400 hover:underline truncate block">
                              {selectedPartner.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                        {selectedPartner.contactName && (
                          <div>
                            <span className="text-xs text-muted-foreground">联系人</span>
                            <p className="font-medium text-sm">{selectedPartner.contactName}</p>
                          </div>
                        )}
                        {selectedPartner.contactEmail && (
                          <div>
                            <span className="text-xs text-muted-foreground">邮箱</span>
                            <a href={`mailto:${selectedPartner.contactEmail}`} className="font-medium text-sm text-amber-600 dark:text-amber-400 hover:underline">
                              {selectedPartner.contactEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedPartner.notes && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">备注</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPartner.notes}</p>
                      </div>
                    )}

                    {selectedPartner.bdScriptUsed && (
                      <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                        <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          钩子话术 · BD Script
                        </h4>
                        <p className="text-sm text-amber-900 dark:text-amber-300">{selectedPartner.bdScriptUsed}</p>
                      </div>
                    )}

                    {/* Value Score */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">价值评分</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{selectedPartner.valueScore}/100</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, selectedPartner.valueScore)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {selectedPartner.lastContactAt && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>上次联系: {timeAgo(selectedPartner.lastContactAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Interaction timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <MessageCircle className="h-3 w-3" />
                        互动记录
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 border-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {selectedInteractions.length}
                        </Badge>
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1 border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                        onClick={() => setAddInteractionOpen(true)}
                      >
                        <Plus className="h-3 w-3" />
                        添加互动
                      </Button>
                    </div>

                    {selectedInteractions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                        <MessageCircle className="h-6 w-6 mb-2" />
                        <span className="text-xs">暂无互动记录</span>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {selectedInteractions.map((interaction, i) => (
                          <motion.div
                            key={interaction.id}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="p-3 rounded-lg border border-border/60 hover:border-amber-500/20 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <InteractionTypeBadge type={interaction.type} />
                                  <span className="text-xs font-medium truncate">{interaction.subject}</span>
                                </div>
                                {interaction.content && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">{interaction.content}</p>
                                )}
                                {interaction.outcome && (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                                    结果: {interaction.outcome}
                                  </p>
                                )}
                                {interaction.nextAction && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    下一步: {interaction.nextAction}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-[9px] text-muted-foreground">{formatDate(interaction.createdAt)}</span>
                                {interaction.followUpDate && (
                                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-amber-500/20 text-amber-600 dark:text-amber-400">
                                    <Calendar className="h-2 w-2 mr-0.5" />
                                    {formatDate(interaction.followUpDate)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Add Partner Dialog ───────────────────────────────────────────── */}
      <Dialog open={addPartnerOpen} onOpenChange={setAddPartnerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-amber-500" />
              添加合作伙伴
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">伙伴名称 *</label>
              <Input
                placeholder="例如：清华知识工程实验室"
                value={newPartner.name}
                onChange={e => setNewPartner(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">伙伴类型</label>
                <Select value={newPartner.partnerType} onValueChange={v => setNewPartner(f => ({ ...f, partnerType: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_source">数据源</SelectItem>
                    <SelectItem value="distribution">分发渠道</SelectItem>
                    <SelectItem value="tech_infra">技术基建</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">层级</label>
                <Select value={newPartner.tier} onValueChange={v => setNewPartner(f => ({ ...f, tier: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A层·权威</SelectItem>
                    <SelectItem value="b">B层·平台</SelectItem>
                    <SelectItem value="c">C层·技术</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">行业</label>
              <Input
                placeholder="例如：AI平台、学术研究"
                value={newPartner.industry}
                onChange={e => setNewPartner(f => ({ ...f, industry: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">网站</label>
              <Input
                placeholder="https://example.com"
                value={newPartner.website}
                onChange={e => setNewPartner(f => ({ ...f, website: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">联系人</label>
                <Input
                  placeholder="张总"
                  value={newPartner.contactName}
                  onChange={e => setNewPartner(f => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">邮箱</label>
                <Input
                  placeholder="zhang@example.com"
                  value={newPartner.contactEmail}
                  onChange={e => setNewPartner(f => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">备注</label>
              <Textarea
                placeholder="伙伴合作说明..."
                value={newPartner.notes}
                onChange={e => setNewPartner(f => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddPartnerOpen(false)}>取消</Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white gap-1"
              onClick={handleCreatePartner}
              disabled={createPartner.isPending}
            >
              {createPartner.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              创建伙伴
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Interaction Dialog ──────────────────────────────────────────── */}
      <Dialog open={addInteractionOpen} onOpenChange={setAddInteractionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-amber-500" />
              添加互动记录
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">互动类型</label>
                <Select value={newInteraction.type} onValueChange={v => setNewInteraction(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">邮件</SelectItem>
                    <SelectItem value="meeting">会议</SelectItem>
                    <SelectItem value="call">电话</SelectItem>
                    <SelectItem value="proposal">提案</SelectItem>
                    <SelectItem value="note">备注</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">跟进日期</label>
                <Input
                  type="date"
                  value={newInteraction.followUpDate}
                  onChange={e => setNewInteraction(f => ({ ...f, followUpDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">主题 *</label>
              <Input
                placeholder="例如：合作方案讨论"
                value={newInteraction.subject}
                onChange={e => setNewInteraction(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">内容</label>
              <Textarea
                placeholder="互动详情..."
                value={newInteraction.content}
                onChange={e => setNewInteraction(f => ({ ...f, content: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">结果</label>
                <Input
                  placeholder="例如：达成初步意向"
                  value={newInteraction.outcome}
                  onChange={e => setNewInteraction(f => ({ ...f, outcome: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">下一步</label>
                <Input
                  placeholder="例如：发送协议草案"
                  value={newInteraction.nextAction}
                  onChange={e => setNewInteraction(f => ({ ...f, nextAction: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddInteractionOpen(false)}>取消</Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white gap-1"
              onClick={handleCreateInteraction}
              disabled={createInteraction.isPending}
            >
              {createInteraction.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              添加互动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
