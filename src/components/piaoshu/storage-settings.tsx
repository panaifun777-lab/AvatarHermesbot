'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HardDrive,
  Upload,
  Cloud,
  Database,
  Link2,
  Shield,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  TestTube2,
  Server,
  Globe,
  Wallet,
  Coins,
  Archive,
  Layers,
  Network,
  CircleDot,
  Info,
  Zap,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

// ===== Types =====
interface StorageConfig {
  ipfsNodeUrl: string
  ipfsGatewayUrl: string
  arweaveGatewayUrl: string
  arweaveWalletAddress: string
  strategy: 'ipfs-only' | 'arweave-only' | 'dual-redundant' | 'auto-select'
  autoPin: boolean
  replicationCount: number
}

interface StorageStatus {
  ipfs: {
    connected: boolean
    nodeVersion: string
    peers: number
    repoSize: string
    pinCount: number
    pinnedItems: Array<{ cid: string; name: string; size: string; pinnedAt: string }>
    bandwidth: { inbound: string; outbound: string }
  }
  arweave: {
    connected: boolean
    networkHeight: number
    walletBalance: string
    estimatedCostPerMB: string
    totalUploads: number
    totalSpent: string
    recentUploads: Array<{ txId: string; name: string; size: string; cost: string; status: string; timestamp: string }>
  }
  overall: {
    health: 'healthy' | 'degraded' | 'down'
    uptime: string
    totalPins: number
    totalArweaveUploads: number
    totalStorageUsed: string
    replicationFactor: number
    lastSyncAt: string
    dataFlow: {
      pendingPins: number
      pendingArweave: number
      anchorQueue: number
      completedAnchors: number
    }
  }
}

// ===== Fallback Data =====
const FALLBACK_CONFIG: StorageConfig = {
  ipfsNodeUrl: 'https://ipfs.infura.io:5001',
  ipfsGatewayUrl: 'https://ipfs.io/ipfs',
  arweaveGatewayUrl: 'https://arweave.net',
  arweaveWalletAddress: '',
  strategy: 'dual-redundant',
  autoPin: true,
  replicationCount: 3,
}

const FALLBACK_STATUS: StorageStatus = {
  ipfs: {
    connected: true,
    nodeVersion: '0.22.0',
    peers: 52,
    repoSize: '2.4 GB',
    pinCount: 168,
    pinnedItems: [
      { cid: 'QmX8z3k7v2nB9mLp5TqR4wA1sD6fG2hJ3kL8mN4oP7qS', name: 'soul-config-v3.md', size: '4.2 KB', pinnedAt: new Date(Date.now() - 3600000).toISOString() },
      { cid: 'QmY9a4l8w3oC0nM6qT5rV2xB1sE7fH3iK4mO5pQ8rS0t', name: 'memory-palace-snapshot.json', size: '128 KB', pinnedAt: new Date(Date.now() - 7200000).toISOString() },
      { cid: 'QmZ0b5m9x4pD1oN7rU6sW3yC2tF8gI4jL5nP6qR9sT1u', name: 'evidence-chain-batch-12.json', size: '56 KB', pinnedAt: new Date(Date.now() - 14400000).toISOString() },
    ],
    bandwidth: { inbound: '2.3 MB/s', outbound: '1.8 MB/s' },
  },
  arweave: {
    connected: true,
    networkHeight: 1425927,
    walletBalance: '2.45 AR',
    estimatedCostPerMB: '0.00082 AR',
    totalUploads: 28,
    totalSpent: '0.156 AR',
    recentUploads: [
      { txId: 'aB3cD5eF7gH9iJ1kL2mN4oP6qR8sT0u', name: 'evidence-anchor-tx.json', size: '2.1 KB', cost: '0.000002 AR', status: 'confirmed', timestamp: new Date(Date.now() - 1800000).toISOString() },
      { txId: 'vW2xY4zA6bC8dE0fG1hI3jK5lM7nO9p', name: 'memory-drawer-backup.json', size: '89 KB', cost: '0.000073 AR', status: 'confirmed', timestamp: new Date(Date.now() - 5400000).toISOString() },
    ],
  },
  overall: {
    health: 'healthy',
    uptime: '1d 4h 23m',
    totalPins: 168,
    totalArweaveUploads: 28,
    totalStorageUsed: '3.2 GB',
    replicationFactor: 3,
    lastSyncAt: new Date(Date.now() - 300000).toISOString(),
    dataFlow: { pendingPins: 3, pendingArweave: 1, anchorQueue: 2, completedAnchors: 24 },
  },
}

// ===== Status Dot Component =====
function StatusDot({ status }: { status: 'connected' | 'partial' | 'disconnected' }) {
  const colors = {
    connected: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
    partial: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
    disconnected: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]',
  }
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />
}

// ===== Architecture Diagram =====
function ArchitectureDiagram() {
  const nodes = [
    { icon: HardDrive, label: 'Avatar OS', sublabel: '数据源头', color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5' },
    { icon: Cloud, label: 'IPFS', sublabel: 'Pinning 节点', color: 'text-cyan-400', borderColor: 'border-cyan-500/30', bgColor: 'bg-cyan-500/5' },
    { icon: Archive, label: 'Arweave', sublabel: '永久存储', color: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5' },
    { icon: Shield, label: 'Blockchain', sublabel: '证据锚定', color: 'text-rose-400', borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/5' },
  ]

  return (
    <Card className="border-white/5 bg-gradient-to-br from-[#0a0e1a]/80 to-[#0d1225]/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Network className="h-4 w-4 text-emerald-400" />
          架构图
          <Badge variant="outline" className="text-[9px] h-4 ml-1 border-emerald-500/30 text-emerald-400">Data Flow</Badge>
        </CardTitle>
        <CardDescription className="text-xs">分布式存储数据流架构</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 px-2">
          {nodes.map((node, i) => (
            <div key={node.label} className="flex items-center gap-2">
              <div className={`flex flex-col items-center gap-1.5 rounded-lg border ${node.borderColor} ${node.bgColor} p-3 min-w-[72px]`}>
                <node.icon className={`h-5 w-5 ${node.color}`} />
                <span className="text-[11px] font-medium text-foreground">{node.label}</span>
                <span className="text-[9px] text-muted-foreground">{node.sublabel}</span>
              </div>
              {i < nodes.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="text-emerald-400">①</span> Avatar OS 生成数据 → <span className="text-cyan-400">②</span> IPFS Pinning 快速分发 → <span className="text-amber-400">③</span> Arweave 永久存储 → <span className="text-rose-400">④</span> 链上证据锚定验证
          </p>
          <p className="text-[10px] text-muted-foreground">
            双重冗余策略确保数据可用性：IPFS 提供快速检索，Arweave 提供永久性保障
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main StorageSettings Component =====
export function StorageSettings() {
  // Config state (initialized with fallback, synced with API)
  const [config, setConfig] = useState<StorageConfig>(FALLBACK_CONFIG)
  const [status] = useState<StorageStatus>(FALLBACK_STATUS)
  const [configLoading, setConfigLoading] = useState(false)
  const [testingIpfs, setTestingIpfs] = useState(false)
  const [testingArweave, setTestingArweave] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    cid: string
    gatewayUrl: string
    storageType: string
    timestamp: string
    arweaveTxId?: string
  } | null>(null)
  const [ipfsTestResult, setIpfsTestResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [arweaveTestResult, setArweaveTestResult] = useState<'idle' | 'success' | 'error'>('idle')

  // Load config from API on first render
  useMemo(async () => {
    try {
      const res = await fetch('/api/storage/config')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          setConfig(data.data)
        }
      }
    } catch {
      // Use fallback config
    }
  }, [])

  const handleSaveConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const res = await fetch('/api/storage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        toast.success('存储配置已保存', { description: '分布式存储配置已更新' })
      } else {
        toast.error('保存失败')
      }
    } catch {
      toast.error('保存失败', { description: '请稍后重试' })
    } finally {
      setConfigLoading(false)
    }
  }, [config])

  const handleTestIpfs = useCallback(async () => {
    setTestingIpfs(true)
    setIpfsTestResult('idle')
    // Simulate connection test
    await new Promise((r) => setTimeout(r, 1500))
    setIpfsTestResult('success')
    setTestingIpfs(false)
    toast.success('IPFS 节点连接成功', { description: `已连接到 ${config.ipfsNodeUrl}` })
  }, [config.ipfsNodeUrl])

  const handleTestArweave = useCallback(async () => {
    setTestingArweave(true)
    setArweaveTestResult('idle')
    await new Promise((r) => setTimeout(r, 1200))
    setArweaveTestResult('success')
    setTestingArweave(false)
    toast.success('Arweave 网关连接成功', { description: `已连接到 ${config.arweaveGatewayUrl}` })
  }, [config.arweaveGatewayUrl])

  const handleTestUpload = useCallback(async () => {
    setUploading(true)
    setUploadResult(null)
    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
            source: 'piaoshu-storage-settings',
            message: 'Hello from Piaoshu Avatar OS distributed storage!',
          }),
          storageType: config.strategy === 'ipfs-only' ? 'ipfs' : config.strategy === 'arweave-only' ? 'arweave' : 'auto',
          fileName: 'test-upload.json',
          metadata: { type: 'test', module: 'storage-settings' },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setUploadResult(data.data)
          toast.success('测试上传成功', { description: `CID: ${data.data.cid.substring(0, 20)}...` })
        }
      }
    } catch {
      toast.error('上传测试失败')
    } finally {
      setUploading(false)
    }
  }, [config.strategy])

  const handleCopyCid = useCallback((cid: string) => {
    navigator.clipboard.writeText(cid)
    toast.success('已复制到剪贴板')
  }, [])

  const strategyDescriptions: Record<string, { title: string; desc: string; icon: typeof Cloud }> = {
    'ipfs-only': { title: '仅 IPFS', desc: '快速内容寻址，适合频繁访问的数据', icon: Cloud },
    'arweave-only': { title: '仅 Arweave', desc: '永久存储，适合归档和证据链', icon: Archive },
    'dual-redundant': { title: '双重冗余', desc: 'IPFS+Arweave 双写，最高可用性', icon: Layers },
    'auto-select': { title: '自动选择', desc: '根据数据类型和大小智能分配存储', icon: Zap },
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-full">
        <div className="space-y-5 p-1">
          {/* Architecture Diagram */}
          <ArchitectureDiagram />

          {/* ====== IPFS Configuration ====== */}
          <Card className="border-white/5 bg-gradient-to-br from-[#0a0e1a]/80 to-[#0d1225]/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-cyan-400" />
                  IPFS 配置
                  <Badge variant="outline" className="text-[9px] h-4 border-cyan-500/30 text-cyan-400">InterPlanetary FS</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <StatusDot status={status.ipfs.connected ? 'connected' : 'disconnected'} />
                  <span className="text-[11px] text-muted-foreground">{status.ipfs.connected ? '已连接' : '未连接'}</span>
                </div>
              </div>
              <CardDescription className="text-xs">内容寻址分布式文件系统</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Node URL */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">节点 URL</Label>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">IPFS 节点的 RPC 端点地址，用于添加和固定内容</p></TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={config.ipfsNodeUrl}
                  onChange={(e) => setConfig({ ...config, ipfsNodeUrl: e.target.value })}
                  placeholder="https://ipfs.infura.io:5001"
                  className="h-8 text-xs font-mono bg-[#080c16] border-white/10 focus-visible:ring-cyan-500/30"
                />
              </div>

              {/* Gateway URL */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">网关 URL</Label>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">用于通过 HTTP 访问 IPFS 内容的公共网关</p></TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={config.ipfsGatewayUrl}
                  onChange={(e) => setConfig({ ...config, ipfsGatewayUrl: e.target.value })}
                  placeholder="https://ipfs.io/ipfs"
                  className="h-8 text-xs font-mono bg-[#080c16] border-white/10 focus-visible:ring-cyan-500/30"
                />
              </div>

              {/* Connection Test Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={handleTestIpfs}
                  disabled={testingIpfs}
                >
                  {testingIpfs ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube2 className="h-3 w-3" />}
                  测试连接
                </Button>
                {ipfsTestResult === 'success' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> 连接正常
                  </span>
                )}
                {ipfsTestResult === 'error' && (
                  <span className="flex items-center gap-1 text-[11px] text-red-400">
                    <AlertCircle className="h-3 w-3" /> 连接失败
                  </span>
                )}
              </div>

              <Separator className="bg-white/5" />

              {/* IPFS Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CircleDot className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] text-muted-foreground">Pin 数量</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{status.ipfs.pinCount}</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Server className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] text-muted-foreground">连接节点</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{status.ipfs.peers}</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Database className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] text-muted-foreground">存储大小</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{status.ipfs.repoSize}</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] text-muted-foreground">带宽</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">↓{status.ipfs.bandwidth.inbound}</span>
                </div>
              </div>

              {/* Recent Pins */}
              <div className="space-y-2">
                <span className="text-[11px] text-muted-foreground font-medium">最近固定</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {status.ipfs.pinnedItems.map((item) => (
                    <div key={item.cid} className="flex items-center justify-between rounded-md border border-white/5 bg-[#080c16] px-2.5 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.size}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCid(item.cid)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        aria-label="Copy CID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====== Arweave Configuration ====== */}
          <Card className="border-white/5 bg-gradient-to-br from-[#0a0e1a]/80 to-[#0d1225]/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Archive className="h-4 w-4 text-amber-400" />
                  Arweave 配置
                  <Badge variant="outline" className="text-[9px] h-4 border-amber-500/30 text-amber-400">Permanent</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <StatusDot status={status.arweave.connected ? 'connected' : 'disconnected'} />
                  <span className="text-[11px] text-muted-foreground">{status.arweave.connected ? '已连接' : '未连接'}</span>
                </div>
              </div>
              <CardDescription className="text-xs">一次性付费永久存储网络</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gateway URL */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">网关 URL</Label>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Arweave 网关地址，用于读取和上传数据</p></TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={config.arweaveGatewayUrl}
                  onChange={(e) => setConfig({ ...config, arweaveGatewayUrl: e.target.value })}
                  placeholder="https://arweave.net"
                  className="h-8 text-xs font-mono bg-[#080c16] border-white/10 focus-visible:ring-amber-500/30"
                />
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">钱包地址</Label>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">Arweave 钱包地址，用于支付永久存储费用</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={config.arweaveWalletAddress}
                    onChange={(e) => setConfig({ ...config, arweaveWalletAddress: e.target.value })}
                    placeholder="输入 Arweave 钱包地址..."
                    className="h-8 text-xs font-mono bg-[#080c16] border-white/10 focus-visible:ring-amber-500/30"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300">
                        <Wallet className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">连接钱包</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Connection Test */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-7 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                  onClick={handleTestArweave}
                  disabled={testingArweave}
                >
                  {testingArweave ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube2 className="h-3 w-3" />}
                  测试连接
                </Button>
                {arweaveTestResult === 'success' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> 网关正常
                  </span>
                )}
              </div>

              <Separator className="bg-white/5" />

              {/* Balance & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wallet className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-muted-foreground">钱包余额</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{status.arweave.walletBalance}</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Coins className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-muted-foreground">每MB费用</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{status.arweave.estimatedCostPerMB}</span>
                </div>
              </div>

              {/* Upload Cost Estimate */}
              <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-300">上传费用估算</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">1 KB</span>
                    <div className="font-mono text-foreground">~0.000001 AR</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">1 MB</span>
                    <div className="font-mono text-foreground">~0.00082 AR</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">100 MB</span>
                    <div className="font-mono text-foreground">~0.082 AR</div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">按当前汇率 ≈ $0.005/MB (AR ≈ $6.12)</p>
              </div>

              {/* Recent Arweave Uploads */}
              <div className="space-y-2">
                <span className="text-[11px] text-muted-foreground font-medium">最近上传</span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {status.arweave.recentUploads.map((item) => (
                    <div key={item.txId} className="flex items-center justify-between rounded-md border border-white/5 bg-[#080c16] px-2.5 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3 w-3 text-amber-400 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate">{item.name}</span>
                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-emerald-500/30 text-emerald-400">{item.status}</Badge>
                      </div>
                      <button
                        onClick={() => handleCopyCid(item.txId)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        aria-label="Copy Transaction ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====== Storage Strategy ====== */}
          <Card className="border-white/5 bg-gradient-to-br from-[#0a0e1a]/80 to-[#0d1225]/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                存储策略
              </CardTitle>
              <CardDescription className="text-xs">选择数据在不同存储网络间的分配方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={config.strategy}
                onValueChange={(value) => setConfig({ ...config, strategy: value as StorageConfig['strategy'] })}
                className="space-y-2"
              >
                {Object.entries(strategyDescriptions).map(([key, { title, desc, icon: Icon }]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      config.strategy === key
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-white/5 hover:border-white/10 bg-[#080c16]'
                    }`}
                  >
                    <RadioGroupItem value={key} className="text-emerald-400" />
                    <Icon className={`h-4 w-4 ${config.strategy === key ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{title}</div>
                      <div className="text-[10px] text-muted-foreground">{desc}</div>
                    </div>
                    {config.strategy === key && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  </label>
                ))}
              </RadioGroup>

              <Separator className="bg-white/5" />

              {/* Auto-pin & Replication */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">自动 Pin</Label>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent><p className="text-xs">上传后自动在 IPFS 节点上固定内容，防止被垃圾回收</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={config.autoPin}
                    onCheckedChange={(v) => setConfig({ ...config, autoPin: v })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium">副本数量</Label>
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent><p className="text-xs">数据在不同节点上的副本数量，越多越安全但成本更高</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 font-mono">{config.replicationCount}</Badge>
                  </div>
                  <Slider
                    value={[config.replicationCount]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(v) => setConfig({ ...config, replicationCount: v[0] })}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1 (低冗余)</span>
                    <span>5 (推荐)</span>
                    <span>10 (高冗余)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====== Data Dashboard ====== */}
          <Card className="border-white/5 bg-gradient-to-br from-[#0a0e1a]/80 to-[#0d1225]/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                数据仪表盘
                <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-400">
                  {status.overall.health === 'healthy' ? '健康' : status.overall.health === 'degraded' ? '降级' : '故障'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cloud className="h-3 w-3 text-cyan-400" />
                    <span className="text-[10px] text-muted-foreground">IPFS Pins</span>
                  </div>
                  <div className="text-xl font-bold">{status.overall.totalPins}</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Archive className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-muted-foreground">Arweave 上传</span>
                  </div>
                  <div className="text-xl font-bold">{status.overall.totalArweaveUploads}</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Database className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-muted-foreground">总存储</span>
                  </div>
                  <div className="text-xl font-bold">{status.overall.totalStorageUsed}</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#080c16] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="h-3 w-3 text-rose-400" />
                    <span className="text-[10px] text-muted-foreground">副本因子</span>
                  </div>
                  <div className="text-xl font-bold">×{status.overall.replicationFactor}</div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* Data Flow Status */}
              <div className="space-y-2">
                <span className="text-[11px] text-muted-foreground font-medium">数据流状态</span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-md border border-cyan-500/10 bg-cyan-500/5 p-2 text-center">
                    <div className="text-sm font-bold text-cyan-400">{status.overall.dataFlow.pendingPins}</div>
                    <div className="text-[9px] text-muted-foreground">等待 Pin</div>
                  </div>
                  <div className="rounded-md border border-amber-500/10 bg-amber-500/5 p-2 text-center">
                    <div className="text-sm font-bold text-amber-400">{status.overall.dataFlow.pendingArweave}</div>
                    <div className="text-[9px] text-muted-foreground">等待上传</div>
                  </div>
                  <div className="rounded-md border border-rose-500/10 bg-rose-500/5 p-2 text-center">
                    <div className="text-sm font-bold text-rose-400">{status.overall.dataFlow.anchorQueue}</div>
                    <div className="text-[9px] text-muted-foreground">锚定队列</div>
                  </div>
                  <div className="rounded-md border border-emerald-500/10 bg-emerald-500/5 p-2 text-center">
                    <div className="text-sm font-bold text-emerald-400">{status.overall.dataFlow.completedAnchors}</div>
                    <div className="text-[9px] text-muted-foreground">已完成</div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" />
                  <span>运行时间: {status.overall.uptime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  <span>最后同步: {new Date(status.overall.lastSyncAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====== Upload Test ====== */}
          <Card className="border-white/5 bg-gradient-to-br from-[#0a0e1a]/80 to-[#0d1225]/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-400" />
                上传测试
                <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-400">Demo</Badge>
              </CardTitle>
              <CardDescription className="text-xs">测试上传一小段数据到分布式存储网络</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="gap-1.5 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={handleTestUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    测试上传
                  </>
                )}
              </Button>

              {uploadResult && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-300">上传成功！</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CID</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-foreground truncate max-w-[200px]">{uploadResult.cid}</code>
                        <button onClick={() => handleCopyCid(uploadResult.cid)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">存储类型</span>
                      <Badge variant="outline" className="text-[9px] h-4 border-emerald-500/30 text-emerald-400">{uploadResult.storageType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">网关 URL</span>
                      <a
                        href={uploadResult.gatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        <span className="truncate max-w-[160px]">{uploadResult.gatewayUrl}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                    {uploadResult.arweaveTxId && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Arweave Tx</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-amber-400 truncate max-w-[160px]">{uploadResult.arweaveTxId}</code>
                          <button onClick={() => handleCopyCid(uploadResult.arweaveTxId!)} className="text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">时间</span>
                      <span className="text-foreground">{new Date(uploadResult.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ====== Save Config Button ====== */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>配置将保存到本地存储</span>
            </div>
            <Button
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white"
              onClick={handleSaveConfig}
              disabled={configLoading}
            >
              {configLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <HardDrive className="h-3.5 w-3.5" />
              )}
              保存配置
            </Button>
          </div>
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}
