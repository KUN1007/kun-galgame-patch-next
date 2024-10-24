'use client'

import { loggerLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import {
  experimental_createActionHook,
  experimental_createTRPCNextAppDirClient,
  experimental_serverActionLink
} from '@trpc/next/app-dir/client'
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp'
import toast from 'react-hot-toast'
import { transformer } from './shared'
import type { AppRouter } from './appRouter'
import type { TRPCLink } from '@trpc/client'
import { getTRPCUrl } from './shared'

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
          transformer,
          url: getTRPCUrl(),
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
      transformer
    })
  ]
})
