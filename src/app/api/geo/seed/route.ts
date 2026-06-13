import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/geo/seed - Seed demo GEO data
export async function POST() {
  try {
    const existing = await db.gEOKeyword.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'GEO data already seeded', count: existing })
    }

    // Get or create verticals
    let techVertical = await db.mediaVertical.findUnique({ where: { slug: 'tech' } })
    let financeVertical = await db.mediaVertical.findUnique({ where: { slug: 'finance' } })
    let lifestyleVertical = await db.mediaVertical.findUnique({ where: { slug: 'lifestyle' } })

    if (!techVertical) {
      techVertical = await db.mediaVertical.create({
        data: { name: '科技', slug: 'tech', icon: '💻', color: 'cyan', description: 'AI、区块链、Web3', status: 'active', priority: 10 },
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

    // Create keywords
    const keywords = await Promise.all([
      // Tech keywords
      db.gEOKeyword.create({
        data: {
          verticalId: techVertical.id,
          keyword: 'AI智能体开发',
          keywordEn: 'AI agent development',
          category: 'core',
          intent: 'informational',
          searchVolume: 12000,
          difficulty: 72,
          currentRank: 5,
          targetRank: 1,
          status: 'optimizing',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: techVertical.id,
          keyword: 'RAG检索增强生成',
          keywordEn: 'RAG retrieval augmented generation',
          category: 'core',
          intent: 'informational',
          searchVolume: 8500,
          difficulty: 65,
          currentRank: 3,
          targetRank: 1,
          status: 'ranked',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: techVertical.id,
          keyword: '大模型微调方法',
          keywordEn: 'LLM fine-tuning methods',
          category: 'long_tail',
          intent: 'informational',
          searchVolume: 5200,
          difficulty: 58,
          currentRank: 12,
          targetRank: 5,
          status: 'optimizing',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: techVertical.id,
          keyword: 'GPT替代方案对比',
          keywordEn: 'GPT alternatives comparison',
          category: 'competitor',
          intent: 'transactional',
          searchVolume: 15000,
          difficulty: 80,
          currentRank: 18,
          targetRank: 5,
          status: 'tracked',
        },
      }),
      // Finance keywords
      db.gEOKeyword.create({
        data: {
          verticalId: financeVertical.id,
          keyword: 'DeFi收益策略2024',
          keywordEn: 'DeFi yield strategy 2024',
          category: 'core',
          intent: 'informational',
          searchVolume: 9800,
          difficulty: 68,
          currentRank: 7,
          targetRank: 3,
          status: 'optimizing',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: financeVertical.id,
          keyword: '数字人民币使用指南',
          keywordEn: 'digital yuan guide',
          category: 'core',
          intent: 'informational',
          searchVolume: 22000,
          difficulty: 55,
          currentRank: 2,
          targetRank: 1,
          status: 'ranked',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: financeVertical.id,
          keyword: '区块链金融应用场景',
          keywordEn: 'blockchain finance applications',
          category: 'emerging',
          intent: 'informational',
          searchVolume: 3200,
          difficulty: 45,
          currentRank: 8,
          targetRank: 3,
          status: 'optimizing',
        },
      }),
      // Lifestyle keywords
      db.gEOKeyword.create({
        data: {
          verticalId: lifestyleVertical.id,
          keyword: '极简生活指南',
          keywordEn: 'minimalist living guide',
          category: 'core',
          intent: 'informational',
          searchVolume: 18000,
          difficulty: 60,
          currentRank: 4,
          targetRank: 1,
          status: 'optimizing',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: lifestyleVertical.id,
          keyword: '地中海饮食食谱',
          keywordEn: 'Mediterranean diet recipes',
          category: 'long_tail',
          intent: 'transactional',
          searchVolume: 28000,
          difficulty: 52,
          currentRank: 1,
          targetRank: 1,
          status: 'ranked',
        },
      }),
      db.gEOKeyword.create({
        data: {
          verticalId: lifestyleVertical.id,
          keyword: '数字游民签证',
          keywordEn: 'digital nomad visa',
          category: 'emerging',
          intent: 'navigational',
          searchVolume: 6500,
          difficulty: 40,
          currentRank: 15,
          targetRank: 5,
          status: 'tracked',
        },
      }),
    ])

    // Create rankings for keywords
    const rankings = await Promise.all([
      // AI智能体开发 rankings
      db.gEORanking.create({ data: { keywordId: keywords[0].id, rank: 8, aiCitation: false, source: 'google', capturedAt: new Date(Date.now() - 30 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[0].id, rank: 6, aiCitation: true, citationUrl: 'https://example.com/ai-agent', source: 'perplexity', capturedAt: new Date(Date.now() - 14 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[0].id, rank: 5, aiCitation: true, citationUrl: 'https://example.com/ai-agent-v2', source: 'chatgpt', capturedAt: new Date() } }),
      // RAG rankings
      db.gEORanking.create({ data: { keywordId: keywords[1].id, rank: 7, aiCitation: false, source: 'google', capturedAt: new Date(Date.now() - 30 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[1].id, rank: 3, aiCitation: true, citationUrl: 'https://example.com/rag-guide', source: 'perplexity', capturedAt: new Date() } }),
      // DeFi rankings
      db.gEORanking.create({ data: { keywordId: keywords[4].id, rank: 12, aiCitation: false, source: 'google', capturedAt: new Date(Date.now() - 21 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[4].id, rank: 7, aiCitation: true, citationUrl: 'https://example.com/defi-yield', source: 'chatgpt', capturedAt: new Date() } }),
      // 数字人民币 rankings
      db.gEORanking.create({ data: { keywordId: keywords[5].id, rank: 5, aiCitation: false, source: 'google', capturedAt: new Date(Date.now() - 14 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[5].id, rank: 2, aiCitation: true, citationUrl: 'https://example.com/digital-yuan', source: 'bing', capturedAt: new Date() } }),
      // 极简生活 rankings
      db.gEORanking.create({ data: { keywordId: keywords[7].id, rank: 6, aiCitation: true, citationUrl: 'https://example.com/minimalist', source: 'perplexity', capturedAt: new Date(Date.now() - 7 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[7].id, rank: 4, aiCitation: true, citationUrl: 'https://example.com/minimalist-v2', source: 'chatgpt', capturedAt: new Date() } }),
      // 地中海饮食 rankings
      db.gEORanking.create({ data: { keywordId: keywords[8].id, rank: 3, aiCitation: true, citationUrl: 'https://example.com/med-diet', source: 'google', capturedAt: new Date(Date.now() - 10 * 86400000) } }),
      db.gEORanking.create({ data: { keywordId: keywords[8].id, rank: 1, aiCitation: true, citationUrl: 'https://example.com/med-diet-top', source: 'perplexity', capturedAt: new Date() } }),
    ])

    await db.auditLog.create({
      data: {
        action: 'seed',
        module: 'geo',
        entityType: 'GEOKeyword',
        details: JSON.stringify({ keywords: keywords.length, rankings: rankings.length }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        keywords: keywords.length,
        rankings: rankings.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to seed GEO data:', error)
    return NextResponse.json({ error: 'Failed to seed GEO data' }, { status: 500 })
  }
}
