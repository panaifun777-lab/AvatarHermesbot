import { createServer, IncomingMessage, ServerResponse } from 'http'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VectorEntry {
  id: string
  text: string
  vector: number[]
  metadata: {
    sourceType?: string
    sourceId?: string
    tags?: string
    memoryId?: string
    createdAt: string
  }
}

// ─── In-Memory Vector Store ──────────────────────────────────────────────────

const vectorStore = new Map<string, VectorEntry>()

// ─── Cosine Similarity ───────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dotProduct / denom
}

// ─── Embedding Generation ────────────────────────────────────────────────────

// Advanced semantic hash embedding using character n-grams and word features
function generateEmbedding(text: string): number[] {
  const DIM = 64
  const normalized = text.toLowerCase().trim()
  const words = normalized.split(/\s+/).filter(w => w.length > 0)
  const vector = new Float64Array(DIM)

  // Character-level features (n-gram hashing)
  for (let n = 1; n <= 4; n++) {
    for (let i = 0; i <= normalized.length - n; i++) {
      const ngram = normalized.substring(i, i + n)
      let hash = 0
      for (let j = 0; j < ngram.length; j++) {
        hash = ((hash << 5) - hash + ngram.charCodeAt(j)) | 0
      }
      const idx = Math.abs(hash) % DIM
      vector[idx] += 1.0 / n // shorter n-grams get more weight
    }
  }

  // Word-level features (word position hashing)
  for (let w = 0; w < words.length; w++) {
    const word = words[w]
    let hash = 0
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0
    }
    const idx = Math.abs(hash) % DIM
    vector[idx] += 1.0 + (0.1 * Math.min(w, 5)) // position-aware weighting
  }

  // Word pair features (bigram co-occurrence)
  for (let w = 0; w < words.length - 1; w++) {
    const pair = words[w] + '_' + words[w + 1]
    let hash = 0
    for (let j = 0; j < pair.length; j++) {
      hash = ((hash << 5) - hash + pair.charCodeAt(j)) | 0
    }
    const idx = Math.abs(hash) % DIM
    vector[idx] += 0.5
  }

  // Length feature (in first 4 dimensions)
  const lenNorm = Math.min(normalized.length / 200, 1.0)
  vector[0] += lenNorm * 2
  vector[1] += (words.length / 50) * 2
  vector[2] += (normalized.length > 0 ? normalized.charCodeAt(0) / 65535 : 0) * 0.5
  vector[3] += (normalized.length > 1 ? normalized.charCodeAt(normalized.length - 1) / 65535 : 0) * 0.5

  // Normalize the vector to unit length
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  if (norm > 0) {
    for (let i = 0; i < DIM; i++) {
      vector[i] = vector[i] / norm
    }
  }

  return Array.from(vector)
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function sendJSON(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

// ─── Request Router ───────────────────────────────────────────────────────────

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const path = url.pathname
  const method = req.method || 'GET'

  // CORS preflight
  if (method === 'OPTIONS') {
    sendJSON(res, 204, {})
    return
  }

  try {
    // POST /api/embed — Generate embedding for text and store
    if (method === 'POST' && path === '/api/embed') {
      const body = await parseBody(req)
      const { text, id, metadata } = body

      if (!text || typeof text !== 'string') {
        sendJSON(res, 400, { success: false, error: 'text field is required' })
        return
      }

      const vectorId = id || `vec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const vector = generateEmbedding(text)

      const entry: VectorEntry = {
        id: vectorId,
        text: text.substring(0, 2000),
        vector,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
        },
      }

      vectorStore.set(vectorId, entry)

      console.log(`[Vector] Embedded and stored: ${vectorId} (dim=${vector.length})`)
      sendJSON(res, 200, { success: true, data: { id: vectorId, dimensions: vector.length } })
      return
    }

    // POST /api/search — Semantic search
    if (method === 'POST' && path === '/api/search') {
      const body = await parseBody(req)
      const { query, topK = 5, threshold = 0.3 } = body

      if (!query || typeof query !== 'string') {
        sendJSON(res, 400, { success: false, error: 'query field is required' })
        return
      }

      const queryVector = generateEmbedding(query)

      const results: Array<{ id: string; text: string; similarity: number; metadata: VectorEntry['metadata'] }> = []

      for (const [_, entry] of vectorStore) {
        const similarity = cosineSimilarity(queryVector, entry.vector)
        if (similarity >= threshold) {
          results.push({
            id: entry.id,
            text: entry.text,
            similarity: Math.round(similarity * 10000) / 10000,
            metadata: entry.metadata,
          })
        }
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity)
      const topResults = results.slice(0, Math.min(topK, 50))

      console.log(`[Vector] Search: "${query.substring(0, 50)}" → ${topResults.length} results (from ${vectorStore.size} vectors)`)
      sendJSON(res, 200, { success: true, data: { results: topResults, total: results.length, queryDimensions: queryVector.length } })
      return
    }

    // GET /api/collections — List all stored vectors
    if (method === 'GET' && path === '/api/collections') {
      const entries: Array<{ id: string; text: string; metadata: VectorEntry['metadata']; dimensions: number }> = []

      for (const [_, entry] of vectorStore) {
        entries.push({
          id: entry.id,
          text: entry.text.substring(0, 200) + (entry.text.length > 200 ? '...' : ''),
          metadata: entry.metadata,
          dimensions: entry.vector.length,
        })
      }

      sendJSON(res, 200, { success: true, data: { vectors: entries, total: entries.length } })
      return
    }

    // DELETE /api/vectors/:id — Remove a vector
    if (method === 'DELETE' && path.startsWith('/api/vectors/')) {
      const vectorId = path.replace('/api/vectors/', '')

      if (!vectorStore.has(vectorId)) {
        sendJSON(res, 404, { success: false, error: 'Vector not found' })
        return
      }

      vectorStore.delete(vectorId)
      console.log(`[Vector] Deleted: ${vectorId}`)
      sendJSON(res, 200, { success: true, data: { id: vectorId } })
      return
    }

    // POST /api/sync — Sync embeddings from memory entries
    if (method === 'POST' && path === '/api/sync') {
      const body = await parseBody(req)
      const { memories } = body as { memories: Array<{ id: string; content: string; sourceType?: string; sourceId?: string; tags?: string }> }

      if (!memories || !Array.isArray(memories)) {
        sendJSON(res, 400, { success: false, error: 'memories array is required' })
        return
      }

      let synced = 0
      let errors = 0

      for (const memory of memories) {
        if (!memory.content) continue

        try {
          const vector = generateEmbedding(memory.content)
          const entry: VectorEntry = {
            id: `mem_${memory.id}`,
            text: memory.content.substring(0, 2000),
            vector,
            metadata: {
              sourceType: memory.sourceType,
              sourceId: memory.sourceId,
              tags: memory.tags,
              memoryId: memory.id,
              createdAt: new Date().toISOString(),
            },
          }
          vectorStore.set(entry.id, entry)
          synced++
        } catch (err) {
          errors++
          console.error(`[Vector] Sync error for memory ${memory.id}:`, err)
        }
      }

      console.log(`[Vector] Synced: ${synced}/${memories.length} memories (${errors} errors)`)
      sendJSON(res, 200, { success: true, data: { synced, errors, total: memories.length } })
      return
    }

    // GET /api/health — Health check
    if (method === 'GET' && path === '/api/health') {
      sendJSON(res, 200, { success: true, data: { status: 'healthy', vectors: vectorStore.size, uptime: process.uptime() } })
      return
    }

    // 404
    sendJSON(res, 404, { success: false, error: 'Not found' })
  } catch (error) {
    console.error('[Vector] Request error:', error)
    sendJSON(res, 500, { success: false, error: 'Internal server error' })
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = 3004

const server = createServer(handleRequest)

server.listen(PORT, () => {
  console.log(`[Vector] Piaoshu Vector Search service running on port ${PORT}`)
  console.log(`[Vector] Endpoints:`)
  console.log(`[Vector]   POST /api/embed      - Generate and store embedding`)
  console.log(`[Vector]   POST /api/search     - Semantic search`)
  console.log(`[Vector]   GET  /api/collections - List stored vectors`)
  console.log(`[Vector]   DELETE /api/vectors/:id - Remove vector`)
  console.log(`[Vector]   POST /api/sync       - Sync memories from DB`)
  console.log(`[Vector]   GET  /api/health     - Health check`)
})

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Vector] Received SIGTERM, shutting down...')
  server.close(() => {
    console.log('[Vector] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Vector] Received SIGINT, shutting down...')
  server.close(() => {
    console.log('[Vector] Server closed')
    process.exit(0)
  })
})

// Prevent unhandled rejections from crashing
process.on('unhandledRejection', (reason) => {
  console.error('[Vector] Unhandled rejection:', reason)
})
