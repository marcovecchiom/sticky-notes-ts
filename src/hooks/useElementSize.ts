import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Dimensions } from '../types/note'

/** `null` until the first measurement, which happens before the first paint. */
export function useElementSize(ref: RefObject<HTMLElement | null>): Dimensions | null {
  const [size, setSize] = useState<Dimensions | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setSize({ width: element.clientWidth, height: element.clientHeight })
    const observer = new ResizeObserver(() => {
      setSize({ width: element.clientWidth, height: element.clientHeight })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
