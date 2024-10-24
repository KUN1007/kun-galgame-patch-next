import { Temporal } from '@js-temporal/polyfill'
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import superjson from 'superjson'

export const getTRPCUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/trpc'
  }
  return `${process.env.KUN_PATCH_ADDRESS}/api/trpc`
}

superjson.registerCustom(
  {
    isApplicable: (v): v is Temporal.PlainDate =>
      v instanceof Temporal.PlainDate,
    serialize: (v) => v.toJSON(),
    deserialize: (v) => Temporal.PlainDate.from(v)
  },
  'Temporal.PlainDate'
)

superjson.registerCustom(
  {
    isApplicable: (v): v is Temporal.PlainDateTime =>
      v instanceof Temporal.PlainDateTime,
    serialize: (v) => v.toJSON(),
    deserialize: (v) => Temporal.PlainDateTime.from(v)
  },
  'Temporal.PlainDateTime'
)

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
        serializeData: superjson.serialize
      },
      hydrate: {
        deserializeData: superjson.deserialize
      }
    }
  })

export const transformer = superjson
