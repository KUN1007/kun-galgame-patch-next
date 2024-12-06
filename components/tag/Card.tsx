'use client'

import { useRouter } from 'next-nprogress-bar'
import { Card, CardBody } from '@nextui-org/card'
import { Chip } from '@nextui-org/chip'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  tag: TagType
}

export const TagCard = ({ tag }: Props) => {
  const router = useRouter()
  return (
    <Card
      isPressable
      onPress={() => router.push(`/tag/${tag.id}`)}
      className="w-full"
    >
      <CardBody className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
            {tag.name}
          </h3>
          <Chip size="sm" variant="flat">
            {tag.count} 个补丁
          </Chip>
        </div>
        {tag.alias.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tag.alias.map((alias, index) => (
              <Chip key={index} size="sm" variant="flat" color="secondary">
                {alias}
              </Chip>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
