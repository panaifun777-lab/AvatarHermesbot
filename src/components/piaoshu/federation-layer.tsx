'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Fingerprint, Award, Copy, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Plus, Search, Filter, RefreshCw,
  ArrowRight, CheckCircle, Clock, AlertTriangle, Network,
  MessageSquare, Zap, Eye, Key, Users, Link2, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  useFederationDIDs, useCreateDID, useFederationVCs, useIssueVC,
  useTrustConnections, useVerifyVC, useCrossAvatarMessages, useSeedFederation
} from '@/lib/api-hooks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ===== Types =====
interface DIDRecord {
  id: string; did: string; avatarName: string; avatarType: string
  trustLevel: string; publicKey?: string; status: string
  didDocument?: string; createdAt: string; updatedAt: string
  credentials?: unknown[]; sentConnections?: unknown[]; receivedConnections?: unknown[]
}

interface VCRecord {
  id: string; vcType: string; issuerDid: string; subjectDid: string
  credentialHash: string; claims: string; status: string
  expiresAt?: string; verifiedAt?: string; createdAt: string
  issuer?: DIDRecord
}

interface ConnectionRecord {
  id: string; senderDid: string; receiverDid: string
  strength: number; connectionType: string; createdAt: string
  sender?: DIDRecord; receiver?: DIDRecord
}

interface MessageRecord {
  id: string; senderDid: string; receiverDid: string
  messageType: string; content: string; status: string; createdAt: string
}

// ===== Fallback Demo Data =====
const FALLBACK_DIDS: DIDRecord[] = [
  { id: '1', did: 'did:piaoshu:piaoshu-ceo-abc123', avatarName: '飘叔CEO', avatarType: 'clone', trustLevel: 'platinum', publicKey: 'pk_ceo_abc123', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), credentials: [], sentConnections: [], receivedConnections: [] },
  { id: '2', did: 'did:piaoshu:tech-cto-def456', avatarName: '技术总监CTO', avatarType: 'clone', trustLevel: 'gold', publicKey: 'pk_cto_def456', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), credentials: [], sentConnections: [], receivedConnections: [] },
  { id: '3', did: 'did:piaoshu:growth-lead-ghi789', avatarName: '增长负责人', avatarType: 'clone', trustLevel: 'silver', publicKey: 'pk_growth_ghi789', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), credentials: [], sentConnections: [], receivedConnections: [] },
  { id: '4', did: 'did:piaoshu:engineer-jkl012', avatarName: '工程师Agent', avatarType: 'clone', trustLevel: 'bronze', publicKey: 'pk_eng_jkl012', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), credentials: [], sentConnections: [], receivedConnections: [] },
]

const FALLBACK_VCS: VCRecord[] = [
  { id: 'v1', vcType: 'SkillProof', issuerDid: 'did:piaoshu:piaoshu-ceo-abc123', subjectDid: 'did:piaoshu:tech-cto-def456', credentialHash: 'vc_hash_a1b2c3', claims: JSON.stringify({ skill: 'System Architecture', level: 'Expert' }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v2', vcType: 'SkillProof', issuerDid: 'did:piaoshu:piaoshu-ceo-abc123', subjectDid: 'did:piaoshu:growth-lead-ghi789', credentialHash: 'vc_hash_d4e5f6', claims: JSON.stringify({ skill: 'Growth Hacking', level: 'Advanced' }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v3', vcType: 'SkillProof', issuerDid: 'did:piaoshu:tech-cto-def456', subjectDid: 'did:piaoshu:engineer-jkl012', credentialHash: 'vc_hash_g7h8i9', claims: JSON.stringify({ skill: 'Full-Stack Dev', level: 'Intermediate' }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v4', vcType: 'AchievementProof', issuerDid: 'did:piaoshu:piaoshu-ceo-abc123', subjectDid: 'did:piaoshu:tech-cto-def456', credentialHash: 'vc_hash_j0k1l2', claims: JSON.stringify({ achievement: 'Shipped v1.0', impact: 'High' }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v5', vcType: 'AchievementProof', issuerDid: 'did:piaoshu:tech-cto-def456', subjectDid: 'did:piaoshu:engineer-jkl012', credentialHash: 'vc_hash_m3n4o5', claims: JSON.stringify({ achievement: 'Zero-downtime deploy', impact: 'Medium' }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v6', vcType: 'TrustAttestation', issuerDid: 'did:piaoshu:tech-cto-def456', subjectDid: 'did:piaoshu:growth-lead-ghi789', credentialHash: 'vc_hash_p6q7r8', claims: JSON.stringify({ trust: 'Reliable partner', score: 0.85 }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v7', vcType: 'TrustAttestation', issuerDid: 'did:piaoshu:growth-lead-ghi789', subjectDid: 'did:piaoshu:piaoshu-ceo-abc123', credentialHash: 'vc_hash_s9t0u1', claims: JSON.stringify({ trust: 'Strategic alignment', score: 0.92 }), status: 'active', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), verifiedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'v8', vcType: 'CollaborationRecord', issuerDid: 'did:piaoshu:piaoshu-ceo-abc123', subjectDid: 'did:piaoshu:engineer-jkl012', credentialHash: 'vc_hash_v2w3x4', claims: JSON.stringify({ task: 'API Sprint', outcome: 'Success' }), status: 'pending', expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), createdAt: new Date().toISOString() },
]

const FALLBACK_CONNECTIONS: ConnectionRecord[] = [
  { id: 'c1', senderDid: 'did:piaoshu:piaoshu-ceo-abc123', receiverDid: 'did:piaoshu:tech-cto-def456', strength: 0.95, connectionType: 'collaboration', createdAt: new Date().toISOString(), sender: FALLBACK_DIDS[0], receiver: FALLBACK_DIDS[1] },
  { id: 'c2', senderDid: 'did:piaoshu:piaoshu-ceo-abc123', receiverDid: 'did:piaoshu:growth-lead-ghi789', strength: 0.88, connectionType: 'mentorship', createdAt: new Date().toISOString(), sender: FALLBACK_DIDS[0], receiver: FALLBACK_DIDS[2] },
  { id: 'c3', senderDid: 'did:piaoshu:tech-cto-def456', receiverDid: 'did:piaoshu:engineer-jkl012', strength: 0.82, connectionType: 'delegation', createdAt: new Date().toISOString(), sender: FALLBACK_DIDS[1], receiver: FALLBACK_DIDS[3] },
  { id: 'c4', senderDid: 'did:piaoshu:growth-lead-ghi789', receiverDid: 'did:piaoshu:tech-cto-def456', strength: 0.75, connectionType: 'verification', createdAt: new Date().toISOString(), sender: FALLBACK_DIDS[2], receiver: FALLBACK_DIDS[1] },
  { id: 'c5', senderDid: 'did:piaoshu:engineer-jkl012', receiverDid: 'did:piaoshu:piaoshu-ceo-abc123', strength: 0.68, connectionType: 'collaboration', createdAt: new Date().toISOString(), sender: FALLBACK_DIDS[3], receiver: FALLBACK_DIDS[0] },
]

const FALLBACK_MESSAGES: MessageRecord[] = [
  { id: 'm1', senderDid: 'did:piaoshu:piaoshu-ceo-abc123', receiverDid: 'did:piaoshu:tech-cto-def456', messageType: 'task_assignment', content: JSON.stringify({ task: 'Review architecture for v2.0', priority: 'high' }), status: 'delivered', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'm2', senderDid: 'did:piaoshu:tech-cto-def456', receiverDid: 'did:piaoshu:engineer-jkl012', messageType: 'task_assignment', content: JSON.stringify({ task: 'Implement federation API', priority: 'medium' }), status: 'delivered', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'm3', senderDid: 'did:piaoshu:growth-lead-ghi789', receiverDid: 'did:piaoshu:piaoshu-ceo-abc123', messageType: 'knowledge_share', content: JSON.stringify({ insight: 'Retention improved 23%' }), status: 'acknowledged', createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 'm4', senderDid: 'did:piaoshu:engineer-jkl012', receiverDid: 'did:piaoshu:tech-cto-def456', messageType: 'collaboration_invite', content: JSON.stringify({ project: 'DID Verification' }), status: 'delivered', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'm5', senderDid: 'did:piaoshu:piaoshu-ceo-abc123', receiverDid: 'did:piaoshu:growth-lead-ghi789', messageType: 'trust_request', content: JSON.stringify({ request: 'Verify Q1 metrics' }), status: 'pending', createdAt: new Date(Date.now() - 18000000).toISOString() },
]

// ===== Helper Functions =====
const TRUST_LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; icon: string }> = {
  platinum: { color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20', icon: '💎' },
  gold: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20', icon: '🏆' },
  silver: { color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30', glow: 'shadow-slate-400/20', icon: '🥈' },
  bronze: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', icon: '🥉' },
}

const VC_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SkillProof: { label: '技能证明', color: 'text-emerald-400', icon: Zap },
  AchievementProof: { label: '成就证明', color: 'text-yellow-400', icon: Award },
  TrustAttestation: { label: '信任证明', color: 'text-teal-400', icon: Shield },
  CollaborationRecord: { label: '协作记录', color: 'text-cyan-400', icon: Users },
}

const MSG_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  task_assignment: { label: '任务分配', color: 'text-amber-400' },
  knowledge_share: { label: '知识共享', color: 'text-emerald-400' },
  collaboration_invite: { label: '协作邀请', color: 'text-teal-400' },
  trust_request: { label: '信任请求', color: 'text-cyan-400' },
}

function getAvatarInitial(name: string): string {
  return name.charAt(0)
}

function getShortDid(did: string): string {
  if (did.length <= 24) return did
  return `${did.slice(0, 18)}...${did.slice(-6)}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  return `${days}天前`
}

// ===== Section 1: Federation Header =====
function FederationHeader({ dids, connections, vcs }: { dids: DIDRecord[]; connections: ConnectionRecord[]; vcs: VCRecord[] }) {
  const createDID = useCreateDID()
  const [creating, setCreating] = useState(false)

  const handleCreateDID = async () => {
    setCreating(true)
    try {
      await createDID.mutateAsync({ avatarName: `Avatar-${Date.now().toString(36)}` })
      toast.success('DID创建成功')
    } catch {
      toast.error('DID创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">联邦信任层</h2>
            <p className="text-xs text-muted-foreground font-mono">Federation Trust Network</p>
          </div>
        </div>
        <Button
          onClick={handleCreateDID}
          disabled={creating}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
        >
          <Plus className="h-4 w-4" />
          {creating ? '创建中...' : 'Create DID'}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'DID注册数', value: dids.length, icon: Fingerprint, color: 'text-emerald-500' },
          { label: '活跃连接', value: connections.length, icon: Link2, color: 'text-teal-500' },
          { label: 'VC已签发', value: vcs.length, icon: Key, color: 'text-cyan-500' },
          { label: '信任分', value: connections.length > 0 ? Math.round(connections.reduce((s, c) => s + c.strength, 0) / connections.length * 100) : 0, icon: Activity, color: 'text-amber-500' },
        ].map(stat => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={cn('h-5 w-5 shrink-0', stat.color)} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}{stat.label === '信任分' ? '%' : ''}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ===== Section 2: DID Identity Cards =====
function DIDIdentityCards({ dids }: { dids: DIDRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedDid, setCopiedDid] = useState<string | null>(null)

  const handleCopy = (did: string) => {
    navigator.clipboard.writeText(did)
    setCopiedDid(did)
    toast.success('DID已复制到剪贴板')
    setTimeout(() => setCopiedDid(null), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">DID 身份卡片</h3>
        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">{dids.length} 个身份</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dids.map((did) => {
          const config = TRUST_LEVEL_CONFIG[did.trustLevel] || TRUST_LEVEL_CONFIG.bronze
          const isExpanded = expandedId === did.id
          const vcCount = (did.credentials as unknown[])?.length || 0

          return (
            <motion.div
              key={did.id}
              layout
              className={cn(
                'rounded-xl border p-4 transition-all duration-300',
                'bg-gradient-to-br from-card to-card/50',
                config.border,
                `shadow-lg ${config.glow}`,
                did.status !== 'active' && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold',
                    config.bg, config.color
                  )}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{did.avatarName}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">{did.avatarType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn('text-[9px] h-5 border-0', config.bg, config.color)}>
                    {did.trustLevel}
                  </Badge>
                  <Badge className={cn(
                    'text-[9px] h-5 border-0',
                    did.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                    did.status === 'suspended' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-red-500/10 text-red-600'
                  )}>
                    {did.status === 'active' ? '活跃' : did.status === 'suspended' ? '暂停' : '撤销'}
                  </Badge>
                </div>
              </div>

              {/* DID identifier with copy */}
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
                <Key className="h-3 w-3 text-muted-foreground shrink-0" />
                <code className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{getShortDid(did.did)}</code>
                <button
                  onClick={() => handleCopy(did.did)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedDid === did.did ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Stats row */}
              <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Award className="h-3 w-3" />{vcCount} VCs</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(did.updatedAt)}</span>
              </div>

              {/* Expand toggle */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : did.id)}
                className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {isExpanded ? '收起DID文档' : '查看DID文档'}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-lg bg-muted/30 border border-border/30 p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">DID Document</p>
                      <pre className="text-[9px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                        {did.didDocument ? JSON.stringify(JSON.parse(did.didDocument), null, 2) : 'No document available'}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ===== Section 3: Verifiable Credentials Panel =====
function VerifiableCredentialsPanel({ vcs, dids }: { vcs: VCRecord[]; dids: DIDRecord[] }) {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchHash, setSearchHash] = useState('')

  const verifyVC = useVerifyVC()
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<unknown>(null)

  const filtered = useMemo(() => {
    return vcs.filter(vc => {
      if (filterType !== 'all' && vc.vcType !== filterType) return false
      if (filterStatus !== 'all' && vc.status !== filterStatus) return false
      if (searchHash && !vc.credentialHash.includes(searchHash)) return false
      return true
    })
  }, [vcs, filterType, filterStatus, searchHash])

  const handleVerify = async (hash: string) => {
    setVerifyingHash(hash)
    setVerifyResult(null)
    try {
      const result = await verifyVC.mutateAsync({ credentialHash: hash })
      setVerifyResult(result)
      toast.success('验证完成')
    } catch {
      toast.error('验证失败')
    } finally {
      setVerifyingHash(null)
    }
  }

  const getAvatarName = (did: string) => {
    const found = dids.find(d => d.did === did)
    return found ? found.avatarName : getShortDid(did)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold">可验证凭证</h3>
          <Badge variant="secondary" className="text-[10px] bg-teal-500/10 text-teal-600">{vcs.length}</Badge>
        </div>
        <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 border-teal-500/30 text-teal-600 hover:bg-teal-500/10">
          <Plus className="h-3 w-3" />
          Issue VC
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {['all', 'SkillProof', 'AchievementProof', 'TrustAttestation', 'CollaborationRecord'].map(type => (
            <Button
              key={type}
              size="sm"
              variant={filterType === type ? 'default' : 'ghost'}
              className={cn('h-6 text-[9px] px-2',
                filterType === type ? 'bg-emerald-600 text-white' : 'text-muted-foreground'
              )}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? '全部' : (VC_TYPE_CONFIG[type]?.label || type)}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {['all', 'active', 'pending', 'revoked'].map(status => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? 'default' : 'ghost'}
              className={cn('h-6 text-[9px] px-2',
                filterStatus === status ? 'bg-teal-600 text-white' : 'text-muted-foreground'
              )}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? '全部状态' : status === 'active' ? '已验证' : status === 'pending' ? '待验证' : '已撤销'}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="搜索凭证哈希..."
            value={searchHash}
            onChange={e => setSearchHash(e.target.value)}
            className="h-6 text-[10px] pl-7"
          />
        </div>
      </div>

      {/* VC list */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        {filtered.map(vc => {
          const typeConfig = VC_TYPE_CONFIG[vc.vcType] || { label: vc.vcType, color: 'text-gray-400', icon: Key }
          const TypeIcon = typeConfig.icon
          const claims = (() => { try { return JSON.parse(vc.claims) } catch { return {} } })()

          return (
            <div key={vc.id} className="rounded-lg border border-border/50 bg-card/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
                  <span className={cn('text-[10px] font-semibold', typeConfig.color)}>{typeConfig.label}</span>
                  <Badge className={cn('text-[9px] h-4 border-0',
                    vc.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                    vc.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-red-500/10 text-red-600'
                  )}>
                    {vc.status === 'active' ? '已验证' : vc.status === 'pending' ? '待验证' : '已撤销'}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 text-[9px] gap-1 text-teal-600 hover:bg-teal-500/10"
                  onClick={() => handleVerify(vc.credentialHash)}
                  disabled={verifyingHash === vc.credentialHash}
                >
                  {verifyingHash === vc.credentialHash ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  验证
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <div>
                  <span className="text-muted-foreground">签发方:</span>
                  <span className="ml-1 font-medium">{getAvatarName(vc.issuerDid)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">主体:</span>
                  <span className="ml-1 font-medium">{getAvatarName(vc.subjectDid)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">过期:</span>
                  <span className="ml-1">{vc.expiresAt ? new Date(vc.expiresAt).toLocaleDateString() : '永不过期'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">哈希:</span>
                  <code className="ml-1 font-mono text-[8px]">{getShortDid(vc.credentialHash)}</code>
                </div>
              </div>

              {/* Claims preview */}
              {Object.keys(claims).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(claims).slice(0, 3).map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-[8px] h-4 bg-muted/50">
                      {k}: {String(v)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Verify result */}
      <AnimatePresence>
        {verifyResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                {((verifyResult as Record<string, unknown>)?.data as Record<string, unknown>)?.verified ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-xs font-semibold">
                  信任分: {Math.round((((verifyResult as Record<string, unknown>)?.data as Record<string, unknown>)?.trustScore as number || 0) * 100)}%
                </span>
              </div>
              <div className="space-y-1">
                {(((verifyResult as Record<string, unknown>)?.data as Record<string, unknown>)?.checks as Array<{ name: string; passed: boolean; detail: string }>)?.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    {check.passed ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                    <span className="text-muted-foreground">{check.name}:</span>
                    <span>{check.detail}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="mt-2 h-5 text-[9px]" onClick={() => setVerifyResult(null)}>关闭</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ===== Section 4: Trust Network Visualization =====
function TrustNetworkVisualization({ dids, connections }: { dids: DIDRecord[]; connections: ConnectionRecord[] }) {
  // Calculate positions in a constellation layout
  const nodePositions = useMemo(() => {
    const cx = 300, cy = 200
    const positions: Record<string, { x: number; y: number }> = {}
    const count = dids.length
    dids.forEach((did, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      const radius = Math.min(cx, cy) * 0.65
      positions[did.did] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      }
    })
    return positions
  }, [dids])

  const getRadius = (trustLevel: string) => {
    switch (trustLevel) {
      case 'platinum': return 20
      case 'gold': return 16
      case 'silver': return 13
      default: return 10
    }
  }

  const getNodeColor = (trustLevel: string) => {
    switch (trustLevel) {
      case 'platinum': return '#22d3ee'
      case 'gold': return '#facc15'
      case 'silver': return '#94a3b8'
      default: return '#f59e0b'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Network className="h-4 w-4 text-teal-500" />
        <h3 className="text-sm font-semibold">信任网络拓扑</h3>
        <Badge variant="secondary" className="text-[10px] bg-teal-500/10 text-teal-600">{connections.length} 条连接</Badge>
      </div>
      <Card className="bg-card/30 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <svg viewBox="0 0 600 400" className="w-full h-auto" style={{ minHeight: 250 }}>
            {/* Grid lines */}
            <defs>
              <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(16,185,129,0.05)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect width="600" height="400" fill="url(#bgGrad)" rx="8" />

            {/* Connection lines */}
            {connections.map((conn, i) => {
              const from = nodePositions[conn.senderDid]
              const to = nodePositions[conn.receiverDid]
              if (!from || !to) return null
              const strokeWidth = 1 + conn.strength * 3
              const opacity = 0.3 + conn.strength * 0.5
              return (
                <g key={i}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="#10b981" strokeWidth={strokeWidth} opacity={opacity}
                    strokeDasharray={conn.connectionType === 'verification' ? '4 2' : 'none'}
                  />
                  {/* Arrow midpoint label */}
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 5}
                    textAnchor="middle"
                    className="text-[7px] fill-muted-foreground"
                  >
                    {(conn.strength * 100).toFixed(0)}%
                  </text>
                </g>
              )
            })}

            {/* Nodes */}
            {dids.map((did) => {
              const pos = nodePositions[did.did]
              if (!pos) return null
              const r = getRadius(did.trustLevel)
              const color = getNodeColor(did.trustLevel)
              return (
                <g key={did.id} filter="url(#glow)">
                  <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity={0.2} />
                  <circle cx={pos.x} cy={pos.y} r={r * 0.7} fill={color} opacity={0.6} />
                  <circle cx={pos.x} cy={pos.y} r={r * 0.4} fill={color} opacity={0.9} />
                  <text
                    x={pos.x} y={pos.y + r + 12}
                    textAnchor="middle"
                    className="text-[8px] fill-muted-foreground"
                  >
                    {did.avatarName}
                  </text>
                  <text
                    x={pos.x} y={pos.y + r + 21}
                    textAnchor="middle"
                    className="text-[6px] fill-muted-foreground font-mono"
                  >
                    {getShortDid(did.did)}
                  </text>
                </g>
              )
            })}
          </svg>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-cyan-400" /> Platinum</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-400" /> Gold</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> Silver</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Bronze</span>
        <span className="flex items-center gap-1">线粗 = 信任强度</span>
        <span className="flex items-center gap-1">虚线 = 验证关系</span>
      </div>
    </div>
  )
}

// ===== Section 5: Trust Verification Flow =====
function TrustVerificationFlow() {
  const steps = [
    { icon: Fingerprint, title: '出示DID', desc: '分身出示去中心化身份标识', color: 'text-emerald-500' },
    { icon: Key, title: '请求VC', desc: '验证方请求可验证凭证', color: 'text-teal-500' },
    { icon: Shield, title: '凭证验证', desc: '验证凭证签名与有效期', color: 'text-cyan-500' },
    { icon: CheckCircle2, title: '信任计算', desc: '综合计算信任分数', color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-cyan-500" />
        <h3 className="text-sm font-semibold">信任验证流程</h3>
      </div>
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <motion.div
                    className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2',
                      'bg-gradient-to-br from-card to-card/50',
                      step.color === 'text-emerald-500' ? 'border-emerald-500/40' :
                      step.color === 'text-teal-500' ? 'border-teal-500/40' :
                      step.color === 'text-cyan-500' ? 'border-cyan-500/40' :
                      'border-amber-500/40'
                    )}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  >
                    <step.icon className={cn('h-4 w-4', step.color)} />
                  </motion.div>
                  <p className="text-[10px] font-semibold text-center">{step.title}</p>
                  <p className="text-[8px] text-muted-foreground text-center">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-[-20px]" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Section 6: Cross-Avatar Communication Log =====
function CrossAvatarCommunicationLog({ messages, dids }: { messages: MessageRecord[]; dids: DIDRecord[] }) {
  const getAvatarName = (did: string) => {
    const found = dids.find(d => d.did === did)
    return found ? found.avatarName : getShortDid(did)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">跨分身通信日志</h3>
        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">{messages.length} 条</Badge>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {messages.map((msg) => {
          const typeConfig = MSG_TYPE_LABELS[msg.messageType] || { label: msg.messageType, color: 'text-gray-400' }
          let contentObj: Record<string, unknown> = {}
          try { contentObj = JSON.parse(msg.content) } catch { /* ignore */ }

          return (
            <div key={msg.id} className="rounded-lg border border-border/30 bg-card/20 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="font-medium text-foreground">{getAvatarName(msg.senderDid)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">{getAvatarName(msg.receiverDid)}</span>
                  <Badge className={cn('text-[8px] h-4 border-0', typeConfig.color, 'bg-current/10')} style={{ backgroundColor: 'transparent' }}>
                    <span className={typeConfig.color}>{typeConfig.label}</span>
                  </Badge>
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">{timeAgo(msg.createdAt)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(contentObj).slice(0, 2).map(([k, v]) => (
                  <span key={k} className="text-[8px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                    {k}: {String(v).slice(0, 20)}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex items-center gap-1">
                <Badge className={cn('text-[7px] h-3.5 border-0',
                  msg.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' :
                  msg.status === 'acknowledged' ? 'bg-teal-500/10 text-teal-600' :
                  'bg-amber-500/10 text-amber-600'
                )}>
                  {msg.status === 'delivered' ? '已送达' : msg.status === 'acknowledged' ? '已确认' : '待处理'}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== Main Component =====
export function FederationLayerView() {
  const { data: didsData, isLoading: didsLoading } = useFederationDIDs()
  const { data: vcsData, isLoading: vcsLoading } = useFederationVCs()
  const { data: connectionsData, isLoading: connectionsLoading } = useTrustConnections()
  const { data: messagesData, isLoading: messagesLoading } = useCrossAvatarMessages()
  const seedFederation = useSeedFederation()

  const dids: DIDRecord[] = (didsData as Record<string, unknown>)?.data
    ? ((didsData as Record<string, unknown>).data as Record<string, unknown>).dids as DIDRecord[] || []
    : FALLBACK_DIDS
  const vcs: VCRecord[] = (vcsData as Record<string, unknown>)?.data
    ? ((vcsData as Record<string, unknown>).data as Record<string, unknown>).vcs as VCRecord[] || []
    : FALLBACK_VCS
  const connections: ConnectionRecord[] = (connectionsData as Record<string, unknown>)?.data
    ? ((connectionsData as Record<string, unknown>).data as Record<string, unknown>).connections as ConnectionRecord[] || []
    : FALLBACK_CONNECTIONS
  const messages: MessageRecord[] = (messagesData as Record<string, unknown>)?.data
    ? ((messagesData as Record<string, unknown>).data as Record<string, unknown>).messages as MessageRecord[] || []
    : FALLBACK_MESSAGES

  const handleSeed = async () => {
    try {
      await seedFederation.mutateAsync()
      toast.success('联邦信任层数据已初始化')
    } catch {
      toast.error('数据初始化失败')
    }
  }

  const isLoading = didsLoading || vcsLoading || connectionsLoading || messagesLoading

  return (
    <div className="space-y-6">
      {/* Section 1: Federation Header */}
      <FederationHeader dids={dids} connections={connections} vcs={vcs} />

      <Separator />

      {/* Section 2: DID Identity Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <DIDIdentityCards dids={dids} />
      )}

      <Separator />

      {/* Section 3 & 4: VCs + Trust Network side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </>
        ) : (
          <>
            <VerifiableCredentialsPanel vcs={vcs} dids={dids} />
            <TrustNetworkVisualization dids={dids} connections={connections} />
          </>
        )}
      </div>

      <Separator />

      {/* Section 5: Trust Verification Flow */}
      <TrustVerificationFlow />

      <Separator />

      {/* Section 6: Cross-Avatar Communication Log */}
      {isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <CrossAvatarCommunicationLog messages={messages} dids={dids} />
      )}

      {/* Seed button */}
      {dids.length === 0 && (
        <div className="flex justify-center py-4">
          <Button onClick={handleSeed} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <RefreshCw className="h-4 w-4" />
            初始化联邦信任层数据
          </Button>
        </div>
      )}
    </div>
  )
}
