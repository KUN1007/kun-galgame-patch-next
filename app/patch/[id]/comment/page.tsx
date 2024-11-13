// import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { serverApi } from '~/lib/trpc-server'
import { Comments } from '~/components/patch/comment/Comments'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchComment({ params }: Props) {
  const { id } = await params

  const comments = await serverApi.patch.getPatchComments.query({
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
