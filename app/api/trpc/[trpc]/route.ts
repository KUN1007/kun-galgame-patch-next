import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '~/server/context'
import { appRouter } from '~/server/routers/_app'
import toast from 'react-hot-toast'

// Add back once NextAuth v5 is released
// export const runtime = 'edge';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error('Error:', error)
      toast.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`)
    }
  })

export { handler as GET, handler as POST }
