import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import { prisma } from '~/prisma'
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

const adminMiddleware = middleware(async ({ ctx, next }) => {
  const token = parseCookies(ctx.headers?.cookie ?? '')[
    'kun-galgame-patch-moe-token'
  ]
  const payload = await verifyKunToken(token ?? '')

  if (!payload) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户登陆失效' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.uid }
  })
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '未找到该用户' })
  }
  if (user.role < 3) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '用户权限不足, 仅管理员可访问'
    })
  }

  return next({
    ctx: {
      ...ctx,
      uid: payload.uid
    }
  })
})

export const router = t.router
export const publicProcedure = t.procedure.use(getUidMiddleware)
export const privateProcedure = t.procedure.use(authMiddleware)
export const adminProcedure = t.procedure.use(adminMiddleware)
