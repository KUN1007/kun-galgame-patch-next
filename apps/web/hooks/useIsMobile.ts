'use client'

import { useState, useEffect } from 'react'

export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDeviceType = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkDeviceType()

    window.addEventListener('resize', checkDeviceType)

    return () => {
      window.removeEventListener('resize', checkDeviceType)
    }
  }, [breakpoint])

  return isMobile
}
