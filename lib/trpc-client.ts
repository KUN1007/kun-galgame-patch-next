'use client'

import superjson from 'superjson'
import { loggerLink } from '@trpc/client'
import {
  experimental_createActionHook,
  experimental_createTRPCNextAppDirClient,
  experimental_serverActionLink
} from '@trpc/next/app-dir/client'
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp'
import type { AppRouter } from '~/server/routers/_app'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  // if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.KUN_APP_ADDRESS
}

export function getUrl() {
  return getBaseUrl() + '/api/trpc'
}

export const api = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (op) => true
        }),
        experimental_nextHttpLink({
          transformer: superjson,
          url: getUrl(),
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
