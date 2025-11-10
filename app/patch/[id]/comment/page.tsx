import { Comments } from '~/components/patch/comment/Comments'
import {
  kunGetCommentActions,
  kunGetCommentVerifyStatusActions
} from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async (): Promise<Metadata> => {
  return generateNullMetadata('游戏评论')
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const response = await kunGetCommentActions({
    patchId: Number(id),
    page: 1,
    limit: 30
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  const { enableCommentVerify } = await kunGetCommentVerifyStatusActions()

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded" />
        <h2 className="text-2xl font-bold text-gray-900">游戏评论</h2>
      </div>

      <Comments
        initialComments={response.comments}
        total={response.total}
        id={Number(id)}
        enableCommentVerify={enableCommentVerify}
      />
    </div>
  )
}
