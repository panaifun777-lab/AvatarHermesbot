import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q')
    const topK = req.nextUrl.searchParams.get('topK') || '5'

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query parameter "q" is required' }, { status: 400 })
    }

    // Proxy to vector service directly (server-side)
    const response = await fetch('http://localhost:3004/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: parseInt(topK) }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[VectorSearch] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Vector search service unavailable' },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, id, metadata } = body

    if (!text) {
      return NextResponse.json({ success: false, error: 'text field is required' }, { status: 400 })
    }

    // Proxy to vector service directly (server-side)
    const response = await fetch('http://localhost:3004/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, id, metadata }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[VectorSearch] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Vector embed service unavailable' },
      { status: 503 }
    )
  }
}
