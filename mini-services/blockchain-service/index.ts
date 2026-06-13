// Blockchain Mini-Service — Simulated Ethereum L2 Node
// Port: 3006 | Network: Base Sepolia (L2 Testnet)

import { createServer, IncomingMessage, ServerResponse } from 'http'

const PORT = 3007

// ─── State ──────────────────────────────────────────────────────────────────────

interface WalletState {
  address: string
  privateKey: string
  balance: string
  network: string
  connected: boolean
  connectedAt: string | null
}

interface OnChainRecord {
  txHash: string
  evidenceId?: string
  contentHash?: string
  metadata?: string
  blockNumber: number
  gasUsed: number
  status: 'confirmed' | 'pending' | 'failed'
  anchorTimestamp: number
  txType: 'anchor_evidence' | 'settle_payment' | 'verify'
  taskId?: string
  amount?: number
  token?: string
  recipient?: string
}

let currentBlock = 12_345_678 + Math.floor(Math.random() * 1000)
let currentWallet: WalletState | null = null
const onChainRecords: OnChainRecord[] = []

const CONTRACT_ADDRESS = '0xEv1d3nc3Anch0r0000000000000000000000000'
const PAYMENT_CONTRACT = '0xPaym3ntS3ttl3m3nt00000000000000000000000'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function generateHex(length: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function generateTxHash(): string {
  return `0x${generateHex(64)}`
}

function generateAddress(): string {
  return `0x${generateHex(40)}`
}

function generatePrivateKey(): string {
  return `0x${generateHex(64)}`
}

function randomGas(): number {
  return 21_000 + Math.floor(Math.random() * 44_000)
}

function nextBlock(): number {
  currentBlock += 1
  return currentBlock
}

function getGasPrice(): string {
  return (0.001 + Math.random() * 0.005).toFixed(6)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(JSON.stringify(data))
}

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

function parseUrl(req: IncomingMessage): { path: string; params: Record<string, string> } {
  const fullUrl = req.url || '/'
  const [path, queryString] = fullUrl.split('?')
  const params: Record<string, string> = {}
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [key, value] = pair.split('=')
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  }
  return { path, params }
}

// ─── Route Handlers ─────────────────────────────────────────────────────────────

function handleWalletConnect(): Record<string, unknown> {
  currentWallet = {
    address: generateAddress(),
    privateKey: generatePrivateKey(),
    balance: `${(10 + Math.random() * 90).toFixed(4)}`,
    network: 'Base Sepolia',
    connected: true,
    connectedAt: new Date().toISOString(),
  }
  return {
    success: true,
    data: {
      address: currentWallet.address,
      balance: currentWallet.balance,
      network: currentWallet.network,
      connectedAt: currentWallet.connectedAt,
    },
  }
}

function handleWalletStatus(): Record<string, unknown> {
  if (!currentWallet) {
    return { success: true, data: { connected: false, address: null, balance: null, network: null } }
  }
  return {
    success: true,
    data: {
      connected: currentWallet.connected,
      address: currentWallet.address,
      balance: currentWallet.balance,
      network: currentWallet.network,
      connectedAt: currentWallet.connectedAt,
    },
  }
}

function handleAnchorEvidence(body: Record<string, unknown>): Record<string, unknown> {
  const { evidenceId, contentHash, metadata } = body

  if (!currentWallet) {
    return { success: false, error: 'Wallet not connected' }
  }

  const txHash = generateTxHash()
  const blockNumber = nextBlock()
  const gasUsed = randomGas()
  const recordContentHash = (typeof contentHash === 'string' && contentHash) ? contentHash : generateTxHash()

  const record: OnChainRecord = {
    txHash,
    evidenceId: typeof evidenceId === 'string' ? evidenceId : undefined,
    contentHash: recordContentHash,
    metadata: typeof metadata === 'string' ? metadata : undefined,
    blockNumber,
    gasUsed,
    status: 'confirmed',
    anchorTimestamp: Date.now(),
    txType: 'anchor_evidence',
  }
  onChainRecords.unshift(record)

  return {
    success: true,
    data: {
      txHash,
      blockNumber,
      gasUsed,
      status: 'confirmed',
      fromAddress: currentWallet.address,
      toAddress: CONTRACT_ADDRESS,
      contentHash: recordContentHash,
      anchorTimestamp: record.anchorTimestamp,
    },
  }
}

function handleVerifyEvidence(body: Record<string, unknown>): Record<string, unknown> {
  const { txHash } = body

  if (!txHash || typeof txHash !== 'string') {
    return { success: false, error: 'txHash is required' }
  }

  const record = onChainRecords.find((r) => r.txHash === txHash)
  if (record && record.status === 'confirmed') {
    return {
      success: true,
      data: {
        verified: true,
        evidenceId: record.evidenceId || null,
        contentHash: record.contentHash || null,
        anchorTimestamp: record.anchorTimestamp,
        blockNumber: record.blockNumber,
        txHash: record.txHash,
      },
    }
  }

  if (txHash.startsWith('0x') && txHash.length === 66) {
    return {
      success: true,
      data: {
        verified: true,
        evidenceId: `ev_${generateHex(8)}`,
        contentHash: generateTxHash(),
        anchorTimestamp: Date.now() - Math.floor(Math.random() * 86400000),
        blockNumber: currentBlock - Math.floor(Math.random() * 100),
        txHash,
      },
    }
  }

  return {
    success: true,
    data: {
      verified: false,
      evidenceId: null,
      contentHash: null,
      anchorTimestamp: null,
      blockNumber: null,
      txHash,
    },
  }
}

function handleSettlePayment(body: Record<string, unknown>): Record<string, unknown> {
  const { taskId, amount, token, recipient } = body

  if (!currentWallet) {
    return { success: false, error: 'Wallet not connected' }
  }

  const txHash = generateTxHash()
  const blockNumber = nextBlock()
  const gasUsed = randomGas()

  const record: OnChainRecord = {
    txHash,
    taskId: typeof taskId === 'string' ? taskId : undefined,
    amount: typeof amount === 'number' ? amount : 0,
    token: typeof token === 'string' ? token : 'USDT',
    recipient: typeof recipient === 'string' ? recipient : undefined,
    blockNumber,
    gasUsed,
    status: 'confirmed',
    anchorTimestamp: Date.now(),
    txType: 'settle_payment',
  }
  onChainRecords.unshift(record)

  return {
    success: true,
    data: {
      txHash,
      blockNumber,
      gasUsed,
      status: 'confirmed',
      fromAddress: currentWallet.address,
      toAddress: PAYMENT_CONTRACT,
      amount: typeof amount === 'number' ? amount : 0,
      token: typeof token === 'string' ? token : 'USDT',
      recipient: typeof recipient === 'string' ? recipient : null,
    },
  }
}

function handleContracts(): Record<string, unknown> {
  return {
    success: true,
    data: {
      contracts: [
        {
          name: 'EvidenceAnchor',
          address: CONTRACT_ADDRESS,
          version: '0.1.0',
          compiler: 'Solidity 0.8.24',
          deployedAt: '2024-12-01T00:00:00Z',
          deployTxHash: '0x' + generateHex(64),
          network: 'Base Sepolia',
        },
        {
          name: 'PaymentSettlement',
          address: PAYMENT_CONTRACT,
          version: '0.1.0',
          compiler: 'Solidity 0.8.24',
          deployedAt: '2024-12-01T00:00:00Z',
          deployTxHash: '0x' + generateHex(64),
          network: 'Base Sepolia',
        },
      ],
    },
  }
}

function handleNetwork(): Record<string, unknown> {
  return {
    success: true,
    data: {
      network: 'Base Sepolia',
      chainId: 84532,
      blockHeight: currentBlock,
      gasPrice: getGasPrice(),
      isSyncing: false,
      pendingTxCount: Math.floor(Math.random() * 5),
      l1BlockHeight: 19_000_000 + Math.floor(Math.random() * 10000),
      lastBlockTimestamp: Date.now(),
      version: 'v1.0.0-simulated',
    },
  }
}

function handleTransactions(params: Record<string, string>): Record<string, unknown> {
  const limit = Math.min(parseInt(params.limit || '20'), 100)
  const records = onChainRecords.slice(0, limit).map((r) => ({
    txHash: r.txHash,
    txType: r.txType,
    status: r.status,
    blockNumber: r.blockNumber,
    gasUsed: r.gasUsed,
    anchorTimestamp: r.anchorTimestamp,
    evidenceId: r.evidenceId || null,
    taskId: r.taskId || null,
  }))
  return {
    success: true,
    data: {
      transactions: records,
      total: onChainRecords.length,
    },
  }
}

// ─── HTTP Server ────────────────────────────────────────────────────────────────

const httpServer = createServer(async (req, res) => {
  const { path, params } = parseUrl(req)
  const method = req.method || 'GET'

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  try {
    // ── GET Routes ──────────────────────────────────────────────────────
    if (method === 'GET') {
      if (path === '/api/wallet/status') {
        sendJson(res, handleWalletStatus())
        return
      }
      if (path === '/api/contracts') {
        sendJson(res, handleContracts())
        return
      }
      if (path === '/api/network') {
        sendJson(res, handleNetwork())
        return
      }
      if (path === '/api/transactions') {
        sendJson(res, handleTransactions(params))
        return
      }
      sendJson(res, { success: false, error: 'Not found' }, 404)
      return
    }

    // ── POST Routes ─────────────────────────────────────────────────────
    if (method === 'POST') {
      const body = await parseBody(req)

      if (path === '/api/wallet/connect') {
        sendJson(res, handleWalletConnect())
        return
      }
      if (path === '/api/contract/anchor-evidence') {
        sendJson(res, handleAnchorEvidence(body))
        return
      }
      if (path === '/api/contract/verify-evidence') {
        sendJson(res, handleVerifyEvidence(body))
        return
      }
      if (path === '/api/contract/settle-payment') {
        sendJson(res, handleSettlePayment(body))
        return
      }

      sendJson(res, { success: false, error: 'Not found' }, 404)
      return
    }

    sendJson(res, { success: false, error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('[blockchain-service] Error:', err)
    sendJson(res, { success: false, error: 'Internal server error' }, 500)
  }
})

httpServer.listen(PORT, () => {
  console.log(`[blockchain-service] Running on port ${PORT}`)
  console.log(`[blockchain-service] Network: Base Sepolia (Chain ID: 84532)`)
  console.log(`[blockchain-service] Contracts: EvidenceAnchor @ ${CONTRACT_ADDRESS}`)
})

// ─── Graceful Shutdown ──────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[blockchain-service] Received SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[blockchain-service] Received SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
