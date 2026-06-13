'use client'

import { io, Socket } from 'socket.io-client'
import { useEffect, useRef, useState, useCallback } from 'react'

// Event types emitted by the ws-service
export type WSEventType =
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

export interface WSEvent {
  type: WSEventType
  data: unknown
  timestamp?: string
}

// Connect via gateway - MUST use XTransformPort
const WS_PORT = 3003

const ALL_CHANNELS: WSEventType[] = [
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

interface UseWebSocketOptions {
  /** Callback invoked directly from the socket listener (avoids setState-in-effect lint issues) */
  onEvent?: (event: WSEvent) => void
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null)
  const onEventRef = useRef(options?.onEvent)

  // Keep the callback ref up to date without re-creating the socket
  useEffect(() => {
    onEventRef.current = options?.onEvent
  }, [options?.onEvent])

  useEffect(() => {
    const socket = io(`/?XTransformPort=${WS_PORT}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      setConnected(true)
      // Subscribe to all channels by default
      socket.emit('subscribe', {
        channels: ALL_CHANNELS,
      })
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // Listen for all event types
    ALL_CHANNELS.forEach((event) => {
      socket.on(event, (data: unknown) => {
        const wsEvent: WSEvent = { type: event, data }
        setLastEvent(wsEvent)
        // Call the onEvent callback directly from the listener
        onEventRef.current?.(wsEvent)
      })
    })

    // Heartbeat
    socket.on('ping', (data: { timestamp: string }) => {
      socket.emit('pong', data)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [])

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const subscribe = useCallback((channels: WSEventType[]) => {
    socketRef.current?.emit('subscribe', { channels })
  }, [])

  const unsubscribe = useCallback((channels: WSEventType[]) => {
    socketRef.current?.emit('unsubscribe', { channels })
  }, [])

  return { connected, lastEvent, emit, subscribe, unsubscribe }
}
