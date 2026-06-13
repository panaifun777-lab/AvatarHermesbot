import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sandbox/projects - List all sandbox projects
export async function GET() {
  try {
    const projects = await db.sandboxProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: { interactions: true },
    })
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Failed to fetch sandbox projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/sandbox/projects - Create a new sandbox project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, projectType, xdpEnabled } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const project = await db.sandboxProject.create({
      data: {
        name,
        description: description || null,
        projectType: projectType || '3d_prototype',
        xdpEnabled: xdpEnabled || false,
        status: 'draft',
        version: 1,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Failed to create sandbox project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
