'use client'

import { useEffect, useState, useTransition } from 'react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@heroui/pagination'
import { useMounted } from '~/hooks/useMounted'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { PersonList } from './PersonList'
import { SearchPersons } from './SearchPersons'
import type { PatchPerson } from '~/types/api/person'
import { KunHeader } from '../kun/Header'

export const PersonContainer = ({
  initialPersons,
  initialTotal
}: {
  initialPersons: PatchPerson[]
  initialTotal: number
}) => {
  const [persons, setPersons] = useState<PatchPerson[]>(initialPersons)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loading, startTransition] = useTransition()
  const isMounted = useMounted()

  const fetchPersons = () => {
    startTransition(async () => {
      const { persons, total } = await kunFetchGet<{
        persons: PatchPerson[]
        total: number
      }>('/person/all', { page, limit: 72 })
      setPersons(persons)
      setTotal(total)
    })
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchPersons()
  }, [page])

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setSearching(true)
    const res = await kunFetchPost<PatchPerson[]>('/person/search', {
      query: query.split(' ').filter((term) => term.length > 0)
    })
    setPersons(res)
    setSearching(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }

    if (debouncedQuery) {
      handleSearch()
    } else {
      fetchPersons()
    }
  }, [debouncedQuery])

  return (
    <div className="flex flex-col w-full my-4 space-y-8">
      <KunHeader
        name="Galgame 制作人列表"
        description="这里是 Galgame 游戏中出现的所有 Galgame 角色的列表, 本页面只是随手写一下, 仍在开发中..."
      />

      <SearchPersons query={query} setQuery={setQuery} searching={searching} />

      {!searching && (
        <PersonList persons={persons} loading={loading} searching={searching} />
      )}

      {total > 72 && !query && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 72)}
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
