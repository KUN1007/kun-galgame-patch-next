'use client'

import { useState, useEffect } from 'react'
import { kunFetchGet } from '~/utils/kunFetch'
import { Pagination } from '@nextui-org/pagination'
import { useMounted } from '~/hooks/useMounted'
import { KunNull } from '~/components/kun/Null'
import { KunLoading } from '~/components/kun/Loading'
import { UserContributeCard } from './Card'
import type { UserContribute as UserContributeType } from '~/types/api/user'

interface Props {
  contributes: UserContributeType[]
  total: number
  uid: number
}

export const UserContribute = ({ contributes, total, uid }: Props) => {
  const isMounted = useMounted()
  const [patches, setPatches] = useState<UserContributeType[]>(contributes)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    const { contributes } = await kunFetchGet<{
      contributes: UserContributeType[]
      total: number
    }>('/public/user/profile/contribute', {
      uid,
      page,
      limit: 20
    })
    setPatches(contributes)
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
        <KunLoading hint="正在获取贡献数据..." />
      ) : (
        <>
          {patches.map((contribute) => (
            <UserContributeCard key={contribute.id} contribute={contribute} />
          ))}
        </>
      )}

      {!total && <KunNull message="这个孩子还没有贡献过 Galgame 哦" />}

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
