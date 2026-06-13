'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Target, TrendingUp, TrendingDown, Bot, Globe2,
  BarChart3, Zap, Link2, Plus, ArrowUpRight, ArrowDownRight,
  Eye, Code2, Key, ChevronRight, Sparkles, Database, CheckCircle2, XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  useGEOKeywords, useCreateGEOKeyword, useUpdateGEOKeyword, useDeleteGEOKeyword,
  useGEORankings, useCreateGEORanking, useSeedGEO,
  useMediaVerticals,
  useAgentAPIEndpoints, useSeedAgentAPI, useCreateAgentAPIEndpoint
} from '@/lib/api-hooks'

// === Type definitions ===
interface Keyword {
  id: string; keyword: string; keywordEn?: string; category: string
  intent: string; searchVolume: number; difficulty: number
  currentRank?: number; targetRank?: number; status: string
  verticalId?: string
}

interface Ranking {
  id: string; keywordId: string; rank: number; aiCitation: boolean
  citationUrl?: string; source: string; capturedAt: string
}

interface Endpoint {
  id: string; name: string; path: string; method: string
  description?: string; authRequired: boolean; rateLimit: number
  callCount: number; lastCalledAt?: string; status: string
}

interface Vertical { id: string; name: string; slug: string }

// === Label maps ===
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  core: { label: '核心', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  long_tail: { label: '长尾', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  competitor: { label: '竞品', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  emerging: { label: '新兴', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  tracked: { label: '追踪中', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  optimizing: { label: '优化中', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  ranked: { label: '已排名', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  lost: { label: '丢失', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
}

const SOURCE_MAP: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: 'bg-blue-500/10 text-blue-600' },
  perplexity: { label: 'Perplexity', color: 'bg-teal-500/10 text-teal-600' },
  chatgpt: { label: 'ChatGPT', color: 'bg-emerald-500/10 text-emerald-600' },
  bing: { label: 'Bing', color: 'bg-cyan-500/10 text-cyan-600' },
}

const INTENT_MAP: Record<string, string> = {
  informational: '信息型', transactional: '交易型', navigational: '导航型',
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function GEOCenterView() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [addKwOpen, setAddKwOpen] = useState(false)
  const [addEndpointOpen, setAddEndpointOpen] = useState(false)
  const [addRankOpen, setAddRankOpen] = useState(false)

  // Form state
  const [kwForm, setKwForm] = useState({ keyword: '', keywordEn: '', category: 'core', intent: 'informational', searchVolume: 0, difficulty: 0, targetRank: 10 })
  const [rankForm, setRankForm] = useState({ rank: 1, source: 'google', aiCitation: false, citationUrl: '' })
  const [epForm, setEpForm] = useState({ name: '', path: '', method: 'GET', description: '', authRequired: true, rateLimit: 100 })

  // Data
  const { data: kwData, isLoading: kwLoading } = useGEOKeywords(
    filterCategory !== 'all' || filterStatus !== 'all'
      ? { category: filterCategory !== 'all' ? filterCategory : undefined, status: filterStatus !== 'all' ? filterStatus : undefined }
      : undefined
  )
  const { data: rankData } = useGEORankings(selectedKeywordId ? { keywordId: selectedKeywordId } : undefined)
  const { data: vertData } = useMediaVerticals()
  const { data: epData, isLoading: epLoading } = useAgentAPIEndpoints()

  const seedGEO = useSeedGEO()
  const seedAPI = useSeedAgentAPI()
  const createKw = useCreateGEOKeyword()
  const createRank = useCreateGEORanking()
  const createEp = useCreateAgentAPIEndpoint()
  const deleteKw = useDeleteGEOKeyword()

  const keywords = (kwData?.keywords || []) as Keyword[]
  const rankings = (rankData?.rankings || []) as Ranking[]
  const verticals = (vertData?.verticals || []) as Vertical[]
  const endpoints = (epData?.endpoints || []) as Endpoint[]

  // Auto-seed
  const hasSeededRef = useRef(false)
  useEffect(() => {
    if (hasSeededRef.current) return
    if (!kwLoading && keywords.length === 0) {
      hasSeededRef.current = true
      seedGEO.mutate(undefined, { onSuccess: () => toast.success('GEO示例数据已加载') })
    }
    if (!epLoading && endpoints.length === 0) {
      hasSeededRef.current = true
      seedAPI.mutate(undefined, { onSuccess: () => toast.success('API端点示例已加载') })
    }
  }, [kwLoading, keywords.length, epLoading, endpoints.length])

  // Computed stats
  const totalKw = keywords.length
  const rankedCount = keywords.filter(k => k.status === 'ranked').length
  const aiCitedCount = keywords.filter(k => k.currentRank && k.currentRank <= 10).length
  const avgRank = keywords.filter(k => k.currentRank).length > 0
    ? Math.round(keywords.filter(k => k.currentRank).reduce((s, k) => s + (k.currentRank || 0), 0) / keywords.filter(k => k.currentRank).length)
    : 0

  const selectedKeyword = keywords.find(k => k.id === selectedKeywordId)

  const handleCreateKw = () => {
    createKw.mutate(kwForm, {
      onSuccess: () => { toast.success('关键词已添加'); setAddKwOpen(false); setKwForm({ keyword: '', keywordEn: '', category: 'core', intent: 'informational', searchVolume: 0, difficulty: 0, targetRank: 10 }) },
      onError: () => toast.error('添加失败'),
    })
  }

  const handleCreateRank = () => {
    if (!selectedKeywordId) return
    createRank.mutate({ keywordId: selectedKeywordId, ...rankForm }, {
      onSuccess: () => { toast.success('排名已记录'); setAddRankOpen(false); setRankForm({ rank: 1, source: 'google', aiCitation: false, citationUrl: '' }) },
      onError: () => toast.error('记录失败'),
    })
  }

  const handleCreateEp = () => {
    createEp.mutate(epForm, {
      onSuccess: () => { toast.success('API端点已创建'); setAddEndpointOpen(false); setEpForm({ name: '', path: '', method: 'GET', description: '', authRequired: true, rateLimit: 100 }) },
      onError: () => toast.error('创建失败'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">GEO优化中心</h2>
            <p className="text-sm text-muted-foreground mt-1">Generative Engine Optimization · 让AI优先引用你</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={addKwOpen} onOpenChange={setAddKwOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-3.5 w-3.5" /> 添加关键词
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>添加GEO关键词</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input placeholder="关键词 (中文)" value={kwForm.keyword} onChange={e => setKwForm(f => ({ ...f, keyword: e.target.value }))} />
                  <Input placeholder="Keyword (English)" value={kwForm.keywordEn} onChange={e => setKwForm(f => ({ ...f, keywordEn: e.target.value }))} />
                  <Select value={kwForm.category} onValueChange={v => setKwForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">核心</SelectItem>
                      <SelectItem value="long_tail">长尾</SelectItem>
                      <SelectItem value="competitor">竞品</SelectItem>
                      <SelectItem value="emerging">新兴</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={kwForm.intent} onValueChange={v => setKwForm(f => ({ ...f, intent: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informational">信息型</SelectItem>
                      <SelectItem value="transactional">交易型</SelectItem>
                      <SelectItem value="navigational">导航型</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-xs text-muted-foreground">搜索量</label><Input type="number" value={kwForm.searchVolume} onChange={e => setKwForm(f => ({ ...f, searchVolume: +e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground">难度</label><Input type="number" min={0} max={100} value={kwForm.difficulty} onChange={e => setKwForm(f => ({ ...f, difficulty: +e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground">目标排名</label><Input type="number" value={kwForm.targetRank} onChange={e => setKwForm(f => ({ ...f, targetRank: +e.target.value }))} /></div>
                  </div>
                  <Button onClick={handleCreateKw} disabled={!kwForm.keyword || createKw.isPending} className="w-full bg-teal-600 hover:bg-teal-700">添加</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[
            { label: '追踪关键词', value: totalKw, icon: Search, color: 'text-teal-600', bg: 'bg-teal-500/10' },
            { label: '已排名(Top10)', value: rankedCount, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'AI引用次数', value: aiCitedCount, icon: Bot, color: 'text-violet-600', bg: 'bg-violet-500/10' },
            { label: '平均排名', value: avgRank || '-', icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('h-4 w-4', s.color)} /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* AI引用监测面板 */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-teal-600" /> AI引用监测面板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'AI引用率', value: totalKw > 0 ? `${Math.round(aiCitedCount / totalKw * 100)}%` : '0%', trend: '+12%', up: true, icon: Sparkles },
                { label: 'Google排名率', value: totalKw > 0 ? `${Math.round(rankedCount / totalKw * 100)}%` : '0%', trend: '+8%', up: true, icon: Globe2 },
                { label: 'Perplexity引用', value: rankings.filter(r => r.source === 'perplexity').length, trend: '+3', up: true, icon: Search },
                { label: 'ChatGPT引用', value: rankings.filter(r => r.source === 'chatgpt').length, trend: '+5', up: true, icon: Bot },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                  <m.icon className="h-5 w-5 text-teal-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold">{m.value}</span>
                      <span className={cn('text-[10px] flex items-center', m.up ? 'text-emerald-600' : 'text-red-600')}>
                        {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{m.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Keyword Tracking Table */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-teal-600" /> 关键词追踪</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder="分类" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="core">核心</SelectItem>
                    <SelectItem value="long_tail">长尾</SelectItem>
                    <SelectItem value="competitor">竞品</SelectItem>
                    <SelectItem value="emerging">新兴</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder="状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="tracked">追踪中</SelectItem>
                    <SelectItem value="optimizing">优化中</SelectItem>
                    <SelectItem value="ranked">已排名</SelectItem>
                    <SelectItem value="lost">丢失</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">关键词</TableHead>
                    <TableHead className="text-xs">分类</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">意图</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">搜索量</TableHead>
                    <TableHead className="text-xs">难度</TableHead>
                    <TableHead className="text-xs">当前排名</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">状态</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无关键词数据</TableCell></TableRow>
                  ) : keywords.map(kw => (
                    <TableRow
                      key={kw.id}
                      className={cn('cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-950/20', selectedKeywordId === kw.id && 'bg-teal-50 dark:bg-teal-950/30')}
                      onClick={() => setSelectedKeywordId(selectedKeywordId === kw.id ? null : kw.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{kw.keyword}</p>
                          {kw.keywordEn && <p className="text-[10px] text-muted-foreground font-mono">{kw.keywordEn}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={cn('text-[10px]', CATEGORY_MAP[kw.category]?.color)}>{CATEGORY_MAP[kw.category]?.label || kw.category}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{INTENT_MAP[kw.intent] || kw.intent}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{kw.searchVolume.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Progress value={kw.difficulty} className="h-1.5 w-12" />
                          <span className="text-[10px] text-muted-foreground">{kw.difficulty}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-sm font-semibold', kw.currentRank && kw.currentRank <= 10 ? 'text-emerald-600' : kw.currentRank ? 'text-amber-600' : 'text-muted-foreground')}>
                          {kw.currentRank ? `#${kw.currentRank}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge className={cn('text-[10px]', STATUS_MAP[kw.status]?.color)}>{STATUS_MAP[kw.status]?.label || kw.status}</Badge></TableCell>
                      <TableCell><ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', selectedKeywordId === kw.id && 'rotate-90')} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ranking History for selected keyword */}
      {selectedKeyword && (
        <motion.div {...fadeUp}>
          <Card className="border-0 shadow-sm border-l-4 border-l-teal-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  <span className="text-teal-600">"{selectedKeyword.keyword}"</span> 排名历史
                </CardTitle>
                <Dialog open={addRankOpen} onOpenChange={setAddRankOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><Plus className="h-3 w-3" /> 记录排名</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>记录排名</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div><label className="text-xs text-muted-foreground">排名位置</label><Input type="number" value={rankForm.rank} onChange={e => setRankForm(f => ({ ...f, rank: +e.target.value }))} /></div>
                      <Select value={rankForm.source} onValueChange={v => setRankForm(f => ({ ...f, source: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="perplexity">Perplexity</SelectItem>
                          <SelectItem value="chatgpt">ChatGPT</SelectItem>
                          <SelectItem value="bing">Bing</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={rankForm.aiCitation} onChange={e => setRankForm(f => ({ ...f, aiCitation: e.target.checked }))} className="rounded" />
                        <label className="text-sm">AI引用</label>
                      </div>
                      <Input placeholder="引用URL (可选)" value={rankForm.citationUrl} onChange={e => setRankForm(f => ({ ...f, citationUrl: e.target.value }))} />
                      <Button onClick={handleCreateRank} disabled={createRank.isPending} className="w-full bg-teal-600 hover:bg-teal-700">记录</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {rankings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">暂无排名记录</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rankings.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()).map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
                      <Badge className={cn('text-[10px]', SOURCE_MAP[r.source]?.color)}>{SOURCE_MAP[r.source]?.label || r.source}</Badge>
                      <span className="font-semibold">#{r.rank}</span>
                      {r.aiCitation && <Badge className="text-[10px] bg-teal-500/10 text-teal-600"><Bot className="h-2.5 w-2.5 mr-0.5" />AI引用</Badge>}
                      {r.citationUrl && <a href={r.citationUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 hover:underline truncate max-w-[200px]">{r.citationUrl}</a>}
                      <span className="ml-auto text-[10px] text-muted-foreground">{new Date(r.capturedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Agent API Endpoints */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4 text-teal-600" /> Agent API 接口管理</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">让AI智能体可直接调用你的内容</p>
              </div>
              <Dialog open={addEndpointOpen} onOpenChange={setAddEndpointOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 text-xs"><Plus className="h-3 w-3" /> 添加端点</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>添加API端点</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <Input placeholder="端点名称" value={epForm.name} onChange={e => setEpForm(f => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="路径 (e.g. /api/agent/citations)" value={epForm.path} onChange={e => setEpForm(f => ({ ...f, path: e.target.value }))} />
                    <Select value={epForm.method} onValueChange={v => setEpForm(f => ({ ...f, method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="描述" value={epForm.description} onChange={e => setEpForm(f => ({ ...f, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={epForm.authRequired} onChange={e => setEpForm(f => ({ ...f, authRequired: e.target.checked }))} className="rounded" />
                        <label className="text-sm">需要认证</label>
                      </div>
                      <div><label className="text-xs text-muted-foreground">速率限制</label><Input type="number" value={epForm.rateLimit} onChange={e => setEpForm(f => ({ ...f, rateLimit: +e.target.value }))} /></div>
                    </div>
                    <Button onClick={handleCreateEp} disabled={!epForm.name || !epForm.path || createEp.isPending} className="w-full bg-teal-600 hover:bg-teal-700">创建</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {endpoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无API端点</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {endpoints.map(ep => (
                  <div key={ep.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn('text-[10px]', ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-600' : ep.method === 'POST' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600')}>
                        {ep.method}
                      </Badge>
                      <span className="font-medium text-sm">{ep.name}</span>
                      <Badge variant="outline" className={cn('text-[9px] ml-auto', ep.status === 'active' ? 'border-emerald-500 text-emerald-600' : 'border-muted text-muted-foreground')}>
                        {ep.status === 'active' ? '活跃' : ep.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mb-2">{ep.path}</p>
                    {ep.description && <p className="text-xs text-muted-foreground mb-2">{ep.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {ep.callCount}次调用</span>
                      <span className="flex items-center gap-0.5"><Key className="h-3 w-3" /> {ep.authRequired ? '需认证' : '公开'}</span>
                      <span className="flex items-center gap-0.5"><Zap className="h-3 w-3" /> {ep.rateLimit}/min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* GEO vs SEO comparison insight */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-teal-50/30 to-emerald-50/30 dark:from-teal-950/10 dark:to-emerald-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-2">GEO vs 传统SEO的核心转变</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-background/60">
                    <p className="font-semibold text-teal-600 mb-1">优化对象</p>
                    <p className="text-muted-foreground">人类用户 → AI智能体</p>
                  </div>
                  <div className="p-2 rounded bg-background/60">
                    <p className="font-semibold text-teal-600 mb-1">信任机制</p>
                    <p className="text-muted-foreground">外链权重 → 区块链确权</p>
                  </div>
                  <div className="p-2 rounded bg-background/60">
                    <p className="font-semibold text-teal-600 mb-1">内容形式</p>
                    <p className="text-muted-foreground">HTML页面 → 结构化数据+API</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">"在Web4.0模型中，你要优化的不再是'网页'，而是'智能体的行为路径'"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
