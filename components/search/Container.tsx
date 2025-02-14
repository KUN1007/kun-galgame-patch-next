'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@nextui-org/input'
import { Pagination } from '@nextui-org/pagination'
import { KunLoading } from '~/components/kun/Loading'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { kunFetchPost } from '~/utils/kunFetch'
import { KunHeader } from '~/components/kun/Header'
import { KunNull } from '~/components/kun/Null'
import { GalgameCard } from '~/components/galgame/Card'

export const SearchPage = () => {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page') || '1')

  const router = useRouter()
  const [page, setPage] = useState(currentPage)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery] = useDebounce(query, 500)
  const [hasSearched, setHasSearched] = useState(false)
  const [patches, setPatches] = useState<GalgameCard[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (debouncedQuery) {
      setPage(1)
      handleSearch(1)
    } else {
      setPatches([])
      setTotal(0)
      setHasSearched(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    }
  }, [page])

  const handleSearch = async (currentPage = page) => {
    if (!query.trim()) {
      return
    }

    setLoading(true)
    const { galgames, total } = await kunFetchPost<{
      galgames: GalgameCard[]
      total: number
    }>('/search', {
      query: query.split(' ').filter((term) => term.length > 0),
      page: currentPage,
      limit: 24
    })

    setPatches(galgames)
    setTotal(total)
    setHasSearched(true)

    const params = new URLSearchParams()
    params.set('q', query)
    params.set('page', currentPage.toString())
    router.push(`/search?${params.toString()}`)

    setLoading(false)
  }

  return (
    <div className="w-full my-4">
      <KunHeader name="搜索 Galgame" description="输入内容以自动搜索 Galgame" />

      <div className="mb-8">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="可以用空格分隔您的搜索关键字"
          size="lg"
          radius="lg"
          startContent={<Search className="text-default-400" />}
        />
      </div>

      {loading ? (
        <KunLoading hint="正在搜索中..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {patches.map((patch) => (
              <GalgameCard key={patch.id} patch={patch} />
            ))}
          </div>

          {total > 24 && (
            <div className="flex justify-center">
              <Pagination
                total={Math.ceil(total / 24)}
                page={page}
                onChange={setPage}
                showControls
                size="lg"
                radius="lg"
                classNames={{
                  wrapper: 'gap-2',
                  item: 'w-10 h-10'
                }}
              />
            </div>
          )}

          {hasSearched && patches.length === 0 && (
            <KunNull message="未找到相关内容, 请尝试使用游戏的日文原名搜索" />
          )}
        </>
      )}
    </div>
  )
}
