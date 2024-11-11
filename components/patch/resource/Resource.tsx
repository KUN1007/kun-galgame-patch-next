'use client'

import { useState, useEffect } from 'react'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { Card, CardBody } from '@nextui-org/card'
import { Snippet } from '@nextui-org/snippet'
import { User } from '@nextui-org/user'
import { Link } from '@nextui-org/link'
import { Heart, MoreHorizontal, Plus, Download } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { PublishResource } from './PublishResource'
import type { PatchResource } from '~/types/api/patch'

export const Resources = ({ id }: { id: number }) => {
  const [resources, setResources] = useState<PatchResource[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showLinks, setShowLinks] = useState<Record<number, boolean>>({})

  const fetchResources = async () => {
    const res = await api.patch.getPatchResource.query({
      patchId: Number(id)
    })
    setResources(res)
  }

  useEffect(() => {
    fetchResources()
  }, [id])

  const toggleLinks = (resourceId: number) => {
    setShowLinks((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="flat"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => setShowCreate(!showCreate)}
        >
          添加资源
        </Button>
      </div>

      {showCreate && (
        <PublishResource
          patchId={id}
          onSuccess={(res) => {
            setShowCreate(false)
            fetchResources()
            setResources([...resources, res])
          }}
        />
      )}

      {resources.map((resource) => (
        <Card key={resource.id}>
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {resource.type.map((type) => (
                    <Chip key={type} variant="flat">
                      {type}
                    </Chip>
                  ))}
                  {resource.language.map((lang) => (
                    <Chip key={lang} variant="bordered">
                      {lang}
                    </Chip>
                  ))}
                  {<Chip variant="flat">{resource.size}</Chip>}
                </div>

                {(resource.code || resource.password) && (
                  <div className="flex flex-wrap gap-2">
                    {resource.code && (
                      <Snippet
                        tooltipProps={{
                          content: '点击复制提取码'
                        }}
                        size="sm"
                        symbol="提取码"
                        color="primary"
                      >
                        {resource.code}
                      </Snippet>
                    )}

                    {resource.password && (
                      <Snippet
                        tooltipProps={{
                          content: '点击复制解压码'
                        }}
                        size="sm"
                        symbol="解压码"
                        color="primary"
                      >
                        {resource.password}
                      </Snippet>
                    )}
                  </div>
                )}

                {resource.note && <p className="mt-2">{resource.note}</p>}
              </div>

              <Button variant="light" isIconOnly className="text-default-400">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex justify-between">
              <User
                name={resource.user.name}
                description={`已发布补丁 ${resource.user.patchCount} 个`}
                avatarProps={{
                  showFallback: true,
                  src: resource.user.avatar,
                  name: resource.user.name.charAt(0).toUpperCase()
                }}
              />

              <div className="flex gap-2">
                <Button variant="bordered" isIconOnly>
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  variant="bordered"
                  isIconOnly
                  onPress={() => toggleLinks(resource.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showLinks[resource.id] && (
              <div className="flex flex-wrap gap-2 mt-4">
                {resource.link.map((link, index) => (
                  <Button
                    key={index}
                    as={Link}
                    href={link}
                    showAnchorIcon
                    color="primary"
                    variant="solid"
                  >
                    下载链接 {index + 1}
                  </Button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
