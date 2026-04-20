'use client'

import { useEffect, useState } from 'react'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunPagination } from '~/components/kun/KunPagination'
import { useMounted } from '~/hooks/useMounted'
import { KunNull } from '~/components/kun/Null'
import { KunLoading } from '~/components/kun/Loading'
import { UserGalgameCard } from './Card'

interface Props {
  galgames: GalgameCard[]
  total: number
  uid: number
}

export const UserGalgame = ({ galgames, total, uid }: Props) => {
  const isMounted = useMounted()
  const [patches, setPatches] = useState<GalgameCard[]>(galgames)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchPatches = async () => {
    setLoading(true)

    const { galgames } = await kunFetchGet<{
      galgames: GalgameCard[]
      total: number
    }>(`/user/${uid}/patch`, {
      page,
      limit: 20
    })

    setPatches(galgames)
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

      {!total && <KunNull message="这个孩子还没有发布过 Galgame 哦" />}

      {total > 20 && (
        <div className="flex justify-center">
          <KunPagination
            total={Math.ceil(total / 20)}
            page={page}
            onChange={setPage}
            isDisabled={loading}
          />
        </div>
      )}
    </div>
  )
}
