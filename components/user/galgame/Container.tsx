'use client'

import { useState, useEffect } from 'react'
import { api } from '~/lib/trpc-client'
import { Pagination } from '@nextui-org/pagination'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { UserGalgameCard } from './Card'

interface Props {
  galgames: GalgameCard[]
  uid: number
}

export const UserGalgame = ({ galgames, uid }: Props) => {
  const isMounted = useMounted()
  const [patches, setPatches] = useState<GalgameCard[]>(galgames)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPatches = async () => {
    setLoading(true)
    const response = await api.user.getUserGalgame.query({
      uid,
      page: 1,
      limit: 20
    })
    setPatches(response.galgames)
    setTotal(response.total)
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
        <KunLoading hint="正在获取 Galgame 数据..." />
      ) : (
        <>
          {patches.map((galgame) => (
            <UserGalgameCard key={galgame.id} galgame={galgame} />
          ))}
        </>
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
