import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Comments } from '~/components/patch/comment/Comments'
import { kunFetchGet } from '~/utils/kunFetch'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchComment({ params }: Props) {
  const { id } = await params

  const comments = await kunFetchGet<PatchComment[]>('/patch/comment', {
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
