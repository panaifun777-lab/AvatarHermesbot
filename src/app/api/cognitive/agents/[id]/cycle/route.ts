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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cycles = await db.dailyCycle.findMany({
      where: { agentId: id },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ cycles })
  } catch (error) {
    console.error('Failed to fetch cycles:', error)
    return NextResponse.json({ error: 'Failed to fetch cycles' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await db.agentRole.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Set agent to working
    await db.agentRole.update({
      where: { id },
      data: { status: 'working' },
    })

    const zai = await getZAI()
    const soulContent = await getSoulConfig()
    const personalityContext = soulContent
      ? `\n\n你的行为规范（基于飘叔SOUL.md）：\n${soulContent.substring(0, 2000)}`
      : ''

    // Create a new cycle
    const cycle = await db.dailyCycle.create({
      data: {
        agentId: id,
        phase: 'planning',
      },
    })

    // === Phase 1: Planning ===
    const planPrompt = `你是${agent.name}代理，${agent.persona}${personalityContext}

基于你的角色和能力，制定今日工作计划。你需要：
1. 评估当前状态和优先级
2. 制定3-5个可执行的行动项
3. 为每个行动项设定预期成果

输出格式（严格JSON）：
{
  "priority_level": "高|中|低",
  "actions": [
    {"action": "具体行动描述", "expected_outcome": "预期成果", "priority": 1-5}
  ],
  "focus_area": "今日聚焦领域",
  "risk_assessment": "风险评估简述"
}`

    const planCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: planPrompt },
        { role: 'user', content: `作为${agent.name}代理，请制定今日工作计划。当前已完成${agent.cycleCount}个周期。` },
      ],
      thinking: { type: 'disabled' },
    })

    const planOutput = planCompletion.choices[0]?.message?.content || ''

    // Update cycle with plan
    await db.dailyCycle.update({
      where: { id: cycle.id },
      data: { phase: 'executing', plan: planOutput },
    })

    // === Phase 2: Executing ===
    const execPrompt = `你是${agent.name}代理，${agent.persona}${personalityContext}

基于刚才制定的计划，模拟执行过程并报告结果。你需要：
1. 对每个行动项模拟执行结果
2. 标记哪些已完成、哪些遇到阻碍
3. 给出具体的数据或产出

输出格式（严格JSON）：
{
  "results": [
    {"action": "行动描述", "status": "completed|blocked|partial", "output": "执行产出", "metrics": "相关指标"}
  ],
  "overall_progress": "0-100%",
  "blockers": ["阻碍项列表"],
  "learnings": ["今日学到的要点"]
}`

    const execCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: execPrompt },
        { role: 'user', content: `基于以下计划执行：\n${planOutput.substring(0, 1000)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const execOutput = execCompletion.choices[0]?.message?.content || ''

    // Update cycle with execution
    await db.dailyCycle.update({
      where: { id: cycle.id },
      data: { phase: 'reporting', execution: execOutput },
    })

    // === Phase 3: Reporting ===
    const reportPrompt = `你是${agent.name}代理，${agent.persona}${personalityContext}

基于计划和执行结果，生成今日周期报告。要求：
1. 一句话总结今日成果
2. 关键数据点
3. 明日计划建议
4. 需要创始人关注的事项

用简洁的中文输出，风格与你的角色一致。`

    const reportCompletion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: reportPrompt },
        { role: 'user', content: `计划：${planOutput.substring(0, 500)}\n\n执行：${execOutput.substring(0, 500)}` },
      ],
      thinking: { type: 'disabled' },
    })

    const reportOutput = reportCompletion.choices[0]?.message?.content || ''

    // Complete the cycle
    const completedCycle = await db.dailyCycle.update({
      where: { id: cycle.id },
      data: {
        phase: 'completed',
        report: reportOutput,
        completedAt: new Date(),
      },
    })

    // Update agent status
    await db.agentRole.update({
      where: { id },
      data: {
        status: 'idle',
        lastCycleAt: new Date(),
        cycleCount: { increment: 1 },
      },
    })

    // Create memory entry
    await db.memoryEntry.create({
      data: {
        sourceType: 'agent_cycle',
        sourceId: cycle.id,
        content: `[${agent.name}代理] 周期#${agent.cycleCount + 1}完成: ${reportOutput.substring(0, 200)}`,
        tags: `代理周期,${agent.name},角色化AI`,
        relevanceScore: 0.8,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'cycle',
        module: 'cognitive',
        entityType: 'DailyCycle',
        entityId: cycle.id,
        details: JSON.stringify({ agentName: agent.name, cycleCount: agent.cycleCount + 1 }),
        performedBy: agent.name,
      },
    })

    return NextResponse.json({ cycle: completedCycle }, { status: 201 })
  } catch (error) {
    console.error('Failed to run cycle:', error)
    // Reset agent status on error
    try {
      const { id } = await params
      await db.agentRole.update({
        where: { id },
        data: { status: 'error' },
      })
    } catch {
      // Ignore cleanup errors
    }
    return NextResponse.json({ error: 'Failed to run cycle' }, { status: 500 })
  }
}
