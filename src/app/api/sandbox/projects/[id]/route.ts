import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/sandbox/projects/[id] - Update a sandbox project
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['name', 'description', 'status', 'xdpEnabled', 'version', 'projectType', 'sceneData']
    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const record = await db.sandboxProject.update({
      where: { id },
      data,
    })

    await db.auditLog.create({
      data: {
        action: 'update',
        module: 'sandbox',
        entityType: 'SandboxProject',
        entityId: id,
        details: JSON.stringify(data),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Failed to update sandbox project:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/sandbox/projects/[id] - Delete a sandbox project
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await db.sandboxProject.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        action: 'delete',
        module: 'sandbox',
        entityType: 'SandboxProject',
        entityId: id,
        performedBy: 'system',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete sandbox project:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
