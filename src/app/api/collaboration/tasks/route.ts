import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/collaboration/tasks - List all collaboration tasks
export async function GET() {
  try {
    const tasks = await db.collaborationTask.findMany({
      orderBy: { createdAt: 'desc' },
      include: { payments: true },
    })
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/collaboration/tasks - Create a new collaboration task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, complexity, category, reward, rewardToken, deadline, assigneeType } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Ensure we have a founder to assign as creator
    let creator = await db.founder.findFirst()
    if (!creator) {
      creator = await db.founder.create({
        data: { name: 'Piaoshu Founder', email: 'founder@piaoshu.ai' },
      })
    }

    const task = await db.collaborationTask.create({
      data: {
        title,
        description: description || null,
        complexity: complexity || 'medium',
        category: category || 'code',
        reward: reward || 0,
        rewardToken: rewardToken || 'USDT',
        status: 'open',
        priority: 5,
        deadline: deadline ? new Date(deadline) : null,
        assigneeType: assigneeType || 'auto',
        creatorId: creator.id,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
