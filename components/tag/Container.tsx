'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Divider } from '@nextui-org/divider'
import { Pagination } from '@nextui-org/pagination'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { KunLoading } from '~/components/kun/Loading'
import { TagHeader } from './Header'
import { TagCard } from './Card'
import { api } from '~/lib/trpc-client'
import { useMounted } from '~/hooks/useMounted'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  tags: TagType[]
}

export const Container = ({ tags }: Props) => {
  const [kun, setKun] = useState<TagType[]>(tags)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()

  const fetchTags = async () => {
    setLoading(true)
    const response = await api.tag.getTag.query({
      page,
      limit: 100
    })
    setKun(response.tags)
    setTotal(response.total)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchTags()
  }, [page])

  return (
    <div className="flex flex-col w-full my-8">
      <TagHeader setNewTag={(newTag) => setKun([newTag, ...tags])} />

      {!isMounted || loading ? (
        <KunLoading hint="正在获取标签数据..." />
      ) : (
        <KunMasonryGrid columnWidth={256} gap={16}>
          {kun.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
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
