import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 30000,
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subscription {
  socketId: string
  channels: Set<string>
}

// ─── State ───────────────────────────────────────────────────────────────────

const subscriptions = new Map<string, Subscription>()
const connectedClients = new Map<string, { connectedAt: Date; channels: string[] }>()

// ─── Event Types ─────────────────────────────────────────────────────────────

type EventType =
  | 'task:updated'
  | 'task:created'
  | 'shard:updated'
  | 'simulation:completed'
  | 'node:status'
  | 'notification'
  | 'agent:status'
  | 'agent:cycle'
  | 'agent:output'
  | 'clone:activity'

const VALID_CHANNELS: EventType[] = [
  'task:updated',
  'task:created',
  'shard:updated',
  'simulation:completed',
  'node:status',
  'notification',
  'agent:status',
  'agent:cycle',
  'agent:output',
  'clone:activity',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidChannel(channel: string): channel is EventType {
  return VALID_CHANNELS.includes(channel as EventType)
}

function broadcastToChannel(channel: string, data: unknown, excludeSocketId?: string) {
  for (const [socketId, sub] of subscriptions) {
    if (socketId !== excludeSocketId && sub.channels.has(channel)) {
      io.to(socketId).emit(channel, data)
    }
  }
}

// ─── Heartbeat ───────────────────────────────────────────────────────────────

setInterval(() => {
  const now = new Date()
  for (const [socketId, info] of connectedClients) {
    const socket = io.sockets.sockets.get(socketId)
    if (socket) {
      socket.emit('ping', { timestamp: now.toISOString() })
    }
  }
}, 30000)

// ─── Connection Handler ──────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  const connectedAt = new Date()
  connectedClients.set(socket.id, { connectedAt, channels: [] })
  subscriptions.set(socket.id, { socketId: socket.id, channels: new Set() })

  console.log(`[WS] Client connected: ${socket.id} (total: ${connectedClients.size})`)

  // Send welcome event with connection info
  socket.emit('connected', {
    socketId: socket.id,
    timestamp: connectedAt.toISOString(),
    serverStatus: 'online',
    channels: VALID_CHANNELS,
  })

  // ── Subscribe to channels ──────────────────────────────────────────────

  socket.on('subscribe', (data: { channels: string[] }) => {
    const sub = subscriptions.get(socket.id)
    if (!sub) return

    const validChannels = data.channels.filter(isValidChannel)
    for (const ch of validChannels) {
      sub.channels.add(ch)
    }

    // Update connectedClients info
    const clientInfo = connectedClients.get(socket.id)
    if (clientInfo) {
      clientInfo.channels = Array.from(sub.channels)
    }

    console.log(`[WS] ${socket.id} subscribed to: ${validChannels.join(', ')}`)
    socket.emit('subscribed', {
      channels: Array.from(sub.channels),
      timestamp: new Date().toISOString(),
    })
  })

  // ── Unsubscribe from channels ──────────────────────────────────────────

  socket.on('unsubscribe', (data: { channels: string[] }) => {
    const sub = subscriptions.get(socket.id)
    if (!sub) return

    for (const ch of data.channels) {
      sub.channels.delete(ch)
    }

    const clientInfo = connectedClients.get(socket.id)
    if (clientInfo) {
      clientInfo.channels = Array.from(sub.channels)
    }

    console.log(`[WS] ${socket.id} unsubscribed from: ${data.channels.join(', ')}`)
    socket.emit('unsubscribed', {
      channels: Array.from(sub.channels),
      timestamp: new Date().toISOString(),
    })
  })

  // ── Pong (heartbeat response) ──────────────────────────────────────────

  socket.on('pong', (_data: { timestamp: string }) => {
    // Heartbeat acknowledged - connection alive
  })

  // ── Task Events ────────────────────────────────────────────────────────

  socket.on('task:updated', (data: { taskId: string; status: string; updatedBy?: string }) => {
    console.log(`[WS] task:updated - ${data.taskId} -> ${data.status}`)
    broadcastToChannel('task:updated', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  socket.on('task:created', (data: { taskId: string; title: string; createdBy?: string }) => {
    console.log(`[WS] task:created - ${data.taskId}: ${data.title}`)
    broadcastToChannel('task:created', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Shard Events ───────────────────────────────────────────────────────

  socket.on('shard:updated', (data: { shardId: string; changes: Record<string, unknown> }) => {
    console.log(`[WS] shard:updated - ${data.shardId}`)
    broadcastToChannel('shard:updated', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Simulation Events ──────────────────────────────────────────────────

  socket.on('simulation:completed', (data: { simulationId: string; result: string; confidence?: number }) => {
    console.log(`[WS] simulation:completed - ${data.simulationId}`)
    broadcastToChannel('simulation:completed', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Node Status Events ─────────────────────────────────────────────────

  socket.on('node:status', (data: { nodeId: string; status: 'online' | 'offline'; label?: string }) => {
    console.log(`[WS] node:status - ${data.nodeId} -> ${data.status}`)
    broadcastToChannel('node:status', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Notification Events ────────────────────────────────────────────────

  socket.on('notification', (data: { type: string; message: string; priority?: 'low' | 'medium' | 'high' }) => {
    console.log(`[WS] notification - ${data.type}: ${data.message}`)
    broadcastToChannel('notification', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Agent Status Events ────────────────────────────────────────────────

  socket.on('agent:status', (data: { agentId: string; status: 'idle' | 'working' | 'sleeping' | 'error'; agentName?: string; previousStatus?: string }) => {
    console.log(`[WS] agent:status - ${data.agentId} -> ${data.status}`)
    broadcastToChannel('agent:status', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Agent Cycle Events ─────────────────────────────────────────────────

  socket.on('agent:cycle', (data: { agentId: string; cycleId: string; phase: 'planning' | 'executing' | 'reporting' | 'completed'; agentName?: string }) => {
    console.log(`[WS] agent:cycle - ${data.agentId} phase: ${data.phase}`)
    broadcastToChannel('agent:cycle', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Agent Output Events ────────────────────────────────────────────────

  socket.on('agent:output', (data: { agentId: string; outputId: string; outputType: string; title: string; agentName?: string }) => {
    console.log(`[WS] agent:output - ${data.agentId}: ${data.title}`)
    broadcastToChannel('agent:output', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Clone Activity Events ──────────────────────────────────────────────

  socket.on('clone:activity', (data: { cloneId: string; activityType: string; description: string; agentName?: string }) => {
    console.log(`[WS] clone:activity - ${data.cloneId}: ${data.activityType}`)
    broadcastToChannel('clone:activity', {
      ...data,
      timestamp: new Date().toISOString(),
    }, socket.id)
  })

  // ── Disconnect ─────────────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    subscriptions.delete(socket.id)
    connectedClients.delete(socket.id)
    console.log(`[WS] Client disconnected: ${socket.id} (reason: ${reason}, total: ${connectedClients.size})`)
  })

  // ── Error ──────────────────────────────────────────────────────────────

  socket.on('error', (error) => {
    console.error(`[WS] Socket error (${socket.id}):`, error)
  })
})

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[WS] Piaoshu WebSocket service running on port ${PORT}`)
  console.log(`[WS] Supported channels: ${VALID_CHANNELS.join(', ')}`)
  console.log(`[WS] Heartbeat interval: 30s`)
})

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[WS] Received SIGTERM signal, shutting down server...')
  io.disconnectSockets()
  httpServer.close(() => {
    console.log('[WS] WebSocket server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[WS] Received SIGINT signal, shutting down server...')
  io.disconnectSockets()
  httpServer.close(() => {
    console.log('[WS] WebSocket server closed')
    process.exit(0)
  })
})
