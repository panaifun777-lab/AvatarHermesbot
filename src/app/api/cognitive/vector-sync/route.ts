import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(_req: NextRequest) {
  try {
    // Read all MemoryEntry records from DB
    const memories = await db.memoryEntry.findMany({
      select: {
        id: true,
        content: true,
        sourceType: true,
        sourceId: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to recent 200 entries
    })

    if (memories.length === 0) {
      return NextResponse.json({
        success: true,
        data: { synced: 0, errors: 0, total: 0, message: 'No memories found in database' },
      })
    }

    // Send to vector service for embedding directly (server-side)
    const response = await fetch('http://localhost:3004/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memories }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[VectorSync] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Vector sync failed' },
      { status: 503 }
    )
  }
}
