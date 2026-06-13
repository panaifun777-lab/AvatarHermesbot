import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/email/threads - List email threads with filtering
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId') || 'demo'
    const status = req.nextUrl.searchParams.get('status')
    const priority = req.nextUrl.searchParams.get('priority')
    const search = req.nextUrl.searchParams.get('search')

    const where: Record<string, unknown> = { userId }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { fromAddress: { contains: search } },
        { snippet: { contains: search } },
      ]
    }

    const threads = await db.emailThread.findMany({
      where,
      include: {
        emails: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: 50,
    })

    // Calculate stats
    const allThreads = await db.emailThread.findMany({ where: { userId } })
    const stats = {
      total: allThreads.length,
      unread: allThreads.filter(t => t.status === 'unread').length,
      read: allThreads.filter(t => t.status === 'read').length,
      replied: allThreads.filter(t => t.status === 'replied').length,
      ignored: allThreads.filter(t => t.status === 'ignored').length,
      escalated: allThreads.filter(t => t.status === 'escalated').length,
      autoReplied: allThreads.filter(t => t.autoReplied).length,
    }

    return NextResponse.json({ success: true, data: { threads, stats } })
  } catch (error) {
    console.error('Failed to fetch email threads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email threads' },
      { status: 500 }
    )
  }
}
