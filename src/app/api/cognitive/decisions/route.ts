import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const decisions = await db.decisionLog.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ decisions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, category, outcome, confidence, tags } = body
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    
    let founder = await db.founder.findFirst()
    if (!founder) {
      founder = await db.founder.create({ data: { name: 'Piaoshu Founder', email: 'founder@piaoshu.ai' } })
    }
    
    const decision = await db.decisionLog.create({
      data: {
        founderId: founder.id,
        title,
        content: content || null,
        category: category || 'strategic',
        outcome: outcome || null,
        confidence: confidence || 0.0,
        tags: tags || null,
      },
    })
    return NextResponse.json({ decision }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 })
  }
}
