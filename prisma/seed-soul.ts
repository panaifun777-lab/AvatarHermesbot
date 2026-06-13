import { db } from '@/lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function seedSoul() {
  console.log('🧠 Seeding SOUL config and memory entries...')

  // 1. Read SOUL.md and create SoulConfig entry
  const soulPath = join(process.cwd(), 'upload', 'SOUL.md')
  let soulContent: string
  try {
    soulContent = readFileSync(soulPath, 'utf-8')
    console.log(`📄 Read SOUL.md (${soulContent.length} chars)`)
  } catch (err) {
    console.error('❌ Failed to read SOUL.md:', err)
    process.exit(1)
  }

  const soulConfig = await db.soulConfig.upsert({
    where: { name: 'piaoshu-soul-v1' },
    update: {
      content: soulContent,
      version: { increment: 1 },
      isActive: true,
      description: '飘叔行为操作系统 - 核心心智模型与决策启发式',
    },
    create: {
      name: 'piaoshu-soul-v1',
      content: soulContent,
      version: 1,
      isActive: true,
      description: '飘叔行为操作系统 - 核心心智模型与决策启发式',
    },
  })
  console.log('✅ SoulConfig created:', soulConfig.name, 'v' + soulConfig.version)

  // 2. Find existing DecisionLog entries and create 3 MemoryEntry records
  const decisionLogs = await db.decisionLog.findMany({ take: 3 })

  if (decisionLogs.length > 0) {
    const memoryEntries = []
    for (const dl of decisionLogs) {
      const entry = await db.memoryEntry.create({
        data: {
          sourceType: 'decision_log',
          sourceId: dl.id,
          content: `决策记忆: ${dl.title} - ${dl.category}类别, 置信度${dl.confidence}${dl.outcome ? ', 结果: ' + dl.outcome : ''}`,
          tags: `${dl.category},decision,confidence:${dl.confidence}`,
          relevanceScore: dl.confidence,
          accessCount: 0,
        },
      })
      memoryEntries.push(entry)
    }
    console.log('✅ MemoryEntry records created from DecisionLogs:', memoryEntries.length)
  } else {
    // Fallback: create generic memory entries if no decision logs exist
    const fallbackMemories = [
      {
        sourceType: 'decision_log',
        content: '战略决策: 切入垂直SaaS市场，初期增长符合预期，置信度0.92',
        tags: 'strategic,market-entry,high-confidence',
        relevanceScore: 0.92,
      },
      {
        sourceType: 'decision_log',
        content: '融资决策: 推迟C轮融资，现金流充裕观望市场，置信度0.78',
        tags: 'strategic,fundraising,cautious',
        relevanceScore: 0.78,
      },
      {
        sourceType: 'decision_log',
        content: '技术决策: 转向AI-first产品架构，架构设计阶段，置信度0.71',
        tags: 'technical,architecture,ai-first',
        relevanceScore: 0.71,
      },
    ]

    for (const mem of fallbackMemories) {
      await db.memoryEntry.create({ data: mem })
    }
    console.log('✅ MemoryEntry records created (fallback):', fallbackMemories.length)
  }

  // 3. Create 5 sample Notification entries
  const notifications = [
    {
      type: 'success',
      title: '认知分身训练完成',
      message: '战略决策分身已完成最新一轮训练，置信度提升至0.87',
      module: 'cognitive',
      actionUrl: '/cognitive',
    },
    {
      type: 'warning',
      title: '红蓝对抗发现风险',
      message: '风险扫描分身检测到产品方向假设存在潜在漏洞，建议复查',
      module: 'cognitive',
      actionUrl: '/cognitive',
    },
    {
      type: 'info',
      title: '新证据上链确认',
      message: 'A/B测试首页转化率数据已成功上链，状态更新为verified',
      module: 'evidence',
      actionUrl: '/evidence',
    },
    {
      type: 'error',
      title: '协作任务安全扫描未通过',
      message: '智能合约审计任务CI扫描发现1个高危漏洞，已自动暂停',
      module: 'collaboration',
      actionUrl: '/collaboration',
    },
    {
      type: 'info',
      title: '路线图里程碑更新',
      message: 'Phase 1 "搭建Qdrant向量库"已完成，下一里程碑进行中',
      module: 'roadmap',
      actionUrl: '/roadmap',
    },
  ]

  for (const n of notifications) {
    await db.notification.create({ data: n })
  }
  console.log('✅ Notification records created:', notifications.length)

  // 4. Create 3 AuditLog entries
  const auditLogs = [
    {
      action: 'create',
      module: 'cognitive',
      entityType: 'shard',
      details: JSON.stringify({
        shardName: '战略决策分身',
        modelBase: 'qwen-72b',
        status: 'active',
        confidence: 0.87,
      }),
      performedBy: 'system',
    },
    {
      action: 'sign',
      module: 'evidence',
      entityType: 'evidence',
      details: JSON.stringify({
        evidenceTitle: 'A/B测试 - 首页转化率',
        action: 'VC签名并上链',
        newStatus: 'onchain',
      }),
      performedBy: 'founder',
    },
    {
      action: 'simulate',
      module: 'cognitive',
      entityType: 'shard',
      details: JSON.stringify({
        inputIdea: '切入垂直SaaS市场',
        verdict: '可行，但需关注市场天花板',
        confidence: 0.82,
      }),
      performedBy: 'system',
    },
  ]

  for (const a of auditLogs) {
    await db.auditLog.create({ data: a })
  }
  console.log('✅ AuditLog records created:', auditLogs.length)

  console.log('🎉 Soul seed complete!')
}

seedSoul()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
