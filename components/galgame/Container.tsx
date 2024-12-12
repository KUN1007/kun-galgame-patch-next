'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@nextui-org/pagination'
import { kunFetchGet } from '~/utils/kunFetch'
import { GalgameCard } from './Card'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { FilterBar } from './FilterBar'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { KunHeader } from '../kun/Header'
import type { SortDirection, SortOption } from './_sort'

interface Props {
  initialGalgames: GalgameCard[]
  initialTotal: number
}

export const CardContainer = ({ initialGalgames, initialTotal }: Props) => {
  const [galgames, setGalgames] = useState<GalgameCard[]>(initialGalgames)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortField, setSortField] = useState<SortOption>('created')
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc')
  const isMounted = useMounted()
  const [page, setPage] = useState(1)

  const fetchPatches = async () => {
    setLoading(true)

    const { galgames, total } = await kunFetchGet<{
      galgames: GalgameCard[]
      total: number
    }>('/galgame', {
      selectedType,
      sortField,
      sortOrder,
      page,
      limit: 24
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
  }, [sortField, sortOrder, selectedType, page])

  return (
    <div className="container mx-auto my-4 space-y-6">
      <KunHeader
        name="Galgame"
        description="这里展示了本站所有的 Galgame, 您可以浏览 Galgame 以确认您要下载的补丁"
      />

      <FilterBar
        selectedType={selectedType}
        setSelectedType={(key) => {
          if (key) {
            setSelectedType(key)
          }
        }}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {loading ? (
        <KunLoading hint="正在获取 Galgame 数据..." />
      ) : (
        <KunMasonryGrid columnWidth={256} gap={24}>
          {galgames.map((pa) => (
            <GalgameCard key={pa.id} patch={pa} />
          ))}
        </KunMasonryGrid>
      )}

      {total > 24 && (
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
