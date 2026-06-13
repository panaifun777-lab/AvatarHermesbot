'use client'

import { useEffect, useRef, useState } from 'react'

interface PiaoshuLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  hero: 'h-48 w-48 sm:h-64 sm:w-64',
}

export function PiaoshuLogo({ size = 'md', className = '', showText = false }: PiaoshuLogoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const playVideo = () => {
      video.play().catch(() => {
        // Autoplay blocked, show emoji fallback
        setHasError(true)
      })
    }

    // Try to play immediately
    playVideo()

    // Also try on user interaction
    const handleInteraction = () => {
      if (video.paused) playVideo()
    }
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  if (hasError) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 ${sizeMap[size]} ${className}`}>
        <span className={size === 'hero' ? 'text-6xl' : size === 'sm' ? 'text-xl' : 'text-3xl'} role="img" aria-label="Piaoshu Avatar OS">
          🧬
        </span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg shadow-emerald-500/20 ${sizeMap[size]} ${className}`}>
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 z-10 pointer-events-none rounded-xl" />
      <video
        ref={videoRef}
        src="/avatar-logo.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover rounded-xl"
        aria-label="Piaoshu Avatar OS Logo"
      />
    </div>
  )
}

// Compact version for sidebar (no gradient border, just the video)
export function PiaoshuLogoSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const playVideo = () => {
      video.play().catch(() => setHasError(true))
    }
    playVideo()
    const handleInteraction = () => { if (video.paused) playVideo() }
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  const containerClass = collapsed
    ? 'flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 h-10 w-10'
    : 'flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 h-10 w-10'

  if (hasError) {
    return (
      <div className={containerClass}>
        <span className="text-xl" role="img" aria-label="Piaoshu Avatar Clone">🧬</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${containerClass}`}>
      <video
        ref={videoRef}
        src="/avatar-logo.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover rounded-xl"
        aria-label="Piaoshu Avatar OS Logo"
      />
    </div>
  )
}
