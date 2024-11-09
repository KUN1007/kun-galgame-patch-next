'use client'

import { useState, useEffect } from 'react'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { Card, CardBody } from '@nextui-org/card'
import { Link } from '@nextui-org/link'
import { Download, Heart, Lock, Plus } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { PublishResource } from './PublishResource'
import type { PatchResource } from '~/types/api/patch'

export const Resources = ({ id }: { id: number }) => {
  const [resources, setResources] = useState<PatchResource[]>([])
  const [showCreate, setShowCreate] = useState(false)

  const fetchResources = async () => {
    const res = await api.patch.getPatchResources.query({
      patchId: Number(id)
    })
    setResources(res)
  }

  useEffect(() => {
    fetchResources()
  }, [id])

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
          onSuccess={() => {
            setShowCreate(false)
            fetchResources()
          }}
        />
      )}

      {resources.map((resource) => (
        <Card key={resource.id}>
          <CardBody className="p-6">
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
                </div>
                <div className="text-gray-500">Size: {resource.size}</div>
                {resource.note && <p className="mt-2">{resource.note}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="bordered" isIconOnly>
                  <Heart className="w-4 h-4" />
                </Button>
                {resource.password ? (
                  <Button variant="bordered" isIconOnly>
                    <Lock className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="bordered" isIconOnly>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
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
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
