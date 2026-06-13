import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cognitive/shards - List all cognitive shards
export async function GET() {
  try {
    const shards = await db.cognitiveShard.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ shards })
  } catch (error) {
    console.error('Failed to fetch cognitive shards:', error)
    return NextResponse.json({ error: 'Failed to fetch shards' }, { status: 500 })
  }
}

// POST /api/cognitive/shards - Create a new cognitive shard
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, modelBase, shardType } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const shard = await db.cognitiveShard.create({
      data: {
        name,
        description: description || null,
        modelBase: modelBase || 'qwen',
        shardType: shardType || 'neutral',
        status: 'draft',
        confidence: 0.0,
      },
    })

    return NextResponse.json({ shard }, { status: 201 })
  } catch (error) {
    console.error('Failed to create cognitive shard:', error)
    return NextResponse.json({ error: 'Failed to create shard' }, { status: 500 })
  }
}
