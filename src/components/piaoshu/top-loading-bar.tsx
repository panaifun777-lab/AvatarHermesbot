'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TopLoadingBarProps {
  /** Whether a module transition is in progress */
  isLoading: boolean
}

/**
 * A thin emerald progress bar that appears at the top of the page during module transitions.
 * Mimics NProgress behavior with custom implementation using DOM manipulation
 * to avoid setState-in-effect lint issues.
 */
export function TopLoadingBar({ isLoading }: TopLoadingBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const isLoadingRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateBar = useCallback((progress: number, opacity: number) => {
    if (barRef.current && containerRef.current) {
      barRef.current.style.width = `${progress}%`
      barRef.current.style.opacity = String(opacity)
      if (progress > 0) {
        containerRef.current.style.display = 'block'
      }
    }
  }, [])

  const hideBar = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.display = 'none'
    }
    if (barRef.current) {
      barRef.current.style.width = '0%'
      barRef.current.style.opacity = '1'
    }
  }, [])

  useEffect(() => {
    isLoadingRef.current = isLoading

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (isLoading) {
      // Start loading - use rAF to avoid synchronous setState in effect
      startTimeRef.current = Date.now()
      updateBar(0, 1)

      // Trickle animation
      const trickle = () => {
        if (!isLoadingRef.current) return
        const elapsed = Date.now() - startTimeRef.current
        const target = Math.min(80, 20 + (elapsed / 50) * (1 - elapsed / 10000))

        // Read current progress from DOM
        const currentWidth = barRef.current?.style.width ?? '0%'
        const currentProgress = parseFloat(currentWidth)

        let newProgress: number
        if (currentProgress >= 80) {
          newProgress = currentProgress + 0.1
        } else if (currentProgress < target) {
          newProgress = target
        } else {
          newProgress = currentProgress
        }

        updateBar(newProgress, 1)
        rafRef.current = requestAnimationFrame(trickle)
      }
      rafRef.current = requestAnimationFrame(trickle)
    } else {
      // Loading finished - complete the bar
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      // Check if bar was visible (progress > 0)
      const currentWidth = barRef.current?.style.width ?? '0%'
      const currentProgress = parseFloat(currentWidth)

      if (currentProgress > 0) {
        // Jump to 100% and fade out
        updateBar(100, 0)
        hideTimerRef.current = setTimeout(() => {
          hideBar()
        }, 300)
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [isLoading, updateBar, hideBar])

  return (
    <div ref={containerRef} className="fixed top-0 left-0 right-0 z-[100] h-[2px]" style={{ display: 'none' }}>
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: '0%', opacity: 1 }}
      />
    </div>
  )
}
