import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

async function getSoulConfig(): Promise<string> {
  try {
    const soul = await db.soulConfig.findFirst({ where: { isActive: true } })
    return soul?.content || ''
  } catch {
    return ''
  }
}

const RED_TEAM_PROMPT = `你是一个无情的技术和战略红方攻击者。你的任务是对给定的想法进行最严酷的审视，找出所有致命漏洞和高危风险。

你必须：
1. 至少找出3个漏洞（致命/高危/中危各至少1个）
2. 每个漏洞必须具体、可操作，不允许模糊表述
3. 用飒叔的风格：短句、结论先行、绝不废话

输出格式（严格JSON）：
{
  "vulnerabilities": [
    {"severity": "致命|高危|中危", "description": "具体漏洞描述", "impact": "影响范围"}
  ],
  "overall_risk": "高|中|低",
  "confidence": 0.0-1.0
}`

const BLUE_TEAM_PROMPT = `你是一个战略防御者。针对红方提出的漏洞，给出防御策略和应对方案。

你必须：
1. 对每个漏洞给出防御策略
2. 策略必须具体可执行
3. 用飒叔的风格：务实、不堆砌概念、能跑就行

输出格式（严格JSON）：
{
  "defenses": [
    {"target_vulnerability": "对应漏洞", "strategy": "防御策略", "strength": "强|中|弱", "effort": "高|中|低"}
  ],
  "overall_defense_score": 0.0-1.0
}`

export async function GET() {
  try {
    const simulations = await db.redBlueSimulation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { shard: true },
      take: 50,
    })
    return NextResponse.json({ simulations })
  } catch (error) {
    console.error('Failed to fetch simulations:', error)
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { shardId, inputIdea } = body

    if (!inputIdea) {
      return NextResponse.json({ error: 'Input idea is required' }, { status: 400 })
    }

    const zai = await getZAI()
    const soulContent = await getSoulConfig()

    // Build context with SOUL.md personality
    const personalityContext = soulContent
      ? `\n\n你的行为规范（基于飘叔SOUL.md）：\n${soulContent.substring(0, 2000)}`
      : ''

    // Run Red Team analysis
    const redCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: RED_TEAM_PROMPT + personalityContext },
        { role: 'user', content: `分析以下想法的致命漏洞：\n\n${inputIdea}` },
      ],
      thinking: { type: 'disabled' },
    })

    // Run Blue Team defense
    const blueCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: BLUE_TEAM_PROMPT + personalityContext },
        { role: 'user', content: `针对以下想法的红方攻击结果，给出防御策略：\n\n想法：${inputIdea}\n\n红方攻击结果：${redCompletion.choices[0]?.message?.content || '无'}` },
      ],
      thinking: { type: 'disabled' },
    })

    const redOutput = redCompletion.choices[0]?.message?.content || ''
    const blueOutput = blueCompletion.choices[0]?.message?.content || ''

    // Parse confidence from outputs
    let confidence = 0.5
    try {
      const redJson = JSON.parse(redOutput)
      if (redJson.confidence !== undefined) confidence = redJson.confidence
      else if (redJson.overall_risk === '高') confidence = 0.3
      else if (redJson.overall_risk === '中') confidence = 0.6
      else confidence = 0.8
    } catch {
      // If JSON parsing fails, use default confidence
      confidence = 0.5
    }

    // Generate verdict
    const verdictPrompt = `基于红蓝对抗结果，给出最终裁定。一句话总结。风格：短句、结论先行。`
    const verdictCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: verdictPrompt + personalityContext },
        { role: 'user', content: `红方：${redOutput.substring(0, 500)}\n\n蓝方：${blueOutput.substring(0, 500)}\n\n置信度：${confidence.toFixed(2)}` },
      ],
      thinking: { type: 'disabled' },
    })
    const verdict = verdictCompletion.choices[0]?.message?.content || '分析完成'

    // Resolve shardId — if the provided shardId doesn't exist, find or create a default shard
    let resolvedShardId = shardId
    if (!resolvedShardId || resolvedShardId === 'default') {
      const defaultShard = await db.cognitiveShard.findFirst({ where: { name: 'default' } })
      if (defaultShard) {
        resolvedShardId = defaultShard.id
      } else {
        const newShard = await db.cognitiveShard.create({
          data: { name: 'default', description: '默认认知分片', shardType: 'red', status: 'active' },
        })
        resolvedShardId = newShard.id
      }
    } else {
      // Verify the shard exists
      const shard = await db.cognitiveShard.findUnique({ where: { id: resolvedShardId } })
      if (!shard) {
        const defaultShard = await db.cognitiveShard.findFirst({ where: { name: 'default' } })
        if (defaultShard) {
          resolvedShardId = defaultShard.id
        } else {
          const newShard = await db.cognitiveShard.create({
            data: { name: 'default', description: '默认认知分片', shardType: 'red', status: 'active' },
          })
          resolvedShardId = newShard.id
        }
      }
    }

    // Save simulation
    const simulation = await db.redBlueSimulation.create({
      data: {
        shardId: resolvedShardId,
        inputIdea,
        redOutput,
        blueOutput,
        verdict,
        confidence,
        status: confidence >= 0.6 ? 'completed' : 'escalated',
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'simulate',
        module: 'cognitive',
        entityType: 'simulation',
        entityId: simulation.id,
        details: JSON.stringify({ confidence, status: simulation.status }),
        performedBy: 'system',
      },
    })

    // Create memory entry
    await db.memoryEntry.create({
      data: {
        sourceType: 'simulation',
        sourceId: simulation.id,
        content: `红蓝对抗: ${inputIdea.substring(0, 100)} → 置信度${confidence.toFixed(2)} → ${simulation.status === 'escalated' ? '需人工介入' : '通过'}`,
        tags: '红蓝对抗,认知分片',
        relevanceScore: confidence,
      },
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (error) {
    console.error('Failed to run simulation:', error)
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 })
  }
}
