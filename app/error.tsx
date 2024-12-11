'use client'

import { useEffect } from 'react'
import { ErrorComponent } from '~/components/error/ErrorComponent'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <ErrorComponent showReset={true} error={error.message} reset={reset} />
}
