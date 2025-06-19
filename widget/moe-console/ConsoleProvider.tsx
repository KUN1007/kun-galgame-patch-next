'use client'

import { useEffect } from 'react'
import { showMoeMessage } from './showMoeMessage'

export const ConsoleProvider = () => {
  useEffect(() => {
    showMoeMessage()
  }, [])

  return null
}
