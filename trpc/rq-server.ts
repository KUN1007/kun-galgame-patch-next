import 'server-only'
import { createHydrationHelpers } from '@trpc/react-query/rsc'
import { appRouter } from './appRouter'
import { createCallerFactory } from './trpc'
import { headers } from 'next/headers'
import { cache } from 'react'
import { createQueryClient } from './shared'
import { prisma } from '~/prisma/index'
import type { Context } from './context'

const createContext = cache(async (): Promise<Context> => {
  const _headers = new Headers(await headers())
  _headers.set('x-trpc-source', 'rsc')

  return {
    prisma,
    headers: Object.fromEntries(_headers)
  }
})

const getQueryClient = cache(createQueryClient)
const caller = createCallerFactory(appRouter)(createContext)

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
)
