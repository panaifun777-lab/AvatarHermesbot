import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1'
// Check if using Turso (libsql:// URL)
const isTurso = process.env.DATABASE_URL?.startsWith('libsql://')

// On Vercel without Turso, auto-switch to /tmp for SQLite
if (isVercel && !isTurso) {
  const currentUrl = process.env.DATABASE_URL || ''
  if (currentUrl.startsWith('file:') || !currentUrl) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db'
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isVercel && !isTurso ? [] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await db.$connect()
    return true
  } catch {
    return false
  }
}
