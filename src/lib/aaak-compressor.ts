// AAAK Compressor — MemPalace-inspired 30x compression format
// LLM-native: no decompressor needed, any LLM reads AAAK format directly

const ENGLISH_STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'that', 'this', 'these',
  'those', 'it', 'its', 'he', 'she', 'they', 'them', 'their', 'his',
  'her', 'we', 'our', 'you', 'your', 'and', 'but', 'or', 'nor', 'not',
  'so', 'very', 'just', 'about', 'also', 'only', 'up', 'down', 'more',
  'some', 'such', 'no', 'than', 'too', 'very', 'how', 'what', 'when',
  'where', 'who', 'which', 'why', 'all', 'each', 'every', 'both',
  'few', 'most', 'other', 'any', 'if', 'because', 'while', 'although',
])

const CHINESE_STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都',
  '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
  '会', '着', '没有', '看', '好', '自己', '这', '他', '她', '它',
  '们', '那', '被', '从', '把', '对', '与', '而', '但', '却',
  '又', '还', '已', '将', '能', '让', '向', '于', '为', '以',
  '及', '等', '吗', '吧', '呢', '啊', '哦', '嗯', '地', '得',
])

const EMOTION_CODES: Record<string, string> = {
  vulnerable: 'vul', joyful: 'joy', fearful: 'fear', trusting: 'trust',
  grieving: 'grief', wondering: 'wond', angry: 'angr', surprised: 'surp',
  disgusted: 'disg', proud: 'prid', ashamed: 'sham', excited: 'exc',
  peaceful: 'peac', anxious: 'anx', hopeful: 'hope', grateful: 'grat',
  lonely: 'lone', confused: 'conf', relieved: 'rel', nostalgic: 'nost',
  determined: 'det', curious: 'cur', content: 'cont', embarrassed: 'emba',
  jealous: 'jeal', resentful: 'rese', compassionate: 'comp', inspired: 'insp',
}

const SEMANTIC_FLAGS = [
  'ORIGIN', 'CORE', 'SENSITIVE', 'PIVOT', 'GENESIS', 'DECISION', 'TECHNICAL',
] as const

export type SemanticFlag = typeof SEMANTIC_FLAGS[number]

interface AAAKMetadata {
  entities?: string[]
  topic?: string
  importance?: number // 1-5
  emotions?: string[]
  flags?: SemanticFlag[]
  sourceType?: string
}

interface AAAKResult {
  summary: string
  entityCodes: string[]
  keyQuote: string
  importanceRating: string
  tokens: number
}

/**
 * Extract 3-letter uppercase codes for entities
 * e.g., "Alice" → "ALC", "Clerk" → "CLK", "React" → "RCT"
 */
function extractEntityCodes(entities: string[]): string[] {
  return entities.map(e => {
    const cleaned = e.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '')
    if (!cleaned) return ''
    // For English: take first 3 consonants or letters
    if (/^[a-zA-Z]/.test(cleaned)) {
      const upper = cleaned.toUpperCase()
      const consonants = upper.replace(/[AEIOU]/g, '')
      if (consonants.length >= 3) return consonants.substring(0, 3)
      return upper.substring(0, 3)
    }
    // For Chinese: take first character + pinyin-like abbreviation
    return cleaned.substring(0, 2).toUpperCase() || cleaned.substring(0, 3)
  }).filter(Boolean)
}

/**
 * Select the most decision-relevant sentence under 80 chars as key quote
 */
function selectKeyQuote(content: string): string {
  const sentences = content
    .split(/[.!?。！？\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  // Decision-relevance keywords (Chinese + English)
  const decisionKeywords = [
    'decided', 'because', 'switched', 'prefer', 'recommend', 'chose', 'selected',
    '决定', '因为', '选择', '推荐', '偏好', '切换', '采用', '放弃',
    'should', 'must', 'critical', 'important', 'key', '核心', '关键', '必须',
  ]

  // Find most relevant sentence under 80 chars
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      const lower = trimmed.toLowerCase()
      if (decisionKeywords.some(kw => lower.includes(kw))) {
        return trimmed
      }
    }
  }

  // Fallback: first sentence truncated to 80 chars
  const first = sentences[0]?.trim() || ''
  return first.length > 80 ? first.substring(0, 77) + '...' : first
}

/**
 * Convert importance (1-5) to star rating
 */
function importanceToStars(importance: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(importance)))
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped)
}

/**
 * Remove stop words from content, keeping meaningful tokens
 */
function removeStopWords(content: string): string[] {
  // Split on whitespace and Chinese characters
  const tokens = content.split(/[\s,;:，；：、]+/).filter(Boolean)
  return tokens.filter(t => {
    const lower = t.toLowerCase()
    return !ENGLISH_STOP_WORDS.has(lower) && !CHINESE_STOP_WORDS.has(lower) && t.length > 0
  })
}

/**
 * Auto-detect semantic flags from content
 */
function autoDetectFlags(content: string, metadata: AAAKMetadata): SemanticFlag[] {
  const flags: SemanticFlag[] = metadata.flags || []
  const lower = content.toLowerCase()

  if (flags.length === 0) {
    // Auto-detect based on content patterns
    if (/决定|decided|chose|selected/i.test(content)) flags.push('DECISION')
    if (/核心|core|fundamental|essential|关键/i.test(content)) flags.push('CORE')
    if (/敏感|sensitive|confidential|机密/i.test(content)) flags.push('SENSITIVE')
    if (/起源|origin|initial|first|起源|最初/i.test(content)) flags.push('ORIGIN')
    if (/转折|pivot|turning point|转变/i.test(content)) flags.push('PIVOT')
    if (/初始|genesis|created|诞生|创建/i.test(content)) flags.push('GENESIS')
    if (/技术|technical|architecture|api|代码|部署/i.test(content)) flags.push('TECHNICAL')
  }

  // Limit to 3 flags max to keep summary concise
  return [...new Set(flags)].slice(0, 3)
}

/**
 * Compress content into AAAK format
 * Returns ~30x smaller summary that any LLM can read natively
 *
 * Format: ENTITY_CODES | TOPIC | KEY_QUOTE | IMPORTANCE | EMOTIONS | FLAGS
 */
export function compress(content: string, metadata: AAAKMetadata = {}): AAAKResult {
  const entities = metadata.entities || []
  const entityCodes = extractEntityCodes(entities)
  const keyQuote = selectKeyQuote(content)
  const importance = metadata.importance || 3
  const importanceRating = importanceToStars(importance)
  const flags = autoDetectFlags(content, metadata)

  // Build meaningful tokens (stop words removed)
  const meaningfulTokens = removeStopWords(content)
  const topicStr = metadata.topic
    ? metadata.topic.replace(/[\s]+/g, '_').toUpperCase()
    : ''

  // Emotion codes
  const emotionStrs = (metadata.emotions || [])
    .map(e => EMOTION_CODES[e.toLowerCase()] || e)
    .slice(0, 3)

  // Assemble AAAK summary
  const parts: string[] = []

  // Entity codes line
  if (entityCodes.length > 0) {
    parts.push(`ENT:${entityCodes.join('+')}`)
  }

  // Topic
  if (topicStr) {
    parts.push(`TOP:${topicStr}`)
  }

  // Source type
  if (metadata.sourceType) {
    parts.push(`SRC:${metadata.sourceType.toUpperCase()}`)
  }

  // Key quote (most important line)
  if (keyQuote) {
    parts.push(`Q:"${keyQuote}"`)
  }

  // Importance rating
  parts.push(importanceRating)

  // Emotions
  if (emotionStrs.length > 0) {
    parts.push(`EMO:${emotionStrs.join('+')}`)
  }

  // Semantic flags
  if (flags.length > 0) {
    parts.push(`FLG:${flags.join('+')}`)
  }

  // Add condensed meaningful tokens (top 10 by length, for keyword density)
  const topTokens = meaningfulTokens
    .sort((a, b) => b.length - a.length)
    .slice(0, 10)
    .map(t => t.length > 15 ? t.substring(0, 15) + '…' : t)
  if (topTokens.length > 0) {
    parts.push(`KW:${topTokens.join(',')}`)
  }

  const summary = parts.join(' | ')

  // Estimate token count (rough: ~4 chars per token for English, ~1.5 chars per token for Chinese)
  const charCount = summary.length
  const chineseCount = (summary.match(/[\u4e00-\u9fff]/g) || []).length
  const estimatedTokens = Math.ceil(
    (charCount - chineseCount) / 4 + chineseCount / 1.5
  )

  return {
    summary,
    entityCodes,
    keyQuote,
    importanceRating,
    tokens: estimatedTokens,
  }
}

/**
 * Generate content hash for deduplication (simple MD5-like)
 */
export function generateContentHash(content: string): string {
  // Simple hash function (not cryptographic, just for dedup)
  let hash = 0
  const str = content.trim().toLowerCase()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0') +
    Math.abs(hash * 31).toString(16).padStart(8, '0')
}

/**
 * compressAAAK — Extracts Actor, Action, Asset, Key-result from text
 * Alias for compress() with AAAK-specific interface
 * Returns compressed AAAK summary string
 */
export function compressAAAK(content: string): string {
  const result = compress(content)
  return result.summary
}

/**
 * computeHash — Simple MD5-like hash for dedup
 * Alias for generateContentHash with matching interface
 */
export function computeHash(content: string): string {
  return generateContentHash(content)
}

/**
 * isDuplicate — Check if a new content hash already exists in a list of existing hashes
 */
export function isDuplicate(newHash: string, existingHashes: string[]): boolean {
  return existingHashes.includes(newHash)
}
