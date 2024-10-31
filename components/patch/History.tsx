'use client'

import { Card, CardBody, Chip } from '@nextui-org/react'
import { type patch_history } from '@prisma/client'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Activity } from 'lucide-react'

interface PatchHistoryProps {
  history: patch_history[]
}

export function PatchHistory({ history }: PatchHistoryProps) {
  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <Card key={entry.phid}>
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{entry.action}</h4>
                    <p className="text-sm text-muted-foreground">
                      {entry.user?.name} • {formatDistanceToNow(entry.created)}
                    </p>
                  </div>
                </div>
                {entry.content && (
                  <p className="mt-2 text-sm">{entry.content}</p>
                )}
                <div className="mt-2">
                  <Chip color="primary">{entry.type}</Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
