import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const messages = await db.crossAvatarMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: { messages } })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { senderDid, receiverDid, messageType, content } = body

    if (!senderDid || !receiverDid || !messageType) {
      return NextResponse.json({ success: false, error: 'senderDid, receiverDid, messageType are required' }, { status: 400 })
    }

    const message = await db.crossAvatarMessage.create({
      data: {
        senderDid,
        receiverDid,
        messageType,
        content: content ? JSON.stringify(content) : '{}',
        status: 'delivered',
      },
    })

    return NextResponse.json({ success: true, data: { message } })
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json({ success: false, error: 'Failed to create message' }, { status: 500 })
  }
}
