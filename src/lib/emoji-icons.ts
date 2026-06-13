// Emoji Icon Map - Agent-Readable Format
// Each module and role has a corresponding emoji for quick AI agent identification

export const MODULE_EMOJIS = {
  dashboard: '📊',        // 总览 Dashboard
  avatar: '🧬',           // 分身系统 Avatar Clone
  cognitive: '🧠',        // 认知分片引擎 Cognitive Sharding
  evidence: '⛓️',         // 可信证据链 Evidence Chain
  collaboration: '🔄',    // 流体协作调度 Fluid Router
  sandbox: '🎲',          // 虚实共生沙盒 XDP Sandbox
  roadmap: '🗺️',          // 90天路线图 Roadmap
  subscription: '💎',     // 订阅方案 AFC Plans
  settings: '⚙️',         // 设置 Settings
} as const

export const AGENT_EMOJIS = {
  ceo: '👑',              // CEO Agent - 战略决策
  cto: '💻',              // CTO Agent - 技术架构
  growth: '🚀',           // Growth Agent - 增长营销
  engineer: '🔧',         // Engineer Agent - 工程执行
} as const

export const SKILL_EMOJIS = {
  strategy: '🎯',         // 战略规划
  coding: '👨‍💻',          // 代码开发
  marketing: '📣',        // 营销推广
  analytics: '📈',        // 数据分析
  design: '🎨',           // 产品设计
  email: '📧',            // 邮件管理
  social: '📱',           // 社媒运营
  finance: '💰',          // 财务分析
  legal: '⚖️',            // 法律合规
  research: '🔬',         // 研究分析
  writing: '✍️',          // 内容写作
  sales: '🤝',            // 销售商务
} as const

export const STATUS_EMOJIS = {
  active: '🟢',           // 运行中
  idle: '⚪',             // 空闲
  working: '🔵',          // 工作中
  sleeping: '😴',         // 休眠
  error: '🔴',            // 错误
  completed: '✅',        // 已完成
  pending: '🟡',          // 待处理
} as const

export const PAYMENT_EMOJIS = {
  afc: '🪙',              // AFC Token
  usdt: '💲',             // USDT
  usdc: '💵',             // USDC
  credit_card: '💳',      // Credit Card
  base_chain: '🔷',       // Base Chain
} as const

// Agent-readable full icon schema
export const ICON_SCHEMA = {
  modules: MODULE_EMOJIS,
  agents: AGENT_EMOJIS,
  skills: SKILL_EMOJIS,
  status: STATUS_EMOJIS,
  payment: PAYMENT_EMOJIS,
} as const

export type ModuleEmoji = keyof typeof MODULE_EMOJIS
export type AgentEmoji = keyof typeof AGENT_EMOJIS
export type SkillEmoji = keyof typeof SKILL_EMOJIS
