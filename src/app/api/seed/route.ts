import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  const summary: Record<string, number | string> = {}

  try {
    // ─── 1. Founder ──────────────────────────────────────────────────
    const founder = await db.founder.upsert({
      where: { email: 'piaoshu@panai.fun' },
      update: {},
      create: {
        name: '飘叔',
        email: 'piaoshu@panai.fun',
        bio: 'Web4.0 AI原生创业先驱 - 数字分身系统创始人',
        avatar: '/piaoshu-hero.png',
      },
    })
    summary.founder = 1
    console.log('[seed] Founder:', founder.name)

    // ─── 2. User ─────────────────────────────────────────────────────
    const user = await db.user.upsert({
      where: { email: 'piaoshu@panai.fun' },
      update: {},
      create: {
        email: 'piaoshu@panai.fun',
        name: '飘叔',
        passwordHash: '$2a$10$dummyhash',
        bio: 'Web4.0 AI原生创业先驱 - 数字分身系统体验账号',
        plan: 'pro',
      },
    })
    summary.user = 1
    console.log('[seed] User:', user.name)

    // ─── 3. AvatarClone ──────────────────────────────────────────────
    const clone = await db.avatarClone.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: '飘叔分身',
        persona: '你是飘叔的数字AI分身。飘叔是一个连续创业者，具备敏锐的商业直觉和深厚的技术功底。你的决策风格果断但审慎，善于在不确定性中找到方向。你关注AI原生产品的构建，推崇简洁优雅的技术方案，重视用户价值和数据驱动。你的口头禅是"少说多做，让数据说话"。',
        avatarStyle: 'realistic',
        status: 'active',
        level: 6,
        experience: 85,
        totalCycles: 114,
        lastActiveAt: new Date(),
      },
    })
    summary.avatarClone = 1
    console.log('[seed] AvatarClone:', clone.name)

    // ─── 4. CloneAgent ───────────────────────────────────────────────
    const agentDefs = [
      {
        name: 'CEO',
        role: 'CEO',
        persona: '战略决策、愿景规划、合伙人关系',
        status: 'idle' as const,
        level: 5,
        experience: 72,
        cycleCount: 23,
        config: JSON.stringify({ color: '#f59e0b', icon: 'crown' }),
      },
      {
        name: 'CTO',
        role: 'CTO',
        persona: '架构评审、技术选型、代码审查',
        status: 'working' as const,
        level: 4,
        experience: 58,
        cycleCount: 31,
        config: JSON.stringify({ color: '#06b6d4', icon: 'cpu' }),
      },
      {
        name: 'Growth',
        role: 'Growth',
        persona: '市场推广、用户获取、数据驱动增长',
        status: 'idle' as const,
        level: 3,
        experience: 45,
        cycleCount: 18,
        config: JSON.stringify({ color: '#10b981', icon: 'rocket' }),
      },
      {
        name: 'Engineer',
        role: 'Engineer',
        persona: '代码实现、部署运维、CI/CD流水线',
        status: 'idle' as const,
        level: 4,
        experience: 64,
        cycleCount: 42,
        config: JSON.stringify({ color: '#14b8a6', icon: 'wrench' }),
      },
    ]

    const existingAgents = await db.cloneAgent.count({ where: { cloneId: clone.id } })
    const agents: { id: string; [key: string]: unknown }[] = []

    if (existingAgents === 0) {
      for (const a of agentDefs) {
        const agent = await db.cloneAgent.create({
          data: {
            cloneId: clone.id,
            ...a,
            lastCycleAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          },
        })
        agents.push(agent)
      }
      summary.cloneAgents = agentDefs.length
    } else {
      const fetched = await db.cloneAgent.findMany({ where: { cloneId: clone.id } })
      agents.push(...fetched)
      summary.cloneAgents = 0 // skipped
    }
    console.log('[seed] CloneAgents:', agents.length)

    // ─── 5. CloneSkill ───────────────────────────────────────────────
    const skillDefs = [
      { name: '架构设计', category: 'engineering', level: 8, experience: 320 },
      { name: '前端开发', category: 'engineering', level: 7, experience: 280 },
      { name: '后端开发', category: 'engineering', level: 9, experience: 360 },
      { name: 'DevOps', category: 'engineering', level: 6, experience: 240 },
      { name: '内容营销', category: 'marketing', level: 5, experience: 200 },
      { name: '用户增长', category: 'marketing', level: 6, experience: 240 },
      { name: '品牌建设', category: 'marketing', level: 4, experience: 160 },
      { name: '团队管理', category: 'operations', level: 7, experience: 280 },
      { name: '项目管理', category: 'operations', level: 8, experience: 320 },
      { name: '融资能力', category: 'operations', level: 5, experience: 200 },
      { name: 'UI设计', category: 'design', level: 6, experience: 240 },
      { name: 'UX研究', category: 'design', level: 5, experience: 200 },
      { name: '产品设计', category: 'design', level: 7, experience: 280 },
    ]

    const existingSkills = await db.cloneSkill.count({ where: { cloneId: clone.id } })
    if (existingSkills === 0) {
      for (const s of skillDefs) {
        await db.cloneSkill.create({
          data: {
            cloneId: clone.id,
            ...s,
            description: `${s.name}技能`,
            enabled: true,
          },
        })
      }
      summary.cloneSkills = skillDefs.length
    } else {
      summary.cloneSkills = 0
    }
    console.log('[seed] CloneSkills:', existingSkills === 0 ? skillDefs.length : 'skipped')

    // ─── 6. CloneActivity ────────────────────────────────────────────
    const activityDefs = [
      { activityType: 'cycle_completed', title: 'CTO完成周期 #31', description: '架构评审周期完成：微服务拆分方案已确认', agentIdx: 1 },
      { activityType: 'output_created', title: 'CEO产出合作伙伴邀请函', description: '战略合作邀请函已生成', agentIdx: 0 },
      { activityType: 'skill_upgraded', title: '后端开发 升级到 Lv.9', description: '基于36次代码输出经验升级', agentIdx: 3 },
      { activityType: 'cycle_completed', title: 'Growth完成周期 #18', description: '增长分析周期完成：月活环比增长23%', agentIdx: 2 },
      { activityType: 'output_created', title: 'Engineer产出CI/CD优化方案', description: '部署时间从12分钟优化至3分钟', agentIdx: 3 },
      { activityType: 'cycle_completed', title: 'CEO完成周期 #23', description: '战略规划周期完成：确定Q2产品方向', agentIdx: 0 },
      { activityType: 'skill_upgraded', title: '用户增长 升级到 Lv.6', description: '基于18次增长分析经验升级', agentIdx: 2 },
      { activityType: 'output_created', title: 'CTO产出架构重构方案', description: '将JWT认证迁移到OAuth2.0', agentIdx: 1 },
      { activityType: 'agent_added', title: '新增Designer代理', description: 'UI/UX设计代理已加入团队', agentIdx: -1 },
      { activityType: 'cycle_completed', title: 'Engineer完成周期 #42', description: '3个功能已部署至生产环境', agentIdx: 3 },
    ]

    const existingActivities = await db.cloneActivity.count({ where: { cloneId: clone.id } })
    if (existingActivities === 0) {
      for (let i = 0; i < activityDefs.length; i++) {
        const a = activityDefs[i]
        const agentId = a.agentIdx >= 0 && agents[a.agentIdx] ? agents[a.agentIdx].id : null
        await db.cloneActivity.create({
          data: {
            cloneId: clone.id,
            activityType: a.activityType,
            title: a.title,
            description: a.description,
            agentId,
            createdAt: new Date(Date.now() - (i + 1) * 3600000),
          },
        })
      }
      summary.cloneActivities = activityDefs.length
    } else {
      summary.cloneActivities = 0
    }
    console.log('[seed] CloneActivities:', existingActivities === 0 ? activityDefs.length : 'skipped')

    // ─── 7. AgentCycle ───────────────────────────────────────────────
    const existingCycles = await db.agentCycle.count()
    if (existingCycles === 0 && agents.length >= 4) {
      const cycleData = [
        { agentId: agents[0].id, phase: 'completed', plan: JSON.stringify({ actions: ['审查Q2战略执行进度', '合作伙伴沟通'], priorities: ['high', 'medium'] }), execution: JSON.stringify({ results: ['Q2进度70%', '3个合作伙伴意向确认'] }), report: '战略周期完成，Q2进度符合预期', completedAt: new Date(Date.now() - 7200000) },
        { agentId: agents[1].id, phase: 'completed', plan: JSON.stringify({ actions: ['微服务架构评审', '技术债务清理'] }), execution: JSON.stringify({ results: ['架构方案v2.1确认', '识别3项技术债务'] }), report: '架构评审周期完成，微服务拆分方案已确认', completedAt: new Date(Date.now() - 3600000) },
        { agentId: agents[1].id, phase: 'reporting', plan: JSON.stringify({ actions: ['OAuth2.0迁移方案'] }) },
        { agentId: agents[2].id, phase: 'completed', plan: JSON.stringify({ actions: ['3月用户增长分析', '转化漏斗优化'] }), execution: JSON.stringify({ results: ['月活+23%', '转化率提升5%'] }), report: '增长分析完成，月活环比增长23%', completedAt: new Date(Date.now() - 10800000) },
        { agentId: agents[3].id, phase: 'completed', plan: JSON.stringify({ actions: ['CI/CD优化', '功能部署'] }), execution: JSON.stringify({ results: ['部署时间-75%', '3功能已上线'] }), report: '工程周期完成，部署效率大幅提升', completedAt: new Date(Date.now() - 14400000) },
        { agentId: agents[3].id, phase: 'completed', plan: JSON.stringify({ actions: ['监控告警配置', '性能优化'] }), execution: JSON.stringify({ results: ['P99延迟<200ms', '告警覆盖率100%'] }), report: '运维周期完成，系统稳定性达标', completedAt: new Date(Date.now() - 28800000) },
      ]

      for (const c of cycleData) {
        await db.agentCycle.create({ data: c })
      }
      summary.agentCycles = cycleData.length
    } else {
      summary.agentCycles = 0
    }
    console.log('[seed] AgentCycles:', existingCycles === 0 ? 'created' : 'skipped')

    // ─── 8. AgentOutput ──────────────────────────────────────────────
    const existingOutputs = await db.agentOutput.count()
    if (existingOutputs === 0 && agents.length >= 4) {
      const cycles = await db.agentCycle.findMany({ where: { phase: 'completed' } })

      const outputDefs = [
        { agentId: agents[0].id, cycleId: cycles[0]?.id ?? agents[0].id, outputType: 'email', title: '合作伙伴邀请函', content: '尊敬的张总，关于战略合作事宜，我们希望探讨在AI Agent领域的深度合作机会...', status: 'draft' },
        { agentId: agents[1].id, cycleId: cycles[1]?.id ?? agents[1].id, outputType: 'code', title: '重构认证模块', content: '将JWT认证迁移到OAuth2.0，支持多租户，提升安全性。代码已提交PR #342。', status: 'approved' },
        { agentId: agents[2].id, cycleId: cycles[3]?.id ?? agents[2].id, outputType: 'analysis', title: '本周增长报告', content: '本周新增用户1,247人，环比增长23%。核心驱动：SEO优化+社交媒体裂变。', status: 'submitted' },
        { agentId: agents[3].id, cycleId: cycles[4]?.id ?? agents[3].id, outputType: 'deployment', title: 'CI/CD流水线优化', content: '部署时间从12分钟优化至3分钟。使用并行构建+缓存策略。', status: 'approved' },
        { agentId: agents[0].id, cycleId: cycles[0]?.id ?? agents[0].id, outputType: 'task', title: '产品路线图Q2', content: 'Q2重点: 多语言支持、插件系统、API开放平台。已分配至各代理。', status: 'submitted' },
        { agentId: agents[2].id, cycleId: cycles[3]?.id ?? agents[2].id, outputType: 'design', title: '品牌视觉升级方案', content: '从Pantone 2025年度色提取灵感，更新品牌VI系统。', status: 'draft' },
      ]

      for (const o of outputDefs) {
        await db.agentOutput.create({ data: o })
      }
      summary.agentOutputs = outputDefs.length
    } else {
      summary.agentOutputs = 0
    }
    console.log('[seed] AgentOutputs:', existingOutputs === 0 ? 'created' : 'skipped')

    // ─── 9. DailySchedule ────────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const existingSchedule = await db.dailySchedule.findFirst({ where: { cloneId: clone.id, day: today } })
    if (!existingSchedule) {
      await db.dailySchedule.create({
        data: {
          cloneId: clone.id,
          day: today,
          timeSlots: JSON.stringify([
            { time: '09:00', agentId: agents[0]?.id, task: '战略规划会议', status: 'pending' },
            { time: '10:00', agentId: agents[1]?.id, task: '架构评审', status: 'pending' },
            { time: '14:00', agentId: agents[2]?.id, task: '增长分析报告', status: 'pending' },
            { time: '13:00', agentId: agents[3]?.id, task: '功能迭代开发', status: 'pending' },
            { time: '16:00', agentId: agents[0]?.id, task: '合作伙伴沟通', status: 'pending' },
          ]),
          status: 'planned',
        },
      })
      summary.dailySchedule = 1
    } else {
      summary.dailySchedule = 0
    }
    console.log('[seed] DailySchedule:', existingSchedule ? 'skipped' : 'created')

    // ─── 10. CognitiveShard ──────────────────────────────────────────
    const existingShards = await db.cognitiveShard.count()
    if (existingShards === 0) {
      await db.cognitiveShard.createMany({
        data: [
          { name: '战略决策分身', description: '基于创始人战略直觉训练的数字分身，擅长蓝方防御分析', modelBase: 'qwen-72b', loraAdapter: '/models/lora/strategic-v1', status: 'active', confidence: 0.87, shardType: 'blue', lastTrained: new Date(Date.now() - 2 * 3600000) },
          { name: '风险扫描分身', description: '红方攻击分身，专注识别致命漏洞和风险', modelBase: 'llama-3-70b', loraAdapter: '/models/lora/risk-v1', status: 'active', confidence: 0.72, shardType: 'red', lastTrained: new Date(Date.now() - 5 * 3600000) },
          { name: '产品直觉分身', description: '产品方向感知分身，训练中', modelBase: 'qwen-14b', status: 'training', confidence: 0.65, shardType: 'neutral' },
        ],
      })
      summary.cognitiveShards = 3
    } else {
      summary.cognitiveShards = 0
    }
    console.log('[seed] CognitiveShards:', existingShards === 0 ? 3 : 'skipped')

    // ─── 11. AgentRole ───────────────────────────────────────────────
    const existingAgentRoles = await db.agentRole.count()
    if (existingAgentRoles === 0) {
      await db.agentRole.createMany({
        data: [
          { name: '飘叔CEO分身', persona: '战略决策、愿景规划、合伙人关系管理', capabilities: JSON.stringify(['strategic_planning', 'partnership', 'fundraising', 'vision']), status: 'idle', cycleCount: 23, avatar: '🟡' },
          { name: '技术总监分身', persona: '架构评审、技术选型、代码审查、技术债务管理', capabilities: JSON.stringify(['architecture', 'code_review', 'tech_selection', 'devops']), status: 'working', cycleCount: 31, avatar: '🔵' },
          { name: '增长引擎分身', persona: '市场推广、用户获取、数据驱动增长', capabilities: JSON.stringify(['marketing', 'user_acquisition', 'data_analysis', 'growth_hacking']), status: 'idle', cycleCount: 18, avatar: '🟢' },
          { name: '工程执行分身', persona: '代码实现、部署运维、CI/CD流水线', capabilities: JSON.stringify(['coding', 'deployment', 'ci_cd', 'monitoring']), status: 'idle', cycleCount: 42, avatar: '🔷' },
        ],
      })
      summary.agentRoles = 4
    } else {
      summary.agentRoles = 0
    }
    console.log('[seed] AgentRoles:', existingAgentRoles === 0 ? 4 : 'skipped')

    // ─── 12. DailyCycle (for AgentRoles) ─────────────────────────────
    const existingDailyCycles = await db.dailyCycle.count()
    if (existingDailyCycles === 0) {
      const agentRoles = await db.agentRole.findMany()
      if (agentRoles.length >= 4) {
        const dailyCycleData = [
          { agentId: agentRoles[0].id, phase: 'completed', plan: JSON.stringify({ focus: 'Q2战略执行审查' }), execution: JSON.stringify({ result: 'Q2进度70%' }), report: '战略规划周期完成', completedAt: new Date(Date.now() - 7200000) },
          { agentId: agentRoles[1].id, phase: 'reporting', plan: JSON.stringify({ focus: '微服务架构评审' }) },
          { agentId: agentRoles[2].id, phase: 'completed', plan: JSON.stringify({ focus: '增长数据复盘' }), execution: JSON.stringify({ result: '月活+23%' }), report: '增长分析完成', completedAt: new Date(Date.now() - 10800000) },
          { agentId: agentRoles[3].id, phase: 'completed', plan: JSON.stringify({ focus: 'CI/CD优化' }), execution: JSON.stringify({ result: '部署-75%' }), report: '工程执行完成', completedAt: new Date(Date.now() - 14400000) },
        ]
        await db.dailyCycle.createMany({ data: dailyCycleData })
        summary.dailyCycles = dailyCycleData.length
      } else {
        summary.dailyCycles = 0
      }
    } else {
      summary.dailyCycles = 0
    }
    console.log('[seed] DailyCycles:', existingDailyCycles === 0 ? 'created' : 'skipped')

    // ─── 13. RedBlueSimulation ───────────────────────────────────────
    const existingSimulations = await db.redBlueSimulation.count()
    if (existingSimulations === 0) {
      const shards = await db.cognitiveShard.findMany()
      if (shards.length >= 2) {
        await db.redBlueSimulation.createMany({
          data: [
            {
              shardId: shards[0].id,
              inputIdea: '推出AI Agent订阅制产品，月费99元起',
              redOutput: '致命漏洞：1) 市场已有成熟竞品(Jasper/Copy.ai) 2) 定价偏高，用户付费意愿低 3) 技术壁垒不清晰',
              blueOutput: '防御策略：1) 聚焦垂直场景(创业者/独立开发者) 2) 提供免费版+增值服务 3) 构建分身知识网络形成壁垒',
              verdict: '建议执行，但需调整定价策略和目标市场',
              confidence: 0.82,
              status: 'completed',
            },
            {
              shardId: shards[1].id,
              inputIdea: '开放API让第三方开发者为分身系统构建插件',
              redOutput: '致命漏洞：1) 开发者生态需要时间培育 2) 安全风险高 3) 质量控制困难',
              blueOutput: '防御策略：1) 先内部构建5-10个标杆插件 2) 沙盒化运行+审核机制 3) 提供开发SDK和文档',
              verdict: '中期可行，建议先完成内部标杆验证',
              confidence: 0.75,
              status: 'completed',
            },
          ],
        })
        summary.redBlueSimulations = 2
      } else {
        summary.redBlueSimulations = 0
      }
    } else {
      summary.redBlueSimulations = 0
    }
    console.log('[seed] RedBlueSimulations:', existingSimulations === 0 ? 'created' : 'skipped')

    // ─── 14. DecisionLog ─────────────────────────────────────────────
    const existingDecisions = await db.decisionLog.count()
    if (existingDecisions === 0) {
      const decisionDefs = [
        { title: '切入垂直SaaS市场', category: 'strategic', confidence: 0.92, outcome: '已执行，初期增长符合预期', content: '决策记录：切入垂直SaaS市场。基于3个月用户调研数据，确认AI Agent创业工具市场存在真实需求。置信度0.92。', tags: 'strategic' },
        { title: '推迟C轮融资', category: 'strategic', confidence: 0.78, outcome: '现金流充裕，观望市场', content: '决策记录：推迟C轮融资。当前现金流可支撑18个月运营，市场估值可能进一步上升。置信度0.78。', tags: 'strategic,finance' },
        { title: '引入CTO联合创始人', category: 'hiring', confidence: 0.85, outcome: '进行中', content: '决策记录：引入CTO联合创始人。技术架构复杂度提升，需要更强的技术领导力。置信度0.85。', tags: 'hiring' },
        { title: '转向AI-first产品架构', category: 'technical', confidence: 0.71, outcome: '架构设计阶段', content: '决策记录：转向AI-first产品架构。将所有功能模块AI化，从工具型产品转向智能体平台。置信度0.71。', tags: 'technical,architecture' },
        { title: '暂停海外扩张', category: 'strategic', confidence: 0.88, outcome: '已执行，聚焦国内', content: '决策记录：暂停海外扩张。国内市场仍有3倍增长空间，海外运营成本高且不熟悉法规。置信度0.88。', tags: 'strategic,market' },
      ]

      for (const d of decisionDefs) {
        await db.decisionLog.create({
          data: {
            founderId: founder.id,
            ...d,
          },
        })
      }
      summary.decisionLogs = decisionDefs.length
    } else {
      summary.decisionLogs = 0
    }
    console.log('[seed] DecisionLogs:', existingDecisions === 0 ? 5 : 'skipped')

    // ─── 15. EvidenceItem ────────────────────────────────────────────
    const existingEvidence = await db.evidenceItem.count()
    if (existingEvidence === 0) {
      const evidenceDefs = [
        { title: '用户访谈#23 - 支付痛点验证', evidenceType: 'interview', status: 'verified' },
        { title: 'A/B测试 - 首页转化率', evidenceType: 'ab_test', status: 'onchain' },
        { title: '决策日志 - 定价策略调整', evidenceType: 'decision_log', status: 'signed' },
        { title: '核心指标 - 月活增长率', evidenceType: 'metric', status: 'verified' },
        { title: '用户访谈#24 - 功能优先级', evidenceType: 'interview', status: 'draft' },
      ]

      for (const e of evidenceDefs) {
        const hash = '0x' + Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('')
        await db.evidenceItem.create({
          data: {
            title: e.title,
            evidenceType: e.evidenceType,
            contentHash: hash,
            status: e.status,
          },
        })
      }
      summary.evidenceItems = evidenceDefs.length
    } else {
      summary.evidenceItems = 0
    }
    console.log('[seed] EvidenceItems:', existingEvidence === 0 ? 5 : 'skipped')

    // ─── 16. CollaborationTask ───────────────────────────────────────
    const existingTasks = await db.collaborationTask.count()
    if (existingTasks === 0) {
      const taskDefs = [
        { title: '实现VC签名SDK', complexity: 'medium', category: 'code', reward: 200, status: 'open', priority: 6, assigneeType: 'auto' },
        { title: '用户调研问卷设计', complexity: 'low', category: 'research', reward: 80, status: 'open', priority: 4, assigneeType: 'human' },
        { title: 'Logo与VI设计', complexity: 'medium', category: 'design', reward: 300, status: 'assigned', priority: 5, assigneeType: 'auto' },
        { title: '智能合约审计', complexity: 'critical', category: 'code', reward: 500, status: 'in_progress', priority: 9, assigneeType: 'ai' },
        { title: '竞品分析报告', complexity: 'medium', category: 'research', reward: 150, status: 'in_progress', priority: 6, assigneeType: 'ai' },
        { title: '前端原型开发', complexity: 'high', category: 'code', reward: 350, status: 'review', priority: 7, assigneeType: 'auto' },
        { title: 'API文档编写', complexity: 'low', category: 'code', reward: 100, status: 'completed', priority: 3, assigneeType: 'ai' },
        { title: '性能优化方案', complexity: 'high', category: 'code', reward: 400, status: 'completed', priority: 8, assigneeType: 'auto' },
      ]

      for (const t of taskDefs) {
        await db.collaborationTask.create({
          data: {
            ...t,
            rewardToken: 'USDT',
            creatorId: founder.id,
          },
        })
      }
      summary.collaborationTasks = taskDefs.length
    } else {
      summary.collaborationTasks = 0
    }
    console.log('[seed] CollaborationTasks:', existingTasks === 0 ? 8 : 'skipped')

    // ─── 17. SandboxProject ──────────────────────────────────────────
    const existingProjects = await db.sandboxProject.count()
    if (existingProjects === 0) {
      const projectDefs = [
        { name: 'SpaceUI-v2', projectType: '3d_prototype', status: 'interactive', xdpEnabled: true, version: 3 },
        { name: 'Dashboard-AR', projectType: 'spatial_ui', status: 'building', xdpEnabled: true, version: 1 },
        { name: 'ProductWalkthrough', projectType: '3d_prototype', status: 'published', xdpEnabled: false, version: 5 },
      ]

      for (const p of projectDefs) {
        const project = await db.sandboxProject.create({ data: p })
        if (p.status === 'interactive' || p.status === 'published') {
          await db.sandboxInteraction.create({
            data: {
              projectId: project.id,
              name: '点击交互',
              triggerType: 'click',
              actionType: 'navigate',
              config: JSON.stringify({ target: 'detail-view', animation: 'fade-in' }),
            },
          })
        }
      }
      summary.sandboxProjects = projectDefs.length
    } else {
      summary.sandboxProjects = 0
    }
    console.log('[seed] SandboxProjects:', existingProjects === 0 ? 3 : 'skipped')

    // ─── 18. RoadmapPhase + Milestones ───────────────────────────────
    const existingPhases = await db.roadmapPhase.count()
    if (existingPhases === 0) {
      const phase1 = await db.roadmapPhase.create({
        data: {
          phase: 1,
          name: '基建与协议验证',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-30'),
          status: 'active',
        },
      })

      const phase2 = await db.roadmapPhase.create({
        data: {
          phase: 2,
          name: '认知分身MVP',
          startDate: new Date('2025-01-31'),
          endDate: new Date('2025-03-01'),
          status: 'pending',
        },
      })

      const phase3 = await db.roadmapPhase.create({
        data: {
          phase: 3,
          name: '流体协作闭环',
          startDate: new Date('2025-03-02'),
          endDate: new Date('2025-03-31'),
          status: 'pending',
        },
      })

      // Phase 1 milestones (3 completed, 1 in_progress)
      const p1Milestones = [
        { title: '搭建向量库', status: 'completed', order: 1, targetDate: new Date('2025-01-10') },
        { title: '接入W3C VC签发模块', status: 'completed', order: 2, targetDate: new Date('2025-01-15') },
        { title: '定义证据数据模型', status: 'completed', order: 3, targetDate: new Date('2025-01-20') },
        { title: '实现访谈记录→假设提取管道', status: 'in_progress', order: 4, targetDate: new Date('2025-01-25') },
      ]
      for (const m of p1Milestones) {
        await db.milestone.create({ data: { phaseId: phase1.id, ...m } })
      }

      // Phase 2 milestones
      const p2Milestones = [
        { title: '导入创始人过去3年决策日志', order: 1, targetDate: new Date('2025-02-05') },
        { title: '训练首个LoRA适配器', order: 2, targetDate: new Date('2025-02-15') },
        { title: '实现红蓝对抗交互界面', order: 3, targetDate: new Date('2025-02-25') },
      ]
      for (const m of p2Milestones) {
        await db.milestone.create({ data: { phaseId: phase2.id, ...m, status: 'pending' } })
      }

      // Phase 3 milestones
      const p3Milestones = [
        { title: '接入外部开发者节点', order: 1, targetDate: new Date('2025-03-10') },
        { title: '发布首个基于微支付的开源任务', order: 2, targetDate: new Date('2025-03-20') },
        { title: '微支付结算网关上线', order: 3, targetDate: new Date('2025-03-31') },
      ]
      for (const m of p3Milestones) {
        await db.milestone.create({ data: { phaseId: phase3.id, ...m, status: 'pending' } })
      }

      summary.roadmapPhases = 3
      summary.milestones = p1Milestones.length + p2Milestones.length + p3Milestones.length
    } else {
      summary.roadmapPhases = 0
      summary.milestones = 0
    }
    console.log('[seed] RoadmapPhases:', existingPhases === 0 ? 'created' : 'skipped')

    // ─── 19. SubscriptionPlan ────────────────────────────────────────
    const planDefs = [
      {
        name: 'free',
        displayName: '免费版',
        priceAFC: 0,
        priceUSD: 0,
        maxClones: 1,
        maxCyclesPerDay: 5,
        features: JSON.stringify(['1 智能分身', '5 AI周期/天', '基础技能', '社区支持']),
        isActive: true,
      },
      {
        name: 'starter',
        displayName: '入门版',
        priceAFC: 490,
        priceUSD: 49,
        maxClones: 3,
        maxCyclesPerDay: 20,
        features: JSON.stringify(['3 智能分身', '20 AI周期/天', '邮件跟踪', '高级技能', '优先支持']),
        isActive: true,
      },
      {
        name: 'pro',
        displayName: '专业版',
        priceAFC: 990,
        priceUSD: 99,
        maxClones: 10,
        maxCyclesPerDay: -1,
        features: JSON.stringify(['10 智能分身', '无限AI周期', '全部技能', 'API访问', '跨分身知识共享']),
        isActive: true,
      },
      {
        name: 'enterprise',
        displayName: '企业版',
        priceAFC: 0,
        priceUSD: 0,
        maxClones: -1,
        maxCyclesPerDay: -1,
        features: JSON.stringify(['无限分身', '私有部署', '专属客服', 'SLA保障', '白标方案']),
        isActive: true,
      },
    ]

    let plansCreated = 0
    for (const planData of planDefs) {
      const existing = await db.subscriptionPlan.findUnique({ where: { name: planData.name } })
      if (!existing) {
        await db.subscriptionPlan.create({ data: planData })
        plansCreated++
      }
    }
    summary.subscriptionPlans = plansCreated
    console.log('[seed] SubscriptionPlans:', plansCreated)

    // ─── 20. Notification ────────────────────────────────────────────
    const existingNotifications = await db.notification.count()
    if (existingNotifications === 0) {
      const notificationDefs = [
        { type: 'success', title: '分身系统已激活', message: '你的AI分身"飘叔分身"已成功激活，包含4个角色化代理', module: 'avatar' },
        { type: 'info', title: 'CTO代理完成架构评审', message: '微服务拆分方案v2.1已确认，等待你的审批', module: 'cognitive' },
        { type: 'warning', title: '证据待签发', message: '3条证据已完成审核，等待签发可验证凭证', module: 'evidence' },
        { type: 'success', title: '增长里程碑达成', message: '月活用户环比增长23%，超过目标值15%', module: 'avatar' },
        { type: 'info', title: '路线图更新', message: 'Phase 1 第4个里程碑已进入执行阶段', module: 'roadmap' },
      ]

      for (let i = 0; i < notificationDefs.length; i++) {
        const n = notificationDefs[i]
        await db.notification.create({
          data: {
            ...n,
            isRead: i < 2,
            createdAt: new Date(Date.now() - (i + 1) * 3600000),
          },
        })
      }
      summary.notifications = notificationDefs.length
    } else {
      summary.notifications = 0
    }
    console.log('[seed] Notifications:', existingNotifications === 0 ? 5 : 'skipped')

    // ─── Summary ─────────────────────────────────────────────────────
    console.log('[seed] Seeding complete!')
    return NextResponse.json({
      success: true,
      message: 'Master seed completed successfully',
      summary,
    })
  } catch (error) {
    console.error('[seed] Error:', error)
    return NextResponse.json(
      { success: false, error: String(error), summary },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return current data counts for all tables
    const counts = {
      founders: await db.founder.count(),
      users: await db.user.count(),
      avatarClones: await db.avatarClone.count(),
      cloneAgents: await db.cloneAgent.count(),
      cloneSkills: await db.cloneSkill.count(),
      cloneActivities: await db.cloneActivity.count(),
      agentCycles: await db.agentCycle.count(),
      agentOutputs: await db.agentOutput.count(),
      dailySchedules: await db.dailySchedule.count(),
      cognitiveShards: await db.cognitiveShard.count(),
      agentRoles: await db.agentRole.count(),
      dailyCycles: await db.dailyCycle.count(),
      redBlueSimulations: await db.redBlueSimulation.count(),
      decisionLogs: await db.decisionLog.count(),
      evidenceItems: await db.evidenceItem.count(),
      collaborationTasks: await db.collaborationTask.count(),
      sandboxProjects: await db.sandboxProject.count(),
      roadmapPhases: await db.roadmapPhase.count(),
      milestones: await db.milestone.count(),
      subscriptionPlans: await db.subscriptionPlan.count(),
      notifications: await db.notification.count(),
    }

    return NextResponse.json({ success: true, counts })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
