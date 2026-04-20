'use client'

import { useState, useCallback, useEffect } from 'react'

export const useContextMenu = () => {
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 })
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleContextMenu = useCallback(
    (event: React.MouseEvent | React.Touch) => {
      if ('preventDefault' in event) {
        event.preventDefault()
      }

      // Use clientX/clientY for the menu regardless of page scroll
      setAnchorPoint({ x: event.clientX, y: event.clientY })
      setIsMenuOpen(true)
    },
    []
  )

  useEffect(() => {
    const handleClick = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false)
      }
    }
    // Close menu
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleClick)
    }
  }, [isMenuOpen])

  return { anchorPoint, isMenuOpen, handleContextMenu, setIsMenuOpen }
}
