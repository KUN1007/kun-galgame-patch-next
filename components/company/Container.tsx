'use client'

import { useState, useEffect, FC } from 'react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@nextui-org/pagination'
import { CompanyHeader } from './CompanyHeader'
import { SearchCompanies } from './SearchCompanies'
import { CompanyList } from './CompanyList'
import { useMounted } from '~/hooks/useMounted'
import type { Company as CompanyType } from '~/types/api/company'

interface Props {
  initialCompanies: CompanyType[]
  initialTotal: number
}

export const Container: FC<Props> = ({ initialCompanies, initialTotal }) => {
  const [companies, setCompanies] = useState<CompanyType[]>(initialCompanies)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()

  const fetchCompanies = async () => {
    setLoading(true)
    // 模拟延时请求
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setCompanies([])
    setTotal(0)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchCompanies()
  }, [page])

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setSearching(true)
    // 模拟延时请求
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setCompanies([])
    setSearching(false)
  }

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      fetchCompanies()
    }
  }, [debouncedQuery])

  return (
    <div className="flex flex-col w-full my-4 space-y-8">
      <CompanyHeader
        setNewCompany={(company) => setCompanies([company, ...companies])}
      />

      <SearchCompanies
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        searching={searching}
      />

      {!searching && (
        <CompanyList
          companies={companies}
          loading={loading}
          searching={searching}
        />
      )}

      {total > 100 && !query && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 100)}
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