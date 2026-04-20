'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseInfiniteScrollProps<T> {
  fetchMore: () => Promise<T[]>
  hasMore: boolean
  isLoading: boolean
}

export const useInfiniteScroll = <T extends HTMLElement, U>({
  fetchMore,
  hasMore,
  isLoading
}: UseInfiniteScrollProps<U>) => {
  const scrollRef = useRef<T>(null)
  const [scrollHeightBeforeUpdate, setScrollHeightBeforeUpdate] = useState(0)

  const handleScroll = useCallback(() => {
    const scrollContainer = scrollRef.current
    if (
      scrollContainer &&
      scrollContainer.scrollTop === 0 &&
      hasMore &&
      !isLoading
    ) {
      setScrollHeightBeforeUpdate(scrollContainer.scrollHeight)
      fetchMore()
    }
  }, [hasMore, isLoading, fetchMore])

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  return { scrollRef, scrollHeightBeforeUpdate }
}
