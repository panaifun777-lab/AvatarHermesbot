'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Brain, Building2, FileText, Network, Eye, Plus, Search,
  Star, Tag, ArrowRight, Zap, ChevronRight, ChevronDown,
  RefreshCw, Layers, DoorOpen, Sparkles, Link2, GitBranch,
  AlertCircle, Trash2, Edit3, X, Check, Play, Activity,
  TrendingUp, Clock, BarChart3, Filter, Timer, CircleDot,
  Database, Flame, ArrowDownToLine, ArrowUpFromLine, Scissors
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  useMemoryPalace, useMemoryDrawers, useMemoryWake,
  useMemoryTunnels, useKGEntities, useKGTriples,
  useCreateDrawer, useUpdateDrawer, useDiscoverTunnels,
  useAddKGTriple, useSonaStatus, useTriggerSonaCycle
} from '@/lib/api-hooks'

// ===== Color & Label Maps =====
const WING_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  '个人身份': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-700 dark:text-violet-400', icon: '🧬' },
  '战略决策': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', icon: '🎯' },
  '工程架构': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700 dark:text-cyan-400', icon: '⚙️' },
  '增长运营': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', icon: '📈' },
  '人脉关系': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-700 dark:text-rose-400', icon: '🤝' },
}
const DEFAULT_WING_COLOR = { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-700 dark:text-teal-400', icon: '🏛️' }

const HALL_LABELS: Record<string, string> = {
  facts: '📋 事实', events: '📅 事件', discoveries: '💡 发现',
  preferences: '❤️ 偏好', advice: '🎓 建议', decisions: '⚡ 决策',
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  simulation: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  chat: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  decision: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  manual: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  evidence: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  external: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  cycle: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
}

const ENTITY_TYPE_COLORS: Record<string, string> = {
  person: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  project: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  technology: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  concept: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  organization: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
}

// ===== Fallback Data =====
const FALLBACK_WINGS = [
  {
    id: 'w1', name: '个人身份', wingType: 'topic', description: '飘叔的核心身份认知', priority: 9,
    rooms: [
      { id: 'r1', name: '核心信念', hallType: 'facts', drawerCount: 3, _count: { drawers: 3 } },
      { id: 'r2', name: '行为模式', hallType: 'preferences', drawerCount: 2, _count: { drawers: 2 } },
    ]
  },
  {
    id: 'w2', name: '战略决策', wingType: 'project', description: '产品与商业决策记忆', priority: 8,
    rooms: [
      { id: 'r3', name: '产品决策', hallType: 'decisions', drawerCount: 5, _count: { drawers: 5 } },
      { id: 'r4', name: '融资路线', hallType: 'facts', drawerCount: 2, _count: { drawers: 2 } },
    ]
  },
  {
    id: 'w3', name: '工程架构', wingType: 'topic', description: '技术栈与架构决策', priority: 7,
    rooms: [
      { id: 'r5', name: '认证系统', hallType: 'discoveries', drawerCount: 4, _count: { drawers: 4 } },
      { id: 'r6', name: '部署策略', hallType: 'advice', drawerCount: 3, _count: { drawers: 3 } },
    ]
  },
  {
    id: 'w4', name: '增长运营', wingType: 'agent', description: '市场与用户增长经验', priority: 6,
    rooms: [
      { id: 'r7', name: '内容策略', hallType: 'events', drawerCount: 6, _count: { drawers: 6 } },
    ]
  },
  {
    id: 'w5', name: '人脉关系', wingType: 'person', description: '重要人脉与协作关系', priority: 7,
    rooms: [
      { id: 'r8', name: '合作伙伴', hallType: 'facts', drawerCount: 3, _count: { drawers: 3 } },
      { id: 'r9', name: '投资人', hallType: 'facts', drawerCount: 2, _count: { drawers: 2 } },
    ]
  },
]

const FALLBACK_DRAWERS = [
  { id: 'd1', content: '选择Next.js作为全栈框架，因为SSR/SSG灵活切换，TypeScript原生支持', aaaakSummary: 'Next.js全栈=SSR+TS', sourceType: 'decision', importance: 5, tags: ['架构', 'Next.js', 'TypeScript'], accessCount: 12, validTo: null, createdAt: new Date().toISOString(), roomId: 'r5' },
  { id: 'd2', content: '飘叔在对话中偏好直接、务实的风格，不喜欢空话套话', aaaakSummary: '飘叔风格=直接务实', sourceType: 'chat', importance: 4, tags: ['人格', '沟通'], accessCount: 8, validTo: null, createdAt: new Date(Date.now() - 86400000).toISOString(), roomId: 'r2' },
  { id: 'd3', content: 'AFC Token经济模型：免费版5次周期/天，专业版无限周期', aaaakSummary: 'AFC经济=免费5次/天', sourceType: 'simulation', importance: 4, tags: ['商业模式', 'Token'], accessCount: 5, validTo: null, createdAt: new Date(Date.now() - 172800000).toISOString(), roomId: 'r3' },
  { id: 'd4', content: '微信生态是Piaoshu触达早期用户的关键渠道，优先微信公众号+小红书', aaaakSummary: '微信+小红书=早期渠道', sourceType: 'manual', importance: 3, tags: ['增长', '渠道'], accessCount: 3, validTo: null, createdAt: new Date(Date.now() - 259200000).toISOString(), roomId: 'r7' },
]

const FALLBACK_ENTITIES = [
  { id: 'e1', name: '飘叔', entityType: 'person', properties: '{}' },
  { id: 'e2', name: 'Piaoshu', entityType: 'project', properties: '{}' },
  { id: 'e3', name: 'Next.js', entityType: 'technology', properties: '{}' },
  { id: 'e4', name: 'AFC Token', entityType: 'concept', properties: '{}' },
  { id: 'e5', name: 'Prisma', entityType: 'technology', properties: '{}' },
  { id: 'e6', name: 'AI分身', entityType: 'concept', properties: '{}' },
]

const FALLBACK_TRIPLES = [
  { id: 't1', subject: { name: '飘叔', entityType: 'person' }, predicate: '创立', object: { name: 'Piaoshu', entityType: 'project' }, confidence: 1.0 },
  { id: 't2', subject: { name: 'Piaoshu', entityType: 'project' }, predicate: '使用', object: { name: 'Next.js', entityType: 'technology' }, confidence: 0.95 },
  { id: 't3', subject: { name: 'Piaoshu', entityType: 'project' }, predicate: '使用', object: { name: 'Prisma', entityType: 'technology' }, confidence: 0.9 },
  { id: 't4', subject: { name: 'Piaoshu', entityType: 'project' }, predicate: '包含', object: { name: 'AI分身', entityType: 'concept' }, confidence: 0.95 },
  { id: 't5', subject: { name: 'AI分身', entityType: 'concept' }, predicate: '驱动', object: { name: 'AFC Token', entityType: 'concept' }, confidence: 0.8 },
]

const FALLBACK_TUNNELS = [
  { id: 'tn1', roomA: { name: '认证系统', wing: { name: '工程架构' } }, roomB: { name: '部署策略', wing: { name: '工程架构' } }, sharedTheme: '安全性', strength: 3 },
  { id: 'tn2', roomA: { name: '产品决策', wing: { name: '战略决策' } }, roomB: { name: '核心信念', wing: { name: '个人身份' } }, sharedTheme: '产品哲学', strength: 4 },
  { id: 'tn3', roomA: { name: '内容策略', wing: { name: '增长运营' } }, roomB: { name: '合作伙伴', wing: { name: '人脉关系' } }, sharedTheme: '渠道合作', strength: 2 },
]

// ===== Star Rating Component =====
function StarRating({ value, max = 5, size = 'sm' }: { value: number; max?: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={cn(sz, i < Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
      ))}
    </div>
  )
}

// ===== Tab 1: Palace Map =====
function PalaceMapTab() {
  const { data: palaceData, isLoading, error, refetch } = useMemoryPalace()
  const [expandedWings, setExpandedWings] = useState<Set<string>>(new Set())
  const [showAddWing, setShowAddWing] = useState(false)
  const [showAddRoom, setShowAddRoom] = useState<string | null>(null)
  const [newWingName, setNewWingName] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomHallType, setNewRoomHallType] = useState('facts')

  const palace = palaceData?.data
  const wings: any[] = palace?.wings || FALLBACK_WINGS
  const stats = palace?.stats || { totalWings: wings.length, totalRooms: wings.reduce((a: number, w: any) => a + (w.rooms?.length || 0), 0), totalDrawers: 33, tunnelCount: 3 }

  const toggleWing = (wingId: string) => {
    setExpandedWings(prev => {
      const next = new Set(prev)
      if (next.has(wingId)) next.delete(wingId)
      else next.add(wingId)
      return next
    })
  }

  const handleAddWing = async () => {
    if (!newWingName.trim()) return
    try {
      const res = await fetch('/api/memory/palace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wing', name: newWingName, wingType: 'topic', priority: 5 })
      })
      const data = await res.json()
      if (data.success || data.data) {
        toast.success('新翼已创建')
        setNewWingName('')
        setShowAddWing(false)
        refetch()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch {
      toast.error('创建翼失败')
    }
  }

  const handleAddRoom = async (wingId: string) => {
    if (!newRoomName.trim()) return
    try {
      const res = await fetch('/api/memory/palace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'room', wingId, name: newRoomName, hallType: newRoomHallType })
      })
      const data = await res.json()
      if (data.success || data.data) {
        toast.success('新房间已创建')
        setNewRoomName('')
        setShowAddRoom(null)
        refetch()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch {
      toast.error('创建房间失败')
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">加载宫殿数据失败</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> 重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '总翼数', value: stats.totalWings, icon: Building2, color: 'text-teal-600' },
          { label: '总房间', value: stats.totalRooms, icon: DoorOpen, color: 'text-emerald-600' },
          { label: '总记忆', value: stats.totalDrawers, icon: FileText, color: 'text-amber-600' },
          { label: '隧道数', value: stats.tunnelCount, icon: Link2, color: 'text-cyan-600' },
        ].map(s => (
          <Card key={s.label} className="rounded-lg border bg-card">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-muted/50', s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Wing Button */}
      <div className="flex justify-end">
        <Dialog open={showAddWing} onOpenChange={setShowAddWing}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0">
              <Plus className="h-3.5 w-3.5" /> 添加翼
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加新翼</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>翼名称</Label>
                <Input value={newWingName} onChange={e => setNewWingName(e.target.value)} placeholder="例如：个人身份" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddWing} disabled={!newWingName.trim()}>创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wing Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wings.map((wing: any) => {
            const isExpanded = expandedWings.has(wing.id)
            const colors = WING_COLORS[wing.name] || DEFAULT_WING_COLOR
            return (
              <motion.div
                key={wing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  'rounded-lg border transition-all hover:shadow-md cursor-pointer',
                  isExpanded && 'ring-2 ring-teal-500/30'
                )}>
                  <CardHeader className="p-4 pb-2" onClick={() => toggleWing(wing.id)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-lg">{colors.icon}</span>
                        <span className={colors.text}>{wing.name}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">P{wing.priority}</Badge>
                        <Progress value={wing.priority * 10} className="w-12 h-1.5" />
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {wing.description && <p className="text-xs text-muted-foreground mt-1">{wing.description}</p>}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="space-y-1.5 pt-2">
                            {(wing.rooms || []).map((room: any) => (
                              <div key={room.id} className={cn(
                                'flex items-center justify-between p-2 rounded-md text-sm transition-colors',
                                'hover:bg-muted/50'
                              )}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <DoorOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{room.name}</span>
                                  <Badge variant="secondary" className="text-[10px] shrink-0">
                                    {HALL_LABELS[room.hallType] || room.hallType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{room._count?.drawers || room.drawerCount || 0}</span>
                                </div>
                              </div>
                            ))}
                            {/* Add Room button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); setShowAddRoom(wing.id) }}
                            >
                              <Plus className="h-3 w-3" /> 添加房间
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!isExpanded && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DoorOpen className="h-3 w-3" /> {wing.rooms?.length || 0} 房间
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Room Dialog */}
      <Dialog open={!!showAddRoom} onOpenChange={() => setShowAddRoom(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加新房间</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>房间名称</Label>
              <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="例如：认证系统" />
            </div>
            <div>
              <Label>大厅类型</Label>
              <Select value={newRoomHallType} onValueChange={setNewRoomHallType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(HALL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => showAddRoom && handleAddRoom(showAddRoom)} disabled={!newRoomName.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Tab 2: Memory Drawers =====
function MemoryDrawersTab() {
  const [drawerFilter, setDrawerFilter] = useState<{ roomId?: string; wingId?: string }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all')
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [editingDrawer, setEditingDrawer] = useState<any>(null)
  const [newContent, setNewContent] = useState('')
  const [newSourceType, setNewSourceType] = useState('manual')
  const [newImportance, setNewImportance] = useState(3)
  const [newTags, setNewTags] = useState('')
  const [newRoomId, setNewRoomId] = useState('')

  const { data: drawersData, isLoading, error, refetch } = useMemoryDrawers(drawerFilter)
  const { data: palaceData } = useMemoryPalace()
  const createDrawer = useCreateDrawer()
  const updateDrawer = useUpdateDrawer()

  const palace = palaceData?.data
  const allWings: any[] = palace?.wings || FALLBACK_WINGS
  const allRooms = allWings.flatMap((w: any) => (w.rooms || []).map((r: any) => ({ ...r, wingName: w.name, wingId: w.id })))

  const drawers: any[] = drawersData?.data?.drawers || FALLBACK_DRAWERS

  const filteredDrawers = drawers.filter((d: any) => {
    if (sourceTypeFilter !== 'all' && d.sourceType !== sourceTypeFilter) return false
    if (searchQuery && !d.content?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (drawerFilter.roomId && d.roomId !== drawerFilter.roomId) return false
    return true
  })

  const handleCreateDrawer = async () => {
    if (!newContent.trim() || !newRoomId) {
      toast.error('请填写内容和选择房间')
      return
    }
    try {
      await createDrawer.mutateAsync({
        roomId: newRoomId,
        content: newContent,
        sourceType: newSourceType,
        importance: newImportance,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
      })
      toast.success('记忆已添加')
      setNewContent('')
      setNewTags('')
      setNewRoomId('')
      setShowAddDrawer(false)
      refetch()
    } catch {
      toast.error('添加失败')
    }
  }

  const handleUpdateDrawer = async () => {
    if (!editingDrawer) return
    try {
      await updateDrawer.mutateAsync({
        id: editingDrawer.id,
        content: editingDrawer.content,
        importance: editingDrawer.importance,
        tags: editingDrawer.tags
      })
      toast.success('记忆已更新')
      setEditingDrawer(null)
      refetch()
    } catch {
      toast.error('更新失败')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索记忆内容..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
          <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue placeholder="来源类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="simulation">模拟</SelectItem>
            <SelectItem value="chat">对话</SelectItem>
            <SelectItem value="decision">决策</SelectItem>
            <SelectItem value="manual">手动</SelectItem>
            <SelectItem value="evidence">证据</SelectItem>
            <SelectItem value="cycle">周期</SelectItem>
          </SelectContent>
        </Select>
        <Select value={drawerFilter.wingId || 'all'} onValueChange={v => setDrawerFilter(prev => ({ ...prev, wingId: v === 'all' ? undefined : v }))}>
          <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue placeholder="选择翼" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部翼</SelectItem>
            {allWings.map((w: any) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0" onClick={() => setShowAddDrawer(true)}>
          <Plus className="h-3.5 w-3.5" /> 添加记忆
        </Button>
      </div>

      {/* Drawer Timeline */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载记忆数据失败</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> 重试</Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filteredDrawers.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">暂无匹配的记忆</p>
          <p className="text-xs text-muted-foreground mt-1">尝试调整筛选条件或添加新记忆</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[520px]">
          <div className="space-y-3">
            {filteredDrawers.map((d: any, idx: number) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.03 }}
              >
                <Card className="rounded-lg border hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{d.content}</p>
                        {d.aaaakSummary && (
                          <div className="mt-1.5 p-1.5 bg-amber-500/5 border border-amber-500/10 rounded-md">
                            <p className="text-xs font-mono text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5" /> AAAK: {d.aaaakSummary}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StarRating value={d.importance || 3} />
                        <div className="flex items-center gap-1">
                          <div className={cn('h-1.5 w-1.5 rounded-full', d.validTo ? 'bg-red-400' : 'bg-emerald-400')} />
                          <span className="text-[10px] text-muted-foreground">{d.validTo ? '已过期' : '有效'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('text-[10px] border-0', SOURCE_TYPE_COLORS[d.sourceType] || 'bg-muted text-muted-foreground')}>
                          {d.sourceType}
                        </Badge>
                        {d.tags && Array.isArray(d.tags) && d.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] gap-0.5">
                            <Tag className="h-2 w-2" /> {tag}
                          </Badge>
                        ))}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" /> {d.accessCount || 0}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingDrawer(d)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add Drawer Dialog */}
      <Dialog open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加记忆</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>目标房间</Label>
              <Select value={newRoomId} onValueChange={setNewRoomId}>
                <SelectTrigger><SelectValue placeholder="选择房间" /></SelectTrigger>
                <SelectContent>
                  {allRooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.wingName} / {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>记忆内容</Label>
              <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="输入记忆内容..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>来源类型</Label>
                <Select value={newSourceType} onValueChange={setNewSourceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">手动</SelectItem>
                    <SelectItem value="chat">对话</SelectItem>
                    <SelectItem value="decision">决策</SelectItem>
                    <SelectItem value="simulation">模拟</SelectItem>
                    <SelectItem value="evidence">证据</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>重要性 ({newImportance})</Label>
                <Input type="range" min={1} max={5} value={newImportance} onChange={e => setNewImportance(Number(e.target.value))} className="h-9" />
              </div>
            </div>
            <div>
              <Label>标签 (逗号分隔)</Label>
              <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="架构, Next.js" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateDrawer} disabled={createDrawer.isPending || !newContent.trim() || !newRoomId}>
              {createDrawer.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drawer Dialog */}
      <Dialog open={!!editingDrawer} onOpenChange={() => setEditingDrawer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑记忆</DialogTitle></DialogHeader>
          {editingDrawer && (
            <div className="space-y-3">
              <div>
                <Label>内容</Label>
                <Textarea value={editingDrawer.content || ''} onChange={e => setEditingDrawer({ ...editingDrawer, content: e.target.value })} rows={4} />
              </div>
              <div>
                <Label>重要性 ({editingDrawer.importance || 3})</Label>
                <Input type="range" min={1} max={5} value={editingDrawer.importance || 3} onChange={e => setEditingDrawer({ ...editingDrawer, importance: Number(e.target.value) })} className="h-9" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateDrawer} disabled={updateDrawer.isPending}>
              {updateDrawer.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Tab 3: Knowledge Graph =====
function KnowledgeGraphTab() {
  const { data: entitiesData, isLoading: entitiesLoading, refetch: refetchEntities } = useKGEntities()
  const { data: triplesData, isLoading: triplesLoading, refetch: refetchTriples } = useKGTriples()
  const addTriple = useAddKGTriple()

  const [showAddEntity, setShowAddEntity] = useState(false)
  const [showAddTriple, setShowAddTriple] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityType, setNewEntityType] = useState('concept')
  const [newTripleSubject, setNewTripleSubject] = useState('')
  const [newTriplePredicate, setNewTriplePredicate] = useState('')
  const [newTripleObject, setNewTripleObject] = useState('')

  const entities: any[] = entitiesData?.data?.entities || FALLBACK_ENTITIES
  const triples: any[] = triplesData?.data?.triples || FALLBACK_TRIPLES

  const handleAddEntity = async () => {
    if (!newEntityName.trim()) return
    try {
      const res = await fetch('/api/memory/kg/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEntityName, entityType: newEntityType })
      })
      const data = await res.json()
      if (data.success || data.data) {
        toast.success('实体已添加')
        setNewEntityName('')
        setShowAddEntity(false)
        refetchEntities()
      } else {
        toast.error(data.error || '添加失败')
      }
    } catch {
      toast.error('添加实体失败')
    }
  }

  const handleAddTriple = async () => {
    if (!newTripleSubject.trim() || !newTriplePredicate.trim() || !newTripleObject.trim()) return
    try {
      await addTriple.mutateAsync({
        subjectName: newTripleSubject,
        predicate: newTriplePredicate,
        objectName: newTripleObject,
        confidence: 0.8
      })
      toast.success('三元组已添加')
      setNewTripleSubject('')
      setNewTriplePredicate('')
      setNewTripleObject('')
      setShowAddTriple(false)
      refetchTriples()
      refetchEntities()
    } catch {
      toast.error('添加三元组失败')
    }
  }

  const isLoading = entitiesLoading || triplesLoading

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddEntity(true)}>
          <Plus className="h-3.5 w-3.5" /> 添加实体
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddTriple(true)}>
          <GitBranch className="h-3.5 w-3.5" /> 添加三元组
        </Button>
        <Badge variant="secondary" className="text-xs ml-auto">
          {entities.length} 实体 · {triples.length} 关系
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Entities Panel */}
          <Card className="rounded-lg border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-teal-500" /> 实体列表
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-96">
                <div className="space-y-1.5">
                  {entities.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className={cn('text-[10px] border', ENTITY_TYPE_COLORS[e.entityType] || 'bg-muted text-muted-foreground')}>
                          {e.entityType}
                        </Badge>
                        <span className="text-sm truncate">{e.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Triples Panel */}
          <Card className="rounded-lg border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-violet-500" /> 关系图谱
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {triples.map((t: any) => {
                    const subject = t.subject?.name || t.subjectName || '?'
                    const object = t.object?.name || t.objectName || '?'
                    return (
                      <div key={t.id} className="p-2.5 rounded-md border bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-700 dark:text-teal-400">
                            {subject}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-violet-700 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                            {t.predicate}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                            {object}
                          </Badge>
                        </div>
                        {t.confidence !== undefined && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-muted-foreground">置信度</span>
                            <Progress value={t.confidence * 100} className="h-1 flex-1" />
                            <span className="text-[10px] text-muted-foreground">{(t.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Entity Dialog */}
      <Dialog open={showAddEntity} onOpenChange={setShowAddEntity}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加实体</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>实体名称</Label>
              <Input value={newEntityName} onChange={e => setNewEntityName(e.target.value)} placeholder="例如：React" />
            </div>
            <div>
              <Label>实体类型</Label>
              <Select value={newEntityType} onValueChange={setNewEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">人物</SelectItem>
                  <SelectItem value="project">项目</SelectItem>
                  <SelectItem value="technology">技术</SelectItem>
                  <SelectItem value="concept">概念</SelectItem>
                  <SelectItem value="organization">组织</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddEntity} disabled={!newEntityName.trim()}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Triple Dialog */}
      <Dialog open={showAddTriple} onOpenChange={setShowAddTriple}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加三元组</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>主体 (Subject)</Label>
              <Input value={newTripleSubject} onChange={e => setNewTripleSubject(e.target.value)} placeholder="例如：飘叔" />
            </div>
            <div>
              <Label>谓词 (Predicate)</Label>
              <Select value={newTriplePredicate} onValueChange={setNewTriplePredicate}>
                <SelectTrigger><SelectValue placeholder="选择关系" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="创立">创立</SelectItem>
                  <SelectItem value="使用">使用</SelectItem>
                  <SelectItem value="包含">包含</SelectItem>
                  <SelectItem value="驱动">驱动</SelectItem>
                  <SelectItem value="偏好">偏好</SelectItem>
                  <SelectItem value="决定">决定</SelectItem>
                  <SelectItem value="拥有">拥有</SelectItem>
                  <SelectItem value="报告给">报告给</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>客体 (Object)</Label>
              <Input value={newTripleObject} onChange={e => setNewTripleObject(e.target.value)} placeholder="例如：Piaoshu" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTriple} disabled={addTriple.isPending || !newTripleSubject.trim() || !newTriplePredicate || !newTripleObject.trim()}>
              {addTriple.isPending ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Tab 4: Tunnels =====
function TunnelsTab() {
  const { data: tunnelsData, isLoading, error, refetch } = useMemoryTunnels()
  const discoverTunnels = useDiscoverTunnels()
  const [showAddTunnel, setShowAddTunnel] = useState(false)
  const [newTunnelRoomA, setNewTunnelRoomA] = useState('')
  const [newTunnelRoomB, setNewTunnelRoomB] = useState('')
  const [newTunnelTheme, setNewTunnelTheme] = useState('')
  const [newTunnelStrength, setNewTunnelStrength] = useState(1)

  const { data: palaceData } = useMemoryPalace()
  const palace = palaceData?.data
  const allWings: any[] = palace?.wings || FALLBACK_WINGS
  const allRooms = allWings.flatMap((w: any) => (w.rooms || []).map((r: any) => ({ ...r, wingName: w.name })))

  const tunnels: any[] = tunnelsData?.data?.tunnels || FALLBACK_TUNNELS

  const handleDiscover = async () => {
    try {
      await discoverTunnels.mutateAsync()
      toast.success('隧道发现完成')
      refetch()
    } catch {
      toast.error('发现失败')
    }
  }

  const handleAddTunnel = async () => {
    if (!newTunnelRoomA || !newTunnelRoomB || !newTunnelTheme.trim()) {
      toast.error('请填写完整信息')
      return
    }
    try {
      const res = await fetch('/api/memory/tunnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomAId: newTunnelRoomA,
          roomBId: newTunnelRoomB,
          sharedTheme: newTunnelTheme,
          strength: newTunnelStrength
        })
      })
      const data = await res.json()
      if (data.success || data.data) {
        toast.success('隧道已创建')
        setNewTunnelRoomA('')
        setNewTunnelRoomB('')
        setNewTunnelTheme('')
        setShowAddTunnel(false)
        refetch()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch {
      toast.error('创建隧道失败')
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white border-0" onClick={handleDiscover} disabled={discoverTunnels.isPending}>
          <Sparkles className="h-3.5 w-3.5" />
          {discoverTunnels.isPending ? '发现中...' : '自动发现'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddTunnel(true)}>
          <Plus className="h-3.5 w-3.5" /> 手动添加
        </Button>
        <Badge variant="secondary" className="text-xs ml-auto">
          {tunnels.length} 隧道
        </Badge>
      </div>

      {/* Tunnel List */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载隧道数据失败</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> 重试</Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : tunnels.length === 0 ? (
        <div className="text-center py-12">
          <Link2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">暂无隧道连接</p>
          <p className="text-xs text-muted-foreground mt-1">点击"自动发现"检测跨翼关联</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[480px]">
          <div className="space-y-3">
            {tunnels.map((t: any) => {
              const roomAName = t.roomA?.name || '...'
              const roomBName = t.roomB?.name || '...'
              const wingAName = t.roomA?.wing?.name || ''
              const wingBName = t.roomB?.wing?.name || ''
              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                  <Card className="rounded-lg border hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm">
                            <span className="font-medium text-teal-700 dark:text-teal-400">{roomAName}</span>
                            {wingAName && <span className="text-[10px] text-muted-foreground ml-1">({wingAName})</span>}
                          </div>
                          <div className="flex items-center gap-1 px-2">
                            <Link2 className="h-3.5 w-3.5 text-cyan-500" />
                            <ArrowRight className="h-3 w-3 text-cyan-500" />
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">{roomBName}</span>
                            {wingBName && <span className="text-[10px] text-muted-foreground ml-1">({wingBName})</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-700 dark:text-cyan-400 shrink-0">
                          {t.sharedTheme}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">关联强度</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={cn('h-2 w-4 rounded-sm', i < (t.strength || 1) ? 'bg-cyan-500' : 'bg-muted')} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{t.strength || 1}/5</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Add Tunnel Dialog */}
      <Dialog open={showAddTunnel} onOpenChange={setShowAddTunnel}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加隧道</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>房间 A</Label>
              <Select value={newTunnelRoomA} onValueChange={setNewTunnelRoomA}>
                <SelectTrigger><SelectValue placeholder="选择房间" /></SelectTrigger>
                <SelectContent>
                  {allRooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.wingName} / {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>房间 B</Label>
              <Select value={newTunnelRoomB} onValueChange={setNewTunnelRoomB}>
                <SelectTrigger><SelectValue placeholder="选择房间" /></SelectTrigger>
                <SelectContent>
                  {allRooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.wingName} / {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>共享主题</Label>
              <Input value={newTunnelTheme} onChange={e => setNewTunnelTheme(e.target.value)} placeholder="例如：安全性" />
            </div>
            <div>
              <Label>关联强度 ({newTunnelStrength})</Label>
              <Input type="range" min={1} max={5} value={newTunnelStrength} onChange={e => setNewTunnelStrength(Number(e.target.value))} className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTunnel} disabled={!newTunnelRoomA || !newTunnelRoomB || !newTunnelTheme.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Tab 5: Wake Preview =====
function WakePreviewTab() {
  const { data: wakeData, isLoading, error, refetch } = useMemoryWake()
  const [waking, setWaking] = useState(false)

  const wake = wakeData?.data
  const layers = wake?.layers || [
    { layer: 0, name: 'L0 身份', tokens: 50, content: '你是飘叔(Piaoshu)，AI分身操作系统的创始人。你的核心信念：AI应该是共生体而非工具，结构优于搜索，记忆决定智能。' },
    { layer: 1, name: 'L1 核心记忆', tokens: 800, content: '选择了Next.js作为全栈框架，因为SSR/SSG灵活切换，TypeScript原生支持。AFC Token经济模型：免费版5次周期/天，专业版无限周期。微信生态是Piaoshu触达早期用户的关键渠道。认证系统采用Prisma+SQLite方案，向量搜索使用64维语义哈希。红蓝对抗需要SOUL.md人格注入来保证输出一致性。' },
  ]
  const totalTokens = layers.reduce((sum: number, l: any) => sum + (l.tokens || 0), 0)

  const handleWake = async () => {
    setWaking(true)
    try {
      const res = await fetch('/api/memory/wake', { method: 'GET' })
      const data = await res.json()
      if (data.success || data.data) {
        toast.success('分身唤醒成功！记忆已加载')
        refetch()
      } else {
        toast.error(data.error || '唤醒失败')
      }
    } catch {
      toast.error('唤醒请求失败')
    } finally {
      setWaking(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Wake Button & Token Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/20"
            onClick={handleWake}
            disabled={waking}
          >
            <Zap className="h-5 w-5" />
            {waking ? '唤醒中...' : '唤醒分身'}
          </Button>
          <div className="text-sm text-muted-foreground">
            预计加载 <span className="font-bold text-amber-600">{totalTokens}</span> tokens
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Layers className="h-3 w-3 mr-1" /> {layers.length} 层
        </Badge>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载唤醒数据失败</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> 重试</Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {layers.map((layer: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.1 }}
            >
              <Card className={cn(
                'rounded-lg border',
                layer.layer === 0
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-teal-500/30 bg-teal-500/5'
              )}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge className={cn(
                        'text-xs border-0',
                        layer.layer === 0
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-teal-500/20 text-teal-700 dark:text-teal-400'
                      )}>
                        L{layer.layer}
                      </Badge>
                      <span>{layer.name || (layer.layer === 0 ? '身份' : '核心记忆')}</span>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono">~{layer.tokens} tokens</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-6">
                    {layer.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Token Summary */}
          <Card className="rounded-lg border border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">唤醒上下文概览</span>
                </div>
                <span className="text-sm font-bold text-amber-600">{totalTokens} tokens</span>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {layers.map((l: any) => (
                  <div key={l.layer} className="text-center">
                    <p className="text-xs text-muted-foreground">L{l.layer}</p>
                    <p className="text-sm font-bold">{l.tokens} tokens</p>
                    <div className="mt-1">
                      <Progress value={(l.tokens / totalTokens) * 100} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ===== Tab 6: SONA Evolution Loop =====
const SONA_STEPS = [
  { name: 'RETRIEVE', label: '检索', icon: Database, color: 'cyan', desc: '从宫殿中检索相关记忆' },
  { name: 'JUDGE', label: '评估', icon: Eye, color: 'amber', desc: 'LLM评估记忆质量与相关性' },
  { name: 'DISTILL', label: '蒸馏', icon: Flame, color: 'violet', desc: '压缩为AAAk高阶洞察' },
  { name: 'CONSOLIDATE', label: '整合', icon: Scissors, color: 'emerald', desc: '合并强化或修剪记忆' },
] as const

const SONA_STEP_COLORS: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  RETRIEVE: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700 dark:text-cyan-400', glow: 'shadow-cyan-500/20', badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  JUDGE: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', glow: 'shadow-amber-500/20', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  DISTILL: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-700 dark:text-violet-400', glow: 'shadow-violet-500/20', badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  CONSOLIDATE: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', glow: 'shadow-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
}

const MODE_ESTIMATES: Record<string, { time: string; memory: string }> = {
  '轻量': { time: '~6s', memory: '6-8条' },
  '标准': { time: '~12s', memory: '10-16条' },
  '深度': { time: '~20s', memory: '20-30条' },
}

const FALLBACK_SONA_HISTORY = [
  { id: 'h1', cycleId: 'SONA-2024-023', timestamp: new Date(Date.now() - 3600000).toISOString(), mode: '标准', steps: [{ name: 'RETRIEVE', status: 'completed', duration: 2.3 }, { name: 'JUDGE', status: 'completed', duration: 4.1 }, { name: 'DISTILL', status: 'completed', duration: 3.7 }, { name: 'CONSOLIDATE', status: 'completed', duration: 1.8 }], memoriesProcessed: 12, insightsGenerated: 3, pruned: 2, duration: 11.9, qualityScore: 0.85 },
  { id: 'h2', cycleId: 'SONA-2024-022', timestamp: new Date(Date.now() - 7200000).toISOString(), mode: '深度', steps: [{ name: 'RETRIEVE', status: 'completed', duration: 3.8 }, { name: 'JUDGE', status: 'completed', duration: 6.2 }, { name: 'DISTILL', status: 'completed', duration: 5.1 }, { name: 'CONSOLIDATE', status: 'completed', duration: 2.9 }], memoriesProcessed: 24, insightsGenerated: 6, pruned: 5, duration: 18.0, qualityScore: 0.83 },
  { id: 'h3', cycleId: 'SONA-2024-021', timestamp: new Date(Date.now() - 14400000).toISOString(), mode: '轻量', steps: [{ name: 'RETRIEVE', status: 'completed', duration: 1.2 }, { name: 'JUDGE', status: 'completed', duration: 2.4 }, { name: 'DISTILL', status: 'completed', duration: 1.8 }, { name: 'CONSOLIDATE', status: 'completed', duration: 0.9 }], memoriesProcessed: 6, insightsGenerated: 1, pruned: 1, duration: 6.3, qualityScore: 0.78 },
  { id: 'h4', cycleId: 'SONA-2024-020', timestamp: new Date(Date.now() - 28800000).toISOString(), mode: '标准', steps: [{ name: 'RETRIEVE', status: 'completed', duration: 2.1 }, { name: 'JUDGE', status: 'completed', duration: 3.9 }, { name: 'DISTILL', status: 'completed', duration: 3.2 }, { name: 'CONSOLIDATE', status: 'completed', duration: 1.5 }], memoriesProcessed: 14, insightsGenerated: 4, pruned: 3, duration: 10.7, qualityScore: 0.81 },
  { id: 'h5', cycleId: 'SONA-2024-019', timestamp: new Date(Date.now() - 43200000).toISOString(), mode: '深度', steps: [{ name: 'RETRIEVE', status: 'completed', duration: 4.1 }, { name: 'JUDGE', status: 'completed', duration: 5.8 }, { name: 'DISTILL', status: 'completed', duration: 4.6 }, { name: 'CONSOLIDATE', status: 'completed', duration: 2.3 }], memoriesProcessed: 28, insightsGenerated: 7, pruned: 4, duration: 16.8, qualityScore: 0.79 },
]

const FALLBACK_SONA_METRICS = {
  totalCycles: 23,
  memoriesProcessed: 147,
  insightsGenerated: 34,
  pruningRate: 0.18,
  avgQualityScore: 0.82,
  qualityTrend: [0.65, 0.68, 0.71, 0.73, 0.75, 0.78, 0.76, 0.79, 0.80, 0.82],
  lastCycleAt: new Date(Date.now() - 3600000).toISOString(),
}

function SonaEvolutionTab() {
  const { data: sonaData, isLoading, refetch } = useSonaStatus()
  const triggerCycle = useTriggerSonaCycle()
  const [mode, setMode] = useState('标准')
  const [targetWing, setTargetWing] = useState('all')
  const [autoCycle, setAutoCycle] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const metrics = sonaData?.data?.metrics || FALLBACK_SONA_METRICS
  const history = sonaData?.data?.history || FALLBACK_SONA_HISTORY
  const currentCycle = sonaData?.data?.currentCycle || null

  // Auto-refresh when cycle is running
  useEffect(() => {
    if (!currentCycle) return
    const interval = setInterval(() => refetch(), 2000)
    return () => clearInterval(interval)
  }, [currentCycle, refetch])

  // Scroll log to bottom
  useEffect(() => {
    if (currentCycle?.log?.length) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentCycle?.log?.length])

  const handleStartCycle = async () => {
    try {
      await triggerCycle.mutateAsync({ mode, targetWing, autoCycle })
      toast.success('进化周期已启动')
      setTimeout(() => refetch(), 1000)
    } catch (err: any) {
      toast.error(err?.message || '启动失败')
    }
  }

  const getStepStatus = (stepName: string): 'idle' | 'running' | 'completed' => {
    if (!currentCycle) return 'idle'
    const stepIndex = SONA_STEPS.findIndex(s => s.name === stepName)
    const currentStepIndex = SONA_STEPS.findIndex(s => s.name === currentCycle.phase)
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'running'
    return 'idle'
  }

  const estimate = MODE_ESTIMATES[mode] || MODE_ESTIMATES['标准']

  return (
    <div className="space-y-5">
      {/* Section 1: Evolution Pipeline */}
      <Card className="rounded-lg border overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-500" /> 进化管线
            <Badge variant="outline" className="text-[10px] font-mono">4-Phase Cycle</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2">
            {SONA_STEPS.map((step, idx) => {
              const status = getStepStatus(step.name)
              const colors = SONA_STEP_COLORS[step.name]
              const StepIcon = step.icon
              return (
                <div key={step.name} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <motion.div
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-lg border transition-all min-w-[70px] sm:min-w-[90px]',
                      status === 'running' && `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`,
                      status === 'completed' && `${colors.bg} ${colors.border}`,
                      status === 'idle' && 'bg-muted/30 border-muted/50'
                    )}
                    animate={status === 'running' ? { scale: [1, 1.03, 1] } : {}}
                    transition={status === 'running' ? { repeat: Infinity, duration: 1.5 } : {}}
                  >
                    <div className={cn(
                      'p-1.5 rounded-full',
                      status === 'running' && colors.bg,
                      status === 'completed' && colors.bg,
                      status === 'idle' && 'bg-muted/50'
                    )}>
                      <StepIcon className={cn(
                        'h-4 w-4',
                        status === 'running' && colors.text,
                        status === 'completed' && colors.text,
                        status === 'idle' && 'text-muted-foreground'
                      )} />
                    </div>
                    <span className={cn(
                      'text-[10px] sm:text-xs font-bold',
                      status === 'running' && colors.text,
                      status === 'completed' && colors.text,
                      status === 'idle' && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </span>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                      {step.desc}
                    </span>
                    {status === 'running' && (
                      <motion.div
                        className={cn('h-1 rounded-full', colors.bg.replace('/10', '/40'))}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ maxWidth: 60 }}
                      />
                    )}
                    {status === 'completed' && (
                      <Badge className={cn('text-[8px] border-0', colors.badge)}>✓</Badge>
                    )}
                    {status === 'idle' && (
                      <div className="h-1 w-6 rounded-full bg-muted/50" />
                    )}
                  </motion.div>
                  {idx < SONA_STEPS.length - 1 && (
                    <ArrowRight className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      status === 'completed' ? 'text-emerald-400' : 'text-muted-foreground/40'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Cycle Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-lg border lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4 text-teal-500" /> 周期控制
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">目标翼</Label>
                <Select value={targetWing} onValueChange={setTargetWing}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全宫殿</SelectItem>
                    <SelectItem value="个人身份">个人身份</SelectItem>
                    <SelectItem value="战略决策">战略决策</SelectItem>
                    <SelectItem value="工程架构">工程架构</SelectItem>
                    <SelectItem value="增长运营">增长运营</SelectItem>
                    <SelectItem value="人脉关系">人脉关系</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">模式</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="轻量">轻量模式</SelectItem>
                    <SelectItem value="标准">标准模式</SelectItem>
                    <SelectItem value="深度">深度模式</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">自动循环</Label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setAutoCycle(!autoCycle)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors',
                      autoCycle ? 'bg-teal-500' : 'bg-muted'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      autoCycle ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                  <span className="text-xs text-muted-foreground">{autoCycle ? '开启' : '关闭'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleStartCycle}
                disabled={!!currentCycle || triggerCycle.isPending}
                className="gap-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-600 hover:from-teal-600 hover:via-cyan-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-teal-500/20"
              >
                {currentCycle ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                    运行中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    启动进化周期
                  </>
                )}
              </Button>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> 预计 {estimate.time}</span>
                <span className="flex items-center gap-1"><Database className="h-3 w-3" /> 影响 {estimate.memory}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Panel */}
        <Card className="rounded-lg border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-500" /> 进化指标
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: '总周期', value: metrics.totalCycles, icon: BarChart3, color: 'text-teal-600' },
                  { label: '已处理', value: metrics.memoriesProcessed, icon: Database, color: 'text-cyan-600' },
                  { label: '洞察生成', value: metrics.insightsGenerated, icon: Flame, color: 'text-violet-600' },
                  { label: '修剪率', value: `${(metrics.pruningRate * 100).toFixed(0)}%`, icon: Scissors, color: 'text-amber-600' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <m.icon className={cn('h-3.5 w-3.5', m.color)} />
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold">{m.value}</span>
                  </div>
                ))}
                <Separator className="my-1" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">平均质量</span>
                    <span className="text-sm font-bold text-emerald-600">{(metrics.avgQualityScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {metrics.qualityTrend.slice(-10).map((v: number, i: number) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${Math.max(4, v * 28)}px`,
                          background: `linear-gradient(to top, rgb(20 184 166 / 0.3), rgb(16 185 129 / ${0.3 + v * 0.7}))`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                {metrics.lastCycleAt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    上次周期: {new Date(metrics.lastCycleAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Live Monitor + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Monitor */}
        <Card className="rounded-lg border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-teal-500" /> 实时监控
              {currentCycle && (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] border-0 animate-pulse">
                  LIVE
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {currentCycle ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={cn('text-[10px] border-0', SONA_STEP_COLORS[currentCycle.phase]?.badge || 'bg-muted')}>
                    {currentCycle.phase}
                  </Badge>
                  <span className="text-muted-foreground">{currentCycle.id}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{currentCycle.mode}</Badge>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="space-y-1.5">
                    {currentCycle.log.map((entry: { timestamp: string; phase: string; message: string }, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'p-2 rounded-md text-xs border-l-2',
                          SONA_STEP_COLORS[entry.phase]?.border || 'border-l-muted',
                          SONA_STEP_COLORS[entry.phase]?.bg || 'bg-muted/20'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <Badge className={cn('text-[8px] border-0', SONA_STEP_COLORS[entry.phase]?.badge || 'bg-muted')}>
                            {entry.phase}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-muted-foreground">{entry.message}</p>
                      </motion.div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <CircleDot className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">无运行中的周期</p>
                <p className="text-xs text-muted-foreground mt-1">点击"启动进化周期"开始</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Timeline */}
        <Card className="rounded-lg border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-500" /> 进化历史
              <Badge variant="secondary" className="text-[10px]">{history.length} 周期</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {history.map((h: any, idx: number) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.04 }}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{h.cycleId}</span>
                          <Badge variant="outline" className="text-[10px]">{h.mode}</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(h.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {h.steps.map((s: any, si: number) => (
                          <div key={si} className="flex items-center gap-1">
                            <Badge className={cn('text-[8px] border-0', SONA_STEP_COLORS[s.name]?.badge || 'bg-muted')}>
                              {s.name.slice(0, 1)}{s.duration.toFixed(1)}s
                            </Badge>
                            {si < h.steps.length - 1 && <ArrowRight className="h-2 w-2 text-muted-foreground/30" />}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>处理 {h.memoriesProcessed}条</span>
                        <span>洞察 {h.insightsGenerated}条</span>
                        <span>修剪 {h.pruned}条</span>
                        <span className="ml-auto font-bold text-emerald-600">{(h.qualityScore * 100).toFixed(0)}%</span>
                        <span className="text-muted-foreground">{h.duration.toFixed(1)}s</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===== Main Component =====
export function MemoryPalace() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-teal-500" /> 记忆宫殿
            <Badge variant="outline" className="text-xs font-mono">Memory Palace</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">层次化记忆系统 · 结构优于搜索 · MemPalace-inspired</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="map" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-400">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">宫殿地图</span>
            <span className="sm:hidden">地图</span>
          </TabsTrigger>
          <TabsTrigger value="drawers" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">记忆抽屉</span>
            <span className="sm:hidden">抽屉</span>
          </TabsTrigger>
          <TabsTrigger value="kg" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-400">
            <Network className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">知识图谱</span>
            <span className="sm:hidden">图谱</span>
          </TabsTrigger>
          <TabsTrigger value="tunnels" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-700 dark:data-[state=active]:text-cyan-400">
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">隧道关联</span>
            <span className="sm:hidden">隧道</span>
          </TabsTrigger>
          <TabsTrigger value="wake" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400">
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">唤醒预览</span>
            <span className="sm:hidden">唤醒</span>
          </TabsTrigger>
          <TabsTrigger value="sona" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SONA 进化回路</span>
            <span className="sm:hidden">SONA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <PalaceMapTab />
        </TabsContent>

        <TabsContent value="drawers" className="mt-4">
          <MemoryDrawersTab />
        </TabsContent>

        <TabsContent value="kg" className="mt-4">
          <KnowledgeGraphTab />
        </TabsContent>

        <TabsContent value="tunnels" className="mt-4">
          <TunnelsTab />
        </TabsContent>

        <TabsContent value="wake" className="mt-4">
          <WakePreviewTab />
        </TabsContent>

        <TabsContent value="sona" className="mt-4">
          <SonaEvolutionTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
