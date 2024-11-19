'use client'

import { splitLink, httpBatchLink, isNonJsonSerializable } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { experimental_createTRPCNextAppDirClient } from '@trpc/next/app-dir/client'
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp'
import toast from 'react-hot-toast'
import { getUrl } from './trpc-helpers'
import type { AppRouter } from '~/server/routers/_app'
import type { TRPCLink } from '@trpc/client'

export const errorHandlerLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      return next(op).subscribe({
        next(value) {
          observer.next(value)
        },
        error(err) {
          if (err.data?.code === 'UNAUTHORIZED') {
            window.location.href = '/login'
          }
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
        errorHandlerLink,
        splitLink({
          condition: (op) => isNonJsonSerializable(op.input),
          true: experimental_nextHttpLink({
            url: getUrl(),
            headers() {
              return {
                'x-trpc-source': 'client'
              }
            }
          }),
          false: httpBatchLink({
            url: getUrl(),
            headers() {
              return {
                'x-trpc-source': 'client'
              }
            }
          })
        })
      ]
    }
  }
})
