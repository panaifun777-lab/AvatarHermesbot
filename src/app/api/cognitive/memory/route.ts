import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agentId')
    const limit = parseInt(url.searchParams.get('limit') || '30')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (agentId) {
      where.tags = { contains: agentId }
    }

    const memories = await db.memoryEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const totalMemories = await db.memoryEntry.count({ where })

    const avgRelevance = await db.memoryEntry.aggregate({
      _avg: { relevanceScore: true },
      where,
    })

    // === Calculate Continuity Score ===
    // 1. Time continuity: shorter gaps between memories = higher score
    let timeContinuity = 0
    if (memories.length >= 2) {
      const sortedByTime = [...memories].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      let totalGap = 0
      let gapCount = 0
      for (let i = 1; i < sortedByTime.length; i++) {
        const gap = new Date(sortedByTime[i].createdAt).getTime() - new Date(sortedByTime[i - 1].createdAt).getTime()
        // Convert to hours, max 24 hours considered continuous
        const gapHours = gap / (1000 * 60 * 60)
        if (gapHours < 24) {
          totalGap += gapHours
          gapCount++
        }
      }
      if (gapCount > 0) {
        const avgGapHours = totalGap / gapCount
        // Smaller average gap = higher continuity (2h gap ~ 90%, 12h gap ~ 50%, 24h gap ~ 0%)
        timeContinuity = Math.max(0, Math.min(100, 100 - (avgGapHours / 24) * 100))
      }
    }

    // 2. Cross-reference continuity: shared tags between consecutive memories
    let crossRefContinuity = 0
    if (memories.length >= 2) {
      let sharedTagCount = 0
      for (let i = 1; i < memories.length; i++) {
        const tags1 = (memories[i - 1].tags || '').split(',').map(t => t.trim()).filter(Boolean)
        const tags2 = (memories[i].tags || '').split(',').map(t => t.trim()).filter(Boolean)
        const shared = tags1.filter(t => tags2.includes(t))
        if (shared.length > 0) sharedTagCount++
      }
      crossRefContinuity = (sharedTagCount / (memories.length - 1)) * 100
    }

    // 3. Agent-specific memory chains
    const agentMemoryMap = new Map<string, unknown[]>()
    for (const memory of memories) {
      const tags = (memory.tags || '').split(',').map(t => t.trim()).filter(Boolean)
      const agentTag = tags.find(t => ['CEO', 'CTO', 'Growth', 'Engineer'].includes(t))
      if (agentTag) {
        if (!agentMemoryMap.has(agentTag)) {
          agentMemoryMap.set(agentTag, [])
        }
        agentMemoryMap.get(agentTag)!.push(memory)
      }
    }

    // Memory chains: group by sourceType
    const sourceGroups = new Map<string, unknown[]>()
    for (const memory of memories) {
      const source = memory.sourceType || 'unknown'
      if (!sourceGroups.has(source)) {
        sourceGroups.set(source, [])
      }
      sourceGroups.get(source)!.push(memory)
    }

    const memoryChains = Array.from(sourceGroups.entries()).map(([sourceType, items]) => ({
      sourceType,
      count: items.length,
      latestContent: (items[0] as { content: string })?.content || '',
      relevanceAvg: items.reduce((sum: number, m: unknown) => sum + ((m as { relevanceScore: number }).relevanceScore || 0), 0) / items.length,
    }))

    // Combined continuity score
    const relevanceContinuity = Math.min((avgRelevance._avg.relevanceScore || 0) * 100, 100)
    const continuityScore = Math.round(
      timeContinuity * 0.3 + crossRefContinuity * 0.3 + relevanceContinuity * 0.2 + (totalMemories > 10 ? 20 : totalMemories * 2)
    )

    return NextResponse.json({
      memories,
      total: totalMemories,
      continuity: continuityScore,
      continuityBreakdown: {
        timeContinuity: Math.round(timeContinuity),
        crossRefContinuity: Math.round(crossRefContinuity),
        relevanceContinuity: Math.round(relevanceContinuity),
      },
      memoryChains,
      agentMemoryCounts: Object.fromEntries(
        Array.from(agentMemoryMap.entries()).map(([k, v]) => [k, v.length])
      ),
    })
  } catch (error) {
    console.error('Failed to fetch memories:', error)
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}
