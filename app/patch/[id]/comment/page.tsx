import { Card, CardBody, CardHeader } from '@heroui/card'
import { Comments } from '~/components/patch/comment/Comments'
import {
  kunGetCommentActions,
  kunGetCommentVerifyStatusActions
} from './actions'
import { kunGetPatchActions } from '../actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({ patchId: Number(id) })
  const response = await kunGetCommentActions({
    patchId: Number(id),
    page: 1,
    limit: 30
  })
  if (typeof patch === 'string' || typeof response === 'string') {
    return {}
  }

  return generateKunMetadataTemplate(patch, response.comments)
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
