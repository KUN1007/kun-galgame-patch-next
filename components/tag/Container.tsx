'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@nextui-org/pagination'
import { TagHeader } from './TagHeader'
import { SearchTags } from './SearchTag'
import { TagList } from './TagList'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { useMounted } from '~/hooks/useMounted'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  initialTags: TagType[]
}

export const Container = ({ initialTags }: Props) => {
  const [tags, setTags] = useState<TagType[]>(initialTags)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()

  const fetchTags = async () => {
    setLoading(true)
    const { tags, total } = await kunFetchGet<{
      tags: TagType[]
      total: number
    }>('/public/tag/all', {
      page: 1,
      limit: 100
    })
    setTags(tags)
    setTotal(total)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchTags()
  }, [page])

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      fetchTags()
    }
  }, [debouncedQuery])

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setSearching(true)
    const response = await kunFetchPost<TagType[]>('/public/tag/search', {
      query: query.split(' ').filter((term) => term.length > 0)
    })
    setTags(response)
    setSearching(false)
  }

  return (
    <div className="flex flex-col w-full my-8 space-y-8">
      <TagHeader setNewTag={(newTag) => setTags([newTag, ...initialTags])} />

      <SearchTags
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        searching={searching}
      />

      {!searching && (
        <TagList
          tags={tags}
          loading={loading}
          isMounted={isMounted}
          searching={searching}
        />
      )}

      {total > 24 && !query && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 24)}
            page={page}
            onChange={(newPage: number) => setPage(newPage)}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
