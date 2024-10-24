import { loggerLink } from '@trpc/client'
import { experimental_nextCacheLink } from '@trpc/next/app-dir/links/nextCache'
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server'
import { appRouter } from './appRouter'
import { cookies } from 'next/headers'
import { transformer } from './shared'
import { prisma } from '~/prisma/index'

export const api = experimental_createTRPCNextAppDirServer<typeof appRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (op) => true
        }),
        experimental_nextCacheLink({
          revalidate: 5,
          router: appRouter,
          transformer,
          createContext: async () => {
            return {
              prisma,
              headers: {
                cookie: cookies().toString(),
                'x-trpc-source': 'rsc-invoke'
              }
            }
          }
        })
      ]
    }
  }
})
