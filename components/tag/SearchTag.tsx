'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KunNull } from '~/components/kun/Null'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { api } from '~/lib/trpc-client'

export const SearchPage = () => {
  const searchParams = useSearchParams()

  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery] = useDebounce(query, 500)
  const [hasSearched, setHasSearched] = useState(false)
  const [patches, setPatches] = useState<GalgameCard[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      setPatches([])
      setHasSearched(false)
    }
  }, [debouncedQuery])

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setLoading(true)
    const response = await api.tag.searchTag.mutate({
      query: query.split(' ').filter((term) => term.length > 0)
    })

    setHasSearched(true)

    const params = new URLSearchParams()
    params.set('q', query)
    router.push(`/search?${params.toString()}`)

    setLoading(false)
  }

  return (
    <div className="mb-8">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="可以用空格分隔您的搜索关键字"
        size="lg"
        radius="lg"
        endContent={
          <Button isIconOnly variant="light" onClick={() => handleSearch()}>
            <Search />
          </Button>
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch()
        }}
      />

      {hasSearched && patches.length === 0 && (
        <KunNull message="未找到相关内容, 请尝试使用游戏的日文原名搜索" />
      )}
    </div>
  )
}
