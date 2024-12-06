import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Comments } from '~/components/patch/comment/Comments'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const comments = await kunServerFetchGet<PatchComment[]>('/patch/comment', {
    patchId: Number(id)
  })

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">游戏评论</h2>
      </CardHeader>
      <CardBody>
        <Comments initialComments={comments} id={Number(id)} />
      </CardBody>
    </Card>
  )
}
