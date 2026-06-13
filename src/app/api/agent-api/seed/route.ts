import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/agent-api/seed - Seed demo agent API endpoints
export async function POST() {
  try {
    const existing = await db.agentAPIEndpoint.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Agent API endpoints already seeded', count: existing })
    }

    const endpoints = await Promise.all([
      db.agentAPIEndpoint.create({
        data: {
          name: 'AI引用查询',
          path: '/api/agent/citations',
          method: 'GET',
          description: '查询指定内容的AI引用情况，包括引用来源、次数和时间线',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              contentId: { type: 'string', description: '内容ID' },
              source: { type: 'string', enum: ['all', 'perplexity', 'chatgpt', 'bing'], description: 'AI来源过滤' },
              timeRange: { type: 'string', enum: ['7d', '30d', '90d', 'all'], description: '时间范围' },
            },
            required: ['contentId'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              totalCitations: { type: 'integer' },
              sources: { type: 'array', items: { type: 'object', properties: { source: { type: 'string' }, count: { type: 'integer' } } } },
              timeline: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, count: { type: 'integer' } } } },
            },
          }),
          authRequired: true,
          rateLimit: 50,
          callCount: 1247,
          lastCalledAt: new Date(),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: '内容优化建议',
          path: '/api/agent/optimize',
          method: 'POST',
          description: '基于GEO分析提供内容优化建议，提升AI搜索排名',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              contentId: { type: 'string', description: '内容ID' },
              targetKeywords: { type: 'array', items: { type: 'string' }, description: '目标关键词' },
              optimizationGoal: { type: 'string', enum: ['ai_citation', 'search_rank', 'authority'], description: '优化目标' },
            },
            required: ['contentId'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              suggestions: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, priority: { type: 'string' }, description: { type: 'string' } } } },
              estimatedImpact: { type: 'object', properties: { rankImprovement: { type: 'integer' }, citationIncrease: { type: 'number' } } },
            },
          }),
          authRequired: true,
          rateLimit: 30,
          callCount: 856,
          lastCalledAt: new Date(Date.now() - 3600000),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: 'BD智能匹配',
          path: '/api/agent/bd-match',
          method: 'POST',
          description: '基于业务需求智能匹配合作伙伴，生成分值排序的推荐列表',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              verticalId: { type: 'string', description: '垂直领域ID' },
              partnerType: { type: 'string', enum: ['data_source', 'distribution', 'tech_infra'], description: '合作类型' },
              criteria: { type: 'object', description: '匹配条件' },
            },
            required: ['verticalId'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              matches: { type: 'array', items: { type: 'object', properties: { partnerId: { type: 'string' }, score: { type: 'number' }, reasons: { type: 'array', items: { type: 'string' } } } } },
            },
          }),
          authRequired: true,
          rateLimit: 20,
          callCount: 342,
          lastCalledAt: new Date(Date.now() - 7200000),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: '关键词趋势分析',
          path: '/api/agent/keyword-trends',
          method: 'GET',
          description: '分析关键词的搜索趋势、竞争度和AI引用率',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              keywords: { type: 'array', items: { type: 'string' }, description: '关键词列表' },
              period: { type: 'string', enum: ['7d', '30d', '90d', '1y'], description: '分析周期' },
              includeCompetitors: { type: 'boolean', description: '是否包含竞品数据' },
            },
            required: ['keywords'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              trends: { type: 'array', items: { type: 'object', properties: { keyword: { type: 'string' }, volume: { type: 'integer' }, trend: { type: 'string' }, aiCitationRate: { type: 'number' } } } },
            },
          }),
          authRequired: true,
          rateLimit: 40,
          callCount: 623,
          lastCalledAt: new Date(Date.now() - 1800000),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: '内容生成工作流',
          path: '/api/agent/content-pipeline',
          method: 'POST',
          description: '触发自动化内容生成工作流，包含研究、撰写、优化、发布全流程',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              verticalId: { type: 'string' },
              topic: { type: 'string' },
              contentType: { type: 'string', enum: ['article', 'video', 'infographic', 'micro_content'] },
              targetKeywords: { type: 'array', items: { type: 'string' } },
              autoPublish: { type: 'boolean' },
            },
            required: ['verticalId', 'topic', 'contentType'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              pipelineId: { type: 'string' },
              status: { type: 'string' },
              estimatedCompletionTime: { type: 'string' },
            },
          }),
          authRequired: true,
          rateLimit: 10,
          callCount: 189,
          lastCalledAt: new Date(Date.now() - 14400000),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: '合作伙伴健康度',
          path: '/api/agent/partner-health',
          method: 'GET',
          description: '查询合作伙伴关系的健康度指标，包含互动频率、价值实现和风险预警',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              partnerId: { type: 'string' },
              includeRecommendations: { type: 'boolean' },
            },
            required: ['partnerId'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              healthScore: { type: 'number' },
              metrics: { type: 'object' },
              alerts: { type: 'array', items: { type: 'object' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
          }),
          authRequired: true,
          rateLimit: 60,
          callCount: 456,
          lastCalledAt: new Date(Date.now() - 5400000),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: '批量数据同步',
          path: '/api/agent/sync',
          method: 'POST',
          description: '批量同步外部数据源，支持多种数据格式和增量/全量同步模式',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              source: { type: 'string', enum: ['analytics', 'social', 'search_console', 'crm'] },
              mode: { type: 'string', enum: ['incremental', 'full'] },
              dateRange: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } } },
            },
            required: ['source'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              syncId: { type: 'string' },
              recordsProcessed: { type: 'integer' },
              errors: { type: 'integer' },
              status: { type: 'string' },
            },
          }),
          authRequired: true,
          rateLimit: 5,
          callCount: 78,
          lastCalledAt: new Date(Date.now() - 86400000),
          status: 'active',
        },
      }),
      db.agentAPIEndpoint.create({
        data: {
          name: '知识图谱查询',
          path: '/api/agent/knowledge-graph',
          method: 'GET',
          description: '查询内容之间的知识关联图谱，发现跨垂直领域的内容关联',
          requestSchema: JSON.stringify({
            type: 'object',
            properties: {
              entityId: { type: 'string' },
              depth: { type: 'integer', minimum: 1, maximum: 3 },
              relationTypes: { type: 'array', items: { type: 'string' } },
            },
            required: ['entityId'],
          }),
          responseSchema: JSON.stringify({
            type: 'object',
            properties: {
              nodes: { type: 'array', items: { type: 'object' } },
              edges: { type: 'array', items: { type: 'object' } },
            },
          }),
          authRequired: true,
          rateLimit: 30,
          status: 'maintenance',
        },
      }),
    ])

    await db.auditLog.create({
      data: {
        action: 'seed',
        module: 'agent-api',
        entityType: 'AgentAPIEndpoint',
        details: JSON.stringify({ endpoints: endpoints.length }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({
      success: true,
      data: { endpoints: endpoints.length },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to seed agent API endpoints:', error)
    return NextResponse.json({ error: 'Failed to seed agent API endpoints' }, { status: 500 })
  }
}
