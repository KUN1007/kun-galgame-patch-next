'use client'

import { useState, useEffect } from 'react'
import { KunNull } from '~/components/kun/Null'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@nextui-org/pagination'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { KunLoading } from '~/components/kun/Loading'
import { TagHeader } from './TagHeader'
import { TagCard } from './Card'
import { api } from '~/lib/trpc-client'
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
    const response = await api.tag.getTag.query({
      page,
      limit: 100
    })
    setTags(response.tags)
    setTotal(response.total)
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
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      setHasSearched(false)
      fetchTags()
    }
  }, [debouncedQuery])

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setSearching(true)
    const response = await api.tag.searchTag.mutate({
      query: query.split(' ').filter((term) => term.length > 0)
    })
    setTags(response)
    setHasSearched(true)
    setSearching(false)
  }

  return (
    <div className="flex flex-col w-full my-8">
      <TagHeader setNewTag={(newTag) => setTags([newTag, ...initialTags])} />

      <div className="mb-8">
        <div className="flex space-x-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="可以用空格分隔您的搜索关键字"
            endContent={
              <Button isIconOnly variant="light" onClick={() => handleSearch()}>
                <Search />
              </Button>
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
          />
        </div>

        {searching && <KunLoading hint="正在搜索标签数据..." />}

        {hasSearched && tags.length === 0 && (
          <KunNull message="未找到相关内容, 请尝试使用游戏的日文原名搜索" />
        )}
      </div>

      {!isMounted || loading ? (
        <KunLoading hint="正在获取标签数据..." />
      ) : (
        <>
          {!searching && (
            <KunMasonryGrid columnWidth={256} gap={16}>
              {tags.map((tag) => (
                <TagCard key={tag.id} tag={tag} />
              ))}
            </KunMasonryGrid>
          )}
        </>
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
