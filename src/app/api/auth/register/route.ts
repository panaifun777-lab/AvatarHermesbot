import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, password } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    })

    // Auto-create Founder if not exists
    const existingFounder = await db.founder.findUnique({ where: { email } })
    if (!existingFounder) {
      await db.founder.create({
        data: {
          name,
          email,
          bio: `${name}的创始人空间`,
        },
      })
    }

    // Auto-create AvatarClone with default agents
    const clone = await db.avatarClone.create({
      data: {
        userId: user.id,
        name: `${name}的分身`,
        persona: `你是${name}的数字AI分身。你拥有创始人的思维模式、决策风格和核心价值观。你能够自主执行任务、做出决策、并持续学习和进化。`,
        status: 'active',
        lastActiveAt: new Date(),
        agents: {
          create: [
            {
              name: 'CEO',
              role: 'ceo',
              persona: `你是${name}的CEO分身。你负责战略决策、愿景规划、合作伙伴关系管理。你具备宏观视野，能够从全局角度评估风险和机遇。你的决策风格果断但审慎，善于在不确定性中找到方向。`,
              status: 'idle',
              config: JSON.stringify({ color: '#f59e0b', icon: 'crown' }),
            },
            {
              name: 'CTO',
              role: 'cto',
              persona: `你是${name}的CTO分身。你负责技术架构、代码审查、技术债务管理。你对系统设计有深刻的理解，擅长在速度和质量之间找到平衡。你推崇简洁优雅的技术方案。`,
              status: 'idle',
              config: JSON.stringify({ color: '#06b6d4', icon: 'cpu' }),
            },
            {
              name: 'Growth',
              role: 'growth',
              persona: `你是${name}的增长引擎分身。你负责市场营销、用户获取、数据分析。你善于从数据中发现增长机会，擅长制定和执行增长策略。你关注用户转化漏斗的每一个环节。`,
              status: 'idle',
              config: JSON.stringify({ color: '#10b981', icon: 'rocket' }),
            },
            {
              name: 'Engineer',
              role: 'engineer',
              persona: `你是${name}的工程执行分身。你负责代码实现、部署运维、CI/CD流水线。你是一个高效的执行者，善于将设计方案转化为高质量的代码。你关注代码质量和系统稳定性。`,
              status: 'idle',
              config: JSON.stringify({ color: '#14b8a6', icon: 'wrench' }),
            },
          ],
        },
        skills: {
          create: [
            { name: 'code_writing', category: 'engineering', level: 3, description: '编写高质量代码' },
            { name: 'email_automation', category: 'operations', level: 2, description: '自动化邮件处理和回复' },
            { name: 'deployment', category: 'engineering', level: 2, description: '自动化部署和运维' },
            { name: 'metrics_analysis', category: 'marketing', level: 2, description: '数据指标分析和洞察' },
            { name: 'design_review', category: 'design', level: 1, description: '设计评审和反馈' },
            { name: 'strategic_planning', category: 'operations', level: 3, description: '战略规划和决策支持' },
          ],
        },
      },
      include: {
        agents: true,
        skills: true,
      },
    })

    // Create initial activity
    await db.cloneActivity.create({
      data: {
        cloneId: clone.id,
        activityType: 'clone_created',
        title: '数字分身创建成功',
        description: `${name}的AI分身已激活，包含4个角色化代理`,
        metadata: JSON.stringify({ agentCount: 4, skillCount: 6 }),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'register',
        module: 'auth',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({ email, name }),
        performedBy: 'system',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
          clone: { id: clone.id, name: clone.name, status: clone.status },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
