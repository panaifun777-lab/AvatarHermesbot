import { NextRequest, NextResponse } from 'next/server'
import { wakeUp, loadRoom, deepSearch, loadL0Identity, loadL1Core, loadL2Room, loadL3Search } from '@/lib/memory-loader'
import { seedDefaultWings } from '@/lib/memory-seed'

// GET /api/memory/wake — Memory wake-up, returns L0+L1 layered content for a clone
// Supports both text-based (wakeUp) and structured (loadL0Identity + loadL1Core) responses
export async function GET(req: NextRequest) {
  try {
    const cloneId = req.nextUrl.searchParams.get('cloneId')
    const roomId = req.nextUrl.searchParams.get('roomId')
    const query = req.nextUrl.searchParams.get('query')
    const wingId = req.nextUrl.searchParams.get('wingId')
    const format = req.nextUrl.searchParams.get('format') || 'text' // 'text' or 'structured'
    const searchLimit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10)

    if (!cloneId) {
      return NextResponse.json(
        { ok: false, error: 'cloneId is required' },
        { status: 400 }
      )
    }

    // Auto-seed default wings if none exist
    await seedDefaultWings(cloneId)

    if (format === 'structured') {
      // Structured format: returns typed objects instead of text blobs
      const [identity, core] = await Promise.all([
        loadL0Identity(cloneId),
        loadL1Core(cloneId),
      ])

      // Optional: also load L2 for a specific room
      let roomData = null
      if (roomId) {
        roomData = await loadL2Room(roomId)
      }

      // Optional: also do L3 deep search
      let searchData = null
      if (query) {
        searchData = await loadL3Search(cloneId, query, searchLimit)
      }

      return NextResponse.json({
        ok: true,
        data: {
          identity,
          core,
          ...(roomData ? { room: roomData } : {}),
          ...(searchData ? { search: searchData } : {}),
        },
      })
    }

    // Default text format: wake-up (L0 + L1)
    const wakeResult = await wakeUp(cloneId)

    // Optional: also load L2 for a specific room
    let roomResult = null
    if (roomId) {
      roomResult = await loadRoom(roomId)
    }

    // Optional: also do L3 deep search
    let searchResult = null
    if (query) {
      searchResult = await deepSearch(cloneId, query, wingId || undefined)
    }

    return NextResponse.json({
      ok: true,
      data: {
        wakeUp: wakeResult,
        ...(roomResult ? { room: roomResult } : {}),
        ...(searchResult ? { search: searchResult } : {}),
      },
    })
  } catch (error) {
    console.error('Failed to wake memory:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to wake memory' },
      { status: 500 }
    )
  }
}
