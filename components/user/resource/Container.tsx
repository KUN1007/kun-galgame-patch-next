'use client'

import { useEffect, useState } from 'react'
import { kunFetchGet } from '~/utils/kunFetch'
import { Pagination } from "@heroui/pagination"
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { KunNull } from '~/components/kun/Null'
import { UserResourceCard } from './Card'
import type { UserResource as UserResourceType } from '~/types/api/user'

interface Props {
  resources: UserResourceType[]
  total: number
  uid: number
}

export const UserResource = ({ resources, total, uid }: Props) => {
  const isMounted = useMounted()
  const [patches, setPatches] = useState<UserResourceType[]>(resources)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchPatches = async () => {
    setLoading(true)

    const { resources } = await kunFetchGet<{
      resources: UserResourceType[]
      total: number
    }>('/user/profile/resource', {
      uid,
      page,
      limit: 20
    })

    setPatches(resources)
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
        <KunLoading hint="正在获取补丁资源数据..." />
      ) : (
        <>
          {patches.map((resource) => (
            <UserResourceCard key={resource.id} resource={resource} />
          ))}
        </>
      )}

      {!total && <KunNull message="这个孩子还没有发布过补丁资源哦" />}

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
