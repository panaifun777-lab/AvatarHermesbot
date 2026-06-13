import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/bd/seed - Seed demo BD data
export async function POST() {
  try {
    const existing = await db.bDPartner.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'BD data already seeded', count: existing })
    }

    // Get or create verticals to associate partners with
    let techVertical = await db.mediaVertical.findUnique({ where: { slug: 'tech' } })
    let financeVertical = await db.mediaVertical.findUnique({ where: { slug: 'finance' } })
    let lifestyleVertical = await db.mediaVertical.findUnique({ where: { slug: 'lifestyle' } })

    // Create verticals if they don't exist
    if (!techVertical) {
      techVertical = await db.mediaVertical.create({
        data: { name: '科技', slug: 'tech', icon: '💻', color: 'cyan', description: 'AI、区块链、Web3等前沿科技', status: 'active', priority: 10 },
      })
    }
    if (!financeVertical) {
      financeVertical = await db.mediaVertical.create({
        data: { name: '金融', slug: 'finance', icon: '💰', color: 'amber', description: '金融科技、投资理财', status: 'active', priority: 8 },
      })
    }
    if (!lifestyleVertical) {
      lifestyleVertical = await db.mediaVertical.create({
        data: { name: '生活方式', slug: 'lifestyle', icon: '🌿', color: 'emerald', description: '健康、旅行、美食', status: 'active', priority: 6 },
      })
    }

    // Create BD partners
    const partners = await Promise.all([
      db.bDPartner.create({
        data: {
          verticalId: techVertical.id,
          name: 'AI安全研究院',
          partnerType: 'data_source',
          tier: 'a',
          industry: 'AI安全研究',
          website: 'https://aisi.example.org',
          contactName: '张明',
          contactEmail: 'zhangming@aisi.example.org',
          status: 'active',
          stage: 'closed_won',
          valueScore: 92,
          notes: '顶级AI安全数据源，已签署合作协议',
          lastContactAt: new Date(),
        },
      }),
      db.bDPartner.create({
        data: {
          verticalId: techVertical.id,
          name: 'OpenData平台',
          partnerType: 'distribution',
          tier: 'b',
          industry: '开源数据平台',
          website: 'https://opendata.example.com',
          contactName: '李芳',
          contactEmail: 'lifang@opendata.example.com',
          status: 'negotiating',
          stage: 'proposal',
          valueScore: 78,
          notes: '数据分发合作，提案已提交',
          lastContactAt: new Date(Date.now() - 3 * 86400000),
        },
      }),
      db.bDPartner.create({
        data: {
          verticalId: financeVertical.id,
          name: '金融数据科技',
          partnerType: 'data_source',
          tier: 'a',
          industry: '金融数据服务',
          website: 'https://findata.example.com',
          contactName: '王建国',
          contactEmail: 'wangjg@findata.example.com',
          contactWechat: 'wjg_findata',
          status: 'outreach',
          stage: 'contacted',
          valueScore: 85,
          notes: '头部金融数据供应商，已初次沟通',
          lastContactAt: new Date(Date.now() - 7 * 86400000),
        },
      }),
      db.bDPartner.create({
        data: {
          verticalId: financeVertical.id,
          name: '链上分析实验室',
          partnerType: 'tech_infra',
          tier: 'b',
          industry: '区块链数据分析',
          website: 'https://onchain-lab.example.com',
          contactName: '赵婷',
          contactEmail: 'zhaoting@onchain-lab.example.com',
          status: 'active',
          stage: 'closed_won',
          valueScore: 75,
          notes: '链上数据分析基础设施合作方',
          lastContactAt: new Date(Date.now() - 2 * 86400000),
        },
      }),
      db.bDPartner.create({
        data: {
          verticalId: lifestyleVertical.id,
          name: '美妆成分检测中心',
          partnerType: 'data_source',
          tier: 'a',
          industry: '美妆检测',
          contactName: '陈丽',
          contactEmail: 'chenli@beautytest.example.cn',
          status: 'prospect',
          stage: 'identified',
          valueScore: 70,
          notes: '国内权威美妆成分检测机构，尚未接触',
        },
      }),
      db.bDPartner.create({
        data: {
          verticalId: lifestyleVertical.id,
          name: '健康生活科技',
          partnerType: 'distribution',
          tier: 'c',
          industry: '健康科技',
          website: 'https://healthtech.example.com',
          contactName: '刘洋',
          contactEmail: 'liuyang@healthtech.example.com',
          status: 'negotiating',
          stage: 'meeting',
          valueScore: 65,
          notes: '健康内容分发合作，已安排线下会面',
          lastContactAt: new Date(Date.now() - 5 * 86400000),
        },
      }),
    ])

    // Create interactions for each partner
    const interactions = await Promise.all([
      // AI安全研究院 interactions
      db.bDInteraction.create({
        data: {
          partnerId: partners[0].id,
          type: 'email',
          subject: '初步合作意向沟通',
          content: '发送了合作提案，对方表示有兴趣',
          outcome: '对方同意进一步讨论',
          nextAction: '安排线上会议',
        },
      }),
      db.bDInteraction.create({
        data: {
          partnerId: partners[0].id,
          type: 'meeting',
          subject: '合作协议讨论会',
          content: '讨论了数据授权范围和定价模式',
          outcome: '达成初步协议框架',
          nextAction: '法务审核合同',
        },
      }),
      db.bDInteraction.create({
        data: {
          partnerId: partners[0].id,
          type: 'contract_signed',
          subject: '数据授权合作协议签署',
          content: '正式签署1年期数据授权合作协议',
          outcome: '合作正式生效',
          nextAction: '技术对接数据API',
        },
      }),
      // OpenData平台 interactions
      db.bDInteraction.create({
        data: {
          partnerId: partners[1].id,
          type: 'email',
          subject: '分发合作提案',
          content: '提交了内容分发合作提案书',
          outcome: '等待对方反馈',
          nextAction: '跟进提案进度',
          followUpDate: new Date(Date.now() + 7 * 86400000),
        },
      }),
      // 金融数据科技 interactions
      db.bDInteraction.create({
        data: {
          partnerId: partners[2].id,
          type: 'wechat',
          subject: '初次微信沟通',
          content: '通过微信介绍了平台和合作意向',
          outcome: '对方要求发送详细资料',
          nextAction: '发送合作资料包',
          followUpDate: new Date(Date.now() + 3 * 86400000),
        },
      }),
      // 链上分析实验室 interactions
      db.bDInteraction.create({
        data: {
          partnerId: partners[3].id,
          type: 'meeting',
          subject: '技术架构对接会',
          content: '讨论了API对接方案和数据格式',
          outcome: '技术方案确认',
          nextAction: '开始集成开发',
        },
      }),
      // 健康生活科技 interactions
      db.bDInteraction.create({
        data: {
          partnerId: partners[5].id,
          type: 'call',
          subject: '合作模式电话沟通',
          content: '电话沟通了内容分发的合作模式',
          outcome: '约定线下见面详谈',
          nextAction: '安排线下会面',
          followUpDate: new Date(Date.now() + 5 * 86400000),
        },
      }),
    ])

    await db.auditLog.create({
      data: {
        action: 'seed',
        module: 'bd',
        entityType: 'BDPartner',
        details: JSON.stringify({ partners: partners.length, interactions: interactions.length }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        partners: partners.length,
        interactions: interactions.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to seed BD data:', error)
    return NextResponse.json({ error: 'Failed to seed BD data' }, { status: 500 })
  }
}
