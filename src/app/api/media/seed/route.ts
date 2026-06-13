import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/media/seed - Seed demo data for Media Matrix
export async function POST() {
  try {
    // Check if verticals already exist
    const existing = await db.mediaVertical.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Media data already seeded', count: existing })
    }

    // Create 3 verticals
    const techVertical = await db.mediaVertical.create({
      data: {
        name: '科技',
        slug: 'tech',
        icon: '💻',
        color: 'cyan',
        description: 'AI、区块链、Web3等前沿科技内容',
        status: 'active',
        priority: 10,
      },
    })

    const financeVertical = await db.mediaVertical.create({
      data: {
        name: '金融',
        slug: 'finance',
        icon: '💰',
        color: 'amber',
        description: '金融科技、投资理财、DeFi等金融领域',
        status: 'active',
        priority: 8,
      },
    })

    const lifestyleVertical = await db.mediaVertical.create({
      data: {
        name: '生活方式',
        slug: 'lifestyle',
        icon: '🌿',
        color: 'emerald',
        description: '健康、旅行、美食、文化等生活方式',
        status: 'active',
        priority: 6,
      },
    })

    // Create channels for each vertical
    const channels = await Promise.all([
      // Tech channels
      db.mediaChannel.create({
        data: {
          verticalId: techVertical.id,
          name: 'AI前沿观察',
          platform: 'wechat',
          url: 'https://mp.weixin.qq.com/ai-frontier',
          followers: 52000,
          avgReach: 8000,
          postFrequency: 'daily',
          status: 'active',
        },
      }),
      db.mediaChannel.create({
        data: {
          verticalId: techVertical.id,
          name: 'TechPioneer',
          platform: 'twitter',
          url: 'https://x.com/techpioneer',
          followers: 18000,
          avgReach: 5000,
          postFrequency: 'daily',
          status: 'growth',
        },
      }),
      db.mediaChannel.create({
        data: {
          verticalId: techVertical.id,
          name: '代码与算法',
          platform: 'xiaohongshu',
          followers: 35000,
          avgReach: 6000,
          postFrequency: 'weekly',
          status: 'active',
        },
      }),
      // Finance channels
      db.mediaChannel.create({
        data: {
          verticalId: financeVertical.id,
          name: '财智通',
          platform: 'wechat',
          url: 'https://mp.weixin.qq.com/caizhitong',
          followers: 88000,
          avgReach: 15000,
          postFrequency: 'daily',
          status: 'active',
        },
      }),
      db.mediaChannel.create({
        data: {
          verticalId: financeVertical.id,
          name: 'FinDaily',
          platform: 'twitter',
          url: 'https://x.com/findaily',
          followers: 12000,
          avgReach: 3000,
          postFrequency: 'daily',
          status: 'growth',
        },
      }),
      // Lifestyle channels
      db.mediaChannel.create({
        data: {
          verticalId: lifestyleVertical.id,
          name: '生活美学志',
          platform: 'xiaohongshu',
          followers: 120000,
          avgReach: 20000,
          postFrequency: 'daily',
          status: 'active',
        },
      }),
      db.mediaChannel.create({
        data: {
          verticalId: lifestyleVertical.id,
          name: 'LifestyleLab',
          platform: 'youtube',
          url: 'https://youtube.com/@lifestylelab',
          followers: 45000,
          avgReach: 10000,
          postFrequency: 'weekly',
          status: 'active',
        },
      }),
    ])

    // Create sample content for each vertical
    const contents = await Promise.all([
      // Tech content
      db.mediaContent.create({
        data: {
          verticalId: techVertical.id,
          title: 'GPT-5架构泄露：多模态推理的新范式',
          contentType: 'article',
          status: 'published',
          citationUrl: 'https://example.com/gpt5-architecture',
          reachCount: 12000,
          citationCount: 8,
          aiCitationCount: 3,
          publishedAt: new Date(),
        },
      }),
      db.mediaContent.create({
        data: {
          verticalId: techVertical.id,
          title: 'RAG系统优化实战：从检索到生成的全链路',
          contentType: 'article',
          status: 'indexed',
          reachCount: 8500,
          citationCount: 5,
          aiCitationCount: 2,
          publishedAt: new Date(),
        },
      }),
      db.mediaContent.create({
        data: {
          verticalId: techVertical.id,
          title: 'AI Agent工作流可视化教程',
          contentType: 'video',
          status: 'draft',
        },
      }),
      // Finance content
      db.mediaContent.create({
        data: {
          verticalId: financeVertical.id,
          title: '2024 DeFi收益农耕策略：风险与回报分析',
          contentType: 'article',
          status: 'published',
          citationUrl: 'https://example.com/defi-yield-farming',
          reachCount: 25000,
          citationCount: 12,
          aiCitationCount: 5,
          publishedAt: new Date(),
        },
      }),
      db.mediaContent.create({
        data: {
          verticalId: financeVertical.id,
          title: '央行数字货币最新进展解读',
          contentType: 'infographic',
          status: 'indexed',
          reachCount: 18000,
          citationCount: 6,
          aiCitationCount: 2,
          publishedAt: new Date(),
        },
      }),
      // Lifestyle content
      db.mediaContent.create({
        data: {
          verticalId: lifestyleVertical.id,
          title: '极简生活：30天断舍离挑战',
          contentType: 'article',
          status: 'published',
          citationUrl: 'https://example.com/minimalist-challenge',
          reachCount: 45000,
          citationCount: 15,
          aiCitationCount: 7,
          publishedAt: new Date(),
        },
      }),
      db.mediaContent.create({
        data: {
          verticalId: lifestyleVertical.id,
          title: '地中海饮食指南：科学认证的长寿密码',
          contentType: 'infographic',
          status: 'verified',
          contentHash: '0xabc123def456',
          reachCount: 32000,
          citationCount: 20,
          aiCitationCount: 10,
          publishedAt: new Date(),
        },
      }),
      db.mediaContent.create({
        data: {
          verticalId: lifestyleVertical.id,
          title: '数字游民生活vlog：巴厘岛篇',
          contentType: 'video',
          status: 'draft',
        },
      }),
    ])

    await db.auditLog.create({
      data: {
        action: 'seed',
        module: 'media',
        entityType: 'MediaVertical',
        details: JSON.stringify({
          verticals: 3,
          channels: channels.length,
          contents: contents.length,
        }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        verticals: 3,
        channels: channels.length,
        contents: contents.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to seed media data:', error)
    return NextResponse.json({ error: 'Failed to seed media data' }, { status: 500 })
  }
}
