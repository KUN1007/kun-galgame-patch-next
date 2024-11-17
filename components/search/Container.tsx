'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import { Pagination } from '@nextui-org/pagination'
import { KunLoading } from '~/components/kun/Loading'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { api } from '~/lib/trpc-client'
import { KunHeader } from '~/components/kun/Header'
import { SearchCard } from './Card'
import { motion } from 'framer-motion'
import { container, item } from './_motion'

export const SearchPage = () => {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page') || '1')

  const router = useRouter()
  const [page, setPage] = useState(currentPage)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery] = useDebounce(query, 500)
  const [patches, setPatches] = useState<GalgameCard[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      setPatches([])
      setTotal(0)
    }
  }, [debouncedQuery])

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setLoading(true)
    const response = await api.search.searchPatch.mutate({
      query: query.split(' ').filter((term) => term.length > 0),
      page,
      limit: 10
    })

    setPatches(response.patches)
    setTotal(response.total)

    const params = new URLSearchParams()
    params.set('q', query)
    params.set('page', page.toString())
    router.push(`/search?${params.toString()}`)

    setLoading(false)
  }

  return (
    <div className="w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <KunHeader name="搜索" description="输入内容以自动搜索" />

      <div className="mb-8">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="可以用空格分隔您的搜索关键字"
          size="lg"
          radius="lg"
          endContent={
            <Button
              isIconOnly
              variant="solid"
              color="primary"
              onClick={() => handleSearch()}
            >
              <Search />
            </Button>
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        />
      </div>

      {loading ? (
        <KunLoading hint="正在搜索中..." />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
            {patches.map((patch) => (
              <motion.div key={patch.id} variants={item}>
                <SearchCard patch={patch} />
              </motion.div>
            ))}
          </div>

          {total > 0 && (
            <div className="flex justify-center">
              <Pagination
                total={Math.ceil(total / 10)}
                page={page}
                onChange={(newPage: number) => {
                  setPage(newPage)
                  handleSearch()
                }}
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
        </motion.div>
      )}
    </div>
  )
}
