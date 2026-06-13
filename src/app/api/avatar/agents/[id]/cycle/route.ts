import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { compress, generateContentHash } from '@/lib/aaak-compressor'
import { wakeUp } from '@/lib/memory-loader'
import { seedDefaultWings } from '@/lib/memory-seed'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

async function getClonePersona(cloneId: string): Promise<string> {
  try {
    const clone = await db.avatarClone.findUnique({ where: { id: cloneId } })
    return clone?.persona || ''
  } catch {
    return ''
  }
}

// Auto-classify content into a room using LLM
async function classifyToRoom(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  cloneId: string,
  content: string,
  agentRole: string
): Promise<string | null> {
  try {
    // Ensure wings exist
    await seedDefaultWings(cloneId)

    // Get available rooms
    const rooms = await db.memoryRoom.findMany({
      where: { wing: { cloneId } },
      include: { wing: { select: { name: true, priority: true } } },
      orderBy: { wing: { priority: 'desc' } },
    })

    if (rooms.length === 0) return null

    const roomOptions = rooms.map(r =>
      `${r.id}: ${r.wing.name}/${r.name} (${r.hallType})`
    ).join('\n')

    const classifyPrompt = `你是一个记忆分类器。请将以下内容分类到最合适的记忆房间。

可用房间：
${roomOptions}

内容来源代理角色: ${agentRole}
内容摘要: ${content.substring(0, 300)}

只输出最合适的房间ID，不要其他文字。`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: classifyPrompt },
        { role: 'user', content: '请分类' },
      ],
      thinking: { type: 'disabled' },
    })

    const roomId = completion.choices[0]?.message?.content?.trim() || ''

    // Verify the room exists
    const room = await db.memoryRoom.findFirst({
      where: { id: roomId, wing: { cloneId } },
    })
    return room?.id || null
  } catch {
    // Classification is best-effort
    return null
  }
}

// Auto-extract KG entities and triples from cycle report
async function extractKGFacts(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  cloneId: string,
  reportContent: string,
  drawerId: string
): Promise<number> {
  try {
    const kgPrompt = `从以下代理周期报告中提取知识图谱三元组。每个三元组包含：主体、谓词、客体。

报告内容：
${reportContent.substring(0, 1500)}

输出格式（严格JSON）：
{
  "triples": [
    {"subject": "主体名称", "predicate": "谓词(如:works_on,decided,prefers,owns,reports_to)", "object": "客体名称", "entity_types": {"subject": "person|project|technology|concept|organization", "object": "person|project|technology|concept|organization"}, "confidence": 0.5-1.0}
  ]
}

只提取明确的、事实性的关系，不要推断。最多5个三元组。`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: kgPrompt },
        { role: 'user', content: '请提取知识图谱三元组' },
      ],
      thinking: { type: 'disabled' },
    })

    const output = completion.choices[0]?.message?.content || ''
    const json = JSON.parse(output)

    if (!json.triples || !Array.isArray(json.triples)) return 0

    let created = 0
    for (const triple of json.triples.slice(0, 5)) {
      if (!triple.subject || !triple.predicate || !triple.object) continue

      // Upsert subject entity
      const subject = await db.kGEntity.upsert({
        where: { id: `kg_${cloneId}_${triple.subject}` },
        create: {
          cloneId,
          name: triple.subject,
          entityType: triple.entity_types?.subject || 'concept',
        },
        update: {},
      })

      // Upsert object entity
      const object = await db.kGEntity.upsert({
        where: { id: `kg_${cloneId}_${triple.object}` },
        create: {
          cloneId,
          name: triple.object,
          entityType: triple.entity_types?.object || 'concept',
        },
        update: {},
      })

      // Check for existing unexpired triple with same S+P (dedup / contradiction)
      const existingTriple = await db.kGTriple.findFirst({
        where: {
          cloneId,
          subjectId: subject.id,
          predicate: triple.predicate,
          validTo: null,
        },
      })

      if (existingTriple) {
        if (existingTriple.objectId === object.id) continue // Duplicate
        // Contradiction: invalidate old
        await db.kGTriple.update({
          where: { id: existingTriple.id },
          data: { validTo: new Date() },
        })
      }

      // Create new triple
      await db.kGTriple.create({
        data: {
          cloneId,
          subjectId: subject.id,
          predicate: triple.predicate,
          objectId: object.id,
          confidence: typeof triple.confidence === 'number'
            ? Math.max(0, Math.min(1, triple.confidence))
            : 0.7,
          sourceDrawerId: drawerId,
        },
      })
      created++
    }

    return created
  } catch {
    return 0
  }
}

// POST /api/avatar/agents/[id]/cycle - Trigger agent cycle (3-phase LLM execution)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await db.cloneAgent.findUnique({
      where: { id },
      include: { clone: true },
    })
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Set agent to working
    await db.cloneAgent.update({
      where: { id },
      data: { status: 'working' },
    })

    const zai = await getZAI()
    const clonePersona = await getClonePersona(agent.cloneId)
    const personalityContext = clonePersona
      ? `\n\n你的分身核心人格：\n${clonePersona.substring(0, 1500)}`
      : ''

    // === Memory Palace: Load L0+L1 for memory context ===
    let memoryContext = ''
    try {
      await seedDefaultWings(agent.cloneId)
      const wakeResult = await wakeUp(agent.cloneId)
      if (wakeResult.combined) {
        memoryContext = `\n\n【记忆宫殿·唤醒上下文】(~${wakeResult.totalTokens}tokens)\n${wakeResult.combined}`
      }
    } catch {
      // Memory wake-up is best-effort
    }

    // Fetch relevant shared knowledge for this agent's domain
    const agentDomainMap: Record<string, string[]> = {
      CEO: ['strategy', 'growth', 'operations'],
      CTO: ['engineering', 'code', 'architecture'],
      Growth: ['marketing', 'growth', 'analytics'],
      Engineer: ['engineering', 'code', 'devops'],
    }
    const relevantDomains = agentDomainMap[agent.role] || ['strategy']
    const sharedKnowledge = await db.sharedKnowledge.findMany({
      where: { domain: { in: relevantDomains } },
      orderBy: { confidence: 'desc' },
      take: 5,
    })
    const knowledgeContext = sharedKnowledge.length > 0
      ? `\n\n【跨分身共享知识库】以下来自其他分身的匿名洞察，请参考融入你的计划：\n${sharedKnowledge.map((k, i) => `${i + 1}. [${k.domain}] ${k.insight} (置信度:${(k.confidence * 100).toFixed(0)}%)`).join('\n')}`
      : ''

    // Create a new cycle
    const cycle = await db.agentCycle.create({
      data: {
        agentId: id,
        phase: 'planning',
      },
    })

    // === Phase 1: Planning ===
    const planPrompt = `你是${agent.name}代理，角色类型: ${agent.role}。
你的人格描述: ${agent.persona}${personalityContext}${memoryContext}${knowledgeContext}

作为Polsia自主代理，请基于你的角色和记忆上下文制定本周期工作计划。你需要：
1. 评估当前状态和优先事项
2. 制定3-5个可执行的行动项
3. 为每个行动项设定预期成果和输出类型
4. 评估风险和依赖
${sharedKnowledge.length > 0 ? '5. 在适当的地方融入共享知识库中的洞察' : ''}

输出格式（严格JSON）：
{
  "priority_level": "高|中|低",
  "actions": [
    {"action": "具体行动描述", "expected_outcome": "预期成果", "output_type": "code|email|deployment|analysis|design|task", "priority": 1-5}
  ],
  "focus_area": "聚焦领域",
  "risk_assessment": "风险评估",
  "dependencies": ["依赖项列表"],
  "applied_knowledge": ["引用的共享知识ID或摘要"]
}`

    const planCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: planPrompt },
        { role: 'user', content: `作为${agent.name}代理，请制定本周期工作计划。你已累计完成${agent.cycleCount}个周期。当前日期: ${new Date().toISOString().split('T')[0]}` },
      ],
      thinking: { type: 'disabled' },
    })

    const planOutput = planCompletion.choices[0]?.message?.content || ''

    // Update cycle with plan
    await db.agentCycle.update({
      where: { id: cycle.id },
      data: { phase: 'executing', plan: planOutput },
    })

    // === Phase 2: Executing ===
    const execPrompt = `你是${agent.name}代理，角色类型: ${agent.role}。
你的人格描述: ${agent.persona}${personalityContext}

基于刚才制定的计划，模拟执行过程。你需要：
1. 对每个行动项模拟执行结果
2. 生成具体的输出内容（代码片段、邮件草稿、分析报告等）
3. 标记完成状态
4. 给出量化指标

输出格式（严格JSON）：
{
  "results": [
    {"action": "行动描述", "status": "completed|blocked|partial", "output_type": "code|email|deployment|analysis|design|task", "output_title": "输出标题", "output_content": "具体输出内容", "metrics": "相关指标"}
  ],
  "overall_progress": "0-100%",
  "blockers": ["阻碍项"],
  "learnings": ["学到的要点"],
  "quantitative_metrics": {"key": "value"}
}`

    const execCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: execPrompt },
        { role: 'user', content: `基于以下计划执行：\n${planOutput.substring(0, 1500)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const execOutput = execCompletion.choices[0]?.message?.content || ''

    // Update cycle with execution
    await db.agentCycle.update({
      where: { id: cycle.id },
      data: { phase: 'reporting', execution: execOutput },
    })

    // === Phase 3: Reporting ===
    const reportPrompt = `你是${agent.name}代理，角色类型: ${agent.role}。
你的人格描述: ${agent.persona}${personalityContext}

基于计划和执行结果，生成本周期报告。要求：
1. 一句话总结本周期成果
2. 关键数据点和指标
3. 下周期建议
4. 需要用户关注的事项

用简洁的中文输出，保持你的角色风格。`

    const reportCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: reportPrompt },
        { role: 'user', content: `计划：${planOutput.substring(0, 800)}\n\n执行：${execOutput.substring(0, 800)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const reportOutput = reportCompletion.choices[0]?.message?.content || ''

    // Complete the cycle
    const completedCycle = await db.agentCycle.update({
      where: { id: cycle.id },
      data: {
        phase: 'completed',
        report: reportOutput,
        metrics: execOutput.substring(0, 2000),
        completedAt: new Date(),
      },
    })

    // Parse execution results to create AgentOutput entries
    let outputsCreated = 0
    try {
      const execJson = JSON.parse(execOutput)
      if (execJson.results && Array.isArray(execJson.results)) {
        for (const result of execJson.results) {
          if (result.output_title && result.output_content) {
            await db.agentOutput.create({
              data: {
                agentId: id,
                cycleId: cycle.id,
                outputType: result.output_type || 'analysis',
                title: result.output_title,
                content: result.output_content,
                metadata: JSON.stringify({
                  action: result.action,
                  status: result.status,
                  metrics: result.metrics,
                }),
                status: result.status === 'completed' ? 'submitted' : 'draft',
              },
            })
            outputsCreated++
          }
        }
      }
    } catch {
      // If JSON parsing fails, create a single output entry
      await db.agentOutput.create({
        data: {
          agentId: id,
          cycleId: cycle.id,
          outputType: 'analysis',
          title: `${agent.name}周期执行结果`,
          content: execOutput.substring(0, 3000),
          status: 'submitted',
        },
      })
      outputsCreated = 1
    }

    // Update agent status
    await db.cloneAgent.update({
      where: { id },
      data: {
        status: 'idle',
        lastCycleAt: new Date(),
        cycleCount: { increment: 1 },
        experience: { increment: 10 },
      },
    })

    // Update clone stats
    await db.avatarClone.update({
      where: { id: agent.cloneId },
      data: {
        totalCycles: { increment: 1 },
        lastActiveAt: new Date(),
        experience: { increment: 5 },
      },
    })

    // Create activity
    await db.cloneActivity.create({
      data: {
        cloneId: agent.cloneId,
        agentId: id,
        activityType: 'cycle_completed',
        title: `${agent.name}完成周期#${agent.cycleCount + 1}`,
        description: reportOutput.substring(0, 200),
        metadata: JSON.stringify({ cycleId: cycle.id, outputsCreated }),
      },
    })

    // Create legacy memory entry (backward compatible)
    await db.memoryEntry.create({
      data: {
        sourceType: 'agent_cycle',
        sourceId: cycle.id,
        content: `[${agent.name}代理] 周期#${agent.cycleCount + 1}完成: ${reportOutput.substring(0, 200)}`,
        tags: `代理周期,${agent.name},${agent.role},Polsia`,
        relevanceScore: 0.85,
      },
    })

    // === Memory Palace: Auto-create MemoryDrawer from cycle output ===
    let drawerCreated = false
    let drawerId = ''
    try {
      // Build drawer content from cycle report
      const drawerContent = [
        `[${agent.name}·${agent.role}] 周期#${agent.cycleCount + 1}`,
        `聚焦: ${planOutput.substring(0, 100)}`,
        `报告: ${reportOutput.substring(0, 500)}`,
      ].join('\n')

      // Auto-classify into appropriate room
      const targetRoomId = await classifyToRoom(zai, agent.cloneId, drawerContent, agent.role)

      if (targetRoomId) {
        // Generate AAAK summary
        const aaaakResult = compress(drawerContent, {
          importance: 4.0,
          sourceType: 'cycle',
          entities: [agent.name, agent.role],
          topic: agent.role,
          flags: ['DECISION'],
        })

        // Generate content hash for dedup
        const contentHash = generateContentHash(drawerContent)

        // Get next chunk index
        const lastDrawer = await db.memoryDrawer.findFirst({
          where: { roomId: targetRoomId },
          orderBy: { chunkIndex: 'desc' },
          select: { chunkIndex: true },
        })

        const drawer = await db.memoryDrawer.create({
          data: {
            roomId: targetRoomId,
            content: drawerContent,
            aaaakSummary: aaaakResult.summary,
            chunkIndex: (lastDrawer?.chunkIndex || 0) + 1,
            sourceType: 'cycle',
            sourceId: cycle.id,
            importance: 4.0,
            contentHash,
          },
        })

        // Add tags
        const tags = [agent.role, '代理周期', `周期#${agent.cycleCount + 1}`]
        for (const tag of tags) {
          await db.drawerTag.create({
            data: { drawerId: drawer.id, tag },
          })
        }

        // Increment room drawer count
        await db.memoryRoom.update({
          where: { id: targetRoomId },
          data: { drawerCount: { increment: 1 } },
        })

        drawerCreated = true
        drawerId = drawer.id
      }
    } catch {
      // Memory drawer creation is best-effort
    }

    // === Memory Palace: Auto-extract KG entities/triples ===
    let kgTriplesCreated = 0
    if (drawerId) {
      kgTriplesCreated = await extractKGFacts(zai, agent.cloneId, reportOutput, drawerId)
    }

    // === Extract insights for SharedKnowledge ===
    try {
      const insightPrompt = `基于以下代理周期报告，提取1-3个可匿名化的关键洞察/学习要点。每个洞察应该是通用的、可跨分身应用的，不包含特定用户或项目的敏感信息。

报告内容：
${reportOutput.substring(0, 1500)}

输出格式（严格JSON）：
{
  "insights": [
    {"domain": "marketing|engineering|growth|strategy|operations|code", "insight": "匿名化的洞察内容", "confidence": 0.5-1.0}
  ]
}`

      const insightCompletion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: insightPrompt },
          { role: 'user', content: '请提取洞察' },
        ],
        thinking: { type: 'disabled' },
      })

      const insightOutput = insightCompletion.choices[0]?.message?.content || ''
      const insightJson = JSON.parse(insightOutput)

      if (insightJson.insights && Array.isArray(insightJson.insights)) {
        for (const item of insightJson.insights.slice(0, 3)) {
          if (item.domain && item.insight) {
            await db.sharedKnowledge.create({
              data: {
                domain: item.domain,
                insight: item.insight,
                sourceType: 'agent_cycle',
                confidence: typeof item.confidence === 'number'
                  ? Math.max(0, Math.min(1, item.confidence))
                  : 0.5,
              },
            })
          }
        }
      }
    } catch {
      // Insight extraction is best-effort, don't fail the cycle
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'cycle',
        module: 'avatar',
        entityType: 'AgentCycle',
        entityId: cycle.id,
        details: JSON.stringify({
          agentName: agent.name,
          cycleCount: agent.cycleCount + 1,
          outputsCreated,
          drawerCreated,
          kgTriplesCreated,
        }),
        performedBy: agent.name,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        cycle: completedCycle,
        outputsCreated,
        report: reportOutput,
        memoryPalace: {
          drawerCreated,
          drawerId,
          kgTriplesCreated,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to run cycle:', error)
    // Reset agent status on error
    try {
      const { id } = await params
      await db.cloneAgent.update({
        where: { id },
        data: { status: 'error' },
      })
    } catch {
      // Ignore cleanup errors
    }
    return NextResponse.json(
      { success: false, error: 'Failed to run cycle' },
      { status: 500 }
    )
  }
}

// GET /api/avatar/agents/[id]/cycle - Get cycle history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cycles = await db.agentCycle.findMany({
      where: { agentId: id },
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        outputs: true,
      },
    })

    return NextResponse.json({ success: true, data: cycles })
  } catch (error) {
    console.error('Failed to fetch cycles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cycles' },
      { status: 500 }
    )
  }
}
