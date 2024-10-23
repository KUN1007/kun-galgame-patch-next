import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { createContext } from '~/server/context'

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    }
  }
})

export const router = t.router
export const publicProcedure = t.procedure
