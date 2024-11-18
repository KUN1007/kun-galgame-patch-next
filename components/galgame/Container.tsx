'use client'

import { useState, useEffect } from 'react'
import { Pagination } from '@nextui-org/pagination'
import { api } from '~/lib/trpc-client'
import { GalgameCard } from './Card'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { FilterBar } from './FilterBar'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import type { SortOption, SortDirection } from './_sort'

interface Props {
  patch: GalgameCard[]
}

export const CardContainer = ({ patch }: Props) => {
  const [patches, setPatches] = useState<GalgameCard[]>(patch)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['全部类型'])
  const [sortField, setSortField] = useState<SortOption>('created')
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc')
  const isMounted = useMounted()
  const [page, setPage] = useState(1)

  const fetchPatches = async () => {
    setLoading(true)
    const response = await api.galgame.getGalgame.mutate({
      selectedTypes,
      sortField,
      sortOrder,
      page,
      limit: 24
    })
    setPatches(response.data)
    setTotal(response.total)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchPatches()
  }, [sortField, sortOrder, selectedTypes, page])

  return (
    <div className="container py-8 mx-auto space-y-6">
      <FilterBar
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {loading ? (
        <KunLoading hint="正在获取补丁数据..." />
      ) : (
        <KunMasonryGrid columnWidth={256} gap={24}>
          {patches.map((pa) => (
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
