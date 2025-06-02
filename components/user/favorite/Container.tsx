'use client'

import { useEffect, useState } from 'react'
import { kunFetchGet } from '~/utils/kunFetch'
import { Pagination } from '@heroui/pagination'
import { useMounted } from '~/hooks/useMounted'
import { KunNull } from '~/components/kun/Null'
import { KunLoading } from '~/components/kun/Loading'
import { UserGalgameCard } from '../galgame/Card'

interface Props {
  favorites: GalgameCard[]
  total: number
  uid: number
}

export const UserFavorite = ({ favorites, total, uid }: Props) => {
  const isMounted = useMounted()
  const [patches, setPatches] = useState<GalgameCard[]>(favorites)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    const { favorites } = await kunFetchGet<{
      favorites: GalgameCard[]
      total: number
    }>('/user/profile/favorite', {
      uid,
      page,
      limit: 20
    })
    setPatches(favorites)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchData()
  }, [page])

  return (
    <div className="space-y-4">
      {loading ? (
        <KunLoading hint="正在获取收藏数据..." />
      ) : (
        <>
          {patches.map((galgame) => (
            <UserGalgameCard key={galgame.id} galgame={galgame} />
          ))}
        </>
      )}

      {!total && <KunNull message="这个孩子还没有收藏过补丁哦" />}

      {total > 20 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 20)}
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
