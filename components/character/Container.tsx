'use client'

import { useEffect, useState, useTransition } from 'react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@heroui/pagination'
import { useMounted } from '~/hooks/useMounted'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { CharList } from './CharList'
import { SearchChars } from './SearchChars'
import type { Char } from '~/types/api/char'

export const CharContainer = ({
  initialChars,
  initialTotal
}: {
  initialChars: Char[]
  initialTotal: number
}) => {
  const [chars, setChars] = useState<Char[]>(initialChars)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loading, startTransition] = useTransition()
  const isMounted = useMounted()

  const fetchChars = () => {
    startTransition(async () => {
      const { chars, total } = await kunFetchGet<{
        chars: Char[]
        total: number
      }>('/character/all', { page, limit: 100 })
      setChars(chars)
      setTotal(total)
    })
  }

  useEffect(() => {
    if (!isMounted) return
    fetchChars()
  }, [page])

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    const res = await kunFetchPost<Char[]>('/character/search', {
      query: query.split(' ').filter((term) => term.length > 0)
    })
    setChars(res)
    setSearching(false)
  }

  useEffect(() => {
    if (debouncedQuery) handleSearch()
    else fetchChars()
  }, [debouncedQuery])

  return (
    <div className="flex flex-col w-full my-4 space-y-8">
      <SearchChars
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        searching={searching}
      />
      <CharList chars={chars} loading={loading} searching={searching} />
      {total > 100 && !query && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 100)}
            page={page}
            onChange={setPage}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
