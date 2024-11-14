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
      <CardBody>
        <p>如果是游戏的发布者或者网站管理员更新了游戏, 更新会立即生效</p>
        <p>
          贡献者提交的更新请求, 可以由游戏发布者或者管理员同意后合并到游戏信息中
        </p>

        <div className="mt-4 space-y-4">
          {pr.length > 0 &&
            pr.map((p) => (
              <Card key={p.index}>
                <CardHeader className="flex justify-between">
                  <User
                    name={p.user.name}
                    description={`${formatDistanceToNow(p.created)} • 提出更新 #${p.index}`}
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
                </CardHeader>
                {expandedId === p.index && (
                  <CardBody>
                    <HighlightedText content={p.content} />
                  </CardBody>
                )}
              </Card>
            ))}
        </div>
      </CardBody>
    </Card>
  )
}
