import { createSearchParamsCache, parseAsInteger } from 'nuqs/server'

export const pageParsers = {
  page: parseAsInteger.withDefault(1)
}

export const pageSearchParamsCache = createSearchParamsCache(pageParsers)
