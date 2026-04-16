'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@bprogress/next'
import { Card, CardBody, Spinner } from '@heroui/react'
import { kunFetchPost } from '~/utils/kunFetch'
import { verifyOAuthCallback } from '~/utils/pkce'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import type { UserState } from '~/store/userStore'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const { setUser } = useUserStore()
  const [error, setError] = useState<string | null>(null)
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) {
      return
    }
    processed.current = true

    const handleCallback = async () => {
      const params = verifyOAuthCallback()
      if (!params) {
        setError('OAuth callback verification failed')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      const res = await kunFetchPost<KunResponse<UserState>>(
        '/auth/oauth/callback',
        {
          code: params.code,
          code_verifier: params.codeVerifier
        }
      )

      if (typeof res === 'string') {
        setError(res)
        toast.error(res)
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      setUser(res)
      toast.success('登录成功!')
      router.push(`/user/${res.uid}/resource`)
    }

    handleCallback()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col items-center gap-4 py-8">
          {error ? (
            <>
              <p className="text-danger text-center">{error}</p>
              <p className="text-sm text-default-400">
                Redirecting to login...
              </p>
            </>
          ) : (
            <>
              <Spinner size="lg" />
              <p className="text-default-500">正在完成登录...</p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
