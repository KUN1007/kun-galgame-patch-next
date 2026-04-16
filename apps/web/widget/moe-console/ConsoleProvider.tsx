'use client'

import { useEffect } from 'react'
import { showMoeMessage } from './showMoeMessage'

export const ConsoleProvider = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      showMoeMessage()
    }
  }, [])

  return null
}
