'use client'

import { useState } from 'react'
import { CreateTag } from './CreateTag'

interface PatchTag {
  name: string
  count: number
}

interface Props {
  // tags: PatchTag[]
  patchId: number
}

export const Tag = ({ patchId }: Props) => {
  const [selectedTags, setSelectedTags] = useState<PatchTag[]>([])

  const existingTags: PatchTag[] = []

  const handleTagsChange = (newTags: PatchTag[]) => {
    setSelectedTags(newTags)
  }

  return (
    <div className="mt-4">
      <h3 className="mb-4 text-xl font-medium">游戏标签</h3>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Tags</h2>
        <CreateTag
          patchId={patchId}
          existingTags={existingTags}
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
        />
      </div>
    </div>
  )
}
