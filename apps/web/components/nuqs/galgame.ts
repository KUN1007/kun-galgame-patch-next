import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server'

export const sortFieldOptions = [
  'resource_update_time',
  'created',
  'view',
  'download'
] as const
export type SortOption = (typeof sortFieldOptions)[number]

export const sortOrderOptions = ['asc', 'desc'] as const
export type SortDirection = (typeof sortOrderOptions)[number]

export const galgameParsers = {
  page: parseAsInteger.withDefault(1),
  type: parseAsString.withDefault('all'),
  sortField: parseAsStringLiteral(sortFieldOptions).withDefault(
    'resource_update_time'
  ),
  sortOrder: parseAsStringLiteral(sortOrderOptions).withDefault('desc'),
  years: parseAsArrayOf(parseAsString).withDefault(['all']),
  months: parseAsArrayOf(parseAsString).withDefault(['all'])
}

export const galgameSearchParamsCache = createSearchParamsCache(galgameParsers)
