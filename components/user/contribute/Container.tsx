'use client'

import { useState, useEffect } from 'react'
import { api } from '~/lib/trpc-client'
import { Pagination } from '@nextui-org/pagination'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { UserContributeCard } from './Card'
import type { UserContribute as UserContributeType } from '~/types/api/user'

interface Props {
  contributes: UserContributeType[]
  uid: number
}

export const UserContribute = ({ contributes, uid }: Props) => {
  const isMounted = useMounted()
  const [patches, setPatches] = useState<UserContributeType[]>(contributes)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPatches = async () => {
    setLoading(true)
    const response = await api.user.getUserContribute.query({
      uid,
      page: 1,
      limit: 20
    })
    setPatches(response.contributes)
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
        <KunLoading hint="正在获取贡献数据..." />
      ) : (
        <>
          {patches.map((contribute) => (
            <UserContributeCard key={contribute.id} contribute={contribute} />
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
