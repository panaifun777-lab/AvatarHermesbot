import { NextResponse } from 'next/server'

// In-memory store for SONA evolution state
// In production, this would be persisted in the database
const sonaState = {
  metrics: {
    totalCycles: 23,
    memoriesProcessed: 147,
    insightsGenerated: 34,
    pruningRate: 0.18,
    avgQualityScore: 0.82,
    qualityTrend: [0.65, 0.68, 0.71, 0.73, 0.75, 0.78, 0.76, 0.79, 0.80, 0.82],
    lastCycleAt: new Date(Date.now() - 3600000).toISOString(),
  },
  history: [
    {
      id: 'h1',
      cycleId: 'SONA-2024-023',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      mode: '标准',
      steps: [
        { name: 'RETRIEVE', status: 'completed', duration: 2.3 },
        { name: 'JUDGE', status: 'completed', duration: 4.1 },
        { name: 'DISTILL', status: 'completed', duration: 3.7 },
        { name: 'CONSOLIDATE', status: 'completed', duration: 1.8 },
      ],
      memoriesProcessed: 12,
      insightsGenerated: 3,
      pruned: 2,
      duration: 11.9,
      qualityScore: 0.85,
    },
    {
      id: 'h2',
      cycleId: 'SONA-2024-022',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      mode: '深度',
      steps: [
        { name: 'RETRIEVE', status: 'completed', duration: 3.8 },
        { name: 'JUDGE', status: 'completed', duration: 6.2 },
        { name: 'DISTILL', status: 'completed', duration: 5.1 },
        { name: 'CONSOLIDATE', status: 'completed', duration: 2.9 },
      ],
      memoriesProcessed: 24,
      insightsGenerated: 6,
      pruned: 5,
      duration: 18.0,
      qualityScore: 0.83,
    },
    {
      id: 'h3',
      cycleId: 'SONA-2024-021',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      mode: '轻量',
      steps: [
        { name: 'RETRIEVE', status: 'completed', duration: 1.2 },
        { name: 'JUDGE', status: 'completed', duration: 2.4 },
        { name: 'DISTILL', status: 'completed', duration: 1.8 },
        { name: 'CONSOLIDATE', status: 'completed', duration: 0.9 },
      ],
      memoriesProcessed: 6,
      insightsGenerated: 1,
      pruned: 1,
      duration: 6.3,
      qualityScore: 0.78,
    },
    {
      id: 'h4',
      cycleId: 'SONA-2024-020',
      timestamp: new Date(Date.now() - 28800000).toISOString(),
      mode: '标准',
      steps: [
        { name: 'RETRIEVE', status: 'completed', duration: 2.1 },
        { name: 'JUDGE', status: 'completed', duration: 3.9 },
        { name: 'DISTILL', status: 'completed', duration: 3.2 },
        { name: 'CONSOLIDATE', status: 'completed', duration: 1.5 },
      ],
      memoriesProcessed: 14,
      insightsGenerated: 4,
      pruned: 3,
      duration: 10.7,
      qualityScore: 0.81,
    },
    {
      id: 'h5',
      cycleId: 'SONA-2024-019',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      mode: '深度',
      steps: [
        { name: 'RETRIEVE', status: 'completed', duration: 4.1 },
        { name: 'JUDGE', status: 'completed', duration: 5.8 },
        { name: 'DISTILL', status: 'completed', duration: 4.6 },
        { name: 'CONSOLIDATE', status: 'completed', duration: 2.3 },
      ],
      memoriesProcessed: 28,
      insightsGenerated: 7,
      pruned: 4,
      duration: 16.8,
      qualityScore: 0.79,
    },
  ],
  currentCycle: null as null | {
    id: string
    phase: string
    mode: string
    startedAt: string
    log: Array<{ timestamp: string; phase: string; message: string }>
  },
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        metrics: sonaState.metrics,
        history: sonaState.history,
        currentCycle: sonaState.currentCycle,
      },
    })
  } catch (error) {
    console.error('SONA status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get SONA status' },
      { status: 500 }
    )
  }
}

// Export state for the cycle route to use
export { sonaState }
