'use client'

import { Button } from "@heroui/react"
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export const KunBackToTop = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!show) {
    return null
  }

  return (
    <Button
      isIconOnly
      color="primary"
      className="fixed z-50 bottom-12 right-3"
      onPress={scrollToTop}
      aria-label="Back to top"
    >
      <ArrowUp className="w-6 h-6" />
    </Button>
  )
}
