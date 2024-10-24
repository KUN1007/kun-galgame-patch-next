'use client'

import superjson from 'superjson'
import { loggerLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { experimental_createTRPCNextAppDirClient } from '@trpc/next/app-dir/client'
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp'
import toast from 'react-hot-toast'
import type { AppRouter } from '~/server/routers/_app'
import type { TRPCLink } from '@trpc/client'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return process.env.KUN_PATCH_ADDRESS
}

export const errorHandlerLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      return next(op).subscribe({
        next(value) {
          observer.next(value)
        },
        error(err) {
          toast.error(err.message)
        },
        complete() {
          observer.complete()
        }
      })
    })
  }
}

export const api = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (op) => true
        }),
        errorHandlerLink,
        experimental_nextHttpLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              'x-trpc-source': 'client'
            }
          }
        })
      ]
    }
  }
})
