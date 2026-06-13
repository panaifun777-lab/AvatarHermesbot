'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Sandbox3DViewportProps {
  projectName?: string
}

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

const EMERALD = '#10b981'
const TEAL = '#14b8a6'
const AMBER = '#f59e0b'
const BG_COLOR = '#0a0f1a'

// ---------------------------------------------------------------------------
// FPS Counter (inside Canvas via useFrame)
// ---------------------------------------------------------------------------

function FPSMonitor({ onFPSUpdate }: { onFPSUpdate: (fps: number) => void }) {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    const elapsed = now - lastTime.current
    if (elapsed >= 1000) {
      onFPSUpdate(Math.round((frameCount.current * 1000) / elapsed))
      frameCount.current = 0
      lastTime.current = now
    }
  })

  return null
}

// ---------------------------------------------------------------------------
// Camera reset helper
// ---------------------------------------------------------------------------

function CameraReset({ triggerReset }: { triggerReset: number }) {
  const { camera } = useThree()

  useEffect(() => {
    if (triggerReset > 0) {
      camera.position.set(5, 4, 7)
      camera.lookAt(0, 0, 0)
    }
  }, [triggerReset, camera])

  return null
}

// ---------------------------------------------------------------------------
// Floating Cube – main object with wireframe overlay and emerald glow
// ---------------------------------------------------------------------------

function FloatingCube() {
  const groupRef = useRef<THREE.Group>(null)
  const wireRef = useRef<THREE.LineSegments>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.15
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.2 + 1.2
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.3
      wireRef.current.rotation.x = Math.sin(t * 0.2) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      {/* Solid cube */}
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial
          color={EMERALD}
          emissive={EMERALD}
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Wireframe overlay */}
      <lineSegments ref={wireRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 1.5, 1.5)]} />
        <lineBasicMaterial color={EMERALD} transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Orbiting Data Sphere – pulsing teal material
// ---------------------------------------------------------------------------

function DataSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      const angle = t * 0.6
      meshRef.current.position.x = Math.cos(angle) * 2.8
      meshRef.current.position.z = Math.sin(angle) * 2.8
      meshRef.current.position.y = Math.sin(t * 1.2) * 0.3 + 1.5
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.2
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color={TEAL}
        emissive={TEAL}
        emissiveIntensity={0.3}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Torus Knot – amber/warm decorative
// ---------------------------------------------------------------------------

function DecorativeTorusKnot() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.5
      meshRef.current.rotation.z = t * 0.3
      meshRef.current.position.y = Math.sin(t * 0.7 + 2) * 0.15 + 1.0
    }
  })

  return (
    <mesh ref={meshRef} position={[-2.5, 1.0, 1.5]}>
      <torusKnotGeometry args={[0.35, 0.12, 64, 16]} />
      <meshStandardMaterial
        color={AMBER}
        emissive={AMBER}
        emissiveIntensity={0.2}
        metalness={0.6}
        roughness={0.25}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Grid Floor – semi-transparent emerald
// ---------------------------------------------------------------------------

function EmeraldGrid() {
  return (
    <Grid
      position={[0, 0, 0]}
      args={[20, 20]}
      cellSize={1}
      cellThickness={0.5}
      cellColor={EMERALD}
      sectionSize={5}
      sectionThickness={1}
      sectionColor={EMERALD}
      fadeDistance={25}
      fadeStrength={1}
      infiniteGrid
    />
  )
}

// ---------------------------------------------------------------------------
// Scene content (all 3D objects)
// ---------------------------------------------------------------------------

function SceneContent({
  isPaused,
  onFPSUpdate,
  resetTrigger,
}: {
  isPaused: boolean
  onFPSUpdate: (fps: number) => void
  resetTrigger: number
}) {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color={EMERALD} />

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={3}
        maxDistance={20}
        autoRotate={!isPaused}
        autoRotateSpeed={0.5}
      />

      {/* FPS monitor */}
      <FPSMonitor onFPSUpdate={onFPSUpdate} />

      {/* Camera reset */}
      <CameraReset triggerReset={resetTrigger} />

      {/* 3D Objects */}
      {!isPaused && <FloatingCube />}
      {isPaused && (
        <group position={[0, 1.2, 0]}>
          <mesh rotation={[0, 0.5, 0.1]}>
            <boxGeometry args={[1.4, 1.4, 1.4]} />
            <meshStandardMaterial
              color={EMERALD}
              emissive={EMERALD}
              emissiveIntensity={0.3}
              metalness={0.4}
              roughness={0.3}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}
      <DataSphere />
      <DecorativeTorusKnot />

      {/* Grid floor */}
      <EmeraldGrid />
    </>
  )
}

// ---------------------------------------------------------------------------
// Inner Canvas wrapper (separated for proper hook usage)
// ---------------------------------------------------------------------------

function ThreeCanvas({
  isPaused,
  onFPSUpdate,
  resetTrigger,
}: {
  isPaused: boolean
  onFPSUpdate: (fps: number) => void
  resetTrigger: number
}) {
  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(BG_COLOR, 1)
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.2

    // Handle WebGL context loss gracefully
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', (e: Event) => {
      e.preventDefault()
      console.warn('WebGL context lost — attempting recovery...')
    })
    canvas.addEventListener('webglcontextrestored', () => {
      console.info('WebGL context restored')
    })
  }, [])

  return (
    <Canvas
      camera={{ position: [5, 4, 7], fov: 50, near: 0.1, far: 100 }}
      onCreated={handleCreated}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ background: BG_COLOR }}
    >
      <SceneContent
        isPaused={isPaused}
        onFPSUpdate={onFPSUpdate}
        resetTrigger={resetTrigger}
      />
    </Canvas>
  )
}

// ---------------------------------------------------------------------------
// Exported Component
// ---------------------------------------------------------------------------

export function Sandbox3DViewport({ projectName }: Sandbox3DViewportProps) {
  const [fps, setFps] = useState(60)
  const [isPaused, setIsPaused] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFPSUpdate = useCallback((newFps: number) => {
    setFps(newFps)
  }, [])

  const handleReset = useCallback(() => {
    setResetTrigger((prev) => prev + 1)
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  // Listen for fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const displayName = useMemo(() => projectName || 'SpaceUI-v2', [projectName])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl border border-emerald-700/30"
      style={{ background: BG_COLOR, minHeight: 420 }}
    >
      {/* ===== Toolbar ===== */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setIsPaused((p) => !p)}
            title={isPaused ? '播放' : '暂停'}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            onClick={handleReset}
            title="重置视角"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            onClick={handleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ===== Top-left overlay: Project name + Interactive Mode ===== */}
      <div className="absolute left-4 top-12 z-20 flex items-center gap-2">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-950/70 px-3 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-sm">
          {displayName}
        </div>
        <Badge className="border-emerald-500/30 bg-emerald-950/70 text-[10px] text-emerald-400 backdrop-blur-sm">
          Interactive Mode
        </Badge>
      </div>

      {/* ===== Top-right overlay: FPS ===== */}
      <div className="absolute right-4 top-12 z-20 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] tabular-nums text-white/50 backdrop-blur-sm">
        FPS: {fps}
      </div>

      {/* ===== Three.js Canvas ===== */}
      <div className="h-full min-h-[420px] w-full">
        <ThreeCanvas
          isPaused={isPaused}
          onFPSUpdate={handleFPSUpdate}
          resetTrigger={resetTrigger}
        />
      </div>

      {/* ===== Bottom-center controls hint ===== */}
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] text-white/40 backdrop-blur-sm">
        拖拽旋转 · 滚轮缩放 · 右键平移
      </div>
    </div>
  )
}
