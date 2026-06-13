import { NextResponse } from 'next/server'

export async function GET() {
  // Simulated storage health status with realistic mock data
  const now = new Date()
  const uptimeSeconds = 86400 + Math.floor(Math.random() * 43200)

  const ipfsStatus = {
    connected: true,
    nodeVersion: '0.22.0',
    peers: 47 + Math.floor(Math.random() * 20),
    repoSize: '2.4 GB',
    pinCount: 156 + Math.floor(Math.random() * 30),
    pinnedItems: [
      { cid: 'QmX8z3k7v2nB9mLp5TqR4wA1sD6fG2hJ3kL8mN4oP7qS', name: 'soul-config-v3.md', size: '4.2 KB', pinnedAt: new Date(now.getTime() - 3600000).toISOString() },
      { cid: 'QmY9a4l8w3oC0nM6qT5rV2xB1sE7fH3iK4mO5pQ8rS0t', name: 'memory-palace-snapshot.json', size: '128 KB', pinnedAt: new Date(now.getTime() - 7200000).toISOString() },
      { cid: 'QmZ0b5m9x4pD1oN7rU6sW3yC2tF8gI4jL5nP6qR9sT1u', name: 'evidence-chain-batch-12.json', size: '56 KB', pinnedAt: new Date(now.getTime() - 14400000).toISOString() },
      { cid: 'QmA1c6n0y5qE2pO8sV7tX4zD3uG9hJ5kM6oQ7rR0tU2v', name: 'avatar-persona-ceo.json', size: '12 KB', pinnedAt: new Date(now.getTime() - 28800000).toISOString() },
      { cid: 'QmB2d7o1z6rF3qP9tW8uY5aE4vH0iK6lN7pS8sU1vV3w', name: 'knowledge-graph-export.json', size: '340 KB', pinnedAt: new Date(now.getTime() - 43200000).toISOString() },
    ],
    bandwidth: {
      inbound: '2.3 MB/s',
      outbound: '1.8 MB/s',
    },
  }

  const arweaveStatus = {
    connected: true,
    networkHeight: 1425893 + Math.floor(Math.random() * 100),
    currentBlockHash: 'hK7v_2mN9pQ4rS6tU8wX0yZ2aB4cD6eF8gH0iJ2kL4m',
    walletBalance: '2.45 AR',
    estimatedCostPerMB: '0.00082 AR',
    totalUploads: 23 + Math.floor(Math.random() * 10),
    totalSpent: '0.156 AR',
    recentUploads: [
      { txId: 'aB3cD5eF7gH9iJ1kL2mN4oP6qR8sT0u', name: 'evidence-anchor-tx.json', size: '2.1 KB', cost: '0.000002 AR', status: 'confirmed', timestamp: new Date(now.getTime() - 1800000).toISOString() },
      { txId: 'vW2xY4zA6bC8dE0fG1hI3jK5lM7nO9p', name: 'memory-drawer-backup.json', size: '89 KB', cost: '0.000073 AR', status: 'confirmed', timestamp: new Date(now.getTime() - 5400000).toISOString() },
      { txId: 'qR1sT3uV5wX7yZ9aB1cD3eF5gH7iJ9k', name: 'persona-soul-v3.md', size: '6.8 KB', cost: '0.000006 AR', status: 'confirmed', timestamp: new Date(now.getTime() - 10800000).toISOString() },
    ],
  }

  const overallStatus = {
    health: 'healthy' as const,
    uptime: formatUptime(uptimeSeconds),
    totalPins: ipfsStatus.pinCount,
    totalArweaveUploads: arweaveStatus.totalUploads,
    totalStorageUsed: '3.2 GB',
    replicationFactor: 3,
    lastSyncAt: new Date(now.getTime() - 300000).toISOString(),
    // Architecture data flow stats
    dataFlow: {
      pendingPins: 2 + Math.floor(Math.random() * 5),
      pendingArweave: Math.floor(Math.random() * 3),
      anchorQueue: Math.floor(Math.random() * 4),
      completedAnchors: 18 + Math.floor(Math.random() * 10),
    },
  }

  return NextResponse.json({
    success: true,
    data: {
      ipfs: ipfsStatus,
      arweave: arweaveStatus,
      overall: overallStatus,
    },
  })
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}
