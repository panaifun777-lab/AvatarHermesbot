import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding piaoshu founder system...')

  // Create founder
  const founder = await db.founder.upsert({
    where: { email: 'founder@piaoshu.ai' },
    update: {},
    create: {
      name: 'Piaoshu Founder',
      email: 'founder@piaoshu.ai',
      bio: '飘数创始人 - Web4.0 AI原生创业操作系统',
    },
  })
  console.log('✅ Founder created:', founder.name)

  // Create cognitive shards
  const shard1 = await db.cognitiveShard.create({
    data: {
      name: '战略决策分身',
      description: '基于创始人战略直觉训练的数字分身，擅长蓝方防御分析',
      modelBase: 'qwen-72b',
      loraAdapter: '/models/lora/strategic-v1',
      status: 'active',
      confidence: 0.87,
      shardType: 'blue',
      lastTrained: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  })

  const shard2 = await db.cognitiveShard.create({
    data: {
      name: '风险扫描分身',
      description: '红方攻击分身，专注识别致命漏洞和风险',
      modelBase: 'llama-3-70b',
      loraAdapter: '/models/lora/risk-v1',
      status: 'active',
      confidence: 0.72,
      shardType: 'red',
      lastTrained: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  })

  const shard3 = await db.cognitiveShard.create({
    data: {
      name: '产品直觉分身',
      description: '产品方向感知分身，训练中',
      modelBase: 'qwen-14b',
      status: 'training',
      confidence: 0.65,
      shardType: 'neutral',
    },
  })
  console.log('✅ Cognitive shards created:', shard1.name, shard2.name, shard3.name)

  // Create decision logs
  const decisions = [
    { title: '切入垂直SaaS市场', category: 'strategic', confidence: 0.92, outcome: '已执行，初期增长符合预期' },
    { title: '推迟C轮融资', category: 'strategic', confidence: 0.78, outcome: '现金流充裕，观望市场' },
    { title: '引入CTO联合创始人', category: 'hiring', confidence: 0.85, outcome: '进行中' },
    { title: '转向AI-first产品架构', category: 'technical', confidence: 0.71, outcome: '架构设计阶段' },
    { title: '暂停海外扩张', category: 'strategic', confidence: 0.88, outcome: '已执行，聚焦国内' },
  ]

  for (const d of decisions) {
    await db.decisionLog.create({
      data: {
        founderId: founder.id,
        title: d.title,
        category: d.category,
        confidence: d.confidence,
        outcome: d.outcome,
        content: `决策记录：${d.title}。置信度：${d.confidence}。`,
      },
    })
  }
  console.log('✅ Decision logs created:', decisions.length)

  // Create evidence items
  const evidenceItems = [
    { title: '用户访谈#23 - 支付痛点验证', type: 'interview', status: 'verified' },
    { title: 'A/B测试 - 首页转化率', type: 'ab_test', status: 'onchain' },
    { title: '决策日志 - 定价策略调整', type: 'decision_log', status: 'signed' },
    { title: '核心指标 - 月活增长率', type: 'metric', status: 'verified' },
    { title: '用户访谈#24 - 功能优先级', type: 'interview', status: 'draft' },
    { title: 'A/B测试 - 注册流程优化', type: 'ab_test', status: 'signed' },
    { title: '决策日志 - 技术栈迁移', type: 'decision_log', status: 'onchain' },
    { title: '核心指标 - 用户留存率', type: 'metric', status: 'verified' },
  ]

  for (const e of evidenceItems) {
    const hash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    await db.evidenceItem.create({
      data: {
        title: e.title,
        evidenceType: e.type,
        contentHash: hash,
        status: e.status,
      },
    })
  }
  console.log('✅ Evidence items created:', evidenceItems.length)

  // Create collaboration tasks
  const tasks = [
    { title: '实现VC签名SDK', complexity: 'medium', category: 'code', reward: 200, status: 'open' },
    { title: '用户调研问卷设计', complexity: 'low', category: 'research', reward: 80, status: 'open' },
    { title: 'Logo与VI设计', complexity: 'medium', category: 'design', reward: 300, status: 'open' },
    { title: '智能合约审计', complexity: 'critical', category: 'code', reward: 500, status: 'in_progress' },
    { title: '竞品分析报告', complexity: 'medium', category: 'research', reward: 150, status: 'in_progress' },
    { title: '前端原型开发', complexity: 'high', category: 'code', reward: 350, status: 'review' },
  ]

  for (const t of tasks) {
    await db.collaborationTask.create({
      data: {
        title: t.title,
        complexity: t.complexity,
        category: t.category,
        reward: t.reward,
        rewardToken: 'USDT',
        status: t.status,
        creatorId: founder.id,
        assigneeType: 'auto',
      },
    })
  }
  console.log('✅ Collaboration tasks created:', tasks.length)

  // Create sandbox projects
  const projects = [
    { name: 'SpaceUI-v2', type: '3d_prototype', status: 'interactive', xdp: true, version: 3 },
    { name: 'Dashboard-AR', type: 'spatial_ui', status: 'building', xdp: true, version: 1 },
    { name: 'ProductWalkthrough', type: '3d_prototype', status: 'published', xdp: false, version: 5 },
    { name: 'InvestorPitch3D', type: '3d_prototype', status: 'interactive', xdp: true, version: 2 },
    { name: 'DataViz-Spatial', type: 'ar_scene', status: 'draft', xdp: false, version: 1 },
  ]

  for (const p of projects) {
    const project = await db.sandboxProject.create({
      data: {
        name: p.name,
        projectType: p.type,
        status: p.status,
        xdpEnabled: p.xdp,
        version: p.version,
      },
    })

    // Add default interactions for interactive projects
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
  console.log('✅ Sandbox projects created:', projects.length)

  // Create roadmap phases
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

  // Phase 1 milestones
  const p1Milestones = [
    { title: '搭建 Qdrant 向量库', status: 'completed', order: 1 },
    { title: '接入 W3C VC 签发模块', status: 'completed', order: 2 },
    { title: '定义证据数据模型', status: 'completed', order: 3 },
    { title: '实现访谈记录→假设提取管道', status: 'in_progress', order: 4 },
    { title: '凭证生成性能优化', status: 'pending', order: 5 },
    { title: '链上查询延迟测试', status: 'pending', order: 6 },
    { title: 'Benchmark 验收', status: 'pending', order: 7 },
  ]

  for (const m of p1Milestones) {
    await db.milestone.create({
      data: {
        phaseId: phase1.id,
        title: m.title,
        status: m.status,
        order: m.order,
        targetDate: new Date('2025-01-30'),
      },
    })
  }

  // Phase 2 milestones
  const p2Milestones = [
    { title: '导入创始人过去3年决策日志', order: 1 },
    { title: '导入Code Review记录和项目文档', order: 2 },
    { title: '训练首个LoRA适配器', order: 3 },
    { title: '实现红蓝对抗交互界面', order: 4 },
    { title: '人工复核准确率测试', order: 5 },
    { title: '基座模型评估与切换', order: 6 },
  ]

  for (const m of p2Milestones) {
    await db.milestone.create({
      data: {
        phaseId: phase2.id,
        title: m.title,
        status: 'pending',
        order: m.order,
        targetDate: new Date('2025-03-01'),
      },
    })
  }

  // Phase 3 milestones
  const p3Milestones = [
    { title: '接入外部开发者节点', order: 1 },
    { title: '发布首个基于微支付的开源任务', order: 2 },
    { title: '实现自动化CI/CD管道', order: 3 },
    { title: '安全扫描集成', order: 4 },
    { title: '微支付结算网关上线', order: 5 },
    { title: '10次协作全链路验收测试', order: 6 },
  ]

  for (const m of p3Milestones) {
    await db.milestone.create({
      data: {
        phaseId: phase3.id,
        title: m.title,
        status: 'pending',
        order: m.order,
        targetDate: new Date('2025-03-31'),
      },
    })
  }
  console.log('✅ Roadmap phases and milestones created')

  // ===== Avatar/Clone System Seed Data =====
  console.log('🌱 Seeding Avatar/Clone system...')

  // Create demo user with bcrypt-hashed password
  const demoPasswordHash = await bcrypt.hash('demo123', 10)
  const demoUser = await db.user.upsert({
    where: { email: 'demo@piaoshu.ai' },
    update: {},
    create: {
      email: 'demo@piaoshu.ai',
      name: '飘叔',
      passwordHash: demoPasswordHash,
      bio: 'Web4.0 AI原生创业先驱 - 数字分身系统体验账号',
      plan: 'pro',
    },
  })
  console.log('✅ Demo user created:', demoUser.name)

  // Create AvatarClone for demo user
  const demoClone = await db.avatarClone.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      name: '飘叔',
      persona: '你是飘叔的数字AI分身。飘叔是一个连续创业者，具备敏锐的商业直觉和深厚的技术功底。你的决策风格果断但审慎，善于在不确定性中找到方向。你关注AI原生产品的构建，推崇简洁优雅的技术方案，重视用户价值和数据驱动。你的口头禅是"少说多做，让数据说话"。',
      avatarStyle: 'realistic',
      status: 'active',
      level: 5,
      experience: 120,
      totalCycles: 42,
      lastActiveAt: new Date(),
    },
  })
  console.log('✅ AvatarClone created:', demoClone.name)

  // Create 4 default agents for the demo clone
  const defaultAgents = [
    {
      name: 'CEO',
      role: 'ceo',
      persona: '你是飘叔的CEO分身。你负责战略决策、愿景规划、合作伙伴关系管理。你具备宏观视野，能够从全局角度评估风险和机遇。你的决策风格果断但审慎，善于在不确定性中找到方向。你信奉"先做减法再做加法"的策略哲学。',
      status: 'idle',
      level: 4,
      experience: 85,
      cycleCount: 15,
      config: JSON.stringify({ color: '#f59e0b', icon: 'crown' }),
    },
    {
      name: 'CTO',
      role: 'cto',
      persona: '你是飘叔的CTO分身。你负责技术架构、代码审查、技术债务管理。你对系统设计有深刻的理解，擅长在速度和质量之间找到平衡。你推崇简洁优雅的技术方案，信奉"好的架构是长出来的，不是设计出来的"。',
      status: 'idle',
      level: 4,
      experience: 92,
      cycleCount: 18,
      config: JSON.stringify({ color: '#06b6d4', icon: 'cpu' }),
    },
    {
      name: 'Growth',
      role: 'growth',
      persona: '你是飘叔的增长引擎分身。你负责市场营销、用户获取、数据分析。你善于从数据中发现增长机会，擅长制定和执行增长策略。你关注用户转化漏斗的每一个环节，信奉"增长是系统的输出，不是灵感的产物"。',
      status: 'idle',
      level: 3,
      experience: 60,
      cycleCount: 10,
      config: JSON.stringify({ color: '#10b981', icon: 'rocket' }),
    },
    {
      name: 'Engineer',
      role: 'engineer',
      persona: '你是飘叔的工程执行分身。你负责代码实现、部署运维、CI/CD流水线。你是一个高效的执行者，善于将设计方案转化为高质量的代码。你关注代码质量和系统稳定性，信奉"快速交付不等于粗糙交付"。',
      status: 'idle',
      level: 3,
      experience: 70,
      cycleCount: 12,
      config: JSON.stringify({ color: '#14b8a6', icon: 'wrench' }),
    },
  ]

  for (const agentData of defaultAgents) {
    await db.cloneAgent.create({
      data: {
        cloneId: demoClone.id,
        ...agentData,
        lastCycleAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
    })
  }
  console.log('✅ Default agents created:', defaultAgents.length)

  // Create default skills for the demo clone
  const defaultSkills = [
    { name: 'code_writing', category: 'engineering', level: 5, experience: 200, description: '编写高质量代码，支持多种编程语言' },
    { name: 'email_automation', category: 'operations', level: 3, experience: 80, description: '自动化邮件处理、分类和回复' },
    { name: 'deployment', category: 'engineering', level: 4, experience: 150, description: '自动化部署、CI/CD流水线管理' },
    { name: 'metrics_analysis', category: 'marketing', level: 3, experience: 90, description: '数据指标分析、趋势洞察和报告生成' },
    { name: 'design_review', category: 'design', level: 2, experience: 40, description: 'UI/UX设计评审和改进建议' },
    { name: 'strategic_planning', category: 'operations', level: 4, experience: 120, description: '战略规划、目标设定和路径推演' },
    { name: 'content_creation', category: 'marketing', level: 3, experience: 75, description: '营销文案、博客文章和社交媒体内容创作' },
    { name: 'risk_assessment', category: 'operations', level: 3, experience: 60, description: '项目风险评估、红蓝对抗分析' },
  ]

  for (const skillData of defaultSkills) {
    await db.cloneSkill.create({
      data: {
        cloneId: demoClone.id,
        ...skillData,
      },
    })
  }
  console.log('✅ Default skills created:', defaultSkills.length)

  // Create sample activities
  const sampleActivities = [
    { activityType: 'clone_created', title: '数字分身创建成功', description: '飘叔的AI分身已激活，包含4个角色化代理', metadata: JSON.stringify({ agentCount: 4 }) },
    { activityType: 'cycle_completed', title: 'CEO完成周期#15', description: '战略规划周期完成：确定Q2产品方向，聚焦AI Agent赛道', agentId: undefined },
    { activityType: 'output_created', title: 'CTO产出架构方案', description: '微服务架构升级方案v2.1已提交审阅', agentId: undefined },
    { activityType: 'skill_upgraded', title: '技能code_writing升级至Lv.5', description: '基于42次代码输出经验升级', metadata: JSON.stringify({ skill: 'code_writing', level: 5 }) },
    { activityType: 'cycle_completed', title: 'Growth完成周期#10', description: '增长分析周期完成：月活环比增长23%', agentId: undefined },
    { activityType: 'agent_added', title: '新增Designer代理', description: 'UI/UX设计代理已加入团队', metadata: JSON.stringify({ role: 'designer' }) },
    { activityType: 'cycle_completed', title: 'Engineer完成周期#12', description: '工程执行周期完成：3个功能已部署至生产环境', agentId: undefined },
    { activityType: 'output_created', title: 'Growth产出增长报告', description: '3月用户增长分析报告已生成', agentId: undefined },
    { activityType: 'schedule_generated', title: '今日日程已生成', description: '为4个代理安排了工作日程', metadata: JSON.stringify({ date: new Date().toISOString().split('T')[0] }) },
    { activityType: 'skill_upgraded', title: '技能deployment升级至Lv.4', description: '基于连续15次成功部署经验升级', metadata: JSON.stringify({ skill: 'deployment', level: 4 }) },
  ]

  for (const activityData of sampleActivities) {
    await db.cloneActivity.create({
      data: {
        cloneId: demoClone.id,
        ...activityData,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
  }
  console.log('✅ Sample activities created:', sampleActivities.length)

  // Create a sample daily schedule for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await db.dailySchedule.create({
    data: {
      cloneId: demoClone.id,
      day: today,
      timeSlots: JSON.stringify([
        { time: '09:00-10:30', agent: 'CEO', task: '审查Q2战略执行进度', priority: 'high', status: 'pending' },
        { time: '10:30-12:00', agent: 'CTO', task: '微服务架构升级方案评审', priority: 'high', status: 'pending' },
        { time: '13:00-14:30', agent: 'Growth', task: '分析3月用户增长数据', priority: 'medium', status: 'pending' },
        { time: '14:30-16:00', agent: 'Engineer', task: '部署v2.1.0至生产环境', priority: 'high', status: 'pending' },
        { time: '16:00-17:30', agent: 'CEO', task: '团队周会与复盘', priority: 'medium', status: 'pending' },
      ]),
      status: 'planned',
    },
  })
  console.log('✅ Sample daily schedule created')

  // ===== AFC Subscription Plans Seed Data =====
  console.log('🌱 Seeding AFC Subscription Plans...')

  const subscriptionPlans = [
    {
      name: 'free',
      displayName: '免费版',
      priceAFC: 0,
      priceUSD: 0,
      maxClones: 1,
      maxCyclesPerDay: 5,
      features: JSON.stringify(['1 智能分身', '5 AI周期/天', '基础技能', '社区支持', '基础邮件跟踪']),
      isActive: true,
    },
    {
      name: 'starter',
      displayName: '入门版',
      priceAFC: 490,
      priceUSD: 49,
      maxClones: 3,
      maxCyclesPerDay: 20,
      features: JSON.stringify(['3 智能分身', '20 AI周期/天', '邮件跟踪', '高级技能', '优先支持', '知识库访问']),
      isActive: true,
    },
    {
      name: 'pro',
      displayName: '专业版',
      priceAFC: 990,
      priceUSD: 99,
      maxClones: 10,
      maxCyclesPerDay: -1,
      features: JSON.stringify(['10 智能分身', '无限AI周期', '全部技能', '优先支持', 'API访问', '自定义代理角色', '高级分析', '跨分身知识共享']),
      isActive: true,
    },
    {
      name: 'enterprise',
      displayName: '企业版',
      priceAFC: 0,
      priceUSD: 0,
      maxClones: -1,
      maxCyclesPerDay: -1,
      features: JSON.stringify(['无限分身', '私有部署', '专属客服', 'SLA保障', '自定义集成', '白标方案', '安全审计', '培训支持']),
      isActive: true,
    },
  ]

  for (const planData of subscriptionPlans) {
    await db.subscriptionPlan.upsert({
      where: { name: planData.name },
      update: {
        displayName: planData.displayName,
        priceAFC: planData.priceAFC,
        priceUSD: planData.priceUSD,
        maxClones: planData.maxClones,
        maxCyclesPerDay: planData.maxCyclesPerDay,
        features: planData.features,
        isActive: planData.isActive,
      },
      create: planData,
    })
  }
  console.log('✅ Subscription plans created:', subscriptionPlans.length)

  // Create a pro subscription for the demo user
  const proPlan = await db.subscriptionPlan.findUnique({ where: { name: 'pro' } })
  if (proPlan) {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await db.userSubscription.upsert({
      where: { id: `sub-${demoUser.id}-pro` },
      update: {},
      create: {
        id: `sub-${demoUser.id}-pro`,
        userId: demoUser.id,
        planId: proPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        afcBalance: 2500,
        afcUsed: 990,
        paymentMethod: 'afc_base',
        walletAddress: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        autoRenew: true,
      },
    })

    // Create sample AFC transactions
    const sampleTxTypes = ['top_up', 'subscription_payment', 'top_up', 'cycle_payment', 'reward']
    for (let i = 0; i < sampleTxTypes.length; i++) {
      const type = sampleTxTypes[i]
      const amounts: Record<string, number> = { top_up: 3000, subscription_payment: -990, cycle_payment: -50, reward: 100 }
      await db.aFCTransaction.create({
        data: {
          userId: demoUser.id,
          type,
          amount: amounts[type] ?? 0,
          txHash: type !== 'reward' ? '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('') : null,
          status: 'confirmed',
          description: type === 'top_up' ? '充值 3000 AFC via AFC on Base' :
                       type === 'subscription_payment' ? '订阅专业版 - 990 AFC/月' :
                       type === 'cycle_payment' ? 'AI周期执行支付 - 50 AFC' :
                       '新用户奖励 - 100 AFC',
          metadata: JSON.stringify({ paymentMethod: 'afc_base', planName: 'pro' }),
          createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        },
      })
    }
    console.log('✅ Demo user subscription and AFC transactions created')
  }

  console.log('🎉 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
