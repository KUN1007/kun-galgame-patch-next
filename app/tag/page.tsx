'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  useDisclosure
} from '@nextui-org/react'
import { Plus, Tag } from 'lucide-react'
import { CreateTagModal } from '~/components/tag/CreateTagModal'
import { api } from '~/lib/trpc-client'
import type { Tag as TagType } from '~/types/api/tag'

export default function Kun() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tags, setTags] = useState<TagType[]>([])

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    const tags = await api.tag.getTag.query()
    setTags(tags)
  }

  return (
    <>
      <Card className="w-full my-8">
        <CardHeader className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6" />
            <h1 className="text-2xl font-bold">标签列表</h1>
          </div>
          <Button
            color="primary"
            onPress={onOpen}
            startContent={<Plus size={20} />}
          >
            创建标签
          </Button>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card
                key={tag.id}
                isPressable
                onPress={() => router.push(`/tag/${tag.id}`)}
                className="hover:scale-[1.02] transition-transform"
              >
                <CardBody className="gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{tag.name}</h3>
                    <Chip size="sm" variant="flat">
                      {tag.count} 个补丁
                    </Chip>
                  </div>
                  {tag.alias.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tag.alias.map((alias, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          variant="flat"
                          color="secondary"
                        >
                          {alias}
                        </Chip>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      <CreateTagModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={(newTag) => {
          setTags([newTag, ...tags])
          onClose()
        }}
      />
    </>
  )
}
