import { Chip } from '@nextui-org/chip'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Activity } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchHistory({ params }: Props) {
  const { id } = await params

  const res = await serverApi.patch.getPatchHistories.query({
    patchId: Number(id)
  })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">贡献历史</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {res.map((entry) => (
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
                          {entry.user?.name} •{' '}
                          {formatDistanceToNow(entry.created)}
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
      </CardBody>
    </Card>
  )
}
