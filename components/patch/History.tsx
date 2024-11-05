'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, Chip } from '@nextui-org/react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Activity } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import type { PatchHistory } from '~/types/api/patch'

export const History = ({ id }: { id: number }) => {
  const [histories, setHistories] = useState<PatchHistory[]>([])

  useEffect(() => {
    const fetchPatchHistories = async () => {
      const res = await api.patch.getPatchHistories.query({
        patchId: Number(id)
      })
      setHistories(res)
    }
    fetchPatchHistories()
  }, [])

  return (
    <div className="space-y-4">
      {histories.map((entry) => (
        <Card key={entry.id}>
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
