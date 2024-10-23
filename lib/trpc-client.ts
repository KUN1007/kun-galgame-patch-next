'use client'

import superjson from 'superjson'
import { loggerLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import {
  experimental_createActionHook,
  experimental_createTRPCNextAppDirClient,
  experimental_serverActionLink
} from '@trpc/next/app-dir/client'
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp'
import toast from 'react-hot-toast'
import type { AppRouter } from '~/server/routers/_app'
import type { TRPCLink } from '@trpc/client'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  // if (process.env.KUN_PRODUCTION_ADDRESS) return `https://${process.env.KUN_PRODUCTION_ADDRESS}`
  return process.env.KUN_PATCH_ADDRESS
}

export const errorHandlerLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable(() => {
      return next(op).subscribe({
        error(err) {
          toast.error(err.message)
        }
      })
    })
  }
}

export const api = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      links: [
        errorHandlerLink,
        loggerLink({
          enabled: (op) => true
        }),
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

export const useAction = experimental_createActionHook<AppRouter>({
  links: [
    loggerLink(),
    experimental_serverActionLink({
      transformer: superjson
    })
  ]
})
