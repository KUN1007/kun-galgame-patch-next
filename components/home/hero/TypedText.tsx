'use client'

import { useEffect, useRef } from 'react'
import Typed from 'typed.js'
import { kunTypedStrings } from '~/constants/home-typed-js'

export const KunTypedText = () => {
  const kun = useRef(null)

  useEffect(() => {
    const typed = new Typed(kun.current, {
      strings: kunTypedStrings,
      typeSpeed: 50,
      backSpeed: 50,
      backDelay: 1000,
      loop: true
    })

    return () => {
      typed.destroy()
    }
  }, [])

  return <span ref={kun} className="font-bold text-primary" />
}
