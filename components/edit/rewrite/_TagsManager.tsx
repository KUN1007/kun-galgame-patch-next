'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Chip } from '@nextui-org/react'
import { Plus } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { useDebounce } from 'use-debounce'
import { Search } from 'lucide-react'
import { KunLoading } from '~/components/kun/Loading'

interface Props {
  tagsList: string[]
  onAddAlias: (newAlias: string) => void
  onRemoveAlias: (index: number) => void
  errors?: string
}

export const TagsManager = ({
  tagsList,
  onAddAlias,
  onRemoveAlias,
  errors
}: Props) => {
  const [newTags, seNewtTags] = useState<string>('')
  const [tags, setTags] = useState<string[]>(tagsList ?? [])
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchTags = async () => {
    setLoading(true)
    const response = await api.tag.getTag.query({
      page: 1,
      limit: 100
    })
    const tagNames = response.tags.map((t) => t.name)
    setTags(tagNames)
    setLoading(false)
  }

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
    const response = await api.tag.searchTag.mutate({
      query: query.split(' ').filter((term) => term.length > 0)
    })
    const tagNames = response.map((t) => t.name)
    setTags(tagNames)
    setSearching(false)
  }

  const handleAddAlias = () => {
    onAddAlias(newTags.trim())
    seNewtTags('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          labelPlacement="outside"
          label="别名"
          placeholder="输入后点击加号添加"
          value={newTags}
          onChange={(e) => seNewtTags(e.target.value)}
          className="flex-1"
          isInvalid={!!errors}
          errorMessage={errors}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleAddAlias()
            }
          }}
        />
        <Button color="primary" onClick={handleAddAlias} isIconOnly>
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((alias, index) => (
          <Chip
            key={index}
            onClose={() => onRemoveAlias(index)}
            variant="flat"
            className="h-8"
          >
            {alias}
          </Chip>
        ))}
      </div>

      <>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="可以用空格分隔您的搜索关键字"
          endContent={
            <Button isIconOnly variant="light" onClick={handleSearch}>
              <Search />
            </Button>
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        />
        {searching && <KunLoading hint="正在搜索标签数据..." />}
      </>
    </div>
  )
}
