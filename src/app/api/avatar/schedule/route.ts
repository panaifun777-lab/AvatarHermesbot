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

// GET /api/avatar/schedule - Get today's schedule
export async function GET(req: NextRequest) {
  try {
    let cloneId = req.nextUrl.searchParams.get('cloneId')

    // Auto-discover first clone if no cloneId provided
    if (!cloneId) {
      const firstClone = await db.avatarClone.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!firstClone) {
        return NextResponse.json({ schedule: null })
      }
      cloneId = firstClone.id
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const schedule = await db.dailySchedule.findFirst({
      where: {
        cloneId,
        day: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      },
    })

    return NextResponse.json({ schedule: schedule })
  } catch (error) {
    console.error('Failed to fetch schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// POST /api/avatar/schedule - Generate today's schedule using LLM
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cloneId } = body

    if (!cloneId) {
      return NextResponse.json(
        { success: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    // Get clone with agents
    const clone = await db.avatarClone.findUnique({
      where: { id: cloneId },
      include: {
        agents: { orderBy: { createdAt: 'asc' } },
        skills: { where: { enabled: true } },
      },
    })

    if (!clone) {
      return NextResponse.json(
        { success: false, error: 'Avatar clone not found' },
        { status: 404 }
      )
    }

    const zai = await getZAI()

    // Build agent info for prompt
    const agentInfo = clone.agents
      .map((a) => `- ${a.name}(${a.role}): ${a.persona.substring(0, 100)} [状态: ${a.status}, 周期数: ${a.cycleCount}]`)
      .join('\n')

    const skillInfo = clone.skills
      .map((s) => `- ${s.name}(${s.category}): Lv.${s.level}`)
      .join('\n')

    const schedulePrompt = `你是${clone.name}的日程调度AI。基于以下代理和技能信息，生成今日的工作日程安排。

代理列表:
${agentInfo}

技能列表:
${skillInfo}

分身等级: ${clone.level}
累计周期: ${clone.totalCycles}

请生成一份详细的日程安排，为每个代理分配合理的时间段和任务。

输出格式（严格JSON）：
{
  "time_slots": [
    {"time": "09:00-10:30", "agent": "CEO", "task": "具体任务描述", "priority": "high|medium|low"},
    {"time": "10:30-12:00", "agent": "CTO", "task": "具体任务描述", "priority": "high|medium|low"},
    {"time": "13:00-14:30", "agent": "Growth", "task": "具体任务描述", "priority": "high|medium|low"},
    {"time": "14:30-16:00", "agent": "Engineer", "task": "具体任务描述", "priority": "high|medium|low"},
    {"time": "16:00-17:30", "agent": "CEO", "task": "复盘与规划", "priority": "medium"}
  ],
  "daily_focus": "今日核心聚焦",
  "key_objectives": ["目标1", "目标2", "目标3"]
}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: schedulePrompt },
        { role: 'user', content: `请生成${new Date().toISOString().split('T')[0]}的工作日程安排。` },
      ],
      thinking: { type: 'disabled' },
    })

    const scheduleOutput = completion.choices[0]?.message?.content || ''

    // Parse the LLM output to build timeSlots
    let timeSlotsJson = scheduleOutput
    try {
      // Try to extract JSON from the response
      const jsonMatch = scheduleOutput.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        timeSlotsJson = JSON.stringify(parsed.time_slots || parsed)
      }
    } catch {
      // Keep raw output as timeSlots
    }

    // Upsert today's schedule
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const schedule = await db.dailySchedule.upsert({
      where: {
        id: (await db.dailySchedule.findFirst({
          where: { cloneId, day: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
        }))?.id || '__nonexistent__',
      },
      create: {
        cloneId,
        day: today,
        timeSlots: timeSlotsJson,
        status: 'planned',
      },
      update: {
        timeSlots: timeSlotsJson,
        status: 'planned',
      },
    })

    // Create activity
    await db.cloneActivity.create({
      data: {
        cloneId,
        activityType: 'schedule_generated',
        title: '今日日程已生成',
        description: `为${clone.agents.length}个代理安排了工作日程`,
        metadata: JSON.stringify({ date: today.toISOString() }),
      },
    })

    return NextResponse.json({ schedule: schedule })
  } catch (error) {
    console.error('Failed to generate schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate schedule' },
      { status: 500 }
    )
  }
}
