'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider
} from '@nextui-org/react'
import { ArrowLeft, Tag as TagIcon } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { TagDetail } from '~/types/api/tag'

interface PatchWithRelation {
  id: number
  name: string
  introduction: string
  banner: string
  released: string
  status: number
  view: number
}

export default function Kun() {
  const router = useRouter()
  const { id } = useParams()
  const [tag, setTag] = useState<TagDetail | null>(null)
  // const [relatedPatches, setRelatedPatches] = useState<PatchWithRelation[]>([])

  useEffect(() => {
    fetchTagDetails()
  }, [id])

  const fetchTagDetails = async () => {
    const res = await api.tag.getTagById.query({ tagId: Number(id) })
    useErrorHandler(res, (value) => {
      setTag(value)
    })
    // setRelatedPatches(data.patches)
  }

  if (!tag) {
    return (
      <div className="p-4 mx-auto max-w-7xl">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <Card className="w-full my-8">
      <CardHeader className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.push('/tag')}
          >
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-2">
            <TagIcon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">{tag.name}</h1>
          </div>
        </div>
        <Chip size="lg" variant="flat">
          {tag.count} 个补丁
        </Chip>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        {tag.introduction && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">简介</h2>
            <p className="text-default-500">{tag.introduction}</p>
          </div>
        )}

        {tag.alias.length > 0 && (
          <div>
            <h2 className="mb-2 text-lg font-semibold">别名</h2>
            <div className="flex flex-wrap gap-2">
              {tag.alias.map((alias, index) => (
                <Chip key={index} variant="flat" color="secondary">
                  {alias}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* <div>
            <h2 className="mb-2 text-lg font-semibold">相关补丁</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {relatedPatches.map((patch) => (
                <Card
                  key={patch.id}
                  isPressable
                  onPress={() => router.push(`/patch/${patch.id}`)}
                  className="hover:scale-[1.02] transition-transform"
                >
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{patch.name}</h3>
                        {patch.introduction && (
                          <p className="text-small text-default-500 line-clamp-2">
                            {patch.introduction}
                          </p>
                        )}
                      </div>
                      <Chip size="sm" variant="flat">
                        {patch.view} 浏览
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div> */}
      </CardBody>
    </Card>
  )
}
