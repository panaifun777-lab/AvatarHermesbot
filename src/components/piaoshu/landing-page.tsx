'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PiaoshuLogo } from '@/components/piaoshu/piaoshu-logo'
import {
  Brain,
  Shield,
  Users,
  Database,
  Zap,
  ArrowRight,
  Globe,
  Lock,
  Cpu,
  Network,
  ChevronDown,
  Sparkles,
  Eye,
  Fingerprint,
  Layers,
  Workflow,
  Server,
  GitBranch,
  Send,
  Quote,
  Flame,
  Heart,
  Share2,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface LandingPageProps {
  onLogin: () => void
}

// Animated brain visualization using CSS
function BrainVisualization() {
  const [nodes, setNodes] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])
  const [connections, setConnections] = useState<Array<{ from: number; to: number; opacity: number }>>([])

  useEffect(() => {
    // Generate brain-like node positions
    const newNodes = Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2
      const radius = 80 + Math.random() * 60
      const x = 200 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40
      const y = 200 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40
      return { id: i, x, y, size: 2 + Math.random() * 4, delay: Math.random() * 2 }
    })
    // Add some inner nodes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 20 + Math.random() * 40
      newNodes.push({
        id: 24 + i,
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        size: 3 + Math.random() * 3,
        delay: Math.random() * 2,
      })
    }
    setNodes(newNodes)

    // Generate connections between nearby nodes
    const newConns: Array<{ from: number; to: number; opacity: number }> = []
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const dx = newNodes[i].x - newNodes[j].x
        const dy = newNodes[i].y - newNodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 80 && Math.random() > 0.4) {
          newConns.push({ from: i, to: j, opacity: 1 - dist / 80 })
        }
      }
    }
    setConnections(newConns)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-teal-500/8 blur-2xl" style={{ animation: 'pulse 3s ease-in-out infinite alternate' }} />
      </div>

      {/* SVG visualization */}
      <svg viewBox="0 0 400 400" className="w-72 h-72 sm:w-96 sm:h-96 relative z-10">
        {/* Connections */}
        {connections.map((conn, i) => {
          const fromNode = nodes[conn.from]
          const toNode = nodes[conn.to]
          if (!fromNode || !toNode) return null
          return (
            <motion.line
              key={`conn-${i}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="#00d4aa"
              strokeWidth={0.5}
              opacity={conn.opacity * 0.3}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: conn.opacity * 0.3 }}
              transition={{ duration: 1.5, delay: Math.min(fromNode.delay, toNode.delay) }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.size}
            fill="#00d4aa"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: node.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Central pulse */}
        <motion.circle
          cx={200}
          cy={200}
          r={12}
          fill="none"
          stroke="#00d4aa"
          strokeWidth={1.5}
          animate={{
            r: [12, 30, 12],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <motion.circle
          cx={200}
          cy={200}
          r={8}
          fill="#00d4aa"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>
    </div>
  )
}

// Floating particles background
function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5,
    }))
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-500/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Feature card data
const features: Array<{
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  color: string
  glow: string
}> = [
  {
    icon: Brain,
    title: '认知引擎',
    subtitle: 'Cognitive Engine',
    description: '红蓝对抗思维模拟，SOUL.md人格注入，认知分片引擎驱动深层洞察与决策。',
    color: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: Database,
    title: '记忆宫殿',
    subtitle: 'Memory Palace',
    description: '三层记忆架构（翼→厅→抽屉），AAAK压缩算法，时间知识图谱构建持久记忆。',
    color: 'text-teal-400',
    glow: 'shadow-teal-500/20',
  },
  {
    icon: Users,
    title: '数字分身',
    subtitle: 'Digital Clone',
    description: '4大角色化AI代理（CEO/CTO/Growth/Engineer），每日自主周期，Polsia式运行。',
    color: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
  {
    icon: Shield,
    title: '分布式存储',
    subtitle: 'Decentralized Storage',
    description: 'IPFS/Arweave可信存储，W3C可验证凭证，AFC公链锚定，证据链不可篡改。',
    color: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
]

// Agent vs Avatar comparison
const comparisonData = [
  { aspect: '交互方式', agent: '被动响应指令', avatar: '主动感知与行动' },
  { aspect: '记忆能力', agent: '无状态/短期记忆', avatar: '持久记忆宫殿+知识图谱' },
  { aspect: '人格特征', agent: '通用模板', avatar: 'SOUL.md人格基座' },
  { aspect: '决策能力', agent: '执行预设流程', avatar: '红蓝对抗自主决策' },
  { aspect: '协作模式', agent: '单任务线性', avatar: '蜂群并行协作' },
  { aspect: '进化路径', agent: '人工升级', avatar: '经验积累自动进化' },
]

// Tech stack
const techStack = [
  { name: 'AFC公链', icon: Globe, color: 'from-emerald-500 to-teal-600' },
  { name: 'IPFS', icon: Database, color: 'from-teal-500 to-cyan-600' },
  { name: 'Arweave', icon: Lock, color: 'from-amber-500 to-orange-600' },
  { name: 'W3C DID', icon: Fingerprint, color: 'from-violet-500 to-purple-600' },
  { name: '向量搜索', icon: Search, color: 'from-cyan-500 to-blue-600' },
  { name: 'LLM引擎', icon: Cpu, color: 'from-rose-500 to-pink-600' },
]

function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

// Stat counter animation
function AnimatedStat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 2000
    const increment = value / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
        {display.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      <ParticleField />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrollY > 50 ? 'rgba(10, 14, 26, 0.9)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid rgba(0, 212, 170, 0.1)' : 'none',
        }}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 h-9 w-9">
              <PiaoshuLogo size="sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">飘叔 Avatar OS</span>
              <span className="text-[9px] text-gray-500 font-mono">Web4.0 Digital Twin OS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-gray-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">核心能力</a>
            <a href="#comparison" className="hover:text-emerald-400 transition-colors">Agent vs Avatar</a>
            <a href="#tech" className="hover:text-emerald-400 transition-colors">技术栈</a>
            <a href="#manifesto" className="hover:text-emerald-400 transition-colors">创始人致辞</a>
            <a href="https://t.me/AvatarOS_Bot" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1">TG频道 <ExternalLink className="h-2.5 w-2.5" /></a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 text-xs h-8 gap-1"
              onClick={() => window.open('https://t.me/AvatarOS_Bot', '_blank')}
            >
              <Send className="h-3 w-3" />
              Telegram 频道
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs h-8"
              onClick={onLogin}
            >
              登录
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-xs h-8 shadow-lg shadow-emerald-500/20"
              onClick={onLogin}
            >
              开始体验
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Web4.0
                </Badge>
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] px-2">
                  <Eye className="h-3 w-3 mr-1" />
                  AI-Native
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  飘叔 Avatar OS
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 mt-3 font-light">
                Web4.0 数字孪生操作系统
              </p>
              <p className="text-sm sm:text-base text-gray-500 mt-4 max-w-lg leading-relaxed">
                将AI从执行者升维为共生体。认知引擎驱动决策，记忆宫殿沉淀智慧，
                数字分身自主运行——让智能成为你的超级杠杆。
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white shadow-xl shadow-emerald-500/20 px-8 gap-2 text-sm"
                  onClick={onLogin}
                >
                  <Zap className="h-4 w-4" />
                  登录系统
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white px-6 text-sm"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  了解更多
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-4 mt-10 pt-8 border-t border-gray-800/50">
                <AnimatedStat value={4} label="AI分身" />
                <AnimatedStat value={3} label="记忆层级" />
                <AnimatedStat value={99} suffix="%" label="决策准确率" />
                <AnimatedStat value={24} suffix="h" label="自主运行" />
              </div>
            </motion.div>

            {/* Right: Brain Visualization */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
              <BrainVisualization />

              {/* Floating badges around the visualization */}
              <motion.div
                className="absolute top-8 right-4 sm:right-8"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-2 py-1">
                  <Cpu className="h-3 w-3 mr-1" /> 认知引擎
                </Badge>
              </motion.div>
              <motion.div
                className="absolute bottom-16 left-2 sm:left-4"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] px-2 py-1">
                  <Users className="h-3 w-3 mr-1" /> 数字分身
                </Badge>
              </motion.div>
              <motion.div
                className="absolute top-1/3 left-0 sm:left-2"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[9px] px-2 py-1">
                  <Database className="h-3 w-3 mr-1" /> 记忆宫殿
                </Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2.5 mb-3">
              <Layers className="h-3 w-3 mr-1" /> Core Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              四大核心引擎
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              从认知到存储，从分身到协作，构建完整的AI原生操作系统
            </p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative rounded-2xl border border-gray-800/50 bg-gray-900/30 p-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-3 mb-4 ${feature.glow} shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="text-[10px] text-gray-500 font-mono mb-2">{feature.subtitle}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Agent vs Avatar Comparison Section */}
      <section id="comparison" className="py-16 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] px-2.5 mb-3">
              <Workflow className="h-3 w-3 mr-1" /> Paradigm Shift
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Agent vs Avatar
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              从工具到共生体，AI的范式跃迁
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 gap-0 border-b border-gray-800/50">
                <div className="p-3 sm:p-4 text-xs font-semibold text-gray-400">维度</div>
                <div className="p-3 sm:p-4 text-xs font-semibold text-gray-500 text-center border-x border-gray-800/50">
                  <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3" /> Agent</span>
                </div>
                <div className="p-3 sm:p-4 text-xs font-semibold text-emerald-400 text-center">
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Avatar</span>
                </div>
              </div>
              {/* Rows */}
              {comparisonData.map((row, i) => (
                <motion.div
                  key={row.aspect}
                  className="grid grid-cols-3 gap-0 border-b border-gray-800/30 last:border-b-0"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="p-3 sm:p-4 text-xs font-medium text-gray-300">{row.aspect}</div>
                  <div className="p-3 sm:p-4 text-xs text-gray-500 text-center border-x border-gray-800/30">{row.agent}</div>
                  <div className="p-3 sm:p-4 text-xs text-emerald-400/80 text-center">{row.avatar}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] px-2.5 mb-3">
              <GitBranch className="h-3 w-3 mr-1" /> Architecture
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              系统架构
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              从底层存储到顶层应用，全栈AI原生设计
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto grid gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Layer 1: Application */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">应用层 Application</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['认知引擎', '记忆宫殿', '数字分身', '证据链'].map((item) => (
                  <div key={item} className="rounded-lg bg-emerald-500/10 border border-emerald-500/10 px-3 py-2 text-center">
                    <span className="text-[11px] text-emerald-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer 2: Intelligence */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-semibold text-violet-400">智能层 Intelligence</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['SOUL.md人格', '红蓝对抗', 'AAAK压缩', '向量搜索'].map((item) => (
                  <div key={item} className="rounded-lg bg-violet-500/10 border border-violet-500/10 px-3 py-2 text-center">
                    <span className="text-[11px] text-violet-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer 3: Protocol */}
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-semibold text-teal-400">协议层 Protocol</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['AFC公链', 'W3C DID', 'XDP协议', '蜂群协作'].map((item) => (
                  <div key={item} className="rounded-lg bg-teal-500/10 border border-teal-500/10 px-3 py-2 text-center">
                    <span className="text-[11px] text-teal-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer 4: Storage */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-400">存储层 Storage</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['IPFS', 'Arweave', 'SQLite', '向量数据库'].map((item) => (
                  <div key={item} className="rounded-lg bg-amber-500/10 border border-amber-500/10 px-3 py-2 text-center">
                    <span className="text-[11px] text-amber-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-16 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/3 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-2.5 mb-3">
              <Server className="h-3 w-3 mr-1" /> Tech Stack
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              技术底座
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              去中心化、可验证、AI原生的全栈架构
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {techStack.map((tech) => (
              <motion.div
                key={tech.name}
                variants={itemVariants}
                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-800/50 bg-gray-900/30 p-4 hover:border-emerald-500/30 transition-all"
              >
                <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br ${tech.color} p-2.5 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <tech.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{tech.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Founder's Speech / Manifesto Section */}
      <section id="manifesto" className="py-16 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/3 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-2.5 mb-3">
              <Flame className="h-3 w-3 mr-1" /> Founder Manifesto
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              创始人致辞
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              在代码的镜像中找回灵魂，重构人机关系的未来
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-gray-900/60 via-[#0d1117] to-gray-900/60 p-6 sm:p-10 overflow-hidden">
              {/* Background decorations */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl" />

              {/* Quote icon */}
              <div className="relative z-10 mb-6">
                <Quote className="h-8 w-8 text-amber-500/40" />
              </div>

              {/* The Big Question */}
              <motion.div
                className="relative z-10 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold leading-relaxed text-center">
                  <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-violet-400 bg-clip-text text-transparent">
                    “我们倾尽智慧创造AI，难道就是为了让自己在代码的镜像中更加孤独吗？”
                  </span>
                </p>
              </motion.div>

              {/* Divider */}
              <div className="relative z-10 flex items-center gap-3 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <Flame className="h-4 w-4 text-amber-500/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
              </div>

              {/* Two products description */}
              <div className="relative z-10 grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                {/* Mirrome.me */}
                <motion.div
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Fingerprint className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Mirrome.me</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    你的本我意识锚点。在AI泛滥的时代，守护"我是谁"的终极答案。
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0.5">本我意识锚点</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0.5">M-Pata Protocol</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0.5">认知所有权</Badge>
                  </div>
                </motion.div>

                {/* panai.fun */}
                <motion.div
                  className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-bold text-violet-400">panai.fun</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    分身社交广场。让每个AI分身都拥有独立人格与社交能力，构建人机共生社区。
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] px-1.5 py-0.5">分身社交广场</Badge>
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] px-1.5 py-0.5">流体民主制</Badge>
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] px-1.5 py-0.5">情绪共识引擎</Badge>
                  </div>
                </motion.div>
              </div>

              {/* Closing statement */}
              <motion.div
                className="relative z-10 text-center mb-8"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-lg mx-auto">
                  让我们一起，在代码的镜像中找回灵魂，
                  <span className="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent font-semibold">
                    重构人机关系的未来。
                  </span>
                </p>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 text-xs h-9 gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('链接已复制，快分享给志同道合的人吧！')
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  分享理念
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-violet-600 hover:opacity-90 text-white text-xs h-9 gap-1.5 shadow-lg shadow-amber-500/20"
                  onClick={() => {
                    toast.success('🔥 产生共鸣！你并不孤独，我们一起前行')
                  }}
                >
                  <Heart className="h-3.5 w-3.5" />
                  产生共鸣
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-gray-900/50 to-teal-500/5 p-8 sm:p-12 text-center overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold">
                准备好进入
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> 飘叔 Avatar OS</span>
                了吗？
              </h2>
              <p className="text-sm text-gray-400 mt-3 max-w-md mx-auto">
                登录后即可体验完整的AI分身系统，解锁认知引擎、记忆宫殿和数字分身等核心能力
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white shadow-xl shadow-emerald-500/20 px-10 gap-2 text-sm"
                  onClick={onLogin}
                >
                  <Zap className="h-4 w-4" />
                  登录系统
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-gray-600 mt-4">
                管理员: Piaoshu001 · 演示: demo@piaoshu.ai
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <PiaoshuLogo size="sm" />
              <div>
                <span className="text-xs font-semibold">飘叔 Avatar OS</span>
                <span className="text-[9px] text-gray-600 font-mono ml-2">v0.1</span>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-[10px] text-gray-600">
              <a href="https://t.me/AvatarOS_Bot" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 cursor-pointer transition-colors flex items-center gap-1"><Send className="h-3 w-3" /> TG频道</a>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">白皮书</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">GitHub</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">AFC公链</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">API文档</span>
            </div>

            <div className="text-[10px] text-gray-700">
              © 2025 Piaoshu Avatar OS · Web4.0 Digital Twin
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
