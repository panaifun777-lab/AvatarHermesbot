import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/avatar/skills - List clone skills
export async function GET(req: NextRequest) {
  try {
    let cloneId = req.nextUrl.searchParams.get('cloneId')

    // Auto-discover first clone if no cloneId provided
    if (!cloneId) {
      const firstClone = await db.avatarClone.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!firstClone) {
        return NextResponse.json({ skills: [] })
      }
      cloneId = firstClone.id
    }

    const skills = await db.cloneSkill.findMany({
      where: { cloneId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ skills: skills })
  } catch (error) {
    console.error('Failed to fetch skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

// POST /api/avatar/skills - Add/upgrade skill
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cloneId, name, category, level, experience, description, enabled } = body

    if (!cloneId || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'cloneId, name, and category are required' },
        { status: 400 }
      )
    }

    // Check if skill already exists
    const existing = await db.cloneSkill.findFirst({
      where: { cloneId, name },
    })

    let skill
    if (existing) {
      // Upgrade existing skill
      skill = await db.cloneSkill.update({
        where: { id: existing.id },
        data: {
          level: level ?? { increment: 1 },
          experience: experience ?? { increment: existing.experience + 10 },
          description: description ?? existing.description,
          enabled: enabled ?? existing.enabled,
        },
      })

      // Create activity
      await db.cloneActivity.create({
        data: {
          cloneId,
          activityType: 'skill_upgraded',
          title: `技能${name}升级至Lv.${skill.level}`,
          description: `分类: ${category}`,
          metadata: JSON.stringify({ skillName: name, level: skill.level }),
        },
      })
    } else {
      // Create new skill
      skill = await db.cloneSkill.create({
        data: {
          cloneId,
          name,
          category,
          level: level || 1,
          experience: experience || 0,
          description,
          enabled: enabled ?? true,
        },
      })

      // Create activity
      await db.cloneActivity.create({
        data: {
          cloneId,
          activityType: 'skill_added',
          title: `新技能${name}已解锁`,
          description: `分类: ${category}`,
          metadata: JSON.stringify({ skillName: name, category }),
        },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: existing ? 'update' : 'create',
        module: 'avatar',
        entityType: 'CloneSkill',
        entityId: skill.id,
        details: JSON.stringify({ name, category, level: skill.level }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ skill: skill })
  } catch (error) {
    console.error('Failed to manage skill:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to manage skill' },
      { status: 500 }
    )
  }
}
