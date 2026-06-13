// Fast Vercel DB initialization - uses direct SQL instead of prisma db push
import { db } from '@/lib/db'

let initialized = false

// Minimal schema SQL - just the essential tables needed for auth
const AUTH_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  plan TEXT DEFAULT 'free',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Founder (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entityType TEXT,
  entityId TEXT,
  details TEXT,
  performedBy TEXT DEFAULT 'system',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AvatarClone (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  persona TEXT NOT NULL,
  avatarStyle TEXT DEFAULT 'realistic',
  avatarUrl TEXT,
  status TEXT DEFAULT 'initializing',
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  totalCycles INTEGER DEFAULT 0,
  lastActiveAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS CloneAgent (
  id TEXT PRIMARY KEY,
  cloneId TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  persona TEXT NOT NULL,
  avatarUrl TEXT,
  status TEXT DEFAULT 'idle',
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  cycleCount INTEGER DEFAULT 0,
  lastCycleAt DATETIME,
  config TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cloneId) REFERENCES AvatarClone(id)
);

CREATE TABLE IF NOT EXISTS CloneSkill (
  id TEXT PRIMARY KEY,
  cloneId TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cloneId) REFERENCES AvatarClone(id)
);
`

export async function initVercelDb(): Promise<boolean> {
  if (initialized) return true
  if (process.env.VERCEL !== '1') return true

  try {
    // Execute each statement separately for SQLite compatibility
    const statements = AUTH_TABLES_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const stmt of statements) {
      await db.$executeRawUnsafe(stmt + ';')
    }

    initialized = true
    console.log('[initVercelDb] Auth tables created successfully')
    return true
  } catch (e) {
    // Tables might already exist - that's fine
    console.log('[initVercelDb] Tables may already exist, continuing')
    initialized = true
    return true
  }
}
