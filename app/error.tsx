'use client'

import { useEffect } from 'react'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import toast from 'react-hot-toast'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    toast.error(error)
  }, [error])

  return <ErrorComponent showReset={true} error={error.message} reset={reset} />
}
