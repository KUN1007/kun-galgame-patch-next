'use client'

import { useState } from 'react'
import { Chip } from '@nextui-org/chip'
import { Tooltip } from '@nextui-org/tooltip'
import { Link } from '@nextui-org/link'
import { PatchTagSelector } from './PatchTagSelector'
import type { Tag } from '~/types/api/tag'

interface Props {
  patchId: number
  initialTags: Tag[]
}

export const PatchTag = ({ patchId, initialTags }: Props) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags ?? [])

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-xl font-medium">游戏标签</h3>

      <div className="space-x-2">
        {selectedTags.map((tag) => (
          <Tooltip key={tag.id} content={`${tag.count} 个补丁使用此标签`}>
            <Link href={`/tag/${tag.id}`}>
              <Chip color="secondary" variant="flat">
                {tag.name}
                {`+${tag.count}`}
              </Chip>
            </Link>
          </Tooltip>
        ))}
      </div>

      <PatchTagSelector
        patchId={patchId}
        initialTags={selectedTags}
        onTagChange={setSelectedTags}
      />
    </div>
  )
}
