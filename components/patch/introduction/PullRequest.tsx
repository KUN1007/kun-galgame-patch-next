'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { User } from '@nextui-org/user'
import { Button } from '@nextui-org/button'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { HighlightedText } from '~/components/patch/DiffContent'
import type { PatchPullRequest as PatchPullRequestType } from '~/types/api/patch'

interface Props {
  pr: PatchPullRequestType[]
}

export const PatchPullRequest = ({ pr }: Props) => {
  const [expandedId, setExpandedId] = useState<number>(-1)

  const handleToggleExpand = (id: number) => {
    setExpandedId((prevId) => (prevId === id ? -1 : id))
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">更新请求</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        {pr.length > 0 &&
          pr.map((p) => (
            <div key={p.index} className="space-y-2">
              <div className="flex justify-between">
                <User
                  name={p.user.name}
                  description={`${formatDistanceToNow(p.created)} • 提出了更新请求 - #${p.index}`}
                  avatarProps={{
                    showFallback: true,
                    src: p.user.avatar,
                    name: p.user.name.charAt(0).toUpperCase()
                  }}
                />
                <Button
                  color="primary"
                  onClick={() => handleToggleExpand(p.index)}
                >
                  {expandedId === p.index ? '收起' : '详情'}
                </Button>
              </div>
              {expandedId === p.index && (
                <HighlightedText content={p.content} />
              )}
            </div>
          ))}
      </CardBody>
    </Card>
  )
}
