import { Chip } from '@nextui-org/chip'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { HighlightedText } from '~/components/patch/DiffContent'
import { Avatar } from '@nextui-org/avatar'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchHistory({ params }: Props) {
  const { id } = await params

  const res = await serverApi.patch.getPatchHistory.query({
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
          {res.map((history) => (
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
      </CardBody>
    </Card>
  )
}
