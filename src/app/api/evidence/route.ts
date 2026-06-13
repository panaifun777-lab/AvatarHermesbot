import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/evidence - List all evidence items
export async function GET() {
  try {
    const evidences = await db.evidenceItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { credential: true },
    })
    return NextResponse.json({ evidences })
  } catch (error) {
    console.error('Failed to fetch evidence:', error)
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 })
  }
}

// POST /api/evidence - Create a new evidence item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, evidenceType, rawData, tags } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate a simulated content hash
    const contentHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')

    const evidence = await db.evidenceItem.create({
      data: {
        title,
        description: description || null,
        evidenceType: evidenceType || 'interview',
        rawData: rawData ? JSON.stringify(rawData) : null,
        contentHash,
        status: 'draft',
      },
    })

    return NextResponse.json({ evidence }, { status: 201 })
  } catch (error) {
    console.error('Failed to create evidence:', error)
    return NextResponse.json({ error: 'Failed to create evidence' }, { status: 500 })
  }
}
