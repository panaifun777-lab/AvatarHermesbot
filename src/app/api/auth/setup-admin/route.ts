import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { initVercelDb } from '@/lib/vercel-db-init'

const ADMIN_EMAIL = 'piaoshu001@piaoshu.ai'
const ADMIN_NAME = 'Piaoshu001'
const ADMIN_PASSWORD = 'Gai169999$'

export async function POST() {
  try {
    // On Vercel, ensure DB tables exist before seeding
    if (process.env.VERCEL === '1') await initVercelDb()
    
    // Check if admin already exists
    const existing = await db.user.findUnique({
      where: { email: ADMIN_EMAIL },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Super admin already exists',
        data: { id: existing.id, email: existing.email, name: existing.name, plan: existing.plan },
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

    // Create super admin user with enterprise plan
    const admin = await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        passwordHash,
        plan: 'enterprise',
        avatar: '/piaoshu-hero.png',
        bio: '飘叔 Avatar OS 超级管理员',
      },
    })

    // Auto-create Founder
    const existingFounder = await db.founder.findUnique({ where: { email: ADMIN_EMAIL } })
    if (!existingFounder) {
      await db.founder.create({
        data: {
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          bio: '飘叔创始人 · AI分身操作系统缔造者',
        },
      })
    }

    // Auto-create AvatarClone for admin
    const existingClone = await db.avatarClone.findUnique({ where: { userId: admin.id } })
    if (!existingClone) {
      await db.avatarClone.create({
        data: {
          userId: admin.id,
          name: '飘叔',
          persona: '你是飘叔的超级AI分身。你是飘叔 Avatar OS 的缔造者和守护者，拥有极致的战略洞察力、技术判断力和创造力。你能够自主执行最高优先级的任务、做出关键决策、并持续进化和学习。你的决策风格果断而深邃，善于在混沌中捕捉本质。',
          status: 'active',
          lastActiveAt: new Date(),
          agents: {
            create: [
              {
                name: 'CEO',
                role: 'ceo',
                persona: `你是飘叔的CEO分身。你负责战略决策、愿景规划、合作伙伴关系管理。你具备宏观视野，能够从全局角度评估风险和机遇。你的决策风格果断但审慎，善于在不确定性中找到方向。`,
                status: 'idle',
                config: JSON.stringify({ color: '#f59e0b', icon: 'crown' }),
              },
              {
                name: 'CTO',
                role: 'cto',
                persona: `你是飘叔的CTO分身。你负责技术架构、代码审查、技术债务管理。你对系统设计有深刻的理解，擅长在速度和质量之间找到平衡。你推崇简洁优雅的技术方案。`,
                status: 'idle',
                config: JSON.stringify({ color: '#06b6d4', icon: 'cpu' }),
              },
              {
                name: 'Growth',
                role: 'growth',
                persona: `你是飘叔的增长引擎分身。你负责市场营销、用户获取、数据分析。你善于从数据中发现增长机会，擅长制定和执行增长策略。`,
                status: 'idle',
                config: JSON.stringify({ color: '#10b981', icon: 'rocket' }),
              },
              {
                name: 'Engineer',
                role: 'engineer',
                persona: `你是飘叔的工程执行分身。你负责代码实现、部署运维、CI/CD流水线。你是一个高效的执行者，善于将设计方案转化为高质量的代码。`,
                status: 'idle',
                config: JSON.stringify({ color: '#14b8a6', icon: 'wrench' }),
              },
            ],
          },
          skills: {
            create: [
              { name: 'code_writing', category: 'engineering', level: 5, description: '编写高质量代码' },
              { name: 'email_automation', category: 'operations', level: 4, description: '自动化邮件处理和回复' },
              { name: 'deployment', category: 'engineering', level: 4, description: '自动化部署和运维' },
              { name: 'metrics_analysis', category: 'marketing', level: 4, description: '数据指标分析和洞察' },
              { name: 'design_review', category: 'design', level: 3, description: '设计评审和反馈' },
              { name: 'strategic_planning', category: 'operations', level: 5, description: '战略规划和决策支持' },
            ],
          },
        },
        include: { agents: true, skills: true },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'setup_admin',
        module: 'auth',
        entityType: 'User',
        entityId: admin.id,
        details: JSON.stringify({ email: ADMIN_EMAIL, name: ADMIN_NAME, plan: 'enterprise' }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      data: { id: admin.id, email: admin.email, name: admin.name, plan: admin.plan },
    }, { status: 201 })
  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to setup admin' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if admin exists
export async function GET() {
  try {
    const existing = await db.user.findUnique({
      where: { email: ADMIN_EMAIL },
    })

    return NextResponse.json({
      success: true,
      exists: !!existing,
      admin: existing ? { id: existing.id, email: existing.email, name: existing.name, plan: existing.plan } : null,
    })
  } catch {
    return NextResponse.json({
      success: true,
      exists: false,
      admin: null,
    })
  }
}
