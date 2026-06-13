import { NextRequest, NextResponse } from 'next/server'

// In-memory storage config (simulated — would be DB in production)
let storageConfig = {
  ipfsNodeUrl: 'https://ipfs.infura.io:5001',
  ipfsGatewayUrl: 'https://ipfs.io/ipfs',
  arweaveGatewayUrl: 'https://arweave.net',
  arweaveWalletAddress: '',
  strategy: 'dual-redundant' as StorageStrategy,
  autoPin: true,
  replicationCount: 3,
}

type StorageStrategy = 'ipfs-only' | 'arweave-only' | 'dual-redundant' | 'auto-select'

const VALID_STRATEGIES: StorageStrategy[] = ['ipfs-only', 'arweave-only', 'dual-redundant', 'auto-select']

export async function GET() {
  return NextResponse.json({
    success: true,
    data: storageConfig,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.ipfsNodeUrl !== undefined) {
      storageConfig.ipfsNodeUrl = String(body.ipfsNodeUrl)
    }
    if (body.ipfsGatewayUrl !== undefined) {
      storageConfig.ipfsGatewayUrl = String(body.ipfsGatewayUrl)
    }
    if (body.arweaveGatewayUrl !== undefined) {
      storageConfig.arweaveGatewayUrl = String(body.arweaveGatewayUrl)
    }
    if (body.arweaveWalletAddress !== undefined) {
      storageConfig.arweaveWalletAddress = String(body.arweaveWalletAddress)
    }
    if (body.strategy !== undefined) {
      const strategy = String(body.strategy) as StorageStrategy
      if (!VALID_STRATEGIES.includes(strategy)) {
        return NextResponse.json(
          { success: false, error: `Invalid strategy. Must be one of: ${VALID_STRATEGIES.join(', ')}` },
          { status: 400 }
        )
      }
      storageConfig.strategy = strategy
    }
    if (body.autoPin !== undefined) {
      storageConfig.autoPin = Boolean(body.autoPin)
    }
    if (body.replicationCount !== undefined) {
      const count = Number(body.replicationCount)
      if (count < 1 || count > 10) {
        return NextResponse.json(
          { success: false, error: 'Replication count must be between 1 and 10' },
          { status: 400 }
        )
      }
      storageConfig.replicationCount = count
    }

    return NextResponse.json({
      success: true,
      data: storageConfig,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
