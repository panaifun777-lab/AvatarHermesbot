// Swarm Coordinator Mini-Service — Agent Swarm Intelligence
// Port: 3007 | Topology-aware task routing & agent communication

import { createServer, IncomingMessage, ServerResponse } from 'http'

const PORT = 3007

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SwarmAgent {
  id: string
  name: string
  role: string
  status: 'idle' | 'working' | 'sleeping' | 'error'
  workload: number  // 0-100
  capabilities: string[]
  domain: string
  avatar: string
  level: number
  experience: number
  lastActiveAt: string
}

interface SwarmTask {
  id: string
  title: string
  description: string
  priority: number  // 1-10
  taskType: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed'
  assignedTo: string | null
  assignedAgentName: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  distributionReason: string | null
}

interface SwarmMessage {
  id: string
  from: string
  fromName: string
  to: string
  toName: string
  type: 'task_assign' | 'task_complete' | 'help_request' | 'knowledge_share' | 'status_update' | 'coordination'
  content: string
  timestamp: string
}

interface RoutingScore {
  agentId: string
  agentName: string
  capabilityMatch: number
  workloadFactor: number
  domainExpertise: number
  availability: number
  totalScore: number
}

interface TopologyConfig {
  type: 'hierarchical' | 'mesh' | 'centralized' | 'hybrid'
  agents: string[]
  connections: [string, string][]
  createdAt: string
}

// ─── State ──────────────────────────────────────────────────────────────────────

const agents: SwarmAgent[] = [
  {
    id: 'agent-ceo',
    name: '飘叔CEO分身',
    role: 'CEO',
    status: 'idle',
    workload: 35,
    capabilities: ['战略决策', '愿景规划', '合作伙伴', '融资', '产品方向'],
    domain: 'strategy',
    avatar: '👑',
    level: 8,
    experience: 2450,
    lastActiveAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'agent-cto',
    name: '技术总监分身',
    role: 'CTO',
    status: 'working',
    workload: 72,
    capabilities: ['架构设计', '代码审查', '技术债务', '性能优化', '安全审计'],
    domain: 'engineering',
    avatar: '💻',
    level: 7,
    experience: 1980,
    lastActiveAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'agent-growth',
    name: '增长引擎分身',
    role: 'Growth',
    status: 'idle',
    workload: 48,
    capabilities: ['用户获取', '内容营销', '数据分析', 'A/B测试', '社区运营'],
    domain: 'growth',
    avatar: '🚀',
    level: 6,
    experience: 1520,
    lastActiveAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'agent-engineer',
    name: '工程执行分身',
    role: 'Engineer',
    status: 'working',
    workload: 85,
    capabilities: ['代码实现', '部署运维', 'CI/CD', 'Bug修复', 'API开发'],
    domain: 'engineering',
    avatar: '🔧',
    level: 9,
    experience: 3200,
    lastActiveAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'agent-design',
    name: '设计创意分身',
    role: 'Designer',
    status: 'idle',
    workload: 20,
    capabilities: ['UI设计', '品牌视觉', '交互原型', '用户体验', '设计系统'],
    domain: 'design',
    avatar: '🎨',
    level: 5,
    experience: 980,
    lastActiveAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'agent-data',
    name: '数据分析分身',
    role: 'DataAnalyst',
    status: 'sleeping',
    workload: 10,
    capabilities: ['数据建模', 'BI报表', '预测分析', '数据管道', '机器学习'],
    domain: 'data',
    avatar: '📊',
    level: 6,
    experience: 1650,
    lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

const tasks: SwarmTask[] = [
  {
    id: 'task-001',
    title: '重构认证模块',
    description: '将现有JWT认证迁移到NextAuth v5，支持多因素认证',
    priority: 8,
    taskType: 'engineering',
    status: 'in_progress',
    assignedTo: 'agent-engineer',
    assignedAgentName: '工程执行分身',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: null,
    distributionReason: '工程执行分身具有最高工程能力和CI/CD经验',
  },
  {
    id: 'task-002',
    title: 'Q2增长策略制定',
    description: '分析Q1数据，制定Q2用户增长策略和渠道优化方案',
    priority: 9,
    taskType: 'strategy',
    status: 'assigned',
    assignedTo: 'agent-growth',
    assignedAgentName: '增长引擎分身',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2400000).toISOString(),
    completedAt: null,
    distributionReason: '增长引擎分身拥有完整的数据分析和营销能力',
  },
  {
    id: 'task-003',
    title: 'API性能优化',
    description: '优化关键API端点响应时间，目标P99 < 200ms',
    priority: 7,
    taskType: 'engineering',
    status: 'pending',
    assignedTo: null,
    assignedAgentName: null,
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 5400000).toISOString(),
    completedAt: null,
    distributionReason: null,
  },
  {
    id: 'task-004',
    title: '品牌视觉升级',
    description: '重新设计Logo和品牌色彩系统，保持飘叔风格',
    priority: 5,
    taskType: 'design',
    status: 'completed',
    assignedTo: 'agent-design',
    assignedAgentName: '设计创意分身',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    completedAt: new Date(Date.now() - 43200000).toISOString(),
    distributionReason: '设计创意分身擅长品牌视觉和用户体验设计',
  },
  {
    id: 'task-005',
    title: '微服务架构评审',
    description: '评审现有单体架构，规划微服务拆分路线图',
    priority: 6,
    taskType: 'architecture',
    status: 'assigned',
    assignedTo: 'agent-cto',
    assignedAgentName: '技术总监分身',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: null,
    distributionReason: '技术总监分身具有架构设计和安全审计专长',
  },
  {
    id: 'task-006',
    title: '用户留存率分析',
    description: '分析30天留存漏斗，识别关键流失节点',
    priority: 7,
    taskType: 'analytics',
    status: 'pending',
    assignedTo: null,
    assignedAgentName: null,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    completedAt: null,
    distributionReason: null,
  },
  {
    id: 'task-007',
    title: '合作伙伴BD邮件',
    description: '撰写3封潜在合作伙伴的BD邮件草稿',
    priority: 4,
    taskType: 'communication',
    status: 'pending',
    assignedTo: null,
    assignedAgentName: null,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    updatedAt: new Date(Date.now() - 18000000).toISOString(),
    completedAt: null,
    distributionReason: null,
  },
]

const messages: SwarmMessage[] = [
  {
    id: 'msg-001',
    from: 'agent-cto',
    fromName: '技术总监',
    to: 'agent-engineer',
    toName: '工程执行',
    type: 'task_assign',
    content: '重构认证模块的技术方案已确认，请按计划执行。关键注意点：1) 保持向后兼容 2) 迁移窗口不超过4小时',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg-002',
    from: 'agent-engineer',
    fromName: '工程执行',
    to: 'agent-cto',
    toName: '技术总监',
    type: 'help_request',
    content: '认证迁移过程中遇到OAuth回调URL配置问题，需要确认是否支持自定义域名回调？',
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'msg-003',
    from: 'agent-ceo',
    fromName: 'CEO分身',
    to: 'agent-growth',
    toName: '增长引擎',
    type: 'task_assign',
    content: 'Q2增长策略需要重点考虑AI原生产品的增长飞轮效应，用户获取成本控制在¥50以内',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'msg-004',
    from: 'agent-design',
    fromName: '设计创意',
    to: 'agent-ceo',
    toName: 'CEO分身',
    type: 'task_complete',
    content: '品牌视觉升级完成！新Logo采用飘叔标志性绿色+渐变设计，品牌色板已同步到Figma',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'msg-005',
    from: 'agent-growth',
    fromName: '增长引擎',
    to: 'agent-data',
    toName: '数据分析',
    type: 'knowledge_share',
    content: '分享：最近A/B测试发现，AI分身介绍页的转化率比功能列表页高37%，建议所有着陆页采用人格化叙事',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-006',
    from: 'agent-cto',
    fromName: '技术总监',
    to: 'agent-data',
    toName: '数据分析',
    type: 'coordination',
    content: '微服务架构评审需要你提供系统流量分布数据和数据库查询热力图',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
]

const routingHistory: RoutingScore[][] = [
  [
    { agentId: 'agent-engineer', agentName: '工程执行', capabilityMatch: 95, workloadFactor: 30, domainExpertise: 90, availability: 40, totalScore: 72 },
    { agentId: 'agent-cto', agentName: '技术总监', capabilityMatch: 80, workloadFactor: 55, domainExpertise: 85, availability: 50, totalScore: 68 },
    { agentId: 'agent-data', agentName: '数据分析', capabilityMatch: 40, workloadFactor: 85, domainExpertise: 30, availability: 90, totalScore: 55 },
    { agentId: 'agent-growth', agentName: '增长引擎', capabilityMatch: 25, workloadFactor: 60, domainExpertise: 15, availability: 70, totalScore: 40 },
    { agentId: 'agent-design', agentName: '设计创意', capabilityMatch: 15, workloadFactor: 80, domainExpertise: 10, availability: 90, totalScore: 42 },
    { agentId: 'agent-ceo', agentName: 'CEO分身', capabilityMatch: 20, workloadFactor: 50, domainExpertise: 25, availability: 85, totalScore: 42 },
  ],
  [
    { agentId: 'agent-growth', agentName: '增长引擎', capabilityMatch: 90, workloadFactor: 60, domainExpertise: 85, availability: 70, totalScore: 78 },
    { agentId: 'agent-ceo', agentName: 'CEO分身', capabilityMatch: 75, workloadFactor: 50, domainExpertise: 80, availability: 85, totalScore: 71 },
    { agentId: 'agent-data', agentName: '数据分析', capabilityMatch: 70, workloadFactor: 85, domainExpertise: 65, availability: 90, totalScore: 75 },
    { agentId: 'agent-cto', agentName: '技术总监', capabilityMatch: 30, workloadFactor: 55, domainExpertise: 20, availability: 50, totalScore: 36 },
    { agentId: 'agent-engineer', agentName: '工程执行', capabilityMatch: 20, workloadFactor: 30, domainExpertise: 15, availability: 40, totalScore: 25 },
    { agentId: 'agent-design', agentName: '设计创意', capabilityMatch: 35, workloadFactor: 80, domainExpertise: 25, availability: 90, totalScore: 54 },
  ],
  [
    { agentId: 'agent-cto', agentName: '技术总监', capabilityMatch: 88, workloadFactor: 55, domainExpertise: 92, availability: 50, totalScore: 73 },
    { agentId: 'agent-engineer', agentName: '工程执行', capabilityMatch: 75, workloadFactor: 30, domainExpertise: 80, availability: 40, totalScore: 58 },
    { agentId: 'agent-ceo', agentName: 'CEO分身', capabilityMatch: 60, workloadFactor: 50, domainExpertise: 55, availability: 85, totalScore: 60 },
    { agentId: 'agent-data', agentName: '数据分析', capabilityMatch: 45, workloadFactor: 85, domainExpertise: 35, availability: 90, totalScore: 60 },
    { agentId: 'agent-growth', agentName: '增长引擎', capabilityMatch: 20, workloadFactor: 60, domainExpertise: 15, availability: 70, totalScore: 38 },
    { agentId: 'agent-design', agentName: '设计创意', capabilityMatch: 10, workloadFactor: 80, domainExpertise: 5, availability: 90, totalScore: 40 },
  ],
]

let currentTopology: TopologyConfig = {
  type: 'hierarchical',
  agents: agents.map(a => a.id),
  connections: [
    ['agent-ceo', 'agent-cto'],
    ['agent-ceo', 'agent-growth'],
    ['agent-cto', 'agent-engineer'],
    ['agent-cto', 'agent-data'],
    ['agent-growth', 'agent-design'],
    ['agent-data', 'agent-engineer'],
  ],
  createdAt: new Date().toISOString(),
}

let swarmInitialized = true

// ─── Helpers ────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(JSON.stringify(data))
}

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer | string) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Route Handlers ─────────────────────────────────────────────────────────────

function handleStatus(): Record<string, unknown> {
  const activeAgents = agents.filter(a => a.status === 'working' || a.status === 'idle').length
  const pendingTasks = tasks.filter(t => t.status === 'pending').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const avgWorkload = Math.round(agents.reduce((s, a) => s + a.workload, 0) / agents.length)

  return {
    ok: true,
    data: {
      initialized: swarmInitialized,
      topologyType: currentTopology.type,
      agentCount: agents.length,
      activeAgents,
      taskStats: { pending: pendingTasks, assigned: tasks.filter(t => t.status === 'assigned').length, inProgress: inProgressTasks, completed: completedTasks },
      avgWorkload,
      messageCount: messages.length,
      lastActivity: new Date().toISOString(),
    },
  }
}

function handleGetAgents(): Record<string, unknown> {
  return { ok: true, data: { agents } }
}

function handleRegisterAgent(body: Record<string, unknown>): Record<string, unknown> {
  const name = typeof body.name === 'string' ? body.name : 'New Agent'
  const role = typeof body.role === 'string' ? body.role : 'General'
  const capabilities = Array.isArray(body.capabilities) ? body.capabilities : []
  const domain = typeof body.domain === 'string' ? body.domain : 'general'

  const newAgent: SwarmAgent = {
    id: generateId('agent'),
    name,
    role,
    status: 'idle',
    workload: 0,
    capabilities,
    domain,
    avatar: '🤖',
    level: 1,
    experience: 0,
    lastActiveAt: new Date().toISOString(),
  }
  agents.push(newAgent)

  if (currentTopology.type === 'mesh') {
    for (const a of agents.filter(a => a.id !== newAgent.id)) {
      currentTopology.connections.push([newAgent.id, a.id])
    }
  } else {
    currentTopology.connections.push(['agent-ceo', newAgent.id])
  }

  return { ok: true, data: { agent: newAgent } }
}

function handleGetTasks(): Record<string, unknown> {
  return { ok: true, data: { tasks } }
}

function handleCreateTask(body: Record<string, unknown>): Record<string, unknown> {
  const title = typeof body.title === 'string' ? body.title : 'Untitled Task'
  const description = typeof body.description === 'string' ? body.description : ''
  const priority = typeof body.priority === 'number' ? Math.min(10, Math.max(1, body.priority)) : 5
  const taskType = typeof body.taskType === 'string' ? body.taskType : 'general'

  const newTask: SwarmTask = {
    id: generateId('task'),
    title,
    description,
    priority,
    taskType,
    status: 'pending',
    assignedTo: null,
    assignedAgentName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    distributionReason: null,
  }
  tasks.unshift(newTask)

  return { ok: true, data: { task: newTask } }
}

function handleInitSwarm(body: Record<string, unknown>): Record<string, unknown> {
  const topologyType = typeof body.topologyType === 'string' ? body.topologyType : 'hierarchical'
  const validTypes = ['hierarchical', 'mesh', 'centralized', 'hybrid']

  if (!validTypes.includes(topologyType)) {
    return { ok: false, error: `Invalid topology type. Must be one of: ${validTypes.join(', ')}` }
  }

  const connections: [string, string][] = []
  const agentIds = agents.map(a => a.id)

  switch (topologyType) {
    case 'hierarchical':
      connections.push(['agent-ceo', 'agent-cto'])
      connections.push(['agent-ceo', 'agent-growth'])
      connections.push(['agent-cto', 'agent-engineer'])
      connections.push(['agent-cto', 'agent-data'])
      connections.push(['agent-growth', 'agent-design'])
      break
    case 'mesh':
      for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
          connections.push([agentIds[i], agentIds[j]])
        }
      }
      break
    case 'centralized':
      for (const id of agentIds) {
        if (id !== 'agent-ceo') {
          connections.push(['agent-ceo', id])
        }
      }
      break
    case 'hybrid':
      connections.push(['agent-ceo', 'agent-cto'])
      connections.push(['agent-ceo', 'agent-growth'])
      connections.push(['agent-cto', 'agent-engineer'])
      connections.push(['agent-cto', 'agent-data'])
      connections.push(['agent-growth', 'agent-design'])
      connections.push(['agent-data', 'agent-engineer'])
      connections.push(['agent-growth', 'agent-data'])
      break
  }

  currentTopology = {
    type: topologyType as TopologyConfig['type'],
    agents: agentIds,
    connections,
    createdAt: new Date().toISOString(),
  }
  swarmInitialized = true

  return { ok: true, data: { topology: currentTopology } }
}

function handleDistribute(): Record<string, unknown> {
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const distributionResults: Array<{ taskId: string; assignedTo: string; reason: string; scores: RoutingScore[] }> = []

  for (const task of pendingTasks) {
    const scores = agents.map(agent => {
      let capabilityMatch = 30
      const taskDomainMap: Record<string, string[]> = {
        engineering: ['engineering', 'architecture'],
        strategy: ['strategy'],
        growth: ['growth'],
        design: ['design'],
        analytics: ['data'],
        communication: ['strategy', 'growth'],
        general: ['general'],
      }
      const relevantDomains = taskDomainMap[task.taskType] || ['general']
      if (relevantDomains.includes(agent.domain)) capabilityMatch += 50
      if (agent.capabilities.some(c => task.title.includes(c) || task.description.includes(c))) capabilityMatch += 20
      capabilityMatch = Math.min(100, capabilityMatch)

      const workloadFactor = Math.max(0, 100 - agent.workload)
      const domainExpertise = Math.min(100, agent.level * 10 + agent.experience / 50)

      let availability = 80
      if (agent.status === 'working') availability = 40
      if (agent.status === 'sleeping') availability = 20
      if (agent.status === 'error') availability = 0

      const totalScore = Math.round(capabilityMatch * 0.35 + workloadFactor * 0.25 + domainExpertise * 0.25 + availability * 0.15)

      return {
        agentId: agent.id,
        agentName: agent.name.replace('分身', ''),
        capabilityMatch,
        workloadFactor,
        domainExpertise,
        availability,
        totalScore,
      }
    }).sort((a, b) => b.totalScore - a.totalScore)

    const best = scores[0]
    const agent = agents.find(a => a.id === best.agentId)
    if (agent) {
      task.assignedTo = agent.id
      task.assignedAgentName = agent.name
      task.status = 'assigned'
      task.updatedAt = new Date().toISOString()
      task.distributionReason = `${agent.name}获得最高评分${best.totalScore}分（能力匹配${best.capabilityMatch}·负载因子${best.workloadFactor}·领域专长${best.domainExpertise}·可用性${best.availability}）`
      agent.workload = Math.min(100, agent.workload + 15)
      agent.status = 'working'

      const msg: SwarmMessage = {
        id: generateId('msg'),
        from: 'agent-ceo',
        fromName: 'CEO分身',
        to: agent.id,
        toName: agent.name.replace('分身', ''),
        type: 'task_assign',
        content: `任务「${task.title}」已分配给你，优先级${task.priority}/10。${task.distributionReason}`,
        timestamp: new Date().toISOString(),
      }
      messages.unshift(msg)

      routingHistory.unshift(scores)
      if (routingHistory.length > 10) routingHistory.pop()

      distributionResults.push({
        taskId: task.id,
        assignedTo: agent.id,
        reason: task.distributionReason,
        scores,
      })
    }
  }

  return { ok: true, data: { distributed: distributionResults.length, results: distributionResults } }
}

function handleGetTopology(): Record<string, unknown> {
  return { ok: true, data: { topology: currentTopology, agents: agents.map(a => ({ id: a.id, name: a.name, role: a.role, status: a.status })) } }
}

function handleGetMessages(): Record<string, unknown> {
  return { ok: true, data: { messages: messages.slice(0, 50), total: messages.length } }
}

function handleSendMessage(body: Record<string, unknown>): Record<string, unknown> {
  const from = typeof body.from === 'string' ? body.from : 'agent-ceo'
  const to = typeof body.to === 'string' ? body.to : 'broadcast'
  const type = typeof body.type === 'string' ? body.type : 'coordination'
  const content = typeof body.content === 'string' ? body.content : ''

  if (!content) {
    return { ok: false, error: 'Message content is required' }
  }

  const fromAgent = agents.find(a => a.id === from)
  const toAgent = agents.find(a => a.id === to)

  const msg: SwarmMessage = {
    id: generateId('msg'),
    from,
    fromName: fromAgent?.name.replace('分身', '') || from,
    to,
    toName: toAgent?.name.replace('分身', '') || (to === 'broadcast' ? '全体' : to),
    type: type as SwarmMessage['type'],
    content,
    timestamp: new Date().toISOString(),
  }
  messages.unshift(msg)

  return { ok: true, data: { message: msg } }
}

function handleGetRoutingScores(): Record<string, unknown> {
  return { ok: true, data: { history: routingHistory.slice(0, 5) } }
}

// ─── HTTP Server ────────────────────────────────────────────────────────────────

const httpServer = createServer(async (req, res) => {
  const url = req.url || '/'
  const [path] = url.split('?')
  const method = req.method || 'GET'

  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  try {
    if (method === 'GET') {
      if (path === '/api/swarm/status') { sendJson(res, handleStatus()); return }
      if (path === '/api/swarm/agents') { sendJson(res, handleGetAgents()); return }
      if (path === '/api/swarm/tasks') { sendJson(res, handleGetTasks()); return }
      if (path === '/api/swarm/topology') { sendJson(res, handleGetTopology()); return }
      if (path === '/api/swarm/messages') { sendJson(res, handleGetMessages()); return }
      if (path === '/api/swarm/routing-scores') { sendJson(res, handleGetRoutingScores()); return }
      sendJson(res, { ok: false, error: 'Not found' }, 404)
      return
    }

    if (method === 'POST') {
      const body = await parseBody(req)

      if (path === '/api/swarm/agents') { sendJson(res, handleRegisterAgent(body)); return }
      if (path === '/api/swarm/tasks') { sendJson(res, handleCreateTask(body)); return }
      if (path === '/api/swarm/init') { sendJson(res, handleInitSwarm(body)); return }
      if (path === '/api/swarm/distribute') { sendJson(res, handleDistribute()); return }
      if (path === '/api/swarm/messages') { sendJson(res, handleSendMessage(body)); return }
      if (path === '/api/swarm/advance-task') {
        const taskId = typeof body.taskId === 'string' ? body.taskId : ''
        const task = tasks.find(t => t.id === taskId)
        if (!task) { sendJson(res, { ok: false, error: 'Task not found' }, 404); return }
        const statusOrder: SwarmTask['status'][] = ['pending', 'assigned', 'in_progress', 'completed']
        const currentIdx = statusOrder.indexOf(task.status)
        if (currentIdx >= statusOrder.length - 1) { sendJson(res, { ok: false, error: 'Task already completed' }); return }
        task.status = statusOrder[currentIdx + 1]
        task.updatedAt = new Date().toISOString()
        if (task.status === 'completed') {
          task.completedAt = new Date().toISOString()
          if (task.assignedTo) {
            const agent = agents.find(a => a.id === task.assignedTo)
            if (agent) {
              agent.workload = Math.max(0, agent.workload - 15)
              if (agent.workload < 30) agent.status = 'idle'
            }
          }
        } else if (task.status === 'in_progress' && task.assignedTo) {
          const agent = agents.find(a => a.id === task.assignedTo)
          if (agent) agent.status = 'working'
        }
        sendJson(res, { ok: true, data: { task } }); return
      }

      sendJson(res, { ok: false, error: 'Not found' }, 404)
      return
    }

    sendJson(res, { ok: false, error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('[swarm-service] Error:', err)
    sendJson(res, { ok: false, error: 'Internal server error' }, 500)
  }
})

httpServer.listen(PORT, () => {
  console.log(`[swarm-service] Running on port ${PORT}`)
  console.log(`[swarm-service] Agents: ${agents.length}, Tasks: ${tasks.length}, Messages: ${messages.length}`)
})

process.on('SIGTERM', () => {
  console.log('[swarm-service] Received SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[swarm-service] Received SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
