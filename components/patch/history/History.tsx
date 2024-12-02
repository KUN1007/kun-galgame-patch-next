'use client'

import { useState, useEffect } from 'react'
import { Pagination } from '@nextui-org/pagination'
import { kunFetchGet } from '~/utils/kunFetch'
import { useMounted } from '~/hooks/useMounted'
import { HistoryCard } from './Card'
import { KunLoading } from '~/components/kun/Loading'
import type { PatchHistory } from '~/types/api/patch'

interface Props {
  patchId: number
  initialHistories: PatchHistory[]
  total: number
}

export const History = ({ patchId, initialHistories, total }: Props) => {
  const [histories, setHistories] = useState<PatchHistory[]>(
    initialHistories ?? []
  )
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()
  const [page, setPage] = useState(1)

  const fetchPatches = async () => {
    setLoading(true)

    const { histories } = await kunFetchGet<{
      histories: PatchHistory[]
      total: number
    }>('/public/patch/history', {
      page,
      limit: 30,
      patchId: patchId
    })

    setHistories(histories)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchPatches()
  }, [page])

  return (
    <div className="space-y-4">
      {loading ? (
        <KunLoading hint="正在获取贡献历史..." />
      ) : (
        <>
          {histories.map((history) => (
            <HistoryCard key={history.id} history={history} />
          ))}
        </>
      )}

      {total > 30 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 30)}
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
