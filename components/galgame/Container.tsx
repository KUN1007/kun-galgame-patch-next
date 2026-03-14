'use client'

import { useEffect, useState, useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { kunFetchGet } from '~/utils/kunFetch'
import { GalgameCard } from './Card'
import { FilterBar } from './FilterBar'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { KunHeader } from '../kun/Header'
import { KunPagination } from '~/components/kun/KunPagination'
import { galgameParsers } from './_searchParams'
import type { SortDirection, SortOption } from './_searchParams'

interface Props {
  initialGalgames: GalgameCard[]
  initialTotal: number
}

export const CardContainer = ({ initialGalgames, initialTotal }: Props) => {
  const [galgames, setGalgames] = useState<GalgameCard[]>(initialGalgames)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()
  const [isPending, startTransition] = useTransition()

  const [params, setParams] = useQueryStates(galgameParsers, {
    shallow: false,
    startTransition
  })

  const { page, type, sortField, sortOrder, years, months } = params

  const fetchPatches = async () => {
    setLoading(true)

    const { galgames, total } = await kunFetchGet<{
      galgames: GalgameCard[]
      total: number
    }>('/galgame', {
      selectedType: type,
      sortField,
      sortOrder,
      page,
      limit: 24,
      yearString: JSON.stringify(years),
      monthString: JSON.stringify(months)
    })

    setGalgames(galgames)
    setTotal(total)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchPatches()
  }, [sortField, sortOrder, type, page, years, months])

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage })
    setTimeout(() => {
      window.scrollTo(0, 0)
    })
  }

  const handleTypeChange = (newType: string) => {
    if (newType) {
      setParams({ type: newType, page: 1 })
    }
  }

  const handleSortFieldChange = (newSortField: SortOption) => {
    setParams({ sortField: newSortField, page: 1 })
  }

  const handleSortOrderChange = (newSortOrder: SortDirection) => {
    setParams({ sortOrder: newSortOrder, page: 1 })
  }

  const handleYearsChange = (newYears: string[]) => {
    setParams({ years: newYears, page: 1 })
  }

  const handleMonthsChange = (newMonths: string[]) => {
    setParams({ months: newMonths, page: 1 })
  }

  return (
    <div className="container mx-auto my-4 space-y-6">
      <KunHeader
        name="Galgame"
        description="本页面默认仅显示了 SFW (内容安全) 的补丁, 您可以在网站右上角切换显示全部补丁 (包括 NSFW, 也就是显示可能带有涩涩的补丁)"
      />

      <FilterBar
        selectedType={type}
        setSelectedType={handleTypeChange}
        sortField={sortField}
        setSortField={handleSortFieldChange}
        sortOrder={sortOrder}
        setSortOrder={handleSortOrderChange}
        selectedYears={years}
        setSelectedYears={handleYearsChange}
        selectedMonths={months}
        setSelectedMonths={handleMonthsChange}
      />

      {loading || isPending ? (
        <KunLoading hint="正在获取 Galgame 数据..." />
      ) : (
        <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {galgames.map((pa) => (
            <GalgameCard key={pa.id} patch={pa} />
          ))}
        </div>
      )}

      {total > 24 && (
        <div className="flex justify-center">
          <KunPagination
            page={page}
            total={Math.ceil(total / 24)}
            onChange={handlePageChange}
            isDisabled={loading || isPending}
          />
        </div>
      )}
    </div>
  )
}
