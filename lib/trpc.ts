import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import { createContext } from '~/server/context'
import { verifyKunToken } from '~/server/utils/jwt'
import { parseCookies } from '~/utils/cookies'

const t = initTRPC.context<typeof createContext>().create({
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

export const middleware = t.middleware

const authMiddleware = middleware(async ({ ctx, next }) => {
  const token = parseCookies(ctx.headers?.cookie ?? '')[
    'kun-galgame-patch-moe-token'
  ]
  const payload = await verifyKunToken(token ?? '')

  if (!payload) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户登陆失效' })
  }

  return next({
    ctx: {
      ...ctx,
      uid: payload.uid
    }
  })
})

const getUidMiddleware = middleware(async ({ ctx, next }) => {
  const token = parseCookies(ctx.headers?.cookie ?? '')[
    'kun-galgame-patch-moe-token'
  ]
  const payload = await verifyKunToken(token ?? '')

  return next({
    ctx: {
      ...ctx,
      uid: payload?.uid
    }
  })
})

export const router = t.router
export const publicProcedure = t.procedure.use(getUidMiddleware)
export const privateProcedure = t.procedure.use(authMiddleware)
