'use client'

import { useEffect, useState, useTransition } from 'react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@heroui/pagination'
import { useMounted } from '~/hooks/useMounted'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { PersonList } from './PersonList'
import { SearchPersons } from './SearchPersons'
import type { Person } from '~/types/api/person'

export const PersonContainer = ({
  initialPersons,
  initialTotal
}: {
  initialPersons: Person[]
  initialTotal: number
}) => {
  const [persons, setPersons] = useState<Person[]>(initialPersons)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loading, startTransition] = useTransition()
  const isMounted = useMounted()

  const fetchPersons = () => {
    startTransition(async () => {
      const { persons, total } = await kunFetchGet<{
        persons: Person[]
        total: number
      }>('/person/all', { page, limit: 100 })
      setPersons(persons)
      setTotal(total)
    })
  }

  useEffect(() => {
    if (!isMounted) return
    fetchPersons()
  }, [page])

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    const res = await kunFetchPost<Person[]>('/person/search', {
      query: query.split(' ').filter((term) => term.length > 0)
    })
    setPersons(res)
    setSearching(false)
  }

  useEffect(() => {
    if (debouncedQuery) handleSearch()
    else fetchPersons()
  }, [debouncedQuery])

  return (
    <div className="flex flex-col w-full my-4 space-y-8">
      <SearchPersons
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        searching={searching}
      />
      <PersonList persons={persons} loading={loading} searching={searching} />
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
