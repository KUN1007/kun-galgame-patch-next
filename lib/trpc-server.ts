import { experimental_nextCacheLink } from '@trpc/next/app-dir/links/nextCache'
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server'
import { appRouter } from '~/server/routers/_app'
import { cookies } from 'next/headers'

export const serverApi = experimental_createTRPCNextAppDirServer<
  typeof appRouter
>({
  config() {
    return {
      links: [
        experimental_nextCacheLink({
          // requests are cached for 5 seconds
          revalidate: 5,
          router: appRouter,
          createContext: async () => {
            return {
              headers: {
                cookie: (await cookies()).toString(),
                'x-trpc-source': 'rsc-invoke'
              }
            }
          }
        })
      ]
    }
  }
})
