'use client'

import { useSyncExternalStore } from 'react'

/**
 * Hook to determine if the component is mounted (client-side rendered).
 * Uses useSyncExternalStore to avoid the setState-in-effect pattern
 * that triggers react-hooks/set-state-in-effect lint errors.
 *
 * This is the proper replacement for the common pattern:
 *   const [mounted, setMounted] = useState(false)
 *   useEffect(() => { setMounted(true) }, [])
 */
const emptySubscribe = () => () => {}

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // client snapshot: always true after hydration
    () => false  // server snapshot: always false
  )
}
