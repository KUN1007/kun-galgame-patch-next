'use client'

import { Chip } from '@nextui-org/chip'
import { Card, CardBody } from '@nextui-org/card'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { HighlightedText } from '~/components/patch/DiffContent'
import { Avatar } from '@nextui-org/avatar'
import type { PatchHistory } from '~/types/api/patch'

interface Props {
  histories: PatchHistory[]
}

export const History = ({ histories }: Props) => {
  return (
    <div className="space-y-4">
      {histories.map((history) => (
        <Card key={history.id}>
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <Avatar
                showFallback
                name={history.user.name.charAt(0).toUpperCase()}
                src={history.user.avatar}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {history.action} {history.type}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {history.user.name} •{' '}
                      {formatDistanceToNow(history.created)}
                    </p>
                  </div>
                </div>

                <ScrollShadow className="max-h-64">
                  <HighlightedText content={history.content} />
                </ScrollShadow>

                <div className="mt-2">
                  <Chip color="primary">{history.type}</Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
