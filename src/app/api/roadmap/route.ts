import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/roadmap - Get roadmap phases with milestones
export async function GET() {
  try {
    const phases = await db.roadmapPhase.findMany({
      orderBy: { phase: 'asc' },
      include: { milestones: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json({ phases })
  } catch (error) {
    console.error('Failed to fetch roadmap:', error)
    return NextResponse.json({ error: 'Failed to fetch roadmap' }, { status: 500 })
  }
}
