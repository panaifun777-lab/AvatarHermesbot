import { create } from 'zustand'

export type ActiveModule = 'dashboard' | 'cognitive' | 'evidence' | 'collaboration' | 'sandbox' | 'roadmap'

interface AppState {
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // 认知分片引擎状态
  cognitiveShards: CognitiveShard[]
  setCognitiveShards: (shards: CognitiveShard[]) => void
  simulations: Simulation[]
  addSimulation: (sim: Simulation) => void
  
  // 证据链状态
  evidences: Evidence[]
  setEvidences: (evidences: Evidence[]) => void
  credentials: Credential[]
  setCredentials: (credentials: Credential[]) => void
  
  // 协作调度器状态
  tasks: CollabTask[]
  setTasks: (tasks: CollabTask[]) => void
  payments: Payment[]
  setPayments: (payments: Payment[]) => void
  
  // 沙盒状态
  projects: SandboxProject[]
  setProjects: (projects: SandboxProject[]) => void
  
  // 路线图状态
  phases: RoadmapPhase[]
  setPhases: (phases: RoadmapPhase[]) => void
}

export interface CognitiveShard {
  id: string
  name: string
  description?: string
  modelBase: string
  status: string
  confidence: number
  shardType: string
  lastTrained?: string
}

export interface Simulation {
  id: string
  shardId: string
  inputIdea: string
  redOutput?: string
  blueOutput?: string
  verdict?: string
  confidence: number
  status: string
  createdAt: string
}

export interface Evidence {
  id: string
  title: string
  description?: string
  evidenceType: string
  contentHash?: string
  storageRef?: string
  chainTxHash?: string
  status: string
  createdAt: string
}

export interface Credential {
  id: string
  issuerDID: string
  subjectDID: string
  credentialType: string
  claimData: string
  hash?: string
  revoked: boolean
  createdAt: string
}

export interface CollabTask {
  id: string
  title: string
  description?: string
  complexity: string
  category: string
  reward: number
  rewardToken: string
  status: string
  priority: number
  assigneeType: string
  ciStatus: string
  safetyScan: string
  createdAt: string
}

export interface Payment {
  id: string
  taskId: string
  amount: number
  token: string
  txHash?: string
  status: string
  createdAt: string
}

export interface SandboxProject {
  id: string
  name: string
  description?: string
  projectType: string
  xdpEnabled: boolean
  status: string
  version: number
  createdAt: string
}

export interface RoadmapPhase {
  id: string
  phase: number
  name: string
  startDate: string
  endDate: string
  status: string
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  title: string
  description?: string
  targetDate: string
  status: string
  order: number
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  cognitiveShards: [],
  setCognitiveShards: (shards) => set({ cognitiveShards: shards }),
  simulations: [],
  addSimulation: (sim) => set((state) => ({ simulations: [sim, ...state.simulations] })),
  
  evidences: [],
  setEvidences: (evidences) => set({ evidences }),
  credentials: [],
  setCredentials: (credentials) => set({ credentials }),
  
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  payments: [],
  setPayments: (payments) => set({ payments }),
  
  projects: [],
  setProjects: (projects) => set({ projects }),
  
  phases: [],
  setPhases: (phases) => set({ phases }),
}))
