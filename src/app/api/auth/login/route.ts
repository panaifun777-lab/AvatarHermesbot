import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { initVercelDb } from '@/lib/vercel-db-init'

export async function POST(req: NextRequest) {
  try {
    // On Vercel, ensure DB tables exist
    if (process.env.VERCEL === '1') await initVercelDb()
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        clone: {
          include: {
            agents: true,
            skills: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'login',
        module: 'auth',
        entityType: 'User',
        entityId: user.id,
        performedBy: user.name,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          plan: user.plan,
        },
        clone: user.clone
          ? {
              id: user.clone.id,
              name: user.clone.name,
              status: user.clone.status,
              level: user.clone.level,
              experience: user.clone.experience,
              totalCycles: user.clone.totalCycles,
              avatarStyle: user.clone.avatarStyle,
              avatarUrl: user.clone.avatarUrl,
              lastActiveAt: user.clone.lastActiveAt,
              agents: user.clone.agents,
              skills: user.clone.skills,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
