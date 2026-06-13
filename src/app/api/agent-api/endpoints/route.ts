import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agent-api/endpoints - List all agent API endpoints
export async function GET() {
  try {
    const endpoints = await db.agentAPIEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ endpoints })
  } catch (error) {
    console.error('Failed to fetch agent API endpoints:', error)
    return NextResponse.json({ error: 'Failed to fetch agent API endpoints' }, { status: 500 })
  }
}

// POST /api/agent-api/endpoints - Create a new agent API endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, path, method, description, requestSchema, responseSchema,
      authRequired, rateLimit, status,
    } = body

    if (!name || !path || !method) {
      return NextResponse.json({ error: 'name, path, and method are required' }, { status: 400 })
    }

    const endpoint = await db.agentAPIEndpoint.create({
      data: {
        name,
        path,
        method: method || 'GET',
        description: description || null,
        requestSchema: requestSchema || null,
        responseSchema: responseSchema || null,
        authRequired: authRequired ?? true,
        rateLimit: rateLimit ?? 100,
        status: status || 'active',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'create',
        module: 'agent-api',
        entityType: 'AgentAPIEndpoint',
        entityId: endpoint.id,
        details: JSON.stringify({ name, path, method }),
        performedBy: 'system',
      },
    })

    return NextResponse.json({ endpoint }, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent API endpoint:', error)
    return NextResponse.json({ error: 'Failed to create agent API endpoint' }, { status: 500 })
  }
}
