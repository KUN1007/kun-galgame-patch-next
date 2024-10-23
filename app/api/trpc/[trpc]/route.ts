import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '~/server/context'
import { appRouter } from '~/server/routers/_app'
import type { NextRequest } from 'next/server'

// Add back once NextAuth v5 is released
// export const runtime = 'edge';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error('Error:', error)
    }
  })

export { handler as GET, handler as POST }
